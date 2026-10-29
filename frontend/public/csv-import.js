import { nairaToMinor, safeMinorNumber } from "./money.js";
export const MAX_CSV_BYTES = 2 * 1024 * 1024;
export function parseCsv(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false,
    closed = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
        closed = true;
      } else cell += c;
    } else if (c === '"') {
      if (cell || closed)
        throw new Error("Invalid quote in CSV. Export the sheet as CSV again.");
      quoted = true;
    } else if (c === "," || c === "\n" || c === "\r") {
      row.push(cell);
      cell = "";
      closed = false;
      if (c !== ",") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        if (row.some((x) => x.trim())) rows.push(row);
        row = [];
      }
    } else {
      if (closed && c.trim())
        throw new Error("Unexpected text after a quoted CSV value.");
      if (!closed) cell += c;
    }
  }
  if (quoted) throw new Error("An opening quote is missing its closing quote.");
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}
const encode = (v) =>
  /[",\r\n]/.test(v) ? '"' + v.replaceAll('"', '""') + '"' : v;
export function prepareImport(text, units = "naira") {
  const rows = parseCsv(text),
    headers = rows.shift()?.map((x) => x.trim().toLowerCase());
  if (!headers) throw new Error("Choose a CSV with a header row and products.");
  if (new Set(headers).size !== headers.length)
    throw new Error("Column names must be unique.");
  for (const key of ["name", "price", "cost"])
    if (!headers.includes(key))
      throw new Error("Missing required column: " + key);
  if (!rows.length || rows.length > 5000)
    throw new Error("Import between 1 and 5,000 product rows.");
  const known = ["name", "sku", "barcode", "unit", "price", "cost"];
  const output = [known],
    preview = [],
    warnings = [];
  rows.forEach((row, index) => {
    if (row.length !== headers.length)
      throw new Error(
        "Data row " + (index + 1) + " has the wrong number of columns.",
      );
    const product = Object.fromEntries(
      headers.map((h, i) => [h, row[i].trim()]),
    );
    if (!product.name)
      throw new Error(
        "Data row " + (index + 1) + ": product name is required.",
      );
    for (const field of ["price", "cost"]) {
      try {
        const minor =
          units === "naira"
            ? nairaToMinor(product[field])
            : /^\d+$/.test(product[field])
              ? BigInt(product[field]).toString()
              : (() => {
                  throw new Error("Use whole kobo amounts.");
                })();
        safeMinorNumber(minor);
        product[field] = minor;
      } catch (error) {
        throw new Error(
          "Data row " + (index + 1) + ", " + field + ": " + error.message,
        );
      }
    }
    if (!product.sku) warnings.push(index + 1);
    preview.push(product);
    output.push(known.map((key) => product[key] || ""));
  });
  return {
    csv: output.map((row) => row.map(encode).join(",")).join("\n"),
    preview,
    withoutSku: warnings.length,
    ignoredColumns: headers.filter((h) => !known.includes(h)),
  };
}
