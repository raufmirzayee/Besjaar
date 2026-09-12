import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NoAccessState,
  PageHeader,
} from "@/components/admin/admin-ui";
import { useCan } from "@/components/admin/admin-shell";
import {
  getTranslationCoverage,
  getTranslationProviderStatus,
  runAutoTranslation,
  getTranslationDraft,
  getTranslationDrafts,
  saveTranslationFields,
  saveTranslationFieldsBulk,
} from "@/lib/admin-translations.functions";
import type { TranslationKey } from "@/lib/translations";
import { useI18n } from "@/lib/i18n";
import type { TranslationCoverage, TranslationDraft } from "@/lib/admin-translations.server";
import {
  COVERAGE_FIELDS,
  COVERAGE_LOCALES,
  FIELD_LABELS,
  type CoverageEntity,
  type CoverageRow,
  type CoverageStatus,
} from "@/lib/translation-coverage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/beheer/vertalingen")({
  component: TranslationsPage,
});

/** Keys, not labels: a module constant cannot call t(). */
const ENTITY_LABELS: Record<CoverageEntity, TranslationKey> = {
  product: "admin.common.products",
  category: "admin.nav.categories",
  brand: "admin.nav.brands",
};

const STATUS_CLASS: Record<CoverageStatus, string> = {
  ok: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400",
  missing: "bg-destructive/15 text-destructive",
  identical: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  no_source: "bg-muted text-muted-foreground",
};

const STATUS_SYMBOL: Record<CoverageStatus, string> = {
  ok: "✓",
  missing: "✗",
  identical: "NL",
  no_source: "–",
};

/** Keys, not labels: a module constant cannot call t(). */
const STATUS_TITLE: Record<CoverageStatus, TranslationKey> = {
  ok: "admin.tr.present",
  missing: "admin.tr.missing",
  identical: "admin.tr.sameAsDutch",
  no_source: "admin.tr.noSource",
};

function CoverageTable({
  entity,
  rows,
  onlyIncomplete,
  search,
  onEdit,
  selectable,
  selectedIds,
  onToggle,
  onToggleMany,
}: {
  entity: CoverageEntity;
  rows: CoverageRow[];
  onlyIncomplete: boolean;
  search: string;
  onEdit?: (row: CoverageRow) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (row: CoverageRow, checked: boolean) => void;
  onToggleMany?: (rows: CoverageRow[], checked: boolean) => void;
}) {
  const { t } = useI18n();
  const fields = COVERAGE_FIELDS[entity];
  const term = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (onlyIncomplete && row.missingCount === 0 && row.identicalCount === 0) return false;
        if (term && !`${row.name} ${row.slug}`.toLowerCase().includes(term)) return false;
        return true;
      }),
    [rows, onlyIncomplete, term],
  );

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={t("admin.tr.nothingOutstanding", {
          entity: t(ENTITY_LABELS[entity]).toLowerCase(),
        })}
        description={t("admin.tr.allComplete")}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            {selectable ? (
              <th className="p-3">
                <Checkbox
                  aria-label={t("admin.tr.selectAll")}
                  checked={filtered.every((row) => selectedIds?.has(row.id))}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    onToggleMany?.(filtered, checked === true)
                  }
                />
              </th>
            ) : null}
            <th className="p-3">{t("admin.common.name")}</th>
            <th className="p-3">{t("admin.tr.complete")}</th>
            {fields.map((field) => (
              <th key={field} className="p-3">
                {FIELD_LABELS[field] ?? field}
              </th>
            ))}
            {onEdit ? <th className="p-3 text-right">{t("admin.common.action")}</th> : null}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id} className="border-b border-border/60 last:border-0 align-top">
              {selectable ? (
                <td className="p-3">
                  <Checkbox
                    aria-label={`Selecteer ${row.name}`}
                    checked={selectedIds?.has(row.id) ?? false}
                    onCheckedChange={(checked: boolean | "indeterminate") =>
                      onToggle?.(row, checked === true)
                    }
                  />
                </td>
              ) : null}
              <td className="p-3">
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.slug}</p>
              </td>
              <td className="p-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    row.completeness === 100
                      ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
                      : row.completeness >= 60
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                        : "bg-destructive/15 text-destructive",
                  )}
                >
                  {row.completeness}%
                </span>
              </td>
              {fields.map((field) => (
                <td key={field} className="p-3">
                  <div className="flex gap-1">
                    {COVERAGE_LOCALES.map((locale) => {
                      const status = row.cells[`${locale}:${field}`] ?? "no_source";
                      return (
                        <span
                          key={locale}
                          title={`${locale.toUpperCase()} · ${t(STATUS_TITLE[status])}`}
                          className={cn(
                            "inline-flex min-w-[2.4rem] flex-col items-center rounded-md px-1 py-0.5 text-[10px] font-medium leading-tight",
                            STATUS_CLASS[status],
                          )}
                        >
                          <span className="uppercase">{locale}</span>
                          <span>{STATUS_SYMBOL[status]}</span>
                        </span>
                      );
                    })}
                  </div>
                </td>
              ))}
              {onEdit ? (
                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => onEdit(row)}>
                    {t("admin.tr.editShort")}
                  </Button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TranslationsPage() {
  const { t } = useI18n();
  const allow = useCan();
  const fetchCoverage = useServerFn(getTranslationCoverage);
  const fetchProviderStatus = useServerFn(getTranslationProviderStatus);
  const autoTranslate = useServerFn(runAutoTranslation);
  const [translating, setTranslating] = useState(false);
  const [search, setSearch] = useState("");
  const [onlyIncomplete, setOnlyIncomplete] = useState(true);
  const [editing, setEditing] = useState<{ entity: CoverageEntity; id: string } | null>(null);
  const [selection, setSelection] = useState<{ entity: CoverageEntity; id: string }[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const canEdit = allow("products", "edit");

  const selectedIdsFor = (entity: CoverageEntity) =>
    new Set(selection.filter((s) => s.entity === entity).map((s) => s.id));

  const toggleRow = (entity: CoverageEntity, row: CoverageRow, checked: boolean) =>
    setSelection((prev) => {
      const rest = prev.filter((s) => !(s.entity === entity && s.id === row.id));
      return checked ? [...rest, { entity, id: row.id }] : rest;
    });

  const toggleMany = (entity: CoverageEntity, rows: CoverageRow[], checked: boolean) =>
    setSelection((prev) => {
      const ids = new Set(rows.map((r) => r.id));
      const rest = prev.filter((s) => !(s.entity === entity && ids.has(s.id)));
      return checked ? [...rest, ...rows.map((r) => ({ entity, id: r.id }))] : rest;
    });

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin-translation-coverage"],
    queryFn: () => fetchCoverage({}) as Promise<TranslationCoverage>,
    enabled: allow("products", "view"),
  });

  const { data: provider } = useQuery({
    queryKey: ["translation-provider"],
    queryFn: () =>
      fetchProviderStatus({}) as Promise<{ configured: boolean; provider: string | null }>,
    enabled: allow("products", "view"),
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Runs the machine translation over the selected rows.
   *
   * One at a time on purpose: a provider's rate limit is easy to hit with a
   * fan-out, and a partial failure halfway through a batch is easier to report
   * when each row's outcome is known.
   */
  const translateSelection = async () => {
    if (selection.length === 0) return;
    setTranslating(true);
    let done = 0;
    const failures: string[] = [];
    try {
      for (const target of selection) {
        try {
          const result = (await autoTranslate({ data: target })) as {
            status: string;
            translated: string[];
          };
          if (result.translated.length > 0) done += 1;
          else if (result.status === "failed") failures.push(target.id);
        } catch (translationError) {
          failures.push(
            translationError instanceof Error ? translationError.message : String(translationError),
          );
        }
      }
      if (done > 0) toast.success(t("admin.tr.translated", { count: done }));
      if (failures.length > 0)
        toast.error(t("admin.tr.translateFailed", { count: failures.length }));
      if (done === 0 && failures.length === 0) {
        toast.info(t("admin.tr.nothingToTranslate"));
      }
      await refetch();
      setSelection([]);
    } finally {
      setTranslating(false);
    }
  };

  if (!allow("products", "view")) return <NoAccessState module={t("admin.tr.title")} />;

  return (
    <div>
      <PageHeader
        title={t("admin.tr.title")}
        description="Zie per categorie, merk en product welke NL/EN/DE/FR velden ontbreken of nog Nederlands zijn."
        actions={
          <>
            {canEdit && selection.length > 0 ? (
              <>
                {provider?.configured ? (
                  <Button
                    size="sm"
                    onClick={() => void translateSelection()}
                    disabled={translating}
                  >
                    {translating
                      ? t("admin.tr.translating")
                      : t("admin.tr.autoTranslate", { count: selection.length })}
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
                  {t("admin.tr.editSelection", { count: selection.length })}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelection([])}>
                  {t("admin.tr.clearSelection")}
                </Button>
              </>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => setOnlyIncomplete((v) => !v)}>
              {onlyIncomplete ? t("admin.tr.showAll") : t("admin.tr.onlyIncomplete")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t("admin.tr.refresh")}
            </Button>
          </>
        }
      />

      {provider && !provider.configured ? (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">{t("admin.tr.noProviderTitle")}</p>
          <p className="mt-1">{t("admin.tr.noProviderBody")}</p>
        </div>
      ) : null}
      {provider?.configured ? (
        <div className="mb-4 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          {t("admin.tr.providerOn", { provider: provider.provider ?? "" })}
        </div>
      ) : null}

      <div className="mb-4 max-w-sm">
        <Input
          placeholder={t("admin.tr.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isPending ? (
        <LoadingState label={t("admin.tr.calculating")} />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : data ? (
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COVERAGE_LOCALES.map((locale) => {
              const stat = data.summary.perLocale[locale] ?? { missing: 0, identical: 0 };
              return (
                <div key={locale} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {locale.toUpperCase()}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">{stat.missing}</p>
                  <p className="text-xs text-muted-foreground">
                    velden ontbreken · {stat.identical} identiek aan NL
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">
            {data.summary.incomplete} van {data.summary.totalRows} items hebben nog openstaande
            vertaalvelden.
          </p>

          {(
            [
              ["product", data.products],
              ["category", data.categories],
              ["brand", data.brands],
            ] as const
          ).map(([entity, rows]) => (
            <section key={entity}>
              <h2 className="mb-2 font-display text-lg font-semibold">
                {t(ENTITY_LABELS[entity])}{" "}
                <span className="text-sm font-normal text-muted-foreground">({rows.length})</span>
              </h2>
              <CoverageTable
                entity={entity}
                rows={rows}
                onlyIncomplete={onlyIncomplete}
                search={search}
                onEdit={canEdit ? (row) => setEditing({ entity, id: row.id }) : undefined}
                selectable={canEdit}
                selectedIds={selectedIdsFor(entity)}
                onToggle={(row, checked) => toggleRow(entity, row, checked)}
                onToggleMany={(rowsToToggle, checked) => toggleMany(entity, rowsToToggle, checked)}
              />
            </section>
          ))}
        </div>
      ) : null}

      <TranslationEditorDialog target={editing} onClose={() => setEditing(null)} />
      <BulkTranslationDialog
        open={bulkOpen}
        targets={selection}
        onClose={() => setBulkOpen(false)}
        onSaved={() => setSelection([])}
      />
    </div>
  );
}

function BulkTranslationDialog({
  open,
  targets,
  onClose,
  onSaved,
}: {
  open: boolean;
  targets: { entity: CoverageEntity; id: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const loadDrafts = useServerFn(getTranslationDrafts);
  const saveBulk = useServerFn(saveTranslationFieldsBulk);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});

  const key = targets.map((t) => `${t.entity}:${t.id}`).join("|");

  const draftsQuery = useQuery({
    queryKey: ["admin-translation-drafts", key],
    queryFn: () => loadDrafts({ data: { targets } }) as Promise<TranslationDraft[]>,
    enabled: open && targets.length > 0,
  });

  useEffect(() => {
    if (!draftsQuery.data) return;
    const next: Record<string, Record<string, string>> = {};
    for (const draft of draftsQuery.data) next[`${draft.entity}:${draft.id}`] = draft.values;
    setValues(next);
  }, [draftsQuery.data]);

  const save = useMutation({
    mutationFn: () =>
      saveBulk({
        data: {
          items: (draftsQuery.data ?? []).map((draft) => ({
            entity: draft.entity,
            id: draft.id,
            values: values[`${draft.entity}:${draft.id}`] ?? {},
          })),
        },
      }) as Promise<{
        changedTotal: number;
        results: { id: string; changed: string[]; error?: string }[];
      }>,
    onSuccess: (result) => {
      const failed = result.results.filter((r) => r.error);
      if (failed.length > 0) {
        toast.error(`${failed.length} item(s) mislukt: ${failed[0]!.error}`);
      } else {
        toast.success(
          result.changedTotal === 0
            ? t("admin.tr.noChanges")
            : `${result.changedTotal} veld(en) opgeslagen over ${result.results.length} item(s)`,
        );
      }
      void queryClient.invalidateQueries({ queryKey: ["admin-translation-coverage"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-translation-drafts"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-translation-draft"] });
      if (failed.length === 0) {
        onSaved();
        onClose();
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk vertalingen bewerken ({targets.length})</DialogTitle>
          <DialogDescription>{t("admin.tr.subtitle")}</DialogDescription>
        </DialogHeader>

        {draftsQuery.isPending ? (
          <LoadingState label={t("admin.tr.loadingFields")} />
        ) : draftsQuery.error ? (
          <ErrorState
            message={(draftsQuery.error as Error).message}
            onRetry={() => draftsQuery.refetch()}
          />
        ) : (
          <div className="space-y-6">
            {(draftsQuery.data ?? []).map((draft) => {
              const itemKey = `${draft.entity}:${draft.id}`;
              return (
                <section key={itemKey} className="rounded-xl border border-border p-4">
                  <p className="font-display text-base font-semibold">{draft.name}</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    {t(ENTITY_LABELS[draft.entity])} · {draft.slug}
                  </p>
                  <div className="space-y-4">
                    {COVERAGE_FIELDS[draft.entity].map((field) => (
                      <div key={field}>
                        <p className="mb-2 text-sm font-medium">{FIELD_LABELS[field] ?? field}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {COVERAGE_LOCALES.map((locale) => {
                            const cellKey = `${locale}:${field}`;
                            const id = `${itemKey}-${cellKey}`;
                            const long = field.endsWith("description");
                            const value = values[itemKey]?.[cellKey] ?? "";
                            const onChange = (next: string) =>
                              setValues((prev) => ({
                                ...prev,
                                [itemKey]: { ...(prev[itemKey] ?? {}), [cellKey]: next },
                              }));
                            return (
                              <div key={locale} className="space-y-1">
                                <Label htmlFor={id} className="text-xs uppercase tracking-wide">
                                  {locale.toUpperCase()}
                                </Label>
                                {long ? (
                                  <Textarea
                                    id={id}
                                    rows={field === "full_description" ? 5 : 3}
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                  />
                                ) : (
                                  <Input
                                    id={id}
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            {t("admin.common.cancel")}
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || !draftsQuery.data?.length}
          >
            {save.isPending ? t("admin.common.saving") : t("admin.tr.saveAll")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TranslationEditorDialog({
  target,
  onClose,
}: {
  target: { entity: CoverageEntity; id: string } | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const loadDraft = useServerFn(getTranslationDraft);
  const saveDraft = useServerFn(saveTranslationFields);
  const [values, setValues] = useState<Record<string, string>>({});

  const draftQuery = useQuery({
    queryKey: ["admin-translation-draft", target?.entity, target?.id],
    queryFn: () =>
      loadDraft({ data: { entity: target!.entity, id: target!.id } }) as Promise<TranslationDraft>,
    enabled: Boolean(target),
  });

  useEffect(() => {
    if (draftQuery.data) setValues(draftQuery.data.values);
  }, [draftQuery.data]);

  const save = useMutation({
    mutationFn: () =>
      saveDraft({ data: { entity: target!.entity, id: target!.id, values } }) as Promise<{
        changed: string[];
      }>,
    onSuccess: (result) => {
      toast.success(
        result.changed.length === 0
          ? t("admin.tr.noChanges")
          : `${result.changed.length} veld(en) opgeslagen`,
      );
      void queryClient.invalidateQueries({ queryKey: ["admin-translation-coverage"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-translation-draft"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const fields = target ? COVERAGE_FIELDS[target.entity] : [];
  const draft = draftQuery.data;

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{draft ? draft.name : t("admin.tr.edit")}</DialogTitle>
          <DialogDescription>
            Vul per taal de ontbrekende velden aan. Laat een veld leeg om terug te vallen op het
            Nederlands.
          </DialogDescription>
        </DialogHeader>

        {draftQuery.isPending ? (
          <LoadingState label={t("admin.tr.loadingFields")} />
        ) : draftQuery.error ? (
          <ErrorState
            message={(draftQuery.error as Error).message}
            onRetry={() => draftQuery.refetch()}
          />
        ) : (
          <div className="space-y-6">
            {fields.map((field) => (
              <div key={field} className="rounded-xl border border-border p-4">
                <p className="mb-3 font-medium">{FIELD_LABELS[field] ?? field}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {COVERAGE_LOCALES.map((locale) => {
                    const key = `${locale}:${field}`;
                    const long = field === "full_description" || field.endsWith("description");
                    return (
                      <div key={locale} className="space-y-1">
                        <Label htmlFor={key} className="text-xs uppercase tracking-wide">
                          {locale.toUpperCase()}
                        </Label>
                        {long ? (
                          <Textarea
                            id={key}
                            rows={field === "full_description" ? 6 : 3}
                            value={values[key] ?? ""}
                            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                          />
                        ) : (
                          <Input
                            id={key}
                            value={values[key] ?? ""}
                            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            {t("admin.common.cancel")}
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !draft}>
            {save.isPending ? t("admin.common.saving") : t("admin.common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
