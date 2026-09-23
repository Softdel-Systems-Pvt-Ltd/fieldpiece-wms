import type { ProductFamily, WarrantyStatus } from "@/types";

/** GET /warranty/check: minimal public data only (backend Section 11.4). */
export interface WarrantyCheckResult {
  serialNumber: string;
  product: { sku: string; name: string; family: ProductFamily; imageUrl: string | null };
  registered: boolean;
  warrantyStatus: WarrantyStatus;
  warrantyEnd: string | null;
}
