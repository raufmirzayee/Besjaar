-- Where a translation came from.
--
-- The `translations` column already held the text. What it never held was
-- whether a given string was written by a person or produced by a machine,
-- which language it was translated *from*, or whether anyone has read it
-- since. Without that, an auto-translation and a checked one look identical in
-- the admin, and there is no way to find the ones still worth reviewing.
--
-- It also assumed Dutch as the source everywhere. A shopkeeper who writes a
-- product in English should have Dutch translated *from* English, not have
-- English overwritten by a translation of an empty Dutch field.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS translation_meta jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS translation_meta jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS translation_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.products.translation_meta IS
  'Provenance for the translations column: {"source_locale":"nl","provider":"deepl","translated_at":"...","auto_translated":{"en":true,"de":true},"reviewed":{"en":{"at":"...","by":"<uuid>"}},"status":"translated|pending|no_provider","error":null}';

/**
 * Records one translation pass over a row.
 *
 * Merges the new locale text into `translations` rather than replacing it, so
 * a language a person has corrected by hand is not overwritten by a later
 * machine pass over a different language. The caller decides which locales to
 * include; anything absent is left exactly as it was.
 *
 * It deliberately does NOT touch `updated_at`. That column means "the source
 * text changed", and the awaiting-translation queue is built from it: bumping
 * it here would make every translation pass mark the row as edited again, so a
 * product would re-queue itself the instant it was translated and the queue
 * would never empty.
 */
CREATE OR REPLACE FUNCTION public.apply_translations(
  p_entity text,
  p_id uuid,
  p_translations jsonb,
  p_meta jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_entity NOT IN ('product', 'category', 'brand') THEN
    RAISE EXCEPTION 'Unknown translatable entity %', p_entity USING ERRCODE = 'check_violation';
  END IF;

  IF p_entity = 'product' THEN
    UPDATE public.products
    SET translations = COALESCE(translations, '{}'::jsonb) || COALESCE(p_translations, '{}'::jsonb),
        translation_meta = COALESCE(translation_meta, '{}'::jsonb) || COALESCE(p_meta, '{}'::jsonb)
    WHERE id = p_id;
  ELSIF p_entity = 'category' THEN
    UPDATE public.categories
    SET translations = COALESCE(translations, '{}'::jsonb) || COALESCE(p_translations, '{}'::jsonb),
        translation_meta = COALESCE(translation_meta, '{}'::jsonb) || COALESCE(p_meta, '{}'::jsonb)
    WHERE id = p_id;
  ELSE
    UPDATE public.brands
    SET translations = COALESCE(translations, '{}'::jsonb) || COALESCE(p_translations, '{}'::jsonb),
        translation_meta = COALESCE(translation_meta, '{}'::jsonb) || COALESCE(p_meta, '{}'::jsonb)
    WHERE id = p_id;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION '% % not found', p_entity, p_id USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_translations(text, uuid, jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_translations(text, uuid, jsonb, jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- Knowing when the source text actually changed
-- ---------------------------------------------------------------------------
--
-- `updated_at` cannot answer this. A BEFORE UPDATE trigger bumps it on every
-- write to the row — including the write that stores the translations — so a
-- queue built on it would re-queue a product the instant it was translated and
-- never empty. It also cannot tell a rewritten description from a price
-- change, and a price change needs no translating.
--
-- This column moves only when text a translator would care about moves.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS source_content_updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS source_content_updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS source_content_updated_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.products.source_content_updated_at IS
  'When a translatable field last changed. Distinct from updated_at, which moves on every write including the one that stores translations.';

CREATE OR REPLACE FUNCTION public.touch_source_content()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Only the fields a translator is given. A price, a stock movement or the
  -- translations column itself leaves this alone.
  IF TG_TABLE_NAME = 'products' THEN
    IF NEW.name IS DISTINCT FROM OLD.name
       OR NEW.short_description IS DISTINCT FROM OLD.short_description
       OR NEW.full_description IS DISTINCT FROM OLD.full_description
       OR NEW.seo_title IS DISTINCT FROM OLD.seo_title
       OR NEW.seo_description IS DISTINCT FROM OLD.seo_description THEN
      NEW.source_content_updated_at := now();
    END IF;
  ELSIF TG_TABLE_NAME = 'categories' THEN
    IF NEW.name IS DISTINCT FROM OLD.name
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.seo_title IS DISTINCT FROM OLD.seo_title
       OR NEW.seo_description IS DISTINCT FROM OLD.seo_description THEN
      NEW.source_content_updated_at := now();
    END IF;
  ELSE
    IF NEW.name IS DISTINCT FROM OLD.name
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.seo_title IS DISTINCT FROM OLD.seo_title
       OR NEW.seo_description IS DISTINCT FROM OLD.seo_description THEN
      NEW.source_content_updated_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_source_content ON public.products;
CREATE TRIGGER trg_products_source_content
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_source_content();

DROP TRIGGER IF EXISTS trg_categories_source_content ON public.categories;
CREATE TRIGGER trg_categories_source_content
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_source_content();

DROP TRIGGER IF EXISTS trg_brands_source_content ON public.brands;
CREATE TRIGGER trg_brands_source_content
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.touch_source_content();

-- ---------------------------------------------------------------------------
-- Finding the work
-- ---------------------------------------------------------------------------

/**
 * Products whose translations are behind their source text.
 *
 * "Behind" means either never translated, or translated before the row was
 * last edited — a description someone rewrote in Dutch this morning has an
 * English translation of yesterday's wording, which is worse than none because
 * it looks finished.
 */
-- Dropped rather than replaced: the column list changed, and CREATE OR REPLACE
-- cannot rename a view's columns.
DROP VIEW IF EXISTS public.products_awaiting_translation;
CREATE VIEW public.products_awaiting_translation AS
SELECT
  p.id,
  p.slug,
  p.name,
  p.status,
  p.source_content_updated_at,
  COALESCE(p.translation_meta ->> 'source_locale', 'nl') AS source_locale,
  p.translation_meta ->> 'status' AS translation_status,
  (p.translation_meta ->> 'translated_at')::timestamptz AS translated_at,
  CASE
    WHEN p.translation_meta ->> 'translated_at' IS NULL THEN 'never translated'
    WHEN (p.translation_meta ->> 'translated_at')::timestamptz < p.source_content_updated_at
      THEN 'source changed since'
    ELSE 'up to date'
  END AS reason
FROM public.products p
WHERE p.status <> 'archived'
  AND (
    p.translation_meta ->> 'translated_at' IS NULL
    OR (p.translation_meta ->> 'translated_at')::timestamptz < p.source_content_updated_at
  );

COMMENT ON VIEW public.products_awaiting_translation IS
  'Products never translated, or edited since their last translation pass. The queue the admin translation screen works through.';

REVOKE ALL ON public.products_awaiting_translation FROM PUBLIC, anon;
GRANT SELECT ON public.products_awaiting_translation TO authenticated, service_role;
