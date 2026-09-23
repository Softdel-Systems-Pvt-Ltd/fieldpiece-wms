import type { ProductFamily } from "@/types";

export interface ReportFilters {
  from?: string; // ISO date; the API defaults to the last 90 days
  to?: string;
  sku?: string;
  family?: ProductFamily;
  region?: string;
}

export interface ClaimRateRow {
  sku: string;
  name: string;
  registrations: number;
  claims: number;
  rate: number;
}

export interface FailureCategoryRow {
  category: string;
  label: string;
  count: number;
}

export interface ResolutionTimeRow {
  week: string;
  avgDays: number;
  count: number;
}

export interface CostRow {
  type: string;
  count: number;
  creditTotal: string;
  currency: string | null;
}
