import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Mail, Package, Truck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { getAdminOrders } from "@/lib/admin.functions";
import { FULFILMENT_STATUSES as ORDER_STATUSES } from "@/lib/fulfilment";
import type { AdminOrder } from "@/lib/admin.server";
import {
  getEmailStatus,
  getOrderDetail,
  resendEmail,
  updateOrderStatus,
} from "@/lib/fulfilment.functions";
import {
  CARRIERS,
  CARRIER_LABELS,
  EMAIL_LABELS,
  canTransition,
  statusLabel,
  type OrderDetail,
} from "@/lib/fulfilment";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/beheer/bestellingen")({
  component: OrdersPage,
});

function OrdersPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(getAdminOrders);
  const fetchEmailStatus = useServerFn(getEmailStatus);
  const [status, setStatus] = useState("alle");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: () => fetchOrders({ data: { status } }) as Promise<AdminOrder[]>,
  });

  const emailStatus = useQuery({
    queryKey: ["email-status"],
    queryFn: () => fetchEmailStatus({}) as Promise<{ configured: boolean }>,
    staleTime: 5 * 60 * 1000,
  });

  const orders = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{t("admin.orders.title")}</h2>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">{t("admin.orders.allStatuses")}</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Staff must know whether the customer is actually being told anything. */}
      {emailStatus.data && !emailStatus.data.configured ? (
        <p className="flex items-start gap-2 rounded-lg border border-sale/30 bg-sale/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-sale" aria-hidden="true" />
          <span>
            Er is geen e-mailprovider ingesteld, dus klanten ontvangen geen bevestigings- of
            verzendmail. Stel <code>RESEND_API_KEY</code> en <code>EMAIL_FROM</code> in om dit aan
            te zetten.
          </span>
        </p>
      ) : null}

      {isPending ? (
        <p className="text-sm text-muted-foreground">{t("admin.orders.loading")}</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface p-10 text-center">
          <Package className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-semibold">{t("admin.orders.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.orders.emptyHint")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-border bg-surface text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t("admin.orders.order")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("admin.orders.customer")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("admin.common.status")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("admin.orders.payment")}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{t("admin.common.total")}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs font-semibold">{order.order_number}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("nl-NL")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {order.first_name} {order.last_name}
                    <br />
                    <span className="text-xs text-muted-foreground">{order.email}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={order.status === "cancelled" ? "destructive" : "outline"}>
                      {statusLabel(order.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={order.payment_status === "paid" ? "stock" : "outline"}>
                      {order.payment_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button size="sm" variant="subtle" onClick={() => setOpenOrderId(order.id)}>
                      {t("admin.orders.open")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <OrderDetailSheet
        orderId={openOrderId}
        onClose={() => setOpenOrderId(null)}
        onChanged={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
          queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
        }}
      />
    </div>
  );
}

/** Where an order is actually fulfilled: advance status, ship, notify. */
function OrderDetailSheet({
  orderId,
  onClose,
  onChanged,
}: {
  orderId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchDetail = useServerFn(getOrderDetail);
  const transition = useServerFn(updateOrderStatus);
  const resend = useServerFn(resendEmail);

  const [nextStatus, setNextStatus] = useState<string>("");
  const [carrier, setCarrier] = useState("postnl");
  const [trackingCode, setTrackingCode] = useState("");
  const [note, setNote] = useState("");

  const { data: order, isPending } = useQuery({
    queryKey: ["admin-order", orderId],
    enabled: Boolean(orderId),
    queryFn: () => fetchDetail({ data: { orderId: orderId! } }) as Promise<OrderDetail | null>,
  });

  const mutation = useMutation({
    mutationFn: () =>
      transition({
        data: {
          orderId: orderId!,
          status: nextStatus,
          note: note || undefined,
          carrier: nextStatus === "shipped" ? carrier : undefined,
          trackingCode: nextStatus === "shipped" ? trackingCode : undefined,
        },
      }) as Promise<{ emailSent: boolean; emailSkipped: boolean; emailError: string | null }>,
    onSuccess: (result) => {
      if (result.emailSent) toast.success(t("admin.orders.statusUpdatedNotified"));
      else if (result.emailSkipped) toast.success(t("admin.orders.statusUpdatedNoEmail"));
      else if (result.emailError)
        toast.warning(`Status bijgewerkt, maar de e-mail is niet verstuurd: ${result.emailError}`);
      else toast.success(t("admin.orders.statusUpdated"));
      setNextStatus("");
      setTrackingCode("");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resendMutation = useMutation({
    mutationFn: (template: string) =>
      resend({ data: { orderId: orderId!, template } }) as Promise<{
        sent: boolean;
        skipped: boolean;
      }>,
    onSuccess: (result) => {
      toast[result.sent ? "success" : "warning"](
        result.sent ? t("admin.orders.emailResent") : t("admin.orders.emailNotConfigured"),
      );
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const available = order ? ORDER_STATUSES.filter((s) => canTransition(order.status, s)) : [];

  return (
    <Sheet open={Boolean(orderId)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="text-left">
          <SheetTitle>
            {order ? `Bestelling ${order.order_number}` : t("admin.orders.order")}
          </SheetTitle>
        </SheetHeader>

        {isPending ? (
          <p className="mt-6 text-sm text-muted-foreground">{t("admin.common.loading")}</p>
        ) : !order ? (
          <p className="mt-6 text-sm text-muted-foreground">{t("admin.orders.notFound")}</p>
        ) : (
          <div className="mt-5 space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{statusLabel(order.status)}</Badge>
              <Badge variant={order.payment_status === "paid" ? "stock" : "outline"}>
                Betaling: {order.payment_status}
              </Badge>
              {order.tracking_code ? (
                <Badge variant="secondary">
                  {CARRIER_LABELS[order.carrier ?? ""] ?? order.carrier} · {order.tracking_code}
                </Badge>
              ) : null}
            </div>

            <section>
              <h3 className="mb-2 text-sm font-bold">{t("admin.orders.products")}</h3>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between gap-3 px-3 py-2 text-sm">
                    <span>
                      {item.product_name}
                      <span className="text-muted-foreground"> × {item.quantity}</span>
                    </span>
                    <span className="tabular-nums">{formatPrice(item.line_total)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("admin.orders.subtotal")}</dt>
                  <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("admin.orders.shipping")}</dt>
                  <dd className="tabular-nums">{formatPrice(order.shipping_cost)}</dd>
                </div>
                <div className="flex justify-between font-bold">
                  <dt>{t("admin.common.total")}</dt>
                  <dd className="tabular-nums">{formatPrice(order.total)}</dd>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <dt>waarvan btw</dt>
                  <dd className="tabular-nums">{formatPrice(order.vat_amount)}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold">{t("admin.orders.shippingAddress")}</h3>
              <address className="rounded-lg border border-border bg-surface p-3 text-sm not-italic leading-relaxed">
                {order.first_name} {order.last_name}
                <br />
                {String(order.shipping_address.street ?? "")}{" "}
                {String(order.shipping_address.house_number ?? "")}
                {String(order.shipping_address.house_number_addition ?? "")}
                <br />
                {String(order.shipping_address.postal_code ?? "")}{" "}
                {String(order.shipping_address.city ?? "")}
                <br />
                {String(order.shipping_address.country ?? "")}
                <br />
                <span className="text-muted-foreground">{order.email}</span>
              </address>
              {order.customer_note ? (
                <p className="mt-2 rounded-lg bg-secondary p-3 text-sm">
                  <span className="font-semibold">{t("admin.orders.customerNote")}</span>
                  {order.customer_note}
                </p>
              ) : null}
            </section>

            {available.length > 0 ? (
              <section className="rounded-lg border border-border p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <Truck className="size-4" aria-hidden="true" />
                  {t("admin.orders.updateStatus")}
                </h3>

                <Label htmlFor="next-status" className="text-xs">
                  {t("admin.orders.newStatus")}
                </Label>
                <Select value={nextStatus} onValueChange={setNextStatus}>
                  <SelectTrigger id="next-status" className="mt-1">
                    <SelectValue placeholder={t("admin.orders.chooseStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {nextStatus === "shipped" ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="carrier" className="text-xs">
                        {t("admin.orders.carrier")}
                      </Label>
                      <Select value={carrier} onValueChange={setCarrier}>
                        <SelectTrigger id="carrier" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CARRIERS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {CARRIER_LABELS[c] ?? c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tracking" className="text-xs">
                        {t("admin.orders.trackingCode")}
                      </Label>
                      <Input
                        id="tracking"
                        value={trackingCode}
                        onChange={(event) => setTrackingCode(event.target.value)}
                        placeholder="3STBJG123456789"
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : null}

                <Label htmlFor="note" className="mt-3 block text-xs">
                  {t("admin.orders.internalNote")}
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  className="mt-1"
                />

                <Button
                  className="mt-3 w-full"
                  disabled={
                    !nextStatus ||
                    mutation.isPending ||
                    (nextStatus === "shipped" && (!carrier.trim() || !trackingCode.trim()))
                  }
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending ? t("admin.common.busy") : t("admin.orders.updateStatus")}
                </Button>
                {nextStatus === "shipped" || nextStatus === "cancelled" ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("admin.orders.autoEmail")}
                  </p>
                ) : null}
              </section>
            ) : (
              <p className="rounded-lg border border-border bg-surface p-3 text-sm text-muted-foreground">
                Deze bestelling is {statusLabel(order.status)} en kan niet verder worden bijgewerkt.
              </p>
            )}

            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Mail className="size-4" aria-hidden="true" />
                {t("admin.orders.sentEmails")}
              </h3>
              {order.emails.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.orders.noEmails")}</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {order.emails.map((mail, index) => (
                    <li key={index} className="flex items-center justify-between gap-2">
                      <span>{EMAIL_LABELS[mail.template] ?? mail.template}</span>
                      <span className="text-xs text-muted-foreground">
                        {mail.status} · {new Date(mail.created_at).toLocaleString("nl-NL")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="subtle"
                  disabled={resendMutation.isPending}
                  onClick={() => resendMutation.mutate("order_confirmation")}
                >
                  {t("admin.orders.resendConfirmation")}
                </Button>
                {order.tracking_code ? (
                  <Button
                    size="sm"
                    variant="subtle"
                    disabled={resendMutation.isPending}
                    onClick={() => resendMutation.mutate("order_shipped")}
                  >
                    {t("admin.orders.resendShipping")}
                  </Button>
                ) : null}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold">{t("admin.orders.history")}</h3>
              <ul className="space-y-1 text-sm">
                {order.history.map((entry, index) => (
                  <li key={index} className="flex items-start justify-between gap-3">
                    <span>
                      {statusLabel(entry.status)}
                      {entry.note ? (
                        <span className="text-muted-foreground"> — {entry.note}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString("nl-NL")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <Button variant="ghost" className="w-full" onClick={onClose}>
              <X className="size-4" />
              {t("admin.common.close")}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
