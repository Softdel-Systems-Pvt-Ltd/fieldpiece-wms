import type { ProductFamily } from "@/types";

export interface ReportFilters {
  from: string; // ISO date
  to: string;
  sku?: string;
  family?: ProductFamily;
  region?: string;
  distributorId?: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}
