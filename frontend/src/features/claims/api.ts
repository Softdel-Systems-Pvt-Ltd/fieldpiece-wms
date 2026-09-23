import { http } from "@/lib/http";
import type { Claim, ClaimEvent, Paginated } from "@/types";
import type { ClaimDraft } from "./schemas";
import type { ClaimFilters, CommentRequest, TransitionRequest } from "./types";

export const claimsApi = {
  list: (filters: ClaimFilters) =>
    http.get<Paginated<Claim>>("/claims", { params: filters }).then((r) => r.data),

  get: (id: string) => http.get<Claim>(`/claims/${encodeURIComponent(id)}`).then((r) => r.data),

  /** Section 8.4: drafts are saved to the API as DRAFT. */
  saveDraft: (draft: Partial<ClaimDraft> & { id?: string }) =>
    (draft.id
      ? http.put<Claim>(`/claims/${encodeURIComponent(draft.id)}`, { ...draft, status: "DRAFT" })
      : http.post<Claim>("/claims", { ...draft, status: "DRAFT" })
    ).then((r) => r.data),

  transition: (id: string, body: TransitionRequest) =>
    http.post<Claim>(`/claims/${encodeURIComponent(id)}/transitions`, body).then((r) => r.data),

  comment: (id: string, body: CommentRequest) =>
    http.post<ClaimEvent>(`/claims/${encodeURIComponent(id)}/comments`, body).then((r) => r.data),
};
