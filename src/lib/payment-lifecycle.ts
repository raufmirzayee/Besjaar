/**
 * What each payment state means for reserved stock.
 *
 * Stock is taken when the order is created and given back when the payment can
 * no longer succeed. Getting this wrong in either direction is expensive: hold
 * stock too long and sellable goods sit behind dead orders, release too eagerly
 * and the shop oversells an order it is about to be paid for.
 *
 * The bug this table replaces: only `failed` and `cancelled` released, so an
 * *expired* payment — the most common abandonment by far, since Mollie expires
 * unpaid iDEAL after about 15 minutes — left its stock reserved forever.
 */

/** The payment states the shop stores, mapped from the provider's own. */
export type PaymentState =
  "open" | "pending" | "authorized" | "paid" | "failed" | "cancelled" | "expired" | "refunded";

export type StockDisposition =
  /** Payment may still succeed: the goods stay reserved. */
  | "hold"
  /** Payment succeeded: the reservation becomes a sale, nothing moves. */
  | "keep"
  /** Payment can no longer succeed: give the goods back. */
  | "release";

const DISPOSITION: Record<PaymentState, StockDisposition> = {
  // Awaiting the customer, or the bank. Still winnable.
  open: "hold",
  pending: "hold",
  // Funds confirmed but not yet captured; the sale is going ahead.
  authorized: "keep",
  paid: "keep",
  // Dead. The customer will not be paying for this order.
  failed: "release",
  cancelled: "release",
  expired: "release",
  // Money returned. The goods come back only when staff book the return in,
  // because a refund does not mean the item is physically back on the shelf.
  refunded: "hold",
};

export function stockDispositionFor(state: string): StockDisposition {
  return DISPOSITION[state as PaymentState] ?? "hold";
}

/** Whether this state means the reservation should be returned to stock. */
export function shouldReleaseStock(state: string): boolean {
  return stockDispositionFor(state) === "release";
}

/** Whether the shop may treat the order as paid. */
export function isPaidState(state: string): boolean {
  return state === "paid" || state === "authorized";
}

export const PAYMENT_STATES: PaymentState[] = Object.keys(DISPOSITION) as PaymentState[];
