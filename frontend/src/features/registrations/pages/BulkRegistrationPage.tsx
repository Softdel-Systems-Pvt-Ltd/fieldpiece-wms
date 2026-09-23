import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScaffoldPage } from "@/components/layout";
import { Button } from "@/components/ui";

export default function BulkRegistrationPage() {
  const { t } = useTranslation();
  return (
    <ScaffoldPage
      title={t("registrations.bulkTitle")}
      breadcrumbs={[
        { label: t("registrations.title"), to: "/registrations" },
        { label: t("registrations.bulk") },
      ]}
      actions={
        <Button variant="secondary" icon={Download}>
          CSV template
        </Button>
      }
      section="8.3"
      todo={[
        "Download CSV template",
        "Upload CSV, parse client-side and validate each row with registrationSchema",
        "Preview table with a validation result per row",
        "Import valid rows (POST /registrations/bulk) and download an error report for the rest",
      ]}
    />
  );
}
