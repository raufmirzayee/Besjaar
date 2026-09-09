import type { Locale } from "@/lib/i18n";

/** Per-locale overrides for database content, stored in a `translations` jsonb column. */
export type Translations = Record<string, Record<string, string | null | undefined>> | null;

/**
 * Returns the localized value of `field` for the given locale,
 * falling back to the Dutch base column when no translation exists.
 */
export function localize<T extends { translations?: Translations }>(
  item: T | null | undefined,
  field: string,
  locale: Locale,
  fallback?: string | null,
): string {
  const base =
    fallback ?? (item ? ((item as Record<string, unknown>)[field] as string | null) : null);
  if (!item || locale === "nl") return base ?? "";
  const value = item.translations?.[locale]?.[field];
  return (typeof value === "string" && value.trim().length > 0 ? value : base) ?? "";
}
