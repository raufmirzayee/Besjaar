/**
 * Order fulfilment — the database side.
 *
 * Before this, the admin could only read orders — there was no way to advance
 * one, record a shipment, or cancel it, so an order could never actually be
 * fulfilled. These are the operations a shop needs to run day to day.
 *
 * Every transition writes to order_status_history, so the order has an audit
 * trail, and cancelling returns the reserved stock to the shelf.
 *
 * The status rules and carrier tables live in `./fulfilment` so the admin
 * screen can use them without pulling this module into the browser bundle.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  canTransition,
  trackingUrlFor,
  type FulfilmentStatus,
  type OrderDetail,
  type ResendableTemplate,
  type TransitionResult,
} from "./fulfilment";

export type { FulfilmentStatus, OrderDetail, TransitionResult };

export async function fetchOrderDetail(admin: any, orderId: string): Promise<OrderDetail | null> {
  const { data, error } = await admin
    .from("orders")
    .select(
      `id, order_number, status, payment_status, payment_method, payment_reference,
       email, first_name, last_name, phone, shipping_address, billing_address,
       shipping_method_name, carrier, tracking_code, tracking_url, shipped_at,
       delivered_at, cancelled_at, customer_note, subtotal, shipping_cost, vat_amount,
       total, created_at,
       order_items ( product_id, product_name, product_slug, quantity, unit_price, line_total ),
       order_status_history ( status, note, created_at )`,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as any;

  const { data: emails } = await admin
    .from("email_log")
    .select("template, status, created_at, error")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  return {
    ...row,
    subtotal: Number(row.subtotal),
    shipping_cost: Number(row.shipping_cost),
    vat_amount: Number(row.vat_amount),
    total: Number(row.total),
    items: ((row.order_items ?? []) as any[]).map((item) => ({
      product_id: item.product_id ?? null,
      product_name: item.product_name,
      product_slug: item.product_slug ?? null,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total),
    })),
    history: ((row.order_status_history ?? []) as any[]).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    emails: (emails ?? []) as OrderDetail["emails"],
  };
}

export type TransitionInput = {
  orderId: string;
  status: FulfilmentStatus;
  note?: string | null;
  carrier?: string | null;
  trackingCode?: string | null;
  /** Staff can suppress the customer email for a correction. */
  notifyCustomer?: boolean;
};

/**
 * Advances an order and performs the side effects that status implies:
 * shipping records the carrier and notifies the customer; cancelling returns
 * the reserved stock.
 */
export async function transitionOrder(
  admin: any,
  input: TransitionInput,
  actorId: string | null,
): Promise<TransitionResult> {
  const { data: current, error: loadError } = await admin
    .from("orders")
    .select("id, order_number, status, shipping_notified_at")
    .eq("id", input.orderId)
    .maybeSingle();
  if (loadError) throw new Error(loadError.message);
  if (!current) throw new Error("Bestelling niet gevonden.");

  const row = current as any;
  const from = String(row.status);
  if (from === input.status) throw new Error(`De bestelling heeft deze status al.`);
  if (!canTransition(from, input.status)) {
    throw new Error(`Status kan niet van "${from}" naar "${input.status}".`);
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: input.status, updated_at: now };

  if (input.status === "shipped") {
    // A shipment without a tracking code leaves the customer with nothing to
    // follow, so require one.
    const code = (input.trackingCode ?? "").trim();
    const carrier = (input.carrier ?? "").trim();
    if (!code) throw new Error("Vul een track & trace-code in om te kunnen verzenden.");
    if (!carrier) throw new Error("Kies een vervoerder om te kunnen verzenden.");
    patch.carrier = carrier;
    patch.tracking_code = code;
    patch.tracking_url = trackingUrlFor(carrier, code);
    patch.shipped_at = now;
  }

  if (input.status === "delivered") patch.delivered_at = now;
  if (input.status === "cancelled") patch.cancelled_at = now;

  const { error: updateError } = await admin.from("orders").update(patch).eq("id", input.orderId);
  if (updateError) throw new Error(updateError.message);

  await admin.from("order_status_history").insert({
    order_id: input.orderId,
    status: input.status,
    note: input.note ?? null,
    changed_by: actorId,
  });

  // Cancelling puts the reserved stock back on the shelf. The trigger on
  // stock_movements applies it to the product.
  if (input.status === "cancelled") {
    const { data: items } = await admin
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", input.orderId);
    const movements = ((items ?? []) as any[])
      .filter((item) => item.product_id)
      .map((item) => ({
        product_id: item.product_id,
        quantity_change: Number(item.quantity),
        reason: "order_cancelled",
        reference_type: "order",
        reference_id: input.orderId,
        note: `Bestelling ${row.order_number} geannuleerd`,
        created_by: actorId,
      }));
    if (movements.length) await admin.from("stock_movements").insert(movements);
  }

  const result: TransitionResult = {
    status: input.status,
    emailSent: false,
    emailSkipped: false,
    emailError: null,
  };

  const shouldNotify =
    input.notifyCustomer !== false && (input.status === "shipped" || input.status === "cancelled");

  if (shouldNotify) {
    try {
      const { orderEmailData, sendTransactionalEmail } = await import("./email.server");
      const data = await orderEmailData(admin, input.orderId);
      if (data) {
        const sent = await sendTransactionalEmail({
          template: input.status === "shipped" ? "order_shipped" : "order_cancelled",
          data,
          orderId: input.orderId,
        });
        result.emailSent = sent.sent;
        result.emailSkipped = sent.skipped;
        result.emailError = sent.error;
        if (sent.sent && input.status === "shipped") {
          await admin.from("orders").update({ shipping_notified_at: now }).eq("id", input.orderId);
        }
      }
    } catch (error) {
      // The order is already shipped; a mail failure is reported, not fatal.
      result.emailError = error instanceof Error ? error.message : String(error);
      console.error("[fulfilment] notification failed:", result.emailError);
    }
  }

  return result;
}

/** Re-sends a transactional email for an order, for support requests. */
export async function resendOrderEmail(
  admin: any,
  orderId: string,
  template: ResendableTemplate,
): Promise<{ sent: boolean; skipped: boolean; error: string | null }> {
  const { orderEmailData, sendTransactionalEmail } = await import("./email.server");
  const data = await orderEmailData(admin, orderId);
  if (!data) throw new Error("Bestelling niet gevonden.");
  const result = await sendTransactionalEmail({ template, data, orderId });
  return { sent: result.sent, skipped: result.skipped, error: result.error };
}
