-- Store settings: the ordinary business configuration, out of .env.
--
-- Until now a shop owner who wanted to change the free-shipping threshold, the
-- support telephone number or the returns period had to edit an environment
-- variable and redeploy. None of those are deployment concerns. They are
-- Tuesday-afternoon decisions, and the worst case of getting one wrong is a
-- wrong price for an hour.
--
-- Credentials are not in here. Not one row of this table is a secret, and the
-- write path refuses to store anything under a key the application marks as
-- one. Secrets live in the secret store (Supabase Vault where the project has
-- it, the deployment environment otherwise), which this table does not touch.
--
-- Shape: one row per setting rather than one blob per category. A blob makes
-- two admins saving different tabs at the same time overwrite each other, makes
-- "who changed the VAT number" unanswerable, and makes per-key public exposure
-- impossible. A row per key costs an index and buys all three.

CREATE TABLE IF NOT EXISTS public.store_settings (
  -- Dotted, category-prefixed: 'company.kvk', 'shipping.free_threshold'.
  key text PRIMARY KEY,

  -- Denormalised from the key so the admin can fetch one tab without a LIKE
  -- scan, and so a category can be granted separately later.
  category text NOT NULL,

  -- jsonb rather than text: a threshold is a number, a toggle is a boolean,
  -- and storing both as strings pushes the parsing — and the bugs — into every
  -- reader. The application validates the shape per key before writing.
  value jsonb NOT NULL,

  /**
   * Whether an anonymous visitor may read this row.
   *
   * The storefront needs the store name and the free-shipping threshold before
   * anyone signs in. It does not need the bol.com sync schedule. This flag is
   * what the public policy below filters on, and it is set by the migration
   * rather than by the admin — a setting that can make itself public is a
   * setting that can leak.
   */
  is_public boolean NOT NULL DEFAULT false,

  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT store_settings_key_shape
    CHECK (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  CONSTRAINT store_settings_category_matches_key
    CHECK (category = split_part(key, '.', 1))
);

CREATE INDEX IF NOT EXISTS store_settings_category_idx ON public.store_settings (category);
CREATE INDEX IF NOT EXISTS store_settings_public_idx   ON public.store_settings (key) WHERE is_public;
CREATE INDEX IF NOT EXISTS store_settings_updated_by_idx ON public.store_settings (updated_by);

COMMENT ON TABLE public.store_settings IS
  'Ordinary business configuration, edited from Beheer → Instellingen. Never '
  'holds a credential: secrets live in the secret store. Rows flagged is_public '
  'are readable by anonymous visitors; everything else needs settings:view.';

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.store_settings FROM PUBLIC, anon, authenticated;

-- Reads only. Every write goes through the server, where the value is validated
-- against the schema for its key and the change is audited. A browser that
-- could write here could set payments.mode to 'live'.
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT ALL    ON public.store_settings TO service_role;

DROP POLICY IF EXISTS "public settings readable" ON public.store_settings;
CREATE POLICY "public settings readable" ON public.store_settings
  FOR SELECT TO anon, authenticated
  USING (is_public);

DROP POLICY IF EXISTS "staff read all settings" ON public.store_settings;
CREATE POLICY "staff read all settings" ON public.store_settings
  FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'settings', 'view'));

-- ---------------------------------------------------------------------------
-- Change history
-- ---------------------------------------------------------------------------
--
-- The audit_logs table already records admin actions, and the server writes an
-- entry for every settings change. This trigger is the layer under that: it
-- fires however the row was changed, including a direct service-role write, so
-- "when did the VAT number change" has an answer even when the change did not
-- come through the admin screen.

CREATE TABLE IF NOT EXISTS public.store_settings_history (
  id bigserial PRIMARY KEY,
  key text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid
);

CREATE INDEX IF NOT EXISTS store_settings_history_key_idx
  ON public.store_settings_history (key, changed_at DESC);

ALTER TABLE public.store_settings_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_settings_history FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.store_settings_history TO authenticated;
GRANT ALL ON public.store_settings_history TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.store_settings_history_id_seq TO service_role;

DROP POLICY IF EXISTS "staff read settings history" ON public.store_settings_history;
CREATE POLICY "staff read settings history" ON public.store_settings_history
  FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'settings', 'view'));

CREATE OR REPLACE FUNCTION public.record_setting_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.store_settings_history (key, old_value, new_value, changed_by)
  VALUES (
    COALESCE(NEW.key, OLD.key),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.value END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.value END,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.updated_by ELSE NEW.updated_by END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.record_setting_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS store_settings_history_trigger ON public.store_settings;
CREATE TRIGGER store_settings_history_trigger
  AFTER INSERT OR UPDATE OF value OR DELETE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.record_setting_change();

-- ---------------------------------------------------------------------------
-- The write path
-- ---------------------------------------------------------------------------

/**
 * Writes one setting.
 *
 * `p_category` is derived rather than passed, so a caller cannot file a key
 * under a category it does not belong to and escape a future per-category
 * grant. `p_is_public` is only honoured on insert: whether a setting is public
 * is decided by the migration that introduces it, not by whoever edits it.
 */
CREATE OR REPLACE FUNCTION public.set_store_setting(
  p_key text,
  p_value jsonb,
  p_actor uuid DEFAULT NULL,
  p_is_public boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.store_settings (key, category, value, is_public, updated_by, updated_at)
  VALUES (p_key, split_part(p_key, '.', 1), p_value, p_is_public, p_actor, now())
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_store_setting(text, jsonb, uuid, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_store_setting(text, jsonb, uuid, boolean) TO service_role;

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------
--
-- Deliberately empty of values. A setting with no row falls through to the
-- environment variable and then to the application default, so an installation
-- that is running today keeps running exactly as it is until somebody saves
-- something over it. Seeding "Besjaar" and "50" here would instead freeze
-- today's defaults into the database, where a later change to the application
-- default would silently stop taking effect.
--
-- What is seeded is the public flag, so the storefront can read a setting the
-- moment it is first saved rather than after a second migration.

INSERT INTO public.store_settings (key, category, value, is_public)
VALUES
  -- General and company details a webshop must publish.
  ('general.site_url',            'general',   'null'::jsonb, true),
  ('general.store_name',          'general',   'null'::jsonb, true),
  ('general.default_language',    'general',   'null'::jsonb, true),
  ('general.timezone',            'general',   'null'::jsonb, false),
  ('company.legal_entity',        'company',   'null'::jsonb, true),
  ('company.legal_name',          'company',   'null'::jsonb, true),
  ('company.kvk',                 'company',   'null'::jsonb, true),
  ('company.vat',                 'company',   'null'::jsonb, true),
  ('company.street',              'company',   'null'::jsonb, true),
  ('company.postal_code',         'company',   'null'::jsonb, true),
  ('company.city',                'company',   'null'::jsonb, true),
  ('company.country',             'company',   'null'::jsonb, true),
  ('company.support_email',       'company',   'null'::jsonb, true),
  ('company.support_phone',       'company',   'null'::jsonb, true),

  -- Commerce policy shown to customers before they sign in.
  ('commerce.return_days',        'commerce',  'null'::jsonb, true),
  ('commerce.warranty_months',    'commerce',  'null'::jsonb, true),
  ('commerce.low_stock_threshold','commerce',  'null'::jsonb, false),
  ('commerce.guest_checkout',     'commerce',  'null'::jsonb, true),
  ('commerce.reviews_enabled',    'commerce',  'null'::jsonb, true),
  ('commerce.wishlist_enabled',   'commerce',  'null'::jsonb, true),
  ('commerce.newsletter_enabled', 'commerce',  'null'::jsonb, true),
  ('commerce.returns_enabled',    'commerce',  'null'::jsonb, true),

  -- Payments. The mode is public because the storefront has to know whether it
  -- may offer checkout at all; it is never the credential.
  ('payments.mode',               'payments',  'null'::jsonb, true),
  ('payments.webhook_url',        'payments',  'null'::jsonb, false),
  ('payments.live_approved_at',   'payments',  'null'::jsonb, false),
  ('payments.live_approved_by',   'payments',  'null'::jsonb, false),

  -- Shipping wording and thresholds. Rates per method stay in shipping_methods.
  ('shipping.free_threshold',     'shipping',  'null'::jsonb, true),
  ('shipping.default_rate',       'shipping',  'null'::jsonb, true),
  ('shipping.dispatch_note',      'shipping',  'null'::jsonb, true),

  -- E-mail. The provider and the addresses, never the key.
  ('email.provider',              'email',     'null'::jsonb, false),
  ('email.from',                  'email',     'null'::jsonb, false),
  ('email.reply_to',              'email',     'null'::jsonb, false),

  -- Translation behaviour.
  ('translations.endpoint',       'translations', 'null'::jsonb, false),
  ('translations.auto_on_create', 'translations', 'null'::jsonb, false),
  ('translations.auto_on_update', 'translations', 'null'::jsonb, false),
  ('translations.keep_manual',    'translations', 'null'::jsonb, false),

  -- SEO defaults.
  ('seo.title_suffix',            'seo',       'null'::jsonb, true),
  ('seo.default_description',     'seo',       'null'::jsonb, true),
  ('seo.og_image',                'seo',       'null'::jsonb, true),
  ('seo.indexing_enabled',        'seo',       'null'::jsonb, true),

  -- Public analytics identifiers. These appear in the page source by design.
  ('integrations.ga_measurement_id', 'integrations', 'null'::jsonb, true),
  ('integrations.meta_pixel_id',     'integrations', 'null'::jsonb, true),
  ('integrations.bol_auto_sync',     'integrations', 'null'::jsonb, false),

  -- Setup progress, so the wizard remembers what has been done.
  ('system.setup_completed_steps', 'system',   'null'::jsonb, false),
  ('system.setup_dismissed',       'system',   'null'::jsonb, false)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- A standing check
-- ---------------------------------------------------------------------------

/**
 * Settings that are readable by anonymous visitors.
 *
 * Run it after changing anything here. A key on this list that should not be
 * public is a leak; the point of the function is that the question has a
 * one-line answer rather than needing a policy read.
 */
CREATE OR REPLACE FUNCTION public.audit_public_settings()
RETURNS TABLE (key text, category text)
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT s.key, s.category
  FROM public.store_settings s
  WHERE s.is_public
  ORDER BY s.key;
$$;

REVOKE ALL ON FUNCTION public.audit_public_settings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.audit_public_settings() TO authenticated, service_role;
