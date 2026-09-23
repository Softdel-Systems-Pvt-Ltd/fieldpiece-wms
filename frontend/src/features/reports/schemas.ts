import { z } from "zod";

export const reportFiltersSchema = z
  .object({
    from: z.string().optional(),
    to: z.string().optional(),
    sku: z.string().trim().toUpperCase().optional(),
    family: z.string().optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    path: ["to"],
    message: "End date must be on or after the start date.",
  });

/** Rows -> CSV text, quoting every cell (Section 8.7 "CSV export"). */
export function toCsv(rows: Record<string, unknown>[]): string {
  const [first] = rows;
  if (!first) return "";
  const headers = Object.keys(first);
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    headers.map(cell).join(","),
    ...rows.map((r) => headers.map((h) => cell(r[h] ?? null)).join(",")),
  ].join("\n");
}
