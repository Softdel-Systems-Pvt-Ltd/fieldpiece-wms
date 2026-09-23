import type { Role } from "@/types";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  lastSignInAt?: string;
}

export interface AppSettings {
  expiringSoonDays: number;
  slaHours: { review: number; rmaTurnaround: number }; // [CONFIRM] SLA targets
}
