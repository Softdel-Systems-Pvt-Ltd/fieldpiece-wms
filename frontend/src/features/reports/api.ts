import { http } from "@/lib/http";
import type { ClaimRateRow, CostRow, FailureCategoryRow, ReportFilters, ResolutionTimeRow } from "./types";

interface ClaimsSummary {
  from: string;
  to: string;
  claimsOverTime: { date: string; count: number }[];
}

const get = <T>(path: string, filters: ReportFilters) =>
  http.get<T>(`/reports/${path}`, { params: filters }).then((r) => r.data);

export const reportsApi = {
  summary: (f: ReportFilters) => get<ClaimsSummary>("claims-summary", f),
  claimRate: (f: ReportFilters) =>
    get<{ items: ClaimRateRow[] }>("claim-rate-by-sku", f).then((r) => r.items),
  failureCategories: (f: ReportFilters) =>
    get<{ items: FailureCategoryRow[] }>("failure-categories", f).then((r) => r.items),
  resolutionTime: (f: ReportFilters) =>
    get<{ items: ResolutionTimeRow[] }>("resolution-time", f).then((r) => r.items),
  cost: (f: ReportFilters) => get<{ items: CostRow[] }>("cost", f).then((r) => r.items),
};
