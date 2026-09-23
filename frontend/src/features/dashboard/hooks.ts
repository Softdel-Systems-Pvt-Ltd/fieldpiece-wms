import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./api";

type Params = Record<string, string | number>;

export function useDashboardSummary(enabled: boolean) {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardApi.summary,
    enabled,
    refetchInterval: 60_000,
  });
}

export function useDashboardClaims(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["claims", "dashboard", params],
    queryFn: () => dashboardApi.claims(params),
    enabled,
  });
}

export function useDashboardRegistrations(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["registrations", "dashboard", params],
    queryFn: () => dashboardApi.registrations(params),
    enabled,
  });
}

export function useDashboardRmas(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["rmas", "dashboard", params],
    queryFn: () => dashboardApi.rmas(params),
    enabled,
  });
}
