import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ErrorState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import { Card, MonoId, WarrantyStatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useCustomer, useCustomerRegistrations } from "../hooks";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const query = useCustomer(id);
  const registrations = useCustomerRegistrations(id);

  if (query.isLoading) return <Skeleton className="h-64 w-full" />;
  if (query.error || !query.data)
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const c = query.data;

  return (
    <>
      <PageHeader
        title={c.companyName ?? c.contactName}
        breadcrumbs={[
          { label: t("customers.title"), to: "/customers" },
          { label: c.companyName ?? c.contactName },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={t("customers.details")}>
          <dl className="space-y-3 text-body">
            <div>
              <dt className="text-overline text-text-muted">{t("customers.contact")}</dt>
              <dd>{c.contactName}</dd>
            </div>
            <div>
              <dt className="text-overline text-text-muted">{t("fields.email")}</dt>
              <dd>{c.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-overline text-text-muted">{t("registrations.phone")}</dt>
              <dd>{c.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-overline text-text-muted">{t("customers.address")}</dt>
              <dd>
                {[c.address.line1, c.address.city, c.address.region, c.address.postalCode, c.address.country]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </Card>
        <Card title={t("customers.products")} className="lg:col-span-2">
          {registrations.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : registrations.data?.items.length ? (
            <ul className="divide-y divide-ink-100">
              {registrations.data.items.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span>
                    {r.productName} · <MonoId>{r.serialNumber}</MonoId>
                  </span>
                  <span className="text-sm text-text-muted">
                    {t("claims.coveredUntil", { date: formatDate(r.warrantyEnd, i18n.language) })}
                  </span>
                  <WarrantyStatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">{t("registrations.empty")}</p>
          )}
        </Card>
      </div>
    </>
  );
}
