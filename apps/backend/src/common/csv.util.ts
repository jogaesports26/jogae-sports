export function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(header: string[], rows: string[][]): string {
  const lines = rows.map((row) =>
    row.map((value) => csvEscape(value)).join(';'),
  );
  return [header.join(';'), ...lines].join('\n');
}
