import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ErrorState, Skeleton } from "@/components/feedback";
import { ScaffoldPage } from "@/components/layout";
import { useCustomer } from "../hooks";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const query = useCustomer(id);

  if (query.isLoading) return <Skeleton className="h-64 w-full" />;
  if (query.error || !query.data)
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  return (
    <ScaffoldPage
      title={query.data.name}
      breadcrumbs={[{ label: t("customers.title"), to: "/customers" }, { label: query.data.name }]}
      section="6.2"
      todo={["Contact and address details", "Registered products with warranty status", "Claim history"]}
    />
  );
}
