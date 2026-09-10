import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { statusLabel } from "@/lib/fulfilment";
import { getAdminOrders } from "@/lib/admin.functions";
import { type AdminOrder } from "@/lib/admin.server";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/beheer/rapporten")({
  component: ReportsPage,
});

function toCsv(orders: AdminOrder[]): string {
  const header = [
    "ordernummer",
    "datum",
    "status",
    "betaalstatus",
    "klant",
    "email",
    "verzendmethode",
    "totaal",
  ];
  const rows = orders.map((o) => [
    o.order_number,
    new Date(o.created_at).toISOString(),
    o.status,
    o.payment_status,
    `${o.first_name} ${o.last_name}`,
    o.email,
    o.shipping_method_name ?? "",
    o.total.toFixed(2),
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
}

function ReportsPage() {
  const fetchOrders = useServerFn(getAdminOrders);
  const { data, isPending } = useQuery({
    queryKey: ["admin-orders", "alle"],
    queryFn: () => fetchOrders({ data: { status: "alle" } }) as Promise<AdminOrder[]>,
  });

  const orders = data ?? [];

  const byStatus = orders.reduce<Record<string, { count: number; total: number }>>((acc, o) => {
    acc[o.status] = {
      count: (acc[o.status]?.count ?? 0) + 1,
      total: (acc[o.status]?.total ?? 0) + o.total,
    };
    return acc;
  }, {});

  const byProduct = new Map<string, { quantity: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = byProduct.get(item.product_name) ?? { quantity: 0, revenue: 0 };
      byProduct.set(item.product_name, {
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + item.line_total,
      });
    }
  }
  const topProducts = [...byProduct.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10);

  function download() {
    const blob = new Blob([toCsv(orders)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `besjaar-bestellingen-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isPending) return <p className="text-sm text-muted-foreground">Rapporten laden…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Rapporten</h2>
        <Button variant="outline" onClick={download} disabled={orders.length === 0}>
          Exporteer bestellingen (CSV)
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">Bestellingen per status</h3>
        <ul className="mt-3 divide-y divide-border text-sm">
          {Object.entries(byStatus).map(([status, value]) => (
            <li key={status} className="flex justify-between py-2">
              <span>{statusLabel(status)}</span>
              <span className="text-muted-foreground">
                {value.count}× · {formatPrice(value.total)}
              </span>
            </li>
          ))}
          {orders.length === 0 ? (
            <li className="py-2 text-muted-foreground">Nog geen bestellingen.</li>
          ) : null}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">Omzet per product</h3>
        <ul className="mt-3 divide-y divide-border text-sm">
          {topProducts.map(([name, value]) => (
            <li key={name} className="flex justify-between gap-2 py-2">
              <span className="truncate">{name}</span>
              <span className="shrink-0 text-muted-foreground">
                {value.quantity}× · {formatPrice(value.revenue)}
              </span>
            </li>
          ))}
          {topProducts.length === 0 ? (
            <li className="py-2 text-muted-foreground">Nog geen verkopen.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
