import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, NoAccessState } from "@/components/admin/admin-ui";
import { ConnectionCard, SettingsSection, TestResultPanel } from "@/components/admin/settings-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { useConnections, useSupabaseChecks, type SupabaseArea } from "@/lib/use-connections";
import type { TranslationKey } from "@/lib/translations";

export const Route = createFileRoute("/beheer/instellingen/supabase")({
  component: SupabasePage,
});

const AREAS: { id: SupabaseArea; title: TranslationKey; body: TranslationKey }[] = [
  { id: "database", title: "admin.sb.database", body: "admin.sb.databaseBody" },
  { id: "auth", title: "admin.sb.auth", body: "admin.sb.authBody" },
  { id: "storage", title: "admin.sb.storage", body: "admin.sb.storageBody" },
  { id: "rls", title: "admin.sb.rls", body: "admin.sb.rlsBody" },
  { id: "admins", title: "admin.sb.admins", body: "admin.sb.adminsBody" },
];

/**
 * The checks worth having on a screen rather than only in the test suite.
 *
 * Each one calls the real thing. The row-level-security check is the same
 * query that would have caught the staff directory being readable by every
 * signed-in customer, which is a good argument for it being one button away
 * rather than one deploy away.
 */
function SupabasePage() {
  const { t } = useI18n();
  const can = useCan();
  const connections = useConnections();
  const { results, running, check } = useSupabaseChecks();

  if (!can("integrations", "view"))
    return <NoAccessState module={t("admin.module.integrations")} />;
  if (connections.isPending) return <LoadingState />;
  if (connections.error) {
    return (
      <ErrorState message={connections.error.message} onRetry={() => void connections.refetch()} />
    );
  }

  const supabase = connections.data.integrations.find((entry) => entry.id === "supabase");

  return (
    <div className="space-y-5">
      {supabase ? <ConnectionCard status={supabase} canTest={false} /> : null}

      <SettingsSection
        title={t("admin.page.supabase.title")}
        description={t("admin.page.supabase.body")}
      >
        <ul className="divide-y divide-border/60">
          {AREAS.map((area) => (
            <li key={area.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t(area.title)}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {t(area.body)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={running !== null}
                  onClick={() => check(area.id)}
                >
                  {running === area.id ? (
                    <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Play className="mr-2 size-3.5" aria-hidden />
                  )}
                  {t("admin.sb.run")}
                </Button>
              </div>
              {results[area.id] ? <TestResultPanel result={results[area.id]!} /> : null}
            </li>
          ))}
        </ul>
      </SettingsSection>

      <SettingsSection title={t("admin.sb.keys.title")} description={t("admin.sb.keys.body")}>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("admin.sb.keys.detail")}</p>
      </SettingsSection>
    </div>
  );
}
