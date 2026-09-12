import { createClient } from "@supabase/supabase-js";

import type { Translations } from "./content-i18n";
import {
  catalogueBrandRows,
  catalogueCategoryRows,
  catalogueProductDetail,
  catalogueProductList,
} from "./catalogue-source";
import { filterProducts, type ProductFilters } from "./product-filters";

export type CategoryRow = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
  translations: Translations;
};

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  /** Brand descriptions translate; brand names are proper nouns and do not. */
  translations: Translations;
};

export type ProductListItem = {
  id: string;
  /** Workbook Product ID — also the bol.com identifier. */
  product_id: string | null;
  name: string;
  slug: string;
  /** The manufacturer's original, keyword-dense title. */
  full_title: string | null;
  short_description: string | null;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  featured: boolean;
  bestseller: boolean;
  /**
   * 0 when no genuine rating exists. The storefront only renders stars when
   * this is above 0, so imported products never show an invented score.
   */
  rating_average: number;
  rating_count: number;
  brand: string | null;
  category: string | null;
  category_slug: string | null;
  image_url: string | null;
  availability: string | null;
  source_url: string | null;
  /**
   * The barcode, when the product has one. On the list type rather than only
   * on the detail type because the Google Shopping feed is built from the list
   * query, and a feed that cannot see a real GTIN has to declare there is none.
   */
  ean: string | null;
  highlights: string[];
  translations: Translations;
  brand_translations: Translations;
  category_translations: Translations;
};

export type ProductDetail = ProductListItem & {
  full_description: string | null;
  selling_points: string[];
  specifications: Record<string, string>;
  warranty_months: number | null;
  ean: string | null;
  images: string[];
  variants: {
    id: string;
    variant_name: string;
    regular_price: number;
    sale_price: number | null;
    warehouse_stock: number;
  }[];
};

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/**
 * Runs a Supabase read, falling back to the bundled catalogue when Supabase is
 * unconfigured or unreachable. A storefront that cannot reach its database
 * should still show the catalogue rather than an error page.
 */
async function withCatalogueFallback<T>(
  label: string,
  read: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  if (!hasSupabaseConfig()) return fallback();
  try {
    return await read();
  } catch (error) {
    console.error(`[catalog] ${label} failed, serving the bundled catalogue instead:`, error);
    return fallback();
  }
}

const PRODUCT_SELECT = `
  id, name, slug, short_description, full_description, regular_price, sale_price, stock_quantity,
  featured, bestseller, rating_average, rating_count, translations, bol_product_id, search_keywords,
  selling_points, ean,
  brands ( name, translations ),
  categories!products_category_id_fkey ( name, slug, translations ),
  product_images ( image_url, is_main, sort_order )
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProduct(row: any): ProductListItem {
  const images: any[] = row.product_images ?? [];
  const sorted = [...images].sort(
    (a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order,
  );
  return {
    id: row.id,
    product_id: row.bol_product_id ?? null,
    name: row.name,
    slug: row.slug,
    full_title: row.full_description ?? null,
    short_description: row.short_description,
    regular_price: Number(row.regular_price),
    sale_price: row.sale_price === null ? null : Number(row.sale_price),
    stock_quantity: row.stock_quantity ?? 0,
    featured: !!row.featured,
    bestseller: !!row.bestseller,
    rating_average: Number(row.rating_average ?? 0),
    rating_count: row.rating_count ?? 0,
    brand: row.brands?.name ?? null,
    category: row.categories?.name ?? null,
    category_slug: row.categories?.slug ?? null,
    image_url: sorted[0]?.image_url ?? null,
    availability: (row.stock_quantity ?? 0) > 0 ? "Op voorraad" : "Tijdelijk niet beschikbaar",
    source_url: null,
    ean: row.ean ?? null,
    highlights: Array.isArray(row.selling_points) ? row.selling_points : [],
    translations: row.translations ?? null,
    brand_translations: row.brands?.translations ?? null,
    category_translations: row.categories?.translations ?? null,
  };
}

export async function fetchCategories(): Promise<CategoryRow[]> {
  return withCatalogueFallback(
    "fetchCategories",
    async () => {
      const { data, error } = await publicClient()
        .from("categories")
        .select("id, parent_id, name, slug, description, image_url, icon, sort_order, translations")
        .eq("is_visible", true)
        .eq("is_archived", false)
        .order("sort_order");
      if (error) throw new Error(error.message);
      if (!data?.length) return catalogueCategoryRows();
      return data as CategoryRow[];
    },
    catalogueCategoryRows,
  );
}

export async function fetchBrands(): Promise<BrandRow[]> {
  return withCatalogueFallback(
    "fetchBrands",
    async () => {
      const { data, error } = await publicClient()
        .from("brands")
        .select("id, name, slug, description, logo_url, translations")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw new Error(error.message);
      if (!data?.length) return catalogueBrandRows();
      return data as BrandRow[];
    },
    catalogueBrandRows,
  );
}

/**
 * The full active catalogue. It is small (tens of products), so it is fetched
 * once and filtered in memory — that keeps filtering identical across both
 * sources and avoids a round trip per facet change.
 */
export async function fetchAllProducts(): Promise<ProductListItem[]> {
  return withCatalogueFallback(
    "fetchAllProducts",
    async () => {
      const { data, error } = await publicClient()
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      if (!data?.length) return catalogueProductList();
      return (data as any[]).map(mapProduct);
    },
    catalogueProductList,
  );
}

export async function fetchProducts(filters: ProductFilters): Promise<ProductListItem[]> {
  return filterProducts(await fetchAllProducts(), filters);
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  return withCatalogueFallback(
    "fetchProductBySlug",
    async () => {
      const { data, error } = await publicClient()
        .from("products")
        .select(
          `${PRODUCT_SELECT}, specifications, warranty_months, ean,
           product_variants ( id, variant_name, regular_price, sale_price, warehouse_stock, sort_order, status )`,
        )
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return catalogueProductDetail(slug);

      const row = data as any;
      const base = mapProduct(row);
      const images: any[] = row.product_images ?? [];

      return {
        ...base,
        full_description: row.full_description,
        selling_points: Array.isArray(row.selling_points) ? row.selling_points : [],
        specifications:
          row.specifications && typeof row.specifications === "object" ? row.specifications : {},
        warranty_months: row.warranty_months ?? null,
        ean: row.ean ?? null,
        images: [...images]
          .sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order)
          .map((i) => i.image_url),
        variants: ((row.product_variants ?? []) as any[])
          .filter((v) => v.status === "active")
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((v) => ({
            id: v.id,
            variant_name: v.variant_name,
            regular_price: Number(v.regular_price),
            sale_price: v.sale_price === null ? null : Number(v.sale_price),
            warehouse_stock: v.warehouse_stock ?? 0,
          })),
      };
    },
    () => catalogueProductDetail(slug),
  );
}
