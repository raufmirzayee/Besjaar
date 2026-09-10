-- Inventory: one source of truth, and stock that can only be oversold over a
-- locked row.
--
-- Three problems this fixes.
--
-- 1. Stock was being changed twice. 20260910090000 added a trigger that applies
--    every stock_movements row to products.stock_quantity, but five application
--    paths still updated stock directly *and* inserted a movement. A +5
--    correction moved stock by +10. This migration makes the ledger the only
--    writer: direct updates from the application are rejected outright, so the
--    bug cannot come back through a new code path.
--
-- 2. Overselling. GREATEST(0, ...) stopped stock going negative but happily
--    accepted an order for 10 units when 2 were on hand — it just clamped to 0
--    and eight phantom units were sold. Reservation now happens inside a
--    function that locks the row, checks availability and raises if short.
--
-- 3. Repeated release. A retried Mollie webhook could restore the same
--    reservation twice. Movements tied to a reference are now unique per
--    (reason, reference_type, reference_id), so a replay is a no-op.

-- ---------------------------------------------------------------------------
-- 1. The ledger is the only thing that may move stock
-- ---------------------------------------------------------------------------

-- Distinguishes "the trigger is writing" from "someone updated the column".
-- A transaction-local setting, so it cannot leak between requests.
CREATE OR REPLACE FUNCTION public.guard_direct_stock_writes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity
     AND COALESCE(current_setting('besjaar.applying_movement', true), '') <> 'on' THEN
    RAISE EXCEPTION
      'stock_quantity is ledger-owned: insert a stock_movements row instead of updating it directly (product %)',
      NEW.id
      USING ERRCODE = 'check_violation',
            HINT = 'Use record_stock_movement() or reserve_stock_for_order().';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_direct_stock_writes ON public.products;
CREATE TRIGGER trg_guard_direct_stock_writes
  BEFORE UPDATE OF stock_quantity ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_direct_stock_writes();

CREATE OR REPLACE FUNCTION public.guard_direct_variant_stock_writes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.warehouse_stock IS DISTINCT FROM OLD.warehouse_stock
     AND COALESCE(current_setting('besjaar.applying_movement', true), '') <> 'on' THEN
    RAISE EXCEPTION
      'warehouse_stock is ledger-owned: insert a stock_movements row instead (variant %)',
      NEW.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_direct_variant_stock_writes ON public.product_variants;
CREATE TRIGGER trg_guard_direct_variant_stock_writes
  BEFORE UPDATE OF warehouse_stock ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.guard_direct_variant_stock_writes();

-- The applier now announces itself, so the guards above let it through.
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM set_config('besjaar.applying_movement', 'on', true);

  IF NEW.product_id IS NOT NULL THEN
    -- GREATEST is a floor for corrections that would go below zero. It is not
    -- an overselling control: reserve_stock_for_order() is, and it refuses
    -- before a movement is ever written.
    UPDATE public.products
    SET stock_quantity = GREATEST(0, stock_quantity + NEW.quantity_change),
        updated_at = now()
    WHERE id = NEW.product_id;
  END IF;

  IF NEW.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET warehouse_stock = GREATEST(0, warehouse_stock + NEW.quantity_change),
        updated_at = now()
    WHERE id = NEW.variant_id;
  END IF;

  PERFORM set_config('besjaar.applying_movement', 'off', true);
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Replay protection
-- ---------------------------------------------------------------------------

-- One movement per (reason, reference). A retried webhook, a double-clicked
-- restock button or a re-run import cannot apply the same change twice.
CREATE UNIQUE INDEX IF NOT EXISTS stock_movements_reference_once_idx
  ON public.stock_movements (reason, reference_type, reference_id, COALESCE(product_id, variant_id))
  WHERE reference_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. The supported ways to move stock
-- ---------------------------------------------------------------------------

/**
 * Records one stock movement. The only supported way for the application to
 * change stock. Returns the resulting on-hand quantity.
 *
 * Idempotent when a reference is supplied: a duplicate (reason, reference)
 * returns the current quantity without applying anything.
 */
CREATE OR REPLACE FUNCTION public.record_stock_movement(
  p_product_id uuid,
  p_quantity_change integer,
  p_reason text,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL,
  p_variant_id uuid DEFAULT NULL
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_stock integer;
BEGIN
  IF p_quantity_change = 0 THEN
    SELECT stock_quantity INTO v_stock FROM public.products WHERE id = p_product_id;
    RETURN COALESCE(v_stock, 0);
  END IF;

  BEGIN
    INSERT INTO public.stock_movements
      (product_id, variant_id, quantity_change, reason, reference_type, reference_id, note, created_by)
    VALUES
      (p_product_id, p_variant_id, p_quantity_change, p_reason, p_reference_type, p_reference_id, p_note, p_created_by);
  EXCEPTION WHEN unique_violation THEN
    -- Already applied. Report the current balance rather than failing, so a
    -- retry is harmless to the caller.
    SELECT stock_quantity INTO v_stock FROM public.products WHERE id = p_product_id;
    RETURN COALESCE(v_stock, 0);
  END;

  SELECT stock_quantity INTO v_stock FROM public.products WHERE id = p_product_id;
  RETURN COALESCE(v_stock, 0);
END;
$$;

/**
 * Sets stock to an absolute figure, as a stocktake or an import does.
 *
 * Writes the *difference* as a movement rather than assigning the column, so
 * an import and a manual correction cannot disagree about who owns the number.
 */
CREATE OR REPLACE FUNCTION public.set_stock_level(
  p_product_id uuid,
  p_target integer,
  p_reason text DEFAULT 'correctie',
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current integer;
BEGIN
  IF p_target < 0 THEN
    RAISE EXCEPTION 'Stock cannot be set below zero' USING ERRCODE = 'check_violation';
  END IF;

  SELECT stock_quantity INTO v_current
  FROM public.products WHERE id = p_product_id FOR UPDATE;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Product % not found', p_product_id USING ERRCODE = 'no_data_found';
  END IF;

  IF v_current = p_target THEN
    RETURN v_current;
  END IF;

  INSERT INTO public.stock_movements
    (product_id, quantity_change, reason, reference_type, reference_id, note, created_by)
  VALUES
    (p_product_id, p_target - v_current, p_reason, p_reference_type, p_reference_id, p_note, p_created_by);

  SELECT stock_quantity INTO v_current FROM public.products WHERE id = p_product_id;
  RETURN v_current;
END;
$$;

/**
 * Reserves stock for an order, atomically.
 *
 * Locks each product row with FOR UPDATE before checking, so two customers
 * racing for the last unit serialise: the first reserves it, the second is
 * refused. Raises with a readable message naming the product that fell short.
 *
 * Idempotent per order: a second call for an order that already holds a
 * reservation does nothing.
 */
CREATE OR REPLACE FUNCTION public.reserve_stock_for_order(p_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_line record;
  v_available integer;
  v_name text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.stock_movements
    WHERE reference_type = 'order' AND reference_id = p_order_id AND reason = 'order_placed'
  ) THEN
    RETURN;
  END IF;

  -- Deterministic lock order avoids deadlock between two orders that contain
  -- the same two products in opposite sequence.
  FOR v_line IN
    SELECT oi.product_id, SUM(oi.quantity)::integer AS quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id
    ORDER BY oi.product_id
  LOOP
    SELECT stock_quantity, name INTO v_available, v_name
    FROM public.products
    WHERE id = v_line.product_id
    FOR UPDATE;

    IF v_available IS NULL THEN
      RAISE EXCEPTION 'Product % not found', v_line.product_id USING ERRCODE = 'no_data_found';
    END IF;

    IF v_available < v_line.quantity THEN
      RAISE EXCEPTION
        'Onvoldoende voorraad voor %: % beschikbaar, % gevraagd',
        v_name, v_available, v_line.quantity
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  -- Every line checked and every row still locked: now apply.
  INSERT INTO public.stock_movements
    (product_id, quantity_change, reason, reference_type, reference_id, note)
  SELECT oi.product_id, -SUM(oi.quantity)::integer, 'order_placed', 'order', p_order_id,
         'Gereserveerd bij bestelling'
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id AND oi.product_id IS NOT NULL
  GROUP BY oi.product_id;
END;
$$;

/**
 * Returns a reservation to the shelf, once.
 *
 * Used when a payment fails, is cancelled or expires, and when an order is
 * cancelled. The unique index makes a repeated call a no-op, so a Mollie
 * webhook retry cannot restore stock twice.
 */
CREATE OR REPLACE FUNCTION public.release_stock_for_order(
  p_order_id uuid,
  p_reason text DEFAULT 'order_cancelled',
  p_note text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Nothing was ever reserved (payment never got that far): nothing to give back.
  IF NOT EXISTS (
    SELECT 1 FROM public.stock_movements
    WHERE reference_type = 'order' AND reference_id = p_order_id AND reason = 'order_placed'
  ) THEN
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.stock_movements
      (product_id, quantity_change, reason, reference_type, reference_id, note)
    SELECT oi.product_id, SUM(oi.quantity)::integer, p_reason, 'order', p_order_id,
           COALESCE(p_note, 'Reservering vrijgegeven')
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id;
  EXCEPTION WHEN unique_violation THEN
    -- Already released. A retried webhook lands here and does nothing.
    RETURN;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.record_stock_movement(uuid, integer, text, text, uuid, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_stock_level(uuid, integer, text, text, uuid, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_stock_for_order(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_stock_for_order(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_stock_movement(uuid, integer, text, text, uuid, text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_stock_level(uuid, integer, text, text, uuid, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_stock_for_order(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_stock_for_order(uuid, text, text) TO service_role;

COMMENT ON FUNCTION public.reserve_stock_for_order(uuid) IS
  'Locks each product row, refuses the order if any line exceeds on-hand stock, then writes the reservation. The only safe way to take stock for an order.';
