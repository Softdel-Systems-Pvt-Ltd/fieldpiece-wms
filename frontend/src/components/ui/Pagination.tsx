import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { pageCountOf, pageWindow, rangeOf, TABLE_PAGE_SIZES } from "@/lib/pagination";
import { Button } from "./Button";
import { buttonVariants } from "./button-variants";
import { NativeSelect } from "./NativeSelect";

// Section 5.4. One pager for every server-paginated list (tables and card grids). It only reports changes:
// the page lives in the URL and the server returns that slice.

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Shows the page-size picker when set. */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizes?: readonly number[];
  /** Disables the controls while the first page loads. */
  isLoading?: boolean;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizes = TABLE_PAGE_SIZES,
  isLoading = false,
  className,
}: PaginationProps) {
  const { t } = useTranslation();
  const sizeId = useId();
  const pageCount = pageCountOf(total, pageSize);
  const { from, to } = rangeOf(page, pageSize, total);

  // A shared link or a narrower filter can point past the last page: move to the last real one.
  useEffect(() => {
    if (!isLoading && total > 0 && page > pageCount) onPageChange(pageCount);
  }, [isLoading, total, page, pageCount, onPageChange]);

  return (
    <nav
      aria-label={t("pagination.label")}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-text-muted",
        className,
      )}
    >
      <p aria-live="polite">{total ? t("pagination.range", { from, to, total }) : t("pagination.none")}</p>

      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <label htmlFor={sizeId}>{t("pagination.perPage")}</label>
            <NativeSelect
              id={sizeId}
              className="h-8 w-20 text-sm"
              value={pageSize}
              disabled={isLoading}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : null}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("pagination.previous")}
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            icon={ChevronLeft}
          />
          <ol className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, pageCount).map((item, i) =>
              item === "gap" ? (
                <li key={`gap-${i}`} aria-hidden className="w-8 text-center">
                  …
                </li>
              ) : (
                <li key={item}>
                  <button
                    type="button"
                    aria-label={t("pagination.page", { page: item })}
                    aria-current={item === page ? "page" : undefined}
                    disabled={isLoading}
                    onClick={() => item !== page && onPageChange(item)}
                    className={cn(
                      buttonVariants({ variant: item === page ? "dark" : "ghost", size: "sm" }),
                      "min-w-8 px-2 tabular-nums",
                    )}
                  >
                    {item}
                  </button>
                </li>
              ),
            )}
          </ol>
          <span className="px-2 tabular-nums sm:hidden">
            {t("pagination.pageOf", { page: Math.min(page, pageCount), pages: pageCount })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("pagination.next")}
            disabled={page >= pageCount || isLoading}
            onClick={() => onPageChange(page + 1)}
            icon={ChevronRight}
          />
        </div>
      </div>
    </nav>
  );
}
