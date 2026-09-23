import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Inbox } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "../feedback/EmptyState";
import { ErrorState } from "../feedback/ErrorState";
import { Skeleton } from "../feedback/Skeleton";
import { Pagination } from "./Pagination";

// Section 5.4. Sorting, filtering and pagination all happen on the server;
// this component only renders and reports changes. Below md each row becomes a card.
// Screens normally spread `useServerTable().bind(query)` into it rather than wiring each prop.

// Heterogeneous column arrays need `any` for TValue: TanStack's documented pattern
// (each column has its own value type; `unknown` breaks assignability).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<T> = ColumnDef<T, any>;

export interface DataTableProps<T> {
  columns: AnyColumnDef<T>[];
  data: T[] | undefined;
  total: number;
  page: number;
  pageSize: number;
  /** "field" or "-field". */
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
  onPageChange: (page: number) => void;
  /** Shows the page-size picker. */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizes?: readonly number[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  /** A later page is loading; the current rows stay visible but dimmed. */
  isFetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyMessage: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;
  toolbar?: ReactNode;
  /** Enables row selection for bulk actions. */
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  caption: string;
}

function toSortingState(sort?: string): SortingState {
  if (!sort) return [];
  return [{ id: sort.replace(/^-/, ""), desc: sort.startsWith("-") }];
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  pageSize,
  sort,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  pageSizes,
  getRowId,
  isLoading,
  isFetching,
  error,
  onRetry,
  emptyMessage,
  emptyIcon = Inbox,
  emptyAction,
  toolbar,
  selectable,
  onSelectionChange,
  caption,
}: DataTableProps<T>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const sorting = useMemo(() => toSortingState(sort), [sort]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const refreshing = !!isFetching && !isLoading;

  const selectionColumn: AnyColumnDef<T> = {
    id: "__select",
    enableSorting: false,
    header: ({ table }) => (
      <input
        type="checkbox"
        className="h-4 w-4 rounded-sm border-ink-400 text-ink-1000 focus:ring-ink-1000"
        aria-label="Select all rows"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className="h-4 w-4 rounded-sm border-ink-400 text-ink-1000 focus:ring-ink-1000"
        aria-label="Select row"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  };

  const table = useReactTable({
    data: data ?? [],
    columns: selectable ? [selectionColumn, ...columns] : columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    pageCount,
    enableRowSelection: selectable,
    state: { sorting, rowSelection },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      onSelectionChange?.(Object.keys(next).filter((id) => next[id]));
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      onSortChange?.(first ? `${first.desc ? "-" : ""}${first.id}` : undefined);
    },
  });

  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="rounded-lg bg-surface shadow-card">
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">{toolbar}</div>
      ) : null}

      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : !isLoading && rows.length === 0 ? (
        <EmptyState icon={emptyIcon} message={emptyMessage} action={emptyAction} />
      ) : (
        <div
          aria-busy={refreshing || undefined}
          className={cn("transition-opacity", refreshing && "opacity-60")}
        >
          {/* Desktop / tablet table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-start">
              <caption className="sr-only">{caption}</caption>
              <thead className="bg-ink-50">
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => {
                      const sortable = header.column.getCanSort() && !!onSortChange;
                      const dir = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined}
                          className="text-overline h-10 px-4 text-start text-ink-600"
                        >
                          {header.isPlaceholder ? null : sortable ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 uppercase hover:text-ink-1000"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {dir === "asc" ? <ArrowUp size={12} aria-hidden /> : null}
                              {dir === "desc" ? <ArrowDown size={12} aria-hidden /> : null}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }, (_, i) => (
                      <tr key={i} className="h-12 border-t border-ink-100">
                        <td colSpan={visibleColumnCount} className="px-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      </tr>
                    ))
                  : rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "h-12 border-t border-ink-100 hover:bg-brand-50",
                          row.getIsSelected() && "bg-brand-50",
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-ink-100 md:hidden">
            {isLoading
              ? Array.from({ length: 8 }, (_, i) => (
                  <li key={i} className="p-4">
                    <Skeleton className="mb-2 h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </li>
                ))
              : rows.map((row) => (
                  <li key={row.id} className="space-y-1 p-4">
                    {row.getVisibleCells().map((cell) => {
                      const header = cell.column.columnDef.header;
                      return (
                        <div key={cell.id} className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-overline text-text-muted">
                            {typeof header === "string" ? header : null}
                          </span>
                          <span className="text-end">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </span>
                        </div>
                      );
                    })}
                  </li>
                ))}
          </ul>
        </div>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizes={pageSizes}
        isLoading={isLoading}
      />
    </div>
  );
}
