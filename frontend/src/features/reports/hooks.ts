import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "./api";
import type { ReportFilters } from "./types";

export const reportKeys = {
  claimsOverTime: (filters: ReportFilters) => ["reports", "claims-over-time", filters] as const,
  claimRateBySku: (filters: ReportFilters) => ["reports", "claim-rate-by-sku", filters] as const,
};

export function useClaimsOverTime(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: reportKeys.claimsOverTime(filters),
    queryFn: () => reportsApi.claimsOverTime(filters),
    enabled,
  });
}
