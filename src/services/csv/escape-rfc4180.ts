/**
 * RFC 4180 CSV escaping. A field is wrapped in double quotes if it contains
 * a comma, double quote, or newline; embedded double quotes are doubled.
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const needsQuote = /[",\r\n]/.test(str);
  if (!needsQuote) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

export function rowsToCsv<T extends Record<string, unknown>>(
  rows: T[],
  headers: ReadonlyArray<{ key: keyof T; label: string }>,
): string {
  const headerLine = headers.map((h) => escapeCsvField(h.label)).join(',');
  const lines = rows.map((row) =>
    headers.map((h) => escapeCsvField(row[h.key])).join(','),
  );
  return [headerLine, ...lines].join('\r\n');
}
