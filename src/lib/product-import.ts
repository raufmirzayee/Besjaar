/**
 * Pure parsing + Zod validation for the product bulk CSV import.
 * No Supabase / browser access so it can be unit tested and reused server-side.
 */
import { z } from "zod";

import { csvToObjects } from "./csv";

export const IMPORT_COLUMNS = [
  "product_id",
  "voorraad",
  "lage_voorraad_drempel",
  "veiligheidsvoorraad",
  "variant_sku",
  "variant_ean",
  "variant_naam",
  "variant_prijs",
  "variant_actieprijs",
  "variant_voorraad",
  "variant_status",
  "bol_offer_id",
  "bol_product_id",
  "bol_prijs",
  "bol_actief",
  "bol_prijssync",
  "bol_voorraadsync",
] as const;

export const IMPORT_TEMPLATE_HEADER = [...IMPORT_COLUMNS];

const VARIANT_STATUSES = ["draft", "active", "out_of_stock", "archived", "discontinued"] as const;

const blank = (value: unknown) =>
  value === undefined || value === null || String(value).trim() === "";

/** Empty cell => undefined (field untouched). */
const optionalText = z.preprocess(
  (v) => (blank(v) ? undefined : String(v).trim()),
  z.string().min(1).max(200).optional(),
);

const optionalInt = z.preprocess(
  (v) => (blank(v) ? undefined : Number(String(v).replace(",", ".").trim())),
  z
    .number({ invalid_type_error: "moet een getal zijn" })
    .int("moet een heel getal zijn")
    .min(0)
    .max(1_000_000)
    .optional(),
);

const optionalPrice = z.preprocess(
  (v) => (blank(v) ? undefined : Number(String(v).replace(/\s/g, "").replace(",", ".").trim())),
  z
    .number({ invalid_type_error: "moet een bedrag zijn" })
    .min(0, "mag niet negatief zijn")
    .max(1_000_000)
    .optional(),
);

const TRUE_WORDS = ["ja", "true", "1", "aan", "yes", "y"];
const FALSE_WORDS = ["nee", "false", "0", "uit", "no", "n"];

const optionalBool = z.preprocess(
  (v) => {
    if (blank(v)) return undefined;
    const text = String(v).trim().toLowerCase();
    if (TRUE_WORDS.includes(text)) return true;
    if (FALSE_WORDS.includes(text)) return false;
    return text; // let Zod fail with a readable message
  },
  z.boolean({ invalid_type_error: "gebruik ja of nee" }).optional(),
);

export const importRowSchema = z
  .object({
    product_id: z.string().uuid("product_id moet een geldig product-id zijn"),
    voorraad: optionalInt,
    lage_voorraad_drempel: optionalInt,
    veiligheidsvoorraad: optionalInt,
    variant_sku: optionalText,
    variant_ean: optionalText,
    variant_naam: optionalText,
    variant_prijs: optionalPrice,
    variant_actieprijs: optionalPrice,
    variant_voorraad: optionalInt,
    variant_status: z.preprocess(
      (v) => (blank(v) ? undefined : String(v).trim().toLowerCase()),
      z
        .enum(VARIANT_STATUSES, {
          message: `variant_status moet één van ${VARIANT_STATUSES.join(", ")} zijn`,
        })
        .optional(),
    ),
    bol_offer_id: optionalText,
    bol_product_id: optionalText,
    bol_prijs: optionalPrice,
    bol_actief: optionalBool,
    bol_prijssync: optionalBool,
    bol_voorraadsync: optionalBool,
  })
  .superRefine((row, ctx) => {
    const variantFields = [
      row.variant_naam,
      row.variant_prijs,
      row.variant_actieprijs,
      row.variant_voorraad,
      row.variant_status,
    ].some((v) => v !== undefined);
    if (variantFields && !row.variant_sku && !row.variant_ean) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "variantgegevens vereisen variant_sku of variant_ean om de variant te vinden",
      });
    }
    if (
      row.variant_prijs !== undefined &&
      row.variant_actieprijs !== undefined &&
      row.variant_actieprijs > row.variant_prijs
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "variant_actieprijs mag niet hoger zijn dan variant_prijs",
      });
    }
    const touched = Object.entries(row).filter(
      ([key, value]) =>
        key !== "product_id" &&
        key !== "variant_sku" &&
        key !== "variant_ean" &&
        value !== undefined,
    );
    if (touched.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "regel bevat geen waarden om bij te werken",
      });
    }
  });

export type ImportRow = z.infer<typeof importRowSchema>;

export type ImportRowError = { line: number; product_id: string | null; message: string };

export type ParsedImport = {
  rows: { line: number; data: ImportRow }[];
  errors: ImportRowError[];
  totalLines: number;
};

/**
 * Parses raw CSV text into validated rows plus a per-line error report.
 * `allowedIds` (the current selection) is enforced when provided.
 */
export function parseProductImport(csv: string, allowedIds?: string[]): ParsedImport {
  const records = csvToObjects(csv);
  const allowed = allowedIds && allowedIds.length ? new Set(allowedIds) : null;
  const rows: { line: number; data: ImportRow }[] = [];
  const errors: ImportRowError[] = [];

  if (!records.length) {
    return {
      rows,
      errors: [{ line: 0, product_id: null, message: "Het CSV-bestand bevat geen regels" }],
      totalLines: 0,
    };
  }

  const unknown = Object.keys(records[0]).filter(
    (key) => key.length > 0 && !(IMPORT_COLUMNS as readonly string[]).includes(key),
  );

  records.forEach((record, index) => {
    const line = index + 2; // header is line 1
    const parsed = importRowSchema.safeParse(record);
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
    if (allowed && !allowed.has(parsed.data.product_id)) {
      errors.push({
        line,
        product_id: parsed.data.product_id,
        message: "product staat niet in de huidige selectie",
      });
      return;
    }
    rows.push({ line, data: parsed.data });
  });

  if (unknown.length) {
    errors.push({
      line: 1,
      product_id: null,
      message: `Onbekende kolommen worden genegeerd: ${unknown.join(", ")}`,
    });
  }

  return { rows, errors, totalLines: records.length };
}
