/**
 * Minimal RFC 4180-ish CSV parser: handles quoted fields, escaped quotes ("")
 * and commas/newlines inside quotes. Good enough for lead exports from
 * spreadsheets without pulling in a dependency.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      pushRow();
    } else if (char === "\r") {
      // skip, \n handles the row break
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

export interface ParsedLeadRow {
  name: string;
  email: string | null;
  phone: string | null;
}

/**
 * Expects a header row containing "name" and optionally "email"/"phone"
 * (case-insensitive, any column order).
 */
export function parseLeadsCsv(text: string): ParsedLeadRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const emailIdx = header.indexOf("email");
  const phoneIdx = header.indexOf("phone");

  if (nameIdx === -1) {
    throw new Error('CSV failai jāsatur kolonna "name".');
  }

  return rows.slice(1).map((cols) => ({
    name: (cols[nameIdx] ?? "").trim(),
    email: emailIdx !== -1 ? (cols[emailIdx] ?? "").trim() || null : null,
    phone: phoneIdx !== -1 ? (cols[phoneIdx] ?? "").trim() || null : null,
  })).filter((r) => r.name.length > 0);
}
