import { useTranslation } from "react-i18next";
import { ScaffoldPage } from "@/components/layout";
import { AdminTabs } from "../components/AdminTabs";

export default function AdminUsersPage() {
  const { t } = useTranslation();
  return (
    <ScaffoldPage
      title={t("admin.users")}
      breadcrumbs={[{ label: t("nav.admin") }, { label: t("admin.users") }]}
      section="1.1"
      todo={["Users table (useAdminUsers)", "Invite user, change role, deactivate", "Audit of role changes"]}
    >
      <AdminTabs />
    </ScaffoldPage>
  );
}
