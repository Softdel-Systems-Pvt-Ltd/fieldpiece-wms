import { ClipboardList, ShieldCheck, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ErrorState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import {
  buttonVariants,
  ClaimStatusBadge,
  KpiTile,
  MonoId,
  RmaStatusBadge,
  WarrantyStatusBadge,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";
import type { ClaimSummary, Registration, Rma, Role } from "@/types";
import { ClaimsByStatusChart } from "../components/ClaimsByStatusChart";
import { WorkList } from "../components/WorkList";
import {
  useDashboardClaims,
  useDashboardRegistrations,
  useDashboardRmas,
  useDashboardSummary,
} from "../hooks";
import type { ClaimsSummary } from "../types";

// Section 8.2: role-specific dashboard.

const OPEN = "SUBMITTED,IN_REVIEW,NEEDS_INFO,APPROVED,RMA_ISSUED,IN_TRANSIT,RECEIVED";

const is = (role: Role | undefined, ...roles: Role[]) => !!role && (role === "admin" || roles.includes(role));

/** Percent change vs the previous period, or undefined when there's no baseline. */
function change({ current, previous }: { current: number; previous: number }): number | undefined {
  return previous ? ((current - previous) / previous) * 100 : undefined;
}

function Kpis({ summary, role }: { summary: ClaimsSummary; role: Role }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {is(role, "distributor") ? (
        <KpiTile
          label={t("dashboard.registrationsThisPeriod")}
          value={summary.registrations.current}
          change={change(summary.registrations)}
        />
      ) : null}
      <KpiTile label={t("dashboard.openClaims")} value={summary.openClaims} />
      <KpiTile
        label={t("dashboard.claimsSubmitted")}
        value={summary.claimsSubmitted.current}
        change={change(summary.claimsSubmitted)}
        invertChange
      />
      <KpiTile label={t("dashboard.avgResolutionDays")} value={summary.avgResolutionDays ?? "—"} />
      {is(role, "claims_agent") ? (
        <>
          <KpiTile
            label={t("dashboard.slaBreached")}
            value={summary.slaBreached}
            tone={summary.slaBreached ? "danger" : "default"}
          />
          <KpiTile label={t("dashboard.unassigned")} value={summary.unassigned} />
        </>
      ) : null}
    </div>
  );
}

function ClaimRow({ claim }: { claim: ClaimSummary }) {
  const { i18n } = useTranslation();
  return (
    <>
      <Link to={`/claims/${claim.id}`} className="hover:underline">
        <MonoId>{claim.displayNo}</MonoId>
      </Link>
      <span className="text-sm text-text-muted">
        {claim.productName} · {formatDate(claim.updatedAt, i18n.language)}
      </span>
      <ClaimStatusBadge status={claim.status} />
    </>
  );
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const role = user?.role;
  const staffOrDistributor = is(role, "claims_agent", "distributor");
  const isTechnician = role === "technician";
  const isService = is(role, "service_center");

  const summary = useDashboardSummary(staffOrDistributor);
  const queue = useDashboardClaims(
    { assignedTo: "me", status: "SUBMITTED,IN_REVIEW,NEEDS_INFO", sort: "slaDueAt", pageSize: 6 },
    is(role, "claims_agent"),
  );
  const unassigned = useDashboardClaims(
    { assignedTo: "unassigned", status: "SUBMITTED", sort: "slaDueAt", pageSize: 6 },
    is(role, "claims_agent"),
  );
  const recent = useDashboardClaims(
    { sort: "-updatedAt", pageSize: 6, status: OPEN },
    isTechnician || role === "distributor",
  );
  const products = useDashboardRegistrations({ sort: "-createdAt", pageSize: 6 }, isTechnician);
  const expiring = useDashboardRegistrations(
    { status: "EXPIRING_SOON", sort: "warrantyEnd", pageSize: 6 },
    role === "distributor",
  );
  const toReceive = useDashboardRmas(
    { status: "ISSUED,IN_TRANSIT", sort: "-updatedAt", pageSize: 6 },
    isService,
  );
  const inService = useDashboardRmas(
    { status: "RECEIVED,INSPECTED", sort: "-updatedAt", pageSize: 6 },
    isService,
  );

  const registrationRow = (r: Registration) => (
    <>
      <span>
        {r.productName} · <MonoId>{r.serialNumber}</MonoId>
      </span>
      <span className="text-sm text-text-muted">{formatDate(r.warrantyEnd, i18n.language)}</span>
      <WarrantyStatusBadge status={r.status} />
    </>
  );
  const rmaRow = (r: Rma) => (
    <>
      <Link to={`/rma/${r.id}`} className="hover:underline">
        <MonoId>{r.displayNo}</MonoId>
      </Link>
      <span className="text-sm text-text-muted">{r.productName}</span>
      <RmaStatusBadge status={r.status} />
    </>
  );

  return (
    <>
      <PageHeader
        title={t("dashboard.greeting", { name: user?.name ?? "" })}
        actions={
          isTechnician || role === "distributor" ? (
            <Link to="/registrations/new" className={buttonVariants()}>
              <ShieldCheck size={20} strokeWidth={1.75} aria-hidden />
              {t("registrations.new")}
            </Link>
          ) : null
        }
      />

      <div className="space-y-6">
        {staffOrDistributor && role ? (
          summary.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : summary.error ? (
            <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
          ) : summary.data ? (
            <Kpis summary={summary.data} role={role} />
          ) : null
        ) : null}

        {is(role, "claims_agent") ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <WorkList
              title={t("dashboard.myQueue")}
              viewAllTo="/claims?assignedTo=me"
              query={queue}
              emptyIcon={ClipboardList}
              emptyMessage={t("dashboard.queueEmpty")}
              getKey={(c) => c.id}
              renderItem={(c) => <ClaimRow claim={c} />}
            />
            <WorkList
              title={t("dashboard.unassigned")}
              viewAllTo="/claims?assignedTo=unassigned"
              query={unassigned}
              emptyIcon={ClipboardList}
              emptyMessage={t("dashboard.unassignedEmpty")}
              getKey={(c) => c.id}
              renderItem={(c) => <ClaimRow claim={c} />}
            />
          </div>
        ) : null}

        {is(role, "claims_agent") && summary.data ? (
          <ClaimsByStatusChart data={summary.data.byStatus} />
        ) : null}

        {isTechnician ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <WorkList
              title={t("dashboard.myProducts")}
              viewAllTo="/registrations"
              query={products}
              emptyIcon={ShieldCheck}
              emptyMessage={t("registrations.empty")}
              getKey={(r) => r.id}
              renderItem={registrationRow}
            />
            <WorkList
              title={t("dashboard.openClaims")}
              viewAllTo="/claims"
              query={recent}
              emptyIcon={ClipboardList}
              emptyMessage={t("dashboard.noOpenClaims")}
              getKey={(c) => c.id}
              renderItem={(c) => <ClaimRow claim={c} />}
            />
          </div>
        ) : null}

        {role === "distributor" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <WorkList
              title={t("dashboard.expiringWarranties")}
              viewAllTo="/registrations?status=EXPIRING_SOON"
              query={expiring}
              emptyIcon={ShieldCheck}
              emptyMessage={t("dashboard.noneExpiring")}
              getKey={(r) => r.id}
              renderItem={registrationRow}
            />
            <WorkList
              title={t("dashboard.recentClaims")}
              viewAllTo="/claims"
              query={recent}
              emptyIcon={ClipboardList}
              emptyMessage={t("dashboard.noOpenClaims")}
              getKey={(c) => c.id}
              renderItem={(c) => <ClaimRow claim={c} />}
            />
          </div>
        ) : null}

        {isService ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <WorkList
              title={t("dashboard.rmasToReceive")}
              viewAllTo="/rma?status=ISSUED,IN_TRANSIT"
              query={toReceive}
              emptyIcon={Truck}
              emptyMessage={t("dashboard.nothingToReceive")}
              getKey={(r) => r.id}
              renderItem={rmaRow}
            />
            <WorkList
              title={t("dashboard.inService")}
              viewAllTo="/rma?status=RECEIVED,INSPECTED"
              query={inService}
              emptyIcon={Truck}
              emptyMessage={t("dashboard.nothingInService")}
              getKey={(r) => r.id}
              renderItem={rmaRow}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
