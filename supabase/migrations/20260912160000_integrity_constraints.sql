-- The invariants the money and the ledger were relying on code to keep.
--
-- Everything below was reachable: `orders` and `order_items` carried no bounds
-- at all, so a bug in server code (or anything ever granted a direct write)
-- could store a negative total, a zero-quantity line, a 900% VAT rate or a
-- price with four decimal places, and the row would sit there looking like an
-- invoice. The application checks most of these on the way in; that is the
-- right place for a readable error message and the wrong place for the only
-- copy of the rule.
--
-- Constraints are added NOT VALID and then validated separately. If existing
-- data somewhere violates one, the ALTER still succeeds, new rows are held to
-- the rule immediately, and the VALIDATE reports the problem instead of the
-- migration failing halfway through.

-- ---------------------------------------------------------------------------
-- Money never goes backwards, and is always in whole cents
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_column text;
BEGIN
  FOREACH v_column IN ARRAY ARRAY['subtotal', 'shipping_cost', 'vat_amount', 'discount_amount', 'total']
  LOOP
    -- Dropped first so a re-run replaces the rule rather than stopping at the
    -- first column that already has one and leaving the rest unconstrained.
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_%s_sane', v_column);
    EXECUTE format(
      'ALTER TABLE public.orders ADD CONSTRAINT orders_%1$s_sane
         CHECK (%1$I >= 0 AND %1$I <= 1000000 AND %1$I = round(%1$I, 2)) NOT VALID',
      v_column);
    EXECUTE format('ALTER TABLE public.orders VALIDATE CONSTRAINT orders_%s_sane', v_column);
  END LOOP;
END $$;

-- A currency code is three letters. The shop sells in euros, but the column is
-- free text and a mismatched code would quietly change what a total means.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_currency_code;
ALTER TABLE public.orders ADD CONSTRAINT orders_currency_code
  CHECK (currency ~ '^[A-Z]{3}$') NOT VALID;
ALTER TABLE public.orders VALIDATE CONSTRAINT orders_currency_code;

-- ---------------------------------------------------------------------------
-- An order line is at least one of something, at a price that exists
-- ---------------------------------------------------------------------------

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_quantity_positive;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_quantity_positive
  -- The upper bound is not arithmetic: it is the difference between a typo and
  -- a wholesale order, and 10 000 of one line is the former.
  CHECK (quantity > 0 AND quantity <= 10000) NOT VALID;
ALTER TABLE public.order_items VALIDATE CONSTRAINT order_items_quantity_positive;

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_money_sane;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_money_sane
  CHECK (
    unit_price >= 0 AND unit_price = round(unit_price, 2) AND unit_price <= 1000000
    AND line_total >= 0 AND line_total = round(line_total, 2) AND line_total <= 1000000
  ) NOT VALID;
ALTER TABLE public.order_items VALIDATE CONSTRAINT order_items_money_sane;

-- vat_rate is a percentage (the column default is 21), not a fraction.
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_vat_rate_range;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_vat_rate_range
  CHECK (vat_rate >= 0 AND vat_rate <= 100) NOT VALID;
ALTER TABLE public.order_items VALIDATE CONSTRAINT order_items_vat_rate_range;

-- An order line must point at something. Both columns are nullable because a
-- line can be for a product or for one of its variants, but not at neither:
-- a line with both null is an amount charged for nothing identifiable.
-- product_name and unit_price are snapshots and stay correct even after the
-- product is renamed, but they are not an identity.
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_has_subject;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_has_subject
  CHECK (product_id IS NOT NULL OR variant_id IS NOT NULL) NOT VALID;

-- ---------------------------------------------------------------------------
-- A ledger row that changes nothing is not a ledger row
-- ---------------------------------------------------------------------------

ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_change_nonzero;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_change_nonzero
  -- A zero movement reconciles to nothing and hides a bug in whatever wrote it.
  CHECK (quantity_change <> 0) NOT VALID;

ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_has_subject;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_has_subject
  CHECK (product_id IS NOT NULL OR variant_id IS NOT NULL) NOT VALID;

-- ---------------------------------------------------------------------------
-- Prices on the catalogue side
-- ---------------------------------------------------------------------------

ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_price_sane;
ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_price_sane
  CHECK (
    (regular_price IS NULL OR (regular_price >= 0 AND regular_price <= 1000000))
    AND (sale_price IS NULL OR (sale_price >= 0 AND sale_price <= 1000000))
    AND (purchase_cost IS NULL OR (purchase_cost >= 0 AND purchase_cost <= 1000000))
    AND (safety_stock IS NULL OR safety_stock >= 0)
  ) NOT VALID;
ALTER TABLE public.product_variants VALIDATE CONSTRAINT product_variants_price_sane;

-- ---------------------------------------------------------------------------
-- A customer reviews a product once
-- ---------------------------------------------------------------------------
--
-- insertReview checked for an existing review with a SELECT and then inserted,
-- which is two statements and therefore a race: two submissions in flight at
-- once both read "none" and both write. The constraint is what actually makes
-- it one.
CREATE UNIQUE INDEX IF NOT EXISTS product_reviews_one_per_customer_idx
  ON public.product_reviews (product_id, user_id)
  WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- A payment reference belongs to one order
-- ---------------------------------------------------------------------------
--
-- The webhook finds the order to update by this column. Without a unique index
-- the lookup is a sequential scan that may return more than one row, and
-- "which order did this payment pay for" would have two answers.
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_reference_idx
  ON public.orders (payment_reference)
  WHERE payment_reference IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Foreign keys nobody indexed
-- ---------------------------------------------------------------------------
--
-- An unindexed foreign key makes every delete or key update of the parent scan
-- the whole child table while holding a lock on it. order_items.product_id was
-- also being queried directly — the verified-purchase check on every review
-- read it — so that one was a scan of the entire order history per review.
--
-- Plain CREATE INDEX, not CONCURRENTLY: these tables are small at launch and
-- CONCURRENTLY cannot run inside the transaction a migration is usually pasted
-- into. On a shop with real history, build them with CONCURRENTLY by hand
-- instead and skip this block.

CREATE INDEX IF NOT EXISTS order_items_product_idx        ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS order_items_variant_idx        ON public.order_items (variant_id);
CREATE INDEX IF NOT EXISTS orders_shipping_method_idx     ON public.orders (shipping_method_id);
CREATE INDEX IF NOT EXISTS stock_movements_variant_idx    ON public.stock_movements (variant_id);
CREATE INDEX IF NOT EXISTS product_images_variant_idx     ON public.product_images (variant_id);
CREATE INDEX IF NOT EXISTS channel_listings_variant_idx   ON public.channel_listings (variant_id);
CREATE INDEX IF NOT EXISTS product_reviews_user_idx       ON public.product_reviews (user_id);
CREATE INDEX IF NOT EXISTS wishlist_items_product_idx     ON public.wishlist_items (product_id);
CREATE INDEX IF NOT EXISTS return_items_order_item_idx    ON public.return_items (order_item_id);
CREATE INDEX IF NOT EXISTS return_items_product_idx       ON public.return_items (product_id);
CREATE INDEX IF NOT EXISTS return_items_variant_idx       ON public.return_items (variant_id);
CREATE INDEX IF NOT EXISTS contact_messages_user_idx      ON public.contact_messages (user_id);
CREATE INDEX IF NOT EXISTS product_import_runs_user_idx   ON public.product_import_runs (user_id);
CREATE INDEX IF NOT EXISTS staff_accounts_created_by_idx  ON public.staff_accounts (created_by);

-- ---------------------------------------------------------------------------
-- An order is a financial record and is not deleted
-- ---------------------------------------------------------------------------
--
-- Deleting an order cascades to its items and its status history, and Dutch
-- bookkeeping rules require the invoice behind a sale to be retrievable for
-- seven years. `refunds.order_id` is already RESTRICT, so an order that was
-- refunded cannot go — but an order that was merely paid for could, taking
-- every line with it.
--
-- Nothing in the application deletes an order; the DELETE grant was already
-- revoked from anon and authenticated. This is the layer under that, and it
-- applies to the service role too, which is the only thing the revoke does not
-- cover. Cancelling an order is a status change, not a deletion.
CREATE OR REPLACE FUNCTION public.refuse_order_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  RAISE EXCEPTION
    'Bestelling % kan niet verwijderd worden: een bestelling is een financieel record.',
    OLD.order_number
    USING ERRCODE = 'restrict_violation',
          HINT = 'Annuleer de bestelling (status "cancelled") in plaats van te verwijderen.';
END;
$$;

DROP TRIGGER IF EXISTS orders_no_delete ON public.orders;
CREATE TRIGGER orders_no_delete
  BEFORE DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.refuse_order_delete();

REVOKE ALL ON FUNCTION public.refuse_order_delete() FROM PUBLIC, anon, authenticated;

-- The same reasoning one level down: an order's lines and its status history
-- are part of the same record.
CREATE OR REPLACE FUNCTION public.refuse_financial_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  RAISE EXCEPTION 'Rijen in % worden niet verwijderd: onderdeel van een financieel record.',
    TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS order_items_no_delete ON public.order_items;
CREATE TRIGGER order_items_no_delete
  BEFORE DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.refuse_financial_delete();

DROP TRIGGER IF EXISTS stock_movements_no_delete ON public.stock_movements;
CREATE TRIGGER stock_movements_no_delete
  BEFORE DELETE ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.refuse_financial_delete();

REVOKE ALL ON FUNCTION public.refuse_financial_delete() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Validate the constraints that were added NOT VALID above
-- ---------------------------------------------------------------------------
--
-- Separately and last, so a pre-existing bad row is reported as exactly that
-- rather than taking the whole migration down. Each one is independent.
DO $$
DECLARE
  v_pair text[];
  v_pairs text[][] := ARRAY[
    ARRAY['order_items',     'order_items_has_subject'],
    ARRAY['stock_movements', 'stock_movements_change_nonzero'],
    ARRAY['stock_movements', 'stock_movements_has_subject']
  ];
BEGIN
  FOREACH v_pair SLICE 1 IN ARRAY v_pairs LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I', v_pair[1], v_pair[2]);
    EXCEPTION WHEN check_violation THEN
      RAISE WARNING
        'Bestaande rijen in %.% voldoen niet aan %. De regel geldt vanaf nu voor nieuwe rijen; ruim de oude op en valideer daarna handmatig.',
        'public', v_pair[1], v_pair[2];
    END;
  END LOOP;
END $$;
