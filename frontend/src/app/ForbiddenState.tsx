import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/feedback";
import { buttonVariants } from "@/components/ui";

export function ForbiddenState() {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={Lock}
      message={t("errors.forbidden")}
      action={
        <Link to="/" className={buttonVariants({ variant: "secondary" })}>
          {t("errors.goToDashboard")}
        </Link>
      }
    />
  );
}
