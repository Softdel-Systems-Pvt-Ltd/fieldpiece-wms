import { http } from "@/lib/http";
import type { Product } from "@/types";
import type { ProductFilters } from "./types";

export const productsApi = {
  list: (filters: ProductFilters = {}) =>
    http.get<Product[]>("/products", { params: filters }).then((r) => r.data),
  get: (sku: string) => http.get<Product>(`/products/${encodeURIComponent(sku)}`).then((r) => r.data),
  update: (sku: string, body: Partial<Product>) =>
    http.patch<Product>(`/products/${encodeURIComponent(sku)}`, body).then((r) => r.data),
};
