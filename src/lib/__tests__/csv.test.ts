import { describe, expect, it } from "vitest";

import { csvToObjects, parseCsv, toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("quotes and escapes cells", () => {
    expect(
      toCsv([
        ["a", 'b"c'],
        [1, null],
      ]),
    ).toBe('"a";"b""c"\r\n"1";""');
  });
});

describe("parseCsv", () => {
  it("parses quoted values with separators and newlines", () => {
    const csv = '"sku";"naam"\r\n"A1";"Zaklamp; groot"\r\n"A2";"Regel\nbreak"';
    expect(parseCsv(csv)).toEqual([
      ["sku", "naam"],
      ["A1", "Zaklamp; groot"],
      ["A2", "Regel\nbreak"],
    ]);
  });

  it("ignores empty lines and BOM", () => {
    expect(parseCsv('\uFEFF"a";"b"\n\n"c";"d"\n')).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});

describe("csvToObjects", () => {
  it("maps rows onto lowercased headers", () => {
    const csv = "SKU;Prijs\nA1;19,99";
    expect(csvToObjects(csv)).toEqual([{ sku: "A1", prijs: "19,99" }]);
  });

  it("returns an empty list for empty input", () => {
    expect(csvToObjects("")).toEqual([]);
  });
});
