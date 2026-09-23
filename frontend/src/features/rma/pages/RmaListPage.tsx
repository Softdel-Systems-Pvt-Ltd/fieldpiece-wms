import { createColumnHelper } from "@tanstack/react-table";
import { Truck } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout";
import { DataTable, MonoId, NativeSelect, RmaStatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useServerTable } from "@/lib/use-server-table";
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
  const list = useServerTable({ sort: "-updatedAt" });
  const query = useRmas({
    ...list.request,
    status: list.filters.status,
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
        {...list.bind(query)}
        getRowId={(r) => r.id}
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
              value={list.filters.status ?? ""}
              onChange={(e) => list.update({ status: e.target.value })}
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
