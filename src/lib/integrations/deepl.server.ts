/**
 * DeepL: status, a live translation test, and usage.
 *
 * The test translates a sentence the administrator types and shows the result.
 * That is the only test worth having here — a key that authenticates but
 * translates into the wrong language is a shop full of wrong copy, and only
 * reading the output catches it.
 */

import { readSecret, secretStatus } from "../secret-store.server";
import { settingValue } from "../settings.server";
import {
  describeFailure,
  fetchWithTimeout,
  msg,
  raw,
  setOrNot,
  type IntegrationStatus,
  type StatusDetail,
  type TestResult,
} from "./types";

/**
 * DeepL runs two hosts. A key ending in `:fx` belongs to the free tier and only
 * works against api-free; using the wrong host returns 403 with a message that
 * sounds like a bad key, which sends people hunting for the wrong problem.
 */
export function endpointFor(key: string | undefined, configured: "free" | "pro"): string {
  if (key?.trim().endsWith(":fx")) return "https://api-free.deepl.com";
  if (configured === "free") return "https://api-free.deepl.com";
  return "https://api.deepl.com";
}

export const TARGET_LANGUAGES = ["EN-GB", "DE", "FR"] as const;

/**
 * The plan to route by.
 *
 * The stored default is "free", so honouring it blindly would send a Pro
 * account to the free host the moment this setting existed. An unchosen plan
 * is therefore inferred from the key, the way the code did before the setting
 * did — a `:fx` suffix means free, anything else means pro.
 */
async function effectivePlan(key: string | undefined): Promise<"free" | "pro"> {
  const { resolveSetting } = await import("../settings.server");
  const setting = await resolveSetting("translations.endpoint");
  if (setting.source !== "default") return setting.value as "free" | "pro";
  return key?.trim().endsWith(":fx") ? "free" : "pro";
}

export async function status(): Promise<IntegrationStatus> {
  const [secret, endpoint, onCreate, onUpdate, keepManual] = await Promise.all([
    secretStatus("DEEPL_API_KEY"),
    settingValue<"free" | "pro">("translations.endpoint"),
    settingValue<boolean>("translations.auto_on_create"),
    settingValue<boolean>("translations.auto_on_update"),
    settingValue<boolean>("translations.keep_manual"),
  ]);

  const details: StatusDetail[] = [
    {
      label: msg("admin.conn.label.apiKey"),
      value: setOrNot(secret.configured),
      level: secret.configured ? "ok" : "neutral",
    },
    {
      label: msg("admin.conn.label.plan"),
      value: msg(endpoint === "pro" ? "admin.conn.deepl.pro" : "admin.conn.deepl.free"),
      level: "neutral",
    },
    { label: msg("admin.conn.label.languages"), value: raw("NL → EN · DE · FR"), level: "neutral" },
    {
      label: msg("admin.conn.label.newProducts"),
      value: msg(onCreate ? "admin.conn.deepl.auto" : "admin.conn.deepl.manual"),
      level: "neutral",
    },
    {
      label: msg("admin.conn.label.changedText"),
      value: msg(onUpdate ? "admin.conn.deepl.autoUpdate" : "admin.conn.deepl.manual"),
      level: "neutral",
    },
    {
      label: msg("admin.conn.label.manualTranslations"),
      value: msg(keepManual ? "admin.conn.deepl.kept" : "admin.conn.deepl.overwritten"),
      level: keepManual ? "ok" : "attention",
    },
  ];

  return {
    id: "deepl",
    // Translation is optional: a shop selling only in Dutch is not broken for
    // lacking it, so an absent key is neutral rather than a warning.
    state: secret.configured ? "configured" : "not_configured",
    level: secret.configured ? "ok" : "neutral",
    details,
    lastTestedAt: null,
    testMode: false,
  };
}

/** Translates a sample so the administrator can read the result. */
export async function testTranslation(
  text: string,
  target: (typeof TARGET_LANGUAGES)[number],
): Promise<TestResult> {
  const started = Date.now();
  const key = await readSecret("DEEPL_API_KEY");
  if (!key) return { ok: false, message: msg("admin.conn.deepl.noKey") };

  const host = endpointFor(key, await effectivePlan(key));

  try {
    const response = await fetchWithTimeout(`${host}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        text: text.slice(0, 500),
        source_lang: "NL",
        target_lang: target,
      }).toString(),
    });

    if (!response.ok) {
      if (response.status === 403) {
        // The most common DeepL mistake by a distance, and the error DeepL
        // returns for it reads like an invalid key.
        return {
          ok: false,
          message: msg("admin.conn.deepl.planMismatch"),
          durationMs: Date.now() - started,
        };
      }
      return {
        ok: false,
        message: describeFailure(new Error(`HTTP ${response.status}`), "deepl test"),
        durationMs: Date.now() - started,
      };
    }

    const payload = (await response.json()) as { translations?: { text: string }[] };
    const translated = payload.translations?.[0]?.text;

    if (!translated) {
      return {
        ok: false,
        message: msg("admin.conn.deepl.noTranslation"),
        durationMs: Date.now() - started,
      };
    }

    return {
      ok: true,
      // The translation itself. Showing it is the entire point of the test.
      message: raw(translated),
      details: [
        { label: msg("admin.conn.label.from"), value: raw(text.slice(0, 120)), level: "neutral" },
        { label: msg("admin.conn.label.to"), value: raw(target), level: "neutral" },
      ],
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      message: describeFailure(error, "deepl test"),
      durationMs: Date.now() - started,
    };
  }
}

/** Characters used against the plan's allowance, when DeepL reports it. */
export async function usage(): Promise<TestResult> {
  const key = await readSecret("DEEPL_API_KEY");
  if (!key) return { ok: false, message: msg("admin.conn.deepl.noKey") };

  const host = endpointFor(key, await effectivePlan(key));

  try {
    const response = await fetchWithTimeout(`${host}/v2/usage`, {
      headers: { Authorization: `DeepL-Auth-Key ${key}` },
    });
    if (!response.ok) {
      return {
        ok: false,
        message: describeFailure(new Error(`HTTP ${response.status}`), "deepl usage"),
      };
    }

    const payload = (await response.json()) as {
      character_count?: number;
      character_limit?: number;
    };
    const used = payload.character_count ?? 0;
    const limit = payload.character_limit ?? 0;
    const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;

    return {
      ok: true,
      message:
        limit > 0
          ? msg("admin.conn.deepl.usageOf", { used, limit, percent })
          : msg("admin.conn.deepl.usage", { used }),
      details: [
        {
          label: msg("admin.conn.label.usage"),
          value: raw(`${percent}%`),
          level: percent > 90 ? "critical" : percent > 75 ? "attention" : "ok",
        },
      ],
    };
  } catch (error) {
    return { ok: false, message: describeFailure(error, "deepl usage") };
  }
}
