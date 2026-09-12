-- Internal views were readable by every signed-in customer.
--
-- The three views added in this cycle — staff_role_audit,
-- inventory_reconciliation and products_awaiting_translation — were created
-- by a superuser and granted SELECT to `authenticated`. Two things follow
-- from that, and both are bad:
--
--   * A view runs with its owner's rights by default. Owned by a superuser,
--     these bypass row-level security on every table underneath them. The
--     careful policies on user_roles, profiles and products simply do not
--     apply when the read goes through the view.
--
--   * `authenticated` is every registered shopper, not every staff member.
--
-- Verified before the fix, as an ordinary customer with no roles:
--
--   SELECT email, role FROM public.staff_role_audit;
--   -> boss@besjaar.nl | super_admin
--
-- That is a targeted-phishing list: the shop's staff addresses, and which one
-- holds the keys. The same session could read the full inventory
-- reconciliation report and the translation queue.
--
-- Two changes, because either alone is a single point of failure.

-- ---------------------------------------------------------------------------
-- 1. The views run as the caller, not as their owner
-- ---------------------------------------------------------------------------
--
-- security_invoker makes RLS on the underlying tables apply to whoever is
-- querying. Even if a future migration re-grants one of these to
-- `authenticated` by accident, a customer reading staff_role_audit now gets
-- what user_roles' own policy allows them — nothing — instead of everything.
--
-- Guarded on the server version: security_invoker arrived in PostgreSQL 15.
-- Supabase has been on 15 or later for new projects since 2023, but a project
-- older than that should still be able to apply this migration and get the
-- grant fix below rather than failing outright.
DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 150000 THEN
    ALTER VIEW public.staff_role_audit              SET (security_invoker = true);
    ALTER VIEW public.inventory_reconciliation      SET (security_invoker = true);
    ALTER VIEW public.products_awaiting_translation SET (security_invoker = true);
    RAISE NOTICE 'Internal views now run with the caller''s privileges.';
  ELSE
    RAISE WARNING 'PostgreSQL % is older than 15: security_invoker is unavailable, so these views still run as their owner. The revoked grants below are the only control. Upgrade when you can.',
      current_setting('server_version');
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Only the server may read them at all
-- ---------------------------------------------------------------------------
--
-- These are operational reports, not customer data and not something the
-- browser ever queries directly. The admin reaches each of them through a
-- server function that checks a specific permission first
-- (users:view, inventory:view, products:view), which is where the decision
-- about who may see a staff directory belongs.

REVOKE ALL ON public.staff_role_audit              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.inventory_reconciliation      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.products_awaiting_translation FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.staff_role_audit              TO service_role;
GRANT SELECT ON public.inventory_reconciliation      TO service_role;
GRANT SELECT ON public.products_awaiting_translation TO service_role;

COMMENT ON VIEW public.staff_role_audit IS
  'Every account holding a staff role. Server-side only: read it through the admin (users:view), never from the browser. It was briefly readable by any signed-in customer — see 20260912090000.';

-- ---------------------------------------------------------------------------
-- 3. A view added later must not repeat this
-- ---------------------------------------------------------------------------
--
-- Default privileges do not cover views created by a different role, and
-- nothing in Postgres stops the next person granting SELECT to authenticated.
-- What this does is make the mistake visible: the check runs on every
-- deployment of the test suite and names the offending view.

CREATE OR REPLACE FUNCTION public.audit_view_exposure()
RETURNS TABLE (view_name text, problem text)
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT c.relname::text,
         CASE
           WHEN has_table_privilege('anon', c.oid, 'SELECT')
             THEN 'readable by anonymous visitors'
           ELSE 'readable by every signed-in customer'
         END
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'v'
    AND n.nspname = 'public'
    -- Views the storefront legitimately reads would be listed here. There are
    -- none today: every public view is an internal report.
    AND c.relname NOT IN ('')
    AND (has_table_privilege('anon', c.oid, 'SELECT')
      OR has_table_privilege('authenticated', c.oid, 'SELECT'))
  ORDER BY c.relname;
$$;

COMMENT ON FUNCTION public.audit_view_exposure() IS
  'Lists public views readable from the browser. Should return no rows. Called by supabase/tests/rls.test.sql.';

REVOKE ALL ON FUNCTION public.audit_view_exposure() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_view_exposure() TO service_role;
