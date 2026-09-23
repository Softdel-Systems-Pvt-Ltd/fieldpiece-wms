// Shared domain types (Section 7). These mirror the API's response DTOs exactly; the backend's OpenAPI
// spec (`pnpm openapi:export` in ../backend) is the source of truth.
// TODO: generate from openapi.json with openapi-typescript and delete the hand-written copies.

export type Role = "technician" | "distributor" | "claims_agent" | "service_center" | "admin";

export const PRODUCT_FAMILIES = [
  "meters",
  "gauges",
  "vacuum",
  "leak_detection",
  "combustion",
  "airflow",
  "recovery",
  "other",
] as const;
export type ProductFamily = (typeof PRODUCT_FAMILIES)[number];

export interface Product {
  id: string;
  sku: string; // e.g. "SC680" [CONFIRM real SKU list]
  name: string;
  family: ProductFamily;
  serialPattern: string | null;
  launchDate: string | null;
  imageUrl: string | null;
  isActive: boolean;
  /** Base months from the policy in effect today; never hard-coded. */
  warrantyMonths: number | null;
  registrationBonusMonths: number | null;
}

export interface WarrantyPolicy {
  id: string;
  productId: string | null;
  sku: string | null; // null = the default policy
  baseMonths: number;
  registrationBonusMonths: number;
  registrationWindowDays: number | null;
  coverage: string[];
  exclusions: string[];
  effectiveFrom: string;
  effectiveTo: string | null;
  inUse: boolean;
}

export type RegistrationStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "VOID";
export type WarrantyStatus = RegistrationStatus | "NOT_REGISTERED";

export interface Registration {
  id: string;
  serialNumber: string;
  sku: string;
  productName: string;
  customerId: string;
  customerName: string;
  distributorId: string | null;
  policyId: string;
  purchaseDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  status: RegistrationStatus; // computed by the API from warrantyEnd
  replacesRegistrationId: string | null;
  certificateReady: boolean;
  version: number;
  createdAt: string;
}

export interface RegistrationDetail extends Registration {
  proofOfPurchase: Attachment[];
  claimCount: number;
}

export type ClaimStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "NEEDS_INFO"
  | "APPROVED"
  | "REJECTED"
  | "RMA_ISSUED"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "REPAIRED"
  | "REPLACED"
  | "CREDITED"
  | "CLOSED";

export type Resolution = "repair" | "replace" | "credit";

/** Actions the API exposes on claims; the API tells us which are allowed right now. */
export type ClaimAction =
  "submit" | "startReview" | "requestInfo" | "respond" | "approve" | "reject" | "close";

export interface PersonRef {
  id: string;
  name: string;
}

export interface ClaimSummary {
  id: string;
  displayNo: string; // CLM-000123
  registrationId: string;
  serialNumber: string;
  sku: string;
  productName: string;
  failureCategory: string;
  status: ClaimStatus;
  inWarranty: boolean;
  assignee: PersonRef | null;
  slaDueAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Claim extends ClaimSummary {
  description: string;
  failureDate: string;
  preferredResolution: Resolution | null;
  resolution: Resolution | "none" | null;
  rejectionReason: string | null;
  returnAddress: Partial<Address> | null;
  customerName: string;
  createdBy: PersonRef;
  warranty: { status: RegistrationStatus; warrantyEnd: string };
  rma: { id: string; displayNo: string; status: RmaStatus; type: Resolution } | null;
  attachments: Attachment[];
  allowedActions: ClaimAction[];
}

export interface ClaimEvent {
  id: string;
  at: string;
  actor: { id: string; name: string; role: Role | null };
  type: "created" | "status_changed" | "comment" | "attachment_added" | "assigned";
  fromStatus: ClaimStatus | null;
  toStatus: ClaimStatus | null;
  comment: string | null;
  internal: boolean; // never returned to technicians / distributors
}

export interface FailureCategory {
  code: string;
  label: string;
  requiresPhoto: boolean;
}

export type RmaStatus = "ISSUED" | "IN_TRANSIT" | "RECEIVED" | "INSPECTED" | "COMPLETED" | "CANCELLED";
export type RmaAction = "shipInbound" | "receive" | "inspect" | "complete" | "cancel";

export interface Rma {
  id: string;
  displayNo: string; // RMA-000045
  claimId: string;
  claimDisplayNo: string;
  serialNumber: string;
  sku: string;
  productName: string;
  type: Resolution;
  status: RmaStatus;
  serviceCenter: { id: string; name: string } | null;
  shipTo: Partial<Address>;
  returnAddress: Partial<Address> | null;
  inboundCarrier: string | null;
  inboundTracking: string | null;
  outboundCarrier: string | null;
  outboundTracking: string | null;
  inspectionNotes: string | null;
  rootCause: string | null;
  partsUsed: string[];
  replacementSerial: string | null;
  creditAmount: string | null;
  creditCurrency: string | null;
  completedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  /** Present on the detail endpoint only. */
  allowedActions?: RmaAction[];
}

export interface Customer {
  id: string;
  companyName: string | null;
  contactName: string;
  email: string | null;
  phone: string | null;
  address: Partial<Address>;
  distributorId: string | null;
  hasLogin: boolean;
  createdAt: string;
}

export interface Attachment {
  id: string;
  ownerType: "registration" | "claim" | "rma" | "import";
  ownerId: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  scanStatus: "PENDING" | "CLEAN" | "INFECTED" | "ERROR";
  uploaded: boolean;
  createdAt: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  /** Most privileged role, for UI decisions that need one. */
  role: Role;
  roles: Role[];
  organization: { id: string; name: string; type: "fieldpiece" | "distributor" | "service_center" } | null;
  currency: string; // ISO 4217, used for money formatting
  permissions: string[];
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  organizationId: string | null;
  organizationName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
