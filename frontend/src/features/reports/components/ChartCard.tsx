import { Download } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback";
import { Button, Card } from "@/components/ui";
import { BarChart3 } from "lucide-react";
import { toCsv } from "../schemas";

// Every chart has a "View data" table alternative and CSV export (Sections 8.7 and 10).

interface ChartCardProps<T extends object> {
  title: string;
  fileName: string;
  query: { data?: T[]; isLoading: boolean; error: unknown; refetch: () => unknown };
  columns: { key: keyof T & string; label: string; format?: (value: unknown) => string }[];
  children: (rows: T[]) => ReactNode;
  className?: string;
}

export function ChartCard<T extends object>({
  title,
  fileName,
  query,
  columns,
  children,
  className,
}: ChartCardProps<T>) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);
  const rows = query.data ?? [];

  const exportCsv = () => {
    const csv = toCsv(rows.map((r) => Object.fromEntries(columns.map((c) => [c.label, r[c.key]]))));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: `${fileName}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title={title}
      className={className}
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={showTable}
            onClick={() => setShowTable((v) => !v)}
            disabled={!rows.length}
          >
            {showTable ? t("dashboard.viewChart") : t("dashboard.viewData")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Download}
            onClick={exportCsv}
            disabled={!rows.length}
            aria-label={`${t("common.exportCsv")}: ${title}`}
          >
            CSV
          </Button>
        </>
      }
    >
      {query.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} className="py-6" />
      ) : !rows.length ? (
        <EmptyState icon={BarChart3} message={t("reports.noData")} className="py-10" />
      ) : showTable ? (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="text-overline text-ink-600">
                {columns.map((c) => (
                  <th key={c.key} scope="col" className="py-2 text-start">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-ink-100">
                  {columns.map((c) => (
                    <td key={c.key} className="py-2 font-mono">
                      {c.format ? c.format(r[c.key]) : String(r[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-72" role="img" aria-label={title}>
          {children(rows)}
        </div>
      )}
    </Card>
  );
}
