import { http } from "@/lib/http";
import type { Customer, Paginated, Registration } from "@/types";
import type { CustomerFilters } from "./types";

export const customersApi = {
  list: (filters: CustomerFilters) =>
    http.get<Paginated<Customer>>("/customers", { params: filters }).then((r) => r.data),
  get: (id: string) => http.get<Customer>(`/customers/${id}`).then((r) => r.data),
  /** Units registered to this customer (the API scopes it to the caller). */
  registrations: (customerId: string) =>
    http
      .get<Paginated<Registration>>("/registrations", {
        params: { customerId, pageSize: 50, sort: "-createdAt" },
      })
      .then((r) => r.data),
};
