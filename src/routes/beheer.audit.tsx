import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

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
import type { TranslationKey } from "@/lib/translations";
import { useI18n } from "@/lib/i18n";
import { getAuditLogs } from "@/lib/admin-extra.functions";
import type { AuditRow } from "@/lib/admin-extra.server";
import { MODULE_LABELS } from "@/lib/admin-access";

export const Route = createFileRoute("/beheer/audit")({
  component: AuditPage,
});

const PAGE_SIZE = 25;

function AuditPage() {
  const { t } = useI18n();
  const allow = useCan();
  const fetchLogs = useServerFn(getAuditLogs);
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("alle");
  const [page, setPage] = useState(1);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin-audit", search, module, page],
    enabled: allow("audit", "view"),
    queryFn: () =>
      fetchLogs({
        data: { search: search || null, module: module === "alle" ? null : module, page },
      }) as Promise<{ rows: AuditRow[]; total: number }>,
  });

  if (!allow("audit", "view")) return <NoAccessState module="audit logs" />;

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title={t("admin.audit.title")}
        description="Onveranderlijke registratie van alle wijzigingen: wie, wat, wanneer en de oude en nieuwe waarde."
      />

      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="audit-search">{t("admin.common.search")}</Label>
          <Input
            id="audit-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("admin.audit.searchPlaceholder")}
          />
        </div>
        <div>
          <Label htmlFor="audit-module">{t("admin.audit.module")}</Label>
          <select
            id="audit-module"
            value={module}
            onChange={(e) => {
              setModule(e.target.value);
              setPage(1);
            }}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="alle">{t("admin.audit.allModules")}</option>
            {Object.entries(MODULE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label as TranslationKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : null}
      {data && rows.length === 0 ? (
        <EmptyState title={t("admin.audit.empty")} description={t("admin.audit.noMatch")} />
      ) : null}

      {rows.length ? (
        <div className="space-y-2">
          {rows.map((row) => (
            <details key={row.id} className="rounded-xl border border-border bg-card p-4">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{row.action}</span>
                <span className="text-muted-foreground">
                  {MODULE_LABELS[row.module as keyof typeof MODULE_LABELS]
                    ? t(MODULE_LABELS[row.module as keyof typeof MODULE_LABELS] as TranslationKey)
                    : row.module}
                </span>
                <span className="text-muted-foreground">
                  · {row.user_email ?? "systeem"} ·{" "}
                  {new Date(row.created_at).toLocaleString("nl-NL")}
                </span>
              </summary>
              <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                <div>
                  <p className="mb-1 font-semibold">{t("admin.audit.oldValue")}</p>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-2">
                    {row.old_value ?? "—"}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 font-semibold">{t("admin.audit.newValue")}</p>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-2">
                    {row.new_value ?? "—"}
                  </pre>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {row.entity_type ?? "object"} {row.entity_id ?? ""}
              </p>
            </details>
          ))}
        </div>
      ) : null}

      <Pager page={page} pageCount={pageCount} total={total} onPage={setPage} />
    </div>
  );
}
