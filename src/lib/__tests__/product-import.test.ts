import { describe, expect, it } from "vitest";

import { parseProductImport } from "../product-import";

const ID = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const header = "product_id;voorraad;variant_sku;variant_prijs;bol_actief";

describe("parseProductImport", () => {
  it("parses valid rows and coerces dutch booleans and comma decimals", () => {
    const result = parseProductImport(`${header}\n${ID};12;SKU-1;19,95;ja`, [ID]);
    expect(result.errors).toEqual([]);
    expect(result.rows[0].data).toMatchObject({
      product_id: ID,
      voorraad: 12,
      variant_sku: "SKU-1",
      variant_prijs: 19.95,
      bol_actief: true,
    });
  });

  it("reports invalid numbers per line", () => {
    const result = parseProductImport(`${header}\n${ID};abc;;;`, [ID]);
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0].line).toBe(2);
    expect(result.errors[0].message).toContain("voorraad");
  });

  it("rejects products outside the selection", () => {
    const result = parseProductImport(`${header}\n${OTHER};5;;;`, [ID]);
    expect(result.errors[0].message).toContain("selectie");
  });

  it("requires a variant key when variant data is supplied", () => {
    const result = parseProductImport(`${header}\n${ID};;;9,99;`, [ID]);
    expect(result.errors[0].message).toContain("variant_sku");
  });

  it("flags rows without any updatable value", () => {
    const result = parseProductImport(`${header}\n${ID};;;;`, [ID]);
    expect(result.errors[0].message).toContain("geen waarden");
  });
});
