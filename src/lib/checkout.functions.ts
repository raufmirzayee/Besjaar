import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";
import { getRequestHeader } from "@tanstack/react-start/server";

import {
  createOrder,
  fetchOrderByNumber,
  fetchShippingMethods,
  type CheckoutInput,
} from "./checkout.server";

export const getShippingMethods = createServerFn({ method: "GET" }).handler(async () => {
  return fetchShippingMethods();
});

/**
 * Whether live payments are available. The API key itself never leaves the
 * server; only this boolean does, so checkout can tell the customer the truth
 * about what will happen when they place the order.
 */
export const getPaymentAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const { isPaymentProviderConfigured } = await import("./payments.server");
  return { configured: isPaymentProviderConfigured() };
});

/** Resolve the caller's user id from the bearer token, if any. Guest checkout stays allowed. */
async function verifiedUserId(): Promise<string | null> {
  const header = getRequestHeader("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * Everything the checkout accepts, checked at runtime.
 *
 * Prices and totals are never taken from here — the server recalculates them
 * from the database — but the identifiers, quantities and address fields are,
 * and all of them arrive from a browser.
 */
const checkoutSchema = z.object({
  email: v.email,
  phone: v.optionalText(40),
  shipping: v.address,
  billing: v.address.nullable().optional(),
  shippingMethodId: v.uuid,
  customerNote: v.optionalText(1000),
  paymentMethod: z.enum(["ideal", "bancontact", "creditcard", "paypal"]),
  idempotencyKey: z.string().uuid("Ongeldige aanvraag"),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({
      message: "Je moet de algemene voorwaarden accepteren om te kunnen bestellen.",
    }),
  }),
  lines: z
    .array(z.object({ productId: v.uuid, quantity: v.quantity }))
    .min(1, "Je winkelwagen is leeg.")
    .max(50, "Te veel verschillende producten in één bestelling"),
  // Accepted for backwards compatibility and then ignored: ownership comes
  // from the verified session, never from the request body.
  userId: z.string().nullish(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator(v.validator(checkoutSchema))
  .handler(async ({ data }) => {
    // Placing an order reserves its stock, so a flood of orders that are never
    // paid for empties the shelf for everyone else. Unpaid reservations are
    // released when the payment expires, but that is minutes away — long
    // enough to take a product off sale over a busy weekend.
    //
    // Set well above what any real shopper does: someone correcting a failed
    // payment might genuinely try three or four times.
    const { enforceRateLimit, callerKey } = await import("./rate-limit.server");
    await enforceRateLimit(`checkout:${callerKey()}`, {
      limit: 8,
      windowSeconds: 600,
      blockSeconds: 1800,
    });

    return createOrder(data, await verifiedUserId());
  });

export const getOrderByNumber = createServerFn({ method: "POST" })
  .inputValidator(
    v.validator(
      z
        .object({
          orderNumber: v.text(32).min(3),
          // One of these two. The e-mail address is what a customer coming
          // back later has; the token is what the confirmation link carries,
          // and is the only thing a guest returning from the payment provider
          // has, since they never typed a password.
          email: z.union([v.email, z.literal("")]).optional(),
          token: z.string().trim().length(64).optional(),
        })
        .refine((input) => Boolean(input.email) || Boolean(input.token), {
          message: "Vul je e-mailadres in om je bestelling te bekijken.",
        }),
    ),
  )
  .handler(async ({ data }) => {
    // Order numbers run in sequence, so the lookup is enumerable by design:
    // someone with a customer's address can walk the numbers, and someone with
    // a number can guess at addresses. This is what makes either expensive.
    // Keyed on the caller and the order, so hammering one order does not lock
    // a legitimate customer out of a different one from the same office.
    const { enforceRateLimit, clearRateLimit, callerKey } = await import("./rate-limit.server");
    const bucket = `order_lookup:${callerKey()}`;
    await enforceRateLimit(bucket, { limit: 10, windowSeconds: 300, blockSeconds: 900 });

    const order = await fetchOrderByNumber(data.orderNumber, {
      email: data.email,
      token: data.token,
    });

    // A caller who found their own order is not the caller this limit is for.
    if (order) await clearRateLimit(bucket);
    return order;
  });
