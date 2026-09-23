import { Printer } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { toast } from "@/components/feedback";
import { ErrorState, Skeleton } from "@/components/feedback";
import { Logo, PageHeader } from "@/components/layout";
import { Button, Card, MonoId, RmaStatusBadge } from "@/components/ui";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Address, Rma, RmaAction } from "@/types";
import { rmaApi } from "../api";
import { CancelModal, CompleteModal, InspectModal, ShipInboundModal } from "../components/RmaActionForms";
import { useRma, useRmaAction } from "../hooks";

// Section 8.6: printable label, tracking with carrier detection, service-center inspection, completion.
// Which actions show comes from the API's `allowedActions` for this user.

const ACTION_ORDER: RmaAction[] = ["cancel", "shipInbound", "receive", "inspect", "complete"];

function AddressBlock({ address }: { address: Partial<Address> | null }) {
  if (!address?.line1) return <p className="text-text-muted">—</p>;
  return (
    <address className="not-italic">
      {address.line1}
      <br />
      {address.line2 ? (
        <>
          {address.line2}
          <br />
        </>
      ) : null}
      {address.city}, {address.region} {address.postalCode}
      <br />
      {address.country}
    </address>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-overline text-text-muted">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

export default function RmaDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const query = useRma(id);
  const action = useRmaAction(id);
  const [open, setOpen] = useState<RmaAction | null>(null);

  if (query.isLoading) return <Skeleton className="h-64 w-full" />;
  if (query.error || !query.data)
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const rma: Rma = query.data;
  const allowed = ACTION_ORDER.filter((a) => rma.allowedActions?.includes(a));

  const run = (name: RmaAction, call: () => Promise<Rma>) =>
    action.mutate(
      { action: name, run: call },
      {
        onSuccess: () => {
          setOpen(null);
          toast.success(t(`rma.done.${name}`));
        },
      },
    );
  const pending = (name: RmaAction) => action.isPending && action.variables?.action === name;
  const modal = (name: RmaAction) => ({
    open: open === name,
    onOpenChange: (next: boolean) => setOpen(next ? name : null),
    pending: pending(name),
  });

  return (
    <>
      <div className="no-print">
        <PageHeader
          title={<MonoId className="text-h1">{rma.displayNo}</MonoId>}
          breadcrumbs={[{ label: t("rma.title"), to: "/rma" }, { label: rma.displayNo }]}
          meta={
            <>
              <RmaStatusBadge status={rma.status} />
              <span className="text-sm text-text-muted">{t(`claims.resolutions.${rma.type}`)}</span>
              <Link to={`/claims/${rma.claimId}`} className="text-sm text-info underline">
                {rma.claimDisplayNo}
              </Link>
            </>
          }
          actions={
            <>
              <Button variant="ghost" icon={Printer} onClick={() => window.print()}>
                {t("rma.print")}
              </Button>
              {allowed.map((name) => (
                <Button
                  key={name}
                  variant={
                    name === "cancel"
                      ? "danger"
                      : name === "complete" || name === "receive"
                        ? "primary"
                        : "secondary"
                  }
                  loading={pending(name)}
                  onClick={() =>
                    name === "receive"
                      ? run("receive", () => rmaApi.receive(rma.id, rma.version, {}))
                      : setOpen(name)
                  }
                >
                  {t(`rma.actions.${name}`)}
                </Button>
              ))}
            </>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* The label prints on its own: black logo on white (print stylesheet in globals.css). */}
        <Card className="lg:col-span-2 print:shadow-none" title={t("rma.label")}>
          <div className="space-y-4 rounded border-2 border-dashed border-ink-300 p-6 print:border-ink-1000">
            <div className="flex items-center justify-between gap-4">
              <Logo />
              <MonoId className="text-h2">{rma.displayNo}</MonoId>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Row label={t("rma.shipTo")}>
                <p className="font-semibold">{rma.serviceCenter?.name}</p>
                <AddressBlock address={rma.shipTo} />
              </Row>
              <Row label={t("rma.unit")}>
                <p>
                  {rma.productName} ({rma.sku})
                </p>
                <MonoId>{rma.serialNumber}</MonoId>
              </Row>
            </dl>
            <p className="text-sm">{t("rma.labelInstructions")}</p>
          </div>
        </Card>

        <div className="no-print space-y-6">
          <Card title={t("rma.shipping")}>
            <dl className="space-y-3">
              <Row label={t("rma.inbound")}>
                {rma.inboundTracking ? (
                  <>
                    <MonoId>{rma.inboundTracking}</MonoId>{" "}
                    {rma.inboundCarrier ? `· ${rma.inboundCarrier}` : ""}
                  </>
                ) : (
                  "—"
                )}
              </Row>
              <Row label={t("rma.outbound")}>
                {rma.outboundTracking ? (
                  <>
                    <MonoId>{rma.outboundTracking}</MonoId>{" "}
                    {rma.outboundCarrier ? `· ${rma.outboundCarrier}` : ""}
                  </>
                ) : (
                  "—"
                )}
              </Row>
              <Row label={t("rma.returnTo")}>
                <AddressBlock address={rma.returnAddress} />
              </Row>
            </dl>
          </Card>
          {rma.inspectionNotes || rma.completedAt ? (
            <Card title={t("rma.inspection")}>
              <dl className="space-y-3">
                {rma.inspectionNotes ? <Row label={t("rma.findings")}>{rma.inspectionNotes}</Row> : null}
                {rma.rootCause ? (
                  <Row label={t("rma.rootCause")}>{t(`rma.rootCauses.${rma.rootCause}`)}</Row>
                ) : null}
                {rma.partsUsed.length ? (
                  <Row label={t("rma.partsUsed")}>{rma.partsUsed.join(", ")}</Row>
                ) : null}
                {rma.replacementSerial ? (
                  <Row label={t("rma.replacementSerial")}>
                    <MonoId>{rma.replacementSerial}</MonoId>
                  </Row>
                ) : null}
                {rma.creditAmount ? (
                  <Row label={t("rma.creditAmount")}>
                    {formatMoney(Number(rma.creditAmount), rma.creditCurrency ?? "USD", i18n.language)}
                  </Row>
                ) : null}
                {rma.completedAt ? (
                  <Row label={t("rma.completedAt")}>{formatDateTime(rma.completedAt, i18n.language)}</Row>
                ) : null}
              </dl>
            </Card>
          ) : null}
        </div>
      </div>

      <ShipInboundModal
        {...modal("shipInbound")}
        onConfirm={(body) => run("shipInbound", () => rmaApi.shipInbound(rma.id, rma.version, body))}
      />
      <InspectModal
        {...modal("inspect")}
        onConfirm={(body) => run("inspect", () => rmaApi.inspect(rma.id, rma.version, body))}
      />
      <CompleteModal
        {...modal("complete")}
        rma={rma}
        onConfirm={(body) => run("complete", () => rmaApi.complete(rma.id, rma.version, body))}
      />
      <CancelModal
        {...modal("cancel")}
        onConfirm={(body) => run("cancel", () => rmaApi.cancel(rma.id, rma.version, body))}
      />
    </>
  );
}
