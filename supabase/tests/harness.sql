-- Local stand-ins for the parts of Supabase that live outside `public`.
--
-- The migrations reference auth.uid(), auth.jwt(), the anon/authenticated/
-- service_role roles and storage.objects. Supabase provides all of those; a
-- plain PostgreSQL server does not. This file provides them faithfully enough
-- that the RLS policies under test behave exactly as they do in production —
-- in particular auth.uid() and auth.jwt() read the verified JWT claims from
-- `request.jwt.claims`, which is precisely how Supabase defines them.
--
-- It is a harness, not a migration. It is never applied to a real database:
-- Supabase already has all of this, and running it there would replace
-- Supabase's own functions.
--
--     createdb besjaar_test
--     psql -d besjaar_test -f supabase/tests/harness.sql
--     for f in supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -d besjaar_test -f "$f"; done

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

/** The signed-in user's id, from the verified JWT. Supabase defines it this way. */
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) ->> 'sub',
    ''
  )::uuid
$$;

/** The whole verified claim set — `aal` among them, which the staff MFA check reads. */
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) ->> 'role',
    'anon'
  )
$$;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text,
  public boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT string_to_array(name, '/')
$$;

DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- service_role carries BYPASSRLS in Supabase, and the server relies on that:
-- every server function that reads across customers does so through the
-- service-role client. Without the attribute the harness would quietly prove
-- the wrong thing — a query that works in production returning nothing here,
-- or a policy looking tighter than it is.
DO $$ BEGIN CREATE ROLE service_role NOLOGIN BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER ROLE service_role BYPASSRLS;

GRANT USAGE ON SCHEMA auth, storage TO anon, authenticated, service_role;
