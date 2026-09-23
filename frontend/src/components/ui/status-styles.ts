import type { ClaimStatus, RmaStatus, WarrantyStatus } from "@/types";

// Status is never shown by colour alone: pair these with a label (Section 3.2).

export const claimStatusStyle: Record<ClaimStatus, string> = {
  DRAFT: "bg-ink-100 text-ink-600",
  SUBMITTED: "bg-info-bg text-info",
  IN_REVIEW: "bg-info-bg text-info",
  NEEDS_INFO: "bg-warning-bg text-warning",
  APPROVED: "bg-success-bg text-success",
  REJECTED: "bg-danger-bg text-danger",
  RMA_ISSUED: "bg-brand-100 text-brand-800",
  IN_TRANSIT: "bg-info-bg text-info",
  RECEIVED: "bg-info-bg text-info",
  REPAIRED: "bg-success-bg text-success",
  REPLACED: "bg-success-bg text-success",
  CREDITED: "bg-success-bg text-success",
  CLOSED: "bg-ink-100 text-ink-600",
};

export const warrantyStatusStyle: Record<WarrantyStatus, string> = {
  ACTIVE: "bg-success-bg text-success",
  EXPIRING_SOON: "bg-warning-bg text-warning",
  EXPIRED: "bg-danger-bg text-danger",
  NOT_REGISTERED: "bg-ink-100 text-ink-600",
  VOID: "bg-ink-100 text-ink-600 line-through",
};

export const rmaStatusStyle: Record<RmaStatus, string> = {
  ISSUED: "bg-brand-100 text-brand-800",
  IN_TRANSIT: "bg-info-bg text-info",
  RECEIVED: "bg-info-bg text-info",
  INSPECTED: "bg-info-bg text-info",
  COMPLETED: "bg-success-bg text-success",
  CANCELLED: "bg-ink-100 text-ink-600",
};
