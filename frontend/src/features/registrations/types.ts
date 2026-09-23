import type { Address, PageParams, RegistrationStatus } from "@/types";

export interface RegistrationFilters extends PageParams {
  status?: RegistrationStatus;
  serial?: string;
  customerId?: string;
}

export interface CreateRegistrationRequest {
  serialNumber: string;
  sku: string;
  purchaseDate: string; // ISO date
  customerId?: string;
  customer?: {
    contactName: string;
    companyName?: string;
    email?: string;
    phone?: string;
    address: Address;
  };
  proofOfPurchaseIds: string[];
}

export interface ImportStatus {
  jobId: string;
  state: "queued" | "running" | "completed" | "failed";
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  message: string | null;
  errorReportUrl: string | null;
}
