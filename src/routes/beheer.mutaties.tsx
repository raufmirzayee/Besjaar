import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NoAccessState,
  PageHeader,
  Pager,
} from "@/components/admin/admin-ui";
import { useCan } from "@/components/admin/admin-shell";
import { getMovements } from "@/lib/admin-extra.functions";
import { MOVEMENT_REASON_LABELS, type MovementRow } from "@/lib/admin-extra.server";
import { toCsv, downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/beheer/mutaties")({
  component: MovementsPage,
});

const PAGE_SIZE = 25;

function MovementsPage() {
  const allow = useCan();
  const fetchMovements = useServerFn(getMovements);

  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("alle");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin-movements", search, reason, from, to, page],
    enabled: allow("stock_movements", "view"),
    queryFn: () =>
      fetchMovements({
        data: {
          search: search || null,
          reason,
          from: from ? new Date(from).toISOString() : null,
          to: to ? new Date(`${to}T23:59:59`).toISOString() : null,
          page,
          pageSize: PAGE_SIZE,
        },
      }) as Promise<{ rows: MovementRow[]; total: number }>,
  });

  if (!allow("stock_movements", "view")) return <NoAccessState module="voorraadmutaties" />;

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Voorraadmutaties"
        description="Volledige historie van elke voorraadwijziging met reden, referentie en gebruiker."
        actions={
          rows.length ? (
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  "voorraadmutaties.csv",
                  toCsv([
                    [
                      "datum",
                      "product",
                      "ean",
                      "reden",
                      "wijziging",
                      "referentie",
                      "notitie",
                      "gebruiker",
                    ],
                    ...rows.map((r) => [
                      r.created_at,
                      r.product_name ?? "",
                      r.ean ?? "",
                      MOVEMENT_REASON_LABELS[r.reason] ?? r.reason,
                      r.quantity_change,
                      r.reference_type ?? "",
                      r.note ?? "",
                      r.created_by_email ?? "",
                    ]),
                  ]),
                )
              }
            >
              Exporteer CSV
            </Button>
          ) : null
        }
      />

      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="mv-search">Zoeken</Label>
          <Input
            id="mv-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Product, EAN of notitie"
          />
        </div>
        <div>
          <Label htmlFor="mv-reason">Reden</Label>
          <select
            id="mv-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setPage(1);
            }}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="alle">Alle redenen</option>
            {Object.entries(MOVEMENT_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="mv-from">Vanaf</Label>
          <Input
            id="mv-from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div>
          <Label htmlFor="mv-to">Tot en met</Label>
          <Input
            id="mv-to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : null}
      {data && rows.length === 0 ? (
        <EmptyState
          title="Geen mutaties gevonden"
          description="Pas de filters aan of kies een andere periode."
        />
      ) : null}

      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Datum</th>
                <th className="p-3">Product</th>
                <th className="p-3">Reden</th>
                <th className="p-3 text-right">Wijziging</th>
                <th className="p-3">Referentie</th>
                <th className="p-3">Gebruiker</th>
                <th className="p-3">Notitie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("nl-NL")}
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{m.product_name ?? "Onbekend product"}</p>
                    <p className="text-xs text-muted-foreground">{m.ean ?? ""}</p>
                  </td>
                  <td className="p-3">{MOVEMENT_REASON_LABELS[m.reason] ?? m.reason}</td>
                  <td
                    className={`p-3 text-right font-semibold ${
                      m.quantity_change < 0 ? "text-destructive" : "text-emerald-600"
                    }`}
                  >
                    {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{m.reference_type ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {m.created_by_email ?? "systeem"}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{m.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Pager page={page} pageCount={pageCount} total={total} onPage={setPage} />
    </div>
  );
}
