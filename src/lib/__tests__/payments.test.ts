/**
 * Payment guard rails.
 *
 * The rule these tests protect: an order is only ever marked paid because the
 * payment provider said so. Without a provider key the store must not invent a
 * payment reference or a paid status.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  createPayment,
  isPaymentProviderConfigured,
  mapPaymentStatus,
} from "@/lib/payments.server";

afterEach(() => {
  delete process.env.MOLLIE_API_KEY;
});

describe("payment provider configuration", () => {
  // Resolved through the secret store now. With no vault in a unit test that
  // falls through to the environment, which is also the path a deployment
  // without Supabase Vault takes in production.
  it("reports unconfigured when no API key is present", async () => {
    expect(await isPaymentProviderConfigured()).toBe(false);
  });

  it("reports configured once a key is set", async () => {
    process.env.MOLLIE_API_KEY = "test_dummy";
    expect(await isPaymentProviderConfigured()).toBe(true);
  });
});

describe("createPayment without a provider", () => {
  it("never returns a paid status or an invented reference", async () => {
    const result = await createPayment({
      orderId: "00000000-0000-0000-0000-0000000000aa",
      orderNumber: "BSJ-1",
      amount: 24.99,
      method: "ideal",
      description: "test",
      redirectUrl: "https://example.test/bestelling",
    });

    expect(result.configured).toBe(false);
    expect(result.checkoutUrl).toBeNull();
    expect(result.paymentReference).toBeNull();
    expect(result.paymentStatus).toBe("open");
    expect(result.status).toBe("pending");
    // The important assertion: nothing anywhere claims the order was paid.
    expect(Object.values(result)).not.toContain("paid");
  });
});

describe("mapPaymentStatus", () => {
  it("only maps Mollie's paid status to paid", () => {
    expect(mapPaymentStatus("paid")).toEqual({ payment_status: "paid", status: "paid" });
    for (const status of ["open", "pending", "authorized", "failed", "expired"]) {
      expect(mapPaymentStatus(status)?.payment_status).not.toBe("paid");
    }
  });

  it("maps failure states onto cancelled orders", () => {
    expect(mapPaymentStatus("canceled")).toEqual({
      payment_status: "cancelled",
      status: "cancelled",
    });
    expect(mapPaymentStatus("expired")).toEqual({
      payment_status: "expired",
      status: "cancelled",
    });
    expect(mapPaymentStatus("failed")).toEqual({ payment_status: "failed", status: "cancelled" });
  });

  it("accepts Mollie's spelling and the database's spelling of cancelled", () => {
    // Mollie writes "canceled"; the enum writes "cancelled". A change at
    // either end must not silently stop matching.
    expect(mapPaymentStatus("canceled")).toEqual(mapPaymentStatus("cancelled"));
  });

  it("keeps an authorized payment out of the paid state", () => {
    // Funds are reserved but not captured. It used to fall through the default
    // arm and read as `open`, which was at least not wrong about the money.
    expect(mapPaymentStatus("authorized")).toEqual({
      payment_status: "authorized",
      status: "pending",
    });
  });

  it("does not reset a refunded payment to open", () => {
    // The bug this replaces: `refunded` hit the default arm, came back as
    // `open`, and set the order status to `pending`. A completed, refunded
    // order presented itself as a fresh unpaid one.
    expect(mapPaymentStatus("refunded")).toEqual({
      payment_status: "refunded",
      status: "refunded",
    });
    expect(mapPaymentStatus("partially_refunded")).toEqual({
      payment_status: "partially_refunded",
      status: "paid",
    });
    expect(mapPaymentStatus("chargeback")).toEqual({
      payment_status: "chargeback",
      status: "refunded",
    });
  });

  it("returns null for a status it does not recognise, rather than guessing", () => {
    // The caller must then leave the order alone. Guessing is exactly what the
    // old `default:` arm did.
    for (const unknown of ["", "whatever", "authorised", "PAID", "settled"]) {
      expect(mapPaymentStatus(unknown)).toBeNull();
    }
  });

  it("uses only values the database enums accept", () => {
    // Kept in step with 20260730175848 and 20260912110000 by hand; the
    // database suite checks the enums themselves.
    const paymentStatuses = [
      "open",
      "pending",
      "authorized",
      "paid",
      "failed",
      "expired",
      "cancelled",
      "refunded",
      "partially_refunded",
      "chargeback",
    ];
    const orderStatuses = [
      "pending",
      "paid",
      "processing",
      "packed",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
      "returned",
      "partially_returned",
    ];
    for (const input of [
      "open",
      "pending",
      "authorized",
      "paid",
      "canceled",
      "cancelled",
      "expired",
      "failed",
      "refunded",
      "partially_refunded",
      "chargeback",
    ]) {
      const mapped = mapPaymentStatus(input);
      expect(mapped, `${input} must map to something`).not.toBeNull();
      expect(paymentStatuses).toContain(mapped!.payment_status);
      expect(orderStatuses).toContain(mapped!.status);
    }
  });
});
