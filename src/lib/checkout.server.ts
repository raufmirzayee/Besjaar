import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { createPayment, isPaymentProviderConfigured } from "./payments.server";

/**
 * Bump when the terms or the withdrawal notice change, so each order records
 * which version the customer actually agreed to.
 */
export const TERMS_VERSION = "2026-09-10";

export type ShippingMethod = {
  id: string;
  name: string;
  description: string | null;
  carrier: string;
  price: number;
  free_above: number | null;
  delivery_time: string | null;
};

export type CheckoutAddress = {
  first_name: string;
  last_name: string;
  company_name?: string | null;
  street: string;
  house_number: string;
  house_number_addition?: string | null;
  postal_code: string;
  city: string;
  country: string;
  phone?: string | null;
};

export type CheckoutInput = {
  email: string;
  phone?: string | null;
  shipping: CheckoutAddress;
  billing?: CheckoutAddress | null;
  shippingMethodId: string;
  customerNote?: string | null;
  paymentMethod: string;
  idempotencyKey: string;
  /**
   * The customer ticked the terms and withdrawal-notice box at checkout.
   * Required: an order is a contract, and the acceptance recorded against it
   * must reflect something the customer actually did.
   */
  acceptedTerms: boolean;
  /** @deprecated ignored by the server; ownership is derived from the verified session. */
  userId?: string | null;
  lines: { productId: string; quantity: number }[];
};

export type OrderItemRow = {
  product_name: string;
  product_slug: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type OrderSummary = {
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  email: string;
  first_name: string;
  last_name: string;
  shipping_address: Record<string, string | null>;
  shipping_method_name: string | null;
  /** Set once the order actually ships, so the customer can follow the parcel. */
  carrier: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  subtotal: number;
  shipping_cost: number;
  vat_amount: number;
  total: number;
  created_at: string;
  items: OrderItemRow[];
};

function publicClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export async function fetchShippingMethods(): Promise<ShippingMethod[]> {
  const { data, error } = await publicClient()
    .from("shipping_methods")
    .select("id, name, description, carrier, price, free_above, delivery_time")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((m) => ({
    id: String(m.id),
    name: String(m.name),
    description: (m.description as string) ?? null,
    carrier: String(m.carrier),
    price: Number(m.price),
    free_above: m.free_above === null ? null : Number(m.free_above),
    delivery_time: (m.delivery_time as string) ?? null,
  }));
}

export async function createOrder(
  input: CheckoutInput,
  verifiedUserId: string | null = null,
): Promise<{ order_number: string; checkoutUrl: string | null; paymentConfigured: boolean }> {
  if (input.lines.length === 0) throw new Error("Je winkelwagen is leeg.");
  if (input.acceptedTerms !== true) {
    // Recording an acceptance the customer never gave would make the audit
    // trail worthless, so refuse the order instead of assuming consent.
    throw new Error("Je moet de algemene voorwaarden accepteren om te kunnen bestellen.");
  }
  // Before anything is created or reserved: may this deployment take an order
  // at all? Checkout used to proceed with no payment provider configured,
  // creating a real order that held real stock nobody could pay for. A shop
  // deployed before its payment account was ready would sell out of
  // everything and never take a euro.
  const { checkoutGate } = await import("./checkout-mode");
  const gate = checkoutGate({
    mode: process.env.CHECKOUT_MODE,
    mollieApiKey: process.env.MOLLIE_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
  if (!gate.allowed) {
    // The operator detail names the variable to fix and never reaches the
    // browser; the customer gets a plain "not right now".
    console.error(`[checkout] refused: ${gate.operatorMessage}`);
    throw new Error(gate.reason);
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Staff and customers are separate pools; the database refuses an order that
  // belongs to a staff account outright. Catching it here turns a raw
  // constraint error into something the person can act on.
  if (verifiedUserId) {
    const { isStaffAccount } = await import("./staff.server");
    if (await isStaffAccount(supabaseAdmin, verifiedUserId)) {
      throw new Error(
        "Dit is een medewerkersaccount en kan niet bestellen. Log uit en bestel als klant.",
      );
    }
  }

  const existing = await supabaseAdmin
    .from("orders")
    .select("order_number")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existing.data) {
    return {
      order_number: (existing.data as { order_number: string }).order_number,
      checkoutUrl: null,
      paymentConfigured: isPaymentProviderConfigured(),
    };
  }

  const productIds = input.lines.map((l) => l.productId);
  const { data: products, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, name, slug, regular_price, sale_price, vat_rate, internal_sku, status")
    .in("id", productIds);
  if (productError) throw new Error(productError.message);

  const { data: images } = await supabaseAdmin
    .from("product_images")
    .select("product_id, image_url, is_main, sort_order")
    .in("product_id", productIds);

  // The shop declares which countries it ships to. That was a display list
  // only: nothing checked it server-side, so an order could name any country
  // and the warehouse would find out at the packing bench.
  const { storeConfig } = await import("./store-config");
  const destination = input.shipping.country.trim().toUpperCase();
  if (!(storeConfig.shippingCountries as readonly string[]).includes(destination)) {
    throw new Error(
      `We bezorgen op dit moment niet in ${destination}. We versturen naar ${storeConfig.shippingCountries.join(", ")}.`,
    );
  }

  const { data: method, error: methodError } = await supabaseAdmin
    .from("shipping_methods")
    .select("id, name, price, free_above")
    .eq("id", input.shippingMethodId)
    .eq("is_active", true)
    .maybeSingle();
  if (methodError) throw new Error(methodError.message);
  if (!method) throw new Error("Ongeldige verzendmethode.");

  const items = input.lines.map((line) => {
    const product = (products ?? []).find((p) => (p as { id: string }).id === line.productId) as
      Record<string, unknown> | undefined;
    if (!product || product.status !== "active") {
      throw new Error("Een product in je winkelwagen is niet meer beschikbaar.");
    }
    const regular = Number(product.regular_price);
    const sale = product.sale_price === null ? null : Number(product.sale_price);
    const unitPrice = sale !== null && sale < regular ? sale : regular;
    const quantity = Math.max(1, Math.min(99, Math.round(line.quantity)));
    const image = ((images ?? []) as Record<string, unknown>[])
      .filter((i) => i.product_id === line.productId)
      .sort(
        (a, b) =>
          Number(b.is_main) - Number(a.is_main) || Number(a.sort_order) - Number(b.sort_order),
      )[0];
    return {
      product_id: line.productId,
      product_name: String(product.name),
      product_slug: String(product.slug),
      sku: (product.internal_sku as string) ?? null,
      image_url: (image?.image_url as string) ?? null,
      unit_price: unitPrice,
      vat_rate: Number(product.vat_rate ?? 21),
      quantity,
      line_total: Number((unitPrice * quantity).toFixed(2)),
    };
  });

  const subtotal = Number(items.reduce((sum, i) => sum + i.line_total, 0).toFixed(2));
  const methodRow = method as Record<string, unknown>;
  const freeAbove = methodRow.free_above === null ? null : Number(methodRow.free_above);
  const shippingCost = freeAbove !== null && subtotal >= freeAbove ? 0 : Number(methodRow.price);
  const total = Number((subtotal + shippingCost).toFixed(2));
  // VAT is derived per line from each product's own rate rather than assuming
  // 21% across the order, so a reduced-rate product is accounted for correctly.
  const itemVat = items.reduce((sum, item) => {
    const rate = item.vat_rate / 100;
    return sum + (item.line_total - item.line_total / (1 + rate));
  }, 0);
  const shippingVat = shippingCost - shippingCost / 1.21;
  const vatAmount = Number((itemVat + shippingVat).toFixed(2));

  /**
   * Order, lines and stock reservation, in one transaction.
   *
   * The database function raises if any line exceeds available stock, and
   * because the insert and the reservation share a transaction, a refused
   * order leaves nothing behind — no half-order, no orphan lines, no stock
   * taken for goods that were never sold.
   */
  const { data: created, error: createError } = await supabaseAdmin.rpc("create_order_with_items", {
    p_order: {
      user_id: verifiedUserId,
      email: input.email,
      first_name: input.shipping.first_name,
      last_name: input.shipping.last_name,
      phone: input.phone ?? input.shipping.phone ?? null,
      company_name: input.shipping.company_name ?? null,
      shipping_address: JSON.parse(JSON.stringify(input.shipping)),
      billing_address: JSON.parse(JSON.stringify(input.billing ?? input.shipping)),
      shipping_method_id: String(methodRow.id),
      shipping_method_name: String(methodRow.name),
      subtotal,
      shipping_cost: shippingCost,
      vat_amount: vatAmount,
      total,
      customer_note: input.customerNote ?? null,
      payment_method: input.paymentMethod,
      idempotency_key: input.idempotencyKey,
      terms_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
      payment_status: "open",
      status: "pending",
    },
    p_items: items,
  });

  if (createError) {
    const message = String(createError.message ?? "");
    // Turn the database's constraint message into something a shopper can act
    // on, rather than leaking SQL at them.
    if (/Onvoldoende voorraad/i.test(message)) {
      throw new Error(message.replace(/^.*?(Onvoldoende voorraad)/i, "$1"));
    }
    throw new Error(message);
  }

  const orderRow = (Array.isArray(created) ? created[0] : created) as {
    order_id: string;
    order_number: string;
    access_token: string;
  };
  if (!orderRow?.order_id) throw new Error("Bestelling kon niet worden aangemaakt.");

  /**
   * Payment comes second, now that a real order number exists.
   *
   * It used to be created first, with the literal string "pending" as the
   * order reference and a redirect to /bestelling/pending — so Mollie's record
   * named an order that did not exist, and the customer was returned to a page
   * that could not show them anything. It also meant a payment could be taken
   * for an order that then failed to save.
   *
   * Without a provider key this stays inert: the order is stored as awaiting
   * payment and no reference is invented.
   */
  const origin = (process.env.VITE_SITE_URL ?? "").replace(/\/$/, "");
  let payment;
  try {
    payment = await createPayment({
      orderId: orderRow.order_id,
      orderNumber: orderRow.order_number,
      amount: total,
      method: input.paymentMethod,
      description: `Besjaar bestelling ${orderRow.order_number}`,
      redirectUrl: `${origin}/bestelling/${encodeURIComponent(orderRow.order_number)}?token=${orderRow.access_token}`,
    });
  } catch (paymentError) {
    // The order exists and holds stock, but nobody can pay for it. Give the
    // stock back rather than leaving it reserved for an order that is dead.
    await supabaseAdmin.rpc("abandon_order", {
      p_order_id: orderRow.order_id,
      p_note: "Betaling kon niet worden aangemaakt bij de provider",
    });
    throw paymentError;
  }

  if (payment.paymentReference || payment.paymentStatus !== "open") {
    const { error: refError } = await supabaseAdmin.rpc("attach_payment_reference", {
      p_order_id: orderRow.order_id,
      p_reference: payment.paymentReference,
      p_payment_status: payment.paymentStatus,
      p_status: payment.status,
    });
    if (refError) {
      // Mollie has created the payment; the shop failed to write its reference
      // onto the order. Nothing is lost — the payment carries the order id in
      // its metadata and the webhook recovers from that — but this is worth
      // shouting about, because until the webhook lands the order looks
      // unpaid and unreachable by reference.
      console.error(
        `[checkout] payment reference NOT stored for ${orderRow.order_number} (payment ${payment.paymentReference}): ${refError.message}. The webhook will recover it through payment metadata.`,
      );
    }
  }

  // Confirmation of the contract on a durable medium is required under EU
  // consumer law, so it is sent as soon as the order exists — not only once
  // payment clears. A failed send never fails the order.
  try {
    const { orderEmailData, sendTransactionalEmail } = await import("./email.server");
    const data = await orderEmailData(supabaseAdmin, orderRow.order_id);
    if (data) {
      const result = await sendTransactionalEmail({
        template: "order_confirmation",
        data,
        orderId: orderRow.order_id,
      });
      if (result.sent) {
        await supabaseAdmin
          .from("orders")
          .update({ confirmation_sent_at: new Date().toISOString() })
          .eq("id", orderRow.order_id);
      }
    }
  } catch (error) {
    console.error("[checkout] order confirmation could not be sent:", error);
  }

  return {
    order_number: orderRow.order_number,
    checkoutUrl: payment.checkoutUrl,
    paymentConfigured: payment.configured,
  };
}

/**
 * Compares two secrets without leaking how far they matched.
 *
 * `a === b` on strings returns at the first differing byte, so the time it
 * takes is a measurement of how much of the secret the caller got right. Over
 * enough requests that recovers the value a character at a time. This always
 * walks the full length.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  // The lengths themselves are not secret; comparing anyway keeps the shape
  // of the function uniform.
  let diff = left.length ^ right.length;
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Looks up one order for the customer who placed it.
 *
 * Two ways in, because there are two situations:
 *
 *   * the access token from the confirmation link, which is unguessable and is
 *     how a guest returning from the payment provider gets in without typing
 *     anything;
 *   * the e-mail address on the order, for someone who has the number and
 *     comes back later.
 *
 * Both are compared in constant time, and every failure returns the same null:
 * distinguishing "no such order" from "wrong e-mail" would confirm which order
 * numbers exist, and the numbers are sequential.
 *
 * Rate limiting sits at the server function, which is where the caller's
 * address is knowable.
 */
export async function fetchOrderByNumber(
  orderNumber: string,
  credentials: { email?: string | null; token?: string | null },
): Promise<OrderSummary | null> {
  const email = credentials.email?.trim().toLowerCase() ?? "";
  const token = credentials.token?.trim() ?? "";
  if (!email && !token) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      `order_number, status, payment_status, payment_method, email, access_token,
       first_name, last_name,
       shipping_address, shipping_method_name, carrier, tracking_code, tracking_url,
       shipped_at, delivered_at, subtotal, shipping_cost, vat_amount, total, created_at,
       order_items ( product_name, product_slug, image_url, unit_price, quantity, line_total )`,
    )
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as Record<string, unknown>;

  const storedToken = typeof row.access_token === "string" ? row.access_token : "";
  const tokenMatches =
    token.length > 0 && storedToken.length > 0 && constantTimeEqual(token, storedToken);
  const emailMatches =
    email.length > 0 && constantTimeEqual(email, String(row.email ?? "").toLowerCase());
  if (!tokenMatches && !emailMatches) return null;

  return {
    order_number: String(row.order_number),
    status: String(row.status),
    payment_status: String(row.payment_status),
    payment_method: (row.payment_method as string) ?? null,
    email: String(row.email),
    first_name: String(row.first_name),
    last_name: String(row.last_name),
    shipping_address: (row.shipping_address as Record<string, string | null>) ?? {},
    shipping_method_name: (row.shipping_method_name as string) ?? null,
    carrier: (row.carrier as string) ?? null,
    tracking_code: (row.tracking_code as string) ?? null,
    tracking_url: (row.tracking_url as string) ?? null,
    shipped_at: (row.shipped_at as string) ?? null,
    delivered_at: (row.delivered_at as string) ?? null,
    subtotal: Number(row.subtotal),
    shipping_cost: Number(row.shipping_cost),
    vat_amount: Number(row.vat_amount),
    total: Number(row.total),
    created_at: String(row.created_at),
    items: ((row.order_items ?? []) as Record<string, unknown>[]).map((i) => ({
      product_name: String(i.product_name),
      product_slug: (i.product_slug as string) ?? null,
      image_url: (i.image_url as string) ?? null,
      unit_price: Number(i.unit_price),
      quantity: Number(i.quantity),
      line_total: Number(i.line_total),
    })),
  };
}
