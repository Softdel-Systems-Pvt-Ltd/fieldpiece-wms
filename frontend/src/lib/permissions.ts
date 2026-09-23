import type { Role } from "@/types";

// UI-only permission helper (Section 1.1). It decides what to HIDE, nothing more.
// The API must enforce every permission. Never rely on UI hiding for security.

export type Permission =
  | "registrations:view"
  | "registrations:create"
  | "registrations:bulk"
  | "claims:view"
  | "claims:create"
  | "claims:review"
  | "claims:internal_notes"
  | "rma:view"
  | "rma:inspect"
  | "customers:view"
  | "products:view"
  | "products:edit"
  | "reports:view"
  | "admin:manage";

const rolePermissions: Record<Role, readonly Permission[]> = {
  technician: ["registrations:view", "registrations:create", "claims:view", "claims:create", "products:view"],
  distributor: [
    "registrations:view",
    "registrations:create",
    "registrations:bulk",
    "claims:view",
    "claims:create",
    "customers:view",
    "products:view",
  ],
  claims_agent: [
    "claims:view",
    "claims:review",
    "claims:internal_notes",
    "rma:view",
    "customers:view",
    "products:view",
    "reports:view",
  ],
  service_center: ["claims:view", "claims:internal_notes", "rma:view", "rma:inspect", "products:view"],
  admin: [
    "registrations:view",
    "registrations:create",
    "registrations:bulk",
    "claims:view",
    "claims:create",
    "claims:review",
    "claims:internal_notes",
    "rma:view",
    "rma:inspect",
    "customers:view",
    "products:view",
    "products:edit",
    "reports:view",
    "admin:manage",
  ],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role].includes(permission);
}

export function hasRole(role: Role | undefined | null, allowed: readonly Role[]): boolean {
  return !!role && allowed.includes(role);
}

/** Staff roles see internal notes and SLA details that customers never see. */
export const isStaff = (role: Role | undefined | null) =>
  role === "claims_agent" || role === "service_center" || role === "admin";
