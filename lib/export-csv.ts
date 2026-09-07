function escapeCsvCell(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function toCsv(
  headers: string[],
  rows: Array<Record<string, string | number | null | undefined>>,
) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) =>
      headers.map((key) => escapeCsvCell(row[key])).join(","),
    ),
  ];
  return `\uFEFF${lines.join("\n")}`;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Record<string, string | number | null | undefined>>,
) {
  const blob = new Blob([toCsv(headers, rows)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
