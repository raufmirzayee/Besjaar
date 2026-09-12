-- Stock ledger and order fulfilment.
--
-- Two gaps this closes:
--
-- 1. stock_movements was a write-only ledger: rows were recorded but
--    products.stock_quantity never changed, so the shop would oversell every
--    product indefinitely. A trigger now applies each movement to the product
--    (and variant) it refers to, inside the same transaction as the insert.
--
-- 2. orders had nowhere to record a shipment, so an order could never actually
--    be fulfilled. Carrier, tracking code and the fulfilment timestamps are
--    added here.

-- 1. Stock ledger -----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    -- GREATEST keeps on-hand stock from going negative when a correction and
    -- an order race each other; the ledger still records what was attempted.
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_stock_movement ON public.stock_movements;
CREATE TRIGGER trg_apply_stock_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

COMMENT ON FUNCTION public.apply_stock_movement() IS
  'Applies a stock_movements row to products.stock_quantity / product_variants.warehouse_stock. Insert a movement rather than updating stock directly, so every change keeps an audit trail.';

-- Backfill: movements recorded before this trigger existed were never applied.
-- Recompute on-hand stock from the ledger for products that have any movement,
-- taking the seeded quantity as the opening balance.
WITH ledger AS (
  SELECT product_id, SUM(quantity_change) AS delta
  FROM public.stock_movements
  WHERE product_id IS NOT NULL
  GROUP BY product_id
)
UPDATE public.products p
SET stock_quantity = GREATEST(0, p.stock_quantity + l.delta)
FROM ledger l
WHERE l.product_id = p.id;

-- 2. Order fulfilment -------------------------------------------------------

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS carrier text,
  ADD COLUMN IF NOT EXISTS tracking_code text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  -- Set once the confirmation email has gone out, so a retry cannot send a
  -- second copy of the same confirmation.
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipping_notified_at timestamptz,
  -- Records that the customer accepted the terms, and which version.
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text;

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON public.orders (status, created_at DESC);

COMMENT ON COLUMN public.orders.terms_accepted_at IS
  'When the customer accepted the terms and the right of withdrawal notice. Required evidence under EU consumer law.';

-- 3. Outbound email log -----------------------------------------------------
-- Every transactional message is recorded, so support can see what a customer
-- was actually sent and a failed send can be retried without guessing.

CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  recipient text NOT NULL,
  template text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  provider text,
  provider_message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_order ON public.email_log (order_id);
CREATE INDEX IF NOT EXISTS idx_email_log_created ON public.email_log (created_at DESC);

GRANT SELECT ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- Staff can read the log; nobody writes it from the client. Sending happens
-- server-side with the service role.
DROP POLICY IF EXISTS "Staff read email log" ON public.email_log;
CREATE POLICY "Staff read email log"
  ON public.email_log FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

-- 4. Shipping methods -------------------------------------------------------
-- The seeded methods promised a next-day cut-off and a pickup address that the
-- business has not confirmed. Replace them with what can actually be honoured;
-- edit these in /beheer once carrier arrangements are in place.

UPDATE public.shipping_methods
SET description = 'Bezorging met PostNL, gratis vanaf € 50',
    delivery_time = 'Op werkdagen verzonden'
WHERE name = 'Standaard verzending';

UPDATE public.shipping_methods
SET is_active = false
WHERE name IN ('Volgende dag bezorgd', 'Ophalen in ons magazijn');
