import { http } from "@/lib/http";
import type { DashboardSummary } from "./types";

// The API scopes the summary to the caller's role and account.
export const dashboardApi = {
  summary: () => http.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
};
