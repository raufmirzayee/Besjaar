import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";

import { cartSignature, checkoutAttemptKey, clearCheckoutAttempt } from "../checkout-attempt";

/**
 * The key used to be crypto.randomUUID() inside the submit handler, so every
 * press produced a new one and the server's idempotency check — which is
 * correct, and backed by a unique index — never had anything to match.
 */

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

beforeEach(() => {
  vi.stubGlobal("window", { sessionStorage: new MemoryStorage() });
});
afterEach(() => vi.unstubAllGlobals());

const cart = [
  { productId: "p1", quantity: 2 },
  { productId: "p2", quantity: 1 },
];

describe("cart signature", () => {
  it("does not depend on the order the items were added in", () => {
    expect(cartSignature(cart)).toBe(cartSignature([...cart].reverse()));
  });

  it("changes when a quantity changes", () => {
    expect(cartSignature(cart)).not.toBe(
      cartSignature([
        { productId: "p1", quantity: 3 },
        { productId: "p2", quantity: 1 },
      ]),
    );
  });
});

describe("attempt key", () => {
  it("returns the same key for repeated presses of the same cart", () => {
    // The whole point: a double-click, or a retry after a timeout, is one
    // order.
    const first = checkoutAttemptKey(cart);
    expect(checkoutAttemptKey(cart)).toBe(first);
    expect(checkoutAttemptKey([...cart].reverse())).toBe(first);
  });

  it("returns a new key once the cart changes", () => {
    const first = checkoutAttemptKey(cart);
    const changed = checkoutAttemptKey([...cart, { productId: "p3", quantity: 1 }]);
    expect(changed).not.toBe(first);
  });

  it("returns a new key after the attempt is cleared", () => {
    const first = checkoutAttemptKey(cart);
    clearCheckoutAttempt(cart);
    expect(checkoutAttemptKey(cart)).not.toBe(first);
  });

  it("produces a uuid the server's validator accepts", () => {
    // The server input schema is z.string().uuid().
    expect(checkoutAttemptKey(cart)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("still returns a usable key when storage throws", () => {
    // Private browsing, or a browser set to block site data. Not a reason to
    // fail a purchase.
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem() {
          throw new Error("blocked");
        },
        setItem() {
          throw new Error("blocked");
        },
        removeItem() {
          throw new Error("blocked");
        },
      },
    });
    expect(checkoutAttemptKey(cart)).toMatch(/^[0-9a-f-]{36}$/i);
    expect(() => clearCheckoutAttempt(cart)).not.toThrow();
  });

  it("ignores a corrupted stored value rather than sending it to the server", () => {
    window.sessionStorage.setItem("besjaar-checkout-attempt:" + cartSignature(cart), "not-a-uuid");
    expect(checkoutAttemptKey(cart)).toMatch(/^[0-9a-f-]{36}$/i);
    expect(checkoutAttemptKey(cart)).not.toBe("not-a-uuid");
  });
});
