import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "./api";
import type { UpdateUserRequest, UserFilters } from "./types";

export const adminKeys = {
  users: (filters: UserFilters) => ["admin", "users", filters] as const,
  policies: ["admin", "policies"] as const,
};

export function useAdminUsers(filters: UserFilters) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: () => adminApi.users(filters),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserRequest }) => adminApi.updateUser(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useWarrantyPolicies() {
  return useQuery({ queryKey: adminKeys.policies, queryFn: adminApi.policies });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createPolicy,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.policies });
      void qc.invalidateQueries({ queryKey: ["products"] }); // catalogue shows the current term
    },
  });
}
