import type { PageParams, Role } from "@/types";

export interface UserFilters extends PageParams {
  role?: Role;
  active?: "true" | "false";
}

export interface UpdateUserRequest {
  roles?: Role[];
  isActive?: boolean;
  displayName?: string;
}

export interface CreatePolicyRequest {
  sku: string | null;
  baseMonths: number;
  registrationBonusMonths: number;
  registrationWindowDays: number | null;
  coverage: string[];
  exclusions: string[];
  effectiveFrom: string;
  effectiveTo: string | null;
}
