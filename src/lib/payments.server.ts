/**
 * Payment provider integration (Mollie).
 *
 * The integration is complete but stays inert until MOLLIE_API_KEY is set.
 * Crucially, an order is never marked paid unless the provider says so:
 * without a key the order is created with payment_status "pending" and the
 * customer is told payment is not yet available, rather than being shown a
 * fake success.
 *
 * Required environment variables (see .env.example):
 *   MOLLIE_API_KEY   test_… or live_… — server-side only, never exposed
 *   MOLLIE_WEBHOOK_URL  public https URL Mollie calls on status changes
 *   VITE_SITE_URL    used to build the customer redirect URL
 */

const MOLLIE_API = "https://api.mollie.com/v2";

/** Mollie payment method ids for the methods the storefront offers. */
const METHOD_MAP: Record<string, string | undefined> = {
  ideal: "ideal",
  bancontact: "bancontact",
  creditcard: "creditcard",
  card: "creditcard",
};

export type PaymentInitResult =
  | {
      configured: true;
      /** Where the customer must be sent to complete payment. */
      checkoutUrl: string;
      paymentReference: string;
      /** public.payment_status enum value. */
      paymentStatus: "open";
      /** public.order_status enum value. */
      status: "pending";
    }
  | {
      configured: false;
      checkoutUrl: null;
      paymentReference: null;
      /** No provider is connected, so no money has moved. */
      paymentStatus: "open";
      status: "pending";
    };

export function isPaymentProviderConfigured(): boolean {
  return Boolean(process.env.MOLLIE_API_KEY);
}

/**
 * Creates a payment at the provider and returns where to send the customer.
 *
 * Returns `configured: false` when no API key is present. The caller must then
 * leave the order unpaid — never simulate a successful payment.
 */
export async function createPayment(input: {
  orderNumber: string;
  amount: number;
  method: string;
  description: string;
  redirectUrl: string;
}): Promise<PaymentInitResult> {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    return {
      configured: false,
      checkoutUrl: null,
      paymentReference: null,
      paymentStatus: "open",
      status: "pending",
    };
  }

  const body: Record<string, unknown> = {
    amount: { currency: "EUR", value: input.amount.toFixed(2) },
    description: input.description,
    redirectUrl: input.redirectUrl,
    metadata: { order_number: input.orderNumber },
  };

  const method = METHOD_MAP[input.method.toLowerCase()];
  if (method) body.method = method;
  if (process.env.MOLLIE_WEBHOOK_URL) body.webhookUrl = process.env.MOLLIE_WEBHOOK_URL;

  const response = await fetch(`${MOLLIE_API}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    // The provider's raw error is logged server-side but not shown to the
    // customer, so nothing about the account leaks into the browser.
    console.error("[mollie] payment creation failed:", response.status, detail.slice(0, 500));
    throw new Error("De betaling kon niet worden gestart. Probeer het opnieuw.");
  }

  const payment = (await response.json()) as {
    id: string;
    _links?: { checkout?: { href?: string } };
  };

  const checkoutUrl = payment._links?.checkout?.href;
  if (!checkoutUrl) {
    throw new Error("De betaalprovider gaf geen betaallink terug.");
  }

  return {
    configured: true,
    checkoutUrl,
    paymentReference: payment.id,
    paymentStatus: "open",
    status: "pending",
  };
}

/** Maps a Mollie payment status onto the store's own order/payment status. */
export function mapPaymentStatus(mollieStatus: string): {
  payment_status: "open" | "paid" | "failed" | "expired" | "cancelled" | "refunded";
  status: "pending" | "paid" | "cancelled" | "refunded";
} {
  switch (mollieStatus) {
    case "paid":
      return { payment_status: "paid", status: "paid" };
    case "canceled":
      return { payment_status: "cancelled", status: "cancelled" };
    case "expired":
      return { payment_status: "expired", status: "cancelled" };
    case "failed":
      return { payment_status: "failed", status: "cancelled" };
    default:
      return { payment_status: "open", status: "pending" };
  }
}

/** Reads a payment back from the provider — used by the webhook handler. */
export async function fetchPayment(paymentId: string): Promise<{ status: string } | null> {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`${MOLLIE_API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    console.error("[mollie] could not read payment", paymentId, response.status);
    return null;
  }
  return (await response.json()) as { status: string };
}
