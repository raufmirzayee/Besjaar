import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  NoAccessState,
  PageHeader,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { useCan } from "@/components/admin/admin-shell";
import type { TranslationKey } from "@/lib/translations";
import { useI18n } from "@/lib/i18n";
import { getLowStockAlerts } from "@/lib/admin-extra.functions";
import type { LowStockAlert } from "@/lib/admin-extra.server";
import { downloadCsv, toCsv } from "@/lib/csv";

export const Route = createFileRoute("/beheer/lage-voorraad")({
  component: LowStockPage,
});

/** Keys, not labels: a module constant cannot call t(). */
const LEVEL_LABEL: Record<LowStockAlert["level"], TranslationKey> = {
  critical: "admin.low.critical",
  high: "admin.low.high",
  medium: "admin.low.medium",
  low: "admin.low.low",
};

function LowStockPage() {
  const { t } = useI18n();
  const allow = useCan();
  const fetchAlerts = useServerFn(getLowStockAlerts);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<"alle" | LowStockAlert["level"]>("alle");

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin-low-stock"],
    enabled: allow("low_stock", "view"),
    queryFn: () => fetchAlerts({}) as Promise<LowStockAlert[]>,
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? [])
      .filter((a) => (level === "alle" ? true : a.level === level))
      .filter((a) =>
        term
          ? a.name.toLowerCase().includes(term) || (a.ean ?? "").toLowerCase().includes(term)
          : true,
      );
  }, [data, search, level]);

  if (!allow("low_stock", "view")) return <NoAccessState module="lage voorraad" />;

  const critical = (data ?? []).filter((a) => a.level === "critical").length;
  const outOfStock = (data ?? []).filter((a) => a.stock_quantity <= 0).length;
  const suggested = (data ?? []).reduce((s, a) => s + a.recommendedOrder, 0);

  return (
    <div>
      <PageHeader
        title={t("admin.low.title")}
        description={t("admin.low.subtitle")}
        actions={
          rows.length ? (
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  "inkoopadvies.csv",
                  toCsv([
                    [
                      "product",
                      "ean",
                      "voorraad",
                      "veiligheidsvoorraad",
                      "verkoop4m",
                      "verkoop6m",
                      "gem_per_maand",
                      "dekking_maanden",
                      "advies_inkoop",
                      "niveau",
                    ],
                    ...rows.map((a) => [
                      a.name,
                      a.ean ?? "",
                      a.stock_quantity,
                      a.safety_stock,
                      a.sales4m,
                      a.sales6m,
                      a.monthlyAverage.toFixed(1),
                      a.coverageMonths === null ? "" : a.coverageMonths.toFixed(1),
                      a.recommendedOrder,
                      t(LEVEL_LABEL[a.level]),
                    ]),
                  ]),
                )
              }
            >
              {t("admin.low.exportAdvice")}
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("admin.low.signals")} value={String((data ?? []).length)} />
        <MetricCard label={t("admin.low.critical")} value={String(critical)} />
        <MetricCard label={t("admin.low.soldOut")} value={String(outOfStock)} />
        <MetricCard label={t("admin.low.totalToBuy")} value={String(suggested)} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.low.search")}
          className="max-w-xs"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as typeof level)}
          aria-label={t("admin.low.level")}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="alle">{t("admin.low.allLevels")}</option>
          <option value="critical">{t("admin.low.critical")}</option>
          <option value="high">{t("admin.low.high")}</option>
          <option value="medium">{t("admin.low.medium")}</option>
          <option value="low">{t("admin.low.low")}</option>
        </select>
      </div>

      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : null}
      {data && rows.length === 0 ? (
        <EmptyState title={t("admin.low.none")} description={t("admin.low.allFine")} />
      ) : null}

      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">{t("admin.common.product")}</th>
                <th className="p-3 text-right">{t("admin.common.stock")}</th>
                <th className="p-3 text-right">{t("admin.low.safety")}</th>
                <th className="p-3 text-right">4 mnd</th>
                <th className="p-3 text-right">6 mnd</th>
                <th className="p-3 text-right">{t("admin.low.avgPerMonth")}</th>
                <th className="p-3 text-right">{t("admin.low.coverage")}</th>
                <th className="p-3 text-right">{t("admin.low.advice")}</th>
                <th className="p-3">{t("admin.low.level")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="p-3">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[a.brand, a.category, a.ean].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="p-3 text-right font-semibold">{a.stock_quantity}</td>
                  <td className="p-3 text-right text-muted-foreground">{a.safety_stock}</td>
                  <td className="p-3 text-right">{a.sales4m}</td>
                  <td className="p-3 text-right">{a.sales6m}</td>
                  <td className="p-3 text-right">{a.monthlyAverage.toFixed(1)}</td>
                  <td className="p-3 text-right">
                    {a.coverageMonths === null ? "—" : `${a.coverageMonths.toFixed(1)} mnd`}
                  </td>
                  <td className="p-3 text-right font-semibold">{a.recommendedOrder}</td>
                  <td className="p-3">
                    <StatusBadge
                      tone={
                        a.level === "critical"
                          ? "danger"
                          : a.level === "high"
                            ? "warning"
                            : a.level === "medium"
                              ? "info"
                              : "muted"
                      }
                      label={t(LEVEL_LABEL[a.level])}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
