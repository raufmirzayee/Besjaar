import { createFileRoute } from "@tanstack/react-router";

import { ErrorState, LoadingState, NoAccessState } from "@/components/admin/admin-ui";
import { SettingsForm, SettingsSection } from "@/components/admin/settings-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { useSaveSettings, useSettings } from "@/lib/use-settings";

export const Route = createFileRoute("/beheer/instellingen/algemeen")({
  component: GeneralSettingsPage,
});

/**
 * Who the shop is.
 *
 * Two sections rather than one, because they answer different questions: the
 * first is what customers see, the second is what the law requires you to
 * publish. Both are empty on a fresh installation and neither is guessed —
 * a KvK number that is not yours would be a false statement on a page that has
 * to be true.
 */
function GeneralSettingsPage() {
  const { t } = useI18n();
  const can = useCan();
  const { data, isPending, error, refetch } = useSettings();
  const save = useSaveSettings();

  if (!can("settings", "view")) return <NoAccessState module={t("admin.module.settings")} />;
  if (isPending) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => void refetch()} />;

  const shared = {
    resolved: data.settings,
    canEdit: can("settings", "edit"),
    saving: save.isPending,
    errors: save.errors,
    onSave: (values: Parameters<typeof save.mutate>[0]) => save.mutate(values),
  };

  return (
    <div className="space-y-5">
      <SettingsSection
        title={t("admin.page.general.title")}
        description={t("admin.page.general.body")}
      >
        <SettingsForm category="general" {...shared} />
      </SettingsSection>
      <SettingsSection
        title={t("admin.page.company.title")}
        description={t("admin.page.company.body")}
      >
        <SettingsForm category="company" {...shared} />
      </SettingsSection>
    </div>
  );
}
