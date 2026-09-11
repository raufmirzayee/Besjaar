/**
 * Mollie: status, and a real connection test.
 *
 * The states this keeps apart, because a shop owner about to take real money
 * deserves to know which one they are actually in:
 *
 *   configured  an API key exists and has a plausible prefix
 *   connected   Mollie answered an authenticated call
 *   verified    the webhook URL is an https address Mollie could reach
 *   tested      a payment has actually been created and come back
 *
 * The key itself never leaves this file. `testConnection` returns a sentence
 * and a few labelled rows; the raw Mollie response goes to the server log.
 */

import { readSecret, secretStatus, secretStoreCapability } from "../secret-store.server";
import { settingValue } from "../settings.server";
import type { CheckoutMode } from "../settings-schema";
import {
  describeFailure,
  fetchWithTimeout,
  type IntegrationStatus,
  type StatusDetail,
  type TestResult,
} from "./types";

const MOLLIE_API = "https://api.mollie.com/v2";

/** Which environment a key belongs to, from its prefix alone. */
export function classifyKey(key: string | undefined): "live" | "test" | "unknown" | "absent" {
  if (!key || !key.trim()) return "absent";
  const trimmed = key.trim();
  if (trimmed.startsWith("live_")) return "live";
  if (trimmed.startsWith("test_")) return "test";
  return "unknown";
}

/**
 * Whether the key matches the mode the shop is in.
 *
 * A test key in live mode means customers complete a payment that never
 * charges them; a live key in test mode charges real cards during a staging
 * run. Both are worth refusing rather than warning about.
 */
export function keyMatchesMode(
  keyKind: ReturnType<typeof classifyKey>,
  mode: CheckoutMode,
): { ok: boolean; reason: string | null } {
  if (mode === "disabled") return { ok: true, reason: null };
  if (keyKind === "absent") return { ok: false, reason: "Er is geen Mollie-sleutel ingesteld." };
  if (keyKind === "unknown") {
    return { ok: false, reason: "De sleutel begint niet met test_ of live_." };
  }
  if (mode === "live" && keyKind === "test") {
    return { ok: false, reason: "Live modus met een testsleutel: klanten betalen niet echt." };
  }
  if (mode === "test" && keyKind === "live") {
    return { ok: false, reason: "Testmodus met een live sleutel: er wordt echt geld geïnd." };
  }
  return { ok: true, reason: null };
}

export async function status(): Promise<IntegrationStatus> {
  const [secret, mode, webhook] = await Promise.all([
    secretStatus("MOLLIE_API_KEY"),
    settingValue<CheckoutMode>("payments.mode"),
    settingValue<string>("payments.webhook_url"),
  ]);

  // Read only to classify the prefix. Never returned, never logged.
  const key = secret.configured ? await readSecret("MOLLIE_API_KEY") : undefined;
  const kind = classifyKey(key);
  const match = keyMatchesMode(kind, mode);

  const details: StatusDetail[] = [
    {
      label: "Modus",
      value: mode === "live" ? "Live" : mode === "test" ? "Test" : "Uitgeschakeld",
      level: mode === "live" ? "ok" : mode === "test" ? "attention" : "neutral",
    },
    {
      label: "API-sleutel",
      value: secret.configured
        ? `Ingesteld (${kind === "live" ? "live" : kind === "test" ? "test" : "onbekend type"})`
        : "Niet ingesteld",
      level: secret.configured ? (kind === "unknown" ? "attention" : "ok") : "critical",
    },
    {
      label: "Webhook",
      value: webhook ? "Adres ingesteld" : "Nog geen adres",
      level: webhook ? "ok" : "attention",
    },
  ];

  if (!match.ok && match.reason) {
    details.push({ label: "Let op", value: match.reason, level: "critical" });
  }

  const state = !secret.configured
    ? ("not_configured" as const)
    : mode === "disabled"
      ? ("disabled" as const)
      : !match.ok
        ? ("failed" as const)
        : ("configured" as const);

  return {
    id: "mollie",
    state,
    level: !secret.configured
      ? "attention"
      : match.ok
        ? mode === "live"
          ? "ok"
          : "attention"
        : "critical",
    details,
    lastTestedAt: null,
    testMode: mode === "test",
  };
}

/**
 * Calls Mollie with the configured key.
 *
 * `/methods` rather than `/payments`: it is a read, it needs the same
 * authentication, and it tells us something useful — which payment methods the
 * account actually has enabled, which is exactly what a shop advertising iDEAL
 * needs to know it can take.
 */
export async function testConnection(): Promise<TestResult> {
  const started = Date.now();
  const key = await readSecret("MOLLIE_API_KEY");

  if (!key) {
    return { ok: false, message: "Er is nog geen Mollie API-sleutel ingesteld." };
  }

  const mode = await settingValue<CheckoutMode>("payments.mode");
  const match = keyMatchesMode(classifyKey(key), mode);
  if (!match.ok && match.reason) {
    return { ok: false, message: match.reason };
  }

  try {
    const response = await fetchWithTimeout(`${MOLLIE_API}/methods`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!response.ok) {
      // The status code is safe to reason about; the body is not echoed.
      return {
        ok: false,
        message: describeFailure(new Error(`HTTP ${response.status}`), "mollie test"),
        durationMs: Date.now() - started,
      };
    }

    const payload = (await response.json()) as {
      _embedded?: { methods?: { id: string; description: string }[] };
    };
    const methods = payload._embedded?.methods ?? [];

    return {
      ok: true,
      message:
        methods.length > 0
          ? `Verbonden met Mollie. ${methods.length} betaalmethode${methods.length === 1 ? "" : "n"} actief.`
          : "Verbonden met Mollie, maar er zijn nog geen betaalmethoden geactiveerd in je Mollie-account.",
      details: methods.slice(0, 8).map((method) => ({
        label: method.description,
        value: "Actief",
        level: "ok" as const,
      })),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      message: describeFailure(error, "mollie test"),
      durationMs: Date.now() - started,
    };
  }
}

/**
 * Everything that must be true before real money can be taken.
 *
 * Returned as a list rather than a boolean so the admin can show which item is
 * missing. Switching to live is a decision, and a decision needs its reasons
 * visible.
 */
export async function liveReadiness(): Promise<StatusDetail[]> {
  const [secret, siteUrl, webhook, approvedAt, capability] = await Promise.all([
    secretStatus("MOLLIE_API_KEY"),
    settingValue<string>("general.site_url"),
    settingValue<string>("payments.webhook_url"),
    settingValue<string>("payments.live_approved_at"),
    secretStoreCapability(),
  ]);

  const key = secret.configured ? await readSecret("MOLLIE_API_KEY") : undefined;
  const isLiveKey = classifyKey(key) === "live";
  const httpsSite = siteUrl.startsWith("https://");

  return [
    {
      label: "Live API-sleutel",
      value: isLiveKey ? "Ingesteld" : "Nog een testsleutel",
      level: isLiveKey ? "ok" : "critical",
    },
    {
      label: "Winkeladres",
      value: httpsSite ? siteUrl : "Geen https-adres ingesteld",
      level: httpsSite ? "ok" : "critical",
    },
    {
      label: "Webhook",
      value: webhook.startsWith("https://") ? "Ingesteld" : "Nog geen https-adres",
      level: webhook.startsWith("https://") ? "ok" : "critical",
    },
    {
      label: "Opslag credentials",
      value: capability.writable ? "Beveiligde opslag actief" : "Deploy-omgeving",
      level: "neutral",
    },
    {
      label: "Goedkeuring",
      value: approvedAt ? `Goedgekeurd op ${approvedAt.slice(0, 10)}` : "Nog niet goedgekeurd",
      level: approvedAt ? "ok" : "attention",
    },
  ];
}
