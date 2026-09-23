import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/feedback";
import { toApiError } from "@/lib/api-error";
import { useCurrentUser } from "@/lib/session";
import type { Claim, ClaimAction, ClaimEvent } from "@/types";
import { claimsApi } from "./api";
import type { ClaimEventsPage, ClaimFilters, TransitionBody } from "./types";

export const claimKeys = {
  all: ["claims"] as const,
  list: (filters: ClaimFilters) => ["claims", filters] as const,
  detail: (id: string) => ["claim", id] as const,
  events: (id: string) => ["claim", id, "events"] as const,
  categories: ["failure-categories"] as const,
};

export function useClaims(filters: ClaimFilters, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: claimKeys.list(filters),
    queryFn: () => claimsApi.list(filters),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useClaim(id: string | undefined) {
  return useQuery({
    queryKey: claimKeys.detail(id ?? ""),
    queryFn: () => claimsApi.get(id ?? ""),
    enabled: !!id,
  });
}

export function useClaimEvents(id: string) {
  return useQuery({ queryKey: claimKeys.events(id), queryFn: () => claimsApi.events(id) });
}

export function useFailureCategories() {
  return useQuery({
    queryKey: claimKeys.categories,
    queryFn: claimsApi.failureCategories,
    staleTime: 10 * 60_000,
  });
}

/** Refresh everything that shows this claim after a change. */
function useClaimChanged(id: string) {
  const qc = useQueryClient();
  return (claim?: Claim) => {
    if (claim) qc.setQueryData(claimKeys.detail(id), claim);
    void qc.invalidateQueries({ queryKey: claimKeys.all });
    void qc.invalidateQueries({ queryKey: claimKeys.events(id) });
  };
}

/** A 409 STALE_VERSION means someone else changed the claim: reload it instead of failing silently. */
function useConflictHandler(id: string) {
  const qc = useQueryClient();
  return (error: unknown) => {
    const apiError = toApiError(error);
    if (apiError.code === "STALE_VERSION" || apiError.code === "CLAIM_INVALID_TRANSITION") {
      void qc.invalidateQueries({ queryKey: claimKeys.detail(id) });
    }
    toast.error(apiError.message);
  };
}

export function useClaimTransition(id: string) {
  const changed = useClaimChanged(id);
  const onError = useConflictHandler(id);
  return useMutation({
    mutationFn: ({
      action,
      version,
      body,
    }: {
      action: ClaimAction;
      version: number;
      body?: TransitionBody;
    }) => claimsApi.transition(id, action, version, body),
    onSuccess: changed,
    onError,
  });
}

export function useAssignClaim(id: string) {
  const changed = useClaimChanged(id);
  const onError = useConflictHandler(id);
  return useMutation({
    mutationFn: ({ version, assigneeId }: { version: number; assigneeId: string | null }) =>
      claimsApi.assign(id, version, assigneeId),
    onSuccess: changed,
    onError,
  });
}

/** Comments update optimistically (Section 9). */
export function useAddComment(id: string) {
  const qc = useQueryClient();
  const user = useCurrentUser();
  const key = claimKeys.events(id);

  return useMutation({
    mutationFn: (body: { comment: string; internal?: boolean }) => claimsApi.comment(id, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ClaimEventsPage>(key);
      if (previous && user) {
        const optimistic: ClaimEvent = {
          id: `optimistic-${Date.now()}`,
          at: new Date().toISOString(),
          actor: { id: user.id, name: user.name, role: user.role },
          type: "comment",
          fromStatus: null,
          toStatus: null,
          comment: body.comment,
          internal: body.internal ?? false,
        };
        qc.setQueryData<ClaimEventsPage>(key, { ...previous, items: [...previous.items, optimistic] });
      }
      return { previous };
    },
    onError: (error, _body, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
      toast.error(toApiError(error).message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
