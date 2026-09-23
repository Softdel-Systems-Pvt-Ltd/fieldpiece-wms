import type { UseQueryResult } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { PageParams, Paginated } from "@/types";
import { TABLE_PAGE_SIZES } from "./pagination";
import { useTableParams } from "./use-table-params";

// One hook behind every server-paginated list (Section 5.4). Page, page size, sort, search and filters live
// in the URL; `request` goes to the API unchanged, and `bind(query)` returns everything DataTable (or a
// card grid's Pagination) needs. Screens only declare their columns and filters.
//
//   const list = useServerTable({ sort: "-updatedAt" });
//   const query = useClaims({ ...list.request, status: list.filters.status });
//   <DataTable {...list.bind(query)} columns={columns} ... />

export interface ServerTableOptions {
  sort?: string;
  pageSize?: number;
  /** Sizes offered in the picker; a URL asking for anything else falls back to `pageSize`. */
  pageSizes?: readonly number[];
}

/** The list state DataTable and Pagination render. Structural, so both can accept it as props. */
export interface ServerListBinding<T> {
  data: T[] | undefined;
  total: number;
  page: number;
  pageSize: number;
  pageSizes: readonly number[];
  sort?: string;
  onSortChange: (sort: string | undefined) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** First load only; later pages keep the previous rows on screen (keepPreviousData). */
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
}

export function useServerTable(options: ServerTableOptions = {}) {
  const pageSizes = options.pageSizes ?? TABLE_PAGE_SIZES;
  const [params, update] = useTableParams({
    sort: options.sort,
    pageSize: options.pageSize ?? pageSizes[1] ?? pageSizes[0],
    pageSizes,
  });

  const request = useMemo<Required<Pick<PageParams, "page" | "pageSize">> & PageParams>(
    () => ({ page: params.page, pageSize: params.pageSize, sort: params.sort, q: params.q }),
    [params.page, params.pageSize, params.sort, params.q],
  );

  const onSortChange = useCallback((sort: string | undefined) => update({ sort }), [update]);
  const onPageChange = useCallback((page: number) => update({ page }), [update]);
  const onPageSizeChange = useCallback((pageSize: number) => update({ pageSize }), [update]);

  const bind = useCallback(
    <T>(query: UseQueryResult<Paginated<T>>): ServerListBinding<T> => ({
      data: query.data?.items,
      total: query.data?.total ?? 0,
      page: params.page,
      pageSize: params.pageSize,
      pageSizes,
      sort: params.sort,
      onSortChange,
      onPageChange,
      onPageSizeChange,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      onRetry: () => void query.refetch(),
    }),
    [params.page, params.pageSize, params.sort, pageSizes, onSortChange, onPageChange, onPageSizeChange],
  );

  return { request, filters: params.filters, q: params.q, update, bind };
}
