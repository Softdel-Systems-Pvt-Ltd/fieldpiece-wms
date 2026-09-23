import { idempotencyKey } from "@/lib/concurrency";
import { http } from "@/lib/http";
import type { Paginated, Product, Registration, RegistrationDetail } from "@/types";
import type { CreateRegistrationRequest, ImportStatus, RegistrationFilters } from "./types";

export const registrationsApi = {
  list: (filters: RegistrationFilters) =>
    http.get<Paginated<Registration>>("/registrations", { params: filters }).then((r) => r.data),

  get: (id: string) => http.get<RegistrationDetail>(`/registrations/${id}`).then((r) => r.data),

  create: (body: CreateRegistrationRequest) =>
    http.post<Registration>("/registrations", body, { headers: idempotencyKey() }).then((r) => r.data),

  /** Signed URL to the certificate PDF; 409 CERTIFICATE_NOT_READY while the worker renders it. */
  certificateUrl: (id: string) =>
    http.get<{ url: string }>(`/registrations/${id}/certificate`).then((r) => r.data.url),

  /** Product catalogue for the SKU picker (small; one page of 100 covers it). */
  products: () =>
    http.get<Paginated<Product>>("/products", { params: { pageSize: 100 } }).then((r) => r.data.items),

  importTemplate: () =>
    http.get<string>("/registrations/import-template", { responseType: "text" }).then((r) => r.data),

  startImport: (attachmentId: string) =>
    http
      .post<ImportStatus>("/registrations/imports", { attachmentId }, { headers: idempotencyKey() })
      .then((r) => r.data),

  importStatus: (jobId: string) => http.get<ImportStatus>(`/imports/${jobId}`).then((r) => r.data),
};
