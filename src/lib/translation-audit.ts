import type { Translations } from "./content-i18n";

/** Locales that must have their own product copy (no Dutch fallback). */
export const REQUIRED_LOCALES = ["en", "de", "fr"] as const;
export type RequiredLocale = (typeof REQUIRED_LOCALES)[number];

/** Product fields that are checked for real, non-Dutch translations. */
export const AUDITED_FIELDS = ["name", "full_description"] as const;
export type AuditedField = (typeof AUDITED_FIELDS)[number];

export type AuditableProduct = {
  slug: string;
  name: string;
  full_description: string | null;
  translations: Translations;
};

export type TranslationIssue = {
  slug: string;
  locale: RequiredLocale;
  field: AuditedField;
  reason: "missing" | "empty" | "identical_to_dutch";
};

/**
 * Titles/descriptions that are intentionally identical to the Dutch value,
 * because they consist only of brand and model names.
 * Key format: `${slug}:${field}:${locale}` or `${slug}:${field}` for all locales.
 */
export const IDENTICAL_ALLOWLIST = new Set<string>([
  "besjaar-powerbank:name",
  "lynex-5-in-1-airstyler:name",
  "lynex-7-in-1-airstyler:name",
]);

function isAllowedIdentical(slug: string, field: AuditedField, locale: RequiredLocale) {
  return (
    IDENTICAL_ALLOWLIST.has(`${slug}:${field}`) ||
    IDENTICAL_ALLOWLIST.has(`${slug}:${field}:${locale}`)
  );
}

function normalize(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Returns every place where a product title or long description would fall
 * back to Dutch (missing, blank, or byte-identical to the Dutch base value).
 */
export function auditProductTranslations(products: AuditableProduct[]): TranslationIssue[] {
  const issues: TranslationIssue[] = [];

  for (const product of products) {
    for (const field of AUDITED_FIELDS) {
      const dutch = product[field];
      // Nothing in Dutch either: nothing to fall back to, so not a regression.
      if (normalize(dutch).length === 0) continue;

      for (const locale of REQUIRED_LOCALES) {
        const raw = product.translations?.[locale]?.[field];
        if (raw === undefined || raw === null) {
          issues.push({ slug: product.slug, locale, field, reason: "missing" });
          continue;
        }
        if (typeof raw !== "string" || raw.trim().length === 0) {
          issues.push({ slug: product.slug, locale, field, reason: "empty" });
          continue;
        }
        if (
          normalize(raw) === normalize(dutch) &&
          !isAllowedIdentical(product.slug, field, locale)
        ) {
          issues.push({ slug: product.slug, locale, field, reason: "identical_to_dutch" });
        }
      }
    }
  }

  return issues;
}

export function formatTranslationIssues(issues: TranslationIssue[]): string {
  return issues.map((i) => `- ${i.slug} [${i.locale}] ${i.field}: ${i.reason}`).join("\n");
}
