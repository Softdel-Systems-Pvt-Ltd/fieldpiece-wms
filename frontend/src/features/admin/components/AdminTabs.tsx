import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

const tabs = [
  { to: "/admin/users", key: "admin.users" },
  { to: "/admin/policies", key: "admin.policies" },
  { to: "/admin/settings", key: "admin.settings" },
];

export function AdminTabs() {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("nav.admin")} className="mb-6 flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            cn(
              "-mb-px flex h-11 items-center border-b-4 px-4 text-body",
              isActive ? "border-brand-500 font-bold" : "border-transparent text-text-muted hover:text-text",
            )
          }
        >
          {t(tab.key)}
        </NavLink>
      ))}
    </nav>
  );
}
