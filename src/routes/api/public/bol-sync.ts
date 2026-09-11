import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Compares two secrets without leaking their length or first difference
 * through how long it takes. The lengths are mixed into the result rather
 * than short-circuited on, so an unequal length costs the same as an unequal
 * byte.
 */
function timingSafeEqual(provided: string, expected: string): boolean {
  let diff = provided.length ^ expected.length;
  const length = Math.max(provided.length, expected.length);
  for (let index = 0; index < length; index += 1) {
    diff |= (provided.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }
  return diff === 0;
}

const bodySchema = z.object({
  jobs: z
    .array(z.enum(["orders", "stock", "offers", "shipments"]))
    .min(1)
    .max(4)
    .optional(),
});

export const Route = createFileRoute("/api/public/bol-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Dedicated server-only cron secret; the public Supabase key is NOT a credential.
        const syncSecret = process.env.SYNC_TRIGGER_SECRET ?? "";
        const header = request.headers.get("authorization") ?? "";
        const provided = header.toLowerCase().startsWith("bearer ")
          ? header.slice(7).trim()
          : (request.headers.get("x-sync-secret") ?? "");

        // A shared secret on a public URL is guessable given enough tries, so
        // cap the tries. Fails closed: an unreachable counter must not turn
        // into an unlimited guess budget on a credential.
        const { enforceRateLimit, RateLimitError, clearRateLimit } =
          await import("@/lib/rate-limit.server");
        let bucket: string;
        try {
          ({ bucket } = await enforceRateLimit("bol_sync_auth", {
            limit: 10,
            windowSeconds: 900,
            blockSeconds: 3600,
            failClosed: true,
          }));
        } catch (error) {
          if (error instanceof RateLimitError) {
            return new Response("Too Many Requests", {
              status: 429,
              headers: { "retry-after": String(error.retryAfterSeconds) },
            });
          }
          throw error;
        }

        if (!syncSecret || !timingSafeEqual(provided, syncSecret)) {
          return new Response("Unauthorized", { status: 401 });
        }
        // The caller proved they hold the secret; the cron runs on a schedule
        // this limit is not meant to interrupt.
        await clearRateLimit(bucket);

        let payload: unknown = {};
        try {
          payload = await request.json();
        } catch {
          payload = {};
        }
        const parsed = bodySchema.safeParse(payload);
        if (!parsed.success) {
          return Response.json({ error: "Ongeldige aanvraag" }, { status: 400 });
        }

        const jobs = parsed.data.jobs ?? (["orders", "stock"] as const);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runSyncWithBackoff } = await import("@/lib/bol.server");

        const results = [];
        for (const job of jobs) {
          results.push(await runSyncWithBackoff(supabaseAdmin as never, job));
        }
        return Response.json({ results });
      },
    },
  },
});
