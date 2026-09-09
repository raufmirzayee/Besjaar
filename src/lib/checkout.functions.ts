import { createServerFn } from "@tanstack/react-start";
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

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: CheckoutInput) => input)
  .handler(async ({ data }) => {
    return createOrder(data, await verifiedUserId());
  });

export const getOrderByNumber = createServerFn({ method: "POST" })
  .inputValidator((input: { orderNumber: string; email: string }) => input)
  .handler(async ({ data }) => {
    return fetchOrderByNumber(data.orderNumber, data.email);
  });
