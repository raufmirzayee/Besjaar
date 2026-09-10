import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { localeFromHead, localisedSeo } from "@/lib/seo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";
import {
  getMyReturns,
  getReturnableOrders,
  requestReturn,
  cancelMyReturn,
} from "@/lib/returns.functions";
import { RETURN_REASONS, type ReturnStatus } from "@/lib/returns.server";

export const Route = createFileRoute("/retouren")({
  head: (ctx) =>
    localisedSeo("returns", { path: "/retouren", locale: localeFromHead(ctx), noindex: true }),
  component: ReturnsPage,
});

const RETURN_STATUS_KEYS: Record<string, TranslationKey> = {
  requested: "returnStatus.requested",
  approved: "returnStatus.approved",
  rejected: "returnStatus.rejected",
  received: "returnStatus.received",
  refunded: "returnStatus.refunded",
  cancelled: "returnStatus.cancelled",
};

const RETURN_REASON_KEYS: Record<string, TranslationKey> = {
  "Niet tevreden / bedenktijd": "returnReason.notSatisfied",
  "Verkeerd product ontvangen": "returnReason.wrongProduct",
  "Product beschadigd": "returnReason.damaged",
  "Product defect": "returnReason.defect",
  "Te laat bezorgd": "returnReason.late",
  Anders: "returnReason.other",
};

function ReturnsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();

  const fetchReturns = useServerFn(getMyReturns);
  const fetchOrders = useServerFn(getReturnableOrders);
  const submit = useServerFn(requestReturn);
  const cancel = useServerFn(cancelMyReturn);

  const [orderId, setOrderId] = useState<string>("");
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [note, setNote] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/inloggen", replace: true });
  }, [loading, user, navigate]);

  const returnsQuery = useQuery({
    queryKey: ["my-returns", user?.id],
    enabled: Boolean(user),
    queryFn: () => fetchReturns({}),
  });

  const ordersQuery = useQuery({
    queryKey: ["returnable-orders", user?.id],
    enabled: Boolean(user),
    queryFn: () => fetchOrders({}),
  });

  const orders = ordersQuery.data ?? [];
  const selectedOrder = orders.find((o) => o.id === orderId);

  const createMutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          orderId,
          reason,
          customerNote: note || null,
          items: Object.entries(quantities)
            .filter(([, qty]) => qty > 0)
            .map(([orderItemId, qty]) => ({ orderItemId, quantity: qty })),
        },
      }),
    onSuccess: (result) => {
      toast.success(t("returns.created", { number: result.return_number }));
      setOrderId("");
      setQuantities({});
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["my-returns"] });
      queryClient.invalidateQueries({ queryKey: ["returnable-orders"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (returnId: string) => cancel({ data: { returnId } }),
    onSuccess: () => {
      toast.success(t("returns.cancelled"));
      queryClient.invalidateQueries({ queryKey: ["my-returns"] });
      queryClient.invalidateQueries({ queryKey: ["returnable-orders"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (loading || !user) {
    return (
      <div className="container-page py-16">
        <p className="text-center text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("returns.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("returns.subtitle")}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/account">{t("returns.toAccount")}</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">{t("returns.new")}</h2>
          <Separator className="my-4" />

          {ordersQuery.isPending ? (
            <p className="text-sm text-muted-foreground">{t("returns.ordersLoading")}</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("returns.noReturnable")}</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("returns.order")}</label>
                <Select
                  value={orderId}
                  onValueChange={(value) => {
                    setOrderId(value);
                    setQuantities({});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("returns.chooseOrder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.order_number} — {new Date(o.created_at).toLocaleDateString(locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">{t("returns.whichProducts")}</p>
                  <ul className="divide-y rounded-lg border">
                    {selectedOrder.items.map((item) => {
                      const max = item.quantity - item.returned_quantity;
                      return (
                        <li key={item.id} className="flex flex-wrap items-center gap-3 p-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(item.unit_price)} · {t("returns.maxPieces", { max })}
                            </p>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={max}
                            value={quantities[item.id] ?? 0}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [item.id]: Math.max(0, Math.min(max, Number(e.target.value) || 0)),
                              }))
                            }
                            className="w-20"
                          />
                        </li>
                      );
                    })}
                  </ul>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("returns.reason")}</label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RETURN_REASONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {RETURN_REASON_KEYS[r] ? t(RETURN_REASON_KEYS[r]) : r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("returns.noteLabel")}</label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t("returns.notePlaceholder")}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={
                      createMutation.isPending || !Object.values(quantities).some((q) => q > 0)
                    }
                    className="w-full"
                  >
                    {createMutation.isPending ? t("returns.sending") : t("returns.submit")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">{t("returns.mine")}</h2>
          <Separator className="my-4" />
          {returnsQuery.isPending ? (
            <p className="text-sm text-muted-foreground">{t("returns.loading")}</p>
          ) : (returnsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("returns.none")}</p>
          ) : (
            <ul className="space-y-4">
              {(returnsQuery.data ?? []).map((ret) => (
                <li key={ret.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{ret.return_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("returns.orderLine", { number: ret.order_number ?? "—" })} ·{" "}
                        {new Date(ret.requested_at).toLocaleDateString(locale)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {RETURN_STATUS_KEYS[ret.status as ReturnStatus]
                        ? t(RETURN_STATUS_KEYS[ret.status as ReturnStatus])
                        : ret.status}
                    </Badge>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {ret.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity}× {item.product_name}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("returns.reasonLine", {
                      reason: RETURN_REASON_KEYS[ret.reason]
                        ? t(RETURN_REASON_KEYS[ret.reason])
                        : ret.reason,
                    })}
                  </p>
                  {ret.staff_note && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("returns.staffNote", { note: ret.staff_note })}
                    </p>
                  )}
                  {ret.refund_amount !== null && (
                    <p className="mt-1 text-sm font-medium">
                      {t("returns.refund", { amount: formatPrice(ret.refund_amount) })}
                    </p>
                  )}
                  {ret.status === "requested" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(ret.id)}
                    >
                      {t("returns.cancel")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
