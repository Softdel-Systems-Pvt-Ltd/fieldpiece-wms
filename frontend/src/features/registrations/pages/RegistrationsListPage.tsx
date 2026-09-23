import { createColumnHelper } from "@tanstack/react-table";
import { ShieldCheck, Upload } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout";
import { buttonVariants, DataTable, MonoId, WarrantyStatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/session";
import { useTableParams } from "@/lib/use-table-params";
import type { Registration } from "@/types";
import { useRegistrations } from "../hooks";

const col = createColumnHelper<Registration>();

export default function RegistrationsListPage() {
  const { t, i18n } = useTranslation();
  const role = useCurrentRole();
  const [params, update] = useTableParams({ sort: "-createdAt" });
  const query = useRegistrations({
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    q: params.q,
  });

  const columns = useMemo(
    () => [
      col.accessor("serialNumber", {
        header: t("registrations.columns.serial"),
        cell: (i) => <MonoId>{i.getValue()}</MonoId>,
      }),
      col.accessor("sku", { header: t("registrations.columns.sku") }),
      col.accessor("purchaseDate", {
        header: t("registrations.columns.purchaseDate"),
        cell: (i) => formatDate(i.getValue(), i18n.language),
      }),
      col.accessor("warrantyEnd", {
        header: t("registrations.columns.warrantyEnd"),
        cell: (i) => formatDate(i.getValue(), i18n.language),
      }),
      col.accessor("status", {
        header: t("registrations.columns.status"),
        cell: (i) => <WarrantyStatusBadge status={i.getValue()} />,
      }),
    ],
    [t, i18n.language],
  );

  return (
    <>
      <PageHeader
        title={t("registrations.title")}
        breadcrumbs={[{ label: t("nav.dashboard"), to: "/" }, { label: t("registrations.title") }]}
        actions={
          <>
            {can(role, "registrations:bulk") ? (
              <Link to="/registrations/bulk" className={buttonVariants({ variant: "secondary" })}>
                <Upload size={20} strokeWidth={1.75} aria-hidden />
                {t("registrations.bulk")}
              </Link>
            ) : null}
            <Link to="/registrations/new" className={buttonVariants()}>
              <ShieldCheck size={20} strokeWidth={1.75} aria-hidden />
              {t("registrations.new")}
            </Link>
          </>
        }
      />
      <DataTable
        caption={t("registrations.title")}
        columns={columns}
        data={query.data?.items}
        total={query.data?.total ?? 0}
        page={params.page}
        pageSize={params.pageSize}
        sort={params.sort}
        onSortChange={(sort) => update({ sort })}
        onPageChange={(page) => update({ page })}
        getRowId={(row) => row.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyIcon={ShieldCheck}
        emptyMessage={t("registrations.empty")}
      />
    </>
  );
}
