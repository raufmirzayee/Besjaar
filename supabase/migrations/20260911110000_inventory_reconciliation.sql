-- Inventory reconciliation, and a deliberate refusal to "fix" stock blindly.
--
-- Migration 20260910090000 ends with a backfill that adds each product's
-- historical stock_movements sum onto its current stock_quantity. That was
-- written on the assumption that movements had been recorded but never
-- applied. The assumption is wrong: several older flows (manual corrections,
-- CSV import, bulk import, returns, bol.com sync) already updated
-- stock_quantity directly *and* wrote a movement. For those products the
-- backfill counts the same history a second time.
--
-- What this migration deliberately does NOT do
-- --------------------------------------------
-- It does not attempt to reverse that. It cannot: from the data alone there is
-- no way to tell a movement that was applied from one that was not, so any
-- automatic "correction" would be another guess laid on top of the first, and
-- would silently change real inventory. A wrong number that is known to be
-- wrong is safer than a wrong number that looks authoritative.
--
-- The old migration is also left unedited on purpose. Editing an applied
-- migration does not un-apply it; it only hides what happened from the next
-- person reading the history. On a *fresh* install it is a no-op anyway —
-- there are no movements at that point — so it does no harm going forward.
--
-- What this gives you instead: a report that shows where the ledger and the
-- on-hand figure disagree, and a stocktake function to set the truth once you
-- have counted the shelf.

-- ---------------------------------------------------------------------------
-- The report
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.inventory_reconciliation AS
SELECT
  p.id AS product_id,
  p.internal_sku AS sku,
  p.name,
  p.stock_quantity AS on_hand,
  COALESCE(m.ledger_sum, 0) AS ledger_sum,
  COALESCE(m.movement_count, 0) AS movement_count,
  m.first_movement,
  m.last_movement,
  -- What stock would be if it had started from zero and only ever been moved
  -- by the ledger. Equal to on_hand only for products whose entire history
  -- went through the ledger.
  COALESCE(m.ledger_sum, 0) AS ledger_only_balance,
  p.stock_quantity - COALESCE(m.ledger_sum, 0) AS opening_balance_implied,
  CASE
    WHEN COALESCE(m.movement_count, 0) = 0 THEN 'no ledger history'
    WHEN p.stock_quantity = COALESCE(m.ledger_sum, 0) THEN 'ledger matches on-hand'
    ELSE 'needs a physical count'
  END AS assessment
FROM public.products p
LEFT JOIN (
  SELECT product_id,
         SUM(quantity_change) AS ledger_sum,
         COUNT(*) AS movement_count,
         MIN(created_at) AS first_movement,
         MAX(created_at) AS last_movement
  FROM public.stock_movements
  WHERE product_id IS NOT NULL
  GROUP BY product_id
) m ON m.product_id = p.id;

COMMENT ON VIEW public.inventory_reconciliation IS
  'Compares on-hand stock against the movement ledger. Products flagged "needs a physical count" are where the 20260910090000 backfill may have double-counted history. Count the shelf, then use apply_stocktake().';

REVOKE ALL ON public.inventory_reconciliation FROM PUBLIC, anon;
GRANT SELECT ON public.inventory_reconciliation TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The correction, once a human has counted
-- ---------------------------------------------------------------------------

/**
 * Records a physical count as the new truth.
 *
 * Writes the difference to the ledger with reason 'stocktake', so the
 * correction is auditable and attributable rather than an unexplained jump.
 * This is the supported way to repair a product whose history is in doubt.
 */
CREATE OR REPLACE FUNCTION public.apply_stocktake(
  p_product_id uuid,
  p_counted integer,
  p_counted_by uuid DEFAULT NULL,
  p_note text DEFAULT NULL
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN public.set_stock_level(
    p_product_id,
    p_counted,
    'stocktake',
    'stocktake',
    NULL,
    COALESCE(p_note, 'Fysieke telling'),
    p_counted_by
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_stocktake(uuid, integer, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stocktake(uuid, integer, uuid, text) TO service_role;

COMMENT ON FUNCTION public.apply_stocktake(uuid, integer, uuid, text) IS
  'Sets stock from a physical count, recording the difference on the ledger. Use after reviewing inventory_reconciliation.';
