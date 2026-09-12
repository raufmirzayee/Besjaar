/**
 * Public settings, in the browser.
 *
 * The storefront's counterpart to the admin's settings screens: the same
 * values, resolved the same way, but only the ones marked public. Cached for
 * the session because they change rarely and every component that wants one
 * would otherwise ask again.
 */

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getPublicSettings } from "./settings.functions";
import type { SettingValues } from "./settings-schema";

export const PUBLIC_SETTINGS_QUERY_KEY = ["public-settings"];

export function usePublicSettings() {
  const fetchSettings = useServerFn(getPublicSettings);
  return useQuery({
    queryKey: PUBLIC_SETTINGS_QUERY_KEY,
    queryFn: () => fetchSettings({}) as Promise<SettingValues>,
    // Shop configuration, not live data. Refetching it on every window focus
    // would be a request per tab switch for something that changes monthly.
    staleTime: 5 * 60_000,
  });
}

/** One public setting as a string, or "" until it has loaded. */
export function usePublicSetting(key: string): string {
  const { data } = usePublicSettings();
  const value = data?.[key];
  return typeof value === "string" ? value : "";
}
