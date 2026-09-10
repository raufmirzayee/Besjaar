-- Variant stock, through the same road as product stock.
--
-- 20260911090000 put products.stock_quantity behind the ledger and added the
-- matching guard for product_variants.warehouse_stock, but only gave the
-- application an absolute-figure setter for products. The CSV import writes an
-- absolute variant figure (`variant_voorraad`), so without this it had no
-- supported way to do it and the guard rejected the direct write — which is
-- the guard doing its job, but it left a real feature with no road to take.

/**
 * Sets one variant's warehouse stock to an absolute figure.
 *
 * The product-level twin of this is set_stock_level(). Both write the
 * *difference* to the ledger and let the applier trigger move the column, so
 * an import and a manual correction cannot disagree about who owns the number.
 *
 * The movement carries variant_id only, never product_id: the applier moves
 * every id a row names, so a movement carrying both would move the variant and
 * the product total by the same amount and count the same goods twice.
 */
CREATE OR REPLACE FUNCTION public.set_variant_stock_level(
  p_variant_id uuid,
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

  SELECT warehouse_stock INTO v_current
  FROM public.product_variants WHERE id = p_variant_id FOR UPDATE;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Variant % not found', p_variant_id USING ERRCODE = 'no_data_found';
  END IF;

  IF v_current = p_target THEN
    RETURN v_current;
  END IF;

  INSERT INTO public.stock_movements
    (variant_id, quantity_change, reason, reference_type, reference_id, note, created_by)
  VALUES
    (p_variant_id, p_target - v_current, p_reason, p_reference_type, p_reference_id, p_note, p_created_by);

  SELECT warehouse_stock INTO v_current
  FROM public.product_variants WHERE id = p_variant_id;
  RETURN v_current;
END;
$$;

REVOKE ALL ON FUNCTION public.set_variant_stock_level(uuid, integer, text, text, uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_variant_stock_level(uuid, integer, text, text, uuid, text, uuid)
  TO service_role;

COMMENT ON FUNCTION public.set_variant_stock_level(uuid, integer, text, text, uuid, text, uuid) IS
  'Sets a variant''s warehouse_stock to an absolute figure by writing the difference to the ledger. The variant twin of set_stock_level().';

-- ---------------------------------------------------------------------------
-- Opening balances
-- ---------------------------------------------------------------------------
--
-- A product or variant created with stock on hand used to have that number
-- assigned straight into the column: no ledger row, so the reconciliation
-- report saw stock nobody could account for. New records now book an opening
-- balance movement instead, and 'beginvoorraad' is the reason it carries so
-- that a stocktake report can tell an opening balance from a later correction.
COMMENT ON COLUMN public.stock_movements.reason IS
  'order_placed | order_cancelled | return_restocked | correctie | beginvoorraad | bol_order | supplier_receipt | stocktake';
