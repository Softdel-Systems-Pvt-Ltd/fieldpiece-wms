import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/feedback";
import { toApiError } from "@/lib/api-error";
import type { Rma, RmaAction } from "@/types";
import { rmaApi } from "./api";
import type { RmaFilters } from "./types";

export const rmaKeys = {
  all: ["rmas"] as const,
  list: (filters: RmaFilters) => ["rmas", filters] as const,
  detail: (id: string) => ["rma", id] as const,
};

export function useRmas(filters: RmaFilters, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: rmaKeys.list(filters),
    queryFn: () => rmaApi.list(filters),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useRma(id: string | undefined) {
  return useQuery({ queryKey: rmaKeys.detail(id ?? ""), queryFn: () => rmaApi.get(id ?? ""), enabled: !!id });
}

/** A lifecycle call, already bound to the version the user loaded. */
export interface RmaCall {
  action: RmaAction;
  run: () => Promise<Rma>;
}

/** Runs a lifecycle action; a stale version or invalid transition reloads the RMA. */
export function useRmaAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ run }: RmaCall) => run(),
    onSuccess: (rma) => {
      qc.setQueryData(rmaKeys.detail(id), rma);
      void qc.invalidateQueries({ queryKey: rmaKeys.all });
      void qc.invalidateQueries({ queryKey: ["claim", rma.claimId] });
      void qc.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (error) => {
      const apiError = toApiError(error);
      if (apiError.code === "STALE_VERSION" || apiError.code === "RMA_INVALID_TRANSITION") {
        void qc.invalidateQueries({ queryKey: rmaKeys.detail(id) });
      }
      toast.error(apiError.message);
    },
  });
}
