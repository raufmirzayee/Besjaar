import type { SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

const BOL_TOKEN_URL = "https://login.bol.com/token?grant_type=client_credentials";
const BOL_API_URL = "https://api.bol.com/retailer";
const BOL_JSON = "application/vnd.retailer.v10+json";

export type BolConnectionStatus = {
  configured: boolean;
  connected: boolean;
  message: string;
  lastSyncAt: string | null;
};

export type ChannelListing = {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  ean: string | null;
  external_offer_id: string | null;
  channel_price: number | null;
  price_sync_enabled: boolean;
  stock_sync_enabled: boolean;
  is_active: boolean;
  last_synced_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  product_name: string | null;
  product_ean: string | null;
  stock_quantity: number | null;
  regular_price: number | null;
  sale_price: number | null;
};

export type SyncJob = {
  id: string;
  job_type: string;
  status: string;
  processed_count: number;
  failed_count: number;
  attempt: number;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type SyncLog = {
  id: string;
  job_id: string | null;
  level: string;
  message: string;
  details: Record<string, string | number | boolean | null>;
  created_at: string;
};

// The labels live in `bol.ts` so a route file never has to import this module
// to get at them. Re-exported here for callers that are already server-side.
export { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "./bol";

function credentials() {
  const clientId = process.env.BOL_CLIENT_ID;
  const clientSecret = process.env.BOL_CLIENT_SECRET;
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, configured } = credentials();
  if (!configured) throw new Error("bol.com-inloggegevens ontbreken");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(BOL_TOKEN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`bol.com-token mislukt [${res.status}]: ${body}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function bolRequest<T>(
  path: string,
  init: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const token = init.token ?? (await getAccessToken());
  const res = await fetch(`${BOL_API_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: BOL_JSON,
      ...(init.body ? { "Content-Type": BOL_JSON } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`bol.com-verzoek mislukt [${res.status}] ${path}: ${body}`);
  }
  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
}

export async function fetchConnectionStatus(supabase: Client): Promise<BolConnectionStatus> {
  const { configured } = credentials();
  const { data } = await supabase
    .from("sync_jobs")
    .select("finished_at")
    .eq("status", "success")
    .order("finished_at", { ascending: false })
    .limit(1);
  const lastSyncAt = (data as any[])?.[0]?.finished_at ?? null;

  if (!configured) {
    return {
      configured: false,
      connected: false,
      message:
        "Geen bol.com-inloggegevens ingesteld. Voeg de client ID en client secret van je Retailer API-app toe om de koppeling te activeren.",
      lastSyncAt,
    };
  }

  try {
    await getAccessToken();
    return {
      configured: true,
      connected: true,
      message: "Verbonden met de bol.com Retailer API.",
      lastSyncAt,
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      message: (error as Error).message,
      lastSyncAt,
    };
  }
}

export async function fetchChannelListings(supabase: Client): Promise<ChannelListing[]> {
  const { data, error } = await supabase
    .from("channel_listings")
    .select(
      `id, product_id, variant_id, ean, external_offer_id, channel_price, price_sync_enabled,
       stock_sync_enabled, is_active, last_synced_at, last_sync_status, last_sync_error,
       products ( name, ean, stock_quantity, regular_price, sale_price )`,
    )
    .eq("channel", "bol")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    product_id: row.product_id,
    variant_id: row.variant_id,
    ean: row.ean,
    external_offer_id: row.external_offer_id,
    channel_price: row.channel_price === null ? null : Number(row.channel_price),
    price_sync_enabled: !!row.price_sync_enabled,
    stock_sync_enabled: !!row.stock_sync_enabled,
    is_active: !!row.is_active,
    last_synced_at: row.last_synced_at,
    last_sync_status: row.last_sync_status,
    last_sync_error: row.last_sync_error,
    product_name: row.products?.name ?? null,
    product_ean: row.products?.ean ?? null,
    stock_quantity: row.products?.stock_quantity ?? null,
    regular_price:
      row.products?.regular_price === undefined ? null : Number(row.products.regular_price),
    sale_price:
      row.products?.sale_price === undefined || row.products?.sale_price === null
        ? null
        : Number(row.products.sale_price),
  }));
}

export async function fetchSyncJobs(supabase: Client, limit = 20): Promise<SyncJob[]> {
  const { data, error } = await supabase
    .from("sync_jobs")
    .select(
      "id, job_type, status, processed_count, failed_count, attempt, error_message, started_at, finished_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as SyncJob[];
}

export async function fetchSyncLogs(supabase: Client, limit = 50): Promise<SyncLog[]> {
  const { data, error } = await supabase
    .from("sync_logs")
    .select("id, job_id, level, message, details, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as SyncLog[];
}

export async function upsertListing(
  supabase: Client,
  input: {
    id?: string;
    product_id?: string | null;
    ean?: string | null;
    external_offer_id?: string | null;
    channel_price?: number | null;
    price_sync_enabled?: boolean;
    stock_sync_enabled?: boolean;
    is_active?: boolean;
  },
) {
  const payload = { ...input, channel: "bol" };
  if (input.id) {
    const { id, ...patch } = payload as any;
    const { error } = await supabase.from("channel_listings").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("channel_listings").insert(payload as any);
    if (error) throw new Error(error.message);
  }
  return { ok: true };
}

export async function deleteListing(supabase: Client, id: string) {
  const { error } = await supabase.from("channel_listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Sync engine (service-role client, server-only)                      */
/* ------------------------------------------------------------------ */

async function log(
  admin: Client,
  jobId: string,
  level: "info" | "warn" | "error",
  message: string,
  details: Record<string, string | number | boolean | null> = {},
) {
  await admin
    .from("sync_logs")
    .insert({ job_id: jobId, level, message, details, channel: "bol" } as any);
}

export type SyncResult = {
  jobId: string;
  status: string;
  processed: number;
  failed: number;
  error?: string;
};

export async function runSyncJob(
  admin: Client,
  jobType: "orders" | "stock" | "offers" | "shipments",
  options: { triggeredBy?: string | null; attempt?: number } = {},
): Promise<SyncResult> {
  const attempt = options.attempt ?? 1;
  const { data: created, error: jobError } = await admin
    .from("sync_jobs")
    .insert({
      channel: "bol",
      job_type: jobType,
      status: "running",
      attempt,
      triggered_by: options.triggeredBy ?? null,
      started_at: new Date().toISOString(),
    } as any)
    .select("id")
    .single();
  if (jobError) throw new Error(jobError.message);
  const jobId = (created as any).id as string;

  let processed = 0;
  let failed = 0;
  let status = "success";
  let errorMessage: string | undefined;

  try {
    const { configured } = credentials();
    if (!configured)
      throw new Error("bol.com-inloggegevens ontbreken — koppeling nog niet geactiveerd");
    const token = await getAccessToken();

    if (jobType === "orders") {
      const result = await importOrders(admin, jobId, token);
      processed = result.processed;
      failed = result.failed;
    } else if (jobType === "stock") {
      const result = await pushStock(admin, jobId, token);
      processed = result.processed;
      failed = result.failed;
    } else if (jobType === "offers") {
      const result = await pullOffers(admin, jobId, token);
      processed = result.processed;
      failed = result.failed;
    } else {
      const result = await pushShipments(admin, jobId, token);
      processed = result.processed;
      failed = result.failed;
    }
    if (failed > 0) status = processed > 0 ? "partial" : "failed";
  } catch (error) {
    status = "failed";
    errorMessage = (error as Error).message;
    await log(admin, jobId, "error", errorMessage);
  }

  await admin
    .from("sync_jobs")
    .update({
      status,
      processed_count: processed,
      failed_count: failed,
      error_message: errorMessage ?? null,
      finished_at: new Date().toISOString(),
    } as any)
    .eq("id", jobId);

  return { jobId, status, processed, failed, error: errorMessage };
}

/** Exponential backoff retry wrapper used by the scheduled sync. */
export async function runSyncWithBackoff(
  admin: Client,
  jobType: "orders" | "stock" | "offers" | "shipments",
  maxAttempts = 3,
): Promise<SyncResult> {
  let last: SyncResult | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = await runSyncJob(admin, jobType, { attempt });
    if (last.status === "success") return last;
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
    }
  }
  return last!;
}

type BolOrder = {
  orderId: string;
  orderPlacedDateTime?: string;
  shipmentDetails?: Record<string, any>;
  billingDetails?: Record<string, any>;
  orderItems?: {
    orderItemId: string;
    ean?: string;
    product?: { title?: string; ean?: string };
    quantity?: number;
    unitPrice?: number;
    offer?: { offerId?: string };
  }[];
};

async function importOrders(admin: Client, jobId: string, token: string) {
  const list = await bolRequest<{ orders?: { orderId: string }[] }>(
    "/orders?status=ALL&fulfilment-method=FBR",
    { token },
  );
  const orders = list.orders ?? [];
  let processed = 0;
  let failed = 0;

  for (const summary of orders) {
    try {
      const order = await bolRequest<BolOrder>(`/orders/${summary.orderId}`, { token });
      const { data: existing } = await admin
        .from("orders")
        .select("id")
        .eq("sales_channel", "bol")
        .eq("external_order_id", order.orderId)
        .maybeSingle();

      if (existing) {
        // Already imported — but ingestion is not one transaction, so an order
        // whose lines failed halfway leaves a header with no items. Skipping
        // it on every later run would strand it there permanently, invisible
        // except as an order totalling something with nothing in it.
        const { count } = await admin
          .from("order_items")
          .select("id", { count: "exact", head: true })
          .eq("order_id", (existing as any).id);

        if ((count ?? 0) > 0) continue;

        await log(
          admin,
          jobId,
          "warn",
          `Bestelling ${order.orderId} bestond al zonder regels; regels worden alsnog aangemaakt.`,
        );
        await importBolOrderItems(admin, jobId, (existing as any).id, order);
        processed++;
        continue;
      }

      const ship = order.shipmentDetails ?? {};
      const bill = order.billingDetails ?? ship;
      const items = order.orderItems ?? [];
      const subtotal = items.reduce(
        (sum, item) => sum + Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1),
        0,
      );
      const vat = Math.round(((subtotal / 1.21) * 0.21 + Number.EPSILON) * 100) / 100;

      const address = {
        street: ship.streetName ?? "",
        house_number: ship.houseNumber ?? "",
        house_number_addition: ship.houseNumberExtension ?? null,
        postal_code: ship.zipCode ?? "",
        city: ship.city ?? "",
        country: ship.countryCode ?? "NL",
      };

      const { data: inserted, error } = await admin
        .from("orders")
        .insert({
          sales_channel: "bol",
          external_order_id: order.orderId,
          status: "paid",
          payment_status: "paid",
          payment_method: "bol",
          email: ship.email ?? bill.email ?? "onbekend@bol.com",
          first_name: ship.firstName ?? "bol.com",
          last_name: ship.surname ?? "klant",
          phone: ship.deliveryPhoneNumber ?? null,
          company_name: ship.company ?? null,
          shipping_address: address,
          billing_address: address,
          shipping_method_name: "bol.com bezorging",
          subtotal,
          shipping_cost: 0,
          vat_amount: vat,
          total: subtotal,
          customer_note: null,
        } as any)
        .select("id")
        .single();
      if (error) {
        // The unique index on (sales_channel, external_order_id) is what makes
        // the check above race-proof: two syncs running at once both pass it,
        // and one of them lands here. That is a duplicate, not a failure.
        if (/duplicate key|unique constraint/i.test(error.message)) {
          await log(admin, jobId, "info", `Bestelling ${order.orderId} was al geïmporteerd.`);
          continue;
        }
        throw new Error(error.message);
      }
      const orderId = (inserted as any).id as string;

      await importBolOrderItems(admin, jobId, orderId, order);

      await admin.from("order_status_history").insert({
        order_id: orderId,
        status: "paid",
        note: `Geïmporteerd vanaf bol.com (${order.orderId})`,
      } as any);

      processed++;
      await log(admin, jobId, "info", `Bestelling ${order.orderId} geïmporteerd`);
    } catch (error) {
      failed++;
      await log(
        admin,
        jobId,
        "error",
        `Bestelling ${summary.orderId} mislukt: ${(error as Error).message}`,
      );
    }
  }

  return { processed, failed };
}

async function pushStock(admin: Client, jobId: string, token: string) {
  const { data, error } = await admin
    .from("channel_listings")
    .select(
      "id, external_offer_id, stock_sync_enabled, is_active, products ( stock_quantity, safety_stock )",
    )
    .eq("channel", "bol")
    .eq("is_active", true)
    .eq("stock_sync_enabled", true);
  if (error) throw new Error(error.message);

  let processed = 0;
  let failed = 0;

  for (const row of (data ?? []) as any[]) {
    if (!row.external_offer_id) {
      failed++;
      await log(admin, jobId, "warn", "Aanbieding zonder bol.com offer-ID overgeslagen", {
        id: row.id,
      });
      continue;
    }
    const available = Math.max(
      0,
      Number(row.products?.stock_quantity ?? 0) - Number(row.products?.safety_stock ?? 0),
    );
    try {
      await bolRequest(`/offers/${row.external_offer_id}/stock`, {
        method: "PUT",
        token,
        body: { amount: available, managedByRetailer: true },
      });
      await admin
        .from("channel_listings")
        .update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: "success",
          last_sync_error: null,
        } as any)
        .eq("id", row.id);
      processed++;
    } catch (err) {
      failed++;
      await admin
        .from("channel_listings")
        .update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: "failed",
          last_sync_error: (err as Error).message,
        } as any)
        .eq("id", row.id);
      await log(admin, jobId, "error", `Voorraad-update mislukt voor ${row.external_offer_id}`, {
        error: (err as Error).message,
      });
    }
  }

  return { processed, failed };
}

async function pullOffers(admin: Client, jobId: string, token: string) {
  const offers = await bolRequest<{
    offers?: { offerId: string; ean?: string; bundlePricesPrice?: number }[];
  }>("/offers?page=1", { token });
  let processed = 0;
  const failed = 0;

  for (const offer of offers.offers ?? []) {
    const { data: product } = offer.ean
      ? await admin.from("products").select("id").eq("ean", offer.ean).maybeSingle()
      : { data: null };
    await admin.from("channel_listings").upsert(
      {
        channel: "bol",
        external_offer_id: offer.offerId,
        ean: offer.ean ?? null,
        product_id: (product as any)?.id ?? null,
        channel_price: offer.bundlePricesPrice ?? null,
      } as any,
      { onConflict: "channel,external_offer_id" },
    );
    processed++;
  }
  await log(admin, jobId, "info", `${processed} aanbiedingen bijgewerkt`);
  return { processed, failed };
}

async function pushShipments(admin: Client, jobId: string, token: string) {
  const { data, error } = await admin
    .from("orders")
    .select("id, external_order_id, status")
    .eq("sales_channel", "bol")
    .in("status", ["packed", "shipped"]);
  if (error) throw new Error(error.message);

  let processed = 0;
  let failed = 0;
  for (const order of (data ?? []) as any[]) {
    if (!order.external_order_id) continue;
    try {
      const { data: items } = await admin.from("order_items").select("id").eq("order_id", order.id);
      await bolRequest("/shipments", {
        method: "POST",
        token,
        body: {
          orderItems: ((items ?? []) as any[]).map((i) => ({ orderItemId: i.id })),
          shipmentReference: order.external_order_id,
          transport: { transporterCode: "TNT" },
        },
      });
      processed++;
      await log(admin, jobId, "info", `Verzending doorgegeven voor ${order.external_order_id}`);
    } catch (err) {
      failed++;
      await log(admin, jobId, "error", `Verzending mislukt voor ${order.external_order_id}`, {
        error: (err as Error).message,
      });
    }
  }
  return { processed, failed };
}

/**
 * Writes one bol.com order's lines, and takes the stock they sold.
 *
 * Split out so a header that was created without its lines — an ingestion that
 * failed halfway — can be repaired on the next sync instead of being skipped
 * forever by the already-imported check.
 *
 * The stock movement is keyed on the order, so running this twice against the
 * same order deducts once.
 */
async function importBolOrderItems(
  admin: any,
  jobId: string,
  orderId: string,
  order: BolOrder,
): Promise<void> {
  const items = order.orderItems ?? [];
  for (const item of items) {
    const ean = item.ean ?? item.product?.ean ?? null;
    let productId: string | null = null;
    if (ean) {
      const { data: listing } = await admin
        .from("channel_listings")
        .select("product_id")
        .eq("channel", "bol")
        .eq("ean", ean)
        .maybeSingle();
      productId = (listing as any)?.product_id ?? null;
      if (!productId) {
        const { data: product } = await admin
          .from("products")
          .select("id")
          .eq("ean", ean)
          .maybeSingle();
        productId = (product as any)?.id ?? null;
      }
    }
    const quantity = Number(item.quantity ?? 1);
    const unitPrice = Number(item.unitPrice ?? 0);
    await admin.from("order_items").insert({
      order_id: orderId,
      product_id: productId,
      product_name: item.product?.title ?? "bol.com artikel",
      sku: ean,
      unit_price: unitPrice,
      quantity,
      line_total: unitPrice * quantity,
    } as any);

    if (productId) {
      // The ledger row is the whole change. This used to insert the
      // movement and then decrement the column as well, taking the goods
      // off the shelf twice for every bol.com sale. Keyed on the order, so
      // a re-run of the sync does not deduct again.
      const { recordMovement } = await import("./inventory.server");
      await recordMovement({
        productId,
        change: -quantity,
        reason: "bol_order",
        referenceType: "order",
        referenceId: orderId,
        note: `bol.com bestelling ${order.orderId}`,
      });
    } else if (ean) {
      await log(admin, jobId, "warn", `Geen productkoppeling voor EAN ${ean}`, {
        orderId: order.orderId,
      });
    }
  }
}
