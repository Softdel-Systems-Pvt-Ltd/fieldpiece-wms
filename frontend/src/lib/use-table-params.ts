import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MAX_PAGE_SIZE, parsePageSize } from "./pagination";

// Section 5.4: page, sort and filters live in the URL so views can be shared.

export interface TableParams {
  page: number;
  pageSize: number;
  sort?: string;
  q?: string;
  filters: Record<string, string>;
}

const RESERVED = new Set(["page", "pageSize", "sort", "q"]);

export interface TableParamDefaults {
  pageSize?: number;
  sort?: string;
  /** Page sizes the screen offers. Without it any size up to the API's cap is accepted. */
  pageSizes?: readonly number[];
}

export function useTableParams(defaults: TableParamDefaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo<TableParams>(() => {
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (!RESERVED.has(key) && value) filters[key] = value;
    });
    return {
      page: Math.max(1, Number(searchParams.get("page")) || 1),
      pageSize: defaults.pageSizes
        ? parsePageSize(searchParams.get("pageSize"), defaults.pageSizes, defaults.pageSize ?? 25)
        : Math.min(Number(searchParams.get("pageSize")) || defaults.pageSize || 25, MAX_PAGE_SIZE),
      sort: searchParams.get("sort") ?? defaults.sort,
      q: searchParams.get("q") ?? undefined,
      filters,
    };
  }, [searchParams, defaults.pageSize, defaults.sort, defaults.pageSizes]);

  /** Merge updates into the URL. Changing anything except `page` resets to page 1. */
  const update = useCallback(
    (patch: Partial<Record<string, string | number | undefined>>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === undefined || value === "") next.delete(key);
            else next.set(key, String(value));
          });
          if (!("page" in patch)) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [params, update] as const;
}
