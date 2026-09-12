import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, NoAccessState } from "@/components/admin/admin-ui";
import { DetailList, SettingsSection } from "@/components/admin/settings-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { useSettings, valueMap } from "@/lib/use-settings";
import { useConnections } from "@/lib/use-connections";
import { exportSettings } from "@/lib/settings.functions";
import { msg, raw, type StatusDetail } from "@/lib/integrations/types";

export const Route = createFileRoute("/beheer/instellingen/systeem")({
  component: SystemPage,
});

function SystemPage() {
  const { t } = useI18n();
  const can = useCan();
  const settings = useSettings();
  const connections = useConnections();
  const runExport = useServerFn(exportSettings);

  const exportMutation = useMutation({
    mutationFn: async () =>
      (await runExport({})) as {
        exportedAt: string;
        containsSecrets: false;
        settings: Record<string, unknown>;
      },
    onSuccess: (payload) => {
      // Built in the browser from what the server returned. There is no
      // credential in it — the export function has no access to one.
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `besjaar-instellingen-${payload.exportedAt.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!can("settings", "view")) return <NoAccessState module={t("admin.module.settings")} />;
  if (settings.isPending || connections.isPending) return <LoadingState />;
  if (settings.error) {
    return <ErrorState message={settings.error.message} onRetry={() => void settings.refetch()} />;
  }
  if (connections.error) {
    return (
      <ErrorState message={connections.error.message} onRetry={() => void connections.refetch()} />
    );
  }

  const values = valueMap(settings.data.settings);
  const capability = connections.data.capability;
  const fromEnvironment = settings.data.settings.filter(
    (entry) => entry.source === "environment",
  ).length;
  const fromDatabase = settings.data.settings.filter((entry) => entry.source === "database").length;

  const health: StatusDetail[] = [
    {
      label: msg("admin.sys.storeUrl"),
      value: raw(String(values["general.site_url"] ?? "")),
      level: String(values["general.site_url"] ?? "").startsWith("https://") ? "ok" : "critical",
    },
    {
      label: msg("admin.sys.secretBackend"),
      value: msg(capability.writable ? "admin.conn.store.vault" : "admin.conn.store.environment"),
      level: capability.writable ? "ok" : "neutral",
    },
    {
      label: msg("admin.sys.fromDatabase"),
      value: raw(String(fromDatabase)),
      level: "neutral",
    },
    {
      label: msg("admin.sys.fromEnvironment"),
      value: raw(String(fromEnvironment)),
      level: "neutral",
    },
  ];

  return (
    <div className="space-y-5">
      <SettingsSection title={t("admin.sys.health.title")} description={t("admin.sys.health.body")}>
        <DetailList details={health} />
        {!capability.writable && capability.reason ? (
          <p className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            {capability.reason}
          </p>
        ) : null}
      </SettingsSection>

      <SettingsSection
        title={t("admin.sys.export.title")}
        description={t("admin.sys.export.body")}
        action={
          can("settings", "export") ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              <Download className="mr-2 size-4" aria-hidden />
              {t("admin.sys.export.run")}
            </Button>
          ) : undefined
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("admin.sys.export.detail")}
        </p>
      </SettingsSection>

      <SettingsSection
        title={t("admin.sys.environment.title")}
        description={t("admin.sys.environment.body")}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("admin.sys.environment.detail")}
        </p>
      </SettingsSection>
    </div>
  );
}
