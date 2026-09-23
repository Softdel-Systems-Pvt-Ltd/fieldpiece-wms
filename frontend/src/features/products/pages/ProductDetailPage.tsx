import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ErrorState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import { Card, MonoId, ProductImage } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/session";
import { ProductPhotoEditor } from "../components/ProductPhotoEditor";
import { useProduct } from "../hooks";

// TODO: admin-only edit form for name/pattern/launch (PATCH /products/{sku}); policy detail for staff.

export default function ProductDetailPage() {
  const { sku } = useParams<{ sku: string }>();
  const { t, i18n } = useTranslation();
  const query = useProduct(sku);
  const canEdit = can(useCurrentRole(), "products:edit");

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
        <div className="flex w-full flex-col gap-3 sm:w-64">
          <ProductImage src={p.imageUrl} alt={p.name} size="fill" />
          {canEdit ? <ProductPhotoEditor product={p} /> : null}
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
