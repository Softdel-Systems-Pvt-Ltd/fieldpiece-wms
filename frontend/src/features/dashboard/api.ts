import { http } from "@/lib/http";
import type { ClaimSummary, Paginated, Registration, Rma } from "@/types";
import type { ClaimsSummary } from "./types";

// The API scopes every call to the caller (distributors see their organisation only).
export const dashboardApi = {
  summary: () => http.get<ClaimsSummary>("/reports/claims-summary").then((r) => r.data),
  claims: (params: Record<string, string | number>) =>
    http.get<Paginated<ClaimSummary>>("/claims", { params }).then((r) => r.data),
  registrations: (params: Record<string, string | number>) =>
    http.get<Paginated<Registration>>("/registrations", { params }).then((r) => r.data),
  rmas: (params: Record<string, string | number>) =>
    http.get<Paginated<Rma>>("/rmas", { params }).then((r) => r.data),
};
