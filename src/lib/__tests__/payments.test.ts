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
  it("reports unconfigured when no API key is present", () => {
    expect(isPaymentProviderConfigured()).toBe(false);
  });

  it("reports configured once a key is set", () => {
    process.env.MOLLIE_API_KEY = "test_dummy";
    expect(isPaymentProviderConfigured()).toBe(true);
  });
});

describe("createPayment without a provider", () => {
  it("never returns a paid status or an invented reference", async () => {
    const result = await createPayment({
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
    for (const status of ["open", "pending", "authorized", "unknown", ""]) {
      expect(mapPaymentStatus(status).payment_status).not.toBe("paid");
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

  it("uses only values the database enums accept", () => {
    const paymentStatuses = ["open", "paid", "failed", "expired", "cancelled", "refunded"];
    const orderStatuses = [
      "pending",
      "paid",
      "processing",
      "packed",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];
    for (const input of ["paid", "canceled", "expired", "failed", "open", "whatever"]) {
      const mapped = mapPaymentStatus(input);
      expect(paymentStatuses).toContain(mapped.payment_status);
      expect(orderStatuses).toContain(mapped.status);
    }
  });
});
