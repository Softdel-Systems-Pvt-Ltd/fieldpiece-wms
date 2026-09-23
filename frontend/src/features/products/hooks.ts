import { useQuery } from "@tanstack/react-query";
import { productsApi } from "./api";
import type { ProductFilters } from "./types";

export const productKeys = {
  list: (filters: ProductFilters) => ["products", filters] as const,
  detail: (sku: string) => ["product", sku] as const,
};

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsApi.list(filters),
    staleTime: 10 * 60_000,
  });
}

export function useProduct(sku: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(sku ?? ""),
    queryFn: () => productsApi.get(sku ?? ""),
    enabled: !!sku,
  });
}
