import type { ProductFamily } from "@/types";

export interface ProductFilters {
  family?: ProductFamily;
  q?: string;
}
