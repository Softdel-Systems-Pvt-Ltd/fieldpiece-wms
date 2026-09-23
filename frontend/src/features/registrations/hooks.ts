import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { registrationsApi } from "./api";
import type { RegistrationFilters } from "./types";

export const registrationKeys = {
  all: ["registrations"] as const,
  list: (filters: RegistrationFilters) => ["registrations", filters] as const,
  bySerial: (serial: string) => ["registration", serial] as const,
  products: ["products"] as const,
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
