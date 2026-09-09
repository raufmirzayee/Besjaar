/**
 * Validation for the bulk product import (CSV). Pure logic, unit tested.
 * Expected columns: sku, naam, prijs, actieprijs, voorraad, status
 */

export type BulkProductRow = {
  sku: string;
  name: string | null;
  regular_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
  status: string | null;
};

export type BulkParseResult = {
  rows: BulkProductRow[];
  errors: { line: number; message: string }[];
};

export const ALLOWED_STATUSES = ["draft", "active", "archived"] as const;

export const BULK_TEMPLATE_HEADER = ["sku", "naam", "prijs", "actieprijs", "voorraad", "status"];

function parseNumber(raw: string): number | null | undefined {
  const value = raw.trim();
  if (value === "") return null;
  const normalised = value.replace(/\s/g, "").replace(",", ".");
  const numeric = Number(normalised);
  if (!Number.isFinite(numeric)) return undefined;
  return numeric;
}

export function validateBulkRows(records: Record<string, string>[]): BulkParseResult {
  const rows: BulkProductRow[] = [];
  const errors: { line: number; message: string }[] = [];
  const seen = new Set<string>();

  records.forEach((record, index) => {
    const line = index + 2; // +1 header, +1 for 1-based
    const sku = (record.sku ?? "").trim();
    if (!sku) {
      errors.push({ line, message: "SKU ontbreekt" });
      return;
    }
    if (seen.has(sku)) {
      errors.push({ line, message: `SKU ${sku} staat dubbel in het bestand` });
      return;
    }
    seen.add(sku);

    const price = parseNumber(record.prijs ?? "");
    const salePrice = parseNumber(record.actieprijs ?? "");
    const stock = parseNumber(record.voorraad ?? "");
    const status = (record.status ?? "").trim().toLowerCase();

    if (price === undefined) {
      errors.push({ line, message: `Ongeldige prijs bij ${sku}` });
      return;
    }
    if (salePrice === undefined) {
      errors.push({ line, message: `Ongeldige actieprijs bij ${sku}` });
      return;
    }
    if (stock === undefined) {
      errors.push({ line, message: `Ongeldige voorraad bij ${sku}` });
      return;
    }
    if (price !== null && price < 0) {
      errors.push({ line, message: `Prijs mag niet negatief zijn bij ${sku}` });
      return;
    }
    if (stock !== null && (stock < 0 || !Number.isInteger(stock))) {
      errors.push({ line, message: `Voorraad moet een geheel getal ≥ 0 zijn bij ${sku}` });
      return;
    }
    if (price !== null && salePrice !== null && salePrice >= price) {
      errors.push({ line, message: `Actieprijs moet lager zijn dan de prijs bij ${sku}` });
      return;
    }
    if (status && !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
      errors.push({ line, message: `Onbekende status "${status}" bij ${sku}` });
      return;
    }

    rows.push({
      sku,
      name: (record.naam ?? "").trim() || null,
      regular_price: price,
      sale_price: salePrice,
      stock_quantity: stock,
      status: status || null,
    });
  });

  return { rows, errors };
}
