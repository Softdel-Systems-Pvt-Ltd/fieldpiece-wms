import { Package, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import { Card, Input, NativeSelect, Pagination, ProductImage } from "@/components/ui";
import { cn } from "@/lib/cn";
import { GRID_PAGE_SIZES } from "@/lib/pagination";
import { useServerTable } from "@/lib/use-server-table";
import { PRODUCT_FAMILIES, type ProductFamily } from "@/types";
import { useProducts } from "../hooks";

const SORTS = { name: "products.sort.name", sku: "products.sort.sku", "-launchDate": "products.sort.newest" };

export default function ProductsPage() {
  const { t } = useTranslation();
  const list = useServerTable({ sort: "name", pageSize: 12, pageSizes: GRID_PAGE_SIZES });
  const [search, setSearch] = useState(list.q ?? "");
  const family = list.filters.family as ProductFamily | undefined;
  const query = useProducts({ ...list.request, family });
  const { data: items, isLoading, isFetching, error, onRetry, ...paging } = list.bind(query);

  return (
    <>
      <PageHeader
        title={t("products.title")}
        breadcrumbs={[{ label: t("nav.dashboard"), to: "/" }, { label: t("products.title") }]}
      />

      <div className="rounded-lg bg-surface shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <form
            role="search"
            className="relative w-full sm:w-72"
            onSubmit={(e) => {
              e.preventDefault();
              list.update({ q: search.trim() });
            }}
          >
            <label htmlFor="products-search" className="sr-only">
              {t("products.search")}
            </label>
            <Search
              size={16}
              strokeWidth={1.75}
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-500"
            />
            <Input
              id="products-search"
              type="search"
              className="ps-9"
              placeholder={t("products.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <label htmlFor="products-family" className="sr-only">
            {t("products.family")}
          </label>
          <NativeSelect
            id="products-family"
            className="w-full sm:w-48"
            value={family ?? ""}
            onChange={(e) => list.update({ family: e.target.value })}
          >
            <option value="">{t("reports.allFamilies")}</option>
            {PRODUCT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {t(`products.families.${f}`)}
              </option>
            ))}
          </NativeSelect>
          <label htmlFor="products-sort" className="sr-only">
            {t("products.sort.label")}
          </label>
          <NativeSelect
            id="products-sort"
            className="w-full sm:ms-auto sm:w-44"
            value={paging.sort ?? "name"}
            onChange={(e) => paging.onSortChange(e.target.value)}
          >
            {Object.entries(SORTS).map(([value, key]) => (
              <option key={value} value={value}>
                {t(key)}
              </option>
            ))}
          </NativeSelect>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={onRetry} />
        ) : isLoading ? (
          <ul className="grid grid-cols-2 gap-3 p-4 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: paging.pageSize }, (_, i) => (
              <li key={i}>
                <Skeleton className="h-72" />
              </li>
            ))}
          </ul>
        ) : !items?.length ? (
          <EmptyState icon={Package} message={t("products.empty")} />
        ) : (
          <ul
            aria-busy={isFetching || undefined}
            className={cn(
              "grid grid-cols-2 gap-3 p-4 transition-opacity sm:gap-4 lg:grid-cols-3 xl:grid-cols-4",
              isFetching && "opacity-60",
            )}
          >
            {items.map((p) => (
              <li key={p.sku}>
                <Link
                  to={`/products/${p.sku}`}
                  className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-1000"
                >
                  <Card
                    as="article"
                    className="flex h-full flex-col gap-3 p-3 group-hover:ring-2 group-hover:ring-ink-1000 sm:p-6"
                  >
                    <ProductImage src={p.imageUrl} alt="" size="fill" />
                    <div>
                      <p className="font-mono text-sm text-text-muted">{p.sku}</p>
                      <h2 className="text-body font-semibold sm:text-h3">{p.name}</h2>
                      <p className="mt-1 text-sm text-text-muted">
                        {t(`products.families.${p.family}`)} ·{" "}
                        {p.warrantyMonths ? t("products.months", { count: p.warrantyMonths }) : "—"}
                      </p>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Pagination {...paging} isLoading={isLoading} />
      </div>
    </>
  );
}
