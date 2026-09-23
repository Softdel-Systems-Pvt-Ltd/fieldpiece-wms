import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { reportsApi } from "./api";
import type { ReportFilters } from "./types";

// The API caches reports for 5 minutes per filter set; mirror that client-side.
const opts = { staleTime: 5 * 60_000, placeholderData: keepPreviousData } as const;

export const useClaimsOverTime = (f: ReportFilters) =>
  useQuery({ queryKey: ["reports", "summary", f], queryFn: () => reportsApi.summary(f), ...opts });
export const useClaimRate = (f: ReportFilters) =>
  useQuery({ queryKey: ["reports", "claim-rate", f], queryFn: () => reportsApi.claimRate(f), ...opts });
export const useFailureBreakdown = (f: ReportFilters) =>
  useQuery({
    queryKey: ["reports", "failure-categories", f],
    queryFn: () => reportsApi.failureCategories(f),
    ...opts,
  });
export const useResolutionTime = (f: ReportFilters) =>
  useQuery({
    queryKey: ["reports", "resolution-time", f],
    queryFn: () => reportsApi.resolutionTime(f),
    ...opts,
  });
export const useCost = (f: ReportFilters) =>
  useQuery({ queryKey: ["reports", "cost", f], queryFn: () => reportsApi.cost(f), ...opts });
