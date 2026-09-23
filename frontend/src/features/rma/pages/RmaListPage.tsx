import { createColumnHelper } from "@tanstack/react-table";
import { Truck } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout";
import { DataTable, MonoId, RmaStatusBadge } from "@/components/ui";
import { useTableParams } from "@/lib/use-table-params";
import type { Rma } from "@/types";
import { useRmas } from "../hooks";

const col = createColumnHelper<Rma>();

export default function RmaListPage() {
  const { t } = useTranslation();
  const [params, update] = useTableParams();
  const query = useRmas({ page: params.page, pageSize: params.pageSize, sort: params.sort });

  const columns = useMemo(
    () => [
      col.accessor("id", {
        header: "RMA",
        cell: (i) => (
          <Link to={`/rma/${i.getValue()}`} className="hover:underline">
            <MonoId>{i.getValue()}</MonoId>
          </Link>
        ),
      }),
      col.accessor("claimId", {
        header: t("claims.columns.id"),
        cell: (i) => (
          <Link to={`/claims/${i.getValue()}`} className="hover:underline">
            <MonoId>{i.getValue()}</MonoId>
          </Link>
        ),
      }),
      col.accessor("type", { header: "Type" }),
      col.accessor("status", {
        header: t("claims.columns.status"),
        cell: (i) => <RmaStatusBadge status={i.getValue()} />,
      }),
    ],
    [t],
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
        onPageChange={(page) => update({ page })}
        getRowId={(r) => r.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyIcon={Truck}
        emptyMessage={t("common.comingSoon")}
      />
    </>
  );
}
