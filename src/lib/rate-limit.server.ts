/**
 * Rate limiting for the endpoints anyone can reach.
 *
 * The counter lives in Postgres, not in this process. The shop is deployed as
 * workers: an in-memory counter is empty on every cold start and is not shared
 * between instances, so it would read like a control while barely being one.
 *
 * A limit that fails closed would let a database blip take the shop offline,
 * and one that fails open silently would be worse than none. The middle course
 * here: a failure to *check* the limit is logged and allowed through, because
 * the endpoints behind it have their own authorisation and the limiter is a
 * second layer, not the only one.
 */

import { getRequest } from "@tanstack/react-start/server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RateLimitResult = {
  allowed: boolean;
  attempts: number;
  retryAfterSeconds: number;
};

/**
 * Best-effort caller identity.
 *
 * Behind a proxy the socket address is the proxy's, so the forwarded headers
 * are what identify the caller. They are also caller-controlled, which is why
 * this is only ever a rate-limit key and never an authorisation input: the
 * worst a forged header achieves is spending someone else's budget, and the
 * fallback below means a caller who strips every header shares one bucket
 * with every other such caller rather than escaping the limit.
 */
export function callerKey(): string {
  try {
    const request = getRequest();
    const headers = request.headers;
    const forwarded = headers.get("x-forwarded-for");
    const candidate =
      headers.get("cf-connecting-ip") ??
      headers.get("x-real-ip") ??
      (forwarded ? forwarded.split(",")[0] : null);
    const ip = candidate?.trim();
    if (ip && ip.length <= 45) return ip;
  } catch {
    // No request in scope (a test, a script). Fall through.
  }
  return "unknown";
}

/**
 * Counts one attempt and says whether it may proceed.
 *
 * `limit` attempts are allowed per `windowSeconds`; exceeding it locks the
 * bucket for `blockSeconds`, which is deliberately longer than the window so
 * that hitting the limit is not just a matter of waiting for it to roll.
 */
export async function checkRateLimit(
  bucket: string,
  {
    limit,
    windowSeconds,
    blockSeconds,
  }: { limit: number; windowSeconds: number; blockSeconds?: number },
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      p_bucket: bucket.slice(0, 200),
      p_limit: limit,
      p_window_seconds: windowSeconds,
      p_block_seconds: blockSeconds ?? null,
    });
    if (error) throw new Error(error.message);

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { allowed: true, attempts: 0, retryAfterSeconds: 0 };
    return {
      allowed: Boolean(row.allowed),
      attempts: Number(row.attempts ?? 0),
      retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
    };
  } catch (error) {
    console.error("[rate-limit] check failed, allowing through:", error);
    return { allowed: true, attempts: 0, retryAfterSeconds: 0 };
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
  bucket: string,
  options: { limit: number; windowSeconds: number; blockSeconds?: number },
): Promise<void> {
  const result = await checkRateLimit(bucket, options);
  if (!result.allowed) throw new RateLimitError(result.retryAfterSeconds);
}
