import { z } from "zod";

/**
 * Runtime shapes for everything that crosses the network into a server
 * function.
 *
 * TypeScript interfaces are erased at build time, so `(input: Foo) => input`
 * validates nothing: whatever the caller posts arrives as-is. Every one of
 * these is reachable by anyone who can open the browser console, so the shapes
 * below are the real boundary.
 */

/** Postgres will reject a malformed uuid, but with a 500 rather than a message. */
export const uuid = z.string().uuid("Ongeldige id");

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email("Vul een geldig e-mailadres in");

/** Free text with a ceiling, so a body cannot be used to exhaust storage. */
export const text = (max = 500) => z.string().trim().max(max);
export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : (v ?? null)));

/** Money never arrives as a float string or a negative. */
export const price = z
  .number()
  .finite()
  .nonnegative("Bedrag kan niet negatief zijn")
  .max(1_000_000, "Bedrag is onwaarschijnlijk hoog");

export const quantity = z
  .number()
  .int("Aantal moet een heel getal zijn")
  .min(1, "Minimaal 1")
  .max(9999, "Maximaal 9999");

/** A stock correction may be negative, but not unbounded in either direction. */
export const stockDelta = z
  .number()
  .int("Mutatie moet een heel getal zijn")
  .refine((n) => n !== 0, "Voer een aantal in dat niet 0 is")
  .refine((n) => Math.abs(n) <= 100_000, "Mutatie is onwaarschijnlijk groot");

export const stockLevel = z.number().int().min(0).max(1_000_000);

export const locale = z.enum(["nl", "en", "de", "fr"]);

export const orderStatus = z.enum([
  "pending",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const productStatus = z.enum(["draft", "active", "out_of_stock", "archived"]);

export const returnStatus = z.enum([
  "requested",
  "approved",
  "rejected",
  "received",
  "refunded",
  "cancelled",
]);

export const reviewStatus = z.enum(["pending", "approved", "rejected"]);

export const contactStatus = z.enum(["new", "open", "in_progress", "closed"]);

export const appRole = z.enum([
  "super_admin",
  "store_manager",
  "warehouse",
  "customer_service",
  "content_editor",
  "financial",
  "customer",
]);

/** Bounded so an import cannot be used to push arbitrary volume through. */
export const csvPayload = z.string().max(5_000_000, "Bestand is te groot");

export const idOnly = z.object({ id: uuid });
export const idsOnly = z.object({ ids: z.array(uuid).min(1).max(500) });

/** A postal address as the checkout collects it. */
export const address = z.object({
  first_name: text(80).min(1, "Vul een voornaam in"),
  last_name: text(80).min(1, "Vul een achternaam in"),
  company_name: optionalText(120),
  street: text(120).min(1, "Vul een straat in"),
  house_number: text(20).min(1, "Vul een huisnummer in"),
  house_number_addition: optionalText(20),
  postal_code: text(16).min(3, "Vul een postcode in"),
  city: text(80).min(1, "Vul een plaats in"),
  country: z.string().trim().length(2, "Land moet een landcode zijn").toUpperCase(),
  phone: optionalText(40),
});

/**
 * Runs a schema and turns its complaints into one readable message.
 *
 * TanStack surfaces a thrown Error to the caller, so the message needs to be
 * something a shopper or a staff member can act on rather than a Zod dump.
 */
export function parse<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const first = result.error.issues[0];
  const where = first?.path?.length ? `${first.path.join(".")}: ` : "";
  throw new Error(`${where}${first?.message ?? "Ongeldige invoer"}`);
}

/** Convenience for the common `.inputValidator(validator(schema))` shape. */
export function validator<T extends z.ZodTypeAny>(schema: T) {
  return (input: unknown): z.infer<T> => parse(schema, input);
}

/* ------------------------------ entity inputs ------------------------------ */
/*
 * The shapes above are building blocks; these are the whole objects the admin
 * posts. Each one is `.strict()`, so an unexpected key is refused rather than
 * forwarded into an `update()` — without that, a crafted request could set any
 * column the row has, including ones no form shows.
 */

/** A slug is generated from the name when omitted, so it is never required. */
export const slug = z
  .string()
  .trim()
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug mag alleen kleine letters, cijfers en streepjes bevatten",
  );

const optionalUuid = uuid.nullish().transform((v) => v ?? null);

/** Accepts "" from an empty <select>, which is what the admin forms post. */
const optionalUuidOrBlank = z
  .union([uuid, z.literal("")])
  .nullish()
  .transform((v) => (v ? v : null));

const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((u) => /^https?:\/\//i.test(u), "Gebruik een volledige https-link");

const optionalHttpsUrl = z
  .union([httpsUrl, z.literal("")])
  .nullish()
  .transform((v) => (v ? v : null));

const percentage = z.number().finite().min(0).max(100);
const dimension = z.number().finite().nonnegative().max(100_000).nullish();

export const productInput = z
  .object({
    id: uuid.optional(),
    name: text(200).min(2, "Naam is verplicht"),
    short_name: optionalText(80),
    slug: z.union([slug, z.literal("")]).nullish(),
    status: productStatus,
    brand_id: optionalUuidOrBlank,
    category_id: optionalUuidOrBlank,
    subcategory_id: optionalUuidOrBlank,
    short_description: optionalText(500),
    full_description: optionalText(20_000),
    selling_points: z.array(text(300)).max(30).optional(),
    specifications: z.record(text(80), text(500)).optional(),
    ean: optionalText(20),
    internal_sku: optionalText(60),
    supplier_sku: optionalText(60),
    bol_product_id: optionalText(60),
    regular_price: price,
    sale_price: price.nullish(),
    purchase_cost: price.nullish(),
    vat_rate: percentage.optional(),
    stock_quantity: stockLevel.optional(),
    low_stock_threshold: stockLevel.optional(),
    safety_stock: stockLevel.optional(),
    weight: dimension,
    length: dimension,
    width: dimension,
    height: dimension,
    shipping_class: optionalText(60),
    warranty_months: z.number().int().min(0).max(600).optional(),
    return_eligible: z.boolean().optional(),
    seo_title: optionalText(200),
    seo_description: optionalText(400),
    search_keywords: optionalText(500),
    featured: z.boolean().optional(),
    bestseller: z.boolean().optional(),
  })
  .strict();

export const variantInput = z
  .object({
    id: uuid.optional(),
    product_id: uuid,
    variant_name: text(160).min(1, "Variantnaam is verplicht"),
    sku: optionalText(60),
    ean: optionalText(20),
    regular_price: price,
    sale_price: price.nullish(),
    purchase_cost: price.nullish(),
    warehouse_stock: stockLevel.optional(),
    safety_stock: stockLevel.optional(),
    weight: dimension,
    image_url: optionalHttpsUrl,
    sort_order: z.number().int().min(0).max(9999).optional(),
    status: z.enum(["active", "inactive", "archived"]).optional(),
  })
  .strict();

export const imageInput = z
  .object({
    product_id: uuid,
    image_url: httpsUrl,
    alt_text: optionalText(300),
    variant_id: optionalUuidOrBlank,
    is_main: z.boolean().optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
  })
  .strict();

export const listingInput = z
  .object({
    id: uuid.optional(),
    product_id: uuid,
    variant_id: optionalUuidOrBlank,
    channel: z.enum(["bol", "amazon", "eigen"]).optional(),
    ean: optionalText(20),
    external_offer_id: optionalText(80),
    external_product_id: optionalText(80),
    channel_price: price.nullish(),
    price_sync_enabled: z.boolean().optional(),
    stock_sync_enabled: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

/** The discriminant decides which extra fields are allowed at all. */
export const bulkAction = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("status"),
    ids: z.array(uuid).min(1).max(200),
    status: productStatus,
  }),
  z.object({ kind: z.literal("brand"), ids: z.array(uuid).min(1).max(200), brandId: optionalUuid }),
  z.object({
    kind: z.literal("category"),
    ids: z.array(uuid).min(1).max(200),
    categoryId: optionalUuid,
  }),
  z.object({
    kind: z.literal("mapping"),
    ids: z.array(uuid).min(1).max(200),
    isActive: z.boolean(),
    priceSync: z.boolean(),
    stockSync: z.boolean(),
  }),
]);

export const categoryInput = z
  .object({
    id: uuid.optional(),
    name: text(120).min(2, "Naam is verplicht"),
    slug: z.union([slug, z.literal("")]),
    parent_id: optionalUuidOrBlank,
    description: optionalText(2000),
    image_url: optionalHttpsUrl,
    sort_order: z.number().int().min(0).max(9999).optional(),
    is_visible: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    is_archived: z.boolean().optional(),
    seo_title: optionalText(200),
    seo_description: optionalText(400),
  })
  .strict();

export const brandInput = z
  .object({
    id: uuid.optional(),
    name: text(120).min(2, "Naam is verplicht"),
    slug: z.union([slug, z.literal("")]).optional(),
    description: optionalText(2000),
    logo_url: optionalHttpsUrl,
    sort_order: z.number().int().min(0).max(9999).optional(),
    is_active: z.boolean().optional(),
    seo_title: optionalText(200),
    seo_description: optionalText(400),
  })
  .strict();

/** Only the columns the inline product table can edit — never the whole row. */
export const productPatch = z
  .object({
    id: uuid,
    name: text(200).min(2).optional(),
    status: productStatus.optional(),
    regular_price: price.optional(),
    sale_price: price.nullish(),
    low_stock_threshold: stockLevel.optional(),
    featured: z.boolean().optional(),
    bestseller: z.boolean().optional(),
    short_description: optionalText(500),
  })
  .strict();

/* -------------------------------- list filters ------------------------------ */
/*
 * Filters are reads, so the risk is different: not a forged write, but an
 * unbounded page size or a search term long enough to make Postgres work hard.
 */

const page = z.number().int().min(1).max(10_000).optional();
const pageSize = z.number().int().min(1).max(200).optional();

export const productFilters = z
  .object({
    search: optionalText(200),
    status: z.union([productStatus, z.literal("")]).nullish(),
    categoryId: optionalUuidOrBlank,
    brandId: optionalUuidOrBlank,
    stock: z.enum(["alle", "laag", "uitverkocht", "voorradig"]).nullish(),
    sort: z
      .enum(["naam", "nieuwste", "prijs-op", "prijs-af", "voorraad-op", "voorraad-af", "verkocht"])
      .nullish(),
    page,
    pageSize,
  })
  .strict()
  .partial();

export const movementFilters = z
  .object({
    productId: optionalUuidOrBlank,
    reason: optionalText(40),
    from: optionalText(40),
    to: optionalText(40),
    search: optionalText(200),
    page,
    pageSize,
  })
  .strict()
  .partial();

export const searchOnly = z
  .object({ search: text(200).optional() })
  .strict()
  .partial();
export const statusOnly = z
  .object({ status: text(40).optional() })
  .strict()
  .partial();
