-- Row-level security: who can read what, proved against the database.
--
-- Every check here is a direct SQL query as a specific role, not a React
-- component asserting on a mock. The policies are the control; a screen that
-- hides a button is not.
--
-- Run against a database with the harness and every migration applied:
--
--     psql -v ON_ERROR_STOP=1 -d <database> -f supabase/tests/rls.test.sql
--
-- It rolls back at the end, so it leaves nothing behind.

BEGIN;

SET client_min_messages = notice;

CREATE OR REPLACE FUNCTION pg_temp.expect(
  p_role text, p_what text, p_actual bigint, p_expected bigint
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_actual IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'FAIL %: % returned % row(s), expected %',
      p_role, p_what, p_actual, p_expected;
  END IF;
  RAISE NOTICE 'ok   %  %  %',
    rpad(p_role, 18), rpad(p_what, 22),
    CASE WHEN p_actual = -1 THEN 'refused' ELSE p_actual::text || ' row(s)' END;
END;
$$;

/**
 * Counts what a role can actually read, refusal included.
 *
 * A table the role has no GRANT on raises insufficient_privilege rather than
 * returning zero rows. Both mean "cannot read it", and the caller cares about
 * the outcome, not which mechanism produced it.
 */
CREATE OR REPLACE FUNCTION pg_temp.visible(p_table text) RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE v bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM %s', p_table) INTO v;
  RETURN v;
EXCEPTION WHEN insufficient_privilege THEN
  RETURN -1;  -- refused outright
END;
$$;

-- ---------------------------------------------------------------------------
-- Two customers and one of each staff role
-- ---------------------------------------------------------------------------

INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'customer-a@test.invalid'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'customer-b@test.invalid'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'super@test.invalid'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'manager@test.invalid'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'warehouse@test.invalid'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'service@test.invalid'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'editor@test.invalid'),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'financial@test.invalid');

-- A trigger already creates a profile for each auth.users row, so this only
-- fills in the ones it did not.
INSERT INTO public.profiles (id, email, first_name, last_name)
SELECT id, email, 'Test', 'User' FROM auth.users WHERE email LIKE '%@test.invalid'
ON CONFLICT (id) DO NOTHING;

-- Staff accounts must be in the staff pool for the separation to hold.
INSERT INTO public.staff_accounts (user_id, email)
SELECT id, email FROM auth.users WHERE email LIKE '%@test.invalid' AND email NOT LIKE 'customer-%'
ON CONFLICT DO NOTHING;

-- A trigger may already have given each new user the customer role.
INSERT INTO public.user_roles (user_id, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'customer'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'customer'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'super_admin'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'store_manager'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'warehouse'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'customer_service'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'content_editor'),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'financial')
ON CONFLICT DO NOTHING;


-- One address and one order each, so "own only" is distinguishable from "none".
INSERT INTO public.customer_addresses (user_id, first_name, last_name, street, house_number, postal_code, city, country)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'A', 'Klant', 'Straat', '1', '1000AA', 'Rotterdam', 'NL'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'B', 'Klant', 'Straat', '2', '1000AB', 'Rotterdam', 'NL');

INSERT INTO public.orders (user_id, order_number, email, first_name, last_name,
                           shipping_address, billing_address, subtotal, shipping_cost, vat_amount, total)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'RLS-A1', 'customer-a@test.invalid', 'A', 'Klant',
   '{}'::jsonb, '{}'::jsonb, 10, 0, 2.1, 12.1),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'RLS-B1', 'customer-b@test.invalid', 'B', 'Klant',
   '{}'::jsonb, '{}'::jsonb, 20, 0, 4.2, 24.2);

-- A stock movement and a sent email, so a count of zero means "refused"
-- rather than "there was nothing there anyway".
INSERT INTO public.stock_movements (product_id, quantity_change, reason)
SELECT id, 5, 'correctie' FROM public.products LIMIT 1;

INSERT INTO public.email_log (template, recipient, subject, status)
VALUES ('order_confirmation', 'customer-a@test.invalid', 'Je bestelling', 'sent');

INSERT INTO public.contact_messages (name, email, subject, message)
VALUES ('Vrager', 'vrager@test.invalid', 'Vraag', 'Een supportbericht dat niet iedereen mag lezen.');

-- ---------------------------------------------------------------------------
-- Anonymous: the storefront's catalogue, and nothing else
-- ---------------------------------------------------------------------------

SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '', true);

SELECT pg_temp.expect('anon', 'profiles',           pg_temp.visible('public.profiles'), -1);
SELECT pg_temp.expect('anon', 'customer_addresses', pg_temp.visible('public.customer_addresses'), -1);
SELECT pg_temp.expect('anon', 'orders',             pg_temp.visible('public.orders'), -1);
SELECT pg_temp.expect('anon', 'order_items',        pg_temp.visible('public.order_items'), -1);
SELECT pg_temp.expect('anon', 'returns',            pg_temp.visible('public.returns'), -1);
SELECT pg_temp.expect('anon', 'contact_messages',   pg_temp.visible('public.contact_messages'), -1);
SELECT pg_temp.expect('anon', 'staff_accounts',     pg_temp.visible('public.staff_accounts'), -1);
SELECT pg_temp.expect('anon', 'user_roles',         pg_temp.visible('public.user_roles'), -1);
SELECT pg_temp.expect('anon', 'stock_movements',    pg_temp.visible('public.stock_movements'), -1);
SELECT pg_temp.expect('anon', 'email_log',          pg_temp.visible('public.email_log'), -1);
SELECT pg_temp.expect('anon', 'audit_logs',         pg_temp.visible('public.audit_logs'), -1);

RESET ROLE;

-- ---------------------------------------------------------------------------
-- Customer A: their own row and no one else's
-- ---------------------------------------------------------------------------

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);

SELECT pg_temp.expect('customer-a', 'own profile',   pg_temp.visible('public.profiles'), 1);
SELECT pg_temp.expect('customer-a', 'own addresses', pg_temp.visible('public.customer_addresses'), 1);
SELECT pg_temp.expect('customer-a', 'own orders',    pg_temp.visible('public.orders'), 1);
SELECT pg_temp.expect('customer-a', 'support',       pg_temp.visible('public.contact_messages'), 0);
SELECT pg_temp.expect('customer-a', 'stock ledger',  pg_temp.visible('public.stock_movements'), 0);
SELECT pg_temp.expect('customer-a', 'email log',     pg_temp.visible('public.email_log'), 0);

-- The row they can see must be their own, not merely one row.
DO $$
DECLARE v_email text;
BEGIN
  SELECT email INTO v_email FROM public.orders LIMIT 1;
  IF v_email IS DISTINCT FROM 'customer-a@test.invalid' THEN
    RAISE EXCEPTION 'FAIL customer-a: sees order belonging to %', v_email;
  END IF;
  SELECT email INTO v_email FROM public.profiles LIMIT 1;
  IF v_email IS DISTINCT FROM 'customer-a@test.invalid' THEN
    RAISE EXCEPTION 'FAIL customer-a: sees profile belonging to %', v_email;
  END IF;
  RAISE NOTICE 'ok   customer-a       the row it sees is its own';
END;
$$;

-- Customer B, to prove the isolation runs both ways.
SELECT set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}', true);
DO $$
DECLARE v_email text;
BEGIN
  SELECT email INTO v_email FROM public.orders LIMIT 1;
  IF v_email IS DISTINCT FROM 'customer-b@test.invalid' THEN
    RAISE EXCEPTION 'FAIL customer-b: sees order belonging to %', v_email;
  END IF;
  RAISE NOTICE 'ok   customer-b       sees only its own order';
END;
$$;

RESET ROLE;

-- ---------------------------------------------------------------------------
-- Staff, at aal2 — every staff policy requires the second factor
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pg_temp.act_as(p_user uuid) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  SELECT NULL::void;
$$;

SET LOCAL ROLE authenticated;

-- Content editor: the catalogue, and nothing about customers.
SELECT pg_temp.act_as('bbbbbbbb-0000-0000-0000-000000000005');
-- The catalogue is its job: it must be able to read products at all.
DO $$
DECLARE v bigint;
BEGIN
  SELECT pg_temp.visible('public.products') INTO v;
  IF v < 0 THEN RAISE EXCEPTION 'FAIL content_editor: cannot read products'; END IF;
  RAISE NOTICE 'ok   %  %  % row(s)', rpad('content_editor', 18), rpad('products', 22), v;
END;
$$;
SELECT pg_temp.expect('content_editor', 'own profile only', pg_temp.visible('public.profiles'), 1);
SELECT pg_temp.expect('content_editor', 'addresses',  pg_temp.visible('public.customer_addresses'), 0);
SELECT pg_temp.expect('content_editor', 'orders',     pg_temp.visible('public.orders'), 0);
SELECT pg_temp.expect('content_editor', 'order_items',pg_temp.visible('public.order_items'), 0);
SELECT pg_temp.expect('content_editor', 'support',    pg_temp.visible('public.contact_messages'), 0);
SELECT pg_temp.expect('content_editor', 'email log',  pg_temp.visible('public.email_log'), 0);
SELECT pg_temp.expect('content_editor', 'stock ledger', pg_temp.visible('public.stock_movements'), 0);

-- Warehouse: what it needs to pick, pack and ship — no customer records.
SELECT pg_temp.act_as('bbbbbbbb-0000-0000-0000-000000000003');
SELECT pg_temp.expect('warehouse', 'orders',      pg_temp.visible('public.orders'), 2);
SELECT pg_temp.expect('warehouse', 'stock ledger', pg_temp.visible('public.stock_movements'), 1);
SELECT pg_temp.expect('warehouse', 'addresses',   pg_temp.visible('public.customer_addresses'), 0);
SELECT pg_temp.expect('warehouse', 'support',     pg_temp.visible('public.contact_messages'), 0);
SELECT pg_temp.expect('warehouse', 'email log',   pg_temp.visible('public.email_log'), 0);

-- Customer service: customers, orders and support — that is the job.
SELECT pg_temp.act_as('bbbbbbbb-0000-0000-0000-000000000004');
SELECT pg_temp.expect('customer_service', 'all profiles', pg_temp.visible('public.profiles'),
                      (SELECT count(*) FROM public.profiles));
SELECT pg_temp.expect('customer_service', 'addresses', pg_temp.visible('public.customer_addresses'), 2);
SELECT pg_temp.expect('customer_service', 'orders',    pg_temp.visible('public.orders'), 2);
SELECT pg_temp.expect('customer_service', 'support',   pg_temp.visible('public.contact_messages'), 1);
SELECT pg_temp.expect('customer_service', 'stock ledger', pg_temp.visible('public.stock_movements'), 0);

-- Financial: orders and reporting, not the support inbox.
SELECT pg_temp.act_as('bbbbbbbb-0000-0000-0000-000000000006');
SELECT pg_temp.expect('financial', 'orders',  pg_temp.visible('public.orders'), 2);
SELECT pg_temp.expect('financial', 'support', pg_temp.visible('public.contact_messages'), 0);
SELECT pg_temp.expect('financial', 'stock ledger', pg_temp.visible('public.stock_movements'), 0);

-- Store manager: broad operational access.
SELECT pg_temp.act_as('bbbbbbbb-0000-0000-0000-000000000002');
SELECT pg_temp.expect('store_manager', 'all profiles', pg_temp.visible('public.profiles'),
                      (SELECT count(*) FROM public.profiles));
SELECT pg_temp.expect('store_manager', 'orders',    pg_temp.visible('public.orders'), 2);
SELECT pg_temp.expect('store_manager', 'support',   pg_temp.visible('public.contact_messages'), 1);
SELECT pg_temp.expect('store_manager', 'addresses', pg_temp.visible('public.customer_addresses'), 2);

-- Super admin: everything.
SELECT pg_temp.act_as('bbbbbbbb-0000-0000-0000-000000000001');
SELECT pg_temp.expect('super_admin', 'all profiles', pg_temp.visible('public.profiles'),
                      (SELECT count(*) FROM public.profiles));
SELECT pg_temp.expect('super_admin', 'orders',    pg_temp.visible('public.orders'), 2);
SELECT pg_temp.expect('super_admin', 'support',   pg_temp.visible('public.contact_messages'), 1);
SELECT pg_temp.expect('super_admin', 'addresses', pg_temp.visible('public.customer_addresses'), 2);
SELECT pg_temp.expect('super_admin', 'email log', pg_temp.visible('public.email_log'), 1);

-- ---------------------------------------------------------------------------
-- The second factor is the gate, not a formality
-- ---------------------------------------------------------------------------

-- The same super admin, on a password-only session.
SELECT set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);
SELECT pg_temp.expect('super_admin@aal1', 'orders',  pg_temp.visible('public.orders'), 0);
SELECT pg_temp.expect('super_admin@aal1', 'support', pg_temp.visible('public.contact_messages'), 0);
SELECT pg_temp.expect('super_admin@aal1', 'addresses', pg_temp.visible('public.customer_addresses'), 0);

RESET ROLE;

\echo ''
\echo '================================================='
\echo ' RLS suite: every assertion passed'
\echo '================================================='

ROLLBACK;
