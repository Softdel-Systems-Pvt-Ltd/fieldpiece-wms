// Pure pagination maths shared by the Pagination control, DataTable and useServerTable.
// The server owns the data (backend Section 6.3: ?page=&pageSize=, pageSize capped at 100).

export const TABLE_PAGE_SIZES = [10, 25, 50, 100] as const;
export const GRID_PAGE_SIZES = [12, 24, 48] as const;
export const MAX_PAGE_SIZE = 100;

export type PageItem = number | "gap";

export const pageCountOf = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize));

/**
 * Page buttons to show: always the first and last page, the current page with `siblings` either side, and a
 * "gap" wherever pages are skipped. The length stays constant while paging, so the control doesn't jump.
 * e.g. page 6 of 20 -> [1, "gap", 5, 6, 7, "gap", 20]
 */
export function pageWindow(page: number, pageCount: number, siblings = 1): PageItem[] {
  const slots = siblings * 2 + 5; // first, last, current, siblings and two gaps
  if (pageCount <= slots) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const current = Math.min(Math.max(page, 1), pageCount);
  const start = Math.max(2, Math.min(current - siblings, pageCount - siblings * 2 - 2));
  const end = Math.min(pageCount - 1, Math.max(current + siblings, siblings * 2 + 3));
  const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return [
    1,
    ...(start > 2 ? (["gap"] as const) : []),
    ...middle,
    ...(end < pageCount - 1 ? (["gap"] as const) : []),
    pageCount,
  ];
}

/** 1-based inclusive range of the rows on this page; { from: 0, to: 0 } when there are none. */
export function rangeOf(page: number, pageSize: number, total: number) {
  if (total === 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  return { from: Math.min(from, total), to: Math.min(page * pageSize, total) };
}

/** Reads a page size from the URL, falling back when it isn't one the screen offers. */
export function parsePageSize(raw: string | null, options: readonly number[], fallback: number): number {
  const n = Number(raw);
  return options.includes(n) ? n : fallback;
}
