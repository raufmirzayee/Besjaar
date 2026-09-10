-- Stock stopped silently clamping at zero.
--
-- apply_stock_movement() ended with GREATEST(0, stock_quantity + change). The
-- intent was defensive — never show a negative number on the shelf — but the
-- effect is that the shelf and the ledger stop agreeing, permanently:
--
--   stock 5, movement -20
--   -> products.stock_quantity  = 0     (clamped)
--   -> SUM(quantity_change)     = -15   (recorded in full)
--
-- Reproduced against this schema before the fix. From that moment the product
-- shows up in inventory_reconciliation forever, and nothing in the data says
-- whether 15 units were really sold, or whether someone typed an extra zero.
-- A clamp turns a loud error into a quiet, unrecoverable one.
--
-- Nothing legitimate needed it. Every path that reduces stock either checks
-- first or computes a delta that lands on a non-negative figure:
--
--   reserve_stock_for_order  locks the row and refuses if short
--   set_stock_level          delta = max(0, target) - current
--   apply_stocktake          the same shape, from a physical count
--   release/restock          positive
--
-- So the only movements the clamp was hiding were mistakes.

CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_current integer;
  v_result integer;
  v_name text;
BEGIN
  PERFORM set_config('besjaar.applying_movement', 'on', true);

  IF NEW.product_id IS NOT NULL THEN
    SELECT stock_quantity, name INTO v_current, v_name
    FROM public.products WHERE id = NEW.product_id FOR UPDATE;

    IF v_current IS NULL THEN
      RAISE EXCEPTION 'Product % bestaat niet.', NEW.product_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    v_result := v_current + NEW.quantity_change;

    IF v_result < 0 THEN
      -- Refused, not clamped. The transaction rolls back, so no ledger row is
      -- written either and the two stay in step.
      RAISE EXCEPTION
        'Onvoldoende voorraad voor %: % op voorraad, mutatie van % gevraagd.',
        COALESCE(v_name, NEW.product_id::text), v_current, NEW.quantity_change
        USING ERRCODE = 'check_violation',
              HINT = 'Gebruik apply_stocktake() om de voorraad op een geteld aantal te zetten.';
    END IF;

    UPDATE public.products
    SET stock_quantity = v_result, updated_at = now()
    WHERE id = NEW.product_id;
  END IF;

  IF NEW.variant_id IS NOT NULL THEN
    SELECT warehouse_stock, variant_name INTO v_current, v_name
    FROM public.product_variants WHERE id = NEW.variant_id FOR UPDATE;

    IF v_current IS NULL THEN
      RAISE EXCEPTION 'Variant % bestaat niet.', NEW.variant_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    v_result := v_current + NEW.quantity_change;

    IF v_result < 0 THEN
      RAISE EXCEPTION
        'Onvoldoende voorraad voor variant %: % op voorraad, mutatie van % gevraagd.',
        COALESCE(v_name, NEW.variant_id::text), v_current, NEW.quantity_change
        USING ERRCODE = 'check_violation';
    END IF;

    UPDATE public.product_variants
    SET warehouse_stock = v_result, updated_at = now()
    WHERE id = NEW.variant_id;
  END IF;

  PERFORM set_config('besjaar.applying_movement', 'off', true);
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.apply_stock_movement() IS
  'Applies one ledger row to the shelf. Refuses a movement that would take stock below zero rather than clamping it, so the ledger and the column cannot drift apart. Locks the row it is about to change.';

-- Belt and braces: even if a future applier forgets, the column itself cannot
-- hold a negative. Added as NOT VALID first so the migration cannot fail on
-- data an earlier clamp already produced; the validation below reports honestly
-- if there is any.
DO $$
DECLARE
  v_bad integer;
BEGIN
  SELECT count(*) INTO v_bad FROM public.products WHERE stock_quantity < 0;
  IF v_bad > 0 THEN
    RAISE WARNING
      '% product(s) already hold negative stock. The constraint is added but not validated; count those products and use apply_stocktake().',
      v_bad;
  END IF;
END;
$$;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_stock_not_negative;
ALTER TABLE public.products
  ADD CONSTRAINT products_stock_not_negative CHECK (stock_quantity >= 0) NOT VALID;

ALTER TABLE public.product_variants
  DROP CONSTRAINT IF EXISTS product_variants_stock_not_negative;
ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_stock_not_negative CHECK (warehouse_stock >= 0) NOT VALID;

-- Validate where the data allows it, so the constraint is enforced going
-- forward on a clean database and merely armed on a dirty one.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE stock_quantity < 0) THEN
    ALTER TABLE public.products VALIDATE CONSTRAINT products_stock_not_negative;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.product_variants WHERE warehouse_stock < 0) THEN
    ALTER TABLE public.product_variants VALIDATE CONSTRAINT product_variants_stock_not_negative;
  END IF;
END;
$$;
