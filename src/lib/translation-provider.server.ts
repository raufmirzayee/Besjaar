/**
 * Machine translation, behind an interface.
 *
 * The shop sells in four languages, and a shopkeeper writing a product
 * description in Dutch should not have to write it three more times. This is
 * the boundary between "translate these strings" and whichever service
 * actually does it.
 *
 * Three rules shape everything here.
 *
 * The credential is server-only. This module is `.server.ts` and is imported
 * only from other server modules, so the key cannot reach the browser bundle;
 * there is a test that fails the build if it ever does.
 *
 * Without a key, nothing is invented. Product creation keeps working, the
 * fields are recorded as awaiting translation, and the admin says so. A
 * fabricated translation is worse than a missing one: it is wrong in a
 * language nobody in the office can check.
 *
 * Nothing is translated on a page request. Translations are written to the
 * database once and read from there, so a shopper never waits on an external
 * service and an outage cannot take the storefront down.
 */

import type { Locale } from "./locale-detect";

export type TranslationRequest = {
  /** Field name to source text. Only fields that should be translated. */
  fields: Record<string, string>;
  from: Locale;
  to: Locale;
};

export type TranslationResult = {
  /** Field name to translated text. A field the provider could not do is absent. */
  fields: Record<string, string>;
};

export interface TranslationProvider {
  /** Recorded on the row, so a bad batch can be traced to who produced it. */
  readonly name: string;
  translate(request: TranslationRequest): Promise<TranslationResult>;
}

/**
 * Fields that must never be sent to a translator.
 *
 * A translator will happily "translate" a model number, turn 1002026 into
 * 1.002.026, or localise a URL's path — each of which silently breaks a
 * product. The rule is an allowlist of what may go, not a blocklist of what
 * may not, so a column added later is excluded until someone decides
 * otherwise.
 */
export const NEVER_TRANSLATE = [
  "id",
  "slug",
  "sku",
  "internal_sku",
  "supplier_sku",
  "ean",
  "bol_product_id",
  "product_id",
  "variant_id",
  "image_url",
  "logo_url",
  "source_url",
  "url",
  "price",
  "regular_price",
  "sale_price",
  "purchase_cost",
  "vat_rate",
  "weight",
  "length",
  "width",
  "height",
  "specifications",
  "model",
  "model_number",
] as const;

/** The fields that DO get translated, per entity. An allowlist by design. */
export const TRANSLATABLE_FIELDS = {
  product: ["name", "short_description", "full_description", "seo_title", "seo_description"],
  category: ["name", "description", "seo_title", "seo_description"],
  // A brand name is a proper noun. RYNEX is RYNEX in every language.
  brand: ["description", "seo_title", "seo_description"],
} as const satisfies Record<string, readonly string[]>;

export type TranslatableEntity = keyof typeof TRANSLATABLE_FIELDS;

/** DeepL's language codes are not always the bare ISO code. */
const DEEPL_TARGET: Record<Locale, string> = {
  nl: "NL",
  // DeepL requires a variant for English targets and rejects a bare "EN".
  en: "EN-GB",
  de: "DE",
  fr: "FR",
};

const DEEPL_SOURCE: Record<Locale, string> = { nl: "NL", en: "EN", de: "DE", fr: "FR" };

/**
 * DeepL. Chosen because its Dutch, German and French are the best available
 * for retail copy, and because it has a free tier a small shop can start on.
 */
class DeepLProvider implements TranslationProvider {
  readonly name = "deepl";

  // `#` rather than TypeScript's `private`, which is erased at compile time
  // and leaves the key an ordinary enumerable property: JSON.stringify() on
  // the provider — in a log line, an error report, a breadcrumb — would print
  // the credential. A `#` field is genuinely private at runtime and does not
  // serialise.
  readonly #apiKey: string;
  readonly #endpoint: string;

  constructor(apiKey: string, endpoint: string) {
    this.#apiKey = apiKey;
    this.#endpoint = endpoint;
  }

  async translate({ fields, from, to }: TranslationRequest): Promise<TranslationResult> {
    const names = Object.keys(fields);
    if (names.length === 0) return { fields: {} };

    const body = new URLSearchParams();
    // One request for the whole batch: DeepL preserves order, and a request
    // per field would burn the quota and the rate limit for no benefit.
    for (const name of names) body.append("text", fields[name]);
    body.set("source_lang", DEEPL_SOURCE[from]);
    body.set("target_lang", DEEPL_TARGET[to]);
    // Product copy is plain text; asking for HTML handling would make DeepL
    // treat a stray "<" in a description as markup.
    body.set("tag_handling", "");
    body.set("preserve_formatting", "1");

    const response = await fetch(this.#endpoint, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${this.#apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `DeepL returned ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      );
    }

    const payload = (await response.json()) as { translations?: { text?: string }[] };
    const translated = payload.translations ?? [];
    const out: Record<string, string> = {};
    names.forEach((name, index) => {
      const text = translated[index]?.text;
      // A field the provider returned empty is left absent rather than
      // written as "", which would read as a deliberate blank.
      if (typeof text === "string" && text.trim().length > 0) out[name] = text;
    });
    return { fields: out };
  }
}

/**
 * The provider this deployment is configured with, or null.
 *
 * Null is a supported state, not an error: the shop runs without a translation
 * service, and everything downstream treats that as "awaiting translation".
 */
export function resolveTranslationProvider(): TranslationProvider | null {
  const apiKey = process.env.DEEPL_API_KEY?.trim();
  if (!apiKey) return null;

  // A free-tier key ends in ":fx" and must go to a different host. Getting
  // this wrong returns 403 with no explanation of why.
  const endpoint =
    process.env.DEEPL_API_URL?.trim() ||
    (apiKey.endsWith(":fx")
      ? "https://api-free.deepl.com/v2/translate"
      : "https://api.deepl.com/v2/translate");

  return new DeepLProvider(apiKey, endpoint);
}

/** Whether a provider is configured, for the admin to report. */
export function translationProviderName(): string | null {
  return resolveTranslationProvider()?.name ?? null;
}
