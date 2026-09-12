/**
 * The Besjaar catalogue and the derived views the storefront needs.
 *
 * The generated module (catalogue.generated.ts) is the single source of truth,
 * produced from the supplied product workbook. Everything here is a pure,
 * side-effect-free derivation of it, so it is safe on the server and the client.
 */

import { CATALOGUE_BRANDS, CATALOGUE_CATEGORIES, CATALOGUE_PRODUCTS } from "./catalogue.generated";
import type { CatalogueBrand, CatalogueCategory, CatalogueProduct } from "./catalogue-types";

export type { CatalogueBrand, CatalogueCategory, CatalogueProduct };

export const products: CatalogueProduct[] = CATALOGUE_PRODUCTS;
export const categories: CatalogueCategory[] = CATALOGUE_CATEGORIES;
export const brands: CatalogueBrand[] = CATALOGUE_BRANDS;

const bySlug = new Map(products.map((p) => [p.slug, p]));
const byProductId = new Map(products.map((p) => [p.productId, p]));
const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
const brandBySlug = new Map(brands.map((b) => [b.slug, b]));

export function getProductBySlug(slug: string): CatalogueProduct | undefined {
  return bySlug.get(slug);
}

export function getProductByProductId(productId: string): CatalogueProduct | undefined {
  return byProductId.get(productId);
}

export function getCategoryBySlug(slug: string): CatalogueCategory | undefined {
  return categoryBySlug.get(slug);
}

export function getBrandBySlug(slug: string): CatalogueBrand | undefined {
  return brandBySlug.get(slug);
}

/** Products per category, in the catalogue's own display order. */
export function countByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const product of products) {
    counts[product.categorySlug] = (counts[product.categorySlug] ?? 0) + 1;
  }
  return counts;
}

export function countByBrand(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const product of products) {
    const slug = brandSlug(product.brand);
    counts[slug] = (counts[slug] ?? 0) + 1;
  }
  return counts;
}

export function brandSlug(brand: string): string {
  return brand.toLowerCase();
}

/** A product is on sale only when the workbook gave it a higher regular price. */
export function isOnSale(product: CatalogueProduct): boolean {
  return product.compareAtPrice !== null && product.compareAtPrice > product.price;
}

export function saleProducts(): CatalogueProduct[] {
  return products.filter(isOnSale).sort((a, b) => b.discountPercentage - a.discountPercentage);
}

export function bestsellers(limit = 8): CatalogueProduct[] {
  return products
    .filter((p) => p.bestseller)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export function productsInCategory(categorySlug: string): CatalogueProduct[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function productsForBrand(slug: string): CatalogueProduct[] {
  return products.filter((p) => brandSlug(p.brand) === slug);
}

export const priceRange = {
  min: Math.floor(Math.min(...products.map((p) => p.price))),
  max: Math.ceil(Math.max(...products.map((p) => p.price))),
};

/**
 * Related products: same category first, then the same brand, then a
 * complementary category. Never random — the order is deterministic so the
 * same product always shows the same recommendations.
 */
export function relatedProducts(product: CatalogueProduct, limit = 4): CatalogueProduct[] {
  const seen = new Set([product.slug]);
  const picked: CatalogueProduct[] = [];

  const take = (candidates: CatalogueProduct[]) => {
    for (const candidate of candidates) {
      if (picked.length >= limit) return;
      if (seen.has(candidate.slug)) continue;
      seen.add(candidate.slug);
      picked.push(candidate);
    }
  };

  const sameCategory = products
    .filter((p) => p.categorySlug === product.categorySlug)
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price));
  take(sameCategory);

  take(products.filter((p) => p.brand === product.brand));

  take(
    products
      .filter((p) => p.categorySlug !== product.categorySlug)
      .sort((a, b) => b.reviewCount - a.reviewCount),
  );

  return picked.slice(0, limit);
}

/**
 * Search across the fields a shopper would actually type: display name, the
 * manufacturer's full title, brand, category, specifications and Product ID.
 */
export function searchProducts(query: string, limit?: number): CatalogueProduct[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (terms.length === 0) return [];

  const scored = products
    .map((product) => {
      const name = product.name.toLowerCase();
      const haystack = [
        product.name,
        product.fullTitle,
        product.brand,
        product.category,
        product.productId,
        product.highlights.join(" "),
        Object.values(product.specifications).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const term of terms) {
        if (!haystack.includes(term)) return null;
        if (name.startsWith(term)) score += 5;
        else if (name.includes(term)) score += 3;
        else if (product.brand.toLowerCase().includes(term)) score += 2;
        else score += 1;
      }
      // Well-reviewed products break ties, so results feel sensibly ordered.
      return { product, score: score * 1000 + Math.min(product.reviewCount, 999) };
    })
    .filter((entry): entry is { product: CatalogueProduct; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);

  return limit ? scored.slice(0, limit) : scored;
}
