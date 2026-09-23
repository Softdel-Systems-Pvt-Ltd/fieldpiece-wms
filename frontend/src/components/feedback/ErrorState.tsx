import { AlertTriangle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toApiError } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { Button } from "../ui/Button";

interface ErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, message, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation();
  const text = message ?? (error ? toApiError(error).message : t("errors.loadFailed"));
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}
    >
      <AlertTriangle size={24} strokeWidth={1.75} className="mb-3 text-danger" aria-hidden />
      <p className="max-w-md text-body">{text}</p>
      {onRetry ? (
        <Button variant="secondary" icon={RotateCcw} className="mt-4" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      ) : null}
    </div>
  );
}
