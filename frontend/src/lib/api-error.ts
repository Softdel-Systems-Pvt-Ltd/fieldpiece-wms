import { isAxiosError } from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiErrorBody } from "@/types";

/** Normalised error for every failed API call (backend Section 6.4). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** First message per field, keyed by the API's dotted path (e.g. "customer.address.line1"). */
  readonly fieldErrors: Record<string, string>;
  readonly details: Record<string, unknown>;
  readonly requestId?: string;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.requestId = body.requestId;
    this.details = body.details ?? {};
    this.fieldErrors = Object.fromEntries(
      Object.entries(body.fieldErrors ?? {}).map(([field, messages]) => [
        field,
        Array.isArray(messages) ? (messages[0] ?? "") : messages,
      ]),
    );
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
        code: "NETWORK_ERROR",
        message: "Can't reach the server. Check your connection and try again.",
      });
    }
    if (status === 429) {
      return new ApiError(429, {
        code: "RATE_LIMITED",
        message: "Too many requests in a short time. Wait a minute, then try again.",
      });
    }
    return new ApiError(status, { code: "INTERNAL_ERROR", message: "Something went wrong. Try again." });
  }
  return new ApiError(0, { code: "INTERNAL_ERROR", message: "Something went wrong. Try again." });
}

/**
 * Maps the API's field errors onto react-hook-form fields. `fieldMap` translates API paths to form field
 * names where they differ (e.g. { "customer.contactName": "ownerName" }).
 * Returns true when at least one field error was applied (so the caller can skip a toast).
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: Record<string, Path<T>> = {},
): boolean {
  const apiError = toApiError(error);
  const entries = Object.entries(apiError.fieldErrors);
  entries.forEach(([field, message], index) => {
    const target = fieldMap[field] ?? (field as Path<T>);
    setError(target, { type: "server", message }, { shouldFocus: index === 0 });
  });
  return entries.length > 0;
}
