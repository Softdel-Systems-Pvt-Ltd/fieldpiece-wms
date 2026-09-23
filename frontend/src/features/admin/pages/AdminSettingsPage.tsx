import { useTranslation } from "react-i18next";
import { ScaffoldPage } from "@/components/layout";
import { AdminTabs } from "../components/AdminTabs";

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  return (
    <ScaffoldPage
      title={t("admin.settings")}
      breadcrumbs={[{ label: t("nav.admin") }, { label: t("admin.settings") }]}
      section="15"
      todo={[
        "Expiring-soon threshold (default 60 days)",
        "SLA targets for claim review and RMA turnaround [CONFIRM]",
        "Notification settings (email / SMS)",
      ]}
    >
      <AdminTabs />
    </ScaffoldPage>
  );
}
