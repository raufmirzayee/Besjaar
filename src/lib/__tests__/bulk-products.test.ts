import { describe, expect, it } from "vitest";

import { validateBulkRows } from "@/lib/bulk-products";

describe("validateBulkRows", () => {
  it("accepts a clean row and normalises comma decimals", () => {
    const { rows, errors } = validateBulkRows([
      {
        sku: "A1",
        naam: "Zaklamp",
        prijs: "29,99",
        actieprijs: "19,99",
        voorraad: "12",
        status: "active",
      },
    ]);
    expect(errors).toEqual([]);
    expect(rows[0]).toEqual({
      sku: "A1",
      name: "Zaklamp",
      regular_price: 29.99,
      sale_price: 19.99,
      stock_quantity: 12,
      status: "active",
    });
  });

  it("treats empty cells as untouched fields", () => {
    const { rows } = validateBulkRows([
      { sku: "A1", naam: "", prijs: "", actieprijs: "", voorraad: "5", status: "" },
    ]);
    expect(rows[0]).toMatchObject({
      name: null,
      regular_price: null,
      sale_price: null,
      stock_quantity: 5,
      status: null,
    });
  });

  it("reports missing and duplicate skus", () => {
    const { rows, errors } = validateBulkRows([
      { sku: "", prijs: "1" },
      { sku: "A1", prijs: "1" },
      { sku: "A1", prijs: "2" },
    ]);
    expect(rows).toHaveLength(1);
    expect(errors.map((e) => e.line)).toEqual([2, 4]);
  });

  it("rejects invalid numbers, statuses and sale prices", () => {
    const { rows, errors } = validateBulkRows([
      { sku: "A1", prijs: "abc" },
      { sku: "A2", prijs: "-5" },
      { sku: "A3", voorraad: "2,5" },
      { sku: "A4", prijs: "10", actieprijs: "10" },
      { sku: "A5", status: "onbekend" },
    ]);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(5);
  });
});
