import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Rocket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, NoAccessState } from "@/components/admin/admin-ui";
import {
  ChecklistRow,
  ConnectionCard,
  ProgressBar,
  SettingsSection,
} from "@/components/admin/settings-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { SETTINGS_QUERY_KEY, useSettings, valueMap } from "@/lib/use-settings";
import { useConnections, useConnectionTest } from "@/lib/use-connections";
import { acknowledgeSetupStep } from "@/lib/settings.functions";
import { setupProgress } from "@/lib/setup-wizard";
import type { TranslationKey } from "@/lib/translations";
import type { ConnectionState, IntegrationId } from "@/lib/integrations/types";

export const Route = createFileRoute("/beheer/instellingen/")({
  component: SetupOverview,
});

/**
 * Where somebody setting up the shop starts, and where somebody running it
 * checks that nothing has quietly broken.
 *
 * The step counter is the honest kind: each step decides for itself whether it
 * is done by looking at real data, so "8 / 12" means eight things are actually
 * true, not that somebody clicked eight times.
 */
function SetupOverview() {
  const { t } = useI18n();
  const can = useCan();
  const queryClient = useQueryClient();
  const settings = useSettings();
  const connections = useConnections();
  const { results, running, test } = useConnectionTest();
  const acknowledge = useServerFn(acknowledgeSetupStep);

  const acknowledgeMutation = useMutation({
    mutationFn: (input: { step: string; done: boolean }) => acknowledge({ data: input }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY }),
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
  const acknowledged = Array.isArray(values["system.setup_completed_steps"])
    ? (values["system.setup_completed_steps"] as string[])
    : [];

  const states: Partial<Record<IntegrationId, ConnectionState>> = {};
  for (const integration of connections.data.integrations)
    states[integration.id] = integration.state;

  const progress = setupProgress({
    settings: values,
    secrets: connections.data.secrets,
    states,
    acknowledged,
  });

  return (
    <div className="space-y-5">
      <SettingsSection
        title={t("admin.wizard.title")}
        description={t("admin.wizard.body")}
        action={
          progress.blocking.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Rocket className="size-3.5" aria-hidden />
              {t("admin.wizard.ready")}
            </span>
          ) : undefined
        }
      >
        <ProgressBar
          completed={progress.completed}
          total={progress.total}
          label={t("admin.wizard.progress")}
        />

        <ul className="mt-4 divide-y divide-border/60">
          {progress.steps.map(({ step, complete }) => (
            <ChecklistRow
              key={step.id}
              complete={complete}
              title={t(step.title as TranslationKey)}
              description={t(step.description as TranslationKey)}
              to={step.to}
              action={
                // Only the steps whose subject is a judgement can be ticked.
                // Everything else is measured, and a button that overrode that
                // would turn the checklist into decoration.
                step.acknowledged && can("settings", "edit") ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={acknowledgeMutation.isPending}
                    onClick={() => acknowledgeMutation.mutate({ step: step.id, done: !complete })}
                  >
                    {t(complete ? "admin.wizard.untick" : "admin.wizard.tick")}
                  </Button>
                ) : undefined
              }
            />
          ))}
        </ul>

        {progress.blocking.length > 0 ? (
          <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            {t("admin.wizard.blocking", { count: progress.blocking.length })}
          </p>
        ) : null}
      </SettingsSection>

      {can("integrations", "view") ? (
        <SettingsSection
          title={t("admin.conn.title")}
          description={t("admin.conn.subtitle")}
          action={
            <Button size="sm" variant="ghost" asChild>
              <Link to="/beheer/instellingen/integraties">{t("admin.wizard.allConnections")}</Link>
            </Button>
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {connections.data.integrations.map((status) => (
              <ConnectionCard
                key={status.id}
                status={status}
                canTest={can("integrations", "view")}
                testing={running === status.id}
                result={results[status.id]}
                onTest={() => test(status.id)}
              />
            ))}
          </div>
        </SettingsSection>
      ) : null}
    </div>
  );
}
