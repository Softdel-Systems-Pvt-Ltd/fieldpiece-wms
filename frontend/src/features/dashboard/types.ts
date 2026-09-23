import type { ClaimStatus } from "@/types";

/** GET /reports/claims-summary */
export interface ClaimsSummary {
  from: string;
  to: string;
  byStatus: { status: ClaimStatus; count: number }[];
  claimsSubmitted: { current: number; previous: number };
  registrations: { current: number; previous: number };
  openClaims: number;
  unassigned: number;
  slaBreached: number;
  avgResolutionDays: number | null;
  claimsOverTime: { date: string; count: number }[];
}
