import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminProducts } from "@/lib/admin.functions";
import type { AdminProduct } from "@/lib/admin.server";
import { importProductsCsv } from "@/lib/bulk.functions";
import { BULK_TEMPLATE_HEADER } from "@/lib/bulk-products";
import { csvToObjects, downloadCsv, toCsv } from "@/lib/csv";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/beheer/import")({
  head: () => ({
    meta: [
      { title: "Import & export — Besjaar beheer" },
      {
        name: "description",
        content: "Werk prijzen, voorraad en status van het volledige assortiment bij via CSV.",
      },
      { property: "og:title", content: "Import & export — Besjaar beheer" },
      { property: "og:description", content: "Bulkbeheer van producten via CSV-bestanden." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ImportPage,
});

type ImportResult = {
  applied: boolean;
  errors: { line: number; message: string }[];
  updated: number;
  skipped: { sku: string; reason: string }[];
  stockChanges: number;
};

function ImportPage() {
  const fetchProducts = useServerFn(getAdminProducts);
  const runImport = useServerFn(importProductsCsv);
  const fileInput = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const productsQuery = useQuery({
    queryKey: ["admin-products", ""],
    queryFn: () => fetchProducts({ data: {} }) as Promise<AdminProduct[]>,
  });

  const products = productsQuery.data ?? [];

  const importMutation = useMutation({
    mutationFn: (records: Record<string, string>[]) =>
      runImport({ data: { records } }) as Promise<ImportResult>,
    onSuccess: (data) => {
      setResult(data);
      if (data.applied) {
        toast.success(`${data.updated} producten bijgewerkt`);
        productsQuery.refetch();
      } else {
        toast.error("Import gestopt: los eerst de fouten op");
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function exportProducts() {
    const rows: (string | number | null)[][] = [
      BULK_TEMPLATE_HEADER,
      ...products.map((p) => [
        p.internal_sku ?? "",
        p.name,
        p.regular_price.toFixed(2).replace(".", ","),
        p.sale_price === null ? "" : p.sale_price.toFixed(2).replace(".", ","),
        p.stock_quantity,
        p.status,
      ]),
    ];
    downloadCsv(`besjaar-producten-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  }

  function downloadTemplate() {
    downloadCsv(
      "besjaar-import-sjabloon.csv",
      toCsv([
        BULK_TEMPLATE_HEADER,
        ["BSJ-0001", "Voorbeeldproduct", "29,99", "19,99", "25", "active"],
      ]),
    );
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const records = csvToObjects(text);
    if (records.length === 0) {
      toast.error("Het bestand bevat geen rijen");
      return;
    }
    setResult(null);
    importMutation.mutate(records);
    if (fileInput.current) fileInput.current.value = "";
  }

  const totalStockValue = products.reduce(
    (sum, p) => sum + p.stock_quantity * (p.sale_price ?? p.regular_price),
    0,
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold">Import &amp; export</h1>
        <p className="text-sm text-muted-foreground">
          Werk prijzen, voorraad, naam en status van het assortiment in bulk bij. Producten worden
          gematcht op interne SKU; lege cellen blijven ongewijzigd.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Producten</p>
          <p className="font-display text-2xl font-bold">{products.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Zonder SKU</p>
          <p className="font-display text-2xl font-bold">
            {products.filter((p) => !p.internal_sku).length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Voorraadwaarde (verkoop)</p>
          <p className="font-display text-2xl font-bold">{formatPrice(totalStockValue)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={exportProducts} disabled={products.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Exporteer assortiment
        </Button>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" /> Download sjabloon
        </Button>
        <Button
          variant="secondary"
          onClick={() => fileInput.current?.click()}
          disabled={importMutation.isPending}
        >
          <Upload className="mr-2 h-4 w-4" />
          {importMutation.isPending ? "Bezig met importeren…" : "Importeer CSV"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFile}
        />
      </div>

      <div className="rounded-xl border bg-card p-4 text-sm">
        <p className="font-semibold">Kolommen</p>
        <p className="mt-1 text-muted-foreground">
          <code>sku</code>; <code>naam</code>; <code>prijs</code>; <code>actieprijs</code>;{" "}
          <code>voorraad</code>; <code>status</code> (draft, active of archived). Scheidingsteken is
          een puntkomma, decimalen mogen met komma. Maximaal 2000 regels per keer.
        </p>
      </div>

      {result && (
        <div className="space-y-4">
          {result.errors.length > 0 && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="text-sm font-semibold text-destructive">
                {result.errors.length} fout(en) — er is niets gewijzigd
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {result.errors.slice(0, 25).map((e) => (
                  <li key={`${e.line}-${e.message}`}>
                    Regel {e.line}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.applied && (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap gap-2">
                <Badge>{result.updated} bijgewerkt</Badge>
                <Badge variant="secondary">{result.stockChanges} voorraadmutaties</Badge>
                {result.skipped.length > 0 && (
                  <Badge variant="outline">{result.skipped.length} overgeslagen</Badge>
                )}
              </div>
              {result.skipped.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {result.skipped.slice(0, 25).map((s) => (
                    <li key={s.sku}>
                      {s.sku}: {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
