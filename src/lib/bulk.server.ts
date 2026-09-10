import type { SupabaseClient } from "@supabase/supabase-js";

import type { BulkProductRow } from "./bulk-products";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

export type BulkApplyResult = {
  updated: number;
  skipped: { sku: string; reason: string }[];
  stockChanges: number;
};

/**
 * Applies validated CSV rows to products matched on internal_sku.
 * Stock differences are logged as stock movements so the warehouse keeps a trail.
 */
export async function applyBulkProducts(
  supabase: Client,
  rows: BulkProductRow[],
  userId: string,
): Promise<BulkApplyResult> {
  const skipped: { sku: string; reason: string }[] = [];
  let updated = 0;
  let stockChanges = 0;

  if (rows.length === 0) return { updated, skipped, stockChanges };

  const { data: existing, error } = await supabase
    .from("products")
    .select("id, internal_sku, stock_quantity, regular_price")
    .in(
      "internal_sku",
      rows.map((r) => r.sku),
    );
  if (error) throw new Error(error.message);

  const bySku = new Map<string, any>();
  for (const product of (existing ?? []) as any[]) {
    if (product.internal_sku) bySku.set(String(product.internal_sku), product);
  }

  for (const row of rows) {
    const product = bySku.get(row.sku);
    if (!product) {
      skipped.push({ sku: row.sku, reason: "Geen product met deze SKU" });
      continue;
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (row.name) patch.name = row.name;
    if (row.regular_price !== null) patch.regular_price = row.regular_price;
    if (row.sale_price !== null) patch.sale_price = row.sale_price;
    if (row.status) patch.status = row.status;

    const { error: updateError } = await supabase
      .from("products")
      .update(patch as never)
      .eq("id", product.id);
    if (updateError) {
      skipped.push({ sku: row.sku, reason: updateError.message });
      continue;
    }

    updated += 1;

    const previousStock = Number(product.stock_quantity ?? 0);
    if (row.stock_quantity !== null && row.stock_quantity !== previousStock) {
      stockChanges += 1;
      // The CSV column is an absolute figure. set_stock_level writes the
      // difference to the ledger and lets the trigger apply it; assigning the
      // column here as well used to apply the change a second time.
      const { setStockLevel } = await import("./inventory.server");
      await setStockLevel({
        productId: product.id,
        target: row.stock_quantity,
        reason: "correctie",
        referenceType: "import",
        note: `Bulkimport CSV (${row.sku})`,
        createdBy: userId,
      });
    }
  }

  return { updated, skipped, stockChanges };
}
