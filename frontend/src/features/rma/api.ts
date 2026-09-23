import { http } from "@/lib/http";
import type { Paginated, Rma } from "@/types";
import type { InspectionRequest, RmaFilters } from "./types";

export const rmaApi = {
  list: (filters: RmaFilters) => http.get<Paginated<Rma>>("/rma", { params: filters }).then((r) => r.data),
  get: (id: string) => http.get<Rma>(`/rma/${encodeURIComponent(id)}`).then((r) => r.data),
  setTracking: (id: string, body: { inboundTracking?: string; outboundTracking?: string }) =>
    http.patch<Rma>(`/rma/${encodeURIComponent(id)}`, body).then((r) => r.data),
  inspect: (id: string, body: InspectionRequest) =>
    http.post<Rma>(`/rma/${encodeURIComponent(id)}/inspection`, body).then((r) => r.data),
};
