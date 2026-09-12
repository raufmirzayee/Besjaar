/**
 * Reading and writing store settings.
 *
 * The resolution chain is the whole point of this module:
 *
 *   database row  →  environment variable  →  application default
 *
 * An installation running today has no rows at all, so every setting resolves
 * to the environment variable it has always used, and nothing changes. The
 * first time somebody saves a value in the admin, that row takes over. Nobody
 * has to migrate anything, and nobody has to redeploy to get back to where they
 * were — deleting the row falls through to the environment again.
 *
 * A credential never passes through here. `settings-schema.ts` has no way to
 * describe one, and the write path refuses any key it does not know.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  PUBLIC_SETTING_KEYS,
  SETTINGS,
  SETTING_KEYS,
  validateSetting,
  type ResolvedSetting,
  type SaveResult,
  type SettingCategory,
  type SettingValue,
  type SettingValues,
} from "./settings-schema";

export type { ResolvedSetting, SaveResult, SettingSource, SettingValues } from "./settings-schema";

type Row = { key: string; value: SettingValue; updated_at: string };

/**
 * Settings are read on nearly every server render, and they change rarely.
 * A short cache keeps that from being a database round trip per request without
 * making a save take visibly long to appear.
 */
const CACHE_MS = 15_000;
let cache: { at: number; rows: Map<string, Row> } | null = null;

async function loadRows(): Promise<Map<string, Row>> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;

  const rows = new Map<string, Row>();
  try {
    const { data, error } = await supabaseAdmin
      .from("store_settings")
      .select("key, value, updated_at");
    if (error) throw new Error(error.message);

    for (const row of (data ?? []) as Row[]) {
      // A seeded row holds JSON null until somebody saves something. That is
      // "not configured", not "configured as nothing", so it must fall through
      // to the environment rather than override it with null.
      if (row.value === null) continue;
      rows.set(row.key, row);
    }
    cache = { at: Date.now(), rows };
  } catch (error) {
    // The storefront must not go down because the settings table is briefly
    // unreachable. Every setting falls back to the environment and the
    // application default, which is where it was before this table existed.
    console.error("[settings] could not read store_settings, using defaults:", error);
    if (cache) return cache.rows;
  }
  return rows;
}

/** Drops the cache so the next read sees a write immediately. */
export function invalidateSettingsCache(): void {
  cache = null;
}

function fromEnvironment(key: string): SettingValue | undefined {
  const definition = SETTINGS[key];
  if (!definition?.envKey) return undefined;

  const raw = process.env[definition.envKey];
  if (raw === undefined || raw.trim() === "") return undefined;

  // The environment is all strings. Coerce to the shape the schema expects,
  // then let the schema decide whether the result is acceptable — an
  // unparseable value is treated as absent rather than as a validation error,
  // because a deployment that has been running should not start failing.
  const text = raw.trim();
  const parsed = definition.schema.safeParse(text);
  if (parsed.success) return parsed.data as SettingValue;

  const asNumber = Number(text);
  if (Number.isFinite(asNumber) && definition.schema.safeParse(asNumber).success) return asNumber;

  if (text === "true" || text === "false") {
    const asBoolean = text === "true";
    if (definition.schema.safeParse(asBoolean).success) return asBoolean;
  }

  return undefined;
}

/** One setting, with where it came from. */
export async function resolveSetting(key: string): Promise<ResolvedSetting> {
  const definition = SETTINGS[key];
  if (!definition) throw new Error(`Onbekende instelling: ${key}`);

  const rows = await loadRows();
  const row = rows.get(key);
  if (row !== undefined) {
    return { key, value: row.value, source: "database", updatedAt: row.updated_at };
  }

  const env = fromEnvironment(key);
  if (env !== undefined) return { key, value: env, source: "environment", updatedAt: null };

  return { key, value: definition.fallback, source: "default", updatedAt: null };
}

/** Every setting, resolved. */
export async function resolveAllSettings(): Promise<ResolvedSetting[]> {
  const rows = await loadRows();

  return SETTING_KEYS.map((key) => {
    const definition = SETTINGS[key];
    const row = rows.get(key);
    if (row !== undefined) {
      return { key, value: row.value, source: "database" as const, updatedAt: row.updated_at };
    }
    const env = fromEnvironment(key);
    if (env !== undefined) {
      return { key, value: env, source: "environment" as const, updatedAt: null };
    }
    return { key, value: definition.fallback, source: "default" as const, updatedAt: null };
  });
}

/** A plain key/value map, for code that wants a value and not its provenance. */
export async function settingValues(): Promise<SettingValues> {
  const resolved = await resolveAllSettings();
  const values: SettingValues = {};
  for (const setting of resolved) values[setting.key] = setting.value;
  return values;
}

/** Shorthand for one value. */
export async function settingValue<T>(key: string): Promise<T> {
  return (await resolveSetting(key)).value as T;
}

export async function settingsForCategory(category: SettingCategory): Promise<ResolvedSetting[]> {
  const all = await resolveAllSettings();
  return all.filter((setting) => SETTINGS[setting.key]?.category === category);
}

/**
 * The settings an anonymous visitor may have.
 *
 * Built from the schema's own `isPublic` flags rather than from the database
 * column, so a row that somehow got flagged public in the database cannot leak
 * a key the application never intended to expose. The two agree today; this is
 * the belt.
 */
export async function publicSettings(): Promise<SettingValues> {
  const resolved = await resolveAllSettings();
  const values: SettingValues = {};
  for (const setting of resolved) {
    if (PUBLIC_SETTING_KEYS.includes(setting.key)) values[setting.key] = setting.value;
  }
  return values;
}

/**
 * Writes settings.
 *
 * Validates every value before writing any of them, so a form with one bad
 * field does not half-save. Callers are responsible for the permission check
 * and the audit entry — both live in the server function, where the caller's
 * identity is known.
 */
export async function saveSettings(
  values: Record<string, unknown>,
  actorId: string | null,
): Promise<SaveResult> {
  const errors: Record<string, string> = {};
  const accepted: { key: string; value: SettingValue; isPublic: boolean }[] = [];

  for (const [key, value] of Object.entries(values)) {
    const definition = SETTINGS[key];
    if (!definition) {
      // An unknown key is not a typo to be tolerated: it is the shape an
      // attempt to write something that is not a setting would take.
      errors[key] = "Onbekende instelling";
      continue;
    }

    const result = validateSetting(key, value);
    if (!result.ok) {
      errors[key] = result.error;
      continue;
    }
    accepted.push({ key, value: result.value, isPublic: definition.isPublic });
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  for (const setting of accepted) {
    const { error } = await supabaseAdmin.rpc("set_store_setting", {
      p_key: setting.key,
      p_value: setting.value as never,
      p_actor: actorId,
      p_is_public: setting.isPublic,
    });
    if (error) throw new Error(error.message);
  }

  invalidateSettingsCache();
  return { ok: true, saved: accepted.map((setting) => setting.key) };
}
