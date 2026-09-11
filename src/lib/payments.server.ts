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

import { safeExternalUrl } from "./safe-url";

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
  /** The shop's own order id. Carried in metadata as the recovery path. */
  orderId: string;
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
    // Both identifiers, because the webhook has to find the order again even
    // if writing the payment reference back onto it failed. Without the id in
    // metadata, a payment created successfully but never attached is money
    // taken against an order nobody can find.
    metadata: { order_id: input.orderId, order_number: input.orderNumber },
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

  // The customer's browser is sent straight to this address, so it is checked
  // rather than trusted. Nothing suggests Mollie would return anything else;
  // the point is that a payment redirect is the last place to discover an
  // upstream response was not what it claimed to be.
  const checkoutUrl = safeExternalUrl(payment._links?.checkout?.href);
  if (!checkoutUrl) {
    throw new Error("De betaalprovider gaf geen bruikbare betaallink terug.");
  }

  return {
    configured: true,
    checkoutUrl,
    paymentReference: payment.id,
    paymentStatus: "open",
    status: "pending",
  };
}

export type StoredPaymentStatus =
  | "open"
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled"
  | "refunded"
  | "partially_refunded"
  | "chargeback";

export type StoredOrderStatus = "pending" | "paid" | "cancelled" | "refunded";

/**
 * Maps a Mollie payment status onto the shop's own.
 *
 * Every status Mollie documents is listed. The `default` this replaces swept
 * everything unrecognised into `open`, which was silent and wrong in two ways:
 * an `authorized` payment — the money is reserved — read as unpaid, and a
 * `refunded` one came back as `open`, which also reset the order to `pending`.
 * A completed, refunded order presented itself as a fresh unpaid one.
 *
 * `null` means "Mollie said something we do not recognise". The caller must
 * leave the order alone and log it, rather than guessing — guessing is what
 * the old default arm did.
 *
 * Mollie spells it "canceled"; the shop's enum spells it "cancelled". Both
 * are accepted here so a change at either end cannot silently stop matching.
 */
export function mapPaymentStatus(
  mollieStatus: string,
): { payment_status: StoredPaymentStatus; status: StoredOrderStatus } | null {
  switch (mollieStatus) {
    case "open":
      return { payment_status: "open", status: "pending" };
    case "pending":
      return { payment_status: "pending", status: "pending" };
    case "authorized":
      // Funds reserved, not yet captured. The sale is going ahead, so the
      // order moves on; the money arrives at capture.
      return { payment_status: "authorized", status: "pending" };
    case "paid":
      return { payment_status: "paid", status: "paid" };
    case "canceled":
    case "cancelled":
      return { payment_status: "cancelled", status: "cancelled" };
    case "expired":
      return { payment_status: "expired", status: "cancelled" };
    case "failed":
      return { payment_status: "failed", status: "cancelled" };
    case "refunded":
      return { payment_status: "refunded", status: "refunded" };
    case "partially_refunded":
      // Still a completed sale — part of the money came back, the order did
      // not un-happen.
      return { payment_status: "partially_refunded", status: "paid" };
    case "chargeback":
      return { payment_status: "chargeback", status: "refunded" };
    default:
      return null;
  }
}

export type FetchedPayment = {
  status: string;
  /** What the shop attached at creation. The webhook's recovery path. */
  metadata: { order_id?: string; order_number?: string } | null;
  /** Decimal string, e.g. "126.10". Checked against the order's own total. */
  amount: string | null;
  amountRefunded: string | null;
};

/** Reads a payment back from the provider — used by the webhook handler. */
export async function fetchPayment(paymentId: string): Promise<FetchedPayment | null> {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`${MOLLIE_API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    // A provider that never answers must not hold a webhook worker open.
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    console.error("[mollie] could not read payment", paymentId, response.status);
    return null;
  }

  const payment = (await response.json()) as {
    status?: string;
    metadata?: unknown;
    amount?: { value?: string };
    amountRefunded?: { value?: string };
  };

  // Metadata comes back as whatever was sent. Read it defensively: it is the
  // recovery path, and a malformed one must not throw inside the webhook.
  const metadata =
    payment.metadata && typeof payment.metadata === "object"
      ? (payment.metadata as { order_id?: string; order_number?: string })
      : null;

  return {
    status: String(payment.status ?? ""),
    metadata,
    amount: payment.amount?.value ?? null,
    amountRefunded: payment.amountRefunded?.value ?? null,
  };
}
