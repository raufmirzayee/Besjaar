import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  NoAccessState,
  PageHeader,
  StatusBadge,
  statusTone,
} from "@/components/admin/admin-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { getCustomerDetail, getCustomers } from "@/lib/admin-extra.functions";
import type { CustomerDetail, CustomerRow } from "@/lib/admin-extra.server";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/beheer/klanten")({
  component: CustomersPage,
});

function CustomersPage() {
  const { t } = useI18n();
  const allow = useCan();
  const fetchCustomers = useServerFn(getCustomers);
  const fetchDetail = useServerFn(getCustomerDetail);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "spent" | "orders">("recent");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin-customers", search],
    enabled: allow("customers", "view"),
    queryFn: () => fetchCustomers({ data: { search: search || null } }) as Promise<CustomerRow[]>,
  });

  const detailQuery = useQuery({
    queryKey: ["admin-customer", openId],
    enabled: Boolean(openId),
    queryFn: () => fetchDetail({ data: { id: openId! } }) as Promise<CustomerDetail>,
  });

  if (!allow("customers", "view")) return <NoAccessState module="klanten" />;

  const rows = [...(data ?? [])].sort((a, b) => {
    if (sort === "spent") return b.totalSpent - a.totalSpent;
    if (sort === "orders") return b.orderCount - a.orderCount;
    return (b.lastOrderAt ?? b.created_at) > (a.lastOrderAt ?? a.created_at) ? 1 : -1;
  });

  const totalRevenue = rows.reduce((s, c) => s + c.totalSpent, 0);
  const withOrders = rows.filter((c) => c.orderCount > 0).length;

  return (
    <div>
      <PageHeader title={t("admin.cust.title")} description={t("admin.cust.subtitle")} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("admin.cust.title")} value={String(rows.length)} />
        <MetricCard label={t("admin.cust.withOrders")} value={String(withOrders)} />
        <MetricCard label={t("admin.cust.totalRevenue")} value={formatPrice(totalRevenue)} />
        <MetricCard
          label={t("admin.cust.newsletter")}
          value={String(rows.filter((c) => c.newsletter_opt_in).length)}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.cust.search")}
          className="max-w-xs"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          aria-label={t("admin.cust.sort")}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="recent">{t("admin.cust.sortRecent")}</option>
          <option value="spent">{t("admin.cust.sortHighestSpend")}</option>
          <option value="orders">{t("admin.cust.sortMostOrders")}</option>
        </select>
      </div>

      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : null}
      {data && rows.length === 0 ? <EmptyState title={t("admin.cust.empty")} /> : null}

      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">{t("admin.orders.customer")}</th>
                <th className="p-3">{t("admin.cust.contact")}</th>
                <th className="p-3 text-right">{t("admin.nav.orders")}</th>
                <th className="p-3 text-right">{t("admin.cust.spent")}</th>
                <th className="p-3 text-right">{t("admin.cust.avgOrder")}</th>
                <th className="p-3">{t("admin.cust.lastOrder")}</th>
                <th className="p-3 text-right">{t("admin.common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="p-3">
                    <p className="font-medium">
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                        t("admin.cust.unnamed")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Klant sinds {new Date(c.created_at).toLocaleDateString("nl-NL")}
                    </p>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    <p>{c.email ?? "—"}</p>
                    <p className="text-xs">{c.phone ?? ""}</p>
                  </td>
                  <td className="p-3 text-right">{c.orderCount}</td>
                  <td className="p-3 text-right font-medium">{formatPrice(c.totalSpent)}</td>
                  <td className="p-3 text-right">{formatPrice(c.averageOrderValue)}</td>
                  <td className="p-3 text-muted-foreground">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("nl-NL") : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setOpenId(c.id)}>
                      {t("admin.cust.profileTab")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Dialog open={Boolean(openId)} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.cust.profile")}</DialogTitle>
          </DialogHeader>
          {detailQuery.isPending ? <LoadingState /> : null}
          {detailQuery.error ? <ErrorState message={(detailQuery.error as Error).message} /> : null}
          {detailQuery.data ? (
            <div className="space-y-5 text-sm">
              <div>
                <p className="font-medium">
                  {[detailQuery.data.customer.first_name, detailQuery.data.customer.last_name]
                    .filter(Boolean)
                    .join(" ") || t("admin.cust.unnamed")}
                </p>
                <p className="text-muted-foreground">{detailQuery.data.customer.email}</p>
              </div>

              <section>
                <h3 className="mb-2 font-semibold">{t("admin.cust.addresses")}</h3>
                {detailQuery.data.addresses.length ? (
                  <ul className="space-y-1 text-muted-foreground">
                    {detailQuery.data.addresses.map((a) => (
                      <li key={a.id}>
                        {a.street} {a.house_number}
                        {a.house_number_addition ?? ""}, {a.postal_code} {a.city} ({a.country})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{t("admin.cust.noAddresses")}</p>
                )}
              </section>

              <section>
                <h3 className="mb-2 font-semibold">{t("admin.nav.orders")}</h3>
                {detailQuery.data.orders.length ? (
                  <ul className="divide-y divide-border">
                    {detailQuery.data.orders.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-2 py-2">
                        <span className="font-medium">{o.order_number}</span>
                        <span className="flex items-center gap-2">
                          <StatusBadge tone={statusTone(o.status)} label={o.status} />
                          {formatPrice(Number(o.total))}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{t("admin.cust.noOrders")}</p>
                )}
              </section>

              <div className="grid gap-4 sm:grid-cols-3">
                <section>
                  <h3 className="mb-1 font-semibold">{t("admin.nav.returns")}</h3>
                  <p className="text-muted-foreground">{detailQuery.data.returns.length}</p>
                </section>
                <section>
                  <h3 className="mb-1 font-semibold">{t("admin.nav.reviews")}</h3>
                  <p className="text-muted-foreground">{detailQuery.data.reviews.length}</p>
                </section>
                <section>
                  <h3 className="mb-1 font-semibold">{t("admin.cust.support")}</h3>
                  <p className="text-muted-foreground">{detailQuery.data.tickets.length}</p>
                </section>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
