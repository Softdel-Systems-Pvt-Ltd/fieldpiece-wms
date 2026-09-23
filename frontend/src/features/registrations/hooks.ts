import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { registrationsApi } from "./api";
import type { RegistrationFilters } from "./types";

export const registrationKeys = {
  all: ["registrations"] as const,
  list: (filters: RegistrationFilters) => ["registrations", filters] as const,
  detail: (id: string) => ["registration", id] as const,
  products: ["products", "catalogue"] as const,
  import: (jobId: string) => ["import", jobId] as const,
};

export function useRegistrations(filters: RegistrationFilters) {
  return useQuery({
    queryKey: registrationKeys.list(filters),
    queryFn: () => registrationsApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useProductCatalogue() {
  return useQuery({
    queryKey: registrationKeys.products,
    queryFn: registrationsApi.products,
    staleTime: 10 * 60_000,
  });
}

export function useCreateRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registrationsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: registrationKeys.all }),
  });
}

/** Polls an import job until it finishes. */
export function useImportStatus(jobId: string | null) {
  return useQuery({
    queryKey: registrationKeys.import(jobId ?? ""),
    queryFn: () => registrationsApi.importStatus(jobId ?? ""),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state === "completed" || state === "failed" ? false : 1500;
    },
  });
}
