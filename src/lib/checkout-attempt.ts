/**
 * One idempotency key per checkout attempt, not per button press.
 *
 * The key used to be `crypto.randomUUID()` inside the submit handler, so every
 * press produced a new one and the server's idempotency check — which is
 * correct, and backed by a unique index — never had anything to match. A
 * double-click, a retry after a timeout, or a customer who hits back and
 * submits again created a second order holding a second reservation.
 *
 * The key identifies *this cart, this attempt*. It survives a reload, because
 * the most common retry is a customer refreshing a page that seemed stuck. It
 * changes when the cart changes, because that is a different purchase. And it
 * is cleared on success, so the next order gets a fresh one.
 *
 * sessionStorage rather than localStorage: an attempt belongs to a tab and a
 * sitting, and a key left behind for a week would make a later identical cart
 * silently return the old order.
 */

const STORAGE_PREFIX = "besjaar-checkout-attempt:";

export type CartLine = { productId: string; quantity: number };

/**
 * A stable fingerprint of what is being bought.
 *
 * Order-independent, so re-adding the same items in a different order is the
 * same attempt rather than a new one.
 */
export function cartSignature(lines: CartLine[]): string {
  return lines
    .map((line) => `${line.productId}:${line.quantity}`)
    .sort()
    .join("|");
}

function newKey(): string {
  // crypto.randomUUID needs a secure context. Everything that can reach
  // checkout is on https, but a fallback beats throwing during a purchase.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * The key for this attempt, creating one if the cart has not been submitted
 * before.
 *
 * Every storage access is guarded: private browsing and blocked site data both
 * throw here, and neither is a reason to fail a purchase. Without storage the
 * key is per-call, which is exactly the old behaviour — no worse, and the
 * server's unique index still catches a genuine double-submit of the same key.
 */
export function checkoutAttemptKey(lines: CartLine[]): string {
  const signature = cartSignature(lines);
  const storageKey = `${STORAGE_PREFIX}${signature}`;

  try {
    if (typeof window !== "undefined") {
      const existing = window.sessionStorage.getItem(storageKey);
      if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
      const created = newKey();
      window.sessionStorage.setItem(storageKey, created);
      return created;
    }
  } catch {
    // Storage unavailable. Fall through.
  }
  return newKey();
}

/**
 * Forgets the attempt once its order exists.
 *
 * Called after a successful submit, so the customer's next purchase of the
 * same items is a new order rather than a replay of the last one.
 */
export function clearCheckoutAttempt(lines: CartLine[]): void {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(`${STORAGE_PREFIX}${cartSignature(lines)}`);
  } catch {
    // Nothing to clear if storage was never available.
  }
}
