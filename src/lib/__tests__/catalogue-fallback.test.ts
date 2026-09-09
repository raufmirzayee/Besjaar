/**
 * Catalogue integrity regression suite.
 *
 * These assertions encode the rules the product workbook import must keep:
 * one product per Product ID, no invented discounts or ratings, and a
 * storefront that still serves the catalogue when Supabase is unavailable.
 */
import { describe, expect, it } from "vitest";

import {
  brands,
  categories,
  getProductBySlug,
  isOnSale,
  products,
  relatedProducts,
  saleProducts,
  searchProducts,
} from "@/data/catalogue";
import {
  fetchAllProducts,
  fetchBrands,
  fetchCategories,
  fetchProductBySlug,
  hasSupabaseConfig,
} from "@/lib/catalog.server";
import { discountOf, facetCounts, filterProducts, sortProducts } from "@/lib/product-filters";

describe("catalogue data integrity", () => {
  it("holds exactly the 51 unique products from the workbook", () => {
    expect(products).toHaveLength(51);
    expect(new Set(products.map((p) => p.productId)).size).toBe(51);
  });

  it("gives every product a unique slug", () => {
    const slugs = products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("has the ten workbook categories and three normalised brands", () => {
    expect(categories).toHaveLength(10);
    expect(brands.map((b) => b.name).sort()).toEqual(["Besjaar", "LYNEX", "RYNEX"]);
    // Brand spelling is standardised; no lowercase Rynex/Lynex survives.
    for (const product of products) {
      expect(["Besjaar", "RYNEX", "LYNEX"]).toContain(product.brand);
    }
  });

  it("never manufactures a discount", () => {
    for (const product of products) {
      if (product.compareAtPrice === null) {
        expect(product.discountPercentage).toBe(0);
      } else {
        // A compare-at price only exists when it is genuinely higher.
        expect(product.compareAtPrice).toBeGreaterThan(product.price);
        expect(product.discountPercentage).toBeGreaterThan(0);
      }
      expect(product.price).toBeGreaterThan(0);
    }
    expect(saleProducts()).toHaveLength(16);
  });

  it("carries review counts but no invented star ratings", async () => {
    const listed = await fetchAllProducts();
    for (const product of listed) {
      expect(product.rating_average).toBe(0);
      expect(product.rating_count).toBeGreaterThanOrEqual(0);
    }
  });

  it("keeps the real image and source URLs", () => {
    for (const product of products) {
      expect(product.imageUrl).toBeTruthy();
      expect(product.imageUrl).toMatch(/^https:\/\//);
    }
  });

  it("only badges a bestseller that has reviews behind it", () => {
    for (const product of products.filter((p) => p.bestseller)) {
      expect(product.reviewCount).toBeGreaterThan(0);
    }
  });
});

describe("storefront without Supabase", () => {
  it("serves the bundled catalogue instead of failing", async () => {
    expect(hasSupabaseConfig()).toBe(false);
    await expect(fetchAllProducts()).resolves.toHaveLength(51);
    await expect(fetchCategories()).resolves.toHaveLength(10);
    await expect(fetchBrands()).resolves.toHaveLength(3);
  });

  it("resolves a product detail page by slug", async () => {
    const detail = await fetchProductBySlug(products[0].slug);
    expect(detail?.name).toBe(products[0].name);
    expect(detail?.images.length).toBeGreaterThan(0);
  });

  it("returns null for an unknown slug rather than throwing", async () => {
    await expect(fetchProductBySlug("bestaat-niet")).resolves.toBeNull();
  });
});

describe("filtering and sorting", () => {
  it("counts facets that match the workbook summary", async () => {
    const all = await fetchAllProducts();
    const facets = facetCounts(all);
    expect(facets.categories["kamperen-outdoor"]).toBe(16);
    expect(facets.categories["badkamer"]).toBe(5);
    expect(facets.brands["Besjaar"]).toBe(34);
    expect(facets.brands["RYNEX"]).toBe(15);
    expect(facets.brands["LYNEX"]).toBe(2);
    expect(facets.onSale).toBe(16);
  });

  it("filters by category, brand, price and sale", async () => {
    const all = await fetchAllProducts();
    expect(filterProducts(all, { categorySlugs: ["badkamer"] })).toHaveLength(5);
    expect(filterProducts(all, { brands: ["LYNEX"] })).toHaveLength(2);
    expect(filterProducts(all, { onSale: true })).toHaveLength(16);
    const cheap = filterProducts(all, { maxPrice: 10 });
    expect(cheap.every((p) => (p.sale_price ?? p.regular_price) <= 10)).toBe(true);
  });

  it("sorts by price in both directions", async () => {
    const all = await fetchAllProducts();
    const asc = sortProducts(all, "prijs-op").map((p) => p.sale_price ?? p.regular_price);
    expect([...asc].sort((a, b) => a - b)).toEqual(asc);
    const desc = sortProducts(all, "prijs-af").map((p) => p.sale_price ?? p.regular_price);
    expect([...desc].sort((a, b) => b - a)).toEqual(desc);
  });

  it("sorts by genuine discount", async () => {
    const all = await fetchAllProducts();
    const discounts = sortProducts(all, "korting").map(discountOf);
    expect([...discounts].sort((a, b) => b - a)).toEqual(discounts);
  });
});

describe("search", () => {
  it("matches on name, brand and Product ID", () => {
    expect(searchProducts("zaklamp").length).toBeGreaterThan(5);
    expect(searchProducts("lynex").length).toBe(2);
    const byId = searchProducts(products[0].productId);
    expect(byId).toHaveLength(1);
    expect(byId[0].slug).toBe(products[0].slug);
  });

  it("returns nothing for an empty query and for gibberish", () => {
    expect(searchProducts("")).toHaveLength(0);
    expect(searchProducts("qzxwv")).toHaveLength(0);
  });
});

describe("related products", () => {
  it("prefers the same category and never repeats the product itself", () => {
    for (const product of products) {
      const related = relatedProducts(product, 4);
      expect(related).toHaveLength(4);
      expect(related.map((r) => r.slug)).not.toContain(product.slug);
      expect(new Set(related.map((r) => r.slug)).size).toBe(related.length);
    }
  });

  it("is deterministic", () => {
    const product = getProductBySlug(products[3].slug)!;
    expect(relatedProducts(product).map((p) => p.slug)).toEqual(
      relatedProducts(product).map((p) => p.slug),
    );
  });
});

describe("sale helpers", () => {
  it("agrees between the catalogue and the listing types", async () => {
    const all = await fetchAllProducts();
    const listingSale = all.filter((p) => p.sale_price !== null).length;
    expect(listingSale).toBe(products.filter(isOnSale).length);
  });
});
