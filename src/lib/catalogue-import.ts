/**
 * Catalogue import: parsing and validation.
 *
 * This is the importer for the product catalogue itself — it creates and
 * updates products. (The separate product-import.ts handles stock, variant and
 * bol.com updates for products that already exist.)
 *
 * Product ID is the deduplication key. A file containing the same Product ID
 * twice imports it once, and re-running the same file updates the existing
 * products instead of creating a second copy of the catalogue.
 *
 * Pure functions only — no Supabase or browser access — so the rules are unit
 * testable and can run on either side.
 */

import { z } from "zod";

import { csvToObjects } from "./csv";

export const CATALOGUE_IMPORT_COLUMNS = [
  "product_id",
  "naam",
  "slug",
  "merk",
  "categorie",
  "prijs",
  "adviesprijs",
  "voorraad",
  "beoordelingen",
  "beschikbaarheid",
  "afbeelding_url",
  "bron_url",
  "korte_omschrijving",
  "volledige_titel",
] as const;

export const CATALOGUE_IMPORT_TEMPLATE_HEADER = [...CATALOGUE_IMPORT_COLUMNS];

/** Brand spellings are standardised on import; the workbook is inconsistent. */
const BRAND_CANONICAL: Record<string, string> = {
  besjaar: "Besjaar",
  rynex: "RYNEX",
  lynex: "LYNEX",
};

const blank = (value: unknown) =>
  value === undefined || value === null || String(value).trim() === "";

const requiredText = (max: number) =>
  z.preprocess((v) => (blank(v) ? undefined : String(v).trim()), z.string().min(1).max(max));

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (blank(v) ? undefined : String(v).trim()),
    z.string().min(1).max(max).optional(),
  );

const price = z.preprocess(
  (v) => (blank(v) ? undefined : Number(String(v).replace(/\s|€/g, "").replace(",", "."))),
  z.number({ invalid_type_error: "moet een bedrag zijn" }).min(0.01).max(100000),
);

const optionalPrice = z.preprocess(
  (v) => (blank(v) ? undefined : Number(String(v).replace(/\s|€/g, "").replace(",", "."))),
  z.number({ invalid_type_error: "moet een bedrag zijn" }).min(0).max(100000).optional(),
);

const optionalInt = z.preprocess(
  (v) => (blank(v) ? undefined : Number(String(v).trim())),
  z.number().int("moet een heel getal zijn").min(0).max(1_000_000).optional(),
);

/** Only http(s) URLs are accepted, so a javascript: URL can never be stored. */
const optionalUrl = z.preprocess(
  (v) => (blank(v) ? undefined : String(v).trim()),
  z
    .string()
    .max(2000)
    .url("moet een geldige URL zijn")
    .refine((value) => /^https?:\/\//i.test(value), "moet met http:// of https:// beginnen")
    .optional(),
);

export const catalogueRowSchema = z
  .object({
    product_id: requiredText(64),
    naam: requiredText(200),
    slug: optionalText(200),
    merk: requiredText(80),
    categorie: requiredText(120),
    prijs: price,
    adviesprijs: optionalPrice,
    voorraad: optionalInt,
    beoordelingen: optionalInt,
    beschikbaarheid: optionalText(120),
    afbeelding_url: optionalUrl,
    bron_url: optionalUrl,
    korte_omschrijving: optionalText(500),
    volledige_titel: optionalText(1000),
  })
  .superRefine((row, ctx) => {
    if (!/^[A-Za-z0-9._-]+$/.test(row.product_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["product_id"],
        message: "mag alleen letters, cijfers, punt, streepje of underscore bevatten",
      });
    }
    if (row.slug && !/^[a-z0-9-]+$/.test(row.slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slug"],
        message: "mag alleen kleine letters, cijfers en streepjes bevatten",
      });
    }
    if (!BRAND_CANONICAL[row.merk.toLowerCase()]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["merk"],
        message: `onbekend merk; verwacht ${Object.values(BRAND_CANONICAL).join(", ")}`,
      });
    }
    // A recommended price below the selling price is not a discount; it is a
    // data error, and importing it would show a fake saving on the storefront.
    if (row.adviesprijs !== undefined && row.adviesprijs > 0 && row.adviesprijs < row.prijs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adviesprijs"],
        message: "mag niet lager zijn dan de verkoopprijs",
      });
    }
  });

export type CatalogueRow = z.infer<typeof catalogueRowSchema>;

export type NormalisedCatalogueRow = {
  productId: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  /** Selling price. */
  price: number;
  /** Only set when genuinely higher than the selling price. */
  compareAtPrice: number | null;
  stock: number;
  reviewCount: number;
  availability: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  shortDescription: string | null;
  fullTitle: string | null;
};

export type CatalogueImportError = {
  line: number;
  product_id: string | null;
  message: string;
};

export type ParsedCatalogueImport = {
  rows: { line: number; data: NormalisedCatalogueRow }[];
  errors: CatalogueImportError[];
  /** Product IDs seen more than once in the file; kept once. */
  duplicates: string[];
  totalLines: number;
};

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " en ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function normalise(row: CatalogueRow): NormalisedCatalogueRow {
  const brand = BRAND_CANONICAL[row.merk.toLowerCase()] ?? row.merk;
  // A recommended price equal to or below the selling price is not a sale.
  const compareAt =
    row.adviesprijs !== undefined && row.adviesprijs > row.prijs ? row.adviesprijs : null;

  return {
    productId: row.product_id,
    name: row.naam,
    slug: row.slug ?? slugify(`${brand} ${row.naam}`),
    brand,
    category: row.categorie,
    price: row.prijs,
    compareAtPrice: compareAt,
    stock: row.voorraad ?? 0,
    reviewCount: row.beoordelingen ?? 0,
    availability: row.beschikbaarheid ?? null,
    imageUrl: row.afbeelding_url ?? null,
    sourceUrl: row.bron_url ?? null,
    shortDescription: row.korte_omschrijving ?? null,
    fullTitle: row.volledige_titel ?? null,
  };
}

/**
 * Parses catalogue CSV into validated, de-duplicated rows plus a per-line
 * error report. The first occurrence of a Product ID wins; later ones are
 * reported as duplicates rather than silently importing twice.
 */
export function parseCatalogueImport(csv: string): ParsedCatalogueImport {
  const records = csvToObjects(csv);
  const rows: { line: number; data: NormalisedCatalogueRow }[] = [];
  const errors: CatalogueImportError[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();

  if (!records.length) {
    return {
      rows,
      errors: [{ line: 0, product_id: null, message: "Het bestand bevat geen regels" }],
      duplicates,
      totalLines: 0,
    };
  }

  const unknown = Object.keys(records[0]).filter(
    (key) => key.length > 0 && !(CATALOGUE_IMPORT_COLUMNS as readonly string[]).includes(key),
  );

  records.forEach((record, index) => {
    const line = index + 2; // header is line 1
    const parsed = catalogueRowSchema.safeParse(record);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] ? `${String(issue.path[0])}: ` : "";
        errors.push({
          line,
          product_id: record["product_id"] || null,
          message: `${field}${issue.message}`,
        });
      }
      return;
    }

    const normalised = normalise(parsed.data);
    if (seen.has(normalised.productId)) {
      duplicates.push(normalised.productId);
      return;
    }
    seen.add(normalised.productId);
    rows.push({ line, data: normalised });
  });

  if (unknown.length) {
    errors.push({
      line: 1,
      product_id: null,
      message: `Onbekende kolommen worden genegeerd: ${unknown.join(", ")}`,
    });
  }

  return { rows, errors, duplicates, totalLines: records.length };
}

export type CatalogueImportResult = {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
};
