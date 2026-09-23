import { createColumnHelper } from "@tanstack/react-table";
import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import { Badge, Button, DataTable, Input, Modal } from "@/components/ui";
import { toApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";
import { useTableParams } from "@/lib/use-table-params";
import type { AdminUser, Role } from "@/types";
import { AdminTabs } from "../components/AdminTabs";
import { useAdminUsers, useUpdateUser } from "../hooks";

const ROLES: Role[] = ["technician", "distributor", "claims_agent", "service_center", "admin"];
const col = createColumnHelper<AdminUser>();

/** Role changes are audited and alerted server-side (backend Section 11.7). */
function EditUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const { t } = useTranslation();
  const me = useCurrentUser();
  const update = useUpdateUser();
  const [roles, setRoles] = useState<Role[]>(user.roles);
  const [active, setActive] = useState(user.isActive);
  const self = me?.id === user.id;

  const save = () =>
    update.mutate(
      { id: user.id, body: { roles, isActive: active } },
      {
        onSuccess: () => {
          toast.success(t("admin.userSaved"));
          onClose();
        },
        onError: (error) => toast.error(toApiError(error).message),
      },
    );

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={user.displayName}
      description={user.email}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} loading={update.isPending} disabled={!roles.length}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">{t("admin.roles")}</legend>
        {ROLES.map((role) => (
          <label key={role} className="flex min-h-11 items-center gap-2 text-body">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-sm border-ink-400 text-ink-1000 focus:ring-ink-1000"
              checked={roles.includes(role)}
              disabled={self && role === "admin"}
              onChange={(e) =>
                setRoles((r) => (e.target.checked ? [...r, role] : r.filter((x) => x !== role)))
              }
            />
            {t(`roles.${role}`)}
          </label>
        ))}
      </fieldset>
      <label className="mt-4 flex min-h-11 items-center gap-2 text-body">
        <input
          type="checkbox"
          className="h-4 w-4 rounded-sm border-ink-400 text-ink-1000 focus:ring-ink-1000"
          checked={active}
          disabled={self}
          onChange={(e) => setActive(e.target.checked)}
        />
        {t("admin.active")}
      </label>
      {self ? <p className="text-xs text-text-muted">{t("admin.selfHelp")}</p> : null}
    </Modal>
  );
}

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const [params, update] = useTableParams({ sort: "email" });
  const [search, setSearch] = useState(params.q ?? "");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const query = useAdminUsers({
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    q: params.q,
  });

  const columns = useMemo(
    () => [
      col.accessor("displayName", { header: t("admin.name") }),
      col.accessor("email", { header: t("fields.email") }),
      col.accessor("roles", {
        header: t("admin.roles"),
        enableSorting: false,
        cell: (i) => (
          <span className="flex flex-wrap gap-1">
            {i.getValue().map((r) => (
              <Badge key={r} dot={false} className="bg-ink-100 text-ink-700">
                {t(`roles.${r}`)}
              </Badge>
            ))}
          </span>
        ),
      }),
      col.accessor("organizationName", {
        header: t("admin.organization"),
        enableSorting: false,
        cell: (i) => i.getValue() ?? "—",
      }),
      col.accessor("isActive", {
        header: t("admin.status"),
        enableSorting: false,
        cell: (i) =>
          i.getValue() ? t("admin.active") : <span className="text-danger">{t("admin.inactive")}</span>,
      }),
      col.accessor("lastLoginAt", {
        header: t("admin.lastSignIn"),
        cell: (i) => (i.getValue() ? formatDate(i.getValue(), i18n.language) : "—"),
      }),
      col.display({
        id: "edit",
        header: "",
        cell: (i) => (
          <Button variant="ghost" size="sm" onClick={() => setEditing(i.row.original)}>
            {t("admin.edit")}
          </Button>
        ),
      }),
    ],
    [t, i18n.language],
  );

  return (
    <>
      <PageHeader
        title={t("admin.users")}
        breadcrumbs={[{ label: t("nav.admin") }, { label: t("admin.users") }]}
      />
      <AdminTabs />
      <DataTable
        caption={t("admin.users")}
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
        emptyMessage={t("admin.noUsers")}
        toolbar={
          <form
            role="search"
            className="relative w-full sm:w-72"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: search.trim() });
            }}
          >
            <label htmlFor="users-search" className="sr-only">
              {t("admin.searchUsers")}
            </label>
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-500"
            />
            <Input
              id="users-search"
              type="search"
              className="ps-9"
              placeholder={t("admin.searchUsers")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        }
      />
      {editing ? <EditUserModal user={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}
