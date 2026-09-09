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
import { getCustomerDetail, getCustomers } from "@/lib/admin-extra.functions";
import type { CustomerDetail, CustomerRow } from "@/lib/admin-extra.server";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/beheer/klanten")({
  component: CustomersPage,
});

function CustomersPage() {
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
      <PageHeader
        title="Klanten"
        description="Klantprofielen met bestelhistorie, retouren, reviews en supportvragen."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Klanten" value={String(rows.length)} />
        <MetricCard label="Met bestellingen" value={String(withOrders)} />
        <MetricCard label="Totale omzet" value={formatPrice(totalRevenue)} />
        <MetricCard
          label="Nieuwsbrief"
          value={String(rows.filter((c) => c.newsletter_opt_in).length)}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op naam, e-mail of telefoon"
          className="max-w-xs"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          aria-label="Sorteren"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="recent">Meest recent actief</option>
          <option value="spent">Hoogste besteding</option>
          <option value="orders">Meeste bestellingen</option>
        </select>
      </div>

      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : null}
      {data && rows.length === 0 ? <EmptyState title="Geen klanten gevonden" /> : null}

      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Klant</th>
                <th className="p-3">Contact</th>
                <th className="p-3 text-right">Orders</th>
                <th className="p-3 text-right">Besteed</th>
                <th className="p-3 text-right">Gem. order</th>
                <th className="p-3">Laatste order</th>
                <th className="p-3 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="p-3">
                    <p className="font-medium">
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") || "Naamloos"}
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
                      Profiel
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
            <DialogTitle>Klantprofiel</DialogTitle>
          </DialogHeader>
          {detailQuery.isPending ? <LoadingState /> : null}
          {detailQuery.error ? <ErrorState message={(detailQuery.error as Error).message} /> : null}
          {detailQuery.data ? (
            <div className="space-y-5 text-sm">
              <div>
                <p className="font-medium">
                  {[detailQuery.data.customer.first_name, detailQuery.data.customer.last_name]
                    .filter(Boolean)
                    .join(" ") || "Naamloos"}
                </p>
                <p className="text-muted-foreground">{detailQuery.data.customer.email}</p>
              </div>

              <section>
                <h3 className="mb-2 font-semibold">Adressen</h3>
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
                  <p className="text-muted-foreground">Geen adressen bekend.</p>
                )}
              </section>

              <section>
                <h3 className="mb-2 font-semibold">Bestellingen</h3>
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
                  <p className="text-muted-foreground">Nog geen bestellingen.</p>
                )}
              </section>

              <div className="grid gap-4 sm:grid-cols-3">
                <section>
                  <h3 className="mb-1 font-semibold">Retouren</h3>
                  <p className="text-muted-foreground">{detailQuery.data.returns.length}</p>
                </section>
                <section>
                  <h3 className="mb-1 font-semibold">Reviews</h3>
                  <p className="text-muted-foreground">{detailQuery.data.reviews.length}</p>
                </section>
                <section>
                  <h3 className="mb-1 font-semibold">Supportvragen</h3>
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
