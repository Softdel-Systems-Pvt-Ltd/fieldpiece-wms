import { idempotencyKey } from "@/lib/concurrency";
import { http } from "@/lib/http";
import type { AdminUser, Paginated, WarrantyPolicy } from "@/types";
import type { CreatePolicyRequest, UpdateUserRequest, UserFilters } from "./types";

export const adminApi = {
  users: (filters: UserFilters) =>
    http.get<Paginated<AdminUser>>("/users", { params: filters }).then((r) => r.data),
  updateUser: (id: string, body: UpdateUserRequest) =>
    http.patch<AdminUser>(`/users/${id}`, body).then((r) => r.data),
  policies: () => http.get<{ items: WarrantyPolicy[] }>("/policies").then((r) => r.data.items),
  createPolicy: (body: CreatePolicyRequest) =>
    http.post<WarrantyPolicy>("/policies", body, { headers: idempotencyKey() }).then((r) => r.data),
};
