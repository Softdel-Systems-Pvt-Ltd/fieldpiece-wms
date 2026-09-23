import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toApiError } from "./api-error";
import { env } from "./env";

// The one shared axios instance (Section 9).
// Access token lives in memory only; the refresh token is an httpOnly cookie set by the API.
// Never store tokens in localStorage.

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
  withCredentials: true, // sends the httpOnly refresh cookie
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

const REFRESH_URL = "/auth/refresh";

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

// Single-flight refresh so parallel 401s trigger one refresh call.
let refreshing: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  refreshing ??= http
    .post<{ accessToken: string }>(REFRESH_URL, undefined, { skipAuthRefresh: true })
    .then((res) => {
      tokenStore.set(res.data.accessToken);
      return res.data.accessToken;
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

    // Refresh once on a 401, then log out (Section 9).
    if (error.response?.status === 401 && original && !original._retried && !original.skipAuthRefresh) {
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

declare module "axios" {
  interface AxiosRequestConfig {
    /** Skip the refresh-on-401 logic (public endpoints and the refresh call itself). */
    skipAuthRefresh?: boolean;
  }
}
