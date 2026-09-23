import type { PageParams } from "@/types";

export interface RmaFilters extends PageParams {
  /** Comma-separated statuses, e.g. "ISSUED,IN_TRANSIT". */
  status?: string;
}

export interface ShipInboundRequest {
  trackingNumber: string;
  carrier?: string;
}

export interface InspectRequest {
  findings: string;
  rootCause: string;
  partsUsed: string[];
}

export interface CompleteRequest {
  outboundTracking?: string;
  outboundCarrier?: string;
  replacementSerial?: string; // replace only [CONFIRM replacement warranty rule]
  creditAmount?: number; // credit only
  creditCurrency?: string;
}
