import { Truck, UserCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import {
  Button,
  Card,
  ClaimStatusBadge,
  MonoId,
  RmaStatusBadge,
  Tabs,
  WarrantyStatusBadge,
} from "@/components/ui";
import { toApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/session";
import type { Claim } from "@/types";
import { AttachmentList } from "../components/AttachmentList";
import { ClaimActions } from "../components/ClaimActions";
import { ClaimTimeline } from "../components/ClaimTimeline";
import { SlaCountdown } from "../components/SlaCountdown";
import { useAssignClaim, useClaim, useClaims, useFailureCategories } from "../hooks";
import { isOpen } from "../transitions";

// Section 8.5: header, 2/3 tabs, 1/3 summary cards.

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-overline text-text-muted">{label}</dt>
      <dd className="mt-1 text-body">{children}</dd>
    </div>
  );
}

function PastClaims({ claim }: { claim: Claim }) {
  const { t, i18n } = useTranslation();
  const past = useClaims({ registrationId: claim.registrationId, pageSize: 10, sort: "-createdAt" });
  const others = (past.data?.items ?? []).filter((c) => c.id !== claim.id);
  return (
    <Card title={t("claims.pastClaims")}>
      {past.isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : others.length ? (
        <ul className="space-y-2">
          {others.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <Link to={`/claims/${c.id}`} className="hover:underline">
                <MonoId>{c.displayNo}</MonoId>
              </Link>
              <span className="text-sm text-text-muted">{formatDate(c.createdAt, i18n.language)}</span>
              <ClaimStatusBadge status={c.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">{t("claims.noPastClaims")}</p>
      )}
    </Card>
  );
}

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const query = useClaim(id);
  const categories = useFailureCategories();
  const assign = useAssignClaim(id ?? "");

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
    return <ErrorState error={query.error} onRetry={notFound ? undefined : () => void query.refetch()} />;
  }

  const claim = query.data;
  const category =
    categories.data?.find((c) => c.code === claim.failureCategory)?.label ?? claim.failureCategory;
  const canAssignSelf =
    can(user?.role, "claims:review") && isOpen(claim.status) && claim.assignee?.id !== user?.id;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: t("nav.claims"), to: "/claims" }, { label: claim.displayNo }]}
        title={<MonoId className="text-h1">{claim.displayNo}</MonoId>}
        meta={
          <>
            <ClaimStatusBadge status={claim.status} />
            {!claim.inWarranty ? (
              <span className="text-sm font-semibold text-warning">{t("claims.outOfWarranty")}</span>
            ) : null}
            <SlaCountdown dueAt={claim.slaDueAt ?? undefined} />
            <span className="text-sm text-text-muted">
              {t("claims.assignee")}: {claim.assignee?.name ?? t("claims.unassignedLabel")}
            </span>
          </>
        }
        actions={
          <>
            {canAssignSelf ? (
              <Button
                variant="ghost"
                icon={UserCheck}
                loading={assign.isPending}
                onClick={() => assign.mutate({ version: claim.version, assigneeId: user?.id ?? null })}
              >
                {t("claims.assignToMe")}
              </Button>
            ) : null}
            <ClaimActions claim={claim} />
          </>
        }
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
                    <Field label={t("claims.product")}>
                      {claim.productName} ({claim.sku})
                    </Field>
                    <Field label={t("claims.columns.category")}>{category}</Field>
                    <Field label={t("claims.failureDate")}>
                      {formatDate(claim.failureDate, i18n.language)}
                    </Field>
                    <Field label={t("claims.preferredResolution")}>
                      {claim.preferredResolution ? t(`claims.resolutions.${claim.preferredResolution}`) : "—"}
                    </Field>
                    {claim.rejectionReason ? (
                      <Field label={t("claims.rejectReason")}>
                        {t(`claims.rejectionReasons.${claim.rejectionReason}`)}
                      </Field>
                    ) : null}
                    <div className="sm:col-span-2">
                      <Field label={t("claims.description")}>
                        <span className="whitespace-pre-line">{claim.description}</span>
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label={t("claims.attachments")}>
                        <AttachmentList attachments={claim.attachments} />
                      </Field>
                    </div>
                  </dl>
                ),
              },
              {
                value: "timeline",
                label: t("claims.tabs.timeline"),
                content: <ClaimTimeline claimId={claim.id} />,
              },
              {
                value: "rma",
                label: t("claims.tabs.rma"),
                content: claim.rma ? (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <Link to={`/rma/${claim.rma.id}`} className="hover:underline">
                        <MonoId className="text-h3">{claim.rma.displayNo}</MonoId>
                      </Link>
                      <p className="text-sm text-text-muted">{t(`claims.resolutions.${claim.rma.type}`)}</p>
                    </div>
                    <RmaStatusBadge status={claim.rma.status} />
                  </div>
                ) : (
                  <EmptyState icon={Truck} message={t("claims.noRma")} className="py-6" />
                ),
              },
            ]}
          />
        </Card>

        <div className="space-y-6">
          <Card title={t("claims.warranty")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <WarrantyStatusBadge status={claim.warranty.status} />
              <span className="text-sm">
                {t("claims.coveredUntil", { date: formatDate(claim.warranty.warrantyEnd, i18n.language) })}
              </span>
            </div>
          </Card>
          <Card title={t("claims.customer")}>
            <p className="text-body font-semibold">{claim.customerName}</p>
            <p className="text-sm text-text-muted">
              {t("claims.filedBy", {
                name: claim.createdBy.name,
                date: formatDate(claim.createdAt, i18n.language),
              })}
            </p>
          </Card>
          <PastClaims claim={claim} />
        </div>
      </div>
    </>
  );
}
