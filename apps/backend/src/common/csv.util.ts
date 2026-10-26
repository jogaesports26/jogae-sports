// Células que começam com estes caracteres viram fórmula no Excel/Sheets; o apóstrofo as neutraliza.
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvEscape(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  if (/[",\n;]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function toCsv(header: string[], rows: string[][]): string {
  const lines = rows.map((row) =>
    row.map((value) => csvEscape(value)).join(';'),
  );
  return [header.join(';'), ...lines].join('\n');
}
