import { mutationHeaders } from "@/lib/concurrency";
import { http } from "@/lib/http";
import type { Paginated, Rma } from "@/types";
import type { CompleteRequest, InspectRequest, RmaFilters, ShipInboundRequest } from "./types";

const act =
  <B>(path: string) =>
  (id: string, version: number, body: B) =>
    http.post<Rma>(`/rmas/${id}/${path}`, body, { headers: mutationHeaders(version) }).then((r) => r.data);

export const rmaApi = {
  list: (filters: RmaFilters) => http.get<Paginated<Rma>>("/rmas", { params: filters }).then((r) => r.data),
  get: (id: string) => http.get<Rma>(`/rmas/${id}`).then((r) => r.data),
  shipInbound: act<ShipInboundRequest>("ship-inbound"),
  receive: act<{ note?: string }>("receive"),
  inspect: act<InspectRequest>("inspect"),
  complete: act<CompleteRequest>("complete"),
  cancel: act<{ reason: string }>("cancel"),
};
