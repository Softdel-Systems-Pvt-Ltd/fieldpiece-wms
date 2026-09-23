import type { Address, ClaimEvent, PageParams, Resolution } from "@/types";

export interface ClaimFilters extends PageParams {
  /** Comma-separated statuses, e.g. "SUBMITTED,IN_REVIEW". */
  status?: string;
  assignedTo?: "me" | "unassigned" | string;
  registrationId?: string;
  displayNo?: string;
}

export interface ClaimDraftRequest {
  registrationId?: string;
  serialNumber?: string;
  failureCategory: string;
  failureDate: string;
  description: string;
  preferredResolution?: Resolution | null;
  returnAddress?: Address | null;
  attachmentIds?: string[];
}

export type ClaimUpdateRequest = Partial<Omit<ClaimDraftRequest, "registrationId" | "serialNumber">>;

/** Body per action; the API validates it. */
export type TransitionBody =
  | Record<string, never>
  | { message: string }
  | { message?: string }
  | { resolution: Resolution; comment?: string }
  | { reason: string; message: string };

export interface ClaimEventsPage {
  items: ClaimEvent[];
  nextCursor: string | null;
}
