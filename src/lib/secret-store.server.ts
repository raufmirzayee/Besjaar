/**
 * Integration credentials: reading them, replacing them, and reporting on them.
 *
 * This module is the only place in the application that holds a credential in a
 * variable. Everything above it — the admin screens, the connection tests, the
 * status cards — works with a `SecretStatus`, which says whether a credential
 * exists and where it lives and never what it is.
 *
 * Two backends, in this order:
 *
 *   vault   Supabase Vault. Writable at runtime, so replacing a Mollie key in
 *           the admin takes effect on the next request with no redeploy.
 *   env     The deployment environment. Read-only from here — the application
 *           cannot rewrite a Cloudflare Worker's secrets, and pretending to
 *           would be worse than not offering it.
 *
 * Vault wins when both hold a value, because the whole point of saving one in
 * the admin is that it takes over from the deployment default.
 *
 * SUPABASE_SERVICE_ROLE_KEY is deliberately absent from the managed list: it is
 * the key that opens the vault, so it cannot live inside it.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** The credentials the admin may replace. Anything else is deployment-level. */
export const MANAGED_SECRETS = [
  "MOLLIE_API_KEY",
  "RESEND_API_KEY",
  "DEEPL_API_KEY",
  "BOL_CLIENT_ID",
  "BOL_CLIENT_SECRET",
  "SYNC_TRIGGER_SECRET",
] as const;

export type ManagedSecret = (typeof MANAGED_SECRETS)[number];

export function isManagedSecret(name: string): name is ManagedSecret {
  return (MANAGED_SECRETS as readonly string[]).includes(name);
}

/**
 * What a caller outside this module is allowed to know about a credential.
 *
 * There is no `value` field, and adding one would be the bug. Everything the
 * admin renders comes from here.
 */
export type SecretStatus = {
  name: ManagedSecret;
  configured: boolean;
  /** Which backend holds it. `none` when nothing does. */
  source: "vault" | "environment" | "none";
  /**
   * A few characters to recognise it by, or null. Only produced for credentials
   * whose shape makes a hint meaningless on its own — never more than a prefix
   * and the last four characters.
   */
  maskedHint: string | null;
  /** When it was last replaced through the admin. Null for an env value. */
  updatedAt: string | null;
  /**
   * Whether the running deployment is already using this value. A vault write
   * is live immediately; an environment value that was just changed is not,
   * until the platform restarts the worker.
   */
  liveNow: boolean;
};

/** Whether the admin can save credentials at all on this deployment. */
export type SecretStoreCapability = {
  writable: boolean;
  backend: "vault" | "environment-only";
  /** Shown to the admin when `writable` is false. */
  reason: string | null;
};

let capabilityCache: SecretStoreCapability | null = null;

/**
 * Whether Supabase Vault is usable here.
 *
 * Cached for the life of the worker: it is a property of the project, and
 * asking on every settings page load would add a round trip to answer a
 * question whose answer does not change.
 */
export async function secretStoreCapability(): Promise<SecretStoreCapability> {
  if (capabilityCache) return capabilityCache;
  try {
    const { data, error } = await supabaseAdmin.rpc("secret_store_available");
    if (error) throw new Error(error.message);
    capabilityCache = data
      ? { writable: true, backend: "vault", reason: null }
      : {
          writable: false,
          backend: "environment-only",
          reason:
            "Supabase Vault is niet beschikbaar op dit project. Credentials blijven in de deploy-omgeving staan.",
        };
  } catch (error) {
    // A failure to ask is not a licence to assume yes. Reporting
    // environment-only means the admin offers instructions instead of a save
    // button, which is the safe way to be wrong.
    console.error("[secrets] could not determine the secret store backend:", error);
    capabilityCache = {
      writable: false,
      backend: "environment-only",
      reason: "De beveiligde opslag kon niet worden gecontroleerd.",
    };
  }
  return capabilityCache;
}

/** Only for tests, which need to re-ask after changing the backend. */
export function resetSecretStoreCapability(): void {
  capabilityCache = null;
}

/**
 * A hint that is safe to show.
 *
 * The rule is the prefix that says *which kind* of credential this is — which
 * the admin needs, because a test key in live mode is the mistake this whole
 * area exists to prevent — plus the last four characters so two keys can be
 * told apart. Never the middle, and nothing at all for a short value, where
 * four characters would be a meaningful fraction of the secret.
 */
export function maskSecret(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 12) return null;

  const prefixMatch = /^(test_|live_|re_|sb_secret_|sbp_)/.exec(trimmed);
  const prefix = prefixMatch ? prefixMatch[1] : "";
  return `${prefix}••••${trimmed.slice(-4)}`;
}

/** The environment variable a managed secret falls back to. */
function fromEnvironment(name: ManagedSecret): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

type VaultRow = {
  name: string;
  configured: boolean;
  masked_hint: string | null;
  updated_at: string;
};

async function vaultRows(): Promise<Map<string, VaultRow>> {
  const rows = new Map<string, VaultRow>();
  const capability = await secretStoreCapability();
  if (!capability.writable) return rows;

  try {
    const { data, error } = await supabaseAdmin.rpc("managed_secret_status");
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as VaultRow[]) rows.set(row.name, row);
  } catch (error) {
    console.error("[secrets] could not read credential status:", error);
  }
  return rows;
}

/**
 * The value of a credential, for server code that is about to call the service.
 *
 * The only function here that returns a secret. Callers must not put the result
 * into a response, a log line or an error message — every caller in this
 * repository passes it straight into an Authorization header.
 */
export async function readSecret(name: ManagedSecret): Promise<string | undefined> {
  const capability = await secretStoreCapability();

  if (capability.writable) {
    try {
      const { data, error } = await supabaseAdmin.rpc("read_managed_secret", { p_name: name });
      if (error) throw new Error(error.message);
      const value = typeof data === "string" ? data.trim() : "";
      if (value) return value;
    } catch (error) {
      // Fall through to the environment rather than failing the request: a
      // vault that is briefly unreachable should not take payments offline
      // when the deployment still has the key.
      console.error(`[secrets] could not read ${name} from the vault:`, error);
    }
  }

  return fromEnvironment(name);
}

/** Status for one credential. Never includes the value. */
export async function secretStatus(name: ManagedSecret): Promise<SecretStatus> {
  const [rows, env] = await Promise.all([vaultRows(), Promise.resolve(fromEnvironment(name))]);
  const row = rows.get(name);

  if (row?.configured) {
    return {
      name,
      configured: true,
      source: "vault",
      maskedHint: row.masked_hint,
      updatedAt: row.updated_at,
      // A vault write is read on the next request; nothing has to restart.
      liveNow: true,
    };
  }

  if (env) {
    return {
      name,
      configured: true,
      source: "environment",
      maskedHint: maskSecret(env),
      updatedAt: null,
      liveNow: true,
    };
  }

  return {
    name,
    configured: false,
    source: "none",
    maskedHint: null,
    updatedAt: null,
    liveNow: false,
  };
}

/** Status for every managed credential, in one pass. */
export async function allSecretStatuses(): Promise<SecretStatus[]> {
  const rows = await vaultRows();

  return MANAGED_SECRETS.map((name) => {
    const row = rows.get(name);
    if (row?.configured) {
      return {
        name,
        configured: true,
        source: "vault" as const,
        maskedHint: row.masked_hint,
        updatedAt: row.updated_at,
        liveNow: true,
      };
    }
    const env = fromEnvironment(name);
    if (env) {
      return {
        name,
        configured: true,
        source: "environment" as const,
        maskedHint: maskSecret(env),
        updatedAt: null,
        liveNow: true,
      };
    }
    return {
      name,
      configured: false,
      source: "none" as const,
      maskedHint: null,
      updatedAt: null,
      liveNow: false,
    };
  });
}

export type SecretWriteResult =
  | { stored: true; source: "vault"; liveNow: true; maskedHint: string | null }
  | {
      stored: false;
      reason: "no-writable-store";
      /** The variable to set, and where. The admin shows this verbatim. */
      variable: ManagedSecret;
      message: string;
    };

/**
 * Replaces a credential.
 *
 * Returns `stored: false` rather than throwing when there is nowhere writable
 * to put it. That is not an error — it is the normal state of a deployment
 * without Vault — and the admin turns it into setup instructions rather than a
 * red banner.
 *
 * `value` is never logged, never returned, and never echoed in an error.
 */
export async function writeSecret(
  name: ManagedSecret,
  value: string,
  actorId: string | null,
): Promise<SecretWriteResult> {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Een lege waarde is geen credential.");

  const capability = await secretStoreCapability();
  if (!capability.writable) {
    return {
      stored: false,
      reason: "no-writable-store",
      variable: name,
      message:
        capability.reason ??
        "Deze installatie heeft geen beveiligde opslag voor credentials. Zet de waarde in de deploy-omgeving.",
    };
  }

  const hint = maskSecret(trimmed);
  const { data, error } = await supabaseAdmin.rpc("store_managed_secret", {
    p_name: name,
    p_value: trimmed,
    p_masked_hint: hint,
    p_actor: actorId,
  });

  if (error) {
    // The database message can name the credential but never carries its value.
    throw new Error(error.message);
  }
  if (!data) {
    return {
      stored: false,
      reason: "no-writable-store",
      variable: name,
      message: "De beveiligde opslag weigerde de waarde.",
    };
  }

  return { stored: true, source: "vault", liveNow: true, maskedHint: hint };
}

/** Disconnects an integration by forgetting its credential. */
export async function forgetSecret(
  name: ManagedSecret,
): Promise<{ removed: boolean; environmentRemains: boolean }> {
  const capability = await secretStoreCapability();
  let removed = false;

  if (capability.writable) {
    try {
      const { data, error } = await supabaseAdmin.rpc("forget_managed_secret", { p_name: name });
      if (error) throw new Error(error.message);
      removed = Boolean(data);
    } catch (error) {
      console.error(`[secrets] could not remove ${name}:`, error);
      throw new Error("De credential kon niet worden verwijderd.");
    }
  }

  // Removing the vault copy does not remove a deployment-level fallback, and
  // saying it did would leave the admin believing an integration is off while
  // it is still running on the environment value.
  return { removed, environmentRemains: Boolean(fromEnvironment(name)) };
}
