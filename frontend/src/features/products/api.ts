import { http } from "@/lib/http";
import { putToStorage } from "@/lib/uploads";
import type { Paginated, Product } from "@/types";
import type { ProductFilters, ProductImageUpload } from "./types";

const path = (sku: string) => `/products/${encodeURIComponent(sku)}`;

export const productsApi = {
  list: (filters: ProductFilters = {}) =>
    http.get<Paginated<Product>>("/products", { params: filters }).then((r) => r.data),
  get: (sku: string) => http.get<Product>(path(sku)).then((r) => r.data),
  update: (sku: string, body: Partial<Pick<Product, "name" | "serialPattern" | "launchDate" | "isActive">>) =>
    http.patch<Product>(path(sku), body).then((r) => r.data),

  /** Presigned PUT straight to storage, then attach: the API checks size and file type before using it. */
  async uploadImage(sku: string, file: File, onProgress?: (percent: number) => void): Promise<Product> {
    const { data } = await http.post<ProductImageUpload>(`${path(sku)}/image/upload-url`, {
      contentType: file.type,
      contentLength: file.size,
    });
    await putToStorage(data.uploadUrl, file, data.headers, onProgress);
    return http.put<Product>(`${path(sku)}/image`, { key: data.key }).then((r) => r.data);
  },
  removeImage: (sku: string) => http.delete<Product>(`${path(sku)}/image`).then((r) => r.data),
};
