/**
 * Catalogue import rules.
 *
 * The requirements this locks down: Product ID deduplicates, brands are
 * normalised, invalid prices and URLs are rejected, and a recommended price
 * that is not actually higher never becomes a discount.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseCatalogueImport } from "@/lib/catalogue-import";

const HEADER =
  "product_id,naam,slug,merk,categorie,prijs,adviesprijs,voorraad,beoordelingen,beschikbaarheid,afbeelding_url,bron_url,korte_omschrijving,volledige_titel";

const row = (overrides: Partial<Record<string, string>> = {}) => {
  const base: Record<string, string> = {
    product_id: "9300000250840359",
    naam: "Hoofdlamp LED Oplaadbaar",
    slug: "besjaar-hoofdlamp",
    merk: "Besjaar",
    categorie: "Kamperen & Outdoor",
    prijs: "15.99",
    adviesprijs: "",
    voorraad: "25",
    beoordelingen: "31",
    beschikbaarheid: "Op voorraad",
    afbeelding_url: "https://media.s-bol.com/x/y/550x357.jpg",
    bron_url: "https://www.bol.com/nl/nl/p/x/9300000250840359/",
    korte_omschrijving: "1000 lumen",
    volledige_titel: "Besjaar Hoofdlamp - 1000 lumen",
  };
  const merged = { ...base, ...overrides };
  // Quote every field so a comma inside a value cannot shift the columns.
  return HEADER.split(",")
    .map((column) => `"${(merged[column] ?? "").replace(/"/g, '""')}"`)
    .join(",");
};

const csv = (...rows: string[]) => [HEADER, ...rows].join("\n");

describe("catalogue import parsing", () => {
  it("accepts a valid row", () => {
    const result = parseCatalogueImport(csv(row()));
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].data.productId).toBe("9300000250840359");
    expect(result.rows[0].data.price).toBe(15.99);
    expect(result.rows[0].data.compareAtPrice).toBeNull();
  });

  it("imports a repeated Product ID only once", () => {
    const result = parseCatalogueImport(
      csv(row(), row({ naam: "Zelfde product, andere naam" }), row({ product_id: "93000001" })),
    );
    expect(result.rows).toHaveLength(2);
    expect(result.duplicates).toEqual(["9300000250840359"]);
    expect(result.rows[0].data.name).toBe("Hoofdlamp LED Oplaadbaar");
  });

  it("normalises brand spelling", () => {
    for (const [input, expected] of [
      ["Rynex", "RYNEX"],
      ["rynex", "RYNEX"],
      ["LYNEX", "LYNEX"],
      ["besjaar", "Besjaar"],
    ]) {
      const result = parseCatalogueImport(csv(row({ merk: input })));
      expect(result.rows[0].data.brand).toBe(expected);
    }
  });

  it("rejects an unknown brand", () => {
    const result = parseCatalogueImport(csv(row({ merk: "Onbekend" })));
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0].message).toContain("onbekend merk");
  });

  it("treats a genuine higher recommended price as a discount", () => {
    const result = parseCatalogueImport(csv(row({ prijs: "9.99", adviesprijs: "15.99" })));
    expect(result.rows[0].data.compareAtPrice).toBe(15.99);
  });

  it("never turns an equal or lower recommended price into a discount", () => {
    const equal = parseCatalogueImport(csv(row({ prijs: "9.99", adviesprijs: "9.99" })));
    expect(equal.rows[0].data.compareAtPrice).toBeNull();

    const lower = parseCatalogueImport(csv(row({ prijs: "9.99", adviesprijs: "5.00" })));
    expect(lower.rows).toHaveLength(0);
    expect(lower.errors[0].message).toContain("mag niet lager zijn");
  });

  it("rejects a missing or invalid price", () => {
    expect(parseCatalogueImport(csv(row({ prijs: "" }))).rows).toHaveLength(0);
    expect(parseCatalogueImport(csv(row({ prijs: "gratis" }))).rows).toHaveLength(0);
    expect(parseCatalogueImport(csv(row({ prijs: "0" }))).rows).toHaveLength(0);
  });

  it("accepts a comma decimal separator", () => {
    const result = parseCatalogueImport(csv(row({ prijs: "15,99" })));
    expect(result.rows[0].data.price).toBe(15.99);
  });

  it("rejects a non-http image URL", () => {
    const result = parseCatalogueImport(
      csv(row({ afbeelding_url: "javascript:alert(document.cookie)" })),
    );
    expect(result.rows).toHaveLength(0);
    expect(result.errors.some((e) => e.message.includes("afbeelding_url"))).toBe(true);
  });

  it("rejects a Product ID with unexpected characters", () => {
    const result = parseCatalogueImport(csv(row({ product_id: "93000 00/../etc" })));
    expect(result.rows).toHaveLength(0);
  });

  it("derives a slug when the column is empty", () => {
    const result = parseCatalogueImport(csv(row({ slug: "", naam: "Douchekop met Slang" })));
    expect(result.rows[0].data.slug).toBe("besjaar-douchekop-met-slang");
  });

  it("reports an empty file rather than throwing", () => {
    const result = parseCatalogueImport("");
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0].message).toContain("geen regels");
  });
});

describe("the generated catalogue CSV", () => {
  it("imports cleanly, with one row per unique product", () => {
    const file = path.join(process.cwd(), "data", "besjaar-catalogue.csv");
    const result = parseCatalogueImport(readFileSync(file, "utf8"));

    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(51);
    expect(result.duplicates).toEqual([]);
    expect(new Set(result.rows.map((r) => r.data.productId)).size).toBe(51);
    expect(new Set(result.rows.map((r) => r.data.slug)).size).toBe(51);
  });

  it("is idempotent: importing it twice still yields 51 products", () => {
    const file = path.join(process.cwd(), "data", "besjaar-catalogue.csv");
    const content = readFileSync(file, "utf8");
    const lines = content.trim().split("\n");
    // Same file appended to itself — every Product ID repeats exactly once.
    const doubled = [...lines, ...lines.slice(1)].join("\n");

    const result = parseCatalogueImport(doubled);
    expect(result.rows).toHaveLength(51);
    expect(result.duplicates).toHaveLength(51);
  });
});
