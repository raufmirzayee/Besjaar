import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

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
        if (!syncSecret || provided.length !== syncSecret.length || provided !== syncSecret) {
          return new Response("Unauthorized", { status: 401 });
        }

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
