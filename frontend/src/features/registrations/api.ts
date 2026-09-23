import { http } from "@/lib/http";
import type { Paginated, Product, Registration } from "@/types";
import type { CreateRegistrationRequest, RegistrationFilters } from "./types";

export const registrationsApi = {
  list: (filters: RegistrationFilters) =>
    http.get<Paginated<Registration>>("/registrations", { params: filters }).then((r) => r.data),

  create: (body: CreateRegistrationRequest) =>
    http.post<Registration>("/registrations", body).then((r) => r.data),

  /** Product catalogue for the SKU picker. */
  products: () => http.get<Product[]>("/products").then((r) => r.data),
};
