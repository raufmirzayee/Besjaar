/**
 * Store policy configuration.
 *
 * Delivery, returns and payment messaging is configuration, not copy baked into
 * components. The catalogue came from a marketplace listing, but this is an
 * independent shop: it must never repeat a fulfilment promise it cannot keep
 * (a next-day cut-off, for instance) just because the source listing did.
 *
 * Every value can be overridden per environment. Set them once fulfilment,
 * payment and carrier arrangements are confirmed — see .env.example.
 */

function envNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function envString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

const env = (key: string): string | undefined => {
  // Vite inlines VITE_* at build time; process.env covers SSR.
  const fromImport = (import.meta as { env?: Record<string, string | undefined> }).env?.[key];
  if (fromImport) return fromImport;
  if (typeof process !== "undefined") return process.env?.[key];
  return undefined;
};

export const storeConfig = {
  /** Customer-facing store identity. */
  name: "Besjaar",
  /** Legal entity behind the store, shown in admin and legal pages. */
  legalEntity: envString(env("VITE_STORE_LEGAL_ENTITY"), "EenTop"),
  email: envString(env("VITE_STORE_EMAIL"), "klantenservice@besjaar.nl"),
  phone: envString(env("VITE_STORE_PHONE"), ""),
  /** Canonical origin, used for sitemap, canonical URLs and structured data. */
  origin: envString(env("VITE_SITE_URL"), "https://www.besjaar.nl"),

  currency: "EUR",
  locale: "nl-NL",
  /** Countries the store ships to today. */
  shippingCountries: ["NL", "BE", "DE"] as const,

  shipping: {
    /** Order value from which shipping is free. 0 disables the message. */
    freeShippingThreshold: envNumber(env("VITE_FREE_SHIPPING_THRESHOLD"), 50),
    /** Flat shipping rate below the threshold. */
    rate: envNumber(env("VITE_SHIPPING_RATE"), 4.95),
    /**
     * Delivery wording. Deliberately states dispatch, not an arrival date:
     * replace this once a carrier SLA is in place.
     */
    dispatchNote: envString(env("VITE_DISPATCH_NOTE"), ""),
  },

  returns: {
    /** Statutory minimum in the EU is 14 days; 30 is the store's own policy. */
    days: envNumber(env("VITE_RETURN_DAYS"), 30),
  },

  warranty: {
    /** EU conformity period. */
    months: envNumber(env("VITE_WARRANTY_MONTHS"), 24),
  },

  payment: {
    /**
     * Methods advertised in the storefront. Keep this in step with what the
     * payment provider account actually has enabled — advertising a method
     * that is not live is a broken promise at checkout.
     */
    methods: ["iDEAL", "Bancontact", "Creditcard"],
    /** Live payments stay off until a provider API key is configured. */
    enabled: Boolean(env("VITE_PAYMENTS_ENABLED")),
  },
} as const;

export type StoreConfig = typeof storeConfig;
