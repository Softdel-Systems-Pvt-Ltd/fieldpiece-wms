import type { Role, SessionUser } from "@/types";

export interface AuthResponse {
  accessToken: string;
  user: SessionUser;
}

export interface LoginRequest {
  email: string;
  password: string;
  /** Mock mode only: pick which role to sign in as. */
  role?: Role;
}
