import { reportFiltersSchema, toCsv } from "./schemas";

describe("toCsv", () => {
  it("quotes every cell and escapes quotes", () => {
    expect(toCsv([{ sku: "SC680", name: 'Clamp "pro"', claims: 3 }])).toBe(
      '"sku","name","claims"\n"SC680","Clamp ""pro""","3"',
    );
  });

  it("returns an empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });
});

describe("reportFiltersSchema", () => {
  it("rejects an end date before the start date", () => {
    expect(reportFiltersSchema.safeParse({ from: "2026-09-01", to: "2026-08-01" }).success).toBe(false);
    expect(reportFiltersSchema.safeParse({ from: "2026-08-01", to: "2026-09-01" }).success).toBe(true);
  });
});
