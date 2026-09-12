import type { ReactNode } from "react";

import { ErrorState, LoadingState, NoAccessState } from "@/components/admin/admin-ui";
import { SettingsForm, SettingsSection } from "@/components/admin/settings-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { useSaveSettings, useSettings } from "@/lib/use-settings";
import type { SettingCategory } from "@/lib/settings-schema";
import type { TranslationKey } from "@/lib/translations";

/**
 * A settings page that is nothing but a form over one category.
 *
 * Most of them are. The pages that also test a connection or hold a
 * credential build on the same pieces directly rather than through this.
 */
export function CategoryPage({
  category,
  title,
  description,
  omit,
  before,
  after,
}: {
  category: SettingCategory;
  title: TranslationKey;
  description: TranslationKey;
  omit?: string[];
  before?: ReactNode;
  after?: ReactNode;
}) {
  const { t } = useI18n();
  const can = useCan();
  const { data, isPending, error, refetch } = useSettings();
  const save = useSaveSettings();

  if (!can("settings", "view")) return <NoAccessState module={t("admin.module.settings")} />;
  if (isPending) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-5">
      {before}
      <SettingsSection title={t(title)} description={t(description)}>
        <SettingsForm
          category={category}
          resolved={data.settings}
          canEdit={can("settings", "edit")}
          saving={save.isPending}
          errors={save.errors}
          omit={omit}
          onSave={(values) => save.mutate(values)}
        />
      </SettingsSection>
      {after}
    </div>
  );
}
