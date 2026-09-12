/**
 * What each setting is, and what counts as a valid value.
 *
 * One schema, used in three places: the admin form validates against it before
 * submitting, the server validates against it again before writing, and the
 * reader uses it to know a setting's type and its fallback. Three copies of
 * "a free-shipping threshold is a non-negative number under a million" is three
 * places for them to disagree.
 *
 * Client-safe on purpose. It describes the *shape* of configuration — never a
 * value, and never a credential. A credential is not a setting and cannot be
 * expressed here at all.
 */

import { z } from "zod";

/**
 * What a setting's value may be.
 *
 * Deliberately narrower than `unknown`: these values cross the server/client
 * boundary, so the type has to say they are JSON. `unknown` compiles and then
 * fails at the serializer, which is a worse place to find out.
 */
export type SettingValue = string | number | boolean | null | string[];

/**
 * Where a resolved value came from. The admin shows this beside each field, so
 * a shop owner can tell a value they chose from one the deployment supplied.
 */
export type SettingSource = "database" | "environment" | "default";

export type ResolvedSetting = {
  key: string;
  value: SettingValue;
  source: SettingSource;
  updatedAt: string | null;
};

export type SettingValues = Record<string, SettingValue>;

export type SaveResult =
  { ok: true; saved: string[] } | { ok: false; errors: Record<string, string> };

export const SETTING_CATEGORIES = [
  "general",
  "company",
  "commerce",
  "payments",
  "shipping",
  "email",
  "translations",
  "seo",
  "integrations",
  "system",
] as const;

export type SettingCategory = (typeof SETTING_CATEGORIES)[number];

/** Checkout can be off, taking test payments, or taking real money. */
export const CHECKOUT_MODES = ["disabled", "test", "live"] as const;
export type CheckoutMode = (typeof CHECKOUT_MODES)[number];

const httpsUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => {
    if (!value) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Moet een volledig https-adres zijn");

const optionalText = (max: number) => z.string().trim().max(max);
const money = z.number().finite().nonnegative().max(1_000_000);
const wholeDays = z.number().int().min(0).max(3650);

/** A Dutch KvK number is eight digits. Empty is allowed: not every shop has one yet. */
const kvk = z
  .string()
  .trim()
  .max(20)
  .refine((v) => v === "" || /^\d{8}$/.test(v), "Een KvK-nummer bestaat uit 8 cijfers");

/** NL999999999B99 and the other EU formats: two letters then 2-13 alphanumerics. */
const vat = z
  .string()
  .trim()
  .max(20)
  .refine(
    (v) => v === "" || /^[A-Z]{2}[0-9A-Z]{2,13}$/.test(v.toUpperCase()),
    "Ongeldig btw-nummer",
  );

const postalCode = z
  .string()
  .trim()
  .max(12)
  .refine((v) => v === "" || /^[0-9A-Za-z][0-9A-Za-z -]{2,10}$/.test(v), "Ongeldige postcode");

const emailOrEmpty = z
  .string()
  .trim()
  .max(255)
  .refine((v) => v === "" || z.string().email().safeParse(v).success, "Ongeldig e-mailadres");

/**
 * A sender in either plain or display form: `shop@example.com` or
 * `Besjaar <shop@example.com>`. Resend accepts both and shop owners type both.
 */
const senderAddress = z
  .string()
  .trim()
  .max(255)
  .refine((v) => {
    if (v === "") return true;
    const match = /<([^>]+)>\s*$/.exec(v);
    return z
      .string()
      .email()
      .safeParse(match ? match[1].trim() : v).success;
  }, "Gebruik een e-mailadres, eventueel als: Naam <adres@domein.nl>");

/** A public analytics identifier, not a credential: G-XXXX, or digits for Meta. */
const analyticsId = z
  .string()
  .trim()
  .max(40)
  .refine((v) => v === "" || /^[A-Za-z0-9_-]+$/.test(v), "Alleen letters, cijfers, - en _");

export type SettingDefinition = {
  key: string;
  category: SettingCategory;
  schema: z.ZodTypeAny;
  /** Readable by anonymous visitors. Set here, never by whoever edits it. */
  isPublic: boolean;
  /**
   * The environment variable this used to be, if any. Read when no database
   * row has been saved yet, so an installation running today keeps its values.
   */
  envKey?: string;
  /** The last resort, when neither a row nor an environment variable exists. */
  fallback: SettingValue;
  /**
   * Changing this needs `settings:manage_settings` rather than `settings:edit`.
   *
   * A write-side flag, not a read-side one: it is independent of `isPublic`,
   * and two settings are deliberately both. Whether checkout is live and
   * whether the shop may be indexed are facts any visitor can observe from the
   * storefront — there is nothing to hide — but changing either is a decision
   * with consequences, so the write is what gets protected.
   */
  sensitive?: boolean;
};

function define(definitions: SettingDefinition[]): Record<string, SettingDefinition> {
  const byKey: Record<string, SettingDefinition> = {};
  for (const definition of definitions) byKey[definition.key] = definition;
  return byKey;
}

export const SETTINGS: Record<string, SettingDefinition> = define([
  // --- General -------------------------------------------------------------
  {
    key: "general.site_url",
    category: "general",
    schema: httpsUrl,
    isPublic: true,
    envKey: "VITE_SITE_URL",
    fallback: "https://www.besjaar.nl",
  },
  {
    key: "general.store_name",
    category: "general",
    schema: optionalText(80),
    isPublic: true,
    fallback: "Besjaar",
  },
  {
    key: "general.default_language",
    category: "general",
    schema: z.enum(["nl", "en", "de", "fr"]),
    isPublic: true,
    fallback: "nl",
  },
  {
    key: "general.timezone",
    category: "general",
    schema: optionalText(60),
    isPublic: false,
    fallback: "Europe/Amsterdam",
  },

  // --- Company -------------------------------------------------------------
  // Every one of these is a legal fact about a real business. The fallbacks are
  // empty strings rather than invented placeholders: a KvK number that is not
  // the shop's own would be a false statement on a page that must be true.
  {
    key: "company.legal_entity",
    category: "company",
    schema: optionalText(120),
    isPublic: true,
    envKey: "VITE_STORE_LEGAL_ENTITY",
    fallback: "EenTop",
  },
  {
    key: "company.legal_name",
    category: "company",
    schema: optionalText(160),
    isPublic: true,
    envKey: "VITE_COMPANY_LEGAL_NAME",
    fallback: "",
  },
  {
    key: "company.kvk",
    category: "company",
    schema: kvk,
    isPublic: true,
    envKey: "VITE_COMPANY_KVK",
    fallback: "",
  },
  {
    key: "company.vat",
    category: "company",
    schema: vat,
    isPublic: true,
    envKey: "VITE_COMPANY_VAT",
    fallback: "",
  },
  {
    key: "company.street",
    category: "company",
    schema: optionalText(160),
    isPublic: true,
    envKey: "VITE_COMPANY_STREET",
    fallback: "",
  },
  {
    key: "company.postal_code",
    category: "company",
    schema: postalCode,
    isPublic: true,
    envKey: "VITE_COMPANY_POSTAL_CODE",
    fallback: "",
  },
  {
    key: "company.city",
    category: "company",
    schema: optionalText(80),
    isPublic: true,
    envKey: "VITE_COMPANY_CITY",
    fallback: "",
  },
  {
    key: "company.country",
    category: "company",
    schema: optionalText(60),
    isPublic: true,
    envKey: "VITE_COMPANY_COUNTRY",
    fallback: "Nederland",
  },
  {
    key: "company.support_email",
    category: "company",
    schema: emailOrEmpty,
    isPublic: true,
    envKey: "VITE_STORE_EMAIL",
    fallback: "klantenservice@besjaar.nl",
  },
  {
    key: "company.support_phone",
    category: "company",
    schema: optionalText(40),
    isPublic: true,
    envKey: "VITE_STORE_PHONE",
    fallback: "",
  },

  // --- Commerce ------------------------------------------------------------
  {
    key: "commerce.return_days",
    category: "commerce",
    schema: wholeDays,
    isPublic: true,
    envKey: "VITE_RETURN_DAYS",
    fallback: 30,
  },
  {
    key: "commerce.warranty_months",
    category: "commerce",
    schema: z.number().int().min(0).max(600),
    isPublic: true,
    envKey: "VITE_WARRANTY_MONTHS",
    fallback: 24,
  },
  {
    key: "commerce.low_stock_threshold",
    category: "commerce",
    schema: z.number().int().min(0).max(10_000),
    isPublic: false,
    fallback: 5,
  },
  {
    key: "commerce.guest_checkout",
    category: "commerce",
    schema: z.boolean(),
    isPublic: true,
    fallback: true,
  },
  {
    key: "commerce.reviews_enabled",
    category: "commerce",
    schema: z.boolean(),
    isPublic: true,
    fallback: true,
  },
  {
    key: "commerce.wishlist_enabled",
    category: "commerce",
    schema: z.boolean(),
    isPublic: true,
    fallback: true,
  },
  {
    key: "commerce.newsletter_enabled",
    category: "commerce",
    schema: z.boolean(),
    isPublic: true,
    fallback: true,
  },
  {
    key: "commerce.returns_enabled",
    category: "commerce",
    schema: z.boolean(),
    isPublic: true,
    fallback: true,
  },

  // --- Payments ------------------------------------------------------------
  // `sensitive` on the mode is what puts a confirmation dialog in front of
  // switching on real money.
  {
    key: "payments.mode",
    category: "payments",
    schema: z.enum(CHECKOUT_MODES),
    isPublic: true,
    envKey: "CHECKOUT_MODE",
    fallback: "disabled",
    sensitive: true,
  },
  {
    key: "payments.webhook_url",
    category: "payments",
    schema: httpsUrl,
    isPublic: false,
    envKey: "MOLLIE_WEBHOOK_URL",
    fallback: "",
  },
  // Written by the server when live mode is approved, never by a form.
  {
    key: "payments.live_approved_at",
    category: "payments",
    schema: z.string().max(40),
    isPublic: false,
    fallback: "",
  },
  {
    key: "payments.live_approved_by",
    category: "payments",
    schema: z.string().max(80),
    isPublic: false,
    fallback: "",
  },

  // --- Shipping ------------------------------------------------------------
  {
    key: "shipping.free_threshold",
    category: "shipping",
    schema: money,
    isPublic: true,
    envKey: "VITE_FREE_SHIPPING_THRESHOLD",
    fallback: 50,
  },
  {
    key: "shipping.default_rate",
    category: "shipping",
    schema: money,
    isPublic: true,
    envKey: "VITE_SHIPPING_RATE",
    fallback: 4.95,
  },
  {
    key: "shipping.dispatch_note",
    category: "shipping",
    schema: optionalText(200),
    isPublic: true,
    envKey: "VITE_DISPATCH_NOTE",
    fallback: "",
  },

  // --- E-mail --------------------------------------------------------------
  {
    key: "email.provider",
    category: "email",
    schema: z.enum(["resend", "none"]),
    isPublic: false,
    envKey: "EMAIL_PROVIDER",
    fallback: "resend",
  },
  {
    key: "email.from",
    category: "email",
    schema: senderAddress,
    isPublic: false,
    envKey: "EMAIL_FROM",
    fallback: "",
  },
  {
    key: "email.reply_to",
    category: "email",
    schema: emailOrEmpty,
    isPublic: false,
    envKey: "EMAIL_REPLY_TO",
    fallback: "",
  },

  // --- Translations --------------------------------------------------------
  {
    key: "translations.endpoint",
    category: "translations",
    schema: z.enum(["free", "pro"]),
    isPublic: false,
    fallback: "free",
  },
  {
    key: "translations.auto_on_create",
    category: "translations",
    schema: z.boolean(),
    isPublic: false,
    fallback: true,
  },
  {
    key: "translations.auto_on_update",
    category: "translations",
    schema: z.boolean(),
    isPublic: false,
    fallback: false,
  },
  {
    key: "translations.keep_manual",
    category: "translations",
    schema: z.boolean(),
    isPublic: false,
    fallback: true,
  },

  // --- SEO -----------------------------------------------------------------
  {
    key: "seo.title_suffix",
    category: "seo",
    schema: optionalText(60),
    isPublic: true,
    fallback: "Besjaar",
  },
  {
    key: "seo.default_description",
    category: "seo",
    schema: optionalText(300),
    isPublic: true,
    fallback: "",
  },
  { key: "seo.og_image", category: "seo", schema: httpsUrl, isPublic: true, fallback: "" },
  {
    key: "seo.indexing_enabled",
    category: "seo",
    schema: z.boolean(),
    isPublic: true,
    fallback: true,
    // Turning this off removes the shop from search results entirely.
    sensitive: true,
  },

  // --- Integrations --------------------------------------------------------
  {
    key: "integrations.ga_measurement_id",
    category: "integrations",
    schema: analyticsId,
    isPublic: true,
    envKey: "VITE_GA_MEASUREMENT_ID",
    fallback: "",
  },
  {
    key: "integrations.meta_pixel_id",
    category: "integrations",
    schema: analyticsId,
    isPublic: true,
    envKey: "VITE_META_PIXEL_ID",
    fallback: "",
  },
  {
    key: "integrations.bol_auto_sync",
    category: "integrations",
    schema: z.boolean(),
    isPublic: false,
    fallback: false,
  },

  // --- System --------------------------------------------------------------
  {
    key: "system.setup_completed_steps",
    category: "system",
    schema: z.array(z.string().max(40)).max(40),
    isPublic: false,
    fallback: [],
  },
  {
    key: "system.setup_dismissed",
    category: "system",
    schema: z.boolean(),
    isPublic: false,
    fallback: false,
  },
]);

export const SETTING_KEYS = Object.keys(SETTINGS);

export function settingsInCategory(category: SettingCategory): SettingDefinition[] {
  return SETTING_KEYS.map((key) => SETTINGS[key]).filter((s) => s.category === category);
}

/** The keys an anonymous visitor may receive. */
export const PUBLIC_SETTING_KEYS = SETTING_KEYS.filter((key) => SETTINGS[key].isPublic);

/**
 * Validates a value against its key's schema.
 *
 * Returns a result rather than throwing so the caller decides what to do with
 * a bad value — the form shows it beside the field, the server refuses the
 * whole save.
 */
export function validateSetting(
  key: string,
  value: unknown,
): { ok: true; value: SettingValue } | { ok: false; error: string } {
  const definition = SETTINGS[key];
  if (!definition) return { ok: false, error: `Onbekende instelling: ${key}` };

  const parsed = definition.schema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ongeldige waarde" };
  }
  return { ok: true, value: parsed.data as SettingValue };
}

/**
 * Settings the application maintains for itself.
 *
 * They live in the same table because they are configuration, but no form
 * renders them: `payments.live_approved_at` is written by the approval step and
 * an editable copy of it would be a way to forge an approval.
 */
export const INTERNAL_SETTING_KEYS = [
  "payments.live_approved_at",
  "payments.live_approved_by",
  "system.setup_completed_steps",
  "system.setup_dismissed",
];

/** The settings a person edits, in the order the form shows them. */
export function editableSettings(category: SettingCategory): SettingDefinition[] {
  return settingsInCategory(category).filter(
    (definition) => !INTERNAL_SETTING_KEYS.includes(definition.key),
  );
}

/** Which control a field gets. Derived, so a new setting needs no extra entry. */
export type SettingControl =
  | { kind: "switch" }
  | { kind: "number" }
  | { kind: "select"; options: string[] }
  | { kind: "textarea" }
  | { kind: "text" };

const MULTILINE_KEYS = ["seo.default_description", "shipping.dispatch_note"];

export function controlFor(definition: SettingDefinition): SettingControl {
  // An enum is the one case worth asking the schema about: it carries the
  // options, so a select stays in step with what validation will accept.
  const options = (definition.schema as { options?: unknown }).options;
  if (Array.isArray(options) && options.every((option) => typeof option === "string")) {
    return { kind: "select", options: options as string[] };
  }
  if (typeof definition.fallback === "boolean") return { kind: "switch" };
  if (typeof definition.fallback === "number") return { kind: "number" };
  if (MULTILINE_KEYS.includes(definition.key)) return { kind: "textarea" };
  return { kind: "text" };
}
