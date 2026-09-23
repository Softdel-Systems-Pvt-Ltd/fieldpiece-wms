import { useTranslation } from "react-i18next";
import { ScaffoldPage } from "@/components/layout";

export default function ReportsPage() {
  const { t } = useTranslation();
  return (
    <ScaffoldPage
      title={t("reports.title")}
      breadcrumbs={[{ label: t("nav.dashboard"), to: "/" }, { label: t("reports.title") }]}
      section="8.7"
      todo={[
        "Filters: date range, SKU / family, region, distributor (reportFiltersSchema, kept in the URL)",
        "Claims over time (line), claim rate by SKU (sorted bar), failure categories (horizontal bar)",
        "Average resolution time trend, cost by resolution type",
        "Every chart: 'View data' table toggle and CSV export",
        "Chart colours: brand-500, ink-900, info, ink-300; axes ink-200; labels text-xs ink-500",
      ]}
    />
  );
}
