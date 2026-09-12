/**
 * Resend: status, connection test, and a real test e-mail.
 *
 * "Connected" here means Resend accepted an authenticated call, not that an
 * e-mail will arrive — a verified sending domain is a separate thing and the
 * status keeps it separate. A shop that reports "connected" and then silently
 * fails to deliver order confirmations is worse than one that reports nothing.
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

const RESEND_API = "https://api.resend.com";

/** The address part of `Naam <adres@domein.nl>`, or the whole string. */
export function senderAddress(from: string): string {
  const match = /<([^>]+)>\s*$/.exec(from.trim());
  return (match ? match[1] : from).trim();
}

export function senderDomain(from: string): string | null {
  const address = senderAddress(from);
  const at = address.lastIndexOf("@");
  return at > 0 ? address.slice(at + 1).toLowerCase() : null;
}

export async function status(): Promise<IntegrationStatus> {
  const [secret, provider, from, replyTo] = await Promise.all([
    secretStatus("RESEND_API_KEY"),
    settingValue<string>("email.provider"),
    settingValue<string>("email.from"),
    settingValue<string>("email.reply_to"),
  ]);

  const domain = senderDomain(from);

  const details: StatusDetail[] = [
    {
      label: msg("admin.conn.label.provider"),
      value: provider === "none" ? msg("admin.conn.value.disabled") : raw("Resend"),
      level: provider === "none" ? "neutral" : "ok",
    },
    {
      label: msg("admin.conn.label.apiKey"),
      value: setOrNot(secret.configured),
      level: secret.configured ? "ok" : "attention",
    },
    {
      label: msg("admin.conn.label.sender"),
      value: from ? raw(from) : msg("admin.conn.value.notSetYet"),
      level: from ? "ok" : "attention",
    },
    {
      label: msg("admin.conn.label.replyTo"),
      value: replyTo ? raw(replyTo) : msg("admin.conn.resend.replyFallback"),
      level: "neutral",
    },
  ];

  if (domain) {
    // Whether the domain is verified is something only a test call can answer,
    // so the card says what it knows rather than guessing.
    details.push({
      label: msg("admin.conn.label.sendingDomain"),
      value: msg("admin.conn.resend.domainUnverified", { domain }),
      level: "neutral",
    });
  }

  const state =
    provider === "none"
      ? ("disabled" as const)
      : !secret.configured || !from
        ? ("not_configured" as const)
        : ("configured" as const);

  return {
    id: "resend",
    state,
    level: provider === "none" ? "neutral" : secret.configured && from ? "ok" : "attention",
    details,
    lastTestedAt: null,
    testMode: false,
  };
}

/**
 * Asks Resend which domains the account has, which both authenticates the key
 * and answers the question that actually matters: is the address we send from
 * on a verified domain?
 */
export async function testConnection(): Promise<TestResult> {
  const started = Date.now();
  const key = await readSecret("RESEND_API_KEY");
  if (!key) return { ok: false, message: msg("admin.conn.resend.noKey") };

  const from = await settingValue<string>("email.from");
  const wanted = senderDomain(from);

  try {
    const response = await fetchWithTimeout(`${RESEND_API}/domains`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!response.ok) {
      return {
        ok: false,
        message: describeFailure(new Error(`HTTP ${response.status}`), "resend test"),
        durationMs: Date.now() - started,
      };
    }

    const payload = (await response.json()) as {
      data?: { name: string; status: string }[];
    };
    const domains = payload.data ?? [];
    const match = wanted ? domains.find((d) => d.name.toLowerCase() === wanted) : undefined;

    const details: StatusDetail[] = domains.slice(0, 8).map((domain) => ({
      label: raw(domain.name),
      value: domain.status === "verified" ? msg("admin.conn.resend.verified") : raw(domain.status),
      level: domain.status === "verified" ? ("ok" as const) : ("attention" as const),
    }));

    if (wanted && !match) {
      return {
        ok: true,
        message: msg("admin.conn.resend.domainMissing", { domain: wanted }),
        details,
        durationMs: Date.now() - started,
      };
    }
    if (match && match.status !== "verified") {
      return {
        ok: true,
        message: msg("admin.conn.resend.domainNotVerified", { domain: wanted! }),
        details,
        durationMs: Date.now() - started,
      };
    }

    return {
      ok: true,
      message: wanted
        ? msg("admin.conn.resend.okVerified", { domain: wanted })
        : msg("admin.conn.resend.okNoSender"),
      details,
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      message: describeFailure(error, "resend test"),
      durationMs: Date.now() - started,
    };
  }
}

/**
 * Sends a real e-mail to a real address.
 *
 * Separate from `testConnection` on purpose: authenticating against the API and
 * actually delivering a message are different claims, and only this one proves
 * the second.
 */
export async function sendTestEmail(to: string): Promise<TestResult> {
  const started = Date.now();
  const [key, from, replyTo] = await Promise.all([
    readSecret("RESEND_API_KEY"),
    settingValue<string>("email.from"),
    settingValue<string>("email.reply_to"),
  ]);

  if (!key) return { ok: false, message: msg("admin.conn.resend.noKey") };
  if (!from) return { ok: false, message: msg("admin.conn.resend.noSender") };

  try {
    const response = await fetchWithTimeout(`${RESEND_API}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: replyTo || undefined,
        subject: "Besjaar — testbericht / test message",
        html:
          "<p>Dit is een testbericht uit het Besjaar-beheer. " +
          "Als je dit leest, werkt de e-mailinstelling: de sleutel is geldig, " +
          "het afzenderadres is geaccepteerd en de bezorging is gelukt.</p>" +
          "<p>This is a test message from the Besjaar admin. If you are reading it, " +
          "e-mail is working: the key is valid, the sender address was accepted and " +
          "delivery succeeded.</p>",
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: describeFailure(new Error(`HTTP ${response.status}`), "resend send test"),
        durationMs: Date.now() - started,
      };
    }

    return {
      ok: true,
      message: msg("admin.conn.resend.sent", { address: to }),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      message: describeFailure(error, "resend send test"),
      durationMs: Date.now() - started,
    };
  }
}
