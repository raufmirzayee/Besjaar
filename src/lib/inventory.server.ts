/**
 * Stock, on one road.
 *
 * The ledger owns stock. `stock_movements` is the only thing that may change
 * `products.stock_quantity` or `product_variants.warehouse_stock`, a database
 * trigger applies each row, and a second trigger rejects any direct write to
 * those columns. Everything here is a thin wrapper over the database functions
 * that enforce that.
 *
 * The rule this replaces: five code paths used to update stock *and* insert a
 * movement, so every change landed twice. Nothing in the application writes
 * those columns any more — if a future code path tries, Postgres refuses it
 * rather than silently double-counting.
 *
 * These functions take no client argument on purpose. The stock RPCs are
 * granted to `service_role` alone, so calling one with a staff user's client
 * fails with "permission denied" — a mistake that is easy to make when the
 * client is a parameter and invisible until the shop is live. Authorisation
 * for *who* may move stock is enforced one layer up, in the server functions,
 * where the user's permissions are actually known.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Why stock moved. Recorded on the ledger row and shown in the admin. */
export type StockReason =
  | "order_placed"
  | "order_cancelled"
  | "return_restocked"
  | "correctie"
  | "stocktake"
  | "beginvoorraad"
  | "bol_order"
  | "supplier_receipt";

export type MovementInput = {
  /** Null for a movement that only touches a variant. */
  productId?: string | null;
  /** Signed: negative takes stock out, positive puts it back. */
  change: number;
  reason: StockReason;
  /** With a reference, the movement is applied at most once. */
  referenceType?: string | null;
  referenceId?: string | null;
  note?: string | null;
  createdBy?: string | null;
  variantId?: string | null;
};

/**
 * Records one movement and returns the resulting quantity.
 *
 * Idempotent when a reference is given: replaying the same (reason, reference)
 * returns the current quantity without applying anything again.
 *
 * Pass either a product or a variant, not both: the trigger applies the change
 * to every id it is given, so a movement carrying both would move the product
 * total and the variant total by the same amount and count the goods twice.
 */
export async function recordMovement(input: MovementInput): Promise<number> {
  if (input.productId && input.variantId) {
    throw new Error(
      "A stock movement moves a product or a variant, not both — passing both counts the same goods twice.",
    );
  }
  const { data, error } = await supabaseAdmin.rpc("record_stock_movement", {
    p_product_id: input.productId ?? null,
    p_quantity_change: Math.trunc(input.change),
    p_reason: input.reason,
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
    p_note: input.note ?? null,
    p_created_by: input.createdBy ?? null,
    p_variant_id: input.variantId ?? null,
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

type LevelInput = {
  target: number;
  reason?: StockReason;
  referenceType?: string | null;
  referenceId?: string | null;
  note?: string | null;
  createdBy?: string | null;
};

/**
 * Sets a product's stock to an absolute figure — a stocktake, or a CSV import
 * column.
 *
 * The database writes the difference as a movement. Importing "20" onto a
 * product holding 10 lands on 20, not 30. Re-running the same import is a
 * no-op, because the second run computes a difference of zero.
 */
export async function setStockLevel(input: LevelInput & { productId: string }): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("set_stock_level", {
    p_product_id: input.productId,
    p_target: Math.max(0, Math.trunc(input.target)),
    p_reason: input.reason ?? "correctie",
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
    p_note: input.note ?? null,
    p_created_by: input.createdBy ?? null,
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

/** The same, for one variant's warehouse stock. */
export async function setVariantStockLevel(
  input: LevelInput & { variantId: string },
): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("set_variant_stock_level", {
    p_variant_id: input.variantId,
    p_target: Math.max(0, Math.trunc(input.target)),
    p_reason: input.reason ?? "correctie",
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
    p_note: input.note ?? null,
    p_created_by: input.createdBy ?? null,
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

/** Thrown when an order asks for more than is on the shelf. */
export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

/**
 * Takes stock for an order, atomically.
 *
 * The database locks each product row before checking, so two customers racing
 * for the last unit serialise and only one gets it. Throws
 * InsufficientStockError — naming the product — rather than clamping to zero
 * and selling units that do not exist.
 *
 * Safe to call twice for the same order: the second call does nothing.
 */
export async function reserveStockForOrder(orderId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("reserve_stock_for_order", { p_order_id: orderId });
  if (!error) return;

  const message = String(error.message ?? "");
  if (/Onvoldoende voorraad/i.test(message)) {
    throw new InsufficientStockError(message.replace(/^.*?(Onvoldoende voorraad)/i, "$1"));
  }
  throw new Error(message);
}

/**
 * Puts an order's reservation back on the shelf, once.
 *
 * Called when a payment fails, is cancelled or expires, and when staff cancel
 * an order. A retried Mollie webhook lands here repeatedly; only the first
 * call moves anything.
 */
export async function releaseStockForOrder(
  orderId: string,
  reason: StockReason = "order_cancelled",
  note?: string,
): Promise<void> {
  const { error } = await supabaseAdmin.rpc("release_stock_for_order", {
    p_order_id: orderId,
    p_reason: reason,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
}
