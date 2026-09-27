export function csvEscape(value: unknown): string {
  if (value == null) return "";
  const str =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

export function csvWithMeta(clinicName: string, title: string, csvBody: string): string {
  const generated = new Date().toISOString();
  return `# ${clinicName} — ${title}\n# Generated: ${generated}\n\n${csvBody}`;
}
