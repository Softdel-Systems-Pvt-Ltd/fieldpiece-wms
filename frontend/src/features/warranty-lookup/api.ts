import { http } from "@/lib/http";
import type { WarrantyCheckResult } from "./types";

// Public endpoint, no login. Rate-limited by the API; a 429 becomes a friendly message (Section 8.1).
export const warrantyLookupApi = {
  check: (serial: string) =>
    http.get<WarrantyCheckResult>("/warranty/check", { params: { serial } }).then((r) => r.data),
};
