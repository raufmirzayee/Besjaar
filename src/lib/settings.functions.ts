import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAudit, requirePermission } from "./admin-core.server";
import { MANAGED_SECRETS, isManagedSecret } from "./secret-store.server";
import { SETTING_CATEGORIES, SETTING_KEYS } from "./settings-schema";

/**
 * The Setup & Connections server surface.
 *
 * Three rules hold in every handler below, and they are the reason this file
 * exists rather than the pages talking to the database directly:
 *
 *   1. Permission first. `requirePermission` runs before anything is read or
 *      written, and it asserts the second factor as well as the role. A hidden
 *      button is not a control; this is.
 *   2. No secret ever goes out. Nothing here returns a credential. The status
 *      types have no field for one, and the write path takes a value and
 *      returns only whether it was stored.
 *   3. Changes are audited, without their contents. "Mollie credential
 *      replaced" is the entry, never the key.
 */

/** Everything a settings page needs to render, in one call. */
export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "settings", "view");
    const { resolveAllSettings } = await import("./settings.server");
    const { allSecretStatuses, secretStoreCapability } = await import("./secret-store.server");

    const [settings, secrets, capability] = await Promise.all([
      resolveAllSettings(),
      allSecretStatuses(),
      secretStoreCapability(),
    ]);

    return { settings, secrets, capability };
  });

/**
 * Saves one or more settings.
 *
 * The whole form is validated before any of it is written, so a single bad
 * field cannot leave the shop half-configured — which for something like
 * payment mode plus webhook URL would be a genuinely bad state to be in.
 */
export const saveSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z
        .object({
          // The keys are checked against the schema server-side; this only
          // bounds the payload so a caller cannot post a megabyte of them.
          values: z.record(z.string().max(80), z.unknown()),
        })
        .strict(),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "settings", "edit");

    const { SETTINGS } = await import("./settings-schema");
    const { resolveAllSettings, saveSettings } = await import("./settings.server");

    const keys = Object.keys(data.values);

    // Changing the payment mode or turning off indexing is not an ordinary
    // edit, and the roles that may do the ordinary ones are not the roles that
    // may do these.
    const sensitive = keys.filter((key) => SETTINGS[key]?.sensitive);
    if (sensitive.length > 0) {
      await requirePermission(context, "settings", "manage_settings");
    }

    // Switching checkout to live is the one setting that moves real money, and
    // it has its own endpoint with its own checks. Refusing it here stops the
    // ordinary save path from being a way around them.
    if (data.values["payments.mode"] === "live") {
      throw new Error(
        "Live betalingen worden ingeschakeld via de goedkeuringsstap, niet via het opslaan van instellingen.",
      );
    }

    const before = await resolveAllSettings();
    const previous = new Map(before.map((setting) => [setting.key, setting.value]));

    const result = await saveSettings(data.values, context.userId);
    if (!result.ok) return result;

    await logAudit({
      userId: context.userId,
      userEmail: (context.claims as { email?: string | null } | undefined)?.email ?? null,
      action: "settings.update",
      module: "settings",
      entityType: "settings",
      entityId: result.saved.join(", ").slice(0, 200),
      oldValue: Object.fromEntries(result.saved.map((key) => [key, previous.get(key) ?? null])),
      newValue: Object.fromEntries(result.saved.map((key) => [key, data.values[key]])),
    });

    return result;
  });

/** The settings one tab needs. */
export const getSettingsCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ category: z.enum(SETTING_CATEGORIES) }).strict()))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "settings", "view");
    const { settingsForCategory } = await import("./settings.server");
    return settingsForCategory(data.category);
  });

/**
 * Replaces a credential.
 *
 * `secrets:manage_settings` rather than `settings:edit`: this is the action
 * that can point the shop's payment traffic somewhere else, and it stays with
 * the super admin. The value is never echoed back, and the audit entry records
 * only that it happened.
 */
export const saveSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z
        .object({
          name: z.enum(MANAGED_SECRETS),
          // Bounded, but not shape-checked here: each integration knows what a
          // valid credential looks like for it, and a rejected paste is more
          // annoying than a failed connection test that says exactly why.
          value: z.string().min(8).max(500),
        })
        .strict(),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "secrets", "manage_settings");

    if (!isManagedSecret(data.name)) {
      throw new Error("Deze credential wordt niet vanuit het beheer beheerd.");
    }

    const { writeSecret } = await import("./secret-store.server");
    const result = await writeSecret(data.name, data.value, context.userId);

    await logAudit({
      userId: context.userId,
      userEmail: (context.claims as { email?: string | null } | undefined)?.email ?? null,
      action: result.stored ? "secret.replaced" : "secret.replace_unavailable",
      module: "settings",
      entityType: "secret",
      entityId: data.name,
      // The name of the credential, never a character of its value.
      newValue: { stored: result.stored },
    });

    return result;
  });

/** Disconnects an integration by forgetting its credential. */
export const removeSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ name: z.enum(MANAGED_SECRETS) }).strict()))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "secrets", "manage_settings");

    const { forgetSecret } = await import("./secret-store.server");
    const result = await forgetSecret(data.name);

    await logAudit({
      userId: context.userId,
      userEmail: (context.claims as { email?: string | null } | undefined)?.email ?? null,
      action: "secret.removed",
      module: "settings",
      entityType: "secret",
      entityId: data.name,
      newValue: { removed: result.removed, environmentRemains: result.environmentRemains },
    });

    return result;
  });

/**
 * Approves live payments.
 *
 * Deliberately awkward. It is the only way to reach live mode, it re-checks
 * every precondition server-side rather than trusting the screen that showed
 * them, and it demands the shop's own name typed back — a confirmation dialog
 * alone is something people click through.
 */
export const approveLivePayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ confirmation: z.string().max(120) }).strict()))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "secrets", "approve");

    const { liveReadiness } = await import("./integrations/mollie.server");
    const { saveSettings, settingValue } = await import("./settings.server");

    const storeName = await settingValue<string>("general.store_name");
    if (data.confirmation.trim().toLowerCase() !== String(storeName).trim().toLowerCase()) {
      throw new Error(`Typ de winkelnaam (${storeName}) om live betalingen te bevestigen.`);
    }

    // Re-checked here, not taken from the browser. The screen that listed these
    // is not evidence that they are still true.
    const readiness = await liveReadiness();
    const blocking = readiness.filter((item) => item.level === "critical");
    if (blocking.length > 0) {
      return {
        ok: false as const,
        blocking: blocking.map((item) => `${item.label}: ${item.value}`),
      };
    }

    const email = (context.claims as { email?: string | null } | undefined)?.email ?? null;
    const result = await saveSettings(
      {
        "payments.mode": "live",
        "payments.live_approved_at": new Date().toISOString(),
        "payments.live_approved_by": email ?? context.userId,
      },
      context.userId,
    );
    if (!result.ok) return { ok: false as const, blocking: Object.values(result.errors) };

    await logAudit({
      userId: context.userId,
      userEmail: email,
      action: "payments.live_enabled",
      module: "settings",
      entityType: "settings",
      entityId: "payments.mode",
      oldValue: { mode: "test" },
      newValue: { mode: "live" },
    });

    return { ok: true as const, blocking: [] };
  });

/** Turns live payments back off. Never needs a confirmation: stopping is safe. */
export const disableLivePayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ mode: z.enum(["disabled", "test"]) }).strict()))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "settings", "manage_settings");

    const { saveSettings } = await import("./settings.server");
    await saveSettings({ "payments.mode": data.mode }, context.userId);

    await logAudit({
      userId: context.userId,
      userEmail: (context.claims as { email?: string | null } | undefined)?.email ?? null,
      action: "payments.live_disabled",
      module: "settings",
      entityType: "settings",
      entityId: "payments.mode",
      newValue: { mode: data.mode },
    });

    return { ok: true };
  });

/** Non-secret configuration, for moving a setup between staging and production. */
export const exportSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "settings", "export");

    const { resolveAllSettings } = await import("./settings.server");
    const settings = await resolveAllSettings();

    await logAudit({
      userId: context.userId,
      userEmail: (context.claims as { email?: string | null } | undefined)?.email ?? null,
      action: "settings.export",
      module: "settings",
    });

    return {
      exportedAt: new Date().toISOString(),
      // Only settings. There is no credential in this table to leave out, but
      // saying so in the payload makes that explicit to whoever opens the file.
      containsSecrets: false as const,
      settings: Object.fromEntries(
        settings
          .filter((setting) => SETTING_KEYS.includes(setting.key))
          .map((setting) => [setting.key, setting.value]),
      ),
    };
  });

/**
 * Records that somebody has reviewed a setup step whose subject is a decision.
 *
 * Only the two steps the wizard marks `acknowledged` can be recorded this way.
 * Everything else measures a real value, and letting a button mark those
 * complete would turn the checklist into decoration.
 */
export const acknowledgeSetupStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ step: z.string().max(40), done: z.boolean() }).strict()))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "settings", "edit");

    const { SETUP_STEPS } = await import("./setup-wizard");
    const step = SETUP_STEPS.find((candidate) => candidate.id === data.step);
    if (!step?.acknowledged) {
      throw new Error("Deze stap wordt afgeleid uit de instellingen, niet afgevinkt.");
    }

    const { saveSettings, settingValue } = await import("./settings.server");
    const current = await settingValue<string[]>("system.setup_completed_steps");
    const list = Array.isArray(current) ? current : [];

    const next = data.done
      ? [...new Set([...list, data.step])]
      : list.filter((entry) => entry !== data.step);

    await saveSettings({ "system.setup_completed_steps": next }, context.userId);
    return { steps: next };
  });

/** Hides the setup assistant on the overview once the shop is running. */
export const dismissSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ dismissed: z.boolean() }).strict()))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "settings", "edit");
    const { saveSettings } = await import("./settings.server");
    await saveSettings({ "system.setup_dismissed": data.dismissed }, context.userId);
    return { dismissed: data.dismissed };
  });
