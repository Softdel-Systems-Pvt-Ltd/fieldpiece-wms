import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui";
import { useProducts } from "../hooks";

export default function ProductsPage() {
  const { t } = useTranslation();
  const query = useProducts();

  return (
    <>
      <PageHeader
        title={t("products.title")}
        breadcrumbs={[{ label: t("nav.dashboard"), to: "/" }, { label: t("products.title") }]}
      />
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : !query.data?.items.length ? (
        <EmptyState icon={Package} message={t("common.comingSoon")} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.items.map((p) => (
            <li key={p.sku}>
              <Link to={`/products/${p.sku}`} className="block rounded-lg hover:ring-2 hover:ring-ink-1000">
                <Card as="article" className="flex gap-4">
                  {/* Square frame with ink-50 background (Section 3.5) */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded bg-ink-50">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <Package size={24} strokeWidth={1.75} className="text-ink-400" aria-hidden />
                    )}
                  </div>
                  <div>
                    <h2 className="text-h3">{p.name}</h2>
                    <p className="font-mono text-sm">{p.sku}</p>
                    <p className="mt-1 text-sm text-text-muted">
                      {p.warrantyMonths ? t("products.months", { count: p.warrantyMonths }) : "—"}
                    </p>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
