import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, NoAccessState } from "@/components/admin/admin-ui";
import {
  ConnectionCard,
  HelpNote,
  SecretGroup,
  SettingsForm,
  SettingsSection,
} from "@/components/admin/settings-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { useSaveSettings, useSettings } from "@/lib/use-settings";
import { useConnections, useConnectionTest } from "@/lib/use-connections";
import { useSecretActions } from "@/lib/use-secrets";

export const Route = createFileRoute("/beheer/instellingen/bol")({
  component: BolSettingsPage,
});

const BOL_SECRETS = ["BOL_CLIENT_ID", "BOL_CLIENT_SECRET", "SYNC_TRIGGER_SECRET"];

function BolSettingsPage() {
  const { t } = useI18n();
  const can = useCan();
  const settings = useSettings();
  const connections = useConnections();
  const save = useSaveSettings();
  const secrets = useSecretActions();
  const { results, running, test } = useConnectionTest();

  if (!can("integrations", "view"))
    return <NoAccessState module={t("admin.module.integrations")} />;
  if (settings.isPending || connections.isPending) return <LoadingState />;
  if (connections.error) {
    return (
      <ErrorState message={connections.error.message} onRetry={() => void connections.refetch()} />
    );
  }
  if (settings.error) {
    return <ErrorState message={settings.error.message} onRetry={() => void settings.refetch()} />;
  }

  const bol = connections.data.integrations.find((entry) => entry.id === "bol");

  return (
    <div className="space-y-5">
      {bol ? (
        <ConnectionCard
          status={bol}
          canTest={can("integrations", "view")}
          testing={running === "bol"}
          result={results.bol}
          onTest={() => test("bol")}
        >
          <Button size="sm" variant="ghost" asChild>
            <Link to="/beheer/bolcom">{t("admin.bol.openSync")}</Link>
          </Button>
        </ConnectionCard>
      ) : null}

      <SecretGroup
        title={t("admin.secret.title")}
        secrets={connections.data.secrets.filter((entry) => BOL_SECRETS.includes(entry.name))}
        capability={connections.data.capability}
        canManage={can("secrets", "manage_settings")}
        savingName={secrets.pending}
        onSave={secrets.save}
        onRemove={secrets.remove}
      />

      <SettingsSection title={t("admin.page.bol.title")} description={t("admin.page.bol.body")}>
        <SettingsForm
          category="integrations"
          resolved={settings.data.settings}
          canEdit={can("settings", "edit")}
          saving={save.isPending}
          errors={save.errors}
          // The analytics identifiers live in the same category but belong on
          // the connections page; only the bol.com switch belongs here.
          omit={["integrations.ga_measurement_id", "integrations.meta_pixel_id"]}
          onSave={(next) => save.mutate(next)}
        />
        <HelpNote body="admin.bol.help" />
      </SettingsSection>
    </div>
  );
}
