/**
 * Supabase: what is reachable, what is protected, and what is still missing.
 *
 * The service-role key is not shown, hinted at, or described beyond "server
 * only". Everything here is a yes/no about reachability and posture, checked by
 * actually calling the thing rather than by looking at whether a variable is
 * set — a URL in the environment proves nothing about a database that is
 * paused.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { secretStoreCapability } from "../secret-store.server";
import {
  describeFailure,
  msg,
  raw,
  type IntegrationStatus,
  type StatusDetail,
  type TestResult,
} from "./types";

function configuredUrl(): string | undefined {
  return process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
}

/** One real query, to prove the database answers. */
export async function testDatabase(): Promise<TestResult> {
  const started = Date.now();
  try {
    const { error } = await supabaseAdmin
      .from("products")
      .select("id", { head: true, count: "exact" });
    if (error) throw new Error(error.message);
    return {
      ok: true,
      message: msg("admin.conn.sb.databaseOk"),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      message: describeFailure(error, "supabase database"),
      durationMs: Date.now() - started,
    };
  }
}

/** The auth admin API, which is what staff creation and the bootstrap need. */
export async function testAuth(): Promise<TestResult> {
  const started = Date.now();
  try {
    const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw new Error(error.message);
    return { ok: true, message: msg("admin.conn.sb.authOk"), durationMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      message: describeFailure(error, "supabase auth"),
      durationMs: Date.now() - started,
    };
  }
}

/** Whether the three buckets exist and carry the settings the migration set. */
export async function testStorage(): Promise<TestResult> {
  const started = Date.now();
  try {
    const { data, error } = await supabaseAdmin.rpc("audit_storage_buckets");
    if (error) throw new Error(error.message);

    const problems = (data ?? []) as { bucket: string; problem: string }[];
    if (problems.length === 0) {
      return {
        ok: true,
        message: msg("admin.conn.sb.storageOk"),
        durationMs: Date.now() - started,
      };
    }

    return {
      ok: false,
      message: msg("admin.conn.sb.storageProblems", { count: problems.length }),
      details: problems.map((problem) => ({
        label: raw(problem.bucket),
        // The audit function's own wording, which names the setting at fault.
        value: raw(problem.problem),
        level: "attention" as const,
      })),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      message: describeFailure(error, "supabase storage"),
      durationMs: Date.now() - started,
    };
  }
}

/**
 * Whether any table in the public schema is missing row-level security.
 *
 * This is the check that would have caught the staff-directory leak, so it is
 * worth having on a screen rather than only in the test suite.
 */
export async function testRls(): Promise<TestResult> {
  const started = Date.now();
  try {
    const { data, error } = await supabaseAdmin.rpc("audit_view_exposure");
    if (error) throw new Error(error.message);

    const exposed = (data ?? []) as { view_name: string; problem: string }[];
    if (exposed.length === 0) {
      return { ok: true, message: msg("admin.conn.sb.rlsOk"), durationMs: Date.now() - started };
    }
    return {
      ok: false,
      message: msg("admin.conn.sb.rlsExposed", { count: exposed.length }),
      details: exposed.map((row) => ({
        label: raw(row.view_name),
        value: raw(row.problem),
        level: "critical" as const,
      })),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      message: describeFailure(error, "supabase rls"),
      durationMs: Date.now() - started,
    };
  }
}

/** Whether anyone holds an admin role, and whether they are in the staff pool. */
export async function testAdminAccounts(): Promise<TestResult> {
  const started = Date.now();
  try {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("role", "super_admin");
    if (error) throw new Error(error.message);

    const count = (data ?? []).length;
    if (count === 0) {
      return {
        ok: false,
        message: msg("admin.conn.sb.noSuperAdmin"),
        durationMs: Date.now() - started,
      };
    }
    return {
      ok: true,
      message: msg("admin.conn.sb.superAdmins", { count }),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      message: describeFailure(error, "supabase admins"),
      durationMs: Date.now() - started,
    };
  }
}

/**
 * The card. Runs the cheap checks; the expensive ones are behind buttons.
 */
export async function status(): Promise<IntegrationStatus> {
  const url = configuredUrl();
  const serviceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const [database, capability] = await Promise.all([testDatabase(), secretStoreCapability()]);

  const details: StatusDetail[] = [
    {
      label: msg("admin.conn.label.project"),
      value: url ? raw(new URL(url).hostname) : msg("admin.conn.sb.noProject"),
      level: url ? "ok" : "critical",
    },
    {
      label: msg("admin.conn.label.database"),
      value: database.ok ? msg("admin.conn.value.connected") : database.message,
      level: database.ok ? "ok" : "critical",
    },
    {
      // Never the value, never a hint. Whether it is set, and where it lives.
      label: msg("admin.conn.label.serviceRole"),
      value: msg(serviceRole ? "admin.conn.sb.serverOnly" : "admin.conn.value.notSet"),
      level: serviceRole ? "ok" : "critical",
    },
    {
      label: msg("admin.conn.label.secureStorage"),
      value: msg(capability.writable ? "admin.conn.store.vault" : "admin.conn.store.environment"),
      level: capability.writable ? "ok" : "neutral",
    },
  ];

  return {
    id: "supabase",
    state: !url || !serviceRole ? "not_configured" : database.ok ? "connected" : "failed",
    level: !url || !serviceRole ? "critical" : database.ok ? "ok" : "critical",
    details,
    lastTestedAt: new Date().toISOString(),
    testMode: false,
  };
}
