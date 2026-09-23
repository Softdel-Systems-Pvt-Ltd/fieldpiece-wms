import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toApiError } from "./api-error";
import { env } from "./env";
import { identity } from "./identity";

// The one shared axios instance for the API (Section 9).
// The access token lives in memory only. Never store tokens in localStorage.

let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
};

type AuthFailureHandler = () => void;
let onAuthFailure: AuthFailureHandler = () => {};

/** Registered by the session store so http.ts doesn't import it (avoids a cycle). */
export function setAuthFailureHandler(handler: AuthFailureHandler) {
  onAuthFailure = handler;
}

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

// Single-flight refresh so parallel 401s trigger one refresh call.
let refreshing: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  refreshing ??= identity
    .refresh()
    .then((token) => {
      tokenStore.set(token);
      return token;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    // Refresh once on a 401, then sign out (Section 9).
    if (error.response?.status === 401 && original && !original._retried && tokenStore.get()) {
      original._retried = true;
      try {
        await refreshAccessToken();
        return http(original);
      } catch {
        tokenStore.clear();
        onAuthFailure();
      }
    }
    return Promise.reject(toApiError(error));
  },
);
