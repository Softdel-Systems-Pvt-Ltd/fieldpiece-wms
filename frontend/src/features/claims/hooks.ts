import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/feedback";
import { toApiError } from "@/lib/api-error";
import { useCurrentUser } from "@/lib/session";
import type { Claim, ClaimEvent } from "@/types";
import { claimsApi } from "./api";
import type { ClaimFilters, CommentRequest, TransitionRequest } from "./types";

export const claimKeys = {
  all: ["claims"] as const,
  list: (filters: ClaimFilters) => ["claims", filters] as const,
  detail: (id: string) => ["claim", id] as const,
};

export function useClaims(filters: ClaimFilters) {
  return useQuery({
    queryKey: claimKeys.list(filters),
    queryFn: () => claimsApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useClaim(id: string | undefined) {
  return useQuery({
    queryKey: claimKeys.detail(id ?? ""),
    queryFn: () => claimsApi.get(id ?? ""),
    enabled: !!id,
  });
}

export function useClaimTransition(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TransitionRequest) => claimsApi.transition(id, body),
    onSuccess: (claim) => {
      qc.setQueryData(claimKeys.detail(id), claim);
      void qc.invalidateQueries({ queryKey: claimKeys.all });
    },
    onError: (error) => toast.error(toApiError(error).message),
  });
}

/** Comments update optimistically (Section 9). */
export function useAddComment(id: string) {
  const qc = useQueryClient();
  const user = useCurrentUser();

  return useMutation({
    mutationFn: (body: CommentRequest) => claimsApi.comment(id, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: claimKeys.detail(id) });
      const previous = qc.getQueryData<Claim>(claimKeys.detail(id));
      if (previous && user) {
        const optimistic: ClaimEvent = {
          at: new Date().toISOString(),
          actor: { id: user.id, name: user.name, role: user.role },
          type: "comment",
          comment: body.comment,
          internal: body.internal,
        };
        qc.setQueryData<Claim>(claimKeys.detail(id), {
          ...previous,
          history: [...previous.history, optimistic],
        });
      }
      return { previous };
    },
    onError: (error, _body, context) => {
      if (context?.previous) qc.setQueryData(claimKeys.detail(id), context.previous);
      toast.error(toApiError(error).message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: claimKeys.detail(id) }),
  });
}
