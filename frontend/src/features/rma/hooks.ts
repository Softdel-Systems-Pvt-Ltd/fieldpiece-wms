import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { rmaApi } from "./api";
import type { RmaFilters } from "./types";

export const rmaKeys = {
  all: ["rmas"] as const,
  list: (filters: RmaFilters) => ["rmas", filters] as const,
  detail: (id: string) => ["rma", id] as const,
};

export function useRmas(filters: RmaFilters) {
  return useQuery({
    queryKey: rmaKeys.list(filters),
    queryFn: () => rmaApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useRma(id: string | undefined) {
  return useQuery({ queryKey: rmaKeys.detail(id ?? ""), queryFn: () => rmaApi.get(id ?? ""), enabled: !!id });
}
