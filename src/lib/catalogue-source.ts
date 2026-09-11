/**
 * Maps the generated Besjaar catalogue onto the storefront's product types.
 *
 * Supabase is the production catalogue. When it is not configured — a fresh
 * checkout, CI, a preview build, or an outage — the store falls back to the
 * catalogue bundled from the product workbook so every page still renders real
 * products instead of an error. Both paths produce the same shapes, and the
 * filtering below is shared, so behaviour does not change with the source.
 */

import {
  brandSlug,
  products as catalogueProducts,
  categories as catalogueCategories,
  brands as catalogueBrands,
} from "@/data/catalogue";
import {
  CATALOGUE_BRAND_TRANSLATIONS,
  CATALOGUE_CATEGORY_TRANSLATIONS,
  CATALOGUE_PRODUCT_TRANSLATIONS,
} from "@/data/catalogue-translations";
import type { CatalogueProduct } from "@/data/catalogue-types";
import type { CategoryRow, ProductDetail, ProductListItem } from "./catalog.server";

/**
 * Default on-hand stock for a catalogue-sourced product.
 *
 * The workbook records availability ("Op voorraad") but no quantity, so the
 * storefront shows the availability wording rather than a number. This value
 * only exists so cart and checkout have something to check against; real
 * quantities come from Supabase inventory once connected.
 */
export const DEFAULT_CATALOGUE_STOCK = 25;

function toListItem(product: CatalogueProduct): ProductListItem {
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  return {
    // Deterministic id so cart lines and wishlists stay stable across reloads.
    id: `catalogue:${product.productId}`,
    product_id: product.productId,
    name: product.name,
    slug: product.slug,
    full_title: product.fullTitle,
    short_description: product.highlights.slice(0, 3).join(" · ") || null,
    regular_price: onSale ? product.compareAtPrice! : product.price,
    sale_price: onSale ? product.price : null,
    stock_quantity: DEFAULT_CATALOGUE_STOCK,
    featured: product.featured,
    bestseller: product.bestseller,
    // The workbook reports review counts but no rating value, so the store
    // never shows a star rating for catalogue products.
    rating_average: 0,
    rating_count: product.reviewCount,
    brand: product.brand,
    category: product.category,
    category_slug: product.categorySlug,
    image_url: product.imageUrl,
    availability: product.availability,
    source_url: product.sourceUrl,
    // The workbook carries no barcodes. Null rather than an empty string, so
    // the feed declares "no identifier" instead of sending a blank one.
    ean: null,
    highlights: product.highlights,
    // These used to be null, so switching to English, German or French left
    // every product name and category in Dutch while the interface around them
    // translated. They carry the same shape Supabase's `translations` column
    // does, so `localize()` reads both without knowing which source it got.
    translations: CATALOGUE_PRODUCT_TRANSLATIONS[product.slug] ?? null,
    brand_translations: CATALOGUE_BRAND_TRANSLATIONS[brandSlug(product.brand)] ?? null,
    category_translations: CATALOGUE_CATEGORY_TRANSLATIONS[product.categorySlug] ?? null,
  };
}

function toDetail(product: CatalogueProduct): ProductDetail {
  return {
    ...toListItem(product),
    full_description: product.fullTitle,
    selling_points: product.highlights,
    specifications: product.specifications,
    warranty_months: null,
    ean: null,
    images: product.imageUrl ? [product.imageUrl] : [],
    variants: [],
  };
}

export function catalogueProductList(): ProductListItem[] {
  return catalogueProducts.map(toListItem);
}

export function catalogueProductDetail(slug: string): ProductDetail | null {
  const match = catalogueProducts.find((p) => p.slug === slug);
  return match ? toDetail(match) : null;
}

export function catalogueCategoryRows(): CategoryRow[] {
  const counts = new Map<string, number>();
  for (const product of catalogueProducts) {
    counts.set(product.categorySlug, (counts.get(product.categorySlug) ?? 0) + 1);
  }
  return catalogueCategories.map((category) => ({
    id: `catalogue:category:${category.slug}`,
    parent_id: null,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image_url: null,
    icon: null,
    sort_order: category.sortOrder,
    translations: CATALOGUE_CATEGORY_TRANSLATIONS[category.slug] ?? null,
  }));
}

export function catalogueBrandRows() {
  return catalogueBrands.map((brand) => ({
    id: `catalogue:brand:${brand.slug}`,
    name: brand.name,
    slug: brand.slug,
    description: brand.description,
    logo_url: null,
    translations: CATALOGUE_BRAND_TRANSLATIONS[brand.slug] ?? null,
  }));
}

export { brandSlug };
