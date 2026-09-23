// Shared domain types (Section 7). Keep in sync with the backend OpenAPI spec;
// replace with `openapi-typescript` output once the spec exists.

export type Role = "technician" | "distributor" | "claims_agent" | "service_center" | "admin";

export type ProductFamily =
  "meters" | "gauges" | "vacuum" | "leak_detection" | "combustion" | "airflow" | "recovery" | "other";

export interface Product {
  sku: string; // e.g. "SC680" [CONFIRM real SKU list]
  name: string;
  family: ProductFamily;
  imageUrl?: string;
  warrantyMonths: number; // from WarrantyPolicy; never hard-code
  serialPattern?: string; // regex source
  launchDate?: string;
}

export interface WarrantyPolicy {
  id: string;
  sku: string | "*";
  baseMonths: number;
  extensionMonthsOnRegistration?: number; // [CONFIRM] whether registration extends coverage
  coverage: string[]; // e.g. ["manufacturing_defects"]
  exclusions: string[]; // e.g. ["physical_damage", "misuse", "consumables"]
  effectiveFrom: string;
}

export type RegistrationStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "VOID";

export type WarrantyStatus = RegistrationStatus | "NOT_REGISTERED";

export interface Registration {
  id: string;
  serialNumber: string;
  sku: string;
  customerId: string;
  distributorId?: string;
  purchaseDate: string;
  proofOfPurchase: Attachment[];
  warrantyStart: string;
  warrantyEnd: string;
  status: RegistrationStatus;
  createdAt: string;
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

export type FailureCategory =
  "no_power" | "inaccurate_reading" | "display" | "connectivity" | "physical" | "leak" | "other";

export type Resolution = "repair" | "replace" | "credit" | "none";

export interface Claim {
  id: string; // display as CLM-000123
  registrationId: string;
  serialNumber: string;
  sku: string;
  failureCategory: FailureCategory;
  description: string;
  failureDate: string;
  attachments: Attachment[];
  status: ClaimStatus;
  resolution?: Resolution;
  rejectionReason?: string;
  assignedTo?: string;
  slaDueAt?: string;
  history: ClaimEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ClaimEvent {
  at: string;
  actor: { id: string; name: string; role: Role };
  type: "created" | "status_changed" | "comment" | "attachment_added" | "assigned";
  from?: ClaimStatus;
  to?: ClaimStatus;
  comment?: string;
  internal?: boolean; // internal notes are never shown to technician/distributor
}

export type RmaStatus = "ISSUED" | "IN_TRANSIT" | "RECEIVED" | "INSPECTED" | "COMPLETED" | "CANCELLED";

export interface Rma {
  id: string; // RMA-000045
  claimId: string;
  type: "repair" | "replace" | "credit";
  shipTo: Address;
  inboundTracking?: string;
  outboundTracking?: string;
  inspectionNotes?: string;
  replacementSerial?: string;
  status: RmaStatus;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  distributorId?: string;
  address?: Address;
}

export interface Attachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  url: string;
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
  role: Role;
  distributorId?: string;
  currency: string; // ISO 4217, used for money formatting
}
