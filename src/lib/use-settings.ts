/**
 * The query and mutation every settings page needs.
 *
 * Twelve screens each re-implementing "load the settings, save the changed
 * ones, show the field errors the server sent back" is twelve chances to get
 * the error path subtly different. This is that logic once.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { useI18n } from "./i18n";
import { getSettings, saveSettingsFn } from "./settings.functions";
import type { ResolvedSetting, SettingValue } from "./settings-schema";
import type { SecretStatus, SecretStoreCapability } from "./secrets";

export type SettingsBundle = {
  settings: ResolvedSetting[];
  secrets: SecretStatus[];
  capability: SecretStoreCapability;
};

export const SETTINGS_QUERY_KEY = ["admin-settings"];

export function useSettings() {
  const fetchSettings = useServerFn(getSettings);
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => fetchSettings({}) as Promise<SettingsBundle>,
  });
}

export function useSaveSettings() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const save = useServerFn(saveSettingsFn);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (values: Record<string, SettingValue>) => save({ data: { values } }),
    onSuccess: (result) => {
      // A refused save comes back as data rather than an error, because the
      // per-field messages are the useful part and an exception would flatten
      // them into one string.
      if (result && "ok" in result && result.ok === false) {
        setErrors(result.errors as Record<string, string>);
        toast.error(t("admin.set.saveFailed"));
        return;
      }
      setErrors({});
      toast.success(t("admin.set.saved"));
      void queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["admin-connections"] });
    },
    onError: (error: Error) => {
      setErrors({});
      toast.error(error.message);
    },
  });

  return { ...mutation, errors, clearErrors: () => setErrors({}) };
}

/** Resolved values as a plain map, for the wizard and the readiness checks. */
export function valueMap(settings: ResolvedSetting[] | undefined): Record<string, SettingValue> {
  const values: Record<string, SettingValue> = {};
  for (const setting of settings ?? []) values[setting.key] = setting.value;
  return values;
}
