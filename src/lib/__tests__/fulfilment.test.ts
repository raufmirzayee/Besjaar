import { describe, expect, it } from "vitest";

import {
  ALLOWED_NEXT,
  CARRIERS,
  FULFILMENT_STATUSES,
  canTransition,
  nextStatuses,
  trackingUrlFor,
} from "@/lib/fulfilment";

describe("order status transitions", () => {
  it("allows the normal path from pending to delivered", () => {
    expect(canTransition("pending", "paid")).toBe(true);
    expect(canTransition("paid", "processing")).toBe(true);
    expect(canTransition("processing", "packed")).toBe(true);
    expect(canTransition("packed", "shipped")).toBe(true);
    expect(canTransition("shipped", "delivered")).toBe(true);
  });

  it("refuses to skip straight from pending to delivered or shipped", () => {
    expect(canTransition("pending", "delivered")).toBe(false);
    expect(canTransition("pending", "shipped")).toBe(false);
  });

  it("refuses to move backwards", () => {
    expect(canTransition("shipped", "processing")).toBe(false);
    expect(canTransition("delivered", "shipped")).toBe(false);
    expect(canTransition("paid", "pending")).toBe(false);
  });

  it("treats cancelled and refunded as terminal", () => {
    expect(ALLOWED_NEXT.cancelled).toEqual([]);
    expect(ALLOWED_NEXT.refunded).toEqual([]);
    for (const status of FULFILMENT_STATUSES) {
      expect(canTransition("cancelled", status)).toBe(false);
      expect(canTransition("refunded", status)).toBe(false);
    }
  });

  it("cannot cancel an order that already shipped", () => {
    expect(canTransition("shipped", "cancelled")).toBe(false);
    expect(canTransition("delivered", "cancelled")).toBe(false);
    // It can still be refunded, which is the correct remedy at that point.
    expect(canTransition("shipped", "refunded")).toBe(true);
  });

  it("never offers a transition to the same status", () => {
    for (const status of FULFILMENT_STATUSES) {
      expect(nextStatuses(status)).not.toContain(status);
    }
  });

  it("only ever offers known statuses", () => {
    for (const status of FULFILMENT_STATUSES) {
      for (const next of nextStatuses(status)) {
        expect(FULFILMENT_STATUSES).toContain(next);
      }
    }
  });

  it("returns nothing for an unknown status instead of throwing", () => {
    expect(nextStatuses("verzonden-misschien")).toEqual([]);
    expect(canTransition("verzonden-misschien", "shipped")).toBe(false);
  });
});

describe("trackingUrlFor", () => {
  it("builds a track and trace URL for every carrier it offers", () => {
    for (const carrier of CARRIERS) {
      const url = trackingUrlFor(carrier, "3SBESJ1234567");
      expect(url, carrier).toBeTruthy();
      expect(url).toContain("3SBESJ1234567");
      expect(url?.startsWith("https://")).toBe(true);
    }
  });

  it("is case and whitespace tolerant", () => {
    expect(trackingUrlFor(" PostNL ", "3SBESJ1")).toBe(
      "https://jouw.postnl.nl/track-and-trace/3SBESJ1",
    );
  });

  it("URL-encodes the code so it cannot break out of the link", () => {
    const url = trackingUrlFor("postnl", 'a"b c&d');
    expect(url).not.toContain('"');
    expect(url).not.toContain(" ");
    expect(url).toContain("%22");
  });

  it("returns null for an unknown carrier or an empty code", () => {
    expect(trackingUrlFor("mijn-buurman", "3SBESJ1")).toBeNull();
    expect(trackingUrlFor("postnl", "   ")).toBeNull();
  });
});

describe("status labels", () => {
  it("names every status the state machine can reach", async () => {
    const { STATUS_LABELS } = await import("@/lib/fulfilment");
    for (const status of FULFILMENT_STATUSES) {
      expect(STATUS_LABELS[status], status).toBeTruthy();
    }
  });

  it("matches the order_status values the database migration defines", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const dir = "supabase/migrations";
    const sql = readdirSync(dir)
      .map((file) => readFileSync(`${dir}/${file}`, "utf8"))
      .join("\n");

    // The enum is created once; every value the app can set must exist in it,
    // or a transition fails at the database with a cryptic cast error.
    const match = /CREATE TYPE public\.order_status AS ENUM \(([^)]+)\)/i.exec(sql);
    expect(match, "order_status enum not found in migrations").toBeTruthy();
    const values = [...match![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    for (const status of FULFILMENT_STATUSES) {
      expect(values, `order_status is missing "${status}"`).toContain(status);
    }
  });
});
