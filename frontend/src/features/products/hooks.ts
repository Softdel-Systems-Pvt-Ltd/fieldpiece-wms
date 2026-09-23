import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@/types";
import { productsApi } from "./api";
import type { ProductFilters } from "./types";

export const productKeys = {
  all: ["products"] as const,
  list: (filters: ProductFilters) => ["products", filters] as const,
  detail: (sku: string) => ["product", sku] as const,
};

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsApi.list(filters),
    placeholderData: keepPreviousData,
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

/** After a photo change: the detail gets the new product, every list (and SKU picker) refetches. */
function useProductChanged() {
  const qc = useQueryClient();
  return (product: Product) => {
    qc.setQueryData(productKeys.detail(product.sku), product);
    void qc.invalidateQueries({ queryKey: productKeys.all });
  };
}

export function useUploadProductImage(sku: string) {
  const onChanged = useProductChanged();
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) =>
      productsApi.uploadImage(sku, file, onProgress),
    onSuccess: onChanged,
  });
}

export function useRemoveProductImage(sku: string) {
  const onChanged = useProductChanged();
  return useMutation({ mutationFn: () => productsApi.removeImage(sku), onSuccess: onChanged });
}
