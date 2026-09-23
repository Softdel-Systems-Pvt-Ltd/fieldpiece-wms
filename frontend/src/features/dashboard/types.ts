import type { ClaimStatus } from "@/types";

export interface Kpi {
  value: number;
  change?: number;
  sparkline?: number[];
}

export interface DashboardSummary {
  registrationsThisMonth: Kpi;
  openClaims: Kpi;
  avgResolutionDays: Kpi;
  slaBreached: Kpi;
  unassigned: number;
  claimsByStatus: { status: ClaimStatus; count: number }[];
}
