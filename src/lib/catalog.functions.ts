import { createServerFn } from "@tanstack/react-start";

import {
  fetchAllProducts,
  fetchBrands,
  fetchCategories,
  fetchProductBySlug,
  fetchProducts,
} from "./catalog.server";
import { SORT_OPTIONS, type ProductFilters, type SortOption } from "./product-filters";

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  return fetchCategories();
});

export const getBrands = createServerFn({ method: "GET" }).handler(async () => {
  return fetchBrands();
});

/** The whole active catalogue — listing pages filter it client-side. */
export const getAllProducts = createServerFn({ method: "GET" }).handler(async () => {
  return fetchAllProducts();
});

function sanitiseFilters(input: ProductFilters | undefined): ProductFilters {
  const filters = input ?? {};
  const sort: SortOption | undefined =
    filters.sort && (SORT_OPTIONS as readonly string[]).includes(filters.sort)
      ? filters.sort
      : undefined;
  return {
    categorySlugs: filters.categorySlugs?.filter(Boolean),
    brands: filters.brands?.filter(Boolean),
    minPrice: Number.isFinite(filters.minPrice) ? filters.minPrice : undefined,
    maxPrice: Number.isFinite(filters.maxPrice) ? filters.maxPrice : undefined,
    onSale: filters.onSale === true,
    inStock: filters.inStock === true,
    featured: filters.featured === true,
    bestseller: filters.bestseller === true,
    search: typeof filters.search === "string" ? filters.search.slice(0, 120) : undefined,
    sort,
    limit:
      typeof filters.limit === "number" && filters.limit > 0
        ? Math.min(filters.limit, 200)
        : undefined,
  };
}

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((input: ProductFilters | undefined) => sanitiseFilters(input))
  .handler(async ({ data }) => {
    return fetchProducts(data);
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 200) }))
  .handler(async ({ data }) => {
    return fetchProductBySlug(data.slug);
  });
