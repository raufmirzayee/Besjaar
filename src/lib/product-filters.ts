/**
 * Shared, pure filtering and sorting for product listings.
 *
 * Both the Supabase-backed catalogue and the bundled workbook catalogue run
 * through this module, so the shop, category and brand pages behave identically
 * whichever source is active. Pure functions, so they are unit-testable and
 * safe to run on the server or the client.
 */

import type { ProductListItem } from "./catalog.server";

export const SORT_OPTIONS = [
  "populariteit",
  "prijs-op",
  "prijs-af",
  "nieuwste",
  "naam",
  "korting",
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export type ProductFilters = {
  categorySlugs?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  search?: string;
  sort?: SortOption;
  limit?: number;
};

export function effectivePriceOf(product: ProductListItem): number {
  return product.sale_price !== null && product.sale_price < product.regular_price
    ? product.sale_price
    : product.regular_price;
}

export function isOnSale(product: ProductListItem): boolean {
  return product.sale_price !== null && product.sale_price < product.regular_price;
}

export function discountOf(product: ProductListItem): number {
  if (!isOnSale(product) || product.regular_price <= 0) return 0;
  return Math.round(((product.regular_price - product.sale_price!) / product.regular_price) * 100);
}

function matchesSearch(product: ProductListItem, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = [
    product.name,
    product.full_title ?? "",
    product.brand ?? "",
    product.category ?? "",
    product.product_id ?? "",
    (product.highlights ?? []).join(" "),
    product.short_description ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function filterProducts(
  items: ProductListItem[],
  filters: ProductFilters,
): ProductListItem[] {
  let result = items;

  if (filters.categorySlugs?.length) {
    const wanted = new Set(filters.categorySlugs);
    result = result.filter((p) => p.category_slug && wanted.has(p.category_slug));
  }

  if (filters.brands?.length) {
    const wanted = new Set(filters.brands.map((b) => b.toLowerCase()));
    result = result.filter((p) => p.brand && wanted.has(p.brand.toLowerCase()));
  }

  if (typeof filters.minPrice === "number") {
    result = result.filter((p) => effectivePriceOf(p) >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === "number") {
    result = result.filter((p) => effectivePriceOf(p) <= filters.maxPrice!);
  }

  if (filters.featured) result = result.filter((p) => p.featured);
  if (filters.bestseller) result = result.filter((p) => p.bestseller);
  if (filters.onSale) result = result.filter(isOnSale);
  if (filters.inStock) result = result.filter((p) => p.stock_quantity > 0);
  if (filters.search) result = result.filter((p) => matchesSearch(p, filters.search!));

  result = sortProducts(result, filters.sort ?? "populariteit");

  return filters.limit ? result.slice(0, filters.limit) : result;
}

export function sortProducts(items: ProductListItem[], sort: SortOption): ProductListItem[] {
  const sorted = [...items];
  switch (sort) {
    case "prijs-op":
      sorted.sort((a, b) => effectivePriceOf(a) - effectivePriceOf(b));
      break;
    case "prijs-af":
      sorted.sort((a, b) => effectivePriceOf(b) - effectivePriceOf(a));
      break;
    case "naam":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "nl"));
      break;
    case "korting":
      sorted.sort((a, b) => discountOf(b) - discountOf(a) || effectivePriceOf(a) - effectivePriceOf(b));
      break;
    case "nieuwste":
      // The catalogue has no publication dates, so "newest" falls back to the
      // catalogue's own order rather than inventing recency.
      break;
    case "populariteit":
    default:
      // Popularity uses the review counts the source data actually reports.
      sorted.sort(
        (a, b) =>
          Number(b.bestseller) - Number(a.bestseller) ||
          b.rating_count - a.rating_count ||
          a.name.localeCompare(b.name, "nl"),
      );
      break;
  }
  return sorted;
}

/** Facet counts for the filter sidebar, computed from the unfiltered set. */
export function facetCounts(items: ProductListItem[]) {
  const categories: Record<string, number> = {};
  const brands: Record<string, number> = {};
  let onSale = 0;
  let inStock = 0;

  for (const product of items) {
    if (product.category_slug) {
      categories[product.category_slug] = (categories[product.category_slug] ?? 0) + 1;
    }
    if (product.brand) {
      brands[product.brand] = (brands[product.brand] ?? 0) + 1;
    }
    if (isOnSale(product)) onSale += 1;
    if (product.stock_quantity > 0) inStock += 1;
  }

  return { categories, brands, onSale, inStock };
}
