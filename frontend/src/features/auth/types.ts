import type { Role } from "@/types";

/** GET /me response. */
export interface MeResponse {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  primaryRole: Role | null;
  organization: { id: string; name: string; type: "fieldpiece" | "distributor" | "service_center" } | null;
  currency: string;
  permissions: string[];
}
