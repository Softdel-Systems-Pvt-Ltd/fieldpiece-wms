import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

// Section 5.5: overline label, big mono number, change vs previous period with arrow + colour.

interface KpiTileProps {
  label: string;
  value: number | string;
  /** Percent change vs the previous period, e.g. 12.5 or -3. */
  change?: number;
  /** When true, a rise is bad (e.g. SLA breaches) and is coloured danger. */
  invertChange?: boolean;
  sparkline?: number[];
  tone?: "default" | "danger";
  className?: string;
}

export function KpiTile({
  label,
  value,
  change,
  invertChange,
  sparkline,
  tone = "default",
  className,
}: KpiTileProps) {
  const { t, i18n } = useTranslation();
  const direction = change === undefined || change === 0 ? "flat" : change > 0 ? "up" : "down";
  const good = direction === "flat" ? null : (direction === "up") !== !!invertChange;
  const Arrow = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  return (
    <div className={cn("rounded-lg bg-surface p-6 shadow-card", className)}>
      <p className="text-overline text-text-muted">{label}</p>
      <p className={cn("mt-2 font-mono text-h1 tabular-nums", tone === "danger" && "text-danger")}>
        {typeof value === "number" ? formatNumber(value, i18n.language) : value}
      </p>
      <div className="mt-2 flex items-end justify-between gap-4">
        {change !== undefined ? (
          <p
            className={cn(
              "inline-flex items-center gap-1 text-sm",
              good === null ? "text-text-muted" : good ? "text-success" : "text-danger",
            )}
          >
            <Arrow size={16} strokeWidth={1.75} aria-hidden />
            <span>
              {formatNumber(Math.abs(change) / 100, i18n.language, {
                style: "percent",
                maximumFractionDigits: 1,
              })}{" "}
              <span className="text-text-muted">{t("dashboard.vsPrevious")}</span>
            </span>
          </p>
        ) : (
          <span />
        )}
        {sparkline && sparkline.length > 1 ? (
          <div className="h-8 w-24" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline.map((v, i) => ({ i, v }))}>
                <Line type="monotone" dataKey="v" stroke="var(--ink-900)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </div>
  );
}
