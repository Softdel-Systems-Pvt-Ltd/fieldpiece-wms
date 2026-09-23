// Typed access to Vite env vars (Section 14). Read env through this module only.

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  oidcAuthority: import.meta.env.VITE_OIDC_AUTHORITY || "/dev-idp",
  oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID ?? "",
  sentryDsn: import.meta.env.VITE_SENTRY_DSN ?? "",
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS === "true",
  expiringSoonDays: Number(import.meta.env.VITE_EXPIRING_SOON_DAYS ?? 60) || 60,
  /** Mirrors the API's REQUIRE_PROOF_OF_PURCHASE (default on). [CONFIRM] */
  requireProofOfPurchase: import.meta.env.VITE_REQUIRE_PROOF_OF_PURCHASE !== "false",
  mode: import.meta.env.MODE,
} as const;

/** The backend's development IdP (or its MSW mock) rather than a real OIDC provider. */
export const isDevIdentity = /\/dev-idp\/?$/.test(env.oidcAuthority);
