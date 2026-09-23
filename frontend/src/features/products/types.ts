import type { PageParams, ProductFamily } from "@/types";

export interface ProductFilters extends PageParams {
  family?: ProductFamily;
}

/** Types the API accepts for product photos (backend PRODUCT_IMAGE_MIME), up to 5 MB. */
export const PRODUCT_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export interface ProductImageUpload {
  key: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
}
