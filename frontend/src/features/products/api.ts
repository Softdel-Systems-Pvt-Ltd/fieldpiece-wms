import { http } from "@/lib/http";
import type { Paginated, Product } from "@/types";
import type { ProductFilters } from "./types";

export const productsApi = {
  list: (filters: ProductFilters = {}) =>
    http.get<Paginated<Product>>("/products", { params: { pageSize: 100, ...filters } }).then((r) => r.data),
  get: (sku: string) => http.get<Product>(`/products/${encodeURIComponent(sku)}`).then((r) => r.data),
  update: (
    sku: string,
    body: Partial<Pick<Product, "name" | "serialPattern" | "launchDate" | "imageUrl" | "isActive">>,
  ) => http.patch<Product>(`/products/${encodeURIComponent(sku)}`, body).then((r) => r.data),
};
