import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout";
import { Card, FormField, Input, NativeSelect } from "@/components/ui";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";
import { useTableParams } from "@/lib/use-table-params";
import type { ProductFamily } from "@/types";
import { ChartCard } from "../components/ChartCard";
import { useClaimRate, useClaimsOverTime, useCost, useFailureBreakdown, useResolutionTime } from "../hooks";
import type { ReportFilters } from "../types";

// Section 8.7. Chart colours per 8.2: series 1 brand-500, 2 ink-900, 3 info, 4 ink-300; axes ink-200.

const FAMILIES: ProductFamily[] = [
  "meters",
  "gauges",
  "vacuum",
  "leak_detection",
  "combustion",
  "airflow",
  "recovery",
  "other",
];
const axis = { tick: { fontSize: 12, fill: "var(--ink-500)" }, stroke: "var(--ink-200)" };

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const [params, update] = useTableParams();
  const filters = useMemo<ReportFilters>(
    () => ({
      from: params.filters.from,
      to: params.filters.to,
      sku: params.filters.sku,
      family: params.filters.family as ProductFamily | undefined,
    }),
    [params.filters],
  );

  const summary = useClaimsOverTime(filters);
  const claimRate = useClaimRate(filters);
  const failures = useFailureBreakdown(filters);
  const resolution = useResolutionTime(filters);
  const cost = useCost(filters);
  const overTime = { ...summary, data: summary.data?.claimsOverTime };
  const n = (v: unknown) => formatNumber(Number(v), i18n.language);
  // Credits are in one currency per account; fall back to the user's.
  const currency = cost.data?.find((r) => r.currency)?.currency ?? user?.currency ?? "USD";

  return (
    <>
      <PageHeader
        title={t("reports.title")}
        breadcrumbs={[{ label: t("nav.dashboard"), to: "/" }, { label: t("reports.title") }]}
      />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            label={t("reports.from")}
            helper={summary.data && !filters.from ? formatDate(summary.data.from, i18n.language) : undefined}
          >
            <Input
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => update({ from: e.target.value })}
            />
          </FormField>
          <FormField label={t("reports.to")}>
            <Input
              type="date"
              value={filters.to ?? ""}
              min={filters.from}
              onChange={(e) => update({ to: e.target.value })}
            />
          </FormField>
          <FormField label="SKU">
            <Input
              value={filters.sku ?? ""}
              placeholder="SC680"
              onChange={(e) => update({ sku: e.target.value.toUpperCase() })}
            />
          </FormField>
          <FormField label={t("products.family")}>
            <NativeSelect value={filters.family ?? ""} onChange={(e) => update({ family: e.target.value })}>
              <option value="">{t("reports.allFamilies")}</option>
              {FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {t(`products.families.${f}`)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={t("reports.claimsOverTime")}
          fileName="claims-over-time"
          className="lg:col-span-2"
          query={overTime}
          columns={[
            { key: "date", label: t("reports.date"), format: (v) => formatDate(String(v), i18n.language) },
            { key: "count", label: t("reports.claims"), format: n },
          ]}
        >
          {(rows) => (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                <CartesianGrid stroke="var(--ink-200)" vertical={false} />
                <XAxis dataKey="date" {...axis} tickFormatter={(d: string) => formatDate(d, i18n.language)} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip labelFormatter={(d) => formatDate(String(d), i18n.language)} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={t("reports.claims")}
                  stroke="var(--brand-500)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={t("reports.claimRateBySku")}
          fileName="claim-rate-by-sku"
          query={claimRate}
          columns={[
            { key: "sku", label: "SKU" },
            { key: "registrations", label: t("reports.registrations"), format: n },
            { key: "claims", label: t("reports.claims"), format: n },
            {
              key: "rate",
              label: t("reports.rate"),
              format: (v) =>
                formatNumber(Number(v), i18n.language, { style: "percent", maximumFractionDigits: 1 }),
            },
          ]}
        >
          {(rows) => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
                <CartesianGrid stroke="var(--ink-200)" vertical={false} />
                <XAxis dataKey="sku" {...axis} />
                <YAxis
                  {...axis}
                  tickFormatter={(v: number) => formatNumber(v, i18n.language, { style: "percent" })}
                />
                <Tooltip
                  formatter={(v) =>
                    formatNumber(Number(v), i18n.language, { style: "percent", maximumFractionDigits: 1 })
                  }
                />
                <Bar dataKey="rate" name={t("reports.rate")} fill="var(--ink-900)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={t("reports.failureCategories")}
          fileName="failure-categories"
          query={failures}
          columns={[
            { key: "label", label: t("claims.columns.category") },
            { key: "count", label: t("reports.claims"), format: n },
          ]}
        >
          {(rows) => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 24 }}>
                <CartesianGrid stroke="var(--ink-200)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} {...axis} />
                <YAxis type="category" dataKey="label" width={120} {...axis} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name={t("reports.claims")}
                  fill="var(--brand-500)"
                  radius={[0, 2, 2, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={t("reports.resolutionTime")}
          fileName="resolution-time"
          query={resolution}
          columns={[
            { key: "week", label: t("reports.week"), format: (v) => formatDate(String(v), i18n.language) },
            {
              key: "avgDays",
              label: t("reports.avgDays"),
              format: (v) => formatNumber(Number(v), i18n.language, { maximumFractionDigits: 1 }),
            },
            { key: "count", label: t("reports.claims"), format: n },
          ]}
        >
          {(rows) => (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                <CartesianGrid stroke="var(--ink-200)" vertical={false} />
                <XAxis dataKey="week" {...axis} tickFormatter={(d: string) => formatDate(d, i18n.language)} />
                <YAxis {...axis} />
                <Tooltip labelFormatter={(d) => formatDate(String(d), i18n.language)} />
                <Line
                  type="monotone"
                  dataKey="avgDays"
                  name={t("reports.avgDays")}
                  stroke="var(--info)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={t("reports.cost")}
          fileName="cost-by-resolution"
          query={cost}
          columns={[
            { key: "type", label: t("rma.type"), format: (v) => t(`claims.resolutions.${String(v)}`) },
            { key: "count", label: t("reports.rmas"), format: n },
            {
              key: "creditTotal",
              label: t("reports.credits"),
              format: (v) => formatMoney(Number(v), currency, i18n.language),
            },
          ]}
        >
          {(rows) => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows.map((r) => ({ ...r, label: t(`claims.resolutions.${r.type}`) }))}
                margin={{ top: 8, right: 16, bottom: 8, left: -16 }}
              >
                <CartesianGrid stroke="var(--ink-200)" vertical={false} />
                <XAxis dataKey="label" {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip />
                <Bar dataKey="count" name={t("reports.rmas")} fill="var(--ink-300)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </>
  );
}
