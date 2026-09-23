import { useTranslation } from "react-i18next";
import { ScaffoldPage } from "@/components/layout";
import { AdminTabs } from "../components/AdminTabs";

export default function AdminPoliciesPage() {
  const { t } = useTranslation();
  return (
    <ScaffoldPage
      title={t("admin.policies")}
      breadcrumbs={[{ label: t("nav.admin") }, { label: t("admin.policies") }]}
      section="7"
      todo={[
        "Warranty policies per SKU / family (useWarrantyPolicies)",
        "Create / edit policy (policySchema): base months, extension on registration [CONFIRM], coverage, exclusions",
        "Effective-from dating so old registrations keep their terms",
      ]}
    >
      <AdminTabs />
    </ScaffoldPage>
  );
}
