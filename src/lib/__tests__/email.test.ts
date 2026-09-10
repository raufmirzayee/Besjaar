import { describe, expect, it } from "vitest";

import { isEmailConfigured, renderEmail, type OrderEmailData } from "@/lib/email.server";

const baseOrder: OrderEmailData = {
  orderNumber: "BJ-2026-0042",
  firstName: "Sanne",
  email: "sanne@example.nl",
  items: [
    { name: "RYNEX Zaklamp 1000 lumen", quantity: 2, lineTotal: 39.9 },
    { name: 'LYNEX Neusstrips 30 stuks <script>alert("x")</script>', quantity: 1, lineTotal: 8.95 },
  ],
  subtotal: 48.85,
  shippingCost: 0,
  total: 48.85,
  shippingAddress: {
    first_name: "Sanne",
    last_name: "de Vries",
    street: "Kerkstraat",
    house_number: "12",
    house_number_addition: "B",
    postal_code: "1017 GC",
    city: "Amsterdam",
    country: "Nederland",
  },
  shippingMethodName: "Standaard bezorging",
};

describe("renderEmail", () => {
  it("renders the order confirmation with number, items and address", () => {
    const { subject, html } = renderEmail("order_confirmation", baseOrder);

    expect(subject).toBe("Bestelling BJ-2026-0042 ontvangen");
    expect(html).toContain("Sanne");
    expect(html).toContain("BJ-2026-0042");
    expect(html).toContain("RYNEX Zaklamp 1000 lumen");
    expect(html).toContain("Kerkstraat");
    expect(html).toContain("1017 GC");
    expect(html).toContain("Standaard bezorging");
  });

  it("formats money in Dutch euros and shows free shipping as free", () => {
    const { html } = renderEmail("order_confirmation", baseOrder);
    // nl-NL uses a comma decimal separator and a non-breaking space after €.
    expect(html).toMatch(/€\s?48,85/);
    expect(html).toContain("Gratis");
  });

  it("charges shipping when it is not free", () => {
    const { html } = renderEmail("order_confirmation", {
      ...baseOrder,
      shippingCost: 4.95,
      total: 53.8,
    });
    expect(html).not.toContain("Gratis");
    expect(html).toMatch(/€\s?4,95/);
  });

  it("escapes customer and product text so it cannot inject markup", () => {
    const { html } = renderEmail("order_confirmation", baseOrder);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("does not claim payment was taken when payment is still pending", () => {
    const pending = renderEmail("order_confirmation", { ...baseOrder, paymentPending: true });
    expect(pending.html).toContain("Zodra je betaling is bevestigd");
    // The confirmation never asserts a payment that the provider has not
    // confirmed; that is what payment_received is for.
    expect(pending.subject).not.toMatch(/betaal|betaling/i);

    const notPending = renderEmail("order_confirmation", baseOrder);
    expect(notPending.html).not.toContain("Zodra je betaling is bevestigd");
  });

  it("links the statutory withdrawal form from the confirmation", () => {
    const { html } = renderEmail("order_confirmation", baseOrder);
    expect(html).toContain("/herroeping");
  });

  it("renders the shipped mail with carrier, code and tracking link", () => {
    const { subject, html } = renderEmail("order_shipped", {
      ...baseOrder,
      carrier: "postnl",
      trackingCode: "3SBESJ1234567",
      trackingUrl: "https://jouw.postnl.nl/track-and-trace/3SBESJ1234567",
    });

    expect(subject).toBe("Je bestelling BJ-2026-0042 is verzonden");
    expect(html).toContain("3SBESJ1234567");
    expect(html).toContain("https://jouw.postnl.nl/track-and-trace/3SBESJ1234567");
  });

  it("omits the tracking block when there is no code, rather than inventing one", () => {
    const { html } = renderEmail("order_shipped", baseOrder);
    expect(html).not.toContain("Track &amp; trace");
    expect(html).not.toContain("Volg je pakket");
  });

  it("renders the payment and cancellation mails", () => {
    expect(renderEmail("payment_received", baseOrder).subject).toBe(
      "Betaling ontvangen voor BJ-2026-0042",
    );
    expect(renderEmail("order_cancelled", baseOrder).subject).toBe(
      "Bestelling BJ-2026-0042 geannuleerd",
    );
  });

  it("promises no delivery date anywhere", () => {
    for (const template of [
      "order_confirmation",
      "payment_received",
      "order_shipped",
      "order_cancelled",
    ] as const) {
      const { html } = renderEmail(template, baseOrder);
      expect(html).not.toMatch(/morgen in huis|voor 23:59|volgende dag/i);
    }
  });
});

describe("isEmailConfigured", () => {
  const snapshot = { ...process.env };
  const reset = () => {
    process.env = { ...snapshot };
  };

  it("is off when no API key is set", () => {
    reset();
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    expect(isEmailConfigured()).toBe(false);
  });

  it("is off when the key is set but no sender is", () => {
    reset();
    process.env.RESEND_API_KEY = "re_test";
    delete process.env.EMAIL_FROM;
    expect(isEmailConfigured()).toBe(false);
    reset();
  });

  it("is on once both key and sender are set", () => {
    reset();
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "Besjaar <bestellingen@besjaar.nl>";
    process.env.EMAIL_PROVIDER = "resend";
    expect(isEmailConfigured()).toBe(true);
    reset();
  });

  it("stays off when the provider is explicitly disabled", () => {
    reset();
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "Besjaar <bestellingen@besjaar.nl>";
    process.env.EMAIL_PROVIDER = "none";
    expect(isEmailConfigured()).toBe(false);
    reset();
  });
});
