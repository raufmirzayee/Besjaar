import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAudit, requirePermission } from "./admin-core.server";
import type { IntegrationId } from "./integrations/types";

/**
 * Connection testing and health, for the Setup & Connections screens.
 *
 * Every test runs here, on the server, with the credential never leaving it.
 * What comes back is a sentence written for a shop owner plus a few labelled
 * rows — a 401 becomes "Authentication failed. Check your API credentials",
 * and the response that produced it goes to the server log.
 *
 * Tests are rate-limited per integration. They are the one admin action that
 * makes the shop call a third party on demand, and a held-down button should
 * not be a way to burn the account's quota.
 */

const INTEGRATIONS = ["supabase", "mollie", "resend", "deepl", "bol"] as const;

async function limitTests(userId: string, integration: IntegrationId): Promise<void> {
  const { enforceRateLimit } = await import("./rate-limit.server");
  await enforceRateLimit(`connection_test:${integration}`, {
    limit: 20,
    windowSeconds: 300,
    blockSeconds: 300,
    identity: userId,
  });
}

/** Every card on the connection dashboard, in one round trip. */
export const getConnectionOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "integrations", "view");

    const [supabase, mollie, resend, deepl, bol, secrets, capability] = await Promise.all([
      import("./integrations/supabase.server").then((m) => m.status()),
      import("./integrations/mollie.server").then((m) => m.status()),
      import("./integrations/resend.server").then((m) => m.status()),
      import("./integrations/deepl.server").then((m) => m.status()),
      import("./integrations/bol.server").then((m) => m.status()),
      import("./secret-store.server").then((m) => m.allSecretStatuses()),
      import("./secret-store.server").then((m) => m.secretStoreCapability()),
    ]);

    return { integrations: [supabase, mollie, resend, deepl, bol], secrets, capability };
  });

/** Runs one integration's connection test. */
export const testConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ integration: z.enum(INTEGRATIONS) }).strict()))
  .handler(async ({ context, data }) => {
    // Viewing is enough to run a read-only test: the person diagnosing a
    // failed order should not need the permission that can replace a key.
    await requirePermission(context, "integrations", "view");
    await limitTests(context.userId, data.integration);

    switch (data.integration) {
      case "supabase":
        return import("./integrations/supabase.server").then((m) => m.testDatabase());
      case "mollie":
        return import("./integrations/mollie.server").then((m) => m.testConnection());
      case "resend":
        return import("./integrations/resend.server").then((m) => m.testConnection());
      case "deepl":
        return import("./integrations/deepl.server").then((m) => m.usage());
      case "bol":
        return import("./integrations/bol.server").then((m) => m.testConnection());
    }
  });

/** The individual Supabase checks, each behind its own button. */
export const testSupabaseArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z.object({ area: z.enum(["database", "auth", "storage", "rls", "admins"]) }).strict(),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "integrations", "view");
    await limitTests(context.userId, "supabase");

    const supabase = await import("./integrations/supabase.server");
    switch (data.area) {
      case "database":
        return supabase.testDatabase();
      case "auth":
        return supabase.testAuth();
      case "storage":
        return supabase.testStorage();
      case "rls":
        return supabase.testRls();
      case "admins":
        return supabase.testAdminAccounts();
    }
  });

/**
 * Sends a real test e-mail.
 *
 * Needs `integrations:edit` rather than `view`: it leaves the building. The
 * address is validated, and rate limited harder than a read-only test, because
 * this one can be pointed at somebody else's inbox.
 */
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ to: v.email }).strict()))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "integrations", "edit");

    const { enforceRateLimit } = await import("./rate-limit.server");
    await enforceRateLimit("test_email", {
      limit: 5,
      windowSeconds: 3600,
      blockSeconds: 3600,
      identity: context.userId,
    });

    const result = await import("./integrations/resend.server").then((m) =>
      m.sendTestEmail(data.to),
    );

    await logAudit({
      userId: context.userId,
      userEmail: (context.claims as { email?: string | null } | undefined)?.email ?? null,
      action: "email.test_sent",
      module: "settings",
      entityType: "email",
      entityId: data.to,
      newValue: { ok: result.ok },
    });

    return result;
  });

/** Translates a sample so the administrator can read the result. */
export const testTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z
        .object({
          text: z.string().trim().min(1).max(500),
          target: z.enum(["EN-GB", "DE", "FR"]),
        })
        .strict(),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "integrations", "view");
    await limitTests(context.userId, "deepl");

    return import("./integrations/deepl.server").then((m) =>
      m.testTranslation(data.text, data.target),
    );
  });

/** What live payments still need. Recomputed here, never trusted from the page. */
export const getLiveReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "integrations", "view");
    return import("./integrations/mollie.server").then((m) => m.liveReadiness());
  });
