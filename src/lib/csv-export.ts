/**
 * Client-side CSV export utility.
 * Builds a CSV string from row data and triggers a browser download.
 */

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If the value contains a comma, double-quote, or newline, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function downloadCsv(
  filename: string,
  rows: Record<string, any>[],
  columns: { key: string; header: string }[]
): void {
  // Build header row
  const headerLine = columns.map((col) => escapeCsvValue(col.header)).join(',');

  // Build data rows
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCsvValue(row[col.key])).join(',')
  );

  const csvContent = [headerLine, ...dataLines].join('\r\n');

  // Create Blob and trigger download via hidden anchor
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
