import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState, NoAccessState } from "@/components/admin/admin-ui";
import {
  ConnectionCard,
  SecretGroup,
  SettingsForm,
  SettingsSection,
  TestResultPanel,
} from "@/components/admin/settings-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { useSaveSettings, useSettings } from "@/lib/use-settings";
import { useConnections, useConnectionTest } from "@/lib/use-connections";
import { useSecretActions } from "@/lib/use-secrets";
import { sendTestEmail } from "@/lib/connections.functions";
import type { TestResult } from "@/lib/integrations/types";

export const Route = createFileRoute("/beheer/instellingen/email")({
  component: EmailSettingsPage,
});

function EmailSettingsPage() {
  const { t } = useI18n();
  const can = useCan();
  const settings = useSettings();
  const connections = useConnections();
  const save = useSaveSettings();
  const secrets = useSecretActions();
  const { results, running, test } = useConnectionTest();

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

  const resend = connections.data.integrations.find((entry) => entry.id === "resend");

  return (
    <div className="space-y-5">
      {resend ? (
        <ConnectionCard
          status={resend}
          canTest={can("integrations", "view")}
          testing={running === "resend"}
          result={results.resend}
          onTest={() => test("resend")}
        />
      ) : null}

      <SecretGroup
        title={t("admin.secret.title")}
        secrets={connections.data.secrets.filter((entry) => entry.name === "RESEND_API_KEY")}
        capability={connections.data.capability}
        canManage={can("secrets", "manage_settings")}
        savingName={secrets.pending}
        onSave={secrets.save}
        onRemove={secrets.remove}
      />

      <SettingsSection title={t("admin.page.email.title")} description={t("admin.page.email.body")}>
        <SettingsForm
          category="email"
          resolved={settings.data.settings}
          canEdit={can("settings", "edit")}
          saving={save.isPending}
          errors={save.errors}
          onSave={(next) => save.mutate(next)}
        />
      </SettingsSection>

      {can("integrations", "edit") ? <TestEmail /> : null}
    </div>
  );
}

/**
 * Sends a real message to a real inbox.
 *
 * Separate from the connection test above on purpose. Authenticating against
 * Resend and actually delivering an e-mail are different claims, and a shop
 * whose key is valid but whose sending domain is unverified passes the first
 * and fails the second — which is exactly the failure that goes unnoticed until
 * a customer says they never got a confirmation.
 */
function TestEmail() {
  const { t } = useI18n();
  const send = useServerFn(sendTestEmail);
  const [to, setTo] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);

  const mutation = useMutation({
    mutationFn: async () => (await send({ data: { to } })) as TestResult,
    onSuccess: (value) => setResult(value),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SettingsSection title={t("admin.email.test.title")} description={t("admin.email.test.body")}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor="test-email">{t("admin.email.test.label")}</Label>
          <Input
            id="test-email"
            type="email"
            className="mt-1.5 max-w-sm"
            value={to}
            autoComplete="off"
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
        <Button
          onClick={() => mutation.mutate()}
          disabled={!to.includes("@") || mutation.isPending}
        >
          <Send className="mr-2 size-4" aria-hidden />
          {t("admin.email.test.send")}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("admin.email.test.limit")}</p>
      {result ? <TestResultPanel result={result} /> : null}
    </SettingsSection>
  );
}
