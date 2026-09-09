import type { SupabaseClient } from "@supabase/supabase-js";

import type { ImportRow, ImportRowError } from "./product-import";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

export const PRODUCT_STATUSES = [
  "draft",
  "active",
  "out_of_stock",
  "archived",
  "discontinued",
] as const;

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  draft: "Concept",
  active: "Actief",
  out_of_stock: "Uitverkocht",
  archived: "Gearchiveerd",
  discontinued: "Uit assortiment",
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export type ProductSort =
  "naam" | "nieuwste" | "prijs-op" | "prijs-af" | "voorraad-op" | "voorraad-af" | "verkocht";

export type ProductFilters = {
  search?: string | null;
  status?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  stock?: "alle" | "laag" | "uitverkocht" | "voorradig" | null;
  sort?: ProductSort | null;
  page?: number;
  pageSize?: number;
};

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  internal_sku: string | null;
  ean: string | null;
  regular_price: number;
  sale_price: number | null;
  purchase_cost: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  safety_stock: number;
  featured: boolean;
  bestseller: boolean;
  sales_count: number;
  rating_average: number;
  rating_count: number;
  updated_at: string;
  brand_id: string | null;
  brand: string | null;
  category_id: string | null;
  category: string | null;
  image_url: string | null;
  variant_count: number;
  bol_linked: boolean;
};

const LIST_SELECT = `
  id, name, slug, status, internal_sku, ean, regular_price, sale_price, purchase_cost,
  stock_quantity, low_stock_threshold, safety_stock, featured, bestseller, sales_count,
  rating_average, rating_count, updated_at, brand_id, category_id,
  brands ( name ), categories!products_category_id_fkey ( name ),
  product_images ( image_url, is_main, sort_order ),
  product_variants ( id ),
  channel_listings ( id, is_active )
`;

export async function fetchProductsAdmin(
  supabase: Client,
  filters: ProductFilters,
): Promise<{ rows: ProductRow[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, filters.pageSize ?? 25);

  let query = supabase.from("products").select(LIST_SELECT, { count: "exact" });

  if (filters.status && filters.status !== "alle") query = query.eq("status", filters.status);
  else query = query.neq("status", "archived");

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.brandId) query = query.eq("brand_id", filters.brandId);
  if (filters.stock === "uitverkocht") query = query.lte("stock_quantity", 0);
  if (filters.stock === "voorradig") query = query.gt("stock_quantity", 0);

  const term = filters.search?.trim();
  if (term) {
    const like = `%${term}%`;
    query = query.or(
      `name.ilike.${like},internal_sku.ilike.${like},ean.ilike.${like},slug.ilike.${like}`,
    );
  }

  switch (filters.sort) {
    case "nieuwste":
      query = query.order("created_at", { ascending: false });
      break;
    case "prijs-op":
      query = query.order("regular_price", { ascending: true });
      break;
    case "prijs-af":
      query = query.order("regular_price", { ascending: false });
      break;
    case "voorraad-op":
      query = query.order("stock_quantity", { ascending: true });
      break;
    case "voorraad-af":
      query = query.order("stock_quantity", { ascending: false });
      break;
    case "verkocht":
      query = query.order("sales_count", { ascending: false });
      break;
    default:
      query = query.order("name", { ascending: true });
  }

  // "laag" needs a row-level comparison, so page after mapping instead of in SQL.
  const paged =
    filters.stock === "laag" ? query : query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await paged;
  if (error) throw new Error(error.message);

  let rows = ((data ?? []) as any[]).map((p): ProductRow => {
    const images = [...((p.product_images ?? []) as any[])].sort(
      (a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order,
    );
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      internal_sku: p.internal_sku,
      ean: p.ean,
      regular_price: Number(p.regular_price ?? 0),
      sale_price: p.sale_price === null ? null : Number(p.sale_price),
      purchase_cost: p.purchase_cost === null ? null : Number(p.purchase_cost),
      stock_quantity: Number(p.stock_quantity ?? 0),
      low_stock_threshold: Number(p.low_stock_threshold ?? 5),
      safety_stock: Number(p.safety_stock ?? 0),
      featured: !!p.featured,
      bestseller: !!p.bestseller,
      sales_count: Number(p.sales_count ?? 0),
      rating_average: Number(p.rating_average ?? 0),
      rating_count: Number(p.rating_count ?? 0),
      updated_at: p.updated_at,
      brand_id: p.brand_id,
      brand: p.brands?.name ?? null,
      category_id: p.category_id,
      category: p.categories?.name ?? null,
      image_url: images[0]?.image_url ?? null,
      variant_count: ((p.product_variants ?? []) as any[]).length,
      bol_linked: ((p.channel_listings ?? []) as any[]).some((c) => c.is_active),
    };
  });

  let total = count ?? rows.length;
  if (filters.stock === "laag") {
    rows = rows.filter((r) => r.stock_quantity <= r.low_stock_threshold);
    total = rows.length;
    rows = rows.slice((page - 1) * pageSize, page * pageSize);
  }

  return { rows, total };
}

/* --------------------------------- detail --------------------------------- */

export type ProductVariant = {
  id: string;
  variant_name: string;
  sku: string | null;
  ean: string | null;
  regular_price: number;
  sale_price: number | null;
  purchase_cost: number | null;
  warehouse_stock: number;
  safety_stock: number;
  weight: number | null;
  image_url: string | null;
  sort_order: number;
  status: string;
};

export type ProductImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_main: boolean;
  variant_id: string | null;
};

export type ProductListing = {
  id: string;
  channel: string;
  variant_id: string | null;
  ean: string | null;
  external_offer_id: string | null;
  external_product_id: string | null;
  channel_price: number | null;
  price_sync_enabled: boolean;
  stock_sync_enabled: boolean;
  is_active: boolean;
  last_synced_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
};

export type ProductDetailAdmin = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  status: string;
  brand_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  short_description: string | null;
  full_description: string | null;
  selling_points: string[];
  specifications: Record<string, string>;
  ean: string | null;
  internal_sku: string | null;
  supplier_sku: string | null;
  bol_product_id: string | null;
  regular_price: number;
  sale_price: number | null;
  purchase_cost: number | null;
  vat_rate: number;
  stock_quantity: number;
  low_stock_threshold: number;
  safety_stock: number;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  shipping_class: string | null;
  warranty_months: number;
  return_eligible: boolean;
  seo_title: string | null;
  seo_description: string | null;
  search_keywords: string | null;
  featured: boolean;
  bestseller: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  listings: ProductListing[];
};

export async function fetchProductDetail(
  supabase: Client,
  id: string,
): Promise<ProductDetailAdmin | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `*,
       product_variants ( * ),
       product_images ( id, image_url, alt_text, sort_order, is_main, variant_id ),
       channel_listings ( * )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const p = data as any;
  return {
    id: p.id,
    name: p.name,
    short_name: p.short_name,
    slug: p.slug,
    status: p.status,
    brand_id: p.brand_id,
    category_id: p.category_id,
    subcategory_id: p.subcategory_id,
    short_description: p.short_description,
    full_description: p.full_description,
    selling_points: Array.isArray(p.selling_points) ? p.selling_points.map(String) : [],
    specifications:
      p.specifications && typeof p.specifications === "object" && !Array.isArray(p.specifications)
        ? (p.specifications as Record<string, string>)
        : {},
    ean: p.ean,
    internal_sku: p.internal_sku,
    supplier_sku: p.supplier_sku,
    bol_product_id: p.bol_product_id,
    regular_price: Number(p.regular_price ?? 0),
    sale_price: p.sale_price === null ? null : Number(p.sale_price),
    purchase_cost: p.purchase_cost === null ? null : Number(p.purchase_cost),
    vat_rate: Number(p.vat_rate ?? 21),
    stock_quantity: Number(p.stock_quantity ?? 0),
    low_stock_threshold: Number(p.low_stock_threshold ?? 5),
    safety_stock: Number(p.safety_stock ?? 0),
    weight: p.weight === null ? null : Number(p.weight),
    length: p.length === null ? null : Number(p.length),
    width: p.width === null ? null : Number(p.width),
    height: p.height === null ? null : Number(p.height),
    shipping_class: p.shipping_class,
    warranty_months: Number(p.warranty_months ?? 24),
    return_eligible: !!p.return_eligible,
    seo_title: p.seo_title,
    seo_description: p.seo_description,
    search_keywords: p.search_keywords,
    featured: !!p.featured,
    bestseller: !!p.bestseller,
    variants: ((p.product_variants ?? []) as any[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        id: v.id,
        variant_name: v.variant_name,
        sku: v.sku,
        ean: v.ean,
        regular_price: Number(v.regular_price ?? 0),
        sale_price: v.sale_price === null ? null : Number(v.sale_price),
        purchase_cost: v.purchase_cost === null ? null : Number(v.purchase_cost),
        warehouse_stock: Number(v.warehouse_stock ?? 0),
        safety_stock: Number(v.safety_stock ?? 0),
        weight: v.weight === null ? null : Number(v.weight),
        image_url: v.image_url,
        sort_order: Number(v.sort_order ?? 0),
        status: v.status,
      })),
    images: ((p.product_images ?? []) as any[])
      .sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order)
      .map((i) => ({
        id: i.id,
        image_url: i.image_url,
        alt_text: i.alt_text,
        sort_order: Number(i.sort_order ?? 0),
        is_main: !!i.is_main,
        variant_id: i.variant_id,
      })),
    listings: ((p.channel_listings ?? []) as any[]).map((c) => ({
      id: c.id,
      channel: c.channel,
      variant_id: c.variant_id,
      ean: c.ean,
      external_offer_id: c.external_offer_id,
      external_product_id: c.external_product_id,
      channel_price: c.channel_price === null ? null : Number(c.channel_price),
      price_sync_enabled: !!c.price_sync_enabled,
      stock_sync_enabled: !!c.stock_sync_enabled,
      is_active: !!c.is_active,
      last_synced_at: c.last_synced_at,
      last_sync_status: c.last_sync_status,
      last_sync_error: c.last_sync_error,
    })),
  };
}

/* --------------------------------- writes --------------------------------- */

export type ProductInput = {
  id?: string;
  name: string;
  short_name?: string | null;
  slug?: string | null;
  status: string;
  brand_id?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  short_description?: string | null;
  full_description?: string | null;
  selling_points?: string[];
  specifications?: Record<string, string>;
  ean?: string | null;
  internal_sku?: string | null;
  supplier_sku?: string | null;
  bol_product_id?: string | null;
  regular_price: number;
  sale_price?: number | null;
  purchase_cost?: number | null;
  vat_rate?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  safety_stock?: number;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  shipping_class?: string | null;
  warranty_months?: number;
  return_eligible?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  search_keywords?: string | null;
  featured?: boolean;
  bestseller?: boolean;
};

function nullish<T>(value: T | undefined | null) {
  return value === undefined ? null : value;
}

async function uniqueSlug(supabase: Client, base: string, ignoreId?: string) {
  let candidate = base || `product-${Date.now()}`;
  for (let i = 0; i < 25; i += 1) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .limit(1)
      .maybeSingle();
    const row = data as any;
    if (!row || row.id === ignoreId) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now()}`;
}

export async function saveProductFull(supabase: Client, input: ProductInput) {
  if (!input.name?.trim()) throw new Error("Naam is verplicht");
  if (!Number.isFinite(input.regular_price) || input.regular_price < 0) {
    throw new Error("Voer een geldige prijs in");
  }
  if (
    input.sale_price !== null &&
    input.sale_price !== undefined &&
    input.sale_price >= input.regular_price
  ) {
    throw new Error("Actieprijs moet lager zijn dan de normale prijs");
  }

  const slug = await uniqueSlug(supabase, slugify(input.slug?.trim() || input.name), input.id);

  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    short_name: nullish(input.short_name),
    slug,
    status: input.status,
    brand_id: input.brand_id || null,
    category_id: input.category_id || null,
    subcategory_id: input.subcategory_id || null,
    short_description: nullish(input.short_description),
    full_description: nullish(input.full_description),
    selling_points: input.selling_points ?? [],
    specifications: input.specifications ?? {},
    ean: nullish(input.ean),
    internal_sku: nullish(input.internal_sku),
    supplier_sku: nullish(input.supplier_sku),
    bol_product_id: nullish(input.bol_product_id),
    regular_price: input.regular_price,
    sale_price: nullish(input.sale_price),
    purchase_cost: nullish(input.purchase_cost),
    vat_rate: input.vat_rate ?? 21,
    low_stock_threshold: input.low_stock_threshold ?? 5,
    safety_stock: input.safety_stock ?? 0,
    weight: nullish(input.weight),
    length: nullish(input.length),
    width: nullish(input.width),
    height: nullish(input.height),
    shipping_class: nullish(input.shipping_class),
    warranty_months: input.warranty_months ?? 24,
    return_eligible: input.return_eligible ?? true,
    seo_title: nullish(input.seo_title),
    seo_description: nullish(input.seo_description),
    search_keywords: nullish(input.search_keywords),
    featured: input.featured ?? false,
    bestseller: input.bestseller ?? false,
    updated_at: new Date().toISOString(),
  };

  if (input.status === "active") payload.published_at = new Date().toISOString();

  if (input.id) {
    const { error } = await supabase.from("products").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
    return { id: input.id, slug };
  }

  payload.stock_quantity = input.stock_quantity ?? 0;
  const { data, error } = await supabase
    .from("products")
    .insert(payload as never)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: (data as any).id as string, slug };
}

export async function setProductStatus(supabase: Client, id: string, status: string) {
  const { error } = await supabase
    .from("products")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function duplicateProduct(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants ( * ), product_images ( * )")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Product niet gevonden");

  const source = data as any;
  const {
    id: _id,
    created_at: _created,
    updated_at: _updated,
    published_at: _published,
    product_variants: variants,
    product_images: images,
    ...rest
  } = source;

  const name = `${source.name} (kopie)`;
  const slug = await uniqueSlug(supabase, slugify(name));

  const { data: created, error: insertError } = await supabase
    .from("products")
    .insert({
      ...rest,
      name,
      slug,
      status: "draft",
      ean: null,
      bol_product_id: null,
      internal_sku: source.internal_sku ? `${source.internal_sku}-COPY` : null,
      sales_count: 0,
      rating_average: 0,
      rating_count: 0,
      published_at: null,
    } as never)
    .select("id")
    .single();
  if (insertError) throw new Error(insertError.message);
  const newId = (created as any).id as string;

  const variantRows = ((variants ?? []) as any[]).map((v) => {
    const { id: _vid, created_at: _vc, updated_at: _vu, product_id: _vp, ...vRest } = v;
    return {
      ...vRest,
      product_id: newId,
      ean: null,
      bol_offer_id: null,
      sku: v.sku ? `${v.sku}-COPY` : null,
    };
  });
  if (variantRows.length) {
    const { error: vError } = await supabase.from("product_variants").insert(variantRows as never);
    if (vError) throw new Error(vError.message);
  }

  const imageRows = ((images ?? []) as any[]).map((i) => ({
    product_id: newId,
    image_url: i.image_url,
    alt_text: i.alt_text,
    caption: i.caption,
    sort_order: i.sort_order,
    is_main: i.is_main,
  }));
  if (imageRows.length) {
    const { error: iError } = await supabase.from("product_images").insert(imageRows as never);
    if (iError) throw new Error(iError.message);
  }

  return { id: newId, slug };
}

export type VariantInput = {
  id?: string;
  product_id: string;
  variant_name: string;
  sku?: string | null;
  ean?: string | null;
  regular_price: number;
  sale_price?: number | null;
  purchase_cost?: number | null;
  warehouse_stock?: number;
  safety_stock?: number;
  weight?: number | null;
  image_url?: string | null;
  sort_order?: number;
  status?: string;
};

export async function saveVariant(supabase: Client, input: VariantInput) {
  if (!input.variant_name?.trim()) throw new Error("Variantnaam is verplicht");
  if (!Number.isFinite(input.regular_price) || input.regular_price < 0) {
    throw new Error("Voer een geldige variantprijs in");
  }
  const payload = {
    product_id: input.product_id,
    variant_name: input.variant_name.trim(),
    sku: nullish(input.sku),
    ean: nullish(input.ean),
    regular_price: input.regular_price,
    sale_price: nullish(input.sale_price),
    purchase_cost: nullish(input.purchase_cost),
    safety_stock: input.safety_stock ?? 0,
    weight: nullish(input.weight),
    image_url: nullish(input.image_url),
    sort_order: input.sort_order ?? 0,
    status: input.status ?? "active",
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("product_variants").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
    return { id: input.id };
  }

  const { data, error } = await supabase
    .from("product_variants")
    .insert({ ...payload, warehouse_stock: input.warehouse_stock ?? 0 } as never)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: (data as any).id as string };
}

export async function deleteVariant(supabase: Client, id: string) {
  const { error } = await supabase.from("product_variants").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export type ImageInput = {
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  variant_id?: string | null;
  is_main?: boolean;
  sort_order?: number;
};

export async function addProductImage(supabase: Client, input: ImageInput) {
  if (!/^https?:\/\//i.test(input.image_url.trim())) {
    throw new Error("Gebruik een volledige https-afbeeldingslink");
  }
  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: input.product_id,
      image_url: input.image_url.trim(),
      alt_text: nullish(input.alt_text),
      variant_id: input.variant_id || null,
      is_main: input.is_main ?? false,
      sort_order: input.sort_order ?? 0,
    } as never)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  if (input.is_main) await setMainImage(supabase, input.product_id, (data as any).id);
  return { id: (data as any).id as string };
}

export async function setMainImage(supabase: Client, productId: string, imageId: string) {
  const reset = await supabase
    .from("product_images")
    .update({ is_main: false })
    .eq("product_id", productId);
  if (reset.error) throw new Error(reset.error.message);
  const { error } = await supabase
    .from("product_images")
    .update({ is_main: true })
    .eq("id", imageId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function moveProductImage(supabase: Client, imageId: string, sortOrder: number) {
  const { error } = await supabase
    .from("product_images")
    .update({ sort_order: sortOrder })
    .eq("id", imageId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteProductImage(supabase: Client, imageId: string) {
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export type ListingInput = {
  id?: string;
  product_id: string;
  variant_id?: string | null;
  channel?: string;
  ean?: string | null;
  external_offer_id?: string | null;
  external_product_id?: string | null;
  channel_price?: number | null;
  price_sync_enabled?: boolean;
  stock_sync_enabled?: boolean;
  is_active?: boolean;
};

export async function saveListing(supabase: Client, input: ListingInput) {
  const payload = {
    product_id: input.product_id,
    variant_id: input.variant_id || null,
    channel: input.channel ?? "bol",
    ean: nullish(input.ean),
    external_offer_id: nullish(input.external_offer_id),
    external_product_id: nullish(input.external_product_id),
    channel_price: nullish(input.channel_price),
    price_sync_enabled: input.price_sync_enabled ?? true,
    stock_sync_enabled: input.stock_sync_enabled ?? true,
    is_active: input.is_active ?? true,
    updated_at: new Date().toISOString(),
  };
  if (input.id) {
    const { error } = await supabase.from("channel_listings").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
    return { id: input.id };
  }
  const { data, error } = await supabase
    .from("channel_listings")
    .insert(payload as never)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: (data as any).id as string };
}

export async function deleteListing(supabase: Client, id: string) {
  const { error } = await supabase.from("channel_listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export type ProductPickerOptions = {
  categories: { id: string; name: string; parent_id: string | null }[];
  brands: { id: string; name: string }[];
};

export async function fetchProductOptions(supabase: Client): Promise<ProductPickerOptions> {
  const [cats, brands] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, parent_id")
      .eq("is_archived", false)
      .order("sort_order"),
    supabase.from("brands").select("id, name").order("name"),
  ]);
  if (cats.error) throw new Error(cats.error.message);
  if (brands.error) throw new Error(brands.error.message);
  return {
    categories: (cats.data ?? []) as ProductPickerOptions["categories"],
    brands: (brands.data ?? []) as ProductPickerOptions["brands"],
  };
}

export type BulkAction =
  | { kind: "status"; ids: string[]; status: string }
  | { kind: "brand"; ids: string[]; brandId: string | null }
  | { kind: "category"; ids: string[]; categoryId: string | null }
  | { kind: "mapping"; ids: string[]; isActive: boolean; priceSync: boolean; stockSync: boolean };

export async function bulkUpdateProducts(supabase: Client, input: BulkAction) {
  const ids = Array.from(new Set(input.ids.filter(Boolean)));
  if (!ids.length) throw new Error("Selecteer minimaal één product");
  if (ids.length > 200) throw new Error("Maximaal 200 producten per bulkactie");

  if (input.kind === "mapping") {
    const { data, error } = await supabase
      .from("channel_listings")
      .update({
        is_active: input.isActive,
        price_sync_enabled: input.priceSync,
        stock_sync_enabled: input.stockSync,
        updated_at: new Date().toISOString(),
      })
      .in("product_id", ids)
      .select("id");
    if (error) throw new Error(error.message);
    return { updated: (data ?? []).length, skipped: 0 };
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.kind === "status") {
    if (!PRODUCT_STATUSES.includes(input.status as (typeof PRODUCT_STATUSES)[number]))
      throw new Error("Onbekende status");
    patch["status"] = input.status;
  }
  if (input.kind === "brand") patch["brand_id"] = input.brandId || null;
  if (input.kind === "category") patch["category_id"] = input.categoryId || null;

  const { data, error } = await supabase.from("products").update(patch).in("id", ids).select("id");
  if (error) throw new Error(error.message);
  const updated = (data ?? []).length;
  return { updated, skipped: ids.length - updated };
}

export const PRODUCT_EXPORT_HEADER = [
  "product_id",
  "naam",
  "slug",
  "status",
  "sku",
  "ean",
  "merk",
  "categorie",
  "prijs",
  "actieprijs",
  "inkoopprijs",
  "btw",
  "voorraad",
  "lage_voorraad_drempel",
  "veiligheidsvoorraad",
  "voorraadstatus",
  "beschikbaar",
  "variant_naam",
  "variant_sku",
  "variant_ean",
  "variant_prijs",
  "variant_actieprijs",
  "variant_voorraad",
  "variant_status",
  "bol_kanaal",
  "bol_offer_id",
  "bol_product_id",
  "bol_prijs",
  "bol_actief",
  "bol_prijssync",
  "bol_voorraadsync",
  "bol_laatste_sync",
  "bol_sync_status",
];

export function stockState(quantity: number, lowThreshold: number, safety: number) {
  const available = quantity - safety;
  if (quantity <= 0) return "uitverkocht";
  if (available <= 0) return "veiligheidsvoorraad";
  if (quantity <= lowThreshold) return "lage voorraad";
  return "voorradig";
}

export async function exportProductsCsvRows(
  supabase: Client,
  ids: string[],
): Promise<(string | number | null)[][]> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) throw new Error("Selecteer minimaal één product");
  if (unique.length > 500) throw new Error("Maximaal 500 producten per export");

  const { data, error } = await supabase
    .from("products")
    .select(
      `id, name, slug, status, internal_sku, ean, regular_price, sale_price, purchase_cost,
       vat_rate, stock_quantity, low_stock_threshold, safety_stock, bol_product_id,
       brands ( name ), categories!products_category_id_fkey ( name ),
       product_variants ( id, variant_name, sku, ean, regular_price, sale_price, warehouse_stock, safety_stock, status, sort_order ),
       channel_listings ( channel, variant_id, external_offer_id, external_product_id, channel_price,
         is_active, price_sync_enabled, stock_sync_enabled, last_synced_at, last_sync_status )`,
    )
    .in("id", unique)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);

  const rows: (string | number | null)[][] = [PRODUCT_EXPORT_HEADER];

  for (const raw of (data ?? []) as any[]) {
    const base = [
      raw.id,
      raw.name,
      raw.slug,
      PRODUCT_STATUS_LABELS[raw.status] ?? raw.status,
      raw.internal_sku,
      raw.ean,
      raw.brands?.name ?? null,
      raw.categories?.name ?? null,
      Number(raw.regular_price ?? 0),
      raw.sale_price === null ? null : Number(raw.sale_price),
      raw.purchase_cost === null ? null : Number(raw.purchase_cost),
      Number(raw.vat_rate ?? 21),
      Number(raw.stock_quantity ?? 0),
      Number(raw.low_stock_threshold ?? 0),
      Number(raw.safety_stock ?? 0),
      stockState(
        Number(raw.stock_quantity ?? 0),
        Number(raw.low_stock_threshold ?? 0),
        Number(raw.safety_stock ?? 0),
      ),
      Math.max(0, Number(raw.stock_quantity ?? 0) - Number(raw.safety_stock ?? 0)),
    ];

    const variants = [...((raw.product_variants ?? []) as any[])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    const listings = (raw.channel_listings ?? []) as any[];

    const listingCells = (listing: any | undefined) =>
      listing
        ? [
            listing.channel ?? null,
            listing.external_offer_id ?? null,
            listing.external_product_id ?? raw.bol_product_id ?? null,
            listing.channel_price === null || listing.channel_price === undefined
              ? null
              : Number(listing.channel_price),
            listing.is_active ? "ja" : "nee",
            listing.price_sync_enabled ? "ja" : "nee",
            listing.stock_sync_enabled ? "ja" : "nee",
            listing.last_synced_at ?? null,
            listing.last_sync_status ?? null,
          ]
        : [
            null,
            null,
            raw.bol_product_id ?? null,
            null,
            "nee",
            "nee",
            "nee",
            null,
            "niet gekoppeld",
          ];

    if (!variants.length) {
      const listing = listings.find((l) => !l.variant_id) ?? listings[0];
      rows.push([...base, null, null, null, null, null, null, null, ...listingCells(listing)]);
      continue;
    }

    for (const variant of variants) {
      const listing =
        listings.find((l) => l.variant_id === variant.id) ?? listings.find((l) => !l.variant_id);
      rows.push([
        ...base,
        variant.variant_name ?? null,
        variant.sku ?? null,
        variant.ean ?? null,
        Number(variant.regular_price ?? 0),
        variant.sale_price === null ? null : Number(variant.sale_price),
        Number(variant.warehouse_stock ?? 0),
        PRODUCT_STATUS_LABELS[variant.status] ?? variant.status ?? null,
        ...listingCells(listing),
      ]);
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Bulk CSV import (bol.com mapping, stock status, variant data)
// ---------------------------------------------------------------------------

export type ImportApplyResult = {
  productsUpdated: number;
  variantsUpdated: number;
  listingsUpdated: number;
  stockMutations: number;
  processed: number;
  errors: ImportRowError[];
};

export async function applyProductImport(
  supabase: Client,
  rows: { line: number; data: ImportRow }[],
  userId: string | null,
): Promise<ImportApplyResult> {
  const result: ImportApplyResult = {
    productsUpdated: 0,
    variantsUpdated: 0,
    listingsUpdated: 0,
    stockMutations: 0,
    processed: 0,
    errors: [],
  };
  if (!rows.length) return result;
  if (rows.length > 2000) throw new Error("Maximaal 2000 regels per import");

  const ids = Array.from(new Set(rows.map((r) => r.data.product_id)));
  const { data: products, error: pError } = await supabase
    .from("products")
    .select("id, stock_quantity, low_stock_threshold, safety_stock")
    .in("id", ids);
  if (pError) throw new Error(pError.message);
  const productMap = new Map(((products ?? []) as any[]).map((p) => [p.id as string, p]));

  const { data: variants, error: vError } = await supabase
    .from("product_variants")
    .select("id, product_id, sku, ean")
    .in("product_id", ids);
  if (vError) throw new Error(vError.message);
  const variantList = (variants ?? []) as any[];

  const { data: listings, error: lError } = await supabase
    .from("channel_listings")
    .select("id, product_id, variant_id, channel")
    .in("product_id", ids);
  if (lError) throw new Error(lError.message);
  const listingList = (listings ?? []) as any[];

  for (const { line, data } of rows) {
    const product = productMap.get(data.product_id);
    if (!product) {
      result.errors.push({ line, product_id: data.product_id, message: "product niet gevonden" });
      continue;
    }

    try {
      // 1. Stock status on the product itself
      const productPatch: Record<string, unknown> = {};
      if (data.voorraad !== undefined) productPatch["stock_quantity"] = data.voorraad;
      if (data.lage_voorraad_drempel !== undefined)
        productPatch["low_stock_threshold"] = data.lage_voorraad_drempel;
      if (data.veiligheidsvoorraad !== undefined)
        productPatch["safety_stock"] = data.veiligheidsvoorraad;

      if (Object.keys(productPatch).length) {
        productPatch["updated_at"] = new Date().toISOString();
        const { error } = await supabase
          .from("products")
          .update(productPatch as never)
          .eq("id", data.product_id);
        if (error) throw new Error(error.message);
        result.productsUpdated += 1;

        const before = Number(product.stock_quantity ?? 0);
        if (data.voorraad !== undefined && data.voorraad !== before) {
          const delta = data.voorraad - before;
          const { error: mError } = await supabase.from("stock_movements").insert({
            product_id: data.product_id,
            quantity_change: delta,
            reason: "correctie",
            reference_type: "csv_import",
            note: `CSV-import regel ${line}`,
            created_by: userId,
          } as never);
          if (mError) throw new Error(mError.message);
          product.stock_quantity = data.voorraad;
          result.stockMutations += 1;
        }
      }

      // 2. Variant lookup + update
      let variant: any = null;
      if (data.variant_sku || data.variant_ean) {
        variant =
          variantList.find(
            (v) =>
              v.product_id === data.product_id &&
              ((data.variant_sku &&
                v.sku &&
                v.sku.toLowerCase() === data.variant_sku.toLowerCase()) ||
                (data.variant_ean && v.ean === data.variant_ean)),
          ) ?? null;
        if (!variant) {
          result.errors.push({
            line,
            product_id: data.product_id,
            message: `variant niet gevonden (${data.variant_sku ?? data.variant_ean})`,
          });
          continue;
        }
      }

      if (variant) {
        const variantPatch: Record<string, unknown> = {};
        if (data.variant_naam !== undefined) variantPatch["variant_name"] = data.variant_naam;
        if (data.variant_prijs !== undefined) variantPatch["regular_price"] = data.variant_prijs;
        if (data.variant_actieprijs !== undefined)
          variantPatch["sale_price"] = data.variant_actieprijs;
        if (data.variant_status !== undefined) variantPatch["status"] = data.variant_status;
        if (data.variant_voorraad !== undefined)
          variantPatch["warehouse_stock"] = data.variant_voorraad;
        if (Object.keys(variantPatch).length) {
          variantPatch["updated_at"] = new Date().toISOString();
          const { error } = await supabase
            .from("product_variants")
            .update(variantPatch as never)
            .eq("id", variant.id);
          if (error) throw new Error(error.message);
          result.variantsUpdated += 1;
        }
      }

      // 3. bol.com mapping
      const mappingTouched =
        data.bol_offer_id !== undefined ||
        data.bol_product_id !== undefined ||
        data.bol_prijs !== undefined ||
        data.bol_actief !== undefined ||
        data.bol_prijssync !== undefined ||
        data.bol_voorraadsync !== undefined;

      if (mappingTouched) {
        const existing =
          listingList.find(
            (l) =>
              l.product_id === data.product_id &&
              (variant ? l.variant_id === variant.id : !l.variant_id),
          ) ?? null;

        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (data.bol_offer_id !== undefined) payload["external_offer_id"] = data.bol_offer_id;
        if (data.bol_product_id !== undefined) payload["external_product_id"] = data.bol_product_id;
        if (data.bol_prijs !== undefined) payload["channel_price"] = data.bol_prijs;
        if (data.bol_actief !== undefined) payload["is_active"] = data.bol_actief;
        if (data.bol_prijssync !== undefined) payload["price_sync_enabled"] = data.bol_prijssync;
        if (data.bol_voorraadsync !== undefined)
          payload["stock_sync_enabled"] = data.bol_voorraadsync;

        if (existing) {
          const { error } = await supabase
            .from("channel_listings")
            .update(payload as never)
            .eq("id", existing.id);
          if (error) throw new Error(error.message);
        } else {
          const { data: created, error } = await supabase
            .from("channel_listings")
            .insert({
              product_id: data.product_id,
              variant_id: variant ? variant.id : null,
              channel: "bol",
              is_active: data.bol_actief ?? true,
              price_sync_enabled: data.bol_prijssync ?? true,
              stock_sync_enabled: data.bol_voorraadsync ?? true,
              ...payload,
            } as never)
            .select("id, product_id, variant_id, channel")
            .single();
          if (error) throw new Error(error.message);
          listingList.push(created as any);
        }
        result.listingsUpdated += 1;
      }

      result.processed += 1;
    } catch (error) {
      result.errors.push({
        line,
        product_id: data.product_id,
        message: error instanceof Error ? error.message : "onbekende fout",
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Import history
// ---------------------------------------------------------------------------

export type ImportRun = {
  id: string;
  file_name: string;
  user_email: string | null;
  total_lines: number;
  processed: number;
  products_updated: number;
  variants_updated: number;
  listings_updated: number;
  stock_mutations: number;
  error_count: number;
  errors: ImportRowError[];
  created_at: string;
};

export async function fetchImportRuns(supabase: Client, limit = 20): Promise<ImportRun[]> {
  const { data, error } = await supabase
    .from("product_import_runs")
    .select(
      "id, file_name, user_email, total_lines, processed, products_updated, variants_updated, listings_updated, stock_mutations, error_count, errors, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((row) => ({
    ...row,
    errors: Array.isArray(row.errors) ? (row.errors as ImportRowError[]) : [],
  })) as ImportRun[];
}

export async function recordImportRun(input: {
  userId: string | null;
  userEmail: string | null;
  fileName: string;
  totalLines: number;
  processed: number;
  productsUpdated: number;
  variantsUpdated: number;
  listingsUpdated: number;
  stockMutations: number;
  errors: ImportRowError[];
}): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("product_import_runs").insert({
    user_id: input.userId,
    user_email: input.userEmail,
    file_name: input.fileName.slice(0, 255),
    total_lines: input.totalLines,
    processed: input.processed,
    products_updated: input.productsUpdated,
    variants_updated: input.variantsUpdated,
    listings_updated: input.listingsUpdated,
    stock_mutations: input.stockMutations,
    error_count: input.errors.length,
    errors: input.errors.slice(0, 500),
  });
  if (error) console.error("recordImportRun failed", error.message);
}
