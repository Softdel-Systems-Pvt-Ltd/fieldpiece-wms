import { createColumnHelper } from "@tanstack/react-table";
import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout";
import { DataTable, Input } from "@/components/ui";
import { useTableParams } from "@/lib/use-table-params";
import type { Customer } from "@/types";
import { useCustomers } from "../hooks";

const col = createColumnHelper<Customer>();

export default function CustomersListPage() {
  const { t } = useTranslation();
  const [params, update] = useTableParams({ sort: "contactName" });
  const [search, setSearch] = useState(params.q ?? "");
  const query = useCustomers({
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    q: params.q,
  });

  const columns = useMemo(
    () => [
      col.accessor("contactName", {
        header: t("customers.contact"),
        cell: (i) => (
          <Link to={`/customers/${i.row.original.id}`} className="font-semibold hover:underline">
            {i.getValue()}
          </Link>
        ),
      }),
      col.accessor("companyName", { header: t("customers.company"), cell: (i) => i.getValue() ?? "—" }),
      col.accessor("email", {
        header: t("fields.email"),
        enableSorting: false,
        cell: (i) => i.getValue() ?? "—",
      }),
      col.accessor((row) => [row.address.city, row.address.region].filter(Boolean).join(", "), {
        id: "location",
        header: t("customers.location"),
        enableSorting: false,
      }),
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
        sort={params.sort}
        onSortChange={(sort) => update({ sort })}
        onPageChange={(page) => update({ page })}
        getRowId={(r) => r.id}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyIcon={Users}
        emptyMessage={t("customers.empty")}
        toolbar={
          <form
            role="search"
            className="relative w-full sm:w-72"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: search.trim() });
            }}
          >
            <label htmlFor="customers-search" className="sr-only">
              {t("customers.search")}
            </label>
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-500"
            />
            <Input
              id="customers-search"
              type="search"
              className="ps-9"
              placeholder={t("customers.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        }
      />
    </>
  );
}
