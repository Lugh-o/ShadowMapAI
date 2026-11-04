export type CsvValue = string | number | boolean | null | undefined;

function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return '""';

  const raw = String(value);
  // Evita que planilhas interpretem conteúdo do usuário como fórmula.
  const safe =
    typeof value === "string" && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;

  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Gera CSV com BOM UTF-8 para que o Excel reconheça acentos corretamente.
 */
export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function csvResponse(
  filename: string,
  csv: string,
): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
