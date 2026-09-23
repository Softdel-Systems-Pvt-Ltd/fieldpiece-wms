import type { Product, WarrantyStatus } from "@/types";

export interface WarrantyCheckResult {
  serialNumber: string;
  product: Product;
  registered: boolean;
  warrantyStatus: WarrantyStatus;
  warrantyEnd: string | null;
}
