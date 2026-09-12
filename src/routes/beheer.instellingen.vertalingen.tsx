import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Languages } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { testTranslation } from "@/lib/connections.functions";
import type { TestResult } from "@/lib/integrations/types";

export const Route = createFileRoute("/beheer/instellingen/vertalingen")({
  component: TranslationSettingsPage,
});

const TARGETS = ["EN-GB", "DE", "FR"] as const;

function TranslationSettingsPage() {
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

  const deepl = connections.data.integrations.find((entry) => entry.id === "deepl");

  return (
    <div className="space-y-5">
      {deepl ? (
        <ConnectionCard
          status={deepl}
          canTest={can("integrations", "view")}
          testing={running === "deepl"}
          result={results.deepl}
          onTest={() => test("deepl")}
        />
      ) : null}

      <SecretGroup
        title={t("admin.secret.title")}
        secrets={connections.data.secrets.filter((entry) => entry.name === "DEEPL_API_KEY")}
        capability={connections.data.capability}
        canManage={can("secrets", "manage_settings")}
        savingName={secrets.pending}
        onSave={secrets.save}
        onRemove={secrets.remove}
      />

      <SettingsSection
        title={t("admin.page.translations.title")}
        description={t("admin.page.translations.body")}
      >
        <SettingsForm
          category="translations"
          resolved={settings.data.settings}
          canEdit={can("settings", "edit")}
          saving={save.isPending}
          errors={save.errors}
          onSave={(next) => save.mutate(next)}
        />
      </SettingsSection>

      {can("integrations", "view") ? <TranslationTest /> : null}
    </div>
  );
}

/**
 * Translates a sentence and shows the result.
 *
 * The only test worth having here. A DeepL key that authenticates but is
 * pointed at the wrong plan, or translates into a language you did not expect,
 * produces a shop full of wrong copy — and the only way to catch that is to
 * read what came back.
 */
function TranslationTest() {
  const { t } = useI18n();
  const run = useServerFn(testTranslation);
  const [text, setText] = useState("");
  const [target, setTarget] = useState<(typeof TARGETS)[number]>("EN-GB");
  const [result, setResult] = useState<TestResult | null>(null);

  const mutation = useMutation({
    mutationFn: async () => (await run({ data: { text, target } })) as TestResult,
    onSuccess: (value) => setResult(value),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SettingsSection title={t("admin.trans.test.title")} description={t("admin.trans.test.body")}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor="translate-sample">{t("admin.trans.test.label")}</Label>
          <Input
            id="translate-sample"
            className="mt-1.5"
            value={text}
            maxLength={500}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="translate-target">{t("admin.trans.test.target")}</Label>
          <Select value={target} onValueChange={(next) => setTarget(next as typeof target)}>
            <SelectTrigger id="translate-target" className="mt-1.5 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGETS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={!text.trim() || mutation.isPending}>
          <Languages className="mr-2 size-4" aria-hidden />
          {t("admin.trans.test.run")}
        </Button>
      </div>
      {result ? <TestResultPanel result={result} /> : null}
    </SettingsSection>
  );
}
