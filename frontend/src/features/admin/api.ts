import { http } from "@/lib/http";
import type { Paginated, PageParams, WarrantyPolicy } from "@/types";
import type { AdminUser, AppSettings } from "./types";

export const adminApi = {
  users: (params: PageParams) =>
    http.get<Paginated<AdminUser>>("/admin/users", { params }).then((r) => r.data),
  policies: () => http.get<WarrantyPolicy[]>("/admin/policies").then((r) => r.data),
  settings: () => http.get<AppSettings>("/admin/settings").then((r) => r.data),
  saveSettings: (body: AppSettings) => http.put<AppSettings>("/admin/settings", body).then((r) => r.data),
};
