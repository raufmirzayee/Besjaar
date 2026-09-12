import { createFileRoute } from "@tanstack/react-router";

import { ErrorState, LoadingState, NoAccessState } from "@/components/admin/admin-ui";
import {
  ConnectionCard,
  SecretGroup,
  SettingsForm,
  SettingsSection,
} from "@/components/admin/settings-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { useSaveSettings, useSettings } from "@/lib/use-settings";
import { useConnections, useConnectionTest } from "@/lib/use-connections";
import { useSecretActions } from "@/lib/use-secrets";
import type { IntegrationId } from "@/lib/integrations/types";

export const Route = createFileRoute("/beheer/instellingen/integraties")({
  component: ConnectionsPage,
});

/** Where each card's own settings live, so a failing card has somewhere to go. */
const CONFIGURE: Partial<Record<IntegrationId, string>> = {
  mollie: "/beheer/instellingen/betalingen",
  resend: "/beheer/instellingen/email",
  deepl: "/beheer/instellingen/vertalingen",
  bol: "/beheer/instellingen/bol",
  supabase: "/beheer/instellingen/supabase",
};

/**
 * Every connection on one screen.
 *
 * The cards say what is true rather than what is hoped: a card reads
 * "connected" only after a call to that service came back, and "set up" when
 * credentials exist but nothing has been proven. Nothing here runs on load —
 * testing costs somebody else's quota, so it waits for a button.
 */
function ConnectionsPage() {
  const { t } = useI18n();
  const can = useCan();
  const connections = useConnections();
  const settings = useSettings();
  const save = useSaveSettings();
  const secrets = useSecretActions();
  const { results, running, test } = useConnectionTest();

  if (!can("integrations", "view"))
    return <NoAccessState module={t("admin.module.integrations")} />;
  if (connections.isPending) return <LoadingState />;
  if (connections.error) {
    return (
      <ErrorState message={connections.error.message} onRetry={() => void connections.refetch()} />
    );
  }

  return (
    <div className="space-y-5">
      <SettingsSection title={t("admin.conn.title")} description={t("admin.conn.subtitle")}>
        <div className="grid gap-4 lg:grid-cols-2">
          {connections.data.integrations.map((status) => (
            <ConnectionCard
              key={status.id}
              status={status}
              canTest={can("integrations", "view")}
              testing={running === status.id}
              result={results[status.id]}
              onTest={() => test(status.id)}
              configureTo={CONFIGURE[status.id]}
            />
          ))}
        </div>
      </SettingsSection>

      {settings.data && can("settings", "view") ? (
        <SettingsSection
          title={t("admin.page.analytics.title")}
          description={t("admin.page.analytics.body")}
        >
          <SettingsForm
            category="integrations"
            resolved={settings.data.settings}
            canEdit={can("settings", "edit")}
            saving={save.isPending}
            errors={save.errors}
            omit={["integrations.bol_auto_sync"]}
            onSave={(next) => save.mutate(next)}
          />
        </SettingsSection>
      ) : null}

      <SecretGroup
        title={t("admin.secret.title")}
        secrets={connections.data.secrets}
        capability={connections.data.capability}
        canManage={can("secrets", "manage_settings")}
        savingName={secrets.pending}
        onSave={secrets.save}
        onRemove={secrets.remove}
      />
    </div>
  );
}
