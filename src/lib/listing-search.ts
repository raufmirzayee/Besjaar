/**
 * Shared search-param schema for every product listing route.
 *
 * Filters live in the URL so a filtered view can be linked, bookmarked, shared
 * and rendered on the server. All listing routes use the same shape, which lets
 * one listing component drive the shop, category, brand, deals and search pages.
 */

import { SORT_OPTIONS, type SortOption } from "./product-filters";

export type ListingSearch = {
  /** Category slugs. */
  categorie?: string[];
  /** Brand names. */
  merk?: string[];
  min?: number;
  max?: number;
  sale?: boolean;
  voorraad?: boolean;
  sort?: SortOption;
  q?: string;
};

function toStringArray(value: unknown): string[] | undefined {
  if (typeof value === "string" && value) return [value];
  if (Array.isArray(value)) {
    const items = value.filter((v): v is string => typeof v === "string" && v.length > 0);
    return items.length ? items : undefined;
  }
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function toBool(value: unknown): boolean | undefined {
  if (value === true || value === "true" || value === "1") return true;
  return undefined;
}

/** Parses untrusted URL search params into the listing shape. */
export function parseListingSearch(search: Record<string, unknown>): ListingSearch {
  const sort =
    typeof search.sort === "string" && (SORT_OPTIONS as readonly string[]).includes(search.sort)
      ? (search.sort as SortOption)
      : undefined;

  return {
    categorie: toStringArray(search.categorie),
    merk: toStringArray(search.merk),
    min: toNumber(search.min),
    max: toNumber(search.max),
    sale: toBool(search.sale),
    voorraad: toBool(search.voorraad),
    sort,
    q: typeof search.q === "string" && search.q.trim() ? search.q.trim().slice(0, 120) : undefined,
  };
}

export function hasActiveFilters(search: ListingSearch): boolean {
  return Boolean(
    search.categorie?.length ||
    search.merk?.length ||
    search.min !== undefined ||
    search.max !== undefined ||
    search.sale ||
    search.voorraad,
  );
}

/** Empty values are dropped so the URL stays clean. */
export const EMPTY_LISTING_SEARCH: ListingSearch = {
  categorie: undefined,
  merk: undefined,
  min: undefined,
  max: undefined,
  sale: undefined,
  voorraad: undefined,
};
