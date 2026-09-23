import { useQuery } from "@tanstack/react-query";
import { warrantyLookupApi } from "./api";

export const warrantyLookupKeys = {
  check: (serial: string) => ["warranty-check", serial] as const,
};

export function useWarrantyCheck(serial: string | null) {
  return useQuery({
    queryKey: warrantyLookupKeys.check(serial ?? ""),
    queryFn: () => warrantyLookupApi.check(serial ?? ""),
    enabled: !!serial,
    staleTime: 60_000,
  });
}
