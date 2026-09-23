import { Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ErrorState, Skeleton } from "@/components/feedback";
import { ScaffoldPage } from "@/components/layout";
import { Button, MonoId, RmaStatusBadge } from "@/components/ui";
import { useRma } from "../hooks";

export default function RmaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const query = useRma(id);

  if (query.isLoading) return <Skeleton className="h-64 w-full" />;
  if (query.error || !query.data)
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  return (
    <ScaffoldPage
      title={t("rma.detailTitle", { id: query.data.id })}
      breadcrumbs={[{ label: t("rma.title"), to: "/rma" }, { label: query.data.id }]}
      actions={
        <Button variant="secondary" icon={Printer} onClick={() => window.print()} className="no-print">
          {t("rma.print")}
        </Button>
      }
      section="8.6"
      todo={[
        "Printable RMA label / packing slip (print stylesheet, black logo on white)",
        "Inbound / outbound tracking inputs with carrier auto-detection",
        "Service-center inspection form: findings, root cause, parts used, outcome (inspectionSchema)",
        "Replacement serial creates a new registration carrying remaining warranty [CONFIRM rule]",
      ]}
    >
      <div className="mb-6 flex items-center gap-3">
        <RmaStatusBadge status={query.data.status} />
        <span className="text-sm text-text-muted">
          {t("claims.columns.id")}: <MonoId>{query.data.claimId}</MonoId>
        </span>
      </div>
    </ScaffoldPage>
  );
}
