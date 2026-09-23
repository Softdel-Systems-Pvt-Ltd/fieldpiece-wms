import type { PageParams, RmaStatus } from "@/types";

export interface RmaFilters extends PageParams {
  status?: RmaStatus;
}

export interface InspectionRequest {
  findings: string;
  rootCause: string;
  partsUsed: string[];
  outcome: "repaired" | "replaced" | "scrapped";
  replacementSerial?: string; // [CONFIRM] replacement warranty rule
}
