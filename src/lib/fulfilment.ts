/**
 * Order fulfilment — the pure parts.
 *
 * Status rules, carrier tables and the order shape live here because the admin
 * screen needs them in the browser. The database work stays in
 * `fulfilment.server.ts`, which route files must never import.
 */

export const FULFILMENT_STATUSES = [
  "pending",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type FulfilmentStatus = (typeof FULFILMENT_STATUSES)[number];

/** Dutch labels for the statuses, for the admin screen and the audit trail. */
export const STATUS_LABELS: Record<FulfilmentStatus, string> = {
  pending: "In afwachting",
  paid: "Betaald",
  processing: "In behandeling",
  packed: "Ingepakt",
  shipped: "Verzonden",
  delivered: "Bezorgd",
  cancelled: "Geannuleerd",
  refunded: "Terugbetaald",
};

/** Carrier track-and-trace URL templates, `{code}` replaced with the code. */
const TRACKING_URLS: Record<string, string> = {
  postnl: "https://jouw.postnl.nl/track-and-trace/{code}",
  dhl: "https://www.dhl.com/nl-nl/home/tracking.html?tracking-id={code}",
  dpd: "https://tracking.dpd.de/status/nl_NL/parcel/{code}",
  ups: "https://www.ups.com/track?tracknum={code}",
  gls: "https://gls-group.eu/NL/nl/pakket-volgen?match={code}",
};

export function trackingUrlFor(carrier: string, code: string): string | null {
  const template = TRACKING_URLS[carrier.trim().toLowerCase()];
  if (!template || !code.trim()) return null;
  return template.replace("{code}", encodeURIComponent(code.trim()));
}

export const CARRIERS = Object.keys(TRACKING_URLS);

export const CARRIER_LABELS: Record<string, string> = {
  postnl: "PostNL",
  dhl: "DHL",
  dpd: "DPD",
  ups: "UPS",
  gls: "GLS",
};

/**
 * Which transitions are allowed. Prevents an order jumping from pending
 * straight to delivered, or moving on after it was cancelled or refunded.
 */
export const ALLOWED_NEXT: Record<FulfilmentStatus, FulfilmentStatus[]> = {
  pending: ["paid", "processing", "cancelled"],
  paid: ["processing", "packed", "shipped", "cancelled", "refunded"],
  processing: ["packed", "shipped", "cancelled", "refunded"],
  packed: ["shipped", "processing", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: string, to: string): boolean {
  const allowed = ALLOWED_NEXT[from as FulfilmentStatus];
  return Array.isArray(allowed) && allowed.includes(to as FulfilmentStatus);
}

export function nextStatuses(from: string): FulfilmentStatus[] {
  return ALLOWED_NEXT[from as FulfilmentStatus] ?? [];
}

/** Address values come back from Postgres JSON, so they are plain strings. */
export type OrderAddress = Record<string, string | null>;

export type OrderDetail = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_reference: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  shipping_address: OrderAddress;
  billing_address: OrderAddress;
  shipping_method_name: string | null;
  carrier: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  customer_note: string | null;
  subtotal: number;
  shipping_cost: number;
  vat_amount: number;
  total: number;
  created_at: string;
  items: {
    product_id: string | null;
    product_name: string;
    product_slug: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
  history: { status: string; note: string | null; created_at: string }[];
  emails: { template: string; status: string; created_at: string; error: string | null }[];
};

export type TransitionResult = {
  status: FulfilmentStatus;
  emailSent: boolean;
  emailSkipped: boolean;
  emailError: string | null;
};

export const RESENDABLE_TEMPLATES = [
  "order_confirmation",
  "payment_received",
  "order_shipped",
] as const;

export type ResendableTemplate = (typeof RESENDABLE_TEMPLATES)[number];

export const EMAIL_LABELS: Record<string, string> = {
  order_confirmation: "Bestelbevestiging",
  payment_received: "Betaling ontvangen",
  order_shipped: "Verzonden",
  order_cancelled: "Geannuleerd",
};
