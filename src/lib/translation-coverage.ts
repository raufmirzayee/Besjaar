import type { Translations } from "./content-i18n";

/** Locales the shop must fully support. */
export const COVERAGE_LOCALES = ["nl", "en", "de", "fr"] as const;
export type CoverageLocale = (typeof COVERAGE_LOCALES)[number];

export type CoverageEntity = "product" | "category" | "brand";

/** Fields checked per entity type. */
export const COVERAGE_FIELDS: Record<CoverageEntity, string[]> = {
  product: ["name", "short_description", "full_description", "seo_title", "seo_description"],
  category: ["name", "description", "seo_title", "seo_description"],
  brand: ["name", "description", "seo_title", "seo_description"],
};

export const FIELD_LABELS: Record<string, string> = {
  name: "Naam",
  short_description: "Korte omschrijving",
  full_description: "Lange omschrijving",
  description: "Omschrijving",
  seo_title: "SEO titel",
  seo_description: "SEO omschrijving",
};

export type CoverageStatus = "ok" | "missing" | "identical" | "no_source";

export type CoverageRow = {
  entity: CoverageEntity;
  id: string;
  slug: string;
  name: string;
  /** `${locale}:${field}` -> status */
  cells: Record<string, CoverageStatus>;
  missingCount: number;
  identicalCount: number;
  completeness: number; // 0..100 over checkable cells
};

type Source = {
  id: string;
  slug: string;
  name: string;
  translations: Translations;
} & Record<string, unknown>;

function norm(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().toLowerCase() : "";
}

/** Names that are brand/model strings and may legitimately match Dutch. */
export const IDENTICAL_OK = new Set<string>([
  "besjaar-powerbank:name",
  "lynex-5-in-1-airstyler:name",
  "lynex-7-in-1-airstyler:name",
]);

export function buildCoverageRow(entity: CoverageEntity, item: Source): CoverageRow {
  const fields = COVERAGE_FIELDS[entity];
  const cells: Record<string, CoverageStatus> = {};
  let missing = 0;
  let identical = 0;
  let checkable = 0;
  let ok = 0;

  for (const field of fields) {
    const dutch = item[field] as string | null | undefined;
    for (const locale of COVERAGE_LOCALES) {
      const key = `${locale}:${field}`;
      if (locale === "nl") {
        if (norm(dutch).length === 0) {
          cells[key] = "missing";
          missing += 1;
          checkable += 1;
        } else {
          cells[key] = "ok";
          checkable += 1;
          ok += 1;
        }
        continue;
      }
      if (norm(dutch).length === 0) {
        cells[key] = "no_source";
        continue;
      }
      checkable += 1;
      const raw = item.translations?.[locale]?.[field];
      if (typeof raw !== "string" || raw.trim().length === 0) {
        cells[key] = "missing";
        missing += 1;
        continue;
      }
      if (norm(raw) === norm(dutch) && !IDENTICAL_OK.has(`${item.slug}:${field}`)) {
        cells[key] = "identical";
        identical += 1;
        continue;
      }
      cells[key] = "ok";
      ok += 1;
    }
  }

  return {
    entity,
    id: item.id,
    slug: item.slug,
    name: item.name,
    cells,
    missingCount: missing,
    identicalCount: identical,
    completeness: checkable === 0 ? 100 : Math.round((ok / checkable) * 100),
  };
}

export function summarizeCoverage(rows: CoverageRow[]) {
  const perLocale: Record<string, { missing: number; identical: number }> = {};
  for (const locale of COVERAGE_LOCALES) perLocale[locale] = { missing: 0, identical: 0 };
  for (const row of rows) {
    for (const [key, status] of Object.entries(row.cells)) {
      const locale = key.split(":")[0]!;
      if (status === "missing") perLocale[locale]!.missing += 1;
      if (status === "identical") perLocale[locale]!.identical += 1;
    }
  }
  const totalRows = rows.length;
  const incomplete = rows.filter((r) => r.missingCount > 0 || r.identicalCount > 0).length;
  return { perLocale, totalRows, incomplete };
}
