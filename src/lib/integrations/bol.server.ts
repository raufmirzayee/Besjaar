/**
 * bol.com: status, authentication test, and sync health.
 *
 * "Connected" here means the OAuth token endpoint issued a token for the
 * configured client. That is a stronger claim than "credentials exist" and a
 * weaker one than "orders are arriving", so the card reports all three
 * separately — the last one comes from the sync job history rather than from
 * any credential check.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readSecret, secretStatus } from "../secret-store.server";
import { settingValue } from "../settings.server";
import {
  describeFailure,
  fetchWithTimeout,
  msg,
  onOrOff,
  setOrNot,
  type IntegrationStatus,
  type Message,
  type StatusDetail,
  type TestResult,
} from "./types";

const BOL_TOKEN_URL = "https://login.bol.com/token?grant_type=client_credentials";

type JobRow = {
  job_type: string;
  status: string;
  finished_at: string | null;
  created_at: string;
  error_message: string | null;
};

/** The most recent run per job type, which is what the card actually shows. */
async function latestJobs(): Promise<Map<string, JobRow>> {
  const latest = new Map<string, JobRow>();
  try {
    const { data, error } = await supabaseAdmin
      .from("sync_jobs")
      .select("job_type, status, finished_at, created_at, error_message")
      .eq("channel", "bol")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    for (const row of (data ?? []) as JobRow[]) {
      if (!latest.has(row.job_type)) latest.set(row.job_type, row);
    }
  } catch (error) {
    console.error("[integrations] could not read bol sync history:", error);
  }
  return latest;
}

function jobDetail(label: Message, row: JobRow | undefined): StatusDetail {
  if (!row) return { label, value: msg("admin.conn.bol.neverRun"), level: "neutral" };

  const when = (row.finished_at ?? row.created_at).slice(0, 16).replace("T", " ");
  if (row.status === "success") {
    return { label, value: msg("admin.conn.bol.succeeded", { when }), level: "ok" };
  }
  if (row.status === "partial") {
    return { label, value: msg("admin.conn.bol.partial", { when }), level: "attention" };
  }
  if (row.status === "running") {
    return { label, value: msg("admin.conn.bol.running"), level: "neutral" };
  }
  if (row.status === "pending") {
    return { label, value: msg("admin.conn.bol.queued"), level: "neutral" };
  }
  return { label, value: msg("admin.conn.bol.failed", { when }), level: "critical" };
}

export async function status(): Promise<IntegrationStatus> {
  const [id, secret, autoSync, jobs] = await Promise.all([
    secretStatus("BOL_CLIENT_ID"),
    secretStatus("BOL_CLIENT_SECRET"),
    settingValue<boolean>("integrations.bol_auto_sync"),
    latestJobs(),
  ]);

  const configured = id.configured && secret.configured;

  const details: StatusDetail[] = [
    {
      label: msg("admin.conn.label.clientId"),
      value: setOrNot(id.configured),
      level: id.configured ? "ok" : "neutral",
    },
    {
      label: msg("admin.conn.label.clientSecret"),
      value: setOrNot(secret.configured),
      level: secret.configured ? "ok" : "neutral",
    },
    jobDetail(msg("admin.conn.label.orders"), jobs.get("orders")),
    jobDetail(msg("admin.conn.label.stock"), jobs.get("stock")),
    jobDetail(msg("admin.conn.label.shipments"), jobs.get("shipments")),
    {
      label: msg("admin.conn.label.autoSync"),
      value: onOrOff(autoSync),
      level: "neutral",
    },
  ];

  const anyFailed = [...jobs.values()].some((job) => job.status === "failed");

  return {
    id: "bol",
    // bol.com is optional. A shop that does not sell there is not misconfigured.
    state: !configured ? "not_configured" : anyFailed ? "failed" : "configured",
    level: !configured ? "neutral" : anyFailed ? "attention" : "ok",
    details,
    lastTestedAt: null,
    testMode: false,
  };
}

/**
 * Asks bol.com for a token.
 *
 * A successful token exchange is the real proof that both halves of the
 * credential are right — the client id alone tells us nothing, and an
 * authenticated API call would only add a second thing that could fail.
 */
export async function testConnection(): Promise<TestResult> {
  const started = Date.now();
  const [clientId, clientSecret] = await Promise.all([
    readSecret("BOL_CLIENT_ID"),
    readSecret("BOL_CLIENT_SECRET"),
  ]);

  if (!clientId || !clientSecret) {
    return { ok: false, message: msg("admin.conn.bol.needBoth") };
  }

  try {
    // btoa rather than Buffer: this runs on Cloudflare Workers too.
    const basic = btoa(`${clientId}:${clientSecret}`);
    const response = await fetchWithTimeout(BOL_TOKEN_URL, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, Accept: "application/json" },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          ok: false,
          message: msg("admin.conn.bol.refused"),
          durationMs: Date.now() - started,
        };
      }
      return {
        ok: false,
        message: describeFailure(new Error(`HTTP ${response.status}`), "bol test"),
        durationMs: Date.now() - started,
      };
    }

    const payload = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!payload.access_token) {
      return {
        ok: false,
        message: msg("admin.conn.bol.noToken"),
        durationMs: Date.now() - started,
      };
    }

    return {
      ok: true,
      message: msg("admin.conn.bol.ok"),
      details: payload.expires_in
        ? [
            {
              label: msg("admin.conn.label.tokenValid"),
              value: msg("admin.conn.bol.minutes", {
                minutes: Math.round(payload.expires_in / 60),
              }),
              level: "neutral",
            },
          ]
        : undefined,
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      message: describeFailure(error, "bol test"),
      durationMs: Date.now() - started,
    };
  }
}
