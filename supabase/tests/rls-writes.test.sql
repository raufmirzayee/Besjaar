-- Can each role *write* what it should not?
--
-- The read matrix in rls.test.sql answers "who can see what". This answers the
-- question that actually costs money: who can change what. Every case here is
-- an attempt that must fail, run as the role that would attempt it, against
-- the real policies and grants.
--
--     psql -v ON_ERROR_STOP=1 -d <database> -f supabase/tests/rls-writes.test.sql
--
-- Rolls back at the end.

BEGIN;
SET client_min_messages = notice;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

/**
 * Runs a statement as the current role and reports what happened.
 *
 * 'refused'  the grant or the policy stopped it outright
 * 'no-rows'  it was allowed to run but matched nothing — for an UPDATE or
 *            DELETE under RLS this is the normal shape of a refusal
 * 'applied'  it changed something
 */
CREATE OR REPLACE FUNCTION pg_temp.attempt(p_sql text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE v_rows bigint;
BEGIN
  EXECUTE p_sql;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN CASE WHEN v_rows > 0 THEN 'applied' ELSE 'no-rows' END;
EXCEPTION
  WHEN insufficient_privilege THEN RETURN 'refused';
  WHEN check_violation THEN RETURN 'refused';
  WHEN raise_exception THEN RETURN 'refused';
  WHEN OTHERS THEN RETURN 'refused:' || SQLSTATE;
END;
$$;

/** Asserts an attempt did NOT change anything. */
CREATE OR REPLACE FUNCTION pg_temp.must_not(p_who text, p_what text, p_sql text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_result text;
BEGIN
  v_result := pg_temp.attempt(p_sql);
  IF v_result = 'applied' THEN
    RAISE EXCEPTION 'FAIL %: was able to %', p_who, p_what;
  END IF;
  RAISE NOTICE 'ok   %  %  %', rpad(p_who, 18), rpad(p_what, 44), v_result;
END;
$$;

/** Asserts an attempt DID work — so the tests cannot pass by breaking the shop. */
CREATE OR REPLACE FUNCTION pg_temp.must(p_who text, p_what text, p_sql text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_result text;
BEGIN
  v_result := pg_temp.attempt(p_sql);
  IF v_result <> 'applied' THEN
    RAISE EXCEPTION 'FAIL %: could NOT % (%)', p_who, p_what, v_result;
  END IF;
  RAISE NOTICE 'ok   %  %  allowed', rpad(p_who, 18), rpad(p_what, 44);
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.act_as(p_user uuid, p_aal text DEFAULT 'aal2')
RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated', 'aal', p_aal)::text, true);
  SELECT NULL::void;
$$;

-- ---------------------------------------------------------------------------
-- Cast
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE who (name text PRIMARY KEY, id uuid);
INSERT INTO who VALUES
  ('customer_a',       'a0000000-0000-0000-0000-00000000000a'),
  ('customer_b',       'a0000000-0000-0000-0000-00000000000b'),
  ('super_admin',      'b0000000-0000-0000-0000-000000000001'),
  ('store_manager',    'b0000000-0000-0000-0000-000000000002'),
  ('warehouse',        'b0000000-0000-0000-0000-000000000003'),
  ('customer_service', 'b0000000-0000-0000-0000-000000000004'),
  ('content_editor',   'b0000000-0000-0000-0000-000000000005'),
  ('financial',        'b0000000-0000-0000-0000-000000000006');

INSERT INTO auth.users (id, email)
SELECT id, name || '@test.invalid' FROM who;

INSERT INTO public.profiles (id, email, first_name, last_name)
SELECT id, name || '@test.invalid', 'Test', name FROM who
ON CONFLICT (id) DO NOTHING;

-- Careful with the filter: "customer_service" starts with "customer_", so a
-- NOT LIKE 'customer_%' here silently left the customer service account out of
-- the staff pool and out of user_roles, and every assertion about it passed
-- for the wrong reason.
INSERT INTO public.staff_accounts (user_id, email)
SELECT id, name || '@test.invalid' FROM who WHERE name NOT IN ('customer_a', 'customer_b')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, name::public.app_role FROM who WHERE name NOT IN ('customer_a', 'customer_b')
ON CONFLICT DO NOTHING;

INSERT INTO public.customer_addresses (user_id, first_name, last_name, street, house_number, postal_code, city, country)
SELECT id, 'A', 'Klant', 'Straat', '1', '1000AA', 'Rotterdam', 'NL' FROM who WHERE name IN ('customer_a', 'customer_b');

INSERT INTO public.orders (user_id, order_number, email, first_name, last_name,
  shipping_address, billing_address, subtotal, shipping_cost, vat_amount, total)
SELECT id, 'W-' || upper(right(name, 1)), name || '@test.invalid', 'A', 'B',
       '{}'::jsonb, '{}'::jsonb, 100, 5, 21, 126
FROM who WHERE name IN ('customer_a', 'customer_b');

-- The cast table is read inside statements that run as authenticated/anon.
GRANT SELECT ON who TO authenticated, anon;

INSERT INTO public.product_reviews (product_id, user_id, author_name, rating, title, body, status)
SELECT (SELECT id FROM public.products LIMIT 1),
       (SELECT id FROM who WHERE name='customer_a'), 'Ana', 5, 'Goed', 'Prima product', 'pending';

-- ---------------------------------------------------------------------------
-- A customer must not touch anything that is not theirs
-- ---------------------------------------------------------------------------

SET LOCAL ROLE authenticated;
SELECT pg_temp.act_as((SELECT id FROM who WHERE name='customer_a'), 'aal1');

SELECT pg_temp.must_not('customer_a', 'read another customer''s profile',
  $$UPDATE public.profiles SET first_name='hacked'
    WHERE id = (SELECT id FROM who WHERE name='customer_b')$$);

SELECT pg_temp.must_not('customer_a', 'edit another customer''s address',
  $$UPDATE public.customer_addresses SET city='hacked'
    WHERE user_id = (SELECT id FROM who WHERE name='customer_b')$$);

SELECT pg_temp.must_not('customer_a', 'edit another customer''s order',
  $$UPDATE public.orders SET total=0 WHERE order_number='W-B'$$);

SELECT pg_temp.must_not('customer_a', 'mark their own order paid',
  $$UPDATE public.orders SET payment_status='paid' WHERE order_number='W-A'$$);

SELECT pg_temp.must_not('customer_a', 'move stock',
  $$INSERT INTO public.stock_movements (product_id, quantity_change, reason)
    VALUES ((SELECT id FROM public.products LIMIT 1), 100, 'correctie')$$);

SELECT pg_temp.must_not('customer_a', 'grant themselves a staff role',
  $$INSERT INTO public.user_roles (user_id, role)
    VALUES ((SELECT id FROM who WHERE name='customer_a'), 'super_admin')$$);

SELECT pg_temp.must_not('customer_a', 'join the staff pool',
  $$INSERT INTO public.staff_accounts (user_id, email)
    VALUES ((SELECT id FROM who WHERE name='customer_a'), 'a@test.invalid')$$);

SELECT pg_temp.must_not('customer_a', 'insert an admin notification',
  $$INSERT INTO public.admin_notifications (kind, title, module)
    VALUES ('fake', 'Injected', 'orders')$$);

SELECT pg_temp.must_not('customer_a', 'approve their own review',
  $$UPDATE public.product_reviews SET status='approved'
    WHERE user_id = (SELECT id FROM who WHERE name='customer_a')$$);

SELECT pg_temp.must_not('customer_a', 'edit a product price',
  $$UPDATE public.products SET regular_price = 0.01$$);

SELECT pg_temp.must_not('customer_a', 'write a refund',
  $$INSERT INTO public.refunds (order_id, amount)
    VALUES ((SELECT id FROM public.orders WHERE order_number='W-A'), 126)$$);

-- The privileged RPCs must be out of reach entirely.
SELECT pg_temp.must_not('customer_a', 'call record_stock_movement',
  $$SELECT public.record_stock_movement((SELECT id FROM public.products LIMIT 1), 50, 'correctie')$$);
SELECT pg_temp.must_not('customer_a', 'call reserve_stock_for_order',
  $$SELECT public.reserve_stock_for_order((SELECT id FROM public.orders WHERE order_number='W-A'))$$);
SELECT pg_temp.must_not('customer_a', 'call apply_payment_status',
  $$SELECT public.apply_payment_status((SELECT id FROM public.orders WHERE order_number='W-A'), 'paid')$$);
SELECT pg_temp.must_not('customer_a', 'call record_refund',
  $$SELECT public.record_refund((SELECT id FROM public.orders WHERE order_number='W-A'), 126)$$);
SELECT pg_temp.must_not('customer_a', 'call create_order_with_items',
  $$SELECT public.create_order_with_items('{}'::jsonb, '[]'::jsonb)$$);
SELECT pg_temp.must_not('customer_a', 'call check_rate_limit',
  $$SELECT public.check_rate_limit('forged', 1, 1)$$);
SELECT pg_temp.must_not('customer_a', 'call apply_translations',
  $$SELECT public.apply_translations('product', (SELECT id FROM public.products LIMIT 1), '{}'::jsonb, '{}'::jsonb)$$);

-- What they legitimately can do, so this file cannot pass by breaking the shop.
SELECT pg_temp.must('customer_a', 'edit their own profile',
  $$UPDATE public.profiles SET first_name='Ana'
    WHERE id = (SELECT id FROM who WHERE name='customer_a')$$);
SELECT pg_temp.must('customer_a', 'edit their own address',
  $$UPDATE public.customer_addresses SET city='Delft'
    WHERE user_id = (SELECT id FROM who WHERE name='customer_a')$$);

-- ---------------------------------------------------------------------------
-- A content editor writes copy, and nothing else
-- ---------------------------------------------------------------------------

SELECT pg_temp.act_as((SELECT id FROM who WHERE name='content_editor'));

SELECT pg_temp.must_not('content_editor', 'change an order',
  $$UPDATE public.orders SET status='shipped' WHERE order_number='W-A'$$);
SELECT pg_temp.must_not('content_editor', 'change an order total',
  $$UPDATE public.orders SET total=0.01 WHERE order_number='W-A'$$);
SELECT pg_temp.must_not('content_editor', 'edit a customer profile',
  $$UPDATE public.profiles SET first_name='hacked'
    WHERE id = (SELECT id FROM who WHERE name='customer_a')$$);
SELECT pg_temp.must_not('content_editor', 'edit a customer address',
  $$UPDATE public.customer_addresses SET city='hacked'$$);
SELECT pg_temp.must_not('content_editor', 'move stock',
  $$INSERT INTO public.stock_movements (product_id, quantity_change, reason)
    VALUES ((SELECT id FROM public.products LIMIT 1), 100, 'correctie')$$);
SELECT pg_temp.must_not('content_editor', 'assign a role',
  $$INSERT INTO public.user_roles (user_id, role)
    VALUES ((SELECT id FROM who WHERE name='content_editor'), 'super_admin')$$);
SELECT pg_temp.must_not('content_editor', 'delete a staff account',
  $$DELETE FROM public.staff_accounts
    WHERE user_id = (SELECT id FROM who WHERE name='warehouse')$$);
SELECT pg_temp.must_not('content_editor', 'record a refund',
  $$INSERT INTO public.refunds (order_id, amount)
    VALUES ((SELECT id FROM public.orders WHERE order_number='W-A'), 10)$$);
SELECT pg_temp.must_not('content_editor', 'read the newsletter list',
  $$UPDATE public.newsletter_subscribers SET unsubscribed_at = now()$$);

SELECT pg_temp.must('content_editor', 'edit product copy',
  $$UPDATE public.products SET short_description='Nieuwe tekst'$$);

-- ---------------------------------------------------------------------------
-- Warehouse fulfils orders; it does not price them
-- ---------------------------------------------------------------------------

SELECT pg_temp.act_as((SELECT id FROM who WHERE name='warehouse'));

SELECT pg_temp.must_not('warehouse', 'rewrite an order total',
  $$UPDATE public.orders SET total=0.01 WHERE order_number='W-A'$$);
SELECT pg_temp.must_not('warehouse', 'mark an order paid',
  $$UPDATE public.orders SET payment_status='paid' WHERE order_number='W-A'$$);
SELECT pg_temp.must_not('warehouse', 'change a product price',
  $$UPDATE public.products SET regular_price=0.01$$);
SELECT pg_temp.must_not('warehouse', 'set a refund amount directly',
  $$UPDATE public.returns SET refund_amount=9999$$);
SELECT pg_temp.must_not('warehouse', 'record a refund',
  $$INSERT INTO public.refunds (order_id, amount)
    VALUES ((SELECT id FROM public.orders WHERE order_number='W-A'), 126)$$);
SELECT pg_temp.must_not('warehouse', 'assign a role',
  $$INSERT INTO public.user_roles (user_id, role)
    VALUES ((SELECT id FROM who WHERE name='warehouse'), 'super_admin')$$);
SELECT pg_temp.must_not('warehouse', 'edit a customer address',
  $$UPDATE public.customer_addresses SET city='hacked'$$);
SELECT pg_temp.must_not('warehouse', 'moderate a review',
  $$UPDATE public.product_reviews SET status='approved'$$);

-- ---------------------------------------------------------------------------
-- Customer service supports customers; it does not touch money or stock
-- ---------------------------------------------------------------------------

SELECT pg_temp.act_as((SELECT id FROM who WHERE name='customer_service'));

SELECT pg_temp.must_not('customer_service', 'rewrite an order total',
  $$UPDATE public.orders SET total=0.01 WHERE order_number='W-A'$$);
SELECT pg_temp.must_not('customer_service', 'move stock',
  $$INSERT INTO public.stock_movements (product_id, quantity_change, reason)
    VALUES ((SELECT id FROM public.products LIMIT 1), -5, 'correctie')$$);
SELECT pg_temp.must_not('customer_service', 'record a refund',
  $$INSERT INTO public.refunds (order_id, amount)
    VALUES ((SELECT id FROM public.orders WHERE order_number='W-A'), 126)$$);
SELECT pg_temp.must_not('customer_service', 'assign a role',
  $$INSERT INTO public.user_roles (user_id, role)
    VALUES ((SELECT id FROM who WHERE name='customer_service'), 'store_manager')$$);

SELECT pg_temp.must('customer_service', 'moderate a review',
  $$UPDATE public.product_reviews SET status='approved'$$);

-- ---------------------------------------------------------------------------
-- Financial sees the money; it does not run the warehouse
-- ---------------------------------------------------------------------------

SELECT pg_temp.act_as((SELECT id FROM who WHERE name='financial'));

SELECT pg_temp.must_not('financial', 'move stock',
  $$INSERT INTO public.stock_movements (product_id, quantity_change, reason)
    VALUES ((SELECT id FROM public.products LIMIT 1), -5, 'correctie')$$);
SELECT pg_temp.must_not('financial', 'change a product price',
  $$UPDATE public.products SET regular_price=0.01$$);
SELECT pg_temp.must_not('financial', 'rewrite an order total',
  $$UPDATE public.orders SET total=0.01 WHERE order_number='W-A'$$);
SELECT pg_temp.must_not('financial', 'assign a role',
  $$INSERT INTO public.user_roles (user_id, role)
    VALUES ((SELECT id FROM who WHERE name='financial'), 'super_admin')$$);

-- ---------------------------------------------------------------------------
-- Store manager runs the shop, but roles are not theirs to hand out
-- ---------------------------------------------------------------------------

SELECT pg_temp.act_as((SELECT id FROM who WHERE name='store_manager'));

SELECT pg_temp.must_not('store_manager', 'grant themselves super_admin',
  $$INSERT INTO public.user_roles (user_id, role)
    VALUES ((SELECT id FROM who WHERE name='store_manager'), 'super_admin')$$);
SELECT pg_temp.must_not('store_manager', 'remove the super admin''s role',
  $$DELETE FROM public.user_roles
    WHERE user_id = (SELECT id FROM who WHERE name='super_admin') AND role='super_admin'$$);
SELECT pg_temp.must_not('store_manager', 'rewrite an order total',
  $$UPDATE public.orders SET total=0.01 WHERE order_number='W-A'$$);

SELECT pg_temp.must('store_manager', 'edit a product',
  $$UPDATE public.products SET featured=true$$);

-- ---------------------------------------------------------------------------
-- The super admin is not a way around the server either
-- ---------------------------------------------------------------------------
--
-- Highest privilege in the shop, and still cannot touch an order, move stock
-- or hand out a role directly from a browser session. Those all go through
-- server functions that check a permission and write an audit entry; the
-- database does not offer a second, unaudited route to them.

SELECT pg_temp.act_as((SELECT id FROM who WHERE name='super_admin'));

SELECT pg_temp.must_not('super_admin', 'rewrite an order from the browser',
  $$UPDATE public.orders SET total=0.01 WHERE order_number='W-A'$$);
SELECT pg_temp.must_not('super_admin', 'call a service-role RPC',
  $$SELECT public.record_stock_movement((SELECT id FROM public.products LIMIT 1), 5, 'correctie')$$);
SELECT pg_temp.must_not('super_admin', 'assign a role from the browser',
  $$INSERT INTO public.user_roles (user_id, role)
    VALUES ((SELECT id FROM who WHERE name='content_editor'), 'financial')$$);
SELECT pg_temp.must_not('super_admin', 'revoke a role from the browser',
  $$DELETE FROM public.user_roles
    WHERE user_id = (SELECT id FROM who WHERE name='warehouse')$$);

-- The positive control: catalogue work is browser-reachable for the roles that
-- hold it, so these assertions cannot be passing because writes are broken.
SELECT pg_temp.must('super_admin', 'edit a product',
  $$UPDATE public.products SET bestseller=true$$);

-- ---------------------------------------------------------------------------
-- Nothing works on a password-only session
-- ---------------------------------------------------------------------------

SELECT pg_temp.act_as((SELECT id FROM who WHERE name='super_admin'), 'aal1');

SELECT pg_temp.must_not('super_admin@aal1', 'edit a product',
  $$UPDATE public.products SET featured=false$$);
SELECT pg_temp.must_not('super_admin@aal1', 'assign a role',
  $$INSERT INTO public.user_roles (user_id, role)
    VALUES ((SELECT id FROM who WHERE name='warehouse'), 'super_admin')$$);

-- ---------------------------------------------------------------------------
-- Anonymous
-- ---------------------------------------------------------------------------

RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '', true);

SELECT pg_temp.must_not('anon', 'create an order',
  $$INSERT INTO public.orders (order_number, email, first_name, last_name,
      shipping_address, billing_address, subtotal, shipping_cost, vat_amount, total)
    VALUES ('W-X','x@test.invalid','X','Y','{}'::jsonb,'{}'::jsonb,1,0,0,1)$$);
SELECT pg_temp.must_not('anon', 'edit a product',
  $$UPDATE public.products SET regular_price=0.01$$);
SELECT pg_temp.must_not('anon', 'move stock',
  $$INSERT INTO public.stock_movements (product_id, quantity_change, reason)
    VALUES ((SELECT id FROM public.products LIMIT 1), 100, 'correctie')$$);
SELECT pg_temp.must_not('anon', 'read a profile',
  $$UPDATE public.profiles SET first_name='x'$$);

RESET ROLE;

\echo ''
\echo '================================================='
\echo ' write suite: every attempt behaved as required'
\echo '================================================='

ROLLBACK;
