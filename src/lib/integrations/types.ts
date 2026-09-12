/**
 * The shape every integration reports in.
 *
 * Client-safe: this file describes states, never credentials. The admin renders
 * straight from these types, so anything that would be unsafe in a browser must
 * not be expressible here.
 *
 * The states below are deliberately separate, because collapsing them is the
 * lie that integration dashboards usually tell. "Connected" because an API key
 * is present is not connected — it is an environment variable with a plausible
 * shape. The distinction matters most at exactly the moment it is most tempting
 * to blur: a shop owner about to take real money wants to know that a payment
 * actually went through, not that a string exists.
 */

import type { TranslationKey } from "@/lib/translations";

/**
 * Something to show a person, decided on the server and worded in the browser.
 *
 * The adapters run server-side, where there is no locale — the admin is Dutch
 * and English, and a status card that says "Verbonden" to an English user is a
 * half-finished translation. So the server names the message and the screen
 * renders it. `text` is the exception, for content that *is* the answer: a
 * domain name, a translated sentence, a hostname. Those are not copy and have
 * nothing to translate.
 */
export type Message =
  | { key: TranslationKey; params?: Record<string, string | number> }
  | {
      text: string;
    };

export const msg = (key: TranslationKey, params?: Record<string, string | number>): Message => ({
  key,
  params,
});

export const raw = (text: string): Message => ({ text });

export type ConnectionState =
  /** Nothing configured. Not an error — most shops do not use every service. */
  | "not_configured"
  /** Credentials exist but no successful call has been made. */
  | "configured"
  /** An authenticated call to the service succeeded. */
  | "connected"
  /** The service answered, and said no. Wrong key, revoked, out of quota. */
  | "failed"
  /** Configured, and the shop has deliberately switched it off. */
  | "disabled";

/** How serious a problem is, for the coloured dot. */
export type HealthLevel = "ok" | "attention" | "critical" | "neutral";

/** One line in a status card. */
export type StatusDetail = {
  label: Message;
  value: Message;
  level: HealthLevel;
};

export type IntegrationStatus = {
  id: IntegrationId;
  state: ConnectionState;
  /** What the card's dot shows. */
  level: HealthLevel;
  /** The rows under the heading. */
  details: StatusDetail[];
  /**
   * When a connection test last succeeded, ISO. Null means never tested —
   * which is different from tested and failed, and the card says so.
   */
  lastTestedAt: string | null;
  /** True only when this deployment is in a non-production mode, e.g. Mollie test. */
  testMode: boolean;
};

export type IntegrationId = "supabase" | "mollie" | "resend" | "deepl" | "bol";

/**
 * The result of pressing "Test connection".
 *
 * `message` is written for a shop owner and is safe to render. Raw API bodies,
 * headers, tokens and stack traces stay in the server log — a 401 becomes
 * "Authentication failed. Check your API credentials", not a dump of the
 * response that produced it.
 */
export type TestResult = {
  ok: boolean;
  message: Message;
  /** Extra rows to show under the result. Sanitised, like everything else. */
  details?: StatusDetail[];
  /** Milliseconds the call took, when that is interesting. */
  durationMs?: number;
};

/**
 * What an integration can do, so the UI does not offer buttons that cannot
 * work: no "synchronise now" for a service with nothing to synchronise.
 */
export type IntegrationCapabilities = {
  canTest: boolean;
  canSync: boolean;
  canSendTest: boolean;
  /** Whether the credential can be replaced from the admin on this deployment. */
  canManageSecret: boolean;
};

/**
 * Turns a thrown error into something a shop owner can act on.
 *
 * The full error goes to the server log, where it is useful; what comes back is
 * a category. Every integration adapter funnels its failures through this, so
 * there is one place to be careful rather than five.
 */
export function describeFailure(error: unknown, context: string): Message {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[integrations] ${context}:`, detail);

  const lowered = detail.toLowerCase();

  if (
    lowered.includes("401") ||
    lowered.includes("unauthorized") ||
    lowered.includes("invalid api key")
  ) {
    return msg("admin.conn.err.auth");
  }
  if (lowered.includes("403") || lowered.includes("forbidden")) return msg("admin.conn.err.denied");
  if (lowered.includes("404")) return msg("admin.conn.err.notFound");
  if (lowered.includes("429") || lowered.includes("quota") || lowered.includes("rate limit")) {
    return msg("admin.conn.err.limited");
  }
  if (lowered.includes("timeout") || lowered.includes("aborted")) {
    return msg("admin.conn.err.timeout");
  }
  if (lowered.includes("fetch") || lowered.includes("network") || lowered.includes("enotfound")) {
    return msg("admin.conn.err.unreachable");
  }
  return msg("admin.conn.err.unknown");
}

/** A fetch with a deadline, so a hanging service cannot hang the admin. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 10_000,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}

/** `Ingesteld` / `Niet ingesteld`, the commonest row on every card. */
export const setOrNot = (configured: boolean): StatusDetail["value"] =>
  msg(configured ? "admin.conn.value.set" : "admin.conn.value.notSet");

export const onOrOff = (enabled: boolean): StatusDetail["value"] =>
  msg(enabled ? "admin.conn.value.on" : "admin.conn.value.off");
