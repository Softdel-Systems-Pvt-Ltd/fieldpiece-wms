import { createColumnHelper } from "@tanstack/react-table";
import { Truck } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout";
import { DataTable, MonoId, NativeSelect, RmaStatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useTableParams } from "@/lib/use-table-params";
import type { Rma } from "@/types";
import { useRmas } from "../hooks";

const col = createColumnHelper<Rma>();

/** Quick filters for the service-center queue (Section 8.2). */
const VIEWS = {
  "": "rma.views.all",
  "ISSUED,IN_TRANSIT": "rma.views.toReceive",
  "RECEIVED,INSPECTED": "rma.views.inService",
  "COMPLETED,CANCELLED": "rma.views.done",
} as const;

export default function RmaListPage() {
  const { t, i18n } = useTranslation();
  const [params, update] = useTableParams({ sort: "-updatedAt" });
  const query = useRmas({
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    q: params.q,
    status: params.filters.status,
  });

  const columns = useMemo(
    () => [
      col.accessor("displayNo", {
        header: "RMA",
        cell: (i) => (
          <Link to={`/rma/${i.row.original.id}`} className="hover:underline">
            <MonoId>{i.getValue()}</MonoId>
          </Link>
        ),
      }),
      col.accessor("claimDisplayNo", {
        header: t("claims.columns.id"),
        enableSorting: false,
        cell: (i) => (
          <Link to={`/claims/${i.row.original.claimId}`} className="hover:underline">
            <MonoId>{i.getValue()}</MonoId>
          </Link>
        ),
      }),
      col.accessor("serialNumber", {
        header: t("claims.columns.serial"),
        enableSorting: false,
        cell: (i) => <MonoId>{i.getValue()}</MonoId>,
      }),
      col.accessor("type", {
        header: t("rma.type"),
        enableSorting: false,
        cell: (i) => t(`claims.resolutions.${i.getValue()}`),
      }),
      col.accessor("status", {
        header: t("claims.columns.status"),
        cell: (i) => <RmaStatusBadge status={i.getValue()} />,
      }),
      col.accessor("updatedAt", {
        header: t("claims.columns.updated"),
        cell: (i) => formatDate(i.getValue(), i18n.language),
      }),
    ],
    [t, i18n.language],
  );

  return (
    <>
      <PageHeader
        title={t("rma.title")}
        breadcrumbs={[{ label: t("nav.dashboard"), to: "/" }, { label: t("rma.title") }]}
      />
      <DataTable
        caption={t("rma.title")}
        columns={columns}
        data={query.data?.items}
        total={query.data?.total ?? 0}
        page={params.page}
        pageSize={params.pageSize}
        sort={params.sort}
        onSortChange={(sort) => update({ sort })}
        onPageChange={(page) => update({ page })}
        getRowId={(r) => r.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyIcon={Truck}
        emptyMessage={t("rma.empty")}
        toolbar={
          <>
            <label htmlFor="rma-view" className="sr-only">
              {t("claims.filterStatus")}
            </label>
            <NativeSelect
              id="rma-view"
              className="w-full sm:w-56"
              value={params.filters.status ?? ""}
              onChange={(e) => update({ status: e.target.value })}
            >
              {Object.entries(VIEWS).map(([value, key]) => (
                <option key={value} value={value}>
                  {t(key)}
                </option>
              ))}
            </NativeSelect>
          </>
        }
      />
    </>
  );
}
