-- Where integration credentials live.
--
-- The admin needs to be able to connect Mollie, Resend, DeepL and bol.com
-- without anyone opening a terminal. That means writing a credential at
-- runtime, which means somewhere safe to put it. Three options were on the
-- table and only one of them is honest:
--
--   1. A plaintext column in a public-schema table. No.
--   2. Rewriting the deployment's environment from the application. The app
--      cannot do this on Cloudflare Workers, and faking it — showing "saved"
--      while the value went nowhere — is worse than not offering it.
--   3. Supabase Vault, which encrypts at rest with a key the database never
--      stores alongside the ciphertext, and decrypts only for a caller that
--      already holds the service role.
--
-- So: Vault where the project has it, the deployment environment otherwise,
-- and an admin screen that says which of the two is holding each credential
-- rather than pretending they are the same thing.
--
-- SUPABASE_SERVICE_ROLE_KEY is the one credential that cannot move here. It is
-- the key that unlocks the vault; putting it inside would be a lock whose key
-- is behind the lock.

-- ---------------------------------------------------------------------------
-- Is Vault available?
-- ---------------------------------------------------------------------------
--
-- `supabase_vault` is present on Supabase projects and absent on a plain
-- Postgres, which is what the test harness runs. Everything below degrades to
-- "no vault" rather than failing, so the same migration applies to both.

CREATE OR REPLACE FUNCTION public.secret_store_available()
RETURNS boolean
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  -- Probes for the capability, not for the extension name. What matters is
  -- whether the three things this migration calls actually exist; checking
  -- pg_extension instead would report "no vault" on any project that provides
  -- the same interface another way, and would make the path untestable
  -- anywhere the extension cannot be installed.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'vault' AND table_name = 'secrets'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'vault' AND table_name = 'decrypted_secrets'
  ) AND EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'vault' AND p.proname = 'create_secret'
  ) AND EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'vault' AND p.proname = 'update_secret'
  );
$$;

REVOKE ALL ON FUNCTION public.secret_store_available() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.secret_store_available() TO service_role;

COMMENT ON FUNCTION public.secret_store_available() IS
  'Whether Supabase Vault is usable on this project. False means credentials '
  'stay in the deployment environment and the admin offers setup instructions '
  'rather than a save button.';

-- ---------------------------------------------------------------------------
-- What the application is allowed to keep here
-- ---------------------------------------------------------------------------
--
-- A fixed list, not an open key-value store. An open store is one injection
-- away from an attacker writing a credential the application will then use to
-- call somewhere of their choosing.

CREATE TABLE IF NOT EXISTS public.managed_secrets (
  name text PRIMARY KEY,
  /** The vault.secrets row holding the value, when Vault is in use. */
  vault_secret_id uuid,
  /**
   * Enough of the value to recognise it, and nothing more: never more than the
   * last four characters, and only for credentials whose shape makes that
   * safe. Written by the server, which decides per secret whether a hint is
   * safe at all.
   */
  masked_hint text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT managed_secrets_known_name CHECK (
    name IN (
      'MOLLIE_API_KEY',
      'RESEND_API_KEY',
      'DEEPL_API_KEY',
      'BOL_CLIENT_ID',
      'BOL_CLIENT_SECRET',
      'SYNC_TRIGGER_SECRET'
    )
  ),
  CONSTRAINT managed_secrets_hint_is_short CHECK (
    masked_hint IS NULL OR length(masked_hint) <= 24
  )
);

-- Six rows at most, but the foreign key to auth.users still wants an index:
-- without one, deleting a staff account scans this table while holding a lock
-- on it, and every unindexed foreign key is one the audit has to argue about.
CREATE INDEX IF NOT EXISTS managed_secrets_updated_by_idx
  ON public.managed_secrets (updated_by);

-- No grant to anon or authenticated at all. Not even a masked hint is read
-- from the browser: the admin gets its status through a server function that
-- checks settings/secrets permissions first.
ALTER TABLE public.managed_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.managed_secrets FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.managed_secrets TO service_role;

COMMENT ON TABLE public.managed_secrets IS
  'Bookkeeping for runtime-managed credentials: which vault row holds each, '
  'when it was last replaced, and a short masked hint. Never the value itself.';

-- ---------------------------------------------------------------------------
-- Write
-- ---------------------------------------------------------------------------

/**
 * Stores a credential in Vault and records the bookkeeping.
 *
 * Returns false when Vault is unavailable, so the caller can tell the admin
 * the truth — that the value has to go into the deployment environment —
 * rather than reporting a save that did not happen.
 *
 * The value is passed in and never returned. Nothing in this function logs it:
 * a RAISE carrying `p_value` would put the credential in the Postgres log,
 * which is exactly the place it must not be.
 */
CREATE OR REPLACE FUNCTION public.store_managed_secret(
  p_name text,
  p_value text,
  p_masked_hint text DEFAULT NULL,
  p_actor uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_existing uuid;
  v_id uuid;
BEGIN
  IF p_value IS NULL OR length(trim(p_value)) = 0 THEN
    RAISE EXCEPTION 'Een lege waarde is geen credential.' USING ERRCODE = 'check_violation';
  END IF;

  -- Checked here rather than relying on the table constraint, which only fires
  -- on the insert below and so would never run on a project without Vault. An
  -- unknown name is refused the same way everywhere.
  IF p_name NOT IN (
    'MOLLIE_API_KEY', 'RESEND_API_KEY', 'DEEPL_API_KEY',
    'BOL_CLIENT_ID', 'BOL_CLIENT_SECRET', 'SYNC_TRIGGER_SECRET'
  ) THEN
    RAISE EXCEPTION
      '% is geen credential die hier beheerd wordt.', p_name
      USING ERRCODE = 'check_violation',
            HINT = 'Bootstrap-sleutels zoals SUPABASE_SERVICE_ROLE_KEY horen in de deploy-omgeving.';
  END IF;

  IF NOT public.secret_store_available() THEN
    RETURN false;
  END IF;

  SELECT vault_secret_id INTO v_existing FROM public.managed_secrets WHERE name = p_name;

  IF v_existing IS NOT NULL THEN
    -- Replace in place, so the id the application resolves by stays stable.
    PERFORM vault.update_secret(v_existing, p_value, p_name, 'Besjaar managed credential');
    v_id := v_existing;
  ELSE
    SELECT vault.create_secret(p_value, p_name, 'Besjaar managed credential') INTO v_id;
  END IF;

  INSERT INTO public.managed_secrets (name, vault_secret_id, masked_hint, updated_by, updated_at)
  VALUES (p_name, v_id, p_masked_hint, p_actor, now())
  ON CONFLICT (name) DO UPDATE
    SET vault_secret_id = EXCLUDED.vault_secret_id,
        masked_hint     = EXCLUDED.masked_hint,
        updated_by      = EXCLUDED.updated_by,
        updated_at      = now();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.store_managed_secret(text, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_managed_secret(text, text, text, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Read
-- ---------------------------------------------------------------------------

/**
 * Returns a credential, for the server only.
 *
 * EXECUTE is granted to service_role alone, and the server module that calls
 * this never passes the result anywhere near a response body. There is no
 * PostgREST route to it for `authenticated`, so a browser cannot reach it even
 * with a valid session.
 */
CREATE OR REPLACE FUNCTION public.read_managed_secret(p_name text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id uuid;
  v_value text;
BEGIN
  IF NOT public.secret_store_available() THEN
    RETURN NULL;
  END IF;

  SELECT vault_secret_id INTO v_id FROM public.managed_secrets WHERE name = p_name;
  IF v_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_value
  FROM vault.decrypted_secrets WHERE id = v_id;

  RETURN v_value;
END;
$$;

REVOKE ALL ON FUNCTION public.read_managed_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_managed_secret(text) TO service_role;

-- ---------------------------------------------------------------------------
-- Status, and removal
-- ---------------------------------------------------------------------------

/**
 * What the admin screen is allowed to know: that a credential exists, when it
 * was last replaced, and a short hint. Never the value.
 */
CREATE OR REPLACE FUNCTION public.managed_secret_status()
RETURNS TABLE (name text, configured boolean, masked_hint text, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT s.name, s.vault_secret_id IS NOT NULL, s.masked_hint, s.updated_at
  FROM public.managed_secrets s
  ORDER BY s.name;
$$;

REVOKE ALL ON FUNCTION public.managed_secret_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.managed_secret_status() TO service_role;

/** Disconnects an integration: drops the vault row and the bookkeeping. */
CREATE OR REPLACE FUNCTION public.forget_managed_secret(p_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT vault_secret_id INTO v_id FROM public.managed_secrets WHERE name = p_name;
  IF v_id IS NULL THEN
    RETURN false;
  END IF;

  IF public.secret_store_available() THEN
    DELETE FROM vault.secrets WHERE id = v_id;
  END IF;
  DELETE FROM public.managed_secrets WHERE name = p_name;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.forget_managed_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.forget_managed_secret(text) TO service_role;
