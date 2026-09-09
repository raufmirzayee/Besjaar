import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAdminOrders, setOrderStatus } from "@/lib/admin.functions";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type AdminOrder } from "@/lib/admin.server";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/beheer/bestellingen")({
  component: OrdersPage,
});

function OrdersPage() {
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(getAdminOrders);
  const updateStatus = useServerFn(setOrderStatus);
  const [status, setStatus] = useState("alle");

  const { data, isPending } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: () => fetchOrders({ data: { status } }) as Promise<AdminOrder[]>,
  });

  const mutation = useMutation({
    mutationFn: (input: { orderId: string; status: string }) => updateStatus({ data: input }),
    onSuccess: () => {
      toast.success("Status bijgewerkt");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Bestellingen</h2>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Bestellingen laden…</p>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.first_name} {order.last_name} · {order.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString("nl-NL")} ·{" "}
                    {order.shipping_method_name ?? "geen verzendmethode"} ·{" "}
                    {order.payment_method ?? "onbekend"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {order.payment_status === "paid" ? "Betaald" : order.payment_status}
                  </Badge>
                  <span className="font-semibold">{formatPrice(order.total)}</span>
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between gap-2">
                    <span className="truncate">
                      {item.quantity}× {item.product_name}
                    </span>
                    <span>{formatPrice(item.line_total)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <Select
                  value={order.status}
                  onValueChange={(value) => mutation.mutate({ orderId: order.id, status: value })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
              Geen bestellingen in deze filter.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
