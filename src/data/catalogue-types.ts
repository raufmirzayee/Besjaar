/**
 * Shape of the generated Besjaar catalogue.
 *
 * The catalogue is produced from data/EenTop_Besjaar_Sorted_Product_Catalogue.xlsx
 * by scripts/build_catalogue.py. See src/data/catalogue.ts for the helpers the
 * application uses.
 */

export type CatalogueCategory = {
  name: string;
  slug: string;
  sortOrder: number;
  description: string;
};

export type CatalogueBrand = {
  name: string;
  slug: string;
  description: string;
};

export type CatalogueProduct = {
  /** bol.com Product ID — the canonical deduplication key from the workbook. */
  productId: string;
  slug: string;
  /** Shortened, human-readable display name. */
  name: string;
  /** The manufacturer's original, keyword-dense product title. */
  fullTitle: string;
  brand: string;
  category: string;
  categorySlug: string;
  /** Current selling price in EUR. */
  price: number;
  /** Regular price, only present when it is genuinely higher than `price`. */
  compareAtPrice: number | null;
  /** 0 when there is no genuine discount. */
  discountPercentage: number;
  /**
   * Number of reviews reported by the source listing. There is no rating value
   * in the source data, so the store never shows a star rating for these.
   */
  reviewCount: number;
  availability: string;
  imageUrl: string | null;
  /** Original marketplace listing URL, retained for bol.com mapping. */
  sourceUrl: string | null;
  /** De-duplicated segments of the original title. */
  highlights: string[];
  /** Specifications extracted literally from the original title. */
  specifications: Record<string, string>;
  bestseller: boolean;
  featured: boolean;
};
