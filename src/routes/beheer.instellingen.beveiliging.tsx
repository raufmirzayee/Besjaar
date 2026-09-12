import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, NoAccessState } from "@/components/admin/admin-ui";
import {
  ChecklistRow,
  LevelDot,
  SettingsSection,
  TestResultPanel,
} from "@/components/admin/settings-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { useConnections, useSupabaseChecks } from "@/lib/use-connections";
import { useSettings, valueMap } from "@/lib/use-settings";

export const Route = createFileRoute("/beheer/instellingen/beveiliging")({
  component: SecurityPage,
});

/**
 * What is protecting the shop, and what is not.
 *
 * Deliberately short on reassurance. Every row here is something the page can
 * actually observe — a credential that lives server-side, a check that can be
 * run now, a setting whose value is visible. Nothing claims the shop is secure,
 * because no screen can know that.
 */
function SecurityPage() {
  const { t } = useI18n();
  const can = useCan();
  const connections = useConnections();
  const settings = useSettings();
  const { results, running, check } = useSupabaseChecks();

  if (!can("security", "view")) return <NoAccessState module={t("admin.module.security")} />;
  if (connections.isPending) return <LoadingState />;
  if (connections.error) {
    return (
      <ErrorState message={connections.error.message} onRetry={() => void connections.refetch()} />
    );
  }

  const values = valueMap(settings.data?.settings);
  const capability = connections.data.capability;
  const vaultSecrets = connections.data.secrets.filter((entry) => entry.source === "vault");
  const envSecrets = connections.data.secrets.filter((entry) => entry.source === "environment");
  const indexing = values["seo.indexing_enabled"] === true;
  const mode = String(values["payments.mode"] ?? "disabled");

  return (
    <div className="space-y-5">
      <SettingsSection
        title={t("admin.sec.posture.title")}
        description={t("admin.sec.posture.body")}
      >
        <ul className="divide-y divide-border/60">
          <ChecklistRow
            complete
            title={t("admin.sec.mfa")}
            description={t("admin.sec.mfaBody")}
            action={
              <Button size="sm" variant="ghost" asChild>
                <Link to="/beheer/medewerkers">{t("admin.sec.openStaff")}</Link>
              </Button>
            }
          />
          <ChecklistRow
            complete={capability.writable}
            title={t("admin.sec.storage")}
            description={t(capability.writable ? "admin.sec.storageVault" : "admin.sec.storageEnv")}
          />
          <ChecklistRow
            complete
            title={t("admin.sec.serverOnly")}
            description={t("admin.sec.serverOnlyBody")}
          />
          <ChecklistRow
            complete={mode !== "live" || indexing}
            title={t("admin.sec.mode")}
            description={t("admin.sec.modeBody", {
              mode: t(`admin.set.opt.mode.${mode}` as never),
            })}
          />
          <ChecklistRow
            complete={indexing}
            title={t("admin.sec.indexing")}
            description={t(indexing ? "admin.sec.indexingOn" : "admin.sec.indexingOff")}
            action={
              <Button size="sm" variant="ghost" asChild>
                <Link to="/beheer/instellingen/seo">{t("admin.conn.configure")}</Link>
              </Button>
            }
          />
        </ul>
      </SettingsSection>

      <SettingsSection
        title={t("admin.sec.credentials.title")}
        description={t("admin.sec.credentials.body")}
      >
        <dl className="divide-y divide-border/60 text-sm">
          <div className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-muted-foreground">{t("admin.sec.inVault")}</dt>
            <dd className="flex items-center gap-2">
              <LevelDot level="ok" />
              {vaultSecrets.length}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-muted-foreground">{t("admin.sec.inEnv")}</dt>
            <dd className="flex items-center gap-2">
              <LevelDot level="neutral" />
              {envSecrets.length}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t("admin.sec.credentialsNote")}
        </p>
      </SettingsSection>

      <SettingsSection title={t("admin.sec.checks.title")} description={t("admin.sec.checks.body")}>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={running !== null}
            onClick={() => check("rls")}
          >
            {running === "rls" ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
            ) : (
              <Play className="mr-2 size-3.5" aria-hidden />
            )}
            {t("admin.sec.runRls")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={running !== null}
            onClick={() => check("storage")}
          >
            {running === "storage" ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
            ) : (
              <Play className="mr-2 size-3.5" aria-hidden />
            )}
            {t("admin.sec.runStorage")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={running !== null}
            onClick={() => check("admins")}
          >
            {running === "admins" ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
            ) : (
              <Play className="mr-2 size-3.5" aria-hidden />
            )}
            {t("admin.sec.runAdmins")}
          </Button>
        </div>
        {results.rls ? <TestResultPanel result={results.rls} /> : null}
        {results.storage ? <TestResultPanel result={results.storage} /> : null}
        {results.admins ? <TestResultPanel result={results.admins} /> : null}

        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Button size="sm" variant="ghost" asChild>
            <Link to="/beheer/audit">{t("admin.sec.openAudit")}</Link>
          </Button>
        </p>
      </SettingsSection>
    </div>
  );
}
