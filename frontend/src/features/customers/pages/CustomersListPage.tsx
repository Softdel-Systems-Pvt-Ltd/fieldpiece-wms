import { createColumnHelper } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout";
import { DataTable } from "@/components/ui";
import { useTableParams } from "@/lib/use-table-params";
import type { Customer } from "@/types";
import { useCustomers } from "../hooks";

const col = createColumnHelper<Customer>();

export default function CustomersListPage() {
  const { t } = useTranslation();
  const [params, update] = useTableParams();
  const query = useCustomers({
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    q: params.q,
  });

  const columns = useMemo(
    () => [
      col.accessor("name", {
        header: "Name",
        cell: (i) => (
          <Link to={`/customers/${i.row.original.id}`} className="font-semibold hover:underline">
            {i.getValue()}
          </Link>
        ),
      }),
      col.accessor("email", { header: t("fields.email") }),
    ],
    [t],
  );

  return (
    <>
      <PageHeader
        title={t("customers.title")}
        breadcrumbs={[{ label: t("nav.dashboard"), to: "/" }, { label: t("customers.title") }]}
      />
      <DataTable
        caption={t("customers.title")}
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
        emptyIcon={Users}
        emptyMessage={t("common.comingSoon")}
      />
    </>
  );
}
