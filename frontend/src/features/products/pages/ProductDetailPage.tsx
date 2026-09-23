import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ErrorState, Skeleton } from "@/components/feedback";
import { ScaffoldPage } from "@/components/layout";
import { useProduct } from "../hooks";

export default function ProductDetailPage() {
  const { sku } = useParams<{ sku: string }>();
  const { t } = useTranslation();
  const query = useProduct(sku);

  if (query.isLoading) return <Skeleton className="h-64 w-full" />;
  if (query.error || !query.data)
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  return (
    <ScaffoldPage
      title={query.data.name}
      breadcrumbs={[{ label: t("products.title"), to: "/products" }, { label: query.data.sku }]}
      section="6.2"
      todo={[
        "Product image, family, launch date and serial format",
        "Warranty terms from WarrantyPolicy (coverage, exclusions)",
        "Admin-only edit form (productSchema); read-only for everyone else",
      ]}
    />
  );
}
