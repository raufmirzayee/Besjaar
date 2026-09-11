/**
 * bol.com labels the admin screen needs in the browser.
 *
 * Separate from `bol.server.ts` for the same reason `fulfilment.ts` is separate
 * from `fulfilment.server.ts`: a route file that imports the server module
 * pulls it into the client graph, and what keeps the credentials out of the
 * bundle is then only the bundler's tree-shaking rather than the module
 * boundary. It happens to work today — the built assets carry no `api.bol.com`
 * and no `BOL_CLIENT_SECRET` — but that is a property of the optimiser, not of
 * the code, and it is not the kind of thing to leave resting on an optimiser.
 */

export const JOB_TYPE_LABELS: Record<string, string> = {
  orders: "Bestellingen importeren",
  stock: "Voorraad synchroniseren",
  offers: "Aanbiedingen ophalen",
  shipments: "Verzendingen doorgeven",
  returns: "Retouren ophalen",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  pending: "In wachtrij",
  running: "Bezig",
  success: "Geslaagd",
  partial: "Deels geslaagd",
  failed: "Mislukt",
};
