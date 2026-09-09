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
import { getLowStockAlerts } from "@/lib/admin-extra.functions";
import type { LowStockAlert } from "@/lib/admin-extra.server";
import { downloadCsv, toCsv } from "@/lib/csv";

export const Route = createFileRoute("/beheer/lage-voorraad")({
  component: LowStockPage,
});

const LEVEL_LABEL: Record<LowStockAlert["level"], string> = {
  critical: "Kritiek",
  high: "Hoog",
  medium: "Gemiddeld",
  low: "Laag",
};

function LowStockPage() {
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
        title="Lage voorraad"
        description="Voorraadsignalen op basis van verkoop over 4 en 6 maanden, met inkoopadvies."
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
                      LEVEL_LABEL[a.level],
                    ]),
                  ]),
                )
              }
            >
              Exporteer inkoopadvies
            </Button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Signalen" value={String((data ?? []).length)} />
        <MetricCard label="Kritiek" value={String(critical)} />
        <MetricCard label="Uitverkocht" value={String(outOfStock)} />
        <MetricCard label="Advies totaal in te kopen" value={String(suggested)} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek product of EAN"
          className="max-w-xs"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as typeof level)}
          aria-label="Niveau"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="alle">Alle niveaus</option>
          <option value="critical">Kritiek</option>
          <option value="high">Hoog</option>
          <option value="medium">Gemiddeld</option>
          <option value="low">Laag</option>
        </select>
      </div>

      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : null}
      {data && rows.length === 0 ? (
        <EmptyState
          title="Geen signalen"
          description="Alle producten hebben voldoende voorraad ten opzichte van de verkoop."
        />
      ) : null}

      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3 text-right">Voorraad</th>
                <th className="p-3 text-right">Veiligheid</th>
                <th className="p-3 text-right">4 mnd</th>
                <th className="p-3 text-right">6 mnd</th>
                <th className="p-3 text-right">Gem./mnd</th>
                <th className="p-3 text-right">Dekking</th>
                <th className="p-3 text-right">Advies</th>
                <th className="p-3">Niveau</th>
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
                      label={LEVEL_LABEL[a.level]}
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
