import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback";
import { Card } from "@/components/ui";

// A compact dashboard list (queue, RMAs to receive, my products) with loading / empty / error states.

interface WorkListProps<T> {
  title: string;
  viewAllTo: string;
  query: { data?: { items: T[]; total: number }; isLoading: boolean; error: unknown; refetch: () => unknown };
  emptyIcon: LucideIcon;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
}

export function WorkList<T>({
  title,
  viewAllTo,
  query,
  emptyIcon,
  emptyMessage,
  renderItem,
  getKey,
}: WorkListProps<T>) {
  const { t } = useTranslation();
  return (
    <Card
      title={query.data ? `${title} (${query.data.total})` : title}
      actions={
        <Link to={viewAllTo} className="text-sm text-info underline underline-offset-2">
          {t("common.viewAll")}
        </Link>
      }
    >
      {query.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} className="py-6" />
      ) : query.data?.items.length ? (
        <ul className="divide-y divide-ink-100">
          {query.data.items.map((item) => (
            <li
              key={getKey(item)}
              className="flex min-h-12 flex-wrap items-center justify-between gap-2 py-2"
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={emptyIcon} message={emptyMessage} className="py-6" />
      )}
    </Card>
  );
}
