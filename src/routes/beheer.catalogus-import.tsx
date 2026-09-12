import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Download, FileUp, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CATALOGUE_IMPORT_TEMPLATE_HEADER,
  type CatalogueImportError,
} from "@/lib/catalogue-import";
import { useI18n } from "@/lib/i18n";
import { importCatalogueCsv, validateCatalogueCsv } from "@/lib/catalogue-import.functions";
import { downloadCsv, toCsv } from "@/lib/csv";

export const Route = createFileRoute("/beheer/catalogus-import")({
  head: () => ({
    meta: [
      { title: "Catalogus importeren — Besjaar beheer" },
      {
        name: "description",
        content: "Importeer of werk het productassortiment bij vanuit een CSV-bestand.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CatalogueImportPage,
});

type Report = {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  totalLines: number;
  duplicates: string[];
  errors: CatalogueImportError[];
};

type Validation = {
  valid: number;
  duplicates: string[];
  errors: CatalogueImportError[];
  totalLines: number;
};

function CatalogueImportPage() {
  const { t } = useI18n();
  const runImport = useServerFn(importCatalogueCsv);
  const runValidate = useServerFn(validateCatalogueCsv);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingCsv, setPendingCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  const validateMutation = useMutation({
    mutationFn: (csv: string) => runValidate({ data: { csv } }) as Promise<Validation>,
    onSuccess: setValidation,
    onError: (error: Error) => toast.error(error.message),
  });

  const importMutation = useMutation({
    mutationFn: (csv: string) => runImport({ data: { csv } }) as Promise<Report>,
    onSuccess: (data) => {
      setReport(data);
      setValidation(null);
      setPendingCsv(null);
      setFileName(null);
      toast.success(
        `${data.imported} nieuw, ${data.updated} bijgewerkt, ${data.skipped} overgeslagen`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setReport(null);
    setPendingCsv(text);
    setFileName(file.name);
    validateMutation.mutate(text);
    if (fileInput.current) fileInput.current.value = "";
  }

  function downloadTemplate() {
    downloadCsv(
      "besjaar-catalogus-sjabloon.csv",
      toCsv([
        CATALOGUE_IMPORT_TEMPLATE_HEADER,
        [
          "9300000250840359",
          "Hoofdlamp LED Oplaadbaar – 1000 Lumen",
          "besjaar-hoofdlamp-led-oplaadbaar-1000-lumen",
          "Besjaar",
          "Kamperen & Outdoor",
          "15,99",
          "",
          "25",
          "31",
          "Op voorraad",
          "https://voorbeeld.nl/afbeelding.jpg",
          "https://voorbeeld.nl/bron",
          "1000 lumen · 100 meter bereik",
          "Besjaar Hoofdlamp - LED oplaadbaar - 1000 lumen",
        ],
      ]),
    );
  }

  const blocking = validation ? validation.errors.filter((e) => e.line > 1) : [];
  const canImport = Boolean(pendingCsv && validation && validation.valid > 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold">{t("admin.cimp.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Voeg producten toe of werk ze bij vanuit een CSV-bestand. Producten worden gematcht op{" "}
          <strong>product_id</strong> — hetzelfde bestand twee keer importeren maakt dus geen
          dubbele producten aan, maar werkt de bestaande bij.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Button variant="subtle" onClick={downloadTemplate}>
          <Download className="size-4" />
          {t("admin.cimp.template")}
        </Button>
        <Button onClick={() => fileInput.current?.click()} disabled={validateMutation.isPending}>
          <FileUp className="size-4" />
          {validateMutation.isPending ? t("admin.cimp.checking") : t("admin.cimp.chooseFile")}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFile}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <p className="font-semibold">{t("admin.cimp.columns")}</p>
        <p className="mt-1 text-muted-foreground">
          {CATALOGUE_IMPORT_TEMPLATE_HEADER.map((column, index) => (
            <span key={column}>
              <code>{column}</code>
              {index < CATALOGUE_IMPORT_TEMPLATE_HEADER.length - 1 ? "; " : ""}
            </span>
          ))}
        </p>
        <p className="mt-2 text-muted-foreground">
          {t("admin.cimp.required")}
          <code>product_id</code>, <code>naam</code>, <code>merk</code>, <code>categorie</code> en{" "}
          <code>prijs</code>. Puntkomma, komma of tab als scheidingsteken; decimalen mogen met een
          komma. <code>adviesprijs</code> wordt alleen als korting getoond wanneer die hoger is dan
          de verkoopprijs.
        </p>
      </div>

      {/* Dry run: the admin sees exactly what will happen before anything is
          written to the catalogue. */}
      {validation ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold">
            Controle van {fileName ?? "het bestand"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="stock">{validation.valid} geldige regels</Badge>
            {validation.duplicates.length > 0 ? (
              <Badge variant="outline">
                {validation.duplicates.length} dubbele product_id&apos;s overgeslagen
              </Badge>
            ) : null}
            {blocking.length > 0 ? (
              <Badge variant="destructive">{blocking.length} regels met fouten</Badge>
            ) : null}
          </div>

          {validation.errors.length > 0 ? (
            <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto text-sm text-muted-foreground">
              {validation.errors.slice(0, 50).map((error, index) => (
                <li key={`${error.line}-${index}`}>
                  {error.line > 0 ? `Regel ${error.line}: ` : ""}
                  {error.product_id ? `${error.product_id} — ` : ""}
                  {error.message}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              disabled={!canImport || importMutation.isPending}
              onClick={() => pendingCsv && importMutation.mutate(pendingCsv)}
            >
              <Upload className="size-4" />
              {importMutation.isPending
                ? t("admin.cimp.importing")
                : `Importeer ${validation.valid} producten`}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setValidation(null);
                setPendingCsv(null);
                setFileName(null);
              }}
            >
              {t("admin.common.cancel")}
            </Button>
          </div>
        </section>
      ) : null}

      {report ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            {t("admin.cimp.result")}
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t("admin.cimp.imported"), value: report.imported },
              { label: t("admin.cimp.updated"), value: report.updated },
              { label: t("admin.cimp.skipped"), value: report.skipped },
              { label: t("admin.cimp.failed"), value: report.failed },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-surface p-4">
                <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="font-display text-2xl font-bold tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>

          {report.duplicates.length > 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Dubbele product_id&apos;s in het bestand (één keer geïmporteerd):{" "}
              {report.duplicates.slice(0, 20).join(", ")}
              {report.duplicates.length > 20 ? "…" : ""}
            </p>
          ) : null}

          {report.errors.length > 0 ? (
            <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto text-sm text-muted-foreground">
              {report.errors.slice(0, 50).map((error, index) => (
                <li key={`${error.line}-${index}`}>
                  {error.line > 0 ? `Regel ${error.line}: ` : ""}
                  {error.product_id ? `${error.product_id} — ` : ""}
                  {error.message}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
