import { describe, expect, it } from "vitest";

import {
  auditProductTranslations,
  formatTranslationIssues,
  type AuditableProduct,
} from "@/lib/translation-audit";

function product(overrides: Partial<AuditableProduct> = {}): AuditableProduct {
  return {
    slug: "test-product",
    name: "Nederlandse titel",
    full_description: "Nederlandse omschrijving",
    translations: {
      en: { name: "English title", full_description: "English description" },
      de: { name: "Deutscher Titel", full_description: "Deutsche Beschreibung" },
      fr: { name: "Titre francais", full_description: "Description francaise" },
    },
    ...overrides,
  };
}

describe("auditProductTranslations", () => {
  it("reports nothing when all locales have their own copy", () => {
    expect(auditProductTranslations([product()])).toEqual([]);
  });

  it("flags missing locales", () => {
    const issues = auditProductTranslations([
      product({ translations: { en: { name: "x", full_description: "y" } } }),
    ]);
    expect(issues).toHaveLength(4);
    expect(issues.every((i) => i.reason === "missing")).toBe(true);
    expect(issues.map((i) => i.locale).sort()).toEqual(["de", "de", "fr", "fr"]);
  });

  it("flags blank translations", () => {
    const issues = auditProductTranslations([
      product({
        translations: {
          en: { name: "  ", full_description: "English description" },
          de: { name: "Deutscher Titel", full_description: "Deutsche Beschreibung" },
          fr: { name: "Titre francais", full_description: "Description francaise" },
        },
      }),
    ]);
    expect(issues).toEqual([
      { slug: "test-product", locale: "en", field: "name", reason: "empty" },
    ]);
  });

  it("flags translations that are identical to the Dutch value", () => {
    const issues = auditProductTranslations([
      product({
        translations: {
          en: { name: "English title", full_description: "nederlandse  OMSCHRIJVING " },
          de: { name: "Deutscher Titel", full_description: "Deutsche Beschreibung" },
          fr: { name: "Titre francais", full_description: "Description francaise" },
        },
      }),
    ]);
    expect(issues).toEqual([
      {
        slug: "test-product",
        locale: "en",
        field: "full_description",
        reason: "identical_to_dutch",
      },
    ]);
  });

  it("allows brand/model titles that are the same in every language", () => {
    const issues = auditProductTranslations([
      product({
        slug: "besjaar-powerbank",
        name: "Besjaar Powerbank",
        translations: {
          en: { name: "Besjaar Powerbank", full_description: "English description" },
          de: { name: "Besjaar Powerbank", full_description: "Deutsche Beschreibung" },
          fr: { name: "Besjaar Powerbank", full_description: "Description francaise" },
        },
      }),
    ]);
    expect(issues).toEqual([]);
  });

  it("ignores fields that have no Dutch value at all", () => {
    const issues = auditProductTranslations([
      product({
        full_description: null,
        translations: {
          en: { name: "English title" },
          de: { name: "Deutscher Titel" },
          fr: { name: "Titre francais" },
        },
      }),
    ]);
    expect(issues).toEqual([]);
  });

  it("formats issues into a readable report", () => {
    expect(
      formatTranslationIssues([{ slug: "a", locale: "de", field: "name", reason: "missing" }]),
    ).toBe("- a [de] name: missing");
  });
});
