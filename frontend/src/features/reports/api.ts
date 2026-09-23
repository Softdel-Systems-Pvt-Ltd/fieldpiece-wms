import { http } from "@/lib/http";
import type { ReportFilters, TimeSeriesPoint } from "./types";

// TODO: agree endpoint shapes with the backend team (Section 8.7).
export const reportsApi = {
  claimsOverTime: (filters: ReportFilters) =>
    http.get<TimeSeriesPoint[]>("/reports/claims-over-time", { params: filters }).then((r) => r.data),
  claimRateBySku: (filters: ReportFilters) =>
    http
      .get<{ sku: string; rate: number }[]>("/reports/claim-rate-by-sku", { params: filters })
      .then((r) => r.data),
  exportCsv: (report: string, filters: ReportFilters) =>
    http
      .get<Blob>(`/reports/${report}/export`, { params: filters, responseType: "blob" })
      .then((r) => r.data),
};
