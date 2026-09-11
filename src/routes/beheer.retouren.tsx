import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { getAdminReturns, updateReturn } from "@/lib/returns.functions";
import { RETURN_STATUSES, RETURN_STATUS_LABELS, type ReturnStatus } from "@/lib/admin-labels";

export const Route = createFileRoute("/beheer/retouren")({
  head: () => ({
    meta: [
      { title: "Retouren beheren — Besjaar" },
      {
        name: "description",
        content: "Beoordeel retouraanvragen, boek retour in en betaal terug.",
      },
      { property: "og:title", content: "Retouren beheren — Besjaar" },
      { property: "og:description", content: "Retourworkflow voor de Besjaar klantenservice." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminReturnsPage,
});

function AdminReturnsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchReturns = useServerFn(getAdminReturns);
  const save = useServerFn(updateReturn);

  const [status, setStatus] = useState("alle");
  const [drafts, setDrafts] = useState<
    Record<
      string,
      { staffNote?: string; refundAmount?: string; trackingCode?: string; restock?: boolean }
    >
  >({});

  const returnsQuery = useQuery({
    queryKey: ["admin-returns", status],
    queryFn: () => fetchReturns({ data: { status } }),
  });

  const mutation = useMutation({
    mutationFn: (input: {
      returnId: string;
      status?: ReturnStatus;
      staffNote?: string | null;
      refundAmount?: number | null;
      trackingCode?: string | null;
      restock?: boolean;
    }) => save({ data: input }),
    onSuccess: () => {
      toast.success(t("admin.ret.updated"));
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = returnsQuery.data ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{t("admin.ret.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {rows.length} retour(en) · beoordeel, boek in en betaal terug
          </p>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">{t("admin.ret.allStatuses")}</SelectItem>
            {RETURN_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {RETURN_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {returnsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">{t("admin.ret.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.ret.empty")}</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((ret) => {
            const draft = drafts[ret.id] ?? {};
            const suggested = ret.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
            return (
              <li key={ret.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{ret.return_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Bestelling {ret.order_number ?? "—"} · {ret.email} ·{" "}
                      {new Date(ret.requested_at).toLocaleDateString("nl-NL")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Reden: {ret.reason}</p>
                    {ret.customer_note && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Klant: {ret.customer_note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">{RETURN_STATUS_LABELS[ret.status]}</Badge>
                    <p className="text-sm font-semibold">{formatPrice(suggested)}</p>
                  </div>
                </div>

                <ul className="mt-3 space-y-1 text-sm">
                  {ret.items.map((item) => (
                    <li key={item.id} className="text-muted-foreground">
                      {item.quantity}× {item.product_name} — {formatPrice(item.unit_price)}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t("admin.ret.refundAmount")}</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={draft.refundAmount ?? (ret.refund_amount ?? suggested).toFixed(2)}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [ret.id]: { ...draft, refundAmount: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t("admin.ret.tracking")}</label>
                    <Input
                      value={draft.trackingCode ?? ret.tracking_code ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [ret.id]: { ...draft, trackingCode: e.target.value },
                        }))
                      }
                      placeholder="3SBESJ…"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t("admin.ret.note")}</label>
                    <Textarea
                      rows={2}
                      value={draft.staffNote ?? ret.staff_note ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [ret.id]: { ...draft, staffNote: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mutation.isPending}
                    onClick={() =>
                      mutation.mutate({
                        returnId: ret.id,
                        staffNote: draft.staffNote ?? ret.staff_note ?? null,
                        trackingCode: draft.trackingCode ?? ret.tracking_code ?? null,
                        refundAmount:
                          draft.refundAmount !== undefined
                            ? Number(draft.refundAmount)
                            : ret.refund_amount,
                      })
                    }
                  >
                    {t("admin.ret.save")}
                  </Button>

                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={draft.restock ?? true}
                      onCheckedChange={(checked) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [ret.id]: { ...draft, restock: checked === true },
                        }))
                      }
                    />
                    {t("admin.ret.restock")}
                  </label>

                  <div className="ml-auto flex flex-wrap gap-2">
                    {(
                      [
                        ["approved", t("admin.ret.approve")],
                        ["rejected", t("admin.ret.reject")],
                        ["received", t("admin.ret.received")],
                        ["refunded", t("admin.ret.refunded")],
                      ] as [ReturnStatus, string][]
                    ).map(([next, label]) => (
                      <Button
                        key={next}
                        size="sm"
                        variant={next === "rejected" ? "outline" : "default"}
                        disabled={mutation.isPending || ret.status === next}
                        onClick={() =>
                          mutation.mutate({
                            returnId: ret.id,
                            status: next,
                            restock: next === "received" ? (draft.restock ?? true) : false,
                            staffNote: draft.staffNote ?? ret.staff_note ?? null,
                            refundAmount:
                              draft.refundAmount !== undefined
                                ? Number(draft.refundAmount)
                                : next === "refunded"
                                  ? (ret.refund_amount ?? suggested)
                                  : ret.refund_amount,
                          })
                        }
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
