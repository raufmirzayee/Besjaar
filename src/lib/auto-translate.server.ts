/**
 * Translating a product, a category or a brand into the other three languages.
 *
 * The rules the shop needs, in one place:
 *
 *   * The source language is stated, not assumed. A shopkeeper who writes a
 *     product in English gets Dutch translated *from* English — the old
 *     assumption that everything starts in Dutch would have translated an
 *     empty Dutch field over their English text.
 *
 *   * Only prose is sent. SKUs, EANs, model numbers, URLs and prices go
 *     nowhere near a translator, which would happily turn 1002026 into
 *     1.002.026 and break the product.
 *
 *   * A field somebody corrected by hand is never overwritten. The machine
 *     fills gaps; a person's edit outranks it permanently.
 *
 *   * With no provider configured, nothing is invented. The row is recorded as
 *     awaiting translation and the admin says so plainly.
 *
 * This runs on the server and writes to the database once. Nothing here is on
 * the path of a page request.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { LOCALES, type Locale } from "./locale-detect";
import {
  resolveTranslationProvider,
  TRANSLATABLE_FIELDS,
  type TranslatableEntity,
} from "./translation-provider.server";

// Typed as the literal table names so the generated Database types accept
// them; the entity is validated in the database too, by apply_translations.
const TABLE = {
  product: "products",
  category: "categories",
  brand: "brands",
} as const satisfies Record<TranslatableEntity, string>;

export type TranslationStatus = "translated" | "partial" | "pending" | "no_provider" | "failed";

export type TranslateResult = {
  status: TranslationStatus;
  provider: string | null;
  sourceLocale: Locale;
  /** Locales that gained at least one field in this pass. */
  translated: Locale[];
  /** Fields left alone because a person had already written them. */
  skippedReviewed: string[];
  error: string | null;
};

type Row = Record<string, unknown> & {
  id: string;
  translations: Record<string, Record<string, string>> | null;
  translation_meta: Record<string, unknown> | null;
};

/** Whether a person has signed off this locale, in which case we leave it. */
function isReviewed(meta: Row["translation_meta"], locale: Locale): boolean {
  const reviewed = (meta?.reviewed ?? {}) as Record<string, unknown>;
  return Boolean(reviewed[locale]);
}

/**
 * The prose to translate, with anything technical already excluded.
 *
 * A field that is empty in the source is skipped rather than sent as "", which
 * would come back as "" and look like a translation that had been done.
 */
function sourceFields(row: Row, entity: TranslatableEntity, sourceLocale: Locale) {
  const fields: Record<string, string> = {};
  for (const field of TRANSLATABLE_FIELDS[entity]) {
    // Dutch lives in the base column; any other source language lives in the
    // translations blob under its own locale.
    const raw =
      sourceLocale === "nl" ? row[field] : (row.translations?.[sourceLocale]?.[field] ?? null);
    if (typeof raw === "string" && raw.trim().length > 0) fields[field] = raw.trim();
  }
  return fields;
}

/**
 * Translates one row into every language it is missing.
 *
 * Idempotent in the way that matters: re-running it does not overwrite a
 * reviewed language, and re-translating an unchanged row simply writes the
 * same text back.
 */
export async function translateEntity(
  entity: TranslatableEntity,
  id: string,
  options: { sourceLocale?: Locale; force?: boolean } = {},
): Promise<TranslateResult> {
  const { data, error } = await supabaseAdmin
    .from(TABLE[entity])
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`${entity} niet gevonden`);

  const row = data as unknown as Row;
  const meta = (row.translation_meta ?? {}) as Record<string, unknown>;
  const sourceLocale =
    options.sourceLocale ??
    ((LOCALES as readonly string[]).includes(String(meta.source_locale))
      ? (meta.source_locale as Locale)
      : "nl");

  const fields = sourceFields(row, entity, sourceLocale);
  const targets = LOCALES.filter((locale) => locale !== sourceLocale);

  const provider = await resolveTranslationProvider();
  const now = new Date().toISOString();

  // No provider: record the state honestly and change nothing else. Creating
  // and editing products keeps working; the admin shows what is waiting.
  if (!provider) {
    await writeMeta(entity, id, {
      source_locale: sourceLocale,
      status: "no_provider",
      provider: null,
      pending_since: (meta.pending_since as string) ?? now,
      error: null,
    });
    return {
      status: "no_provider",
      provider: null,
      sourceLocale,
      translated: [],
      skippedReviewed: [],
      error: null,
    };
  }

  if (Object.keys(fields).length === 0) {
    await writeMeta(entity, id, {
      source_locale: sourceLocale,
      status: "pending",
      provider: provider.name,
      translated_at: now,
      error: null,
    });
    return {
      status: "pending",
      provider: provider.name,
      sourceLocale,
      translated: [],
      skippedReviewed: [],
      error: "Er is geen brontekst om te vertalen.",
    };
  }

  const translations: Record<string, Record<string, string>> = {};
  const autoTranslated: Record<string, boolean> = {};
  const done: Locale[] = [];
  const skippedReviewed: string[] = [];
  const failures: string[] = [];

  for (const target of targets) {
    // A language a person has checked is theirs. Only an explicit force
    // overrides it, and that is a deliberate admin action.
    if (!options.force && isReviewed(row.translation_meta, target)) {
      skippedReviewed.push(target);
      continue;
    }

    // Fields a person already filled in for this language are left alone even
    // when the language as a whole has not been signed off.
    const existing = row.translations?.[target] ?? {};
    const wanted: Record<string, string> = {};
    for (const [field, value] of Object.entries(fields)) {
      const current = existing[field];
      const isFilled = typeof current === "string" && current.trim().length > 0;
      const wasAuto = Boolean(((meta.auto_translated ?? {}) as Record<string, unknown>)[target]);
      if (isFilled && !wasAuto && !options.force) continue;
      wanted[field] = value;
    }
    if (Object.keys(wanted).length === 0) continue;

    try {
      const result = await provider.translate({ fields: wanted, from: sourceLocale, to: target });
      if (Object.keys(result.fields).length > 0) {
        translations[target] = { ...existing, ...result.fields };
        autoTranslated[target] = true;
        done.push(target);
      }
    } catch (translationError) {
      // One language failing must not lose the ones that worked.
      failures.push(
        `${target}: ${translationError instanceof Error ? translationError.message : String(translationError)}`,
      );
    }
  }

  const status: TranslationStatus = failures.length
    ? done.length
      ? "partial"
      : "failed"
    : "translated";

  if (done.length > 0) {
    const { error: applyError } = await supabaseAdmin.rpc("apply_translations", {
      p_entity: entity,
      p_id: id,
      p_translations: translations as never,
      p_meta: {
        source_locale: sourceLocale,
        provider: provider.name,
        translated_at: now,
        auto_translated: {
          ...((meta.auto_translated ?? {}) as Record<string, unknown>),
          ...autoTranslated,
        },
        status,
        error: failures.length ? failures.join("; ") : null,
      } as never,
    });
    if (applyError) throw new Error(applyError.message);
  } else {
    await writeMeta(entity, id, {
      source_locale: sourceLocale,
      provider: provider.name,
      translated_at: now,
      status,
      error: failures.length ? failures.join("; ") : null,
    });
  }

  return {
    status,
    provider: provider.name,
    sourceLocale,
    translated: done,
    skippedReviewed,
    error: failures.length ? failures.join("; ") : null,
  };
}

/** Writes provenance without touching the text. */
async function writeMeta(entity: TranslatableEntity, id: string, meta: Record<string, unknown>) {
  const { error } = await supabaseAdmin.rpc("apply_translations", {
    p_entity: entity,
    p_id: id,
    p_translations: {} as never,
    p_meta: meta as never,
  });
  if (error) throw new Error(error.message);
}

/** Records that a person has read and accepted a language, freezing it. */
export async function markTranslationReviewed(
  entity: TranslatableEntity,
  id: string,
  locale: Locale,
  userId: string | null,
): Promise<void> {
  const { data } = await supabaseAdmin
    .from(TABLE[entity])
    .select("translation_meta")
    .eq("id", id)
    .maybeSingle();
  const meta = ((data as { translation_meta?: Record<string, unknown> } | null)?.translation_meta ??
    {}) as Record<string, unknown>;
  const reviewed = { ...((meta.reviewed ?? {}) as Record<string, unknown>) };
  reviewed[locale] = { at: new Date().toISOString(), by: userId };
  await writeMeta(entity, id, { reviewed });
}

/**
 * Marks a row as needing a translation pass, without calling anyone.
 *
 * Saving a product does this rather than translating inline: an external call
 * inside a save makes the save as slow and as fragile as the provider, and a
 * shopkeeper should never be unable to publish a product because a translation
 * service is down.
 */
export async function markTranslationPending(
  entity: TranslatableEntity,
  id: string,
  sourceLocale: Locale,
): Promise<void> {
  const provider = await resolveTranslationProvider();
  await writeMeta(entity, id, {
    source_locale: sourceLocale,
    status: provider ? "pending" : "no_provider",
    pending_since: new Date().toISOString(),
  });
}
