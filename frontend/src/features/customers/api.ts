import { http } from "@/lib/http";
import type { Customer, Paginated } from "@/types";
import type { CustomerFilters } from "./types";

export const customersApi = {
  list: (filters: CustomerFilters) =>
    http.get<Paginated<Customer>>("/customers", { params: filters }).then((r) => r.data),
  get: (id: string) => http.get<Customer>(`/customers/${encodeURIComponent(id)}`).then((r) => r.data),
};
