import type { ClaimStatus, PageParams, Resolution } from "@/types";
import type { ClaimAction } from "./transitions";

export interface ClaimFilters extends PageParams {
  status?: ClaimStatus;
  assignedTo?: string;
}

export interface TransitionRequest {
  action: ClaimAction;
  comment?: string;
  reason?: string;
  resolution?: Resolution;
  trackingNumber?: string;
}

export interface CommentRequest {
  comment: string;
  internal?: boolean;
}
