import { MapPinOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/feedback";
import { buttonVariants } from "@/components/ui";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={MapPinOff}
      title="404"
      message={t("errors.notFound")}
      action={
        <Link to="/" className={buttonVariants({ variant: "secondary" })}>
          {t("errors.goToDashboard")}
        </Link>
      }
    />
  );
}
