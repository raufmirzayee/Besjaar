import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAudit, requirePermission } from "./admin-core.server";
import {
  fetchTranslationCoverage,
  fetchTranslationDraft,
  fetchTranslationDrafts,
  saveTranslationDraft,
  saveTranslationDrafts,
} from "./admin-translations.server";
import { COVERAGE_LOCALES, COVERAGE_FIELDS, type CoverageEntity } from "./translation-coverage";

const ENTITIES: CoverageEntity[] = ["product", "category", "brand"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseTarget(input: unknown) {
  const data = input as { entity?: string; id?: string };
  if (!data || !ENTITIES.includes(data.entity as CoverageEntity)) throw new Error("Ongeldig type");
  if (typeof data.id !== "string" || !UUID_RE.test(data.id)) throw new Error("Ongeldig id");
  return { entity: data.entity as CoverageEntity, id: data.id };
}

export const getTranslationCoverage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "products", "view");
    return fetchTranslationCoverage(context.supabase);
  });

export const getTranslationDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseTarget)
  .handler(async ({ data, context }) => {
    await requirePermission(context, "products", "view");
    return fetchTranslationDraft(context.supabase, data.entity, data.id);
  });

export const saveTranslationFields = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const target = parseTarget(input);
    const raw = (input as { values?: Record<string, unknown> }).values ?? {};
    const values: Record<string, string> = {};
    const allowed = new Set(
      COVERAGE_FIELDS[target.entity].flatMap((field) =>
        COVERAGE_LOCALES.map((locale) => `${locale}:${field}`),
      ),
    );
    for (const [key, value] of Object.entries(raw)) {
      if (!allowed.has(key)) continue;
      if (typeof value !== "string") continue;
      if (value.length > 20000) throw new Error("Tekst is te lang");
      values[key] = value;
    }
    return { ...target, values };
  })
  .handler(async ({ data, context }) => {
    await requirePermission(context, "products", "edit");
    const result = await saveTranslationDraft(context.supabase, data.entity, data.id, data.values);
    if (result.changed.length > 0) {
      await logAudit({
        userId: context.userId,
        userEmail: (context.claims as { email?: string | null } | undefined)?.email ?? null,
        action: "translations.update",
        module: "products",
        entityType: data.entity,
        entityId: data.id,
        newValue: { changed: result.changed },
      });
    }
    return result;
  });

function sanitizeValues(entity: CoverageEntity, raw: Record<string, unknown>) {
  const allowed = new Set(
    COVERAGE_FIELDS[entity].flatMap((field) =>
      COVERAGE_LOCALES.map((locale) => `${locale}:${field}`),
    ),
  );
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!allowed.has(key)) continue;
    if (typeof value !== "string") continue;
    if (value.length > 20000) throw new Error("Tekst is te lang");
    values[key] = value;
  }
  return values;
}

export const getTranslationDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const list = (input as { targets?: unknown }).targets;
    if (!Array.isArray(list) || list.length === 0) throw new Error("Geen selectie");
    if (list.length > 50) throw new Error("Maximaal 50 items per keer");
    return { targets: list.map((item) => parseTarget(item)) };
  })
  .handler(async ({ data, context }) => {
    await requirePermission(context, "products", "view");
    return fetchTranslationDrafts(context.supabase, data.targets);
  });

export const saveTranslationFieldsBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const list = (input as { items?: unknown }).items;
    if (!Array.isArray(list) || list.length === 0) throw new Error("Geen selectie");
    if (list.length > 50) throw new Error("Maximaal 50 items per keer");
    return {
      items: list.map((item) => {
        const target = parseTarget(item);
        const raw = (item as { values?: Record<string, unknown> }).values ?? {};
        return { ...target, values: sanitizeValues(target.entity, raw) };
      }),
    };
  })
  .handler(async ({ data, context }) => {
    await requirePermission(context, "products", "edit");
    const result = await saveTranslationDrafts(context.supabase, data.items);
    const email = (context.claims as { email?: string | null } | undefined)?.email ?? null;
    for (const entry of result.results) {
      if (entry.changed.length === 0) continue;
      await logAudit({
        userId: context.userId,
        userEmail: email,
        action: "translations.bulk_update",
        module: "products",
        entityType: entry.entity,
        entityId: entry.id,
        newValue: { changed: entry.changed },
      });
    }
    return result;
  });

/**
 * Runs a translation pass over one entity, now.
 *
 * The product form calls this straight after a save, and the translations
 * screen calls it for anything still pending. It is a separate call from the
 * save on purpose: the save must not wait on an external service.
 */
export const runAutoTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const target = parseTarget(input);
    const data = input as { sourceLocale?: unknown; force?: unknown };
    const source = data?.sourceLocale;
    const sourceLocale =
      source === "nl" || source === "en" || source === "de" || source === "fr"
        ? (source as "nl" | "en" | "de" | "fr")
        : undefined;
    return { ...target, sourceLocale, force: data?.force === true };
  })
  .handler(async ({ data, context }) => {
    await requirePermission(context, "products", "edit");
    const { translateEntity } = await import("./auto-translate.server");
    const result = await translateEntity(data.entity, data.id, {
      sourceLocale: data.sourceLocale,
      force: data.force,
    });

    if (result.translated.length > 0) {
      await logAudit({
        userId: context.userId,
        userEmail: (context.claims as { email?: string | null } | undefined)?.email ?? null,
        action: "translations.auto",
        module: "products",
        entityType: data.entity,
        entityId: data.id,
        newValue: {
          provider: result.provider,
          source: result.sourceLocale,
          locales: result.translated,
        },
      });
    }
    return result;
  });

/** Whether this deployment has a translation provider, for the admin to show. */
export const getTranslationProviderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "products", "view");
    const { translationProviderName } = await import("./translation-provider.server");
    const provider = translationProviderName();
    return { configured: provider !== null, provider };
  });

/**
 * Freezes a language a person has read, so a later machine pass leaves it.
 */
export const acceptTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const target = parseTarget(input);
    const locale = (input as { locale?: unknown }).locale;
    if (locale !== "nl" && locale !== "en" && locale !== "de" && locale !== "fr") {
      throw new Error("Ongeldige taal");
    }
    return { ...target, locale: locale as "nl" | "en" | "de" | "fr" };
  })
  .handler(async ({ data, context }) => {
    await requirePermission(context, "products", "edit");
    const { markTranslationReviewed } = await import("./auto-translate.server");
    await markTranslationReviewed(data.entity, data.id, data.locale, context.userId);
    return { ok: true as const };
  });
