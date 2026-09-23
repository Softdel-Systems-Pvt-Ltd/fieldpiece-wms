import { createColumnHelper } from "@tanstack/react-table";
import { ClipboardPlus, Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout";
import {
  buttonVariants,
  Button,
  ClaimStatusBadge,
  DataTable,
  Input,
  MonoId,
  NativeSelect,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/session";
import { useTableParams } from "@/lib/use-table-params";
import type { Claim, ClaimStatus } from "@/types";
import { SlaCountdown } from "../components/SlaCountdown";
import { useClaims } from "../hooks";

const STATUSES: ClaimStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "NEEDS_INFO",
  "APPROVED",
  "REJECTED",
  "RMA_ISSUED",
  "IN_TRANSIT",
  "RECEIVED",
  "REPAIRED",
  "REPLACED",
  "CREDITED",
  "CLOSED",
];

const col = createColumnHelper<Claim>();

export default function ClaimsListPage() {
  const { t, i18n } = useTranslation();
  const role = useCurrentRole();
  const [params, update] = useTableParams({ sort: "-updatedAt" });
  const [search, setSearch] = useState(params.q ?? "");
  const status = params.filters.status as ClaimStatus | undefined;
  const query = useClaims({
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    q: params.q,
    status,
  });

  const columns = useMemo(
    () => [
      col.accessor("id", {
        header: t("claims.columns.id"),
        cell: (info) => (
          <Link to={`/claims/${info.getValue()}`} className="underline-offset-2 hover:underline">
            <MonoId>{info.getValue()}</MonoId>
          </Link>
        ),
      }),
      col.accessor("serialNumber", {
        header: t("claims.columns.serial"),
        cell: (info) => <MonoId>{info.getValue()}</MonoId>,
      }),
      col.accessor("sku", { header: t("claims.columns.sku") }),
      col.accessor("failureCategory", {
        header: t("claims.columns.category"),
        enableSorting: false,
        cell: (info) => t(`claims.failure.${info.getValue()}`),
      }),
      col.accessor("status", {
        header: t("claims.columns.status"),
        cell: (info) => <ClaimStatusBadge status={info.getValue()} />,
      }),
      col.accessor("slaDueAt", {
        header: t("claims.columns.sla"),
        cell: (info) => <SlaCountdown dueAt={info.getValue()} />,
      }),
      col.accessor("updatedAt", {
        header: t("claims.columns.updated"),
        cell: (info) => formatDate(info.getValue(), i18n.language),
      }),
    ],
    [t, i18n.language],
  );

  return (
    <>
      <PageHeader
        title={t("claims.title")}
        breadcrumbs={[{ label: t("nav.dashboard"), to: "/" }, { label: t("claims.title") }]}
        actions={
          can(role, "claims:create") ? (
            <Link to="/claims/new" className={buttonVariants()}>
              <ClipboardPlus size={20} strokeWidth={1.75} aria-hidden />
              {t("claims.new")}
            </Link>
          ) : null
        }
      />
      <DataTable
        caption={t("claims.title")}
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
        emptyMessage={t("claims.empty")}
        selectable={can(role, "claims:review")}
        toolbar={
          <>
            <form
              role="search"
              className="relative w-full sm:w-72"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: search.trim() });
              }}
            >
              <label htmlFor="claims-search" className="sr-only">
                {t("claims.searchPlaceholder")}
              </label>
              <Search
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-500"
              />
              <Input
                id="claims-search"
                type="search"
                className="ps-9"
                placeholder={t("claims.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <label htmlFor="claims-status" className="sr-only">
              {t("claims.filterStatus")}
            </label>
            <NativeSelect
              id="claims-status"
              className="w-full sm:w-48"
              value={status ?? ""}
              onChange={(e) => update({ status: e.target.value })}
            >
              <option value="">{t("claims.allStatuses")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.claim.${s}`)}
                </option>
              ))}
            </NativeSelect>
            {/* TODO: column picker and server-side CSV export (GET /claims/export?...) */}
            <Button variant="ghost" icon={Download} className="sm:ms-auto">
              {t("common.exportCsv")}
            </Button>
          </>
        }
      />
    </>
  );
}
