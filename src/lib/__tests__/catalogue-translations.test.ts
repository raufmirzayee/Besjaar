import { describe, expect, it } from "vitest";

import { brands, categories, products } from "@/data/catalogue";
import {
  CATALOGUE_BRAND_TRANSLATIONS,
  CATALOGUE_CATEGORY_TRANSLATIONS,
  CATALOGUE_PRODUCT_TRANSLATIONS,
} from "@/data/catalogue-translations";
import { localize } from "../content-i18n";
import {
  catalogueBrandRows,
  catalogueCategoryRows,
  catalogueProductList,
} from "../catalogue-source";
import { LOCALES, type Locale } from "../locale-detect";

/**
 * The bundled catalogue is what the shop serves when Supabase is not
 * configured — a fresh checkout, CI, a preview build or an outage. It used to
 * carry `translations: null`, so switching to English, German or French
 * translated the interface and left every product name, category and brand
 * description in Dutch.
 *
 * These tests hold the asset complete: every product, every category, every
 * brand, in every language. A product added to the workbook without
 * translations fails the build rather than shipping a half-Dutch shop.
 */

const OTHER_LOCALES = LOCALES.filter((l): l is Locale => l !== "nl");

/**
 * Names that are the same word in Dutch and in the target language.
 *
 * These are English loanwords the Dutch catalogue already uses — "Airstyler",
 * "Multistyler", "Thermal Brush" — so the English is identical by definition
 * and German borrows the same terms. Listing them here is the difference
 * between a translation that was checked and one that was forgotten.
 */
const SAME_IN_BOTH_LANGUAGES = new Set([
  "lynex-airstyler.en",
  "lynex-airstyler.de",
  "rynex-massage-gun.en",
  "besjaar-multistyler.en",
  "besjaar-multistyler.de",
  "lynex-thermal-brush.en",
]);

/** The same, for categories. German writes "Lifestyle & Accessoires" too. */
const CATEGORY_SAME_IN_BOTH = new Set(["lifestyle-accessoires.de"]);

describe("bundled catalogue translations", () => {
  it("covers every product in every language", () => {
    const missing: string[] = [];
    for (const product of products) {
      const entry = CATALOGUE_PRODUCT_TRANSLATIONS[product.slug];
      if (!entry) {
        missing.push(`${product.slug}: no translations at all`);
        continue;
      }
      for (const locale of OTHER_LOCALES) {
        for (const field of ["name", "short_description"]) {
          const value = entry[locale]?.[field];
          if (typeof value !== "string" || value.trim().length === 0) {
            missing.push(`${product.slug}.${locale}.${field}`);
          }
        }
      }
    }
    expect(missing, "products missing translations").toEqual([]);
  });

  it("covers every category in every language", () => {
    const missing: string[] = [];
    for (const category of categories) {
      const entry = CATALOGUE_CATEGORY_TRANSLATIONS[category.slug];
      for (const locale of OTHER_LOCALES) {
        for (const field of ["name", "description"]) {
          const value = entry?.[locale]?.[field];
          if (typeof value !== "string" || value.trim().length === 0) {
            missing.push(`${category.slug}.${locale}.${field}`);
          }
        }
      }
    }
    expect(missing, "categories missing translations").toEqual([]);
  });

  it("covers every brand in every language", () => {
    const missing: string[] = [];
    for (const brand of brands) {
      const entry = CATALOGUE_BRAND_TRANSLATIONS[brand.slug];
      for (const locale of OTHER_LOCALES) {
        const value = entry?.[locale]?.description;
        if (typeof value !== "string" || value.trim().length === 0) {
          missing.push(`${brand.slug}.${locale}.description`);
        }
      }
    }
    expect(missing, "brands missing translations").toEqual([]);
  });

  it("does not leave a translation identical to the Dutch original", () => {
    // A copy-paste that never got translated is invisible otherwise: the field
    // is present, non-empty, and wrong. The exceptions below are real — Dutch
    // uses these English terms unchanged, and so does German — so translating
    // them would be the error.
    const untranslated = new Set<string>();
    for (const product of products) {
      const entry = CATALOGUE_PRODUCT_TRANSLATIONS[product.slug];
      for (const locale of OTHER_LOCALES) {
        if (entry?.[locale]?.name === product.name) {
          untranslated.add(`${product.slug}.${locale}`);
        }
      }
    }
    for (const allowed of SAME_IN_BOTH_LANGUAGES) untranslated.delete(allowed);
    expect([...untranslated], "product names left in Dutch").toEqual([]);
  });

  it("renders a translated name for every product in every language", () => {
    // The behaviour that actually matters: what the storefront shows.
    const rows = catalogueProductList();
    expect(rows.length).toBeGreaterThan(0);
    const stillDutch: string[] = [];
    for (const locale of LOCALES) {
      for (const row of rows) {
        const name = localize(row, "name", locale);
        expect(name.length, `${row.slug} in ${locale}`).toBeGreaterThan(0);
        if (
          locale !== "nl" &&
          name === row.name &&
          !SAME_IN_BOTH_LANGUAGES.has(`${row.slug}.${locale}`)
        ) {
          stillDutch.push(`${row.slug}.${locale}`);
        }
      }
    }
    expect(stillDutch, "product names rendering in Dutch").toEqual([]);
  });

  it("renders a translated category and brand for every language", () => {
    const stillDutch: string[] = [];
    for (const locale of OTHER_LOCALES) {
      for (const row of catalogueCategoryRows()) {
        if (
          localize(row, "name", locale) === row.name &&
          !CATEGORY_SAME_IN_BOTH.has(`${row.slug}.${locale}`)
        ) {
          stillDutch.push(`category ${row.slug}.${locale}.name`);
        }
        if (localize(row, "description", locale) === row.description) {
          stillDutch.push(`category ${row.slug}.${locale}.description`);
        }
      }
      for (const row of catalogueBrandRows()) {
        if (localize(row, "description", locale) === row.description) {
          stillDutch.push(`brand ${row.slug}.${locale}.description`);
        }
      }
    }
    expect(stillDutch, "content rendering in Dutch").toEqual([]);
  });

  it("never renders an empty string or a raw key", () => {
    // The review's rule: no null, no missing key, ever — a gap must show the
    // Dutch original instead.
    for (const locale of LOCALES) {
      for (const row of catalogueProductList()) {
        for (const field of ["name", "short_description"]) {
          const value = localize(row, field, locale);
          expect(value).not.toBe("");
          expect(value).not.toContain("undefined");
          expect(value).not.toContain("[object");
        }
      }
    }
  });
});
