import { createColumnHelper } from "@tanstack/react-table";
import { ClipboardPlus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout";
import { buttonVariants, ClaimStatusBadge, DataTable, Input, MonoId, NativeSelect } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/session";
import { useTableParams } from "@/lib/use-table-params";
import type { ClaimStatus, ClaimSummary } from "@/types";
import { SlaCountdown } from "../components/SlaCountdown";
import { useClaims, useFailureCategories } from "../hooks";

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

const col = createColumnHelper<ClaimSummary>();

export default function ClaimsListPage() {
  const { t, i18n } = useTranslation();
  const role = useCurrentRole();
  const isReviewer = can(role, "claims:review");
  const [params, update] = useTableParams({ sort: "-updatedAt" });
  const [search, setSearch] = useState(params.q ?? params.filters.displayNo ?? "");
  const categories = useFailureCategories();
  const categoryLabel = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.code, c.label])),
    [categories.data],
  );
  const query = useClaims({
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    q: params.q,
    status: params.filters.status,
    assignedTo: params.filters.assignedTo,
    displayNo: params.filters.displayNo,
  });

  const columns = useMemo(
    () => [
      col.accessor("displayNo", {
        header: t("claims.columns.id"),
        cell: (info) => (
          <Link to={`/claims/${info.row.original.id}`} className="underline-offset-2 hover:underline">
            <MonoId>{info.getValue()}</MonoId>
          </Link>
        ),
      }),
      col.accessor("serialNumber", {
        header: t("claims.columns.serial"),
        enableSorting: false,
        cell: (info) => <MonoId>{info.getValue()}</MonoId>,
      }),
      col.accessor("sku", { header: t("claims.columns.sku"), enableSorting: false }),
      col.accessor("failureCategory", {
        header: t("claims.columns.category"),
        enableSorting: false,
        cell: (info) => categoryLabel.get(info.getValue()) ?? info.getValue(),
      }),
      col.accessor("status", {
        header: t("claims.columns.status"),
        cell: (info) => <ClaimStatusBadge status={info.getValue()} />,
      }),
      col.accessor((row) => row.assignee?.name ?? "", {
        id: "assignee",
        header: t("claims.assignee"),
        enableSorting: false,
        cell: (info) =>
          info.getValue() || <span className="text-text-muted">{t("claims.unassignedLabel")}</span>,
      }),
      col.accessor("slaDueAt", {
        header: t("claims.columns.sla"),
        cell: (info) => <SlaCountdown dueAt={info.getValue() ?? undefined} />,
      }),
      col.accessor("updatedAt", {
        header: t("claims.columns.updated"),
        cell: (info) => formatDate(info.getValue(), i18n.language),
      }),
    ],
    [t, i18n.language, categoryLabel],
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
        toolbar={
          <>
            <form
              role="search"
              className="relative w-full sm:w-72"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: search.trim(), displayNo: undefined });
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
              value={params.filters.status ?? ""}
              onChange={(e) => update({ status: e.target.value })}
            >
              <option value="">{t("claims.allStatuses")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.claim.${s}`)}
                </option>
              ))}
            </NativeSelect>
            {isReviewer ? (
              <>
                <label htmlFor="claims-assignee" className="sr-only">
                  {t("claims.assignee")}
                </label>
                <NativeSelect
                  id="claims-assignee"
                  className="w-full sm:w-44"
                  value={params.filters.assignedTo ?? ""}
                  onChange={(e) => update({ assignedTo: e.target.value })}
                >
                  <option value="">{t("claims.anyAssignee")}</option>
                  <option value="me">{t("claims.assignedToMe")}</option>
                  <option value="unassigned">{t("claims.unassignedLabel")}</option>
                </NativeSelect>
              </>
            ) : null}
          </>
        }
      />
    </>
  );
}
