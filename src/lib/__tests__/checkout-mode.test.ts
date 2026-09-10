import { describe, expect, it } from "vitest";

import { checkoutGate, classifyMollieKey, resolveCheckoutMode } from "../checkout-mode";

/**
 * Checkout used to proceed whatever the payment configuration was: no Mollie
 * key meant a real order, real reserved inventory, and a message telling the
 * customer payment was not available. A shop deployed before its payment
 * account was ready would quietly sell out of everything.
 *
 * These are the cases that decide whether money and stock move.
 */

const env = (over: Partial<Parameters<typeof checkoutGate>[0]> = {}) => ({
  mode: undefined,
  mollieApiKey: undefined,
  nodeEnv: "test",
  ...over,
});

describe("mode resolution", () => {
  it("defaults to disabled in production", () => {
    // The important one: an unconfigured production deployment takes no money
    // and reserves no stock.
    expect(resolveCheckoutMode(env({ nodeEnv: "production" }))).toBe("disabled");
  });

  it("defaults to test outside production", () => {
    // A freshly cloned repository has a working checkout page without anyone
    // setting a variable first.
    expect(resolveCheckoutMode(env({ nodeEnv: "development" }))).toBe("test");
  });

  it("accepts the three modes in any casing, and nothing else", () => {
    expect(resolveCheckoutMode(env({ mode: "LIVE" }))).toBe("live");
    expect(resolveCheckoutMode(env({ mode: " test " }))).toBe("test");
    expect(resolveCheckoutMode(env({ mode: "disabled" }))).toBe("disabled");
    // A typo must not silently enable live payments.
    expect(resolveCheckoutMode(env({ mode: "lives", nodeEnv: "production" }))).toBe("disabled");
    expect(resolveCheckoutMode(env({ mode: "", nodeEnv: "production" }))).toBe("disabled");
  });
});

describe("key classification", () => {
  it("reads Mollie's own prefixes", () => {
    expect(classifyMollieKey("live_abc123")).toBe("live");
    expect(classifyMollieKey("test_abc123")).toBe("test");
    expect(classifyMollieKey(undefined)).toBe("none");
    expect(classifyMollieKey("   ")).toBe("none");
    expect(classifyMollieKey("abc123")).toBe("unknown");
  });
});

describe("the gate", () => {
  it("refuses when disabled", () => {
    const gate = checkoutGate(env({ mode: "disabled", mollieApiKey: "live_abc" }));
    expect(gate.allowed).toBe(false);
  });

  it("refuses when no key is configured, rather than reserving stock", () => {
    const gate = checkoutGate(env({ mode: "live", mollieApiKey: undefined }));
    expect(gate.allowed).toBe(false);
    if (!gate.allowed) expect(gate.operatorMessage).toContain("MOLLIE_API_KEY");
  });

  it("refuses a test key in live mode", () => {
    // Customers would complete a payment that never charges them and never
    // pays the shop.
    const gate = checkoutGate(env({ mode: "live", mollieApiKey: "test_abc" }));
    expect(gate.allowed).toBe(false);
    if (!gate.allowed) expect(gate.operatorMessage).toContain("never charges them");
  });

  it("refuses a live key in test mode", () => {
    // A staging run would charge real cards.
    const gate = checkoutGate(env({ mode: "test", mollieApiKey: "live_abc" }));
    expect(gate.allowed).toBe(false);
    if (!gate.allowed) expect(gate.operatorMessage).toContain("charge real cards");
  });

  it("refuses a key whose environment cannot be established", () => {
    const gate = checkoutGate(env({ mode: "live", mollieApiKey: "some-other-format" }));
    expect(gate.allowed).toBe(false);
  });

  it("allows a matched live deployment", () => {
    const gate = checkoutGate(
      env({ mode: "live", mollieApiKey: "live_abc", nodeEnv: "production" }),
    );
    expect(gate.allowed).toBe(true);
    if (gate.allowed) {
      expect(gate.mode).toBe("live");
      expect(gate.usingTestKey).toBe(false);
    }
  });

  it("allows a matched test deployment", () => {
    const gate = checkoutGate(env({ mode: "test", mollieApiKey: "test_abc" }));
    expect(gate.allowed).toBe(true);
    if (gate.allowed) expect(gate.usingTestKey).toBe(true);
  });

  it("never puts the key or the operator detail in what the customer sees", () => {
    // The refusal reaches the browser. It must not name a variable, a mode, or
    // anything about the payment account.
    for (const mode of ["disabled", "test", "live"]) {
      for (const key of [undefined, "test_secret123", "live_secret123", "garbage"]) {
        const gate = checkoutGate(env({ mode, mollieApiKey: key, nodeEnv: "production" }));
        if (gate.allowed) continue;
        expect(gate.reason).not.toContain("MOLLIE");
        expect(gate.reason).not.toContain("CHECKOUT_MODE");
        expect(gate.reason).not.toContain("secret123");
        expect(gate.reason).not.toContain("test_");
        expect(gate.reason).not.toContain("live_");
      }
    }
  });
});
