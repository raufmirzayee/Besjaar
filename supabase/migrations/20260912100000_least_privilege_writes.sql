-- Staff could rewrite any order, and any staff member could read the directory.
--
-- Two findings, both reproduced against this schema before the fix.
--
-- 1. `orders` carried a single UPDATE policy authorising four roles by name,
--    with no restriction on which columns they could change. A warehouse
--    account — the lowest-trust staff role, held by whoever packs boxes —
--    could do this straight through the Supabase client:
--
--      UPDATE orders SET total = 0.01,
--                        payment_status = 'paid',
--                        payment_reference = 'forged'
--      WHERE order_number = 'BES-10001';
--
--    It succeeded. A €126 order became a paid €0.01 order with no application
--    code involved and nothing in the audit log.
--
-- 2. `user_roles` allowed any staff member to read every row. A content editor
--    — hired to write product copy — could enumerate every colleague's user id
--    and role, which is the reconnaissance step before a targeted attack.
--
-- The principle applied throughout: a role gets the narrowest thing that lets
-- it do its job, and anything wider goes through a server function that names
-- the permission it needs and writes an audit entry.

-- ---------------------------------------------------------------------------
-- Orders: no direct writes from the browser at all
-- ---------------------------------------------------------------------------
--
-- Every legitimate order write in this application already goes through the
-- service-role client: fulfilment.server.ts advances status and records
-- shipments, bol.server.ts ingests marketplace orders, and the Mollie webhook
-- updates payment state. All three are behind requirePermission or a verified
-- webhook. Nothing needs the browser to be able to UPDATE an order, so nothing
-- may.
--
-- Both the policy and the grant go. Either alone would do it; both together
-- mean a future migration that re-adds one does not silently reopen this.

DROP POLICY IF EXISTS "staff updates orders" ON public.orders;
REVOKE UPDATE, INSERT, DELETE ON public.orders FROM authenticated, anon;

COMMENT ON TABLE public.orders IS
  'Customers read their own; staff read via orders:view. Nobody writes from the browser — order changes go through the server (fulfilment, webhook, bol sync), which checks permissions and writes an audit trail. See 20260912100000.';

-- order_items and order_status_history are written by the same server paths.
REVOKE UPDATE, INSERT, DELETE ON public.order_items         FROM authenticated, anon;
REVOKE UPDATE, INSERT, DELETE ON public.order_status_history FROM authenticated, anon;

-- ---------------------------------------------------------------------------
-- user_roles: your own, or the one role that administers roles
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    -- `users` is a super-admin-only module. Everyone else sees their own row,
    -- which is what the admin shell needs to decide what to draw.
    OR private.has_permission(auth.uid(), 'users', 'view')
  );

COMMENT ON TABLE public.user_roles IS
  'Your own roles, or everyone''s if you hold users:view (super admin). Any staff member could read the whole directory until 20260912100000.';

-- ---------------------------------------------------------------------------
-- staff_accounts: the same rule, expressed as a permission
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff read own staff account" ON public.staff_accounts;
DROP POLICY IF EXISTS "Super admin manages staff accounts" ON public.staff_accounts;

CREATE POLICY "read own staff account" ON public.staff_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_permission(auth.uid(), 'users', 'view'));

CREATE POLICY "administer staff accounts" ON public.staff_accounts
  FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(), 'users', 'manage_settings'))
  WITH CHECK (private.has_permission(auth.uid(), 'users', 'manage_settings'));

-- ---------------------------------------------------------------------------
-- Returns: permission-based, and refund amounts are not a free-text field
-- ---------------------------------------------------------------------------
--
-- The four-role list here had the same shape as the orders one: any of them
-- could set refund_amount to any number. The amount now moves only through
-- a function that checks it against what was actually paid (added in
-- 20260912130000); the columns staff genuinely edit are granted individually,
-- so Postgres refuses the rest rather than trusting the application to.

DROP POLICY IF EXISTS "Staff view all returns" ON public.returns;
DROP POLICY IF EXISTS "Staff update returns"   ON public.returns;

CREATE POLICY "staff view returns" ON public.returns
  FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'returns', 'view'));

CREATE POLICY "staff update returns" ON public.returns
  FOR UPDATE TO authenticated
  USING (private.has_permission(auth.uid(), 'returns', 'edit'))
  WITH CHECK (private.has_permission(auth.uid(), 'returns', 'edit'));

-- Column-level: the customer keeps their own two columns, staff get the
-- handling fields, and refund_amount is on neither list.
REVOKE UPDATE ON public.returns FROM authenticated;
GRANT UPDATE (status, staff_note, tracking_code, received_at, refunded_at, updated_at)
  ON public.returns TO authenticated;

DROP POLICY IF EXISTS "Staff view all return items" ON public.return_items;
DROP POLICY IF EXISTS "Staff update return items"   ON public.return_items;

CREATE POLICY "staff view return items" ON public.return_items
  FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'returns', 'view'));

CREATE POLICY "staff update return items" ON public.return_items
  FOR UPDATE TO authenticated
  USING (private.has_permission(auth.uid(), 'returns', 'edit'))
  WITH CHECK (private.has_permission(auth.uid(), 'returns', 'edit'));

-- ---------------------------------------------------------------------------
-- The rest of the tables still naming roles by hand
-- ---------------------------------------------------------------------------
--
-- Each of these worked, but each was a second copy of the access rules that
-- nobody kept in step with role_permissions. Where the permission produces a
-- different set of roles than the old hand-written list, it is noted.

-- Audit log: audit:view is super_admin, store_manager, financial — the same
-- three the old list named.
DROP POLICY IF EXISTS "Managers read audit logs" ON public.audit_logs;
CREATE POLICY "read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'audit', 'view'));

-- Newsletter subscribers are customer e-mail addresses. The old list included
-- content_editor, which is a tightening rather than a translation: someone
-- hired to write product copy has no reason to hold the mailing list.
DROP POLICY IF EXISTS "Staff read subscribers" ON public.newsletter_subscribers;
CREATE POLICY "read subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'customers', 'view'));

-- Reviews.
DROP POLICY IF EXISTS "Staff read all reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Staff moderate reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Staff delete reviews"   ON public.product_reviews;

CREATE POLICY "staff read reviews" ON public.product_reviews
  FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'reviews', 'view'));

CREATE POLICY "staff moderate reviews" ON public.product_reviews
  FOR UPDATE TO authenticated
  USING (private.has_permission(auth.uid(), 'reviews', 'approve'))
  WITH CHECK (private.has_permission(auth.uid(), 'reviews', 'approve'));

CREATE POLICY "staff delete reviews" ON public.product_reviews
  FOR DELETE TO authenticated
  USING (private.has_permission(auth.uid(), 'reviews', 'archive'));

-- Import runs, sync jobs and sync logs: operational records for the people who
-- run them. is_staff meant every role, including content editors.
DROP POLICY IF EXISTS "Staff read product import runs" ON public.product_import_runs;
CREATE POLICY "read import runs" ON public.product_import_runs
  FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'products', 'view'));

DROP POLICY IF EXISTS "staff reads sync jobs" ON public.sync_jobs;
CREATE POLICY "read sync jobs" ON public.sync_jobs
  FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'sync', 'view'));

DROP POLICY IF EXISTS "staff reads sync logs" ON public.sync_logs;
CREATE POLICY "read sync logs" ON public.sync_logs
  FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'sync', 'view'));

-- Settings. Non-public rows can hold operational configuration; settings is a
-- super-admin module, and nothing in the application reads this table from the
-- browser today.
DROP POLICY IF EXISTS "public reads public settings" ON public.application_settings;
DROP POLICY IF EXISTS "admins write settings"        ON public.application_settings;

CREATE POLICY "read public settings" ON public.application_settings
  FOR SELECT TO anon, authenticated
  USING (is_public OR private.has_permission(auth.uid(), 'settings', 'view'));

CREATE POLICY "write settings" ON public.application_settings
  FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(), 'settings', 'manage_settings'))
  WITH CHECK (private.has_permission(auth.uid(), 'settings', 'manage_settings'));

-- ---------------------------------------------------------------------------
-- Harden the SECURITY DEFINER helpers against a temp-schema hijack
-- ---------------------------------------------------------------------------
--
-- Every one of them sets search_path = public, which is most of the job. But
-- when pg_temp is not named in the path, PostgreSQL still searches it first
-- for tables — so an unqualified table reference inside a SECURITY DEFINER
-- function can resolve to a table the caller created, and `authenticated` can
-- create temp tables here.
--
-- No function has an unqualified reference today (checked: all of them
-- schema-qualify). Naming pg_temp last means the next one that forgets is
-- harmless rather than a privilege escalation.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public', 'private')
      AND p.prosecdef
      AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) c
        WHERE c LIKE 'search_path=%pg_temp%'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
                   fn.nspname, fn.proname, fn.args);
  END LOOP;
END;
$$;

-- Trigger functions cannot be called usefully outside a trigger, but there is
-- no reason for the browser to hold EXECUTE on them.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_type t ON t.oid = p.prorettype
    WHERE n.nspname = 'public' AND t.typname = 'trigger'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
                   fn.nspname, fn.proname, fn.args);
  END LOOP;
END;
$$;
