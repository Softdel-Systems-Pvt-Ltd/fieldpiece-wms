import { ClipboardList, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import { buttonVariants, Card, KpiTile } from "@/components/ui";
import { useCurrentUser } from "@/lib/session";
import type { Role } from "@/types";
import { ClaimsByStatusChart } from "../components/ClaimsByStatusChart";
import { useDashboardSummary } from "../hooks";

// Section 8.2: role-specific dashboard. Each role block is a starting point; fill in per the table.

const show = (role: Role | undefined, ...roles: Role[]) =>
  !!role && (role === "admin" || roles.includes(role));

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const role = user?.role;
  const summary = useDashboardSummary();

  const primaryAction =
    role === "technician" || role === "distributor" ? (
      <Link to="/registrations/new" className={buttonVariants()}>
        <ShieldCheck size={20} strokeWidth={1.75} aria-hidden />
        {t("registrations.new")}
      </Link>
    ) : null;

  return (
    <>
      <PageHeader title={t("dashboard.greeting", { name: user?.name ?? "" })} actions={primaryAction} />

      {summary.error ? <ErrorState error={summary.error} onRetry={() => void summary.refetch()} /> : null}

      {summary.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : summary.data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {show(role, "distributor") ? (
              <KpiTile
                label={t("dashboard.registrationsThisMonth")}
                value={summary.data.registrationsThisMonth.value}
                change={summary.data.registrationsThisMonth.change}
                sparkline={summary.data.registrationsThisMonth.sparkline}
              />
            ) : null}
            <KpiTile
              label={t("dashboard.openClaims")}
              value={summary.data.openClaims.value}
              change={summary.data.openClaims.change}
              invertChange
            />
            {show(role, "distributor", "claims_agent") ? (
              <KpiTile
                label={t("dashboard.avgResolutionDays")}
                value={summary.data.avgResolutionDays.value}
                change={summary.data.avgResolutionDays.change}
                invertChange
              />
            ) : null}
            {show(role, "claims_agent") ? (
              <>
                <KpiTile
                  label={t("dashboard.slaBreached")}
                  value={summary.data.slaBreached.value}
                  change={summary.data.slaBreached.change}
                  invertChange
                  tone="danger"
                />
                <KpiTile label={t("dashboard.unassigned")} value={summary.data.unassigned} />
              </>
            ) : null}
          </div>

          {show(role, "claims_agent") ? <ClaimsByStatusChart data={summary.data.claimsByStatus} /> : null}

          {role === "technician" ? (
            <Card title={t("dashboard.myProducts")}>
              {/* TODO: "My products" cards from GET /registrations?owner=me */}
              <EmptyState icon={ShieldCheck} message={t("registrations.empty")} />
            </Card>
          ) : null}

          {/* TODO per Section 8.2: agent queue sorted by SLA, service-center RMA lists,
              distributor expiring warranties, admin claim rate by SKU / cost / top failures. */}
          <Card
            title={t("dashboard.recentClaims")}
            actions={
              <Link to="/claims" className="text-sm text-info underline underline-offset-2">
                {t("common.viewAll")}
              </Link>
            }
          >
            <EmptyState icon={ClipboardList} message={t("common.comingSoon")} className="py-6" />
          </Card>
        </div>
      ) : null}
    </>
  );
}
