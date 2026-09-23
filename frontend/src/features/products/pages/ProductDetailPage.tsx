import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ErrorState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import { Card, MonoId } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useProduct } from "../hooks";

// TODO: admin-only edit form (PATCH /products/{sku}); warranty terms detail from /policies for staff.

export default function ProductDetailPage() {
  const { sku } = useParams<{ sku: string }>();
  const { t, i18n } = useTranslation();
  const query = useProduct(sku);

  if (query.isLoading) return <Skeleton className="h-64 w-full" />;
  if (query.error || !query.data)
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const p = query.data;

  return (
    <>
      <PageHeader
        title={p.name}
        breadcrumbs={[{ label: t("products.title"), to: "/products" }, { label: p.sku }]}
      />
      <Card className="flex flex-col gap-6 sm:flex-row">
        <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded bg-ink-50">
          {p.imageUrl ? (
            <img src={p.imageUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <Package size={24} strokeWidth={1.75} className="text-ink-400" aria-hidden />
          )}
        </div>
        <dl className="grid flex-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-overline text-text-muted">SKU</dt>
            <dd>
              <MonoId>{p.sku}</MonoId>
            </dd>
          </div>
          <div>
            <dt className="text-overline text-text-muted">{t("products.family")}</dt>
            <dd>{t(`products.families.${p.family}`)}</dd>
          </div>
          <div>
            <dt className="text-overline text-text-muted">{t("products.warranty")}</dt>
            <dd>
              {p.warrantyMonths ? t("products.months", { count: p.warrantyMonths }) : "—"}
              {p.registrationBonusMonths
                ? ` ${t("products.bonus", { count: p.registrationBonusMonths })}`
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-overline text-text-muted">{t("products.launched")}</dt>
            <dd>{p.launchDate ? formatDate(p.launchDate, i18n.language) : "—"}</dd>
          </div>
        </dl>
      </Card>
    </>
  );
}
