/**
 * Rate limiting for the endpoints anyone can reach.
 *
 * The counter lives in Postgres, not in this process. The shop is deployed as
 * workers: an in-memory counter is empty on every cold start and is not shared
 * between instances, so it would read like a control while barely being one.
 *
 * Who a request belongs to is decided in `caller-identity.ts`, which refuses to
 * read a client-controlled header. That module is the reason this file is worth
 * anything: a limiter keyed on `x-forwarded-for` counts to one forever.
 *
 * On a failure to *reach* the counter there are two honest answers and this
 * offers both. Endpoints that carry their own authorisation and would be taken
 * offline by a database blip allow through and log loudly; the ones where an
 * unlimited retry is itself the attack — the admin bootstrap, the sync secret —
 * pass `failClosed` and refuse.
 */

import { getRequest } from "@tanstack/react-start/server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  callerIdentity,
  describeProxyTrust,
  resolveProxyTrust,
  type CallerIdentity,
  type ProxyTrust,
} from "./caller-identity";

export type RateLimitResult = {
  allowed: boolean;
  attempts: number;
  retryAfterSeconds: number;
};

export type RateLimitOptions = {
  limit: number;
  windowSeconds: number;
  blockSeconds?: number;
  /**
   * Identify the caller by account instead of address. Pass this on anything
   * behind a session: it survives an address change, and it stops one office
   * behind one address from spending each other's budget.
   */
  identity?: string | null;
  /**
   * Key the bucket on a thing rather than on a caller.
   *
   * Some limits are about a resource, not a visitor: a payment provider posts
   * every notification in the shop from its own addresses, so limiting it by
   * caller throttles the shop's own payments while a replay of one
   * notification stays cheap. Keying on the payment instead has it the right
   * way round. Takes precedence over `identity`.
   */
  subject?: string | null;
  /** Refuse when the counter itself cannot be reached. Default: allow through. */
  failClosed?: boolean;
};

let warnedAboutTrust = false;

function currentTrust(): ProxyTrust {
  return resolveProxyTrust(process.env.TRUSTED_PROXY);
}

/**
 * Says once, loudly, that requests are landing in the shared bucket.
 *
 * In production this always means `TRUSTED_PROXY` does not match what is
 * actually in front of the shop, and every anonymous caller is now sharing one
 * counter. Silence here would look exactly like a working limiter.
 */
function warnUnidentified(trust: ProxyTrust): void {
  if (warnedAboutTrust || process.env.NODE_ENV !== "production") return;
  warnedAboutTrust = true;
  console.error(
    `[rate-limit] no trustworthy client address; TRUSTED_PROXY is set to "${describeProxyTrust(
      trust,
    )}" but the header that setting relies on is not present. Every anonymous ` +
      `caller now shares one bucket. Set TRUSTED_PROXY to the host in front of ` +
      `this deployment (cloudflare, vercel, netlify, or a hop count).`,
  );
}

/**
 * How much slack the shared bucket gets.
 *
 * Unidentified callers are all one counter, so a per-caller limit applied to it
 * would let one flood lock out every legitimate visitor. Widened, it stops a
 * flood without being a weapon.
 */
const SHARED_BUCKET_FACTOR = 25;

function identify(options: Pick<RateLimitOptions, "identity" | "subject">): CallerIdentity {
  // A resource-keyed bucket identifies itself; no header is involved.
  if (options.subject) return { key: `on:${options.subject}`, trusted: true };

  const trust = currentTrust();
  let headers: { get(name: string): string | null };
  try {
    headers = getRequest().headers;
  } catch {
    // No request in scope (a script, a test). Nothing to identify.
    headers = { get: () => null };
  }
  const caller = callerIdentity(headers, trust, options.identity);
  if (!caller.trusted) warnUnidentified(trust);
  return caller;
}

/** The bucket a request will spend from. Exported so a success can clear it. */
export function rateLimitBucket(
  name: string,
  options: Pick<RateLimitOptions, "identity" | "subject"> = {},
): string {
  return `${name}:${identify(options).key}`.slice(0, 200);
}

/**
 * Counts one attempt and says whether it may proceed.
 *
 * `limit` attempts are allowed per `windowSeconds`; exceeding it locks the
 * bucket for `blockSeconds`, which is deliberately longer than the window so
 * that hitting the limit is not just a matter of waiting for it to roll.
 */
export async function checkRateLimit(
  name: string,
  options: RateLimitOptions,
): Promise<RateLimitResult & { bucket: string }> {
  const caller = identify(options);
  const bucket = `${name}:${caller.key}`.slice(0, 200);
  const limit = caller.trusted ? options.limit : options.limit * SHARED_BUCKET_FACTOR;

  try {
    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: options.windowSeconds,
      p_block_seconds: options.blockSeconds ?? null,
    });
    if (error) throw new Error(error.message);

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { allowed: true, attempts: 0, retryAfterSeconds: 0, bucket };
    return {
      allowed: Boolean(row.allowed),
      attempts: Number(row.attempts ?? 0),
      retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
      bucket,
    };
  } catch (error) {
    if (options.failClosed) {
      console.error(`[rate-limit] check failed for "${name}", refusing:`, error);
      return { allowed: false, attempts: limit, retryAfterSeconds: 60, bucket };
    }
    console.error(`[rate-limit] check failed for "${name}", allowing through:`, error);
    return { allowed: true, attempts: 0, retryAfterSeconds: 0, bucket };
  }
}

/** Forgets a bucket after a success. An active lockout is not released. */
export async function clearRateLimit(bucket: string): Promise<void> {
  try {
    await supabaseAdmin.rpc("clear_rate_limit", { p_bucket: bucket.slice(0, 200) });
  } catch (error) {
    console.error("[rate-limit] clear failed:", error);
  }
}

/** Thrown when a caller has spent their budget. */
export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    super(`Te veel pogingen. Probeer het over ${minutes} minuten opnieuw.`);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Counts an attempt and throws when the budget is spent. */
export async function enforceRateLimit(
  name: string,
  options: RateLimitOptions,
): Promise<{ bucket: string }> {
  const result = await checkRateLimit(name, options);
  if (!result.allowed) throw new RateLimitError(result.retryAfterSeconds);
  return { bucket: result.bucket };
}
