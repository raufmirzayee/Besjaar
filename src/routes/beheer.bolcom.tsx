import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatPrice } from "@/lib/format";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "@/lib/bol.server";
import {
  getBolOverview,
  removeBolListing,
  saveBolListing,
  startBolSync,
} from "@/lib/bol.functions";

export const Route = createFileRoute("/beheer/bolcom")({
  head: () => ({
    meta: [
      { title: "bol.com koppeling — Besjaar beheer" },
      {
        name: "description",
        content: "Beheer de bol.com Retailer API-koppeling, mapping en synchronisatie.",
      },
      { property: "og:title", content: "bol.com koppeling — Besjaar beheer" },
      {
        property: "og:description",
        content: "Synchroniseer bestellingen, voorraad en verzendingen met bol.com.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BolPage,
});

const JOB_TYPES: ("orders" | "stock" | "offers" | "shipments")[] = [
  "orders",
  "stock",
  "offers",
  "shipments",
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" });
}

function BolPage() {
  const queryClient = useQueryClient();
  const fetchOverview = useServerFn(getBolOverview);
  const saveListing = useServerFn(saveBolListing);
  const deleteListing = useServerFn(removeBolListing);
  const runSync = useServerFn(startBolSync);

  const [ean, setEan] = useState("");
  const [offerId, setOfferId] = useState("");
  const [price, setPrice] = useState("");

  const overview = useQuery({
    queryKey: ["bol-overview"],
    queryFn: () => fetchOverview({}),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["bol-overview"] });

  const createMutation = useMutation({
    mutationFn: () =>
      saveListing({
        data: {
          ean: ean.trim() || null,
          external_offer_id: offerId.trim() || null,
          channel_price: price ? Number(price) : null,
        },
      }),
    onSuccess: () => {
      toast.success("Koppeling opgeslagen");
      setEan("");
      setOfferId("");
      setPrice("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (input: {
      id: string;
      stock_sync_enabled?: boolean;
      price_sync_enabled?: boolean;
    }) => saveListing({ data: input }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteListing({ data: { id } }),
    onSuccess: () => {
      toast.success("Koppeling verwijderd");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const syncMutation = useMutation({
    mutationFn: (jobType: "orders" | "stock" | "offers" | "shipments") =>
      runSync({ data: { jobType } }),
    onSuccess: (result) => {
      const res = result as { status: string; processed: number; failed: number; error?: string };
      if (res.status === "failed") toast.error(res.error ?? "Synchronisatie mislukt");
      else
        toast.success(
          `Synchronisatie ${JOB_STATUS_LABELS[res.status] ?? res.status}: ${res.processed} verwerkt, ${res.failed} mislukt`,
        );
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (overview.isPending) {
    return <p className="text-sm text-muted-foreground">bol.com-gegevens laden…</p>;
  }
  if (overview.error) {
    return <p className="text-sm text-destructive">{(overview.error as Error).message}</p>;
  }

  const data = overview.data!;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {data.status.connected ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            )}
            <div>
              <h2 className="font-display text-lg font-bold">bol.com Retailer API</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{data.status.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Laatste geslaagde synchronisatie: {formatDate(data.status.lastSyncAt)}
              </p>
            </div>
          </div>
          <Badge variant={data.status.connected ? "secondary" : "destructive"}>
            {data.status.connected
              ? "Verbonden"
              : data.status.configured
                ? "Fout"
                : "Niet ingesteld"}
          </Badge>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {JOB_TYPES.map((type) => (
            <Button
              key={type}
              variant={type === "orders" ? "default" : "outline"}
              size="sm"
              disabled={syncMutation.isPending}
              onClick={() => syncMutation.mutate(type)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {JOB_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold">Productkoppelingen</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Koppel een EAN aan een bol.com-aanbieding. Voorraad wordt automatisch verminderd met de
          veiligheidsvoorraad voordat het naar bol.com gaat.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="bol-ean">EAN</Label>
            <Input
              id="bol-ean"
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              placeholder="8710000000000"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bol-offer">bol.com offer-ID</Label>
            <Input id="bol-offer" value={offerId} onChange={(e) => setOfferId(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bol-price">Kanaalprijs (€)</Label>
            <Input
              id="bol-price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={createMutation.isPending || (!ean.trim() && !offerId.trim())}
              onClick={() => createMutation.mutate()}
            >
              Koppeling toevoegen
            </Button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="pb-2">Product / EAN</th>
                <th className="pb-2">Offer-ID</th>
                <th className="pb-2">Voorraad</th>
                <th className="pb-2">Prijs</th>
                <th className="pb-2">Voorraadsync</th>
                <th className="pb-2">Laatste sync</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {data.listings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Nog geen koppelingen. Voeg er één toe of haal de aanbiedingen op bij bol.com.
                  </td>
                </tr>
              )}
              {data.listings.map((listing) => (
                <tr key={listing.id} className="border-t border-border">
                  <td className="py-3">
                    <div className="font-medium">{listing.product_name ?? "Niet gekoppeld"}</div>
                    <div className="text-xs text-muted-foreground">{listing.ean ?? "—"}</div>
                  </td>
                  <td className="py-3 text-xs">{listing.external_offer_id ?? "—"}</td>
                  <td className="py-3">{listing.stock_quantity ?? "—"}</td>
                  <td className="py-3">
                    {listing.channel_price !== null
                      ? formatPrice(listing.channel_price)
                      : listing.sale_price !== null
                        ? formatPrice(listing.sale_price)
                        : listing.regular_price !== null
                          ? formatPrice(listing.regular_price)
                          : "—"}
                  </td>
                  <td className="py-3">
                    <Switch
                      checked={listing.stock_sync_enabled}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: listing.id, stock_sync_enabled: checked })
                      }
                    />
                  </td>
                  <td className="py-3 text-xs">
                    {formatDate(listing.last_synced_at)}
                    {listing.last_sync_error && (
                      <div className="text-destructive">{listing.last_sync_error}</div>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMutation.mutate(listing.id)}
                      aria-label="Koppeling verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Synchronisatie-opdrachten</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.jobs.length === 0 && (
              <li className="text-muted-foreground">Nog geen synchronisaties uitgevoerd.</li>
            )}
            {data.jobs.map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2"
              >
                <div>
                  <div className="font-medium">{JOB_TYPE_LABELS[job.job_type] ?? job.job_type}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(job.created_at)} · poging {job.attempt} · {job.processed_count}{" "}
                    verwerkt, {job.failed_count} mislukt
                  </div>
                </div>
                <Badge
                  variant={
                    job.status === "success"
                      ? "secondary"
                      : job.status === "failed"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {JOB_STATUS_LABELS[job.status] ?? job.status}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Logboek</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.logs.length === 0 && (
              <li className="text-muted-foreground">Nog geen logregels.</li>
            )}
            {data.logs.map((entry) => (
              <li key={entry.id} className="border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      entry.level === "error"
                        ? "destructive"
                        : entry.level === "warn"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {entry.level}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
                <p className="mt-1">{entry.message}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
