import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildCoverageRow,
  summarizeCoverage,
  COVERAGE_FIELDS,
  COVERAGE_LOCALES,
  type CoverageRow,
  type CoverageEntity,
} from "./translation-coverage";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

export type TranslationCoverage = {
  products: CoverageRow[];
  categories: CoverageRow[];
  brands: CoverageRow[];
  summary: ReturnType<typeof summarizeCoverage>;
};

const TABLE: Record<CoverageEntity, string> = {
  product: "products",
  category: "categories",
  brand: "brands",
};

export async function fetchTranslationCoverage(supabase: Client): Promise<TranslationCoverage> {
  const [products, categories, brands] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, slug, name, short_description, full_description, seo_title, seo_description, translations",
      )
      .neq("status", "archived")
      .order("name"),
    supabase
      .from("categories")
      .select("id, slug, name, description, seo_title, seo_description, translations")
      .eq("is_archived", false)
      .order("name"),
    supabase
      .from("brands")
      .select("id, slug, name, description, seo_title, seo_description, translations")
      .order("name"),
  ]);
  if (products.error) throw new Error(products.error.message);
  if (categories.error) throw new Error(categories.error.message);
  if (brands.error) throw new Error(brands.error.message);

  const productRows = ((products.data ?? []) as any[]).map((p) => buildCoverageRow("product", p));
  const categoryRows = ((categories.data ?? []) as any[]).map((c) =>
    buildCoverageRow("category", c),
  );
  const brandRows = ((brands.data ?? []) as any[]).map((b) => buildCoverageRow("brand", b));

  return {
    products: productRows,
    categories: categoryRows,
    brands: brandRows,
    summary: summarizeCoverage([...productRows, ...categoryRows, ...brandRows]),
  };
}

export type TranslationDraft = {
  entity: CoverageEntity;
  id: string;
  slug: string;
  name: string;
  /** `${locale}:${field}` -> current value ("" when empty) */
  values: Record<string, string>;
};

function selectFor(entity: CoverageEntity) {
  return ["id", "slug", "name", ...COVERAGE_FIELDS[entity], "translations"]
    .filter((f, i, a) => a.indexOf(f) === i)
    .join(", ");
}

export async function fetchTranslationDraft(
  supabase: Client,
  entity: CoverageEntity,
  id: string,
): Promise<TranslationDraft> {
  const { data, error } = await supabase
    .from(TABLE[entity])
    .select(selectFor(entity))
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Item niet gevonden");
  const row = data as any;

  const values: Record<string, string> = {};
  for (const field of COVERAGE_FIELDS[entity]) {
    for (const locale of COVERAGE_LOCALES) {
      const raw = locale === "nl" ? row[field] : row.translations?.[locale]?.[field];
      values[`${locale}:${field}`] = typeof raw === "string" ? raw : "";
    }
  }

  return { entity, id, slug: row.slug, name: row.name, values };
}

export async function saveTranslationDraft(
  supabase: Client,
  entity: CoverageEntity,
  id: string,
  values: Record<string, string>,
): Promise<{ draft: TranslationDraft; changed: string[] }> {
  const before = await fetchTranslationDraft(supabase, entity, id);
  const fields = COVERAGE_FIELDS[entity];

  const { data: current, error: currentError } = await supabase
    .from(TABLE[entity])
    .select("translations")
    .eq("id", id)
    .maybeSingle();
  if (currentError) throw new Error(currentError.message);

  const translations: Record<string, Record<string, string>> = {
    ...(((current as any)?.translations ?? {}) as Record<string, Record<string, string>>),
  };
  const update: Record<string, unknown> = {};
  const changed: string[] = [];

  for (const field of fields) {
    for (const locale of COVERAGE_LOCALES) {
      const key = `${locale}:${field}`;
      if (!(key in values)) continue;
      const next = values[key]!.trim();
      if (next === (before.values[key] ?? "")) continue;
      changed.push(key);
      if (locale === "nl") {
        if (field === "name" && next.length === 0) {
          throw new Error("De Nederlandse naam is verplicht");
        }
        update[field] = next.length === 0 ? null : next;
      } else {
        const bucket = { ...(translations[locale] ?? {}) };
        if (next.length === 0) delete bucket[field];
        else bucket[field] = next;
        translations[locale] = bucket;
      }
    }
  }

  if (changed.length === 0) return { draft: before, changed };

  if (changed.some((key) => !key.startsWith("nl:"))) update["translations"] = translations;

  const { error } = await supabase
    .from(TABLE[entity])
    .update(update as never)
    .eq("id", id);
  if (error) throw new Error(error.message);

  return { draft: await fetchTranslationDraft(supabase, entity, id), changed };
}

export async function fetchTranslationDrafts(
  supabase: Client,
  targets: { entity: CoverageEntity; id: string }[],
): Promise<TranslationDraft[]> {
  const drafts: TranslationDraft[] = [];
  for (const target of targets) {
    drafts.push(await fetchTranslationDraft(supabase, target.entity, target.id));
  }
  return drafts;
}

export type BulkSaveResult = {
  results: { entity: CoverageEntity; id: string; changed: string[]; error?: string }[];
  changedTotal: number;
};

export async function saveTranslationDrafts(
  supabase: Client,
  items: { entity: CoverageEntity; id: string; values: Record<string, string> }[],
): Promise<BulkSaveResult> {
  const results: BulkSaveResult["results"] = [];
  let changedTotal = 0;
  for (const item of items) {
    try {
      const { changed } = await saveTranslationDraft(supabase, item.entity, item.id, item.values);
      changedTotal += changed.length;
      results.push({ entity: item.entity, id: item.id, changed });
    } catch (error) {
      results.push({
        entity: item.entity,
        id: item.id,
        changed: [],
        error: error instanceof Error ? error.message : "Onbekende fout",
      });
    }
  }
  return { results, changedTotal };
}
