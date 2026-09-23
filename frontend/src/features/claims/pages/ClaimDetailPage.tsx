import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Truck } from "lucide-react";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import { Card, ClaimStatusBadge, MonoId, Tabs } from "@/components/ui";
import { toApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { ClaimActions } from "../components/ClaimActions";
import { ClaimTimeline } from "../components/ClaimTimeline";
import { SlaCountdown } from "../components/SlaCountdown";
import { useClaim } from "../hooks";

// Section 8.5 layout: header, 2/3 tabs, 1/3 summary cards.

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-overline text-text-muted">{label}</dt>
      <dd className="mt-1 text-body">{children}</dd>
    </div>
  );
}

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const query = useClaim(id);

  if (query.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (query.error || !query.data) {
    const notFound = toApiError(query.error).status === 404;
    return (
      <ErrorState
        message={notFound ? toApiError(query.error).message : undefined}
        error={query.error}
        onRetry={notFound ? undefined : () => void query.refetch()}
      />
    );
  }

  const claim = query.data;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: t("nav.claims"), to: "/claims" }, { label: claim.id }]}
        title={<MonoId className="text-h1">{claim.id}</MonoId>}
        meta={
          <>
            <ClaimStatusBadge status={claim.status} />
            <SlaCountdown dueAt={claim.slaDueAt} />
            <span className="text-sm text-text-muted">
              {t("claims.assignee")}: {claim.assignedTo ?? t("claims.unassignedLabel")}
            </span>
          </>
        }
        actions={<ClaimActions claim={claim} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Tabs
            label={t("claims.title")}
            items={[
              {
                value: "overview",
                label: t("claims.tabs.overview"),
                content: (
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("fields.serialNumber")}>
                      <MonoId>{claim.serialNumber}</MonoId>
                    </Field>
                    <Field label="SKU">{claim.sku}</Field>
                    <Field label={t("claims.columns.category")}>
                      {t(`claims.failure.${claim.failureCategory}`)}
                    </Field>
                    <Field label="Failure date">{formatDate(claim.failureDate, i18n.language)}</Field>
                    <div className="sm:col-span-2">
                      <Field label="Description">{claim.description}</Field>
                    </div>
                    {/* TODO: attachments gallery with lightbox (Section 8.5) */}
                  </dl>
                ),
              },
              {
                value: "timeline",
                label: t("claims.tabs.timeline"),
                content: <ClaimTimeline claim={claim} />,
              },
              {
                value: "rma",
                label: t("claims.tabs.rma"),
                // TODO: show the linked RMA once GET /claims/:id includes rmaId.
                content: <EmptyState icon={Truck} message={t("common.comingSoon")} />,
              },
            ]}
          />
        </Card>

        <div className="space-y-6">
          {/* TODO: warranty summary, customer card and past claims for this serial (Section 8.5) */}
          <Card title="Warranty">
            <p className="text-sm text-text-muted">{t("common.comingSoon")}</p>
          </Card>
          <Card title={t("nav.customers")}>
            <p className="text-sm text-text-muted">{t("common.comingSoon")}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
