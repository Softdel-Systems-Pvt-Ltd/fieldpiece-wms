import { useQuery } from "@tanstack/react-query";
import type { PageParams } from "@/types";
import { adminApi } from "./api";

export const adminKeys = {
  users: (params: PageParams) => ["admin", "users", params] as const,
  policies: ["admin", "policies"] as const,
  settings: ["admin", "settings"] as const,
};

export function useAdminUsers(params: PageParams) {
  return useQuery({ queryKey: adminKeys.users(params), queryFn: () => adminApi.users(params) });
}

export function useWarrantyPolicies() {
  return useQuery({ queryKey: adminKeys.policies, queryFn: adminApi.policies });
}
