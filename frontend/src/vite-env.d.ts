/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_OIDC_AUTHORITY?: string;
  readonly VITE_OIDC_CLIENT_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ENABLE_MOCKS?: string;
  readonly VITE_EXPIRING_SOON_DAYS?: string;
  readonly VITE_REQUIRE_PROOF_OF_PURCHASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
