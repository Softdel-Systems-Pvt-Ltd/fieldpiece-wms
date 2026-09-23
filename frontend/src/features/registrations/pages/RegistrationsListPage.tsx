import { createColumnHelper } from "@tanstack/react-table";
import { Search, ShieldCheck, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout";
import { buttonVariants, DataTable, Input, MonoId, NativeSelect, WarrantyStatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/session";
import { useServerTable } from "@/lib/use-server-table";
import type { Registration, RegistrationStatus } from "@/types";
import { useRegistrations } from "../hooks";

const STATUSES: RegistrationStatus[] = ["ACTIVE", "EXPIRING_SOON", "EXPIRED", "VOID"];
const col = createColumnHelper<Registration>();

export default function RegistrationsListPage() {
  const { t, i18n } = useTranslation();
  const role = useCurrentRole();
  const list = useServerTable({ sort: "-createdAt" });
  const [search, setSearch] = useState(list.q ?? list.filters.serial ?? "");
  const status = list.filters.status as RegistrationStatus | undefined;
  const query = useRegistrations({
    ...list.request,
    serial: list.filters.serial,
    status,
  });

  const columns = useMemo(
    () => [
      col.accessor("serialNumber", {
        header: t("registrations.columns.serial"),
        cell: (i) => <MonoId>{i.getValue()}</MonoId>,
      }),
      col.accessor("productName", {
        header: t("registrations.columns.product"),
        enableSorting: false,
        cell: (i) => `${i.row.original.sku} · ${i.getValue()}`,
      }),
      col.accessor("customerName", { header: t("registrations.columns.owner"), enableSorting: false }),
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
        enableSorting: false,
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
        {...list.bind(query)}
        getRowId={(row) => row.id}
        emptyIcon={ShieldCheck}
        emptyMessage={t("registrations.empty")}
        toolbar={
          <>
            <form
              role="search"
              className="relative w-full sm:w-72"
              onSubmit={(e) => {
                e.preventDefault();
                list.update({ q: search.trim(), serial: undefined });
              }}
            >
              <label htmlFor="registrations-search" className="sr-only">
                {t("registrations.searchPlaceholder")}
              </label>
              <Search
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-500"
              />
              <Input
                id="registrations-search"
                type="search"
                className="ps-9"
                placeholder={t("registrations.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <label htmlFor="registrations-status" className="sr-only">
              {t("registrations.columns.status")}
            </label>
            <NativeSelect
              id="registrations-status"
              className="w-full sm:w-48"
              value={status ?? ""}
              onChange={(e) => list.update({ status: e.target.value })}
            >
              <option value="">{t("claims.allStatuses")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.warranty.${s}`)}
                </option>
              ))}
            </NativeSelect>
          </>
        }
      />
    </>
  );
}
