import { idempotencyKey, ifMatch, mutationHeaders } from "@/lib/concurrency";
import { http } from "@/lib/http";
import type {
  Claim,
  ClaimAction,
  ClaimEvent,
  ClaimSummary,
  FailureCategory,
  Paginated,
  Registration,
} from "@/types";
import { ACTION_META } from "./transitions";
import type {
  ClaimDraftRequest,
  ClaimEventsPage,
  ClaimFilters,
  ClaimUpdateRequest,
  TransitionBody,
} from "./types";

export const claimsApi = {
  list: (filters: ClaimFilters) =>
    http.get<Paginated<ClaimSummary>>("/claims", { params: filters }).then((r) => r.data),

  get: (id: string) => http.get<Claim>(`/claims/${id}`).then((r) => r.data),

  events: (id: string) =>
    http.get<ClaimEventsPage>(`/claims/${id}/events`, { params: { limit: 200 } }).then((r) => r.data),

  /** The caller's own registered unit for a serial (the API scopes the list), or null. */
  findRegistration: (serial: string) =>
    http
      .get<Paginated<Registration>>("/registrations", { params: { serial, pageSize: 1 } })
      .then((r) => r.data.items[0] ?? null),

  failureCategories: () =>
    http.get<{ items: FailureCategory[] }>("/failure-categories").then((r) => r.data.items),

  /** Section 8.4: drafts are saved to the API as DRAFT. */
  createDraft: (body: ClaimDraftRequest) =>
    http.post<Claim>("/claims", body, { headers: idempotencyKey() }).then((r) => r.data),

  updateDraft: (id: string, version: number, body: ClaimUpdateRequest) =>
    http.patch<Claim>(`/claims/${id}`, body, { headers: ifMatch(version) }).then((r) => r.data),

  transition: (id: string, action: ClaimAction, version: number, body: TransitionBody = {}) =>
    http
      .post<Claim>(`/claims/${id}/${ACTION_META[action].path}`, body, { headers: mutationHeaders(version) })
      .then((r) => r.data),

  assign: (id: string, version: number, assigneeId: string | null) =>
    http
      .post<Claim>(`/claims/${id}/assign`, { assigneeId }, { headers: mutationHeaders(version) })
      .then((r) => r.data),

  comment: (id: string, body: { comment: string; internal?: boolean }) =>
    http.post<ClaimEvent>(`/claims/${id}/comments`, body, { headers: idempotencyKey() }).then((r) => r.data),
};
