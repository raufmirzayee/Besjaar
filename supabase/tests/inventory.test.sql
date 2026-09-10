-- Inventory regression suite.
--
-- Every scenario here is one that produced a wrong number before the ledger
-- work, with the wrong number written next to the right one. Run it against a
-- database with every migration applied:
--
--     psql -v ON_ERROR_STOP=1 -d <database> -f supabase/tests/inventory.test.sql
--
-- It fails loudly on the first wrong answer and rolls everything back, so it
-- is safe to run against a copy of production data.
--
-- These live in SQL rather than Vitest because that is where the behaviour
-- lives: row locking, triggers, unique indexes and transaction isolation are
-- the things under test, and a mocked client would prove nothing about any of
-- them.

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_eq(
  p_what text, p_actual anyelement, p_expected anyelement, p_wrong_answer text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_actual IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'FAIL %: got %, expected %',
      p_what,
      p_actual,
      p_expected::text
        || CASE WHEN p_wrong_answer IS NOT NULL
             THEN ' (the old bug gave ' || p_wrong_answer || ')' ELSE '' END;
  END IF;
  RAISE NOTICE 'ok  %  = %', p_what, p_actual;
END;
$$;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE ids (name text PRIMARY KEY, id uuid);

INSERT INTO public.products (name, slug, status, regular_price, stock_quantity)
VALUES ('Testlamp A', 'test-lamp-a', 'active', 10, 0) RETURNING id
\gset prod_a_
INSERT INTO ids VALUES ('a', :'prod_a_id');

INSERT INTO public.products (name, slug, status, regular_price, stock_quantity)
VALUES ('Testlamp B', 'test-lamp-b', 'active', 20, 0) RETURNING id
\gset prod_b_
INSERT INTO ids VALUES ('b', :'prod_b_id');

-- Opening stock through the ledger, as a real product creation does.
SELECT public.record_stock_movement(:'prod_a_id', 10, 'beginvoorraad', 'product', :'prod_a_id');
SELECT public.record_stock_movement(:'prod_b_id', 10, 'beginvoorraad', 'product', :'prod_b_id');

-- ---------------------------------------------------------------------------
-- 1. A manual correction moves stock once, not twice
-- ---------------------------------------------------------------------------

SELECT public.record_stock_movement(:'prod_a_id', 5, 'correctie');
SELECT pg_temp.assert_eq('10 + 5', stock_quantity, 15, '20') FROM public.products WHERE id = :'prod_a_id';

SELECT public.record_stock_movement(:'prod_a_id', -3, 'correctie');
SELECT pg_temp.assert_eq('15 - 3', stock_quantity, 12, '9') FROM public.products WHERE id = :'prod_a_id';

-- Back to 10 for the scenarios below.
SELECT public.set_stock_level(:'prod_a_id', 10);
SELECT pg_temp.assert_eq('set to 10', stock_quantity, 10) FROM public.products WHERE id = :'prod_a_id';

-- ---------------------------------------------------------------------------
-- 2. The column is ledger-owned: a direct write is refused
-- ---------------------------------------------------------------------------

DO $$
DECLARE v_before integer; v_after integer; v_raised boolean := false;
BEGIN
  SELECT stock_quantity INTO v_before FROM public.products WHERE slug = 'test-lamp-a';
  BEGIN
    UPDATE public.products SET stock_quantity = 999 WHERE slug = 'test-lamp-a';
  EXCEPTION WHEN check_violation THEN
    v_raised := true;
  END;
  SELECT stock_quantity INTO v_after FROM public.products WHERE slug = 'test-lamp-a';
  IF NOT v_raised THEN RAISE EXCEPTION 'FAIL: a direct stock_quantity UPDATE was allowed'; END IF;
  IF v_after IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'FAIL: refused write still changed stock (% -> %)', v_before, v_after;
  END IF;
  RAISE NOTICE 'ok  direct UPDATE refused, stock unchanged at %', v_after;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. A return restocks once, however many times it is booked in
-- ---------------------------------------------------------------------------

SELECT public.record_stock_movement(
  :'prod_a_id', 2, 'return_restocked', 'return', '00000000-0000-0000-0000-0000000000a1'::uuid
);
SELECT pg_temp.assert_eq('10 + returned 2', stock_quantity, 12, '14')
FROM public.products WHERE id = :'prod_a_id';

-- The same return booked in again: a double-clicked button, or a status set
-- back and forth. It must not restock a second time.
SELECT public.record_stock_movement(
  :'prod_a_id', 2, 'return_restocked', 'return', '00000000-0000-0000-0000-0000000000a1'::uuid
);
SELECT pg_temp.assert_eq('same return booked twice', stock_quantity, 12, '14')
FROM public.products WHERE id = :'prod_a_id';

SELECT public.set_stock_level(:'prod_a_id', 10);

-- ---------------------------------------------------------------------------
-- 4. A marketplace sale takes stock once
-- ---------------------------------------------------------------------------

SELECT public.record_stock_movement(
  :'prod_a_id', -2, 'bol_order', 'bol_order', '00000000-0000-0000-0000-0000000000b1'::uuid
);
SELECT pg_temp.assert_eq('10 - bol sold 2', stock_quantity, 8, '6')
FROM public.products WHERE id = :'prod_a_id';

-- bol.com re-sends orders. The same one must not sell the goods twice.
SELECT public.record_stock_movement(
  :'prod_a_id', -2, 'bol_order', 'bol_order', '00000000-0000-0000-0000-0000000000b1'::uuid
);
SELECT pg_temp.assert_eq('same bol order replayed', stock_quantity, 8, '6')
FROM public.products WHERE id = :'prod_a_id';

SELECT public.set_stock_level(:'prod_a_id', 10);

-- ---------------------------------------------------------------------------
-- 5. A CSV import sets an absolute figure, it does not add one
-- ---------------------------------------------------------------------------

SELECT public.set_stock_level(:'prod_a_id', 20, 'correctie', 'csv_import');
SELECT pg_temp.assert_eq('import 20 onto 10', stock_quantity, 20, '30')
FROM public.products WHERE id = :'prod_a_id';

-- Re-running the same import file changes nothing.
SELECT public.set_stock_level(:'prod_a_id', 20, 'correctie', 'csv_import');
SELECT pg_temp.assert_eq('same import re-run', stock_quantity, 20, '40')
FROM public.products WHERE id = :'prod_a_id';

-- ---------------------------------------------------------------------------
-- 6. Checkout reserves what is on the shelf
-- ---------------------------------------------------------------------------

SELECT public.set_stock_level(:'prod_a_id', 5);

SELECT order_id FROM public.create_order_with_items(
  jsonb_build_object(
    'email','koper@voorbeeld.nl','first_name','Koper','last_name','Test',
    'shipping_address','{}'::jsonb,'billing_address','{}'::jsonb,
    'subtotal',30,'shipping_cost',0,'vat_amount',6.3,'total',36.3,
    'status','pending','payment_status','open'),
  jsonb_build_array(jsonb_build_object(
    'product_id', :'prod_a_id', 'product_name','Testlamp A', 'quantity', 3,
    'unit_price', 10, 'line_total', 30))
) \gset order1_

SELECT pg_temp.assert_eq('stock 5, bought 3', stock_quantity, 2)
FROM public.products WHERE id = :'prod_a_id';

-- ---------------------------------------------------------------------------
-- 7. Checkout refuses to sell what is not there
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_product uuid := (SELECT id FROM ids WHERE name = 'a');
  v_stock_before integer;
  v_stock_after integer;
  v_orders_before bigint;
  v_orders_after bigint;
  v_refused boolean := false;
BEGIN
  SELECT stock_quantity INTO v_stock_before FROM public.products WHERE id = v_product;
  SELECT count(*) INTO v_orders_before FROM public.orders;

  BEGIN
    PERFORM public.create_order_with_items(
      jsonb_build_object(
        'email','tekort@voorbeeld.nl','first_name','Tekort','last_name','Test',
        'shipping_address','{}'::jsonb,'billing_address','{}'::jsonb,
        'subtotal',30,'shipping_cost',0,'vat_amount',6.3,'total',36.3,
        'status','pending','payment_status','open'),
      jsonb_build_array(jsonb_build_object(
        'product_id', v_product, 'product_name','Testlamp A', 'quantity', 3,
        'unit_price', 10, 'line_total', 30)));
  EXCEPTION WHEN OTHERS THEN
    v_refused := true;
  END;

  SELECT stock_quantity INTO v_stock_after FROM public.products WHERE id = v_product;
  SELECT count(*) INTO v_orders_after FROM public.orders;

  IF NOT v_refused THEN
    RAISE EXCEPTION 'FAIL: an order for 3 was accepted with only % in stock', v_stock_before;
  END IF;
  IF v_stock_after IS DISTINCT FROM v_stock_before THEN
    RAISE EXCEPTION 'FAIL: refused order still moved stock (% -> %)', v_stock_before, v_stock_after;
  END IF;
  IF v_orders_after IS DISTINCT FROM v_orders_before THEN
    RAISE EXCEPTION 'FAIL: refused order left % orphan order(s) behind', v_orders_after - v_orders_before;
  END IF;
  RAISE NOTICE 'ok  order for 3 refused with % in stock, nothing left behind', v_stock_before;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. A failed payment gives the stock back, exactly once
-- ---------------------------------------------------------------------------

SELECT public.release_stock_for_order(:'order1_order_id', 'order_cancelled', 'Betaling mislukt');
SELECT pg_temp.assert_eq('failed payment restores 3', stock_quantity, 5)
FROM public.products WHERE id = :'prod_a_id';

-- Mollie retries its webhook. Every retry lands here.
SELECT public.release_stock_for_order(:'order1_order_id', 'order_cancelled', 'Betaling mislukt');
SELECT public.release_stock_for_order(:'order1_order_id', 'order_cancelled', 'Betaling verlopen');
SELECT pg_temp.assert_eq('webhook replayed twice', stock_quantity, 5, '8 or 11')
FROM public.products WHERE id = :'prod_a_id';

-- ---------------------------------------------------------------------------
-- 9. Reserving the same order twice reserves once
-- ---------------------------------------------------------------------------

SELECT public.set_stock_level(:'prod_b_id', 10);

SELECT order_id FROM public.create_order_with_items(
  jsonb_build_object(
    'email','tweede@voorbeeld.nl','first_name','Tweede','last_name','Test',
    'shipping_address','{}'::jsonb,'billing_address','{}'::jsonb,
    'subtotal',40,'shipping_cost',0,'vat_amount',8.4,'total',48.4,
    'status','pending','payment_status','open'),
  jsonb_build_array(jsonb_build_object(
    'product_id', :'prod_b_id', 'product_name','Testlamp B', 'quantity', 2,
    'unit_price', 20, 'line_total', 40))
) \gset order2_

SELECT pg_temp.assert_eq('order reserves 2', stock_quantity, 8)
FROM public.products WHERE id = :'prod_b_id';

SELECT public.reserve_stock_for_order(:'order2_order_id');
SELECT pg_temp.assert_eq('reserved again', stock_quantity, 8, '6')
FROM public.products WHERE id = :'prod_b_id';

-- ---------------------------------------------------------------------------
-- 10. Cancelling after a release does not put the goods back twice
-- ---------------------------------------------------------------------------

SELECT public.release_stock_for_order(:'order2_order_id', 'order_cancelled', 'Betaling mislukt');
SELECT pg_temp.assert_eq('released once', stock_quantity, 10)
FROM public.products WHERE id = :'prod_b_id';
SELECT public.release_stock_for_order(:'order2_order_id', 'order_cancelled', 'Staf annuleert');
SELECT pg_temp.assert_eq('staff cancel after release', stock_quantity, 10, '12')
FROM public.products WHERE id = :'prod_b_id';

-- ---------------------------------------------------------------------------
-- 11. An idempotency key returns the same order, not a second one
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_first record;
  v_second record;
  v_count bigint;
BEGIN
  SELECT * INTO v_first FROM public.create_order_with_items(
    jsonb_build_object(
      'email','herhaal@voorbeeld.nl','first_name','Herhaal','last_name','Test',
      'shipping_address','{}'::jsonb,'billing_address','{}'::jsonb,
      'subtotal',0,'shipping_cost',0,'vat_amount',0,'total',0,
      'status','pending','payment_status','open',
      'idempotency_key','same-key-twice'),
    '[]'::jsonb);

  SELECT * INTO v_second FROM public.create_order_with_items(
    jsonb_build_object(
      'email','herhaal@voorbeeld.nl','first_name','Herhaal','last_name','Test',
      'shipping_address','{}'::jsonb,'billing_address','{}'::jsonb,
      'subtotal',0,'shipping_cost',0,'vat_amount',0,'total',0,
      'status','pending','payment_status','open',
      'idempotency_key','same-key-twice'),
    '[]'::jsonb);

  IF v_first.order_id IS DISTINCT FROM v_second.order_id THEN
    RAISE EXCEPTION 'FAIL: a repeated submit created a second order (% and %)',
      v_first.order_number, v_second.order_number;
  END IF;
  SELECT count(*) INTO v_count FROM public.orders WHERE idempotency_key = 'same-key-twice';
  IF v_count <> 1 THEN RAISE EXCEPTION 'FAIL: % orders share one idempotency key', v_count; END IF;
  RAISE NOTICE 'ok  repeated submit returns the same order (%)', v_first.order_number;
END;
$$;

-- ---------------------------------------------------------------------------
-- 12. Variant stock behaves the same way
-- ---------------------------------------------------------------------------

INSERT INTO public.product_variants (product_id, variant_name, regular_price, warehouse_stock)
VALUES (:'prod_b_id', 'Groot', 22, 0) RETURNING id \gset var_

SELECT public.set_variant_stock_level(:'var_id', 25, 'correctie', 'csv_import');
SELECT pg_temp.assert_eq('variant import 25', warehouse_stock, 25)
FROM public.product_variants WHERE id = :'var_id';
SELECT public.set_variant_stock_level(:'var_id', 25, 'correctie', 'csv_import');
SELECT pg_temp.assert_eq('variant import re-run', warehouse_stock, 25, '50')
FROM public.product_variants WHERE id = :'var_id';

-- A variant movement must not move the product total as well.
SELECT pg_temp.assert_eq('product total untouched by variant', stock_quantity, 10)
FROM public.products WHERE id = :'prod_b_id';

DO $$
DECLARE v_raised boolean := false; v_stock integer;
BEGIN
  BEGIN
    UPDATE public.product_variants SET warehouse_stock = 999 WHERE variant_name = 'Groot';
  EXCEPTION WHEN check_violation THEN v_raised := true;
  END;
  SELECT warehouse_stock INTO v_stock FROM public.product_variants WHERE variant_name = 'Groot';
  IF NOT v_raised THEN RAISE EXCEPTION 'FAIL: a direct warehouse_stock UPDATE was allowed'; END IF;
  IF v_stock <> 25 THEN RAISE EXCEPTION 'FAIL: refused variant write changed stock to %', v_stock; END IF;
  RAISE NOTICE 'ok  direct variant UPDATE refused, stock unchanged at %', v_stock;
END;
$$;

\echo ''
\echo '================================================='
\echo ' inventory suite: every assertion passed'
\echo '================================================='

ROLLBACK;
