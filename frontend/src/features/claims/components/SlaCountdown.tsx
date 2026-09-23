import { differenceInHours, formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

// Section 8.5: turns warning within 24h and danger when overdue.

export function SlaCountdown({ dueAt, className }: { dueAt?: string; className?: string }) {
  const { t } = useTranslation();
  if (!dueAt) return null;
  const due = parseISO(dueAt);
  const overdue = isPast(due);
  const soon = !overdue && differenceInHours(due, new Date()) < 24;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm",
        overdue ? "font-semibold text-danger" : soon ? "font-semibold text-warning" : "text-text-muted",
        className,
      )}
    >
      <Clock size={16} strokeWidth={1.75} aria-hidden />
      {overdue
        ? t("claims.slaOverdue")
        : t("claims.slaDue", { time: formatDistanceToNowStrict(due, { addSuffix: true }) })}
    </span>
  );
}
