import { isAxiosError } from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiErrorBody } from "@/types";

/** Normalised error for every failed API call (Section 9). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.fieldErrors = body.fieldErrors;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ApiErrorBody).code === "string" &&
    typeof (value as ApiErrorBody).message === "string"
  );
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data: unknown = error.response?.data;
    if (isApiErrorBody(data)) return new ApiError(status, data);
    if (status === 0) {
      return new ApiError(0, {
        code: "network_error",
        message: "Can't reach the server. Check your connection and try again.",
      });
    }
    if (status === 429) {
      return new ApiError(429, {
        code: "rate_limited",
        message: "Too many checks in a short time. Wait a minute, then try again.",
      });
    }
    return new ApiError(status, { code: `http_${status}`, message: "Something went wrong. Try again." });
  }
  return new ApiError(0, { code: "unknown", message: "Something went wrong. Try again." });
}

/**
 * Maps `fieldErrors` from the API onto react-hook-form fields.
 * Returns true when at least one field error was applied (so the caller can skip a toast).
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  const apiError = toApiError(error);
  const entries = Object.entries(apiError.fieldErrors ?? {});
  entries.forEach(([field, message], index) => {
    setError(field as Path<T>, { type: "server", message }, { shouldFocus: index === 0 });
  });
  return entries.length > 0;
}
