import type { PageParams } from "@/types";

export type RegistrationFilters = PageParams;

export interface CreateRegistrationRequest {
  serialNumber: string;
  sku: string;
  purchaseDate: string; // ISO date
  sellerName?: string;
  proofOfPurchaseIds: string[];
  owner: { name: string; email: string; phone?: string };
  acceptTerms: true;
}
