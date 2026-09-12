import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * The public order lookup is the one place an outsider can ask the shop about
 * a specific customer. Order numbers run in sequence, so it is enumerable by
 * design and the credential check is the only thing standing in the way.
 *
 * These tests drive the real fetchOrderByNumber against a stubbed PostgREST
 * client — the query and the decision are the code under test, not a
 * component that happens to render the result.
 */

const ORDER = {
  order_number: "BES-10001",
  status: "paid",
  payment_status: "paid",
  payment_method: "ideal",
  email: "Klant@Voorbeeld.NL",
  access_token: "a".repeat(64),
  first_name: "Ana",
  last_name: "Jansen",
  shipping_address: { street: "Kade", city: "Rotterdam" },
  shipping_method_name: "PostNL",
  carrier: "PostNL",
  tracking_code: null,
  tracking_url: null,
  shipped_at: null,
  delivered_at: null,
  subtotal: 10,
  shipping_cost: 0,
  vat_amount: 2.1,
  total: 12.1,
  created_at: "2026-09-10T10:00:00Z",
  order_items: [
    {
      product_name: "Opwindbare Zaklamp",
      product_slug: "opwindbare-zaklamp",
      image_url: null,
      unit_price: 10,
      quantity: 1,
      line_total: 10,
    },
  ],
};

const selected = vi.fn();

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: () => ({
      select: (columns: string) => {
        selected(columns);
        return {
          eq: (_column: string, value: string) => ({
            maybeSingle: async () => ({
              data: value === ORDER.order_number ? ORDER : null,
              error: null,
            }),
          }),
        };
      },
    }),
  },
}));

const { fetchOrderByNumber } = await import("../checkout.server");

beforeEach(() => selected.mockClear());

describe("public order lookup", () => {
  it("returns the order for the matching e-mail address", async () => {
    const order = await fetchOrderByNumber("BES-10001", { email: "klant@voorbeeld.nl" });
    expect(order?.order_number).toBe("BES-10001");
    expect(order?.items).toHaveLength(1);
  });

  it("matches the e-mail address regardless of case and surrounding space", async () => {
    const order = await fetchOrderByNumber("BES-10001", { email: "  KLANT@voorbeeld.nl " });
    expect(order?.order_number).toBe("BES-10001");
  });

  it("returns the order for the access token from the confirmation link", async () => {
    // A guest returning from the payment provider never typed a password and
    // has no session; the token is all they carry.
    const order = await fetchOrderByNumber("BES-10001", { token: "a".repeat(64) });
    expect(order?.order_number).toBe("BES-10001");
  });

  it("refuses a wrong e-mail address", async () => {
    expect(await fetchOrderByNumber("BES-10001", { email: "iemand@anders.nl" })).toBeNull();
  });

  it("refuses a wrong token", async () => {
    expect(await fetchOrderByNumber("BES-10001", { token: "b".repeat(64) })).toBeNull();
  });

  it("refuses a token that is a prefix of the real one", async () => {
    // The comparison must not stop early on a partial match.
    expect(await fetchOrderByNumber("BES-10001", { token: "a".repeat(63) })).toBeNull();
  });

  it("refuses when no credential is supplied at all", async () => {
    expect(await fetchOrderByNumber("BES-10001", {})).toBeNull();
    expect(await fetchOrderByNumber("BES-10001", { email: "", token: "" })).toBeNull();
  });

  it("never reaches the database when no credential is supplied", async () => {
    // An empty submission should cost nothing, and should not be a way to ask
    // whether an order number exists.
    await fetchOrderByNumber("BES-10001", {});
    expect(selected).not.toHaveBeenCalled();
  });

  it("answers a missing order and a wrong credential identically", async () => {
    // Any difference between the two confirms which order numbers exist.
    const missing = await fetchOrderByNumber("BES-99999", { email: "klant@voorbeeld.nl" });
    const wrong = await fetchOrderByNumber("BES-10001", { email: "iemand@anders.nl" });
    expect(missing).toBeNull();
    expect(wrong).toBeNull();
    expect(missing).toEqual(wrong);
  });

  it("never returns the access token to the caller", async () => {
    // It is a bearer credential: echoing it back would hand it to anyone who
    // got in with the e-mail address instead.
    const order = await fetchOrderByNumber("BES-10001", { email: "klant@voorbeeld.nl" });
    expect(JSON.stringify(order)).not.toContain("a".repeat(64));
    expect(order).not.toHaveProperty("access_token");
  });
});
