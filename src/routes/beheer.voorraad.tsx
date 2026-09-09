import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adjustStock, getLowStock, getStockMovements } from "@/lib/admin.functions";
import type { LowStockRow, StockMovementRow } from "@/lib/admin.server";

export const Route = createFileRoute("/beheer/voorraad")({
  component: StockPage,
});

function StockPage() {
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
      adjust({ data: { ...input, reason: "manual_correction", note: "Handmatig via beheer" } }),
    onSuccess: (_result, vars) => {
      toast.success("Voorraad bijgewerkt");
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
        <h2 className="font-display text-xl font-bold">Voorraad & bijstellingen</h2>
        <p className="text-sm text-muted-foreground">
          Producten met een krappe voorraad, met een aanbevolen bestelaantal.
        </p>
      </div>

      {lowStock.isPending ? (
        <p className="text-sm text-muted-foreground">Voorraad laden…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">Voorraad</th>
                <th className="px-3 py-2 text-right">Drempel</th>
                <th className="px-3 py-2 text-right">Advies bestellen</th>
                <th className="px-3 py-2">Bijstellen</th>
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
                        Boeken
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(lowStock.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    Geen producten met een krappe voorraad.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">Voorraadmutaties</h3>
        <ul className="mt-3 divide-y divide-border text-sm">
          {(movements.data ?? []).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{m.product_name ?? "Onbekend product"}</p>
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
            <li className="py-2 text-muted-foreground">Nog geen mutaties.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
