-- What the database refuses to store.
--
-- Every rule here is also checked in application code, where it produces a
-- readable Dutch message. This suite is about the other copy: the one that
-- still holds when a server function has a bug, when an import writes straight
-- to a table, or when someone reaches the database by a route nobody planned
-- for. If a rule only exists in TypeScript it is a suggestion.
--
--     psql -v ON_ERROR_STOP=1 -d besjaar_test -f supabase/tests/constraints.test.sql

BEGIN;

SET client_min_messages TO notice;

-- Runs a statement in a savepoint and reports what the database did with it.
-- The savepoint matters: a failed statement aborts the transaction otherwise,
-- and every later assertion would report the same rollback rather than its own
-- result.
CREATE OR REPLACE FUNCTION pg_temp.attempt(p_sql text) RETURNS text
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN others THEN
    RETURN 'refused';
  END;
  RETURN 'allowed';
END; $$;

/** Asserts the database refuses a statement, and says which rule caught it. */
CREATE OR REPLACE FUNCTION pg_temp.must_refuse(p_what text, p_sql text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE v_result text;
BEGIN
  v_result := pg_temp.attempt(p_sql);
  IF v_result <> 'refused' THEN
    RAISE EXCEPTION 'FAIL: % was stored, and must not be', p_what;
  END IF;
  RAISE NOTICE 'ok   refused  %', p_what;
END; $$;

/**
 * Asserts the database accepts a statement.
 *
 * Every refusal above needs one of these beside it. A fixture that is broken in
 * some unrelated way refuses everything, and a suite of refusals alone would
 * read as a clean pass.
 */
CREATE OR REPLACE FUNCTION pg_temp.must_allow(p_what text, p_sql text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE v_result text;
BEGIN
  v_result := pg_temp.attempt(p_sql);
  IF v_result <> 'allowed' THEN
    RAISE EXCEPTION 'FAIL: % was refused, and must not be', p_what;
  END IF;
  RAISE NOTICE 'ok   allowed  %', p_what;
END; $$;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------

INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'koper@test.invalid')
ON CONFLICT DO NOTHING;

INSERT INTO public.products (id, name, slug, regular_price, stock_quantity, status)
VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 'Testlamp', 'testlamp-constraints', 19.95, 10, 'active');

INSERT INTO public.orders (id, email, first_name, last_name, subtotal, vat_amount, total)
VALUES ('cccccccc-0000-0000-0000-000000000001', 'koper@test.invalid', 'K', 'Oper', 19.95, 4.19, 24.14);

-- ---------------------------------------------------------------------------
-- 1. Money
-- ---------------------------------------------------------------------------

\echo ''
\echo '--- money on an order'

SELECT pg_temp.must_refuse('a negative order total',
  $$UPDATE public.orders SET total = -1 WHERE id = 'cccccccc-0000-0000-0000-000000000001'$$);

SELECT pg_temp.must_refuse('a total with a fraction of a cent',
  -- Not pedantry: a sub-cent total cannot be charged, so it is a total that
  -- does not match what the customer pays.
  $$UPDATE public.orders SET total = 24.1449 WHERE id = 'cccccccc-0000-0000-0000-000000000001'$$);

SELECT pg_temp.must_refuse('a negative shipping cost',
  $$UPDATE public.orders SET shipping_cost = -4.95 WHERE id = 'cccccccc-0000-0000-0000-000000000001'$$);

SELECT pg_temp.must_refuse('a currency that is not a code',
  $$UPDATE public.orders SET currency = 'euro' WHERE id = 'cccccccc-0000-0000-0000-000000000001'$$);

SELECT pg_temp.must_allow('a real total',
  $$UPDATE public.orders SET total = 29.09, shipping_cost = 4.95
      WHERE id = 'cccccccc-0000-0000-0000-000000000001'$$);

-- ---------------------------------------------------------------------------
-- 2. Order lines
-- ---------------------------------------------------------------------------

\echo ''
\echo '--- order lines'

SELECT pg_temp.must_refuse('a line of nought items',
  $$INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, vat_rate, quantity, line_total)
    VALUES ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Testlamp', 19.95, 21, 0, 0)$$);

SELECT pg_temp.must_refuse('a line of minus two items',
  $$INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, vat_rate, quantity, line_total)
    VALUES ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Testlamp', 19.95, 21, -2, -39.90)$$);

SELECT pg_temp.must_refuse('a negative unit price',
  $$INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, vat_rate, quantity, line_total)
    VALUES ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Testlamp', -19.95, 21, 1, -19.95)$$);

SELECT pg_temp.must_refuse('a VAT rate of 900 percent',
  $$INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, vat_rate, quantity, line_total)
    VALUES ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Testlamp', 19.95, 900, 1, 19.95)$$);

SELECT pg_temp.must_refuse('a line that names no product',
  -- product_name is a snapshot, not an identity: a charge for something with
  -- neither a product nor a variant behind it cannot be returned or refunded.
  $$INSERT INTO public.order_items (order_id, product_name, unit_price, vat_rate, quantity, line_total)
    VALUES ('cccccccc-0000-0000-0000-000000000001', 'Spookartikel', 19.95, 21, 1, 19.95)$$);

SELECT pg_temp.must_allow('a real line',
  $$INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, vat_rate, quantity, line_total)
    VALUES ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Testlamp', 19.95, 21, 1, 19.95)$$);

-- ---------------------------------------------------------------------------
-- 3. The stock ledger
-- ---------------------------------------------------------------------------

\echo ''
\echo '--- the stock ledger'

SELECT pg_temp.must_refuse('a movement of nought',
  $$INSERT INTO public.stock_movements (product_id, quantity_change, reason)
    VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 0, 'correctie')$$);

SELECT pg_temp.must_refuse('a movement of nothing in particular',
  $$INSERT INTO public.stock_movements (quantity_change, reason) VALUES (1, 'correctie')$$);

SELECT pg_temp.must_allow('a real movement',
  $$INSERT INTO public.stock_movements (product_id, quantity_change, reason)
    VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 5, 'correctie')$$);

-- ---------------------------------------------------------------------------
-- 4. A financial record is not deleted
-- ---------------------------------------------------------------------------

\echo ''
\echo '--- deleting a financial record'

SELECT pg_temp.must_refuse('deleting an order line',
  $$DELETE FROM public.order_items WHERE order_id = 'cccccccc-0000-0000-0000-000000000001'$$);

SELECT pg_temp.must_refuse('deleting a ledger row',
  $$DELETE FROM public.stock_movements WHERE product_id = 'bbbbbbbb-0000-0000-0000-000000000001'$$);

SELECT pg_temp.must_refuse('deleting an order',
  -- Dutch bookkeeping rules want the invoice behind a sale retrievable for
  -- seven years, and deleting the order takes its lines and its history too.
  $$DELETE FROM public.orders WHERE id = 'cccccccc-0000-0000-0000-000000000001'$$);

SELECT pg_temp.must_allow('cancelling an order instead',
  $$UPDATE public.orders SET status = 'cancelled', cancelled_at = now()
      WHERE id = 'cccccccc-0000-0000-0000-000000000001'$$);

-- ---------------------------------------------------------------------------
-- 5. One review per customer per product
-- ---------------------------------------------------------------------------

\echo ''
\echo '--- reviews'

SELECT pg_temp.must_allow('a first review',
  $$INSERT INTO public.product_reviews (product_id, user_id, author_name, rating, body)
    VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
            'Koper', 5, 'Prima lamp, doet wat hij moet doen.')$$);

SELECT pg_temp.must_refuse('a second review of the same product',
  -- insertReview checks for one first, but a check and an insert are two
  -- statements: two submissions at once both read "none". This is the rule
  -- that actually makes it one.
  $$INSERT INTO public.product_reviews (product_id, user_id, author_name, rating, body)
    VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
            'Koper', 1, 'Toch maar niet.')$$);

SELECT pg_temp.must_refuse('a rating of seven stars',
  $$INSERT INTO public.product_reviews (product_id, author_name, rating, body)
    VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 'Anon', 7, 'Zeven sterren graag.')$$);

-- ---------------------------------------------------------------------------
-- 6. A payment reference belongs to one order
-- ---------------------------------------------------------------------------

\echo ''
\echo '--- payment references'

INSERT INTO public.orders (id, email, first_name, last_name)
VALUES ('cccccccc-0000-0000-0000-000000000002', 'ander@test.invalid', 'A', 'Nder');

SELECT pg_temp.must_allow('an order claiming a payment reference',
  $$UPDATE public.orders SET payment_reference = 'tr_constraints_1'
      WHERE id = 'cccccccc-0000-0000-0000-000000000001'$$);

SELECT pg_temp.must_refuse('a second order claiming the same reference',
  -- The webhook finds the order to mark paid by this column. Two matches and
  -- "which order did this pay for" has two answers.
  $$UPDATE public.orders SET payment_reference = 'tr_constraints_1'
      WHERE id = 'cccccccc-0000-0000-0000-000000000002'$$);

-- ---------------------------------------------------------------------------
-- 7. An order that came back says so
-- ---------------------------------------------------------------------------
--
-- The status is derived from the quantities actually received, never typed in,
-- so it stays true after a second return on the same order.

\echo ''
\echo '--- returned orders'

DO $$
DECLARE
  v_order uuid := 'dddddddd-0000-0000-0000-000000000009';
  v_item  uuid := 'dddddddd-0000-0000-0000-00000000000a';
  v_ret   uuid := 'dddddddd-0000-0000-0000-00000000000b';
  v_status public.order_status;
BEGIN
  INSERT INTO public.orders (id, email, first_name, last_name, subtotal, total, status)
  VALUES (v_order, 'retour@test.invalid', 'R', 'Etour', 30, 30, 'delivered');
  INSERT INTO public.order_items (id, order_id, product_id, product_name, unit_price, vat_rate, quantity, line_total)
  VALUES (v_item, v_order, 'bbbbbbbb-0000-0000-0000-000000000001', 'Testlamp', 10, 21, 3, 30);
  INSERT INTO public.returns (id, order_id, user_id, email, return_number, status, reason)
  VALUES (v_ret, v_order, 'aaaaaaaa-0000-0000-0000-000000000001', 'retour@test.invalid',
          'RET-TEST-1', 'requested', 'Niet tevreden / bedenktijd');
  INSERT INTO public.return_items (return_id, order_item_id, product_id, product_name, quantity)
  VALUES (v_ret, v_item, 'bbbbbbbb-0000-0000-0000-000000000001', 'Testlamp', 1);

  -- A requested return is an intention, not goods on a shelf.
  v_status := public.refresh_order_return_status(v_order);
  IF v_status <> 'delivered' THEN
    RAISE EXCEPTION 'FAIL: a merely requested return moved the order to %', v_status;
  END IF;
  RAISE NOTICE 'ok   a requested return leaves the order as delivered';

  UPDATE public.returns SET status = 'received' WHERE id = v_ret;
  v_status := public.refresh_order_return_status(v_order);
  IF v_status <> 'partially_returned' THEN
    RAISE EXCEPTION 'FAIL: one of three back should be partially_returned, got %', v_status;
  END IF;
  RAISE NOTICE 'ok   one of three back reads partially_returned';

  -- Idempotent: the same booking counted twice must not change anything.
  v_status := public.refresh_order_return_status(v_order);
  IF v_status <> 'partially_returned' THEN
    RAISE EXCEPTION 'FAIL: re-running changed the status to %', v_status;
  END IF;
  RAISE NOTICE 'ok   re-running it changes nothing';

  UPDATE public.return_items SET quantity = 3 WHERE return_id = v_ret;
  v_status := public.refresh_order_return_status(v_order);
  IF v_status <> 'returned' THEN
    RAISE EXCEPTION 'FAIL: everything back should be returned, got %', v_status;
  END IF;
  RAISE NOTICE 'ok   everything back reads returned';

  -- A cancelled order has no fulfilment left to describe.
  UPDATE public.orders SET status = 'cancelled' WHERE id = v_order;
  v_status := public.refresh_order_return_status(v_order);
  IF v_status <> 'cancelled' THEN
    RAISE EXCEPTION 'FAIL: a cancelled order was overwritten with %', v_status;
  END IF;
  RAISE NOTICE 'ok   a cancelled order is left alone';
END $$;

-- ---------------------------------------------------------------------------
-- 8. Every foreign key is indexed
-- ---------------------------------------------------------------------------

\echo ''
\echo '--- foreign key indexes'

DO $$
DECLARE
  v_missing text;
BEGIN
  SELECT string_agg(format('%s.%s', child, col), ', ' ORDER BY child, col) INTO v_missing
  FROM (
    SELECT c.conrelid::regclass::text AS child, a.attname AS col
    FROM pg_constraint c
    JOIN LATERAL unnest(c.conkey) k(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.contype = 'f'
      AND c.connamespace = 'public'::regnamespace
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = c.conrelid AND i.indkey[0] = k.attnum
      )
  ) gaps;

  IF v_missing IS NOT NULL THEN
    -- Unindexed, a foreign key makes every delete or key change on the parent
    -- scan the whole child table while holding a lock on it.
    RAISE EXCEPTION 'FAIL: foreign keys with no index: %', v_missing;
  END IF;
  RAISE NOTICE 'ok   every foreign key is indexed';
END $$;

ROLLBACK;
