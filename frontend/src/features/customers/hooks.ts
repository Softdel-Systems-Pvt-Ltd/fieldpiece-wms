import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { customersApi } from "./api";
import type { CustomerFilters } from "./types";

export const customerKeys = {
  list: (filters: CustomerFilters) => ["customers", filters] as const,
  detail: (id: string) => ["customer", id] as const,
  registrations: (id: string) => ["customer", id, "registrations"] as const,
};

export function useCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => customersApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ""),
    queryFn: () => customersApi.get(id ?? ""),
    enabled: !!id,
  });
}

export function useCustomerRegistrations(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.registrations(id ?? ""),
    queryFn: () => customersApi.registrations(id ?? ""),
    enabled: !!id,
  });
}
