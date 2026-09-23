import { ApiError } from "@/lib/api-error";
import { http, tokenStore } from "@/lib/http";
import { identity } from "@/lib/identity";
import type { SessionUser } from "@/types";
import type { MeResponse } from "./types";

function toSessionUser(me: MeResponse): SessionUser {
  if (!me.primaryRole) {
    throw new ApiError(403, {
      code: "FORBIDDEN",
      message: "Your account doesn't have a role yet. Ask your administrator for access.",
    });
  }
  return {
    id: me.id,
    name: me.displayName,
    email: me.email,
    role: me.primaryRole,
    roles: me.roles,
    organization: me.organization,
    currency: me.currency,
    permissions: me.permissions,
  };
}

/** Loads the profile for a token. Roles come from the API's database, not the token (backend 7.1). */
async function profileFor(accessToken: string): Promise<{ user: SessionUser; accessToken: string }> {
  tokenStore.set(accessToken);
  const { data } = await http.get<MeResponse>("/me");
  return { user: toSessionUser(data), accessToken };
}

export const authApi = {
  signIn: async (email: string) => profileFor(await identity.signIn(email)),

  /** Restores the session from the identity provider's session. */
  restore: async () => profileFor(await identity.refresh()),

  signOut: () => identity.signOut(),

  devIdentities: () => identity.devIdentities(),
};
