/**
 * Catalogue import: persistence.
 *
 * Upserts products keyed on bol_product_id (the workbook's Product ID), so the
 * same file can be imported repeatedly without ever creating a duplicate
 * product. Brands and categories referenced by the file are created on demand.
 */

import {
  parseCatalogueImport,
  slugify,
  type CatalogueImportResult,
  type NormalisedCatalogueRow,
} from "./catalogue-import";

export type CatalogueImportReport = CatalogueImportResult & {
  totalLines: number;
  duplicates: string[];
  errors: { line: number; product_id: string | null; message: string }[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */

async function resolveBrandIds(admin: any, brands: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!brands.length) return map;

  const { data: existing } = await admin.from("brands").select("id, name, slug");
  for (const row of (existing ?? []) as any[]) {
    map.set(String(row.name).toLowerCase(), String(row.id));
  }

  const missing = brands.filter((brand) => !map.has(brand.toLowerCase()));
  if (missing.length) {
    const { data: inserted, error } = await admin
      .from("brands")
      .upsert(
        missing.map((name, index) => ({
          name,
          slug: slugify(name),
          sort_order: index + 1,
          is_active: true,
        })),
        { onConflict: "slug" },
      )
      .select("id, name");
    if (error) throw new Error(`Merken aanmaken mislukt: ${error.message}`);
    for (const row of (inserted ?? []) as any[]) {
      map.set(String(row.name).toLowerCase(), String(row.id));
    }
  }
  return map;
}

async function resolveCategoryIds(admin: any, categories: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!categories.length) return map;

  const { data: existing } = await admin.from("categories").select("id, name, slug");
  for (const row of (existing ?? []) as any[]) {
    map.set(String(row.name).toLowerCase(), String(row.id));
  }

  const missing = categories.filter((category) => !map.has(category.toLowerCase()));
  if (missing.length) {
    const { data: inserted, error } = await admin
      .from("categories")
      .upsert(
        missing.map((name, index) => ({
          name,
          slug: slugify(name),
          sort_order: 100 + index,
          is_visible: true,
          is_archived: false,
        })),
        { onConflict: "slug" },
      )
      .select("id, name");
    if (error) throw new Error(`Categorieën aanmaken mislukt: ${error.message}`);
    for (const row of (inserted ?? []) as any[]) {
      map.set(String(row.name).toLowerCase(), String(row.id));
    }
  }
  return map;
}

/**
 * Runs a catalogue import against the database.
 *
 * `admin` is the service-role Supabase client; callers must already have
 * checked that the user may manage the catalogue.
 */
export async function runCatalogueImport(admin: any, csv: string): Promise<CatalogueImportReport> {
  const parsed = parseCatalogueImport(csv);
  const report: CatalogueImportReport = {
    imported: 0,
    updated: 0,
    skipped: parsed.duplicates.length,
    failed: parsed.errors.filter((e) => e.line > 1).length,
    totalLines: parsed.totalLines,
    duplicates: parsed.duplicates,
    errors: parsed.errors,
  };

  if (!parsed.rows.length) return report;

  const rows = parsed.rows.map((r) => r.data);
  const brandIds = await resolveBrandIds(admin, [...new Set(rows.map((r) => r.brand))]);
  const categoryIds = await resolveCategoryIds(admin, [...new Set(rows.map((r) => r.category))]);

  // Which Product IDs already exist decides imported vs updated in the report.
  const { data: existingRows, error: existingError } = await admin
    .from("products")
    .select("id, bol_product_id")
    .in(
      "bol_product_id",
      rows.map((r) => r.productId),
    );
  if (existingError) throw new Error(existingError.message);

  const existingByProductId = new Map<string, string>();
  for (const row of (existingRows ?? []) as any[]) {
    if (row.bol_product_id) existingByProductId.set(String(row.bol_product_id), String(row.id));
  }

  for (const row of rows) {
    const isUpdate = existingByProductId.has(row.productId);

    const payload = {
      name: row.name,
      slug: row.slug,
      brand_id: brandIds.get(row.brand.toLowerCase()) ?? null,
      category_id: categoryIds.get(row.category.toLowerCase()) ?? null,
      bol_product_id: row.productId,
      status: "active",
      // regular_price is the struck-through price when there is a genuine
      // discount; otherwise the selling price stands alone.
      regular_price: row.compareAtPrice ?? row.price,
      sale_price: row.compareAtPrice ? row.price : null,
      // stock_quantity is deliberately absent. It is ledger-owned, so this
      // upsert would be refused outright on an existing product — re-importing
      // the catalogue failed with "stock_quantity is ledger-owned" — and on a
      // new one it would create stock with no movement explaining it. The
      // figure is applied below, through the ledger.
      rating_count: row.reviewCount,
      short_description: row.shortDescription,
      full_description: row.fullTitle,
      published_at: new Date().toISOString(),
    };

    const { data: upserted, error } = await admin
      .from("products")
      .upsert(payload, { onConflict: "bol_product_id" })
      .select("id")
      .single();

    if (error) {
      report.failed += 1;
      report.errors.push({
        line: 0,
        product_id: row.productId,
        message: error.message,
      });
      continue;
    }

    if (isUpdate) report.updated += 1;
    else report.imported += 1;

    // The CSV column is an absolute figure, so the ledger writes the
    // difference: importing 20 onto a product holding 10 lands on 20, not 30,
    // and re-running the same file is a no-op because the difference is zero.
    // A brand-new product goes from 0 to its figure, which is its opening
    // balance and reads that way in the ledger.
    if (upserted?.id && Number.isFinite(row.stock)) {
      try {
        const { setStockLevel } = await import("./inventory.server");
        await setStockLevel({
          productId: upserted.id,
          target: Math.max(0, Math.trunc(row.stock)),
          reason: isUpdate ? "inventory_import" : "beginvoorraad",
          referenceType: "catalogue_import",
          note: `Catalogusimport ${row.productId}`,
        });
      } catch (stockError) {
        // The product itself imported. Report the stock failure against that
        // row rather than losing the whole import over it.
        report.errors.push({
          line: 0,
          product_id: row.productId,
          message: `Voorraad niet bijgewerkt: ${
            stockError instanceof Error ? stockError.message : String(stockError)
          }`,
        });
      }
    }

    if (row.imageUrl && upserted?.id) {
      // One main image per product; re-importing replaces it rather than
      // stacking duplicates of the same URL.
      const { data: existingImage } = await admin
        .from("product_images")
        .select("id")
        .eq("product_id", upserted.id)
        .eq("image_url", row.imageUrl)
        .maybeSingle();

      if (!existingImage) {
        await admin.from("product_images").insert({
          product_id: upserted.id,
          image_url: row.imageUrl,
          alt_text: row.name,
          is_main: true,
          sort_order: 0,
        });
      }
    }
  }

  return report;
}
