import { createClient } from "@supabase/supabase-js";

import type { Translations } from "./content-i18n";

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

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  featured: boolean;
  bestseller: boolean;
  rating_average: number;
  rating_count: number;
  brand: string | null;
  category: string | null;
  category_slug: string | null;
  image_url: string | null;
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

const PRODUCT_SELECT = `
  id, name, slug, short_description, regular_price, sale_price, stock_quantity,
  featured, bestseller, rating_average, rating_count, translations,
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
    name: row.name,
    slug: row.slug,
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
    translations: row.translations ?? null,
    brand_translations: row.brands?.translations ?? null,
    category_translations: row.categories?.translations ?? null,
  };
}

export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await publicClient()
    .from("categories")
    .select("id, parent_id, name, slug, description, image_url, icon, sort_order, translations")
    .eq("is_visible", true)
    .eq("is_archived", false)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRow[];
}

export async function fetchProducts(filters: {
  categorySlug?: string;
  search?: string;
  featured?: boolean;
  bestseller?: boolean;
  sort?: "nieuwste" | "prijs-op" | "prijs-af" | "naam";
  limit?: number;
}): Promise<ProductListItem[]> {
  const supabase = publicClient();
  let query = supabase.from("products").select(PRODUCT_SELECT).eq("status", "active");

  if (filters.featured) query = query.eq("featured", true);
  if (filters.bestseller) query = query.eq("bestseller", true);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);

  if (filters.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle();
    const { data: children } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", (cat as any)?.id ?? "00000000-0000-0000-0000-000000000000");
    const ids = [(cat as any)?.id, ...((children ?? []) as any[]).map((c) => c.id)].filter(Boolean);
    if (ids.length === 0) return [];
    query = query.in("category_id", ids);
  }

  switch (filters.sort) {
    case "prijs-op":
      query = query.order("regular_price", { ascending: true });
      break;
    case "prijs-af":
      query = query.order("regular_price", { ascending: false });
      break;
    case "naam":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map(mapProduct);
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `${PRODUCT_SELECT}, full_description, selling_points, specifications, warranty_months, ean,
       product_variants ( id, variant_name, regular_price, sale_price, warehouse_stock, sort_order, status )`,
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

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
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        id: v.id,
        variant_name: v.variant_name,
        regular_price: Number(v.regular_price),
        sale_price: v.sale_price === null ? null : Number(v.sale_price),
        warehouse_stock: v.warehouse_stock ?? 0,
      })),
  };
}
