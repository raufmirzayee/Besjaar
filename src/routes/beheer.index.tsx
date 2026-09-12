import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
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

import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
  StatusBadge,
  statusTone,
} from "@/components/admin/admin-ui";
import { GoLiveChecklist } from "@/components/admin/go-live-checklist";
import type { TranslationKey } from "@/lib/translations";
import { useI18n } from "@/lib/i18n";
import { getDashboardOverview } from "@/lib/admin-core.functions";
import type { DashboardOverview, DashboardPeriod } from "@/lib/admin-core.server";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/beheer/")({
  component: DashboardPage,
});

/** Keys, not labels: a module constant cannot call t(). */
const PERIODS: { value: DashboardPeriod; label: TranslationKey }[] = [
  { value: "today", label: "admin.dash.today" },
  { value: "7d", label: "admin.dash.days7" },
  { value: "30d", label: "admin.dash.days30" },
  { value: "month", label: "admin.dash.thisMonth" },
  { value: "last_month", label: "admin.dash.lastMonth" },
  { value: "year", label: "admin.dash.thisYear" },
];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <div className="h-56">{children}</div>
    </div>
  );
}

function DashboardPage() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const fetchOverview = useServerFn(getDashboardOverview);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin-overview", period],
    queryFn: () => fetchOverview({ data: { period } }) as Promise<DashboardOverview>,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.dash.title")}
        description={t("admin.dash.subtitle")}
        actions={
          <div className="flex flex-wrap gap-1">
            {PERIODS.map((p) => (
              <Button
                key={p.value}
                size="sm"
                variant={period === p.value ? "default" : "outline"}
                onClick={() => setPeriod(p.value)}
              >
                {t(p.label)}
              </Button>
            ))}
          </div>
        }
      />

      <GoLiveChecklist />

      {isPending ? <LoadingState label={t("admin.dash.loading")} /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={t("admin.dash.revenuePeriod")}
              value={formatPrice(data.revenue.value)}
              change={data.revenue.change}
              to="/beheer/rapporten"
            />
            <MetricCard
              label={t("admin.dash.ordersPeriod")}
              value={String(data.orders.value)}
              change={data.orders.change}
              to="/beheer/bestellingen"
            />
            <MetricCard
              label={t("admin.dash.avgOrder")}
              value={formatPrice(data.averageOrderValue.value)}
              change={data.averageOrderValue.change}
            />
            <MetricCard
              label={t("admin.dash.stockValue")}
              value={formatPrice(data.inventoryValue)}
              hint="inkoopwaarde op voorraad"
              to="/beheer/voorraad"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={t("admin.dash.revenueToday")}
              value={formatPrice(data.revenueToday)}
              hint={`${data.ordersToday} orders`}
            />
            <MetricCard
              label={t("admin.dash.revenueWeek")}
              value={formatPrice(data.revenueWeek)}
              hint="laatste 7 dagen"
            />
            <MetricCard
              label={t("admin.dash.revenueMonth")}
              value={formatPrice(data.revenueMonth)}
              hint="lopende maand"
            />
            <MetricCard
              label={t("admin.dash.revenueYear")}
              value={formatPrice(data.revenueYear)}
              hint="lopend jaar"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              label={t("admin.dash.pending")}
              value={String(data.counts.pending)}
              hint="te betalen"
              to="/beheer/bestellingen"
            />
            <MetricCard
              label={t("admin.dash.paid")}
              value={String(data.counts.paid)}
              hint="te verwerken"
              to="/beheer/bestellingen"
            />
            <MetricCard
              label={t("admin.dash.readyToShip")}
              value={String(data.counts.readyToShip)}
              hint="magazijn"
              to="/beheer/verzendingen"
            />
            <MetricCard
              label={t("admin.dash.shipped")}
              value={String(data.counts.shipped)}
              hint="onderweg/bezorgd"
              to="/beheer/verzendingen"
            />
            <MetricCard
              label={t("admin.dash.cancelled")}
              value={String(data.counts.cancelled)}
              hint="totaal"
            />
            <MetricCard
              label={t("admin.dash.openReturns")}
              value={String(data.counts.pendingReturns)}
              hint="te behandelen"
              to="/beheer/retouren"
            />
            <MetricCard
              label={t("admin.dash.failedPayments")}
              value={String(data.counts.failedPayments)}
              hint="controle nodig"
              to="/beheer/bestellingen"
            />
            <MetricCard
              label={t("admin.dash.lowStock")}
              value={String(data.counts.lowStock)}
              hint="bijbestellen"
              to="/beheer/lage-voorraad"
            />
            <MetricCard
              label={t("admin.dash.outOfStock")}
              value={String(data.counts.outOfStock)}
              hint="uitverkocht"
              to="/beheer/voorraad"
            />
            <MetricCard
              label="bol.com fouten"
              value={String(data.counts.syncErrors)}
              hint="sync"
              to="/beheer/synchronisatie"
            />
            <MetricCard
              label={t("admin.dash.openSupport")}
              value={String(data.counts.openSupport)}
              hint="klantenservice"
              to="/beheer/berichten"
            />
            <MetricCard
              label={t("admin.dash.returnRate")}
              value={`${data.returnRate.toFixed(1)}%`}
              hint="retouren / orders"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t("admin.dash.revenueOverTime")}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tickFormatter={(v: string) => v.slice(5)} fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(v: number) => formatPrice(Number(v))} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t("admin.dash.ordersOverTime")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tickFormatter={(v: string) => v.slice(5)} fontSize={10} />
                  <YAxis allowDecimals={false} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t("admin.dash.revenueByCategory")}>
              {data.byCategory.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byCategory} layout="vertical">
                    <XAxis type="number" fontSize={10} />
                    <YAxis type="category" dataKey="name" width={110} fontSize={10} />
                    <Tooltip formatter={(v: number) => formatPrice(Number(v))} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title={t("admin.dash.noSalesData")} />
              )}
            </ChartCard>

            <ChartCard title={t("admin.dash.revenueByBrand")}>
              {data.byBrand.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byBrand} layout="vertical">
                    <XAxis type="number" fontSize={10} />
                    <YAxis type="category" dataKey="name" width={110} fontSize={10} />
                    <Tooltip formatter={(v: number) => formatPrice(Number(v))} />
                    <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title={t("admin.dash.noSalesData")} />
              )}
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">{t("admin.dash.channels")}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.byChannel.length ? (
                  data.byChannel.map((c) => (
                    <li key={c.channel} className="flex items-center justify-between gap-2">
                      <span className="capitalize">{c.channel}</span>
                      <span className="text-muted-foreground">
                        {c.orders}x · {formatPrice(c.revenue)}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">{t("admin.dash.noRevenue")}</li>
                )}
              </ul>
              <h2 className="mt-4 text-sm font-semibold">{t("admin.dash.paymentMethods")}</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {data.byPaymentMethod.length ? (
                  data.byPaymentMethod.map((p) => (
                    <li key={p.method} className="flex justify-between gap-2">
                      <span>{p.method}</span>
                      <span className="text-muted-foreground">{p.orders}x</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">{t("admin.dash.noData")}</li>
                )}
              </ul>
              <h2 className="mt-4 text-sm font-semibold">{t("admin.dash.customers")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.customers.new} nieuw · {data.customers.returning} terugkerend
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">{t("admin.dash.bestSellers")}</h2>
              <ul className="mt-3 divide-y divide-border text-sm">
                {data.topProducts.length ? (
                  data.topProducts.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                      <span className="min-w-0 truncate">{p.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {p.quantity}x · {formatPrice(p.revenue)}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="py-2 text-muted-foreground">{t("admin.dash.noSales")}</li>
                )}
              </ul>
              <h2 className="mt-4 text-sm font-semibold">{t("admin.dash.worstSellers")}</h2>
              <ul className="mt-2 divide-y divide-border text-sm">
                {data.slowProducts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0 truncate">{p.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {p.sales_count}x · {p.stock_quantity} voorraad
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">{t("admin.dash.recentActivity")}</h2>
              <ul className="mt-3 divide-y divide-border text-sm">
                {data.activity.length ? (
                  data.activity.map((a) => (
                    <li
                      key={`${a.type}-${a.id}`}
                      className="flex items-start justify-between gap-2 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {new Date(a.at).toLocaleString("nl-NL")}
                        </p>
                      </div>
                      <StatusBadge tone={statusTone(a.hint ?? a.type)} label={a.hint ?? a.type} />
                    </li>
                  ))
                ) : (
                  <li className="py-2 text-muted-foreground">{t("admin.dash.noActivity")}</li>
                )}
              </ul>
              <Button className="mt-3 w-full" variant="outline" asChild>
                <Link to="/beheer/audit">{t("admin.dash.viewAudit")}</Link>
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
