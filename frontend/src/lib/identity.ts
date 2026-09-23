import axios from "axios";
import { env } from "./env";

// Identity provider client. Locally this talks to the backend's development IdP (signs RS256 tokens, keeps
// its session in an httpOnly cookie scoped to /dev-idp). The API itself only ever sees bearer tokens.
// [CONFIRM] identity provider. For a real OIDC provider, replace this module with oidc-client-ts
// (Authorization Code + PKCE, silent renew); nothing else in the app needs to change.

const idp = axios.create({ baseURL: env.oidcAuthority, withCredentials: true, timeout: 15_000 });

interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface DevIdentity {
  email: string;
  displayName: string;
  roles: string[];
}

export const identity = {
  /** Dev IdP only: sign in as a seeded test identity (no passwords). */
  signIn: (email: string) => idp.post<TokenResponse>("/token", { email }).then((r) => r.data.accessToken),

  /** Exchanges the IdP session cookie for a fresh access token. Rejects when there's no session. */
  refresh: () => idp.post<TokenResponse>("/refresh").then((r) => r.data.accessToken),

  signOut: () => idp.post("/logout").then(() => undefined),

  /** Dev IdP only: identities for the sign-in picker. */
  devIdentities: () => idp.get<DevIdentity[]>("/users").then((r) => r.data),
};
