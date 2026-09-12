/**
 * Admin labels and status lists, safe for the browser bundle.
 *
 * These used to live in the `.server` modules beside the queries that produce
 * the rows they label, and the admin screens imported them from there. That
 * pulls a module holding `SUPABASE_SERVICE_ROLE_KEY`, `MOLLIE_API_KEY` and
 * `BOL_CLIENT_SECRET` into the client graph, and what then keeps the
 * credentials out of the shipped bundle is the bundler's tree-shaking rather
 * than the module boundary.
 *
 * The optimiser did strip them — the built assets carry no `api.bol.com` and no
 * secret name. But that is a property of the optimiser, and one refactor that
 * makes a module harder to analyse statically is all it takes for it to stop
 * being true, silently. `server-module-boundary.test.ts` now fails the build if
 * a route reaches across again.
 *
 * `staff.ts` and `fulfilment.ts` already did this; this is the rest of it.
 */

// --- Reviews ---------------------------------------------------------------

export type ReviewStatus = "pending" | "approved" | "rejected";

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "In afwachting",
  approved: "Goedgekeurd",
  rejected: "Afgewezen",
};

// --- Products --------------------------------------------------------------

export const PRODUCT_STATUSES = [
  "draft",
  "active",
  "out_of_stock",
  "archived",
  "discontinued",
] as const;

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  draft: "Concept",
  active: "Actief",
  out_of_stock: "Uitverkocht",
  archived: "Gearchiveerd",
  discontinued: "Uit assortiment",
};

// --- Returns ---------------------------------------------------------------

export const RETURN_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "received",
  "refunded",
  "cancelled",
] as const;

export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  requested: "Aangevraagd",
  approved: "Goedgekeurd",
  rejected: "Afgewezen",
  received: "Ontvangen",
  refunded: "Terugbetaald",
  cancelled: "Geannuleerd",
};

/**
 * The reasons the return form offers.
 *
 * Stored on the row as the Dutch text the customer picked, so the storefront
 * maps them back to a translation key rather than re-deriving them.
 */
export const RETURN_REASONS = [
  "Niet tevreden / bedenktijd",
  "Verkeerd product ontvangen",
  "Product beschadigd",
  "Product defect",
  "Te laat bezorgd",
  "Anders",
] as const;

// --- Stock ledger ----------------------------------------------------------

export const MOVEMENT_REASON_LABELS: Record<string, string> = {
  website_sale: "Webshop verkoop",
  bol_sale: "bol.com verkoop",
  manual_order: "Handmatige order",
  customer_return: "Klantretour",
  supplier_receipt: "Leveranciersontvangst",
  damaged: "Beschadigd",
  lost: "Vermist",
  manual: "Handmatige correctie",
  manual_correction: "Handmatige correctie",
  order_cancelled: "Orderannulering",
  reservation: "Voorraadreservering",
  reservation_release: "Reservering vrijgegeven",
  transfer: "Overboeking",
  order: "Bestelling",
  return: "Retour",
};
