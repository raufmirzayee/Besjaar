/**
 * What the admin is allowed to know about a credential.
 *
 * Client-safe by construction: this module names credentials and describes
 * their state, and there is nowhere in it for a value to live. The screens
 * import from here; only `secret-store.server.ts` ever holds the real thing.
 *
 * Keeping this separate from the server module is not ceremony. The credential
 * list is needed in the browser to draw the rows, and importing it from the
 * server module would pull that module into the client graph — leaving
 * tree-shaking, rather than the module boundary, as the thing standing between
 * `MOLLIE_API_KEY` and the shipped bundle.
 */

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
 * What a caller outside the secret store is allowed to know about a credential.
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

/** Which integration each credential belongs to, for grouping the screens. */
export const SECRET_OWNER: Record<ManagedSecret, string> = {
  MOLLIE_API_KEY: "mollie",
  RESEND_API_KEY: "resend",
  DEEPL_API_KEY: "deepl",
  BOL_CLIENT_ID: "bol",
  BOL_CLIENT_SECRET: "bol",
  SYNC_TRIGGER_SECRET: "bol",
};
