import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NoAccessState,
  PageHeader,
  Pager,
  StatusBadge,
  statusTone,
} from "@/components/admin/admin-ui";
import { useCan } from "@/components/admin/admin-shell";
import type { TranslationKey } from "@/lib/translations";
import { useI18n } from "@/lib/i18n";
import { downloadCsv, toCsv } from "@/lib/csv";
import { adjustStock } from "@/lib/admin.functions";
import {
  bulkProductAction,
  changeProductStatus,
  copyProduct,
  exportProducts,
  importProducts,
  listImportRuns,
  createProductImage,
  getProduct,
  getProductOptions,
  listProducts,
  makeMainImage,
  removeListing,
  removeProductImage,
  removeVariant,
  reorderProductImage,
  upsertListing,
  upsertProduct,
  upsertVariant,
} from "@/lib/admin-products.functions";
import type {
  BulkAction,
  ImportRun,
  ProductDetailAdmin,
  ProductFilters,
  ProductPickerOptions,
  ProductRow,
  ProductSort,
} from "@/lib/admin-products.server";
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS } from "@/lib/admin-labels";
import { formatPrice } from "@/lib/format";
import { IMPORT_TEMPLATE_HEADER, type ImportRowError } from "@/lib/product-import";

type ImportReport = {
  totalLines: number;
  processed: number;
  productsUpdated: number;
  variantsUpdated: number;
  listingsUpdated: number;
  stockMutations: number;
  errors: ImportRowError[];
};

export const Route = createFileRoute("/beheer/producten")({
  component: ProductsPage,
});

const PAGE_SIZE = 25;

/** Keys, not labels: a module constant cannot call t(). */
const SORT_LABELS: Record<ProductSort, TranslationKey> = {
  naam: "admin.prod.sortNameAz",
  nieuwste: "admin.prod.sortNewest",
  "prijs-op": "admin.prod.sortPriceAsc",
  "prijs-af": "admin.prod.sortPriceDesc",
  "voorraad-op": "admin.prod.sortStockAsc",
  "voorraad-af": "admin.prod.sortStockDesc",
  verkocht: "admin.prod.sortBestSelling",
};

const EMPTY_FORM = {
  name: "",
  slug: "",
  status: "draft",
  short_name: "",
  brand_id: "",
  category_id: "",
  short_description: "",
  full_description: "",
  selling_points: "",
  specifications: "",
  ean: "",
  internal_sku: "",
  supplier_sku: "",
  regular_price: "0",
  sale_price: "",
  purchase_cost: "",
  vat_rate: "21",
  stock_quantity: "0",
  low_stock_threshold: "5",
  safety_stock: "0",
  weight: "",
  length: "",
  width: "",
  height: "",
  shipping_class: "",
  warranty_months: "24",
  return_eligible: true,
  seo_title: "",
  seo_description: "",
  search_keywords: "",
  featured: false,
  bestseller: false,
  // Which language this product's text is written in. Stated, not assumed:
  // everything used to be treated as Dutch, so a product drafted in English
  // would have had its English overwritten by a translation of an empty
  // Dutch field.
  source_locale: "nl" as "nl" | "en",
};

type FormState = typeof EMPTY_FORM;

function num(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toForm(p: ProductDetailAdmin): FormState {
  return {
    name: p.name,
    slug: p.slug,
    status: p.status,
    short_name: p.short_name ?? "",
    brand_id: p.brand_id ?? "",
    category_id: p.category_id ?? "",
    short_description: p.short_description ?? "",
    full_description: p.full_description ?? "",
    selling_points: p.selling_points.join("\n"),
    specifications: Object.entries(p.specifications)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
    ean: p.ean ?? "",
    internal_sku: p.internal_sku ?? "",
    supplier_sku: p.supplier_sku ?? "",
    regular_price: String(p.regular_price),
    sale_price: p.sale_price === null ? "" : String(p.sale_price),
    purchase_cost: p.purchase_cost === null ? "" : String(p.purchase_cost),
    vat_rate: String(p.vat_rate),
    stock_quantity: String(p.stock_quantity),
    low_stock_threshold: String(p.low_stock_threshold),
    safety_stock: String(p.safety_stock),
    weight: p.weight === null ? "" : String(p.weight),
    length: p.length === null ? "" : String(p.length),
    width: p.width === null ? "" : String(p.width),
    height: p.height === null ? "" : String(p.height),
    shipping_class: p.shipping_class ?? "",
    warranty_months: String(p.warranty_months),
    return_eligible: p.return_eligible,
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    search_keywords: p.search_keywords ?? "",
    featured: p.featured,
    bestseller: p.bestseller,
    source_locale: p.source_locale ?? "nl",
  };
}

function parseSpecs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

function ProductsPage() {
  const { t } = useI18n();
  const allow = useCan();
  const queryClient = useQueryClient();

  const fetchList = useServerFn(listProducts);
  const fetchOptions = useServerFn(getProductOptions);
  const fetchDetail = useServerFn(getProduct);
  const save = useServerFn(upsertProduct);
  const setStatus = useServerFn(changeProductStatus);
  const duplicate = useServerFn(copyProduct);

  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    status: "alle-actief",
    stock: "alle",
    sort: "naam",
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [searchInput, setSearchInput] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkKind, setBulkKind] = useState<BulkAction["kind"] | "restore" | "">("");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkMapping, setBulkMapping] = useState({ active: true, price: true, stock: true });
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);

  const query = useQuery({
    queryKey: ["admin-products-v2", filters],
    queryFn: () =>
      fetchList({
        data: {
          ...filters,
          status: filters.status === "alle-actief" ? null : filters.status,
        },
      }) as Promise<{ rows: ProductRow[]; total: number }>,
    enabled: allow("products", "view"),
  });

  const optionsQuery = useQuery({
    queryKey: ["admin-product-options"],
    queryFn: () => fetchOptions({}) as Promise<ProductPickerOptions>,
    enabled: allow("products", "view"),
  });

  const fetchImportRuns = useServerFn(listImportRuns);
  const importRunsQuery = useQuery({
    queryKey: ["admin-import-runs"],
    queryFn: () => fetchImportRuns({}) as Promise<ImportRun[]>,
    enabled: allow("products", "view"),
  });

  const detailQuery = useQuery({
    queryKey: ["admin-product-detail", openId],
    queryFn: () => fetchDetail({ data: { id: openId! } }) as Promise<ProductDetailAdmin | null>,
    enabled: Boolean(openId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products-v2"] });
    queryClient.invalidateQueries({ queryKey: ["admin-product-detail"] });
  };

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: string }) => setStatus({ data: input }),
    onSuccess: () => {
      toast.success(t("admin.prod.statusUpdated"));
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicate({ data: { id } }),
    onSuccess: (result: { id: string }) => {
      toast.success(t("admin.prod.duplicated"));
      invalidate();
      setOpenId(result.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMutation = useMutation({
    mutationFn: (form: FormState) =>
      save({
        data: {
          name: form.name,
          slug: form.slug || null,
          status: form.status,
          brand_id: form.brand_id || null,
          category_id: form.category_id || null,
          short_description: form.short_description || null,
          ean: form.ean || null,
          internal_sku: form.internal_sku || null,
          regular_price: num(form.regular_price) ?? 0,
          sale_price: num(form.sale_price),
          purchase_cost: num(form.purchase_cost),
          vat_rate: num(form.vat_rate) ?? 21,
          stock_quantity: num(form.stock_quantity) ?? 0,
          low_stock_threshold: num(form.low_stock_threshold) ?? 5,
        },
      }),
    onSuccess: (result: { id: string }) => {
      toast.success(t("admin.prod.created"));
      setCreating(false);
      invalidate();
      setOpenId(result.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runBulk = useServerFn(bulkProductAction);
  const bulkMutation = useMutation({
    mutationFn: (input: BulkAction) =>
      runBulk({ data: input }) as Promise<{ updated: number; skipped: number }>,
    onSuccess: (result) => {
      toast.success(`${result.updated} product(en) bijgewerkt`);
      setSelected([]);
      setBulkKind("");
      setBulkValue("");
      setConfirmBulk(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runExport = useServerFn(exportProducts);
  const exportMutation = useMutation({
    mutationFn: (ids: string[]) =>
      runExport({ data: { ids } }) as Promise<{ rows: (string | number | null)[][] }>,
    onSuccess: (result) => {
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`besjaar-producten-${stamp}.csv`, toCsv(result.rows));
      toast.success(`${Math.max(0, result.rows.length - 1)} regel(s) geëxporteerd`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runImport = useServerFn(importProducts);
  const importMutation = useMutation({
    mutationFn: (input: { csv: string; fileName: string }) =>
      runImport({
        data: { csv: input.csv, ids: selected, fileName: input.fileName },
      }) as Promise<ImportReport>,
    onSuccess: (report) => {
      setImportReport(report);
      if (report.errors.length) {
        toast.warning(`${report.processed} regel(s) verwerkt, ${report.errors.length} fout(en)`);
      } else {
        toast.success(`${report.processed} regel(s) verwerkt`);
      }
      invalidate();
      void importRunsQuery.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleImportFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("admin.prod.fileTooBig"));
      return;
    }
    const text = await file.text();
    importMutation.mutate({ csv: text, fileName: file.name });
  };

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const categoryOptions = optionsQuery.data?.categories ?? [];
  const brandOptions = optionsQuery.data?.brands ?? [];

  const selectedSet = new Set(selected);
  const allSelected = rows.length > 0 && rows.every((r) => selectedSet.has(r.id));
  const toggleRow = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) =>
      allSelected
        ? prev.filter((id) => !rows.some((r) => r.id === id))
        : Array.from(new Set([...prev, ...rows.map((r) => r.id)])),
    );

  const bulkPayload = (): BulkAction | null => {
    if (!selected.length) return null;
    switch (bulkKind) {
      case "status":
        return { kind: "status", ids: selected, status: "archived" };
      case "restore":
        return { kind: "status", ids: selected, status: "draft" };
      case "brand":
        return { kind: "brand", ids: selected, brandId: bulkValue || null };
      case "category":
        return { kind: "category", ids: selected, categoryId: bulkValue || null };
      case "mapping":
        return {
          kind: "mapping",
          ids: selected,
          isActive: bulkMapping.active,
          priceSync: bulkMapping.price,
          stockSync: bulkMapping.stock,
        };
      default:
        return null;
    }
  };

  const BULK_LABELS: Record<string, string> = {
    status: t("admin.prod.archive"),
    restore: t("admin.prod.restoreToDraft"),
    brand: t("admin.prod.changeBrand"),
    category: t("admin.prod.changeCategory"),
    mapping: "bol.com-koppeling bijwerken",
  };

  if (!allow("products", "view")) return <NoAccessState module="producten" />;

  return (
    <div>
      <PageHeader
        title={t("admin.prod.title")}
        description="Volledig assortimentbeheer: varianten, afbeeldingen, voorraad, SEO en bol.com-koppeling."
        actions={
          allow("products", "create") ? (
            <Button onClick={() => setCreating(true)}>{t("admin.prod.addProduct")}</Button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-6">
        <form
          className="sm:col-span-2"
          onSubmit={(e) => {
            e.preventDefault();
            setFilters((f) => ({ ...f, search: searchInput, page: 1 }));
          }}
        >
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("admin.prod.search")}
          />
        </form>

        <Select
          value={filters.status ?? "alle-actief"}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v, page: 1 }))}
        >
          <SelectTrigger aria-label={t("admin.common.status")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle-actief">{t("admin.prod.allExclArchived")}</SelectItem>
            <SelectItem value="alle">{t("admin.prod.allInclArchived")}</SelectItem>
            {PRODUCT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {PRODUCT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId ?? "alle"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, categoryId: v === "alle" ? null : v, page: 1 }))
          }
        >
          <SelectTrigger aria-label={t("admin.prod.category")}>
            <SelectValue placeholder={t("admin.prod.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">{t("admin.prod.allCategories")}</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.brandId ?? "alle"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, brandId: v === "alle" ? null : v, page: 1 }))
          }
        >
          <SelectTrigger aria-label="Merk">
            <SelectValue placeholder="Merk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">{t("admin.prod.allBrands")}</SelectItem>
            {brandOptions.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.stock ?? "alle"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, stock: v as ProductFilters["stock"], page: 1 }))
          }
        >
          <SelectTrigger aria-label={t("admin.common.stock")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">{t("admin.prod.allStock")}</SelectItem>
            <SelectItem value="laag">{t("admin.prod.lowStock")}</SelectItem>
            <SelectItem value="uitverkocht">{t("admin.prod.soldOut")}</SelectItem>
            <SelectItem value="voorradig">{t("admin.prod.inStock")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort ?? "naam"}
          onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as ProductSort, page: 1 }))}
        >
          <SelectTrigger aria-label={t("admin.prod.sorting")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {t(label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query.isPending ? <LoadingState label={t("admin.prod.loading")} /> : null}
      {query.error ? (
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      ) : null}
      {query.data && rows.length === 0 ? (
        <EmptyState title={t("admin.prod.empty")} description={t("admin.prod.emptyHint")} />
      ) : null}

      {selected.length ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <span className="font-medium">{selected.length} geselecteerd</span>
          <Select
            value={bulkKind || undefined}
            onValueChange={(v) => {
              setBulkKind(v as BulkAction["kind"] | "restore");
              setBulkValue("");
            }}
          >
            <SelectTrigger className="w-[230px]" aria-label={t("admin.prod.bulkAction")}>
              <SelectValue placeholder={t("admin.prod.chooseBulk")} />
            </SelectTrigger>
            <SelectContent>
              {allow("products", "archive") ? (
                <>
                  <SelectItem value="status">{BULK_LABELS["status"]}</SelectItem>
                  <SelectItem value="restore">{BULK_LABELS["restore"]}</SelectItem>
                </>
              ) : null}
              {allow("products", "edit") ? (
                <>
                  <SelectItem value="brand">{BULK_LABELS["brand"]}</SelectItem>
                  <SelectItem value="category">{BULK_LABELS["category"]}</SelectItem>
                </>
              ) : null}
              {allow("bol", "edit") ? (
                <SelectItem value="mapping">{BULK_LABELS["mapping"]}</SelectItem>
              ) : null}
            </SelectContent>
          </Select>

          {bulkKind === "brand" ? (
            <Select
              value={bulkValue || "none"}
              onValueChange={(v) => setBulkValue(v === "none" ? "" : v)}
            >
              <SelectTrigger className="w-[200px]" aria-label="Merk">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("admin.prod.noBrand")}</SelectItem>
                {brandOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {bulkKind === "category" ? (
            <Select
              value={bulkValue || "none"}
              onValueChange={(v) => setBulkValue(v === "none" ? "" : v)}
            >
              <SelectTrigger className="w-[220px]" aria-label={t("admin.prod.category")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("admin.prod.noCategory")}</SelectItem>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {bulkKind === "mapping" ? (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-2">
                <Switch
                  checked={bulkMapping.active}
                  onCheckedChange={(v) => setBulkMapping((m) => ({ ...m, active: v }))}
                />
                {t("admin.prod.listingActive")}
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={bulkMapping.price}
                  onCheckedChange={(v) => setBulkMapping((m) => ({ ...m, price: v }))}
                />
                {t("admin.prod.priceSync")}
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={bulkMapping.stock}
                  onCheckedChange={(v) => setBulkMapping((m) => ({ ...m, stock: v }))}
                />
                {t("admin.prod.stockSync")}
              </label>
            </div>
          ) : null}

          <Button
            size="sm"
            disabled={!bulkKind || bulkMutation.isPending}
            onClick={() => setConfirmBulk(true)}
          >
            {t("admin.prod.apply")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate(selected)}
          >
            {exportMutation.isPending ? t("admin.prod.exporting") : t("admin.prod.exportCsv")}
          </Button>
          <label>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={importMutation.isPending}
              onChange={(event) => {
                void handleImportFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <span
              className="inline-flex h-9 cursor-pointer items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
              role="button"
            >
              {importMutation.isPending ? t("admin.prod.importing") : t("admin.prod.importCsv")}
            </span>
          </label>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              downloadCsv("besjaar-import-sjabloon.csv", toCsv([[...IMPORT_TEMPLATE_HEADER]]))
            }
          >
            {t("admin.prod.templateFile")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            {t("admin.prod.clearSelection")}
          </Button>
        </div>
      ) : null}

      <Dialog open={Boolean(importReport)} onOpenChange={(open) => !open && setImportReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.prod.importReport")}</DialogTitle>
          </DialogHeader>
          {importReport ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  [t("admin.prod.rowsInFile"), importReport.totalLines],
                  [t("admin.prod.processed"), importReport.processed],
                  [t("admin.prod.bulkUpdated"), importReport.productsUpdated],
                  [t("admin.prod.variantsUpdated"), importReport.variantsUpdated],
                  ["bol.com-koppelingen", importReport.listingsUpdated],
                  [t("admin.nav.stockMovements"), importReport.stockMutations],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              {importReport.errors.length ? (
                <div className="space-y-2">
                  <p className="font-medium text-destructive">
                    {importReport.errors.length} fout(en) per regel
                  </p>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead className="border-b border-border text-left text-muted-foreground">
                        <tr>
                          <th className="p-2">{t("admin.prod.row")}</th>
                          <th className="p-2">{t("admin.common.product")}</th>
                          <th className="p-2">{t("admin.prod.message")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importReport.errors.map((err, index) => (
                          <tr key={`${err.line}-${index}`} className="border-b border-border/60">
                            <td className="p-2">{err.line}</td>
                            <td className="p-2 font-mono">{err.product_id?.slice(0, 8) ?? "—"}</td>
                            <td className="p-2">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadCsv(
                        "besjaar-import-fouten.csv",
                        toCsv([
                          ["regel", "product_id", "melding"],
                          ...importReport.errors.map((e) => [
                            e.line,
                            e.product_id ?? "",
                            e.message,
                          ]),
                        ]),
                      )
                    }
                  >
                    {t("admin.prod.downloadErrors")}
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">{t("admin.prod.importClean")}</p>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportReport(null)}>
              {t("admin.common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="rounded-xl border border-border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
          <div>
            <h2 className="font-medium">{t("admin.prod.importHistory")}</h2>
            <p className="text-xs text-muted-foreground">{t("admin.prod.importHistoryHint")}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={importRunsQuery.isFetching}
            onClick={() => void importRunsQuery.refetch()}
          >
            {t("admin.prod.refresh")}
          </Button>
        </header>
        {importRunsQuery.isLoading ? (
          <div className="p-4">
            <LoadingState />
          </div>
        ) : (importRunsQuery.data ?? []).length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t("admin.prod.noImports")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">{t("admin.common.date")}</th>
                  <th className="p-3">{t("admin.prod.file")}</th>
                  <th className="p-3">{t("admin.prod.by")}</th>
                  <th className="p-3 text-right">{t("admin.prod.rows")}</th>
                  <th className="p-3 text-right">{t("admin.prod.rowsRead")}</th>
                  <th className="p-3 text-right">{t("admin.prod.variants")}</th>
                  <th className="p-3 text-right">{t("admin.prod.listings")}</th>
                  <th className="p-3 text-right">{t("admin.prod.errors")}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {(importRunsQuery.data ?? []).map((run) => (
                  <tr key={run.id} className="border-b border-border/60">
                    <td className="p-3 whitespace-nowrap">
                      {new Date(run.created_at).toLocaleString("nl-NL")}
                    </td>
                    <td className="p-3 font-mono text-xs">{run.file_name}</td>
                    <td className="p-3 text-xs text-muted-foreground">{run.user_email ?? "—"}</td>
                    <td className="p-3 text-right">{run.total_lines}</td>
                    <td className="p-3 text-right">{run.products_updated}</td>
                    <td className="p-3 text-right">{run.variants_updated}</td>
                    <td className="p-3 text-right">{run.listings_updated}</td>
                    <td className="p-3 text-right">
                      {run.error_count > 0 ? (
                        <span className="font-medium text-destructive">{run.error_count}</span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {run.error_count > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadCsv(
                              `besjaar-import-fouten-${run.created_at.slice(0, 10)}.csv`,
                              toCsv([
                                ["regel", "product_id", "melding"],
                                ...run.errors.map((e) => [e.line, e.product_id ?? "", e.message]),
                              ]),
                            )
                          }
                        >
                          {t("admin.prod.errorReport")}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label={t("admin.prod.selectAll")}
                  />
                </th>
                <th className="p-3">{t("admin.common.product")}</th>
                <th className="p-3">{t("admin.common.status")}</th>
                <th className="p-3 text-right">{t("admin.common.price")}</th>
                <th className="p-3 text-right">{t("admin.common.stock")}</th>
                <th className="p-3 text-right">{t("admin.prod.sold")}</th>
                <th className="p-3">{t("admin.prod.channel")}</th>
                <th className="p-3 text-right">{t("admin.common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className={selectedSet.has(p.id) ? "bg-muted/40" : undefined}>
                  <td className="p-3">
                    <Checkbox
                      checked={selectedSet.has(p.id)}
                      onCheckedChange={() => toggleRow(p.id)}
                      aria-label={`Selecteer ${p.name}`}
                    />
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-10 w-10 rounded-md border border-border object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md border border-dashed border-border" />
                      )}
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[p.internal_sku ?? p.ean, p.brand, p.category]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                          {p.variant_count ? ` · ${p.variant_count} varianten` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <StatusBadge
                      tone={statusTone(p.status)}
                      label={PRODUCT_STATUS_LABELS[p.status] ?? p.status}
                    />
                  </td>
                  <td className="p-3 text-right">
                    {p.sale_price ? (
                      <span>
                        <s className="text-muted-foreground">{formatPrice(p.regular_price)}</s>{" "}
                        {formatPrice(p.sale_price)}
                      </span>
                    ) : (
                      formatPrice(p.regular_price)
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={
                        p.stock_quantity <= p.low_stock_threshold ? "text-destructive" : undefined
                      }
                    >
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="p-3 text-right">{p.sales_count}</td>
                  <td className="p-3">
                    {p.bol_linked ? (
                      <StatusBadge tone="info" label="bol.com" />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("admin.prod.webshopOnly")}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => setOpenId(p.id)}>
                        {t("admin.prod.manage")}
                      </Button>
                      {allow("products", "create") ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={duplicateMutation.isPending}
                          onClick={() => duplicateMutation.mutate(p.id)}
                        >
                          {t("admin.prod.duplicate")}
                        </Button>
                      ) : null}
                      {allow("products", "archive") && p.status !== "archived" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => statusMutation.mutate({ id: p.id, status: "archived" })}
                        >
                          {t("admin.prod.archive")}
                        </Button>
                      ) : null}
                      {allow("products", "archive") && p.status === "archived" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => statusMutation.mutate({ id: p.id, status: "draft" })}
                        >
                          {t("admin.prod.restore")}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Pager
        page={filters.page ?? 1}
        pageCount={pageCount}
        total={total}
        onPage={(page) => setFilters((f) => ({ ...f, page }))}
      />

      {/* new product */}
      <Dialog open={creating} onOpenChange={(open) => !open && setCreating(false)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.prod.new")}</DialogTitle>
          </DialogHeader>
          <NewProductForm
            categories={categoryOptions}
            brands={brandOptions}
            pending={createMutation.isPending}
            onSubmit={(form) => createMutation.mutate(form)}
            onCancel={() => setCreating(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.prod.confirmBulk")}</AlertDialogTitle>
            <AlertDialogDescription>
              {BULK_LABELS[bulkKind] ?? t("admin.common.action")} wordt toegepast op{" "}
              {selected.length} product(en). Deze wijziging wordt vastgelegd in het auditlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                const payload = bulkPayload();
                if (payload) bulkMutation.mutate(payload);
              }}
            >
              {bulkMutation.isPending ? t("admin.common.busy") : t("admin.prod.apply")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* manage product */}
      <Dialog open={Boolean(openId)} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailQuery.data?.name ?? t("admin.prod.manageProduct")}</DialogTitle>
          </DialogHeader>
          {detailQuery.isPending ? <LoadingState /> : null}
          {detailQuery.data ? (
            <ProductEditor
              product={detailQuery.data}
              categories={categoryOptions}
              brands={brandOptions}
              onChanged={invalidate}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewProductForm({
  categories,
  brands,
  pending,
  onSubmit,
  onCancel,
}: {
  categories: ProductPickerOptions["categories"];
  brands: ProductPickerOptions["brands"];
  pending: boolean;
  onSubmit: (form: FormState) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="new-name">{t("admin.prod.nameRequired")}</Label>
        <Input id="new-name" value={form.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="new-price">{t("admin.prod.priceRequired")}</Label>
          <Input
            id="new-price"
            value={form.regular_price}
            onChange={(e) => set({ regular_price: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="new-stock">{t("admin.common.stock")}</Label>
          <Input
            id="new-stock"
            value={form.stock_quantity}
            onChange={(e) => set({ stock_quantity: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="new-sku">{t("admin.prod.internalSku")}</Label>
          <Input
            id="new-sku"
            value={form.internal_sku}
            onChange={(e) => set({ internal_sku: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="new-ean">EAN</Label>
          <Input id="new-ean" value={form.ean} onChange={(e) => set({ ean: e.target.value })} />
        </div>
        <div>
          <Label>Merk</Label>
          <Select
            value={form.brand_id || "geen"}
            onValueChange={(v) => set({ brand_id: v === "geen" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("admin.prod.pickBrand")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geen">{t("admin.prod.noBrand")}</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("admin.prod.category")}</Label>
          <Select
            value={form.category_id || "geen"}
            onValueChange={(v) => set({ category_id: v === "geen" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("admin.prod.pickCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geen">{t("admin.prod.noCategory")}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="new-short">{t("admin.prod.shortDescription")}</Label>
        <Textarea
          id="new-short"
          value={form.short_description}
          onChange={(e) => set({ short_description: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {t("admin.common.cancel")}
        </Button>
        <Button disabled={pending} onClick={() => onSubmit(form)}>
          {pending ? t("admin.common.saving") : t("admin.common.create")}
        </Button>
      </DialogFooter>
    </div>
  );
}

function ProductEditor({
  product,
  categories,
  brands,
  onChanged,
}: {
  product: ProductDetailAdmin;
  categories: ProductPickerOptions["categories"];
  brands: ProductPickerOptions["brands"];
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const allow = useCan();
  const save = useServerFn(upsertProduct);
  const saveVariantFn = useServerFn(upsertVariant);
  const deleteVariantFn = useServerFn(removeVariant);
  const addImage = useServerFn(createProductImage);
  const mainImage = useServerFn(makeMainImage);
  const moveImage = useServerFn(reorderProductImage);
  const deleteImage = useServerFn(removeProductImage);
  const saveListingFn = useServerFn(upsertListing);
  const deleteListingFn = useServerFn(removeListing);
  const adjust = useServerFn(adjustStock);

  const initial = useMemo(() => toForm(product), [product]);
  const [form, setForm] = useState<FormState>(initial);
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const canEdit = allow("products", "edit");

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: product.id,
          name: form.name,
          short_name: form.short_name || null,
          slug: form.slug || null,
          status: form.status,
          brand_id: form.brand_id || null,
          category_id: form.category_id || null,
          short_description: form.short_description || null,
          full_description: form.full_description || null,
          selling_points: form.selling_points
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          specifications: parseSpecs(form.specifications),
          ean: form.ean || null,
          internal_sku: form.internal_sku || null,
          supplier_sku: form.supplier_sku || null,
          regular_price: num(form.regular_price) ?? 0,
          sale_price: num(form.sale_price),
          purchase_cost: num(form.purchase_cost),
          vat_rate: num(form.vat_rate) ?? 21,
          low_stock_threshold: num(form.low_stock_threshold) ?? 5,
          safety_stock: num(form.safety_stock) ?? 0,
          weight: num(form.weight),
          length: num(form.length),
          width: num(form.width),
          height: num(form.height),
          shipping_class: form.shipping_class || null,
          warranty_months: num(form.warranty_months) ?? 24,
          return_eligible: form.return_eligible,
          seo_title: form.seo_title || null,
          seo_description: form.seo_description || null,
          search_keywords: form.search_keywords || null,
          featured: form.featured,
          bestseller: form.bestseller,
          source_locale: form.source_locale,
        },
      }),
    onSuccess: () => {
      toast.success(t("admin.prod.saved"));
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const act = (fn: () => Promise<unknown>, message: string) =>
    fn()
      .then(() => {
        toast.success(message);
        onChanged();
      })
      .catch((e: Error) => toast.error(e.message));

  const [variant, setVariant] = useState({
    variant_name: "",
    sku: "",
    ean: "",
    regular_price: "",
    warehouse_stock: "0",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [stockChange, setStockChange] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [listing, setListing] = useState({ ean: product.ean ?? "", offer: "", price: "" });

  return (
    <Tabs defaultValue="algemeen">
      <TabsList className="flex w-full flex-wrap">
        <TabsTrigger value="algemeen">{t("admin.prod.general")}</TabsTrigger>
        <TabsTrigger value="prijs">{t("admin.prod.priceAndStock")}</TabsTrigger>
        <TabsTrigger value="varianten">Varianten ({product.variants.length})</TabsTrigger>
        <TabsTrigger value="media">Afbeeldingen ({product.images.length})</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="bol">bol.com</TabsTrigger>
      </TabsList>

      <TabsContent value="algemeen" className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{t("admin.prod.nameRequired")}</Label>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => set({ slug: e.target.value })} />
          </div>
          <div>
            <Label>{t("admin.common.status")}</Label>
            <Select value={form.status} onValueChange={(v) => set({ status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PRODUCT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Merk</Label>
            <Select
              value={form.brand_id || "geen"}
              onValueChange={(v) => set({ brand_id: v === "geen" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geen">{t("admin.prod.noBrand")}</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("admin.prod.category")}</Label>
            <Select
              value={form.category_id || "geen"}
              onValueChange={(v) => set({ category_id: v === "geen" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geen">{t("admin.prod.noCategory")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("admin.prod.internalSku")}</Label>
            <Input
              value={form.internal_sku}
              onChange={(e) => set({ internal_sku: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("admin.prod.supplierSku")}</Label>
            <Input
              value={form.supplier_sku}
              onChange={(e) => set({ supplier_sku: e.target.value })}
            />
          </div>
          <div>
            <Label>EAN</Label>
            <Input value={form.ean} onChange={(e) => set({ ean: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>{t("admin.prod.shortDescription")}</Label>
          <Textarea
            value={form.short_description}
            onChange={(e) => set({ short_description: e.target.value })}
          />
        </div>
        <div>
          <Label>{t("admin.prod.fullDescription")}</Label>
          <Textarea
            rows={5}
            value={form.full_description}
            onChange={(e) => set({ full_description: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>USP's (één per regel)</Label>
            <Textarea
              rows={4}
              value={form.selling_points}
              onChange={(e) => set({ selling_points: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("admin.prod.specifications")}</Label>
            <Textarea
              rows={4}
              value={form.specifications}
              onChange={(e) => set({ specifications: e.target.value })}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.featured} onCheckedChange={(v) => set({ featured: v })} />
            {t("admin.prod.featured")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.bestseller} onCheckedChange={(v) => set({ bestseller: v })} />
            {t("admin.prod.bestseller")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={form.return_eligible}
              onCheckedChange={(v) => set({ return_eligible: v })}
            />
            {t("admin.prod.returnable")}
          </label>
        </div>
        <SaveBar
          disabled={!canEdit || saveMutation.isPending}
          onSave={() => saveMutation.mutate()}
        />
      </TabsContent>

      <TabsContent value="prijs" className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>{t("admin.prod.priceRequired")}</Label>
            <Input
              value={form.regular_price}
              onChange={(e) => set({ regular_price: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("admin.prod.salePrice")}</Label>
            <Input value={form.sale_price} onChange={(e) => set({ sale_price: e.target.value })} />
          </div>
          <div>
            <Label>{t("admin.prod.costPrice")}</Label>
            <Input
              value={form.purchase_cost}
              onChange={(e) => set({ purchase_cost: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("admin.prod.vat")}</Label>
            <Input value={form.vat_rate} onChange={(e) => set({ vat_rate: e.target.value })} />
          </div>
          <div>
            <Label>{t("admin.prod.lowStockThreshold")}</Label>
            <Input
              value={form.low_stock_threshold}
              onChange={(e) => set({ low_stock_threshold: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("admin.prod.safetyStock")}</Label>
            <Input
              value={form.safety_stock}
              onChange={(e) => set({ safety_stock: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("admin.prod.weight")}</Label>
            <Input value={form.weight} onChange={(e) => set({ weight: e.target.value })} />
          </div>
          <div>
            <Label>{t("admin.prod.length")}</Label>
            <Input value={form.length} onChange={(e) => set({ length: e.target.value })} />
          </div>
          <div>
            <Label>{t("admin.prod.width")}</Label>
            <Input value={form.width} onChange={(e) => set({ width: e.target.value })} />
          </div>
          <div>
            <Label>{t("admin.prod.height")}</Label>
            <Input value={form.height} onChange={(e) => set({ height: e.target.value })} />
          </div>
          <div>
            <Label>{t("admin.prod.shippingClass")}</Label>
            <Input
              value={form.shipping_class}
              onChange={(e) => set({ shipping_class: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("admin.prod.warrantyMonths")}</Label>
            <Input
              value={form.warranty_months}
              onChange={(e) => set({ warranty_months: e.target.value })}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border p-3">
          <p className="text-sm font-medium">Huidige voorraad: {product.stock_quantity} stuks</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <Input
              placeholder={t("admin.prod.movement")}
              value={stockChange}
              onChange={(e) => setStockChange(e.target.value)}
            />
            <Input
              placeholder={t("admin.prod.note")}
              value={stockNote}
              onChange={(e) => setStockNote(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() => {
                const change = num(stockChange);
                if (!change) {
                  toast.error(t("admin.prod.nonZero"));
                  return;
                }
                void act(
                  () =>
                    adjust({
                      data: {
                        productId: product.id,
                        change,
                        reason: "correction",
                        note: stockNote || null,
                      },
                    }),
                  t("admin.prod.stockUpdated"),
                ).then(() => {
                  setStockChange("");
                  setStockNote("");
                });
              }}
            >
              {t("admin.prod.adjustStock")}
            </Button>
          </div>
        </div>

        <SaveBar
          disabled={!canEdit || saveMutation.isPending}
          onSave={() => saveMutation.mutate()}
        />
      </TabsContent>

      <TabsContent value="varianten" className="space-y-3">
        {product.variants.length ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-2">{t("admin.prod.variant")}</th>
                  <th className="p-2">SKU / EAN</th>
                  <th className="p-2 text-right">{t("admin.common.price")}</th>
                  <th className="p-2 text-right">{t("admin.common.stock")}</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {product.variants.map((v) => (
                  <tr key={v.id}>
                    <td className="p-2">{v.variant_name}</td>
                    <td className="p-2 text-muted-foreground">
                      {[v.sku, v.ean].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="p-2 text-right">
                      {formatPrice(v.sale_price ?? v.regular_price)}
                    </td>
                    <td className="p-2 text-right">{v.warehouse_stock}</td>
                    <td className="p-2 text-right">
                      {allow("products", "archive") ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void act(
                              () => deleteVariantFn({ data: { id: v.id } }),
                              t("admin.prod.variantRemoved"),
                            )
                          }
                        >
                          {t("admin.common.delete")}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("admin.prod.noVariants")}</p>
        )}

        {canEdit ? (
          <div className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-5">
            <Input
              placeholder={t("admin.common.name")}
              value={variant.variant_name}
              onChange={(e) => setVariant((v) => ({ ...v, variant_name: e.target.value }))}
            />
            <Input
              placeholder="SKU"
              value={variant.sku}
              onChange={(e) => setVariant((v) => ({ ...v, sku: e.target.value }))}
            />
            <Input
              placeholder="EAN"
              value={variant.ean}
              onChange={(e) => setVariant((v) => ({ ...v, ean: e.target.value }))}
            />
            <Input
              placeholder={t("admin.common.price")}
              value={variant.regular_price}
              onChange={(e) => setVariant((v) => ({ ...v, regular_price: e.target.value }))}
            />
            <Button
              onClick={() =>
                void act(
                  () =>
                    saveVariantFn({
                      data: {
                        product_id: product.id,
                        variant_name: variant.variant_name,
                        sku: variant.sku || null,
                        ean: variant.ean || null,
                        regular_price: num(variant.regular_price) ?? 0,
                        warehouse_stock: num(variant.warehouse_stock) ?? 0,
                        sort_order: product.variants.length,
                      },
                    }),
                  t("admin.prod.variantAdded"),
                ).then(() =>
                  setVariant({
                    variant_name: "",
                    sku: "",
                    ean: "",
                    regular_price: "",
                    warehouse_stock: "0",
                  }),
                )
              }
            >
              {t("admin.prod.add")}
            </Button>
          </div>
        ) : null}
      </TabsContent>

      <TabsContent value="media" className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {product.images.map((img, index) => (
            <div key={img.id} className="rounded-xl border border-border p-2">
              <img
                src={img.image_url}
                alt={img.alt_text ?? ""}
                className="h-32 w-full rounded-md object-cover"
                loading="lazy"
              />
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {img.alt_text ?? t("admin.prod.noAltText")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {img.is_main ? (
                  <StatusBadge tone="success" label={t("admin.prod.mainImage")} />
                ) : canEdit ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void act(
                        () => mainImage({ data: { productId: product.id, imageId: img.id } }),
                        t("admin.prod.mainImageSet"),
                      )
                    }
                  >
                    {t("admin.prod.main")}
                  </Button>
                ) : null}
                {canEdit ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() =>
                        void act(
                          () =>
                            moveImage({ data: { imageId: img.id, sortOrder: img.sort_order - 1 } }),
                          t("admin.prod.orderUpdated"),
                        )
                      }
                    >
                      ←
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void act(
                          () =>
                            moveImage({ data: { imageId: img.id, sortOrder: img.sort_order + 1 } }),
                          t("admin.prod.orderUpdated"),
                        )
                      }
                    >
                      →
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void act(
                          () => deleteImage({ data: { imageId: img.id } }),
                          t("admin.prod.imageRemoved"),
                        )
                      }
                    >
                      {t("admin.common.delete")}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {canEdit ? (
          <div className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-3">
            <Input
              placeholder="https://…afbeelding.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Input
              placeholder={t("admin.prod.altText")}
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
            />
            <Button
              onClick={() =>
                void act(
                  () =>
                    addImage({
                      data: {
                        product_id: product.id,
                        image_url: imageUrl,
                        alt_text: imageAlt || null,
                        sort_order: product.images.length,
                        is_main: product.images.length === 0,
                      },
                    }),
                  t("admin.prod.imageAdded"),
                ).then(() => {
                  setImageUrl("");
                  setImageAlt("");
                })
              }
            >
              {t("admin.prod.addImage")}
            </Button>
          </div>
        ) : null}
      </TabsContent>

      <TabsContent value="seo" className="space-y-3">
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <Label htmlFor="source-locale">{t("admin.tr.sourceLanguage")}</Label>
          <select
            id="source-locale"
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.source_locale}
            onChange={(e) => set({ source_locale: e.target.value as "nl" | "en" })}
          >
            <option value="nl">Nederlands</option>
            <option value="en">Engels</option>
          </select>
          <p className="mt-2 text-xs text-muted-foreground">{t("admin.tr.sourceLanguageHelp")}</p>
        </div>
        <div>
          <Label>SEO-titel</Label>
          <Input value={form.seo_title} onChange={(e) => set({ seo_title: e.target.value })} />
          <p className="mt-1 text-xs text-muted-foreground">{form.seo_title.length}/60 tekens</p>
        </div>
        <div>
          <Label>SEO-omschrijving</Label>
          <Textarea
            value={form.seo_description}
            onChange={(e) => set({ seo_description: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {form.seo_description.length}/160 tekens
          </p>
        </div>
        <div>
          <Label>{t("admin.prod.keywords")}</Label>
          <Input
            value={form.search_keywords}
            onChange={(e) => set({ search_keywords: e.target.value })}
          />
        </div>
        <SaveBar
          disabled={!canEdit || saveMutation.isPending}
          onSave={() => saveMutation.mutate()}
        />
      </TabsContent>

      <TabsContent value="bol" className="space-y-3">
        {product.listings.length ? (
          <div className="space-y-2">
            {product.listings.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {l.channel} · {l.ean ?? "geen EAN"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Offer {l.external_offer_id ?? "—"} ·{" "}
                    {l.channel_price ? formatPrice(l.channel_price) : "prijs volgt webshop"} ·{" "}
                    {l.last_sync_status ?? "nog niet gesynchroniseerd"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    tone={l.is_active ? "success" : "muted"}
                    label={l.is_active ? t("admin.prod.active") : t("admin.prod.inactive")}
                  />
                  {allow("bol", "edit") ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void act(
                          () => deleteListingFn({ data: { id: l.id } }),
                          t("admin.prod.listingRemoved"),
                        )
                      }
                    >
                      {t("admin.prod.unlink")}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("admin.prod.notLinkedBol")}</p>
        )}

        {allow("bol", "edit") ? (
          <div className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-4">
            <Input
              placeholder="EAN"
              value={listing.ean}
              onChange={(e) => setListing((l) => ({ ...l, ean: e.target.value }))}
            />
            <Input
              placeholder="bol.com offer-id"
              value={listing.offer}
              onChange={(e) => setListing((l) => ({ ...l, offer: e.target.value }))}
            />
            <Input
              placeholder={t("admin.prod.channelPrice")}
              value={listing.price}
              onChange={(e) => setListing((l) => ({ ...l, price: e.target.value }))}
            />
            <Button
              onClick={() =>
                void act(
                  () =>
                    saveListingFn({
                      data: {
                        product_id: product.id,
                        channel: "bol",
                        ean: listing.ean || null,
                        external_offer_id: listing.offer || null,
                        channel_price: num(listing.price),
                      },
                    }),
                  "bol.com-koppeling opgeslagen",
                ).then(() => setListing({ ean: product.ean ?? "", offer: "", price: "" }))
              }
            >
              {t("admin.prod.link")}
            </Button>
          </div>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}

function SaveBar({ disabled, onSave }: { disabled: boolean; onSave: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex justify-end border-t border-border pt-3">
      <Button disabled={disabled} onClick={onSave}>
        {t("admin.common.save")}
      </Button>
    </div>
  );
}
