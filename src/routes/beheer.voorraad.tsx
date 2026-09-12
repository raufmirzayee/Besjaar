import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { adjustStock, getLowStock, getStockMovements } from "@/lib/admin.functions";
import type { LowStockRow, StockMovementRow } from "@/lib/admin.server";

export const Route = createFileRoute("/beheer/voorraad")({
  component: StockPage,
});

function StockPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchLow = useServerFn(getLowStock);
  const fetchMovements = useServerFn(getStockMovements);
  const adjust = useServerFn(adjustStock);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const lowStock = useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: () => fetchLow({}) as Promise<LowStockRow[]>,
  });
  const movements = useQuery({
    queryKey: ["admin-stock-movements"],
    queryFn: () => fetchMovements({}) as Promise<StockMovementRow[]>,
  });

  const mutation = useMutation({
    mutationFn: (input: { productId: string; change: number }) =>
      adjust({
        data: { ...input, reason: "manual_correction", note: t("admin.stock.manualAdjustment") },
      }),
    onSuccess: (_result, vars) => {
      toast.success(t("admin.stock.updated"));
      setDrafts((prev) => ({ ...prev, [vars.productId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["admin-low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">{t("admin.stock.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("admin.stock.subtitle")}</p>
      </div>

      {lowStock.isPending ? (
        <p className="text-sm text-muted-foreground">{t("admin.stock.loading")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">{t("admin.common.product")}</th>
                <th className="px-3 py-2 text-right">{t("admin.common.stock")}</th>
                <th className="px-3 py-2 text-right">{t("admin.stock.threshold")}</th>
                <th className="px-3 py-2 text-right">{t("admin.stock.suggestedOrder")}</th>
                <th className="px-3 py-2">{t("admin.stock.adjust")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(lowStock.data ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td
                    className={`px-3 py-2 text-right ${
                      row.stock_quantity <= row.low_stock_threshold ? "text-destructive" : ""
                    }`}
                  >
                    {row.stock_quantity}
                  </td>
                  <td className="px-3 py-2 text-right">{row.low_stock_threshold}</td>
                  <td className="px-3 py-2 text-right">{row.recommended_order}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-24"
                        type="number"
                        placeholder="+/-"
                        value={drafts[row.id] ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mutation.isPending || !drafts[row.id]}
                        onClick={() =>
                          mutation.mutate({
                            productId: row.id,
                            change: Number(drafts[row.id]),
                          })
                        }
                      >
                        {t("admin.stock.book")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(lowStock.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    {t("admin.stock.none")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">{t("admin.nav.stockMovements")}</h3>
        <ul className="mt-3 divide-y divide-border text-sm">
          {(movements.data ?? []).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {m.product_name ?? t("admin.stock.unknownProduct")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.reason} · {new Date(m.created_at).toLocaleString("nl-NL")}
                </p>
              </div>
              <span className={m.quantity_change < 0 ? "text-destructive" : "text-primary"}>
                {m.quantity_change > 0 ? "+" : ""}
                {m.quantity_change}
              </span>
            </li>
          ))}
          {(movements.data ?? []).length === 0 ? (
            <li className="py-2 text-muted-foreground">{t("admin.stock.noMovements")}</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
