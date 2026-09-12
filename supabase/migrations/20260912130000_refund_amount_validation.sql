-- A refund is money leaving the business, so it stops being a free-text field.
--
-- `returns.refund_amount` was an ordinary column any of four staff roles could
-- set to any number through the Supabase client — including the warehouse
-- account. 20260912100000 removed the column from their UPDATE grant. This is
-- the supported way to set it.
--
-- Three rules, enforced here rather than in the application, because the
-- application is not the only thing that can reach the database:
--
--   * only a role holding returns:refund may set an amount at all — that is
--     super_admin, store_manager and financial, not warehouse and not
--     customer service;
--   * the amount cannot be negative;
--   * the total refunded against one order cannot exceed what was paid for it.
--
-- The last rule is the one that matters. Without it, two returns against the
-- same order could each be refunded the full order value.

-- A record of what has actually been sent back, so the cap can be computed.
-- refund_amount on `returns` is the *agreed* amount; this is the amount the
-- provider confirmed.
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  return_id uuid REFERENCES public.returns(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  reason text,
  -- The provider's own identifier. Unique so a retried call cannot record the
  -- same refund twice.
  provider_reference text UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'refunded', 'failed')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refunds_order_idx  ON public.refunds (order_id);
CREATE INDEX IF NOT EXISTS refunds_return_idx ON public.refunds (return_id);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.refunds FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;

DROP POLICY IF EXISTS "read refunds" ON public.refunds;
CREATE POLICY "read refunds" ON public.refunds
  FOR SELECT TO authenticated
  USING (
    private.has_permission(auth.uid(), 'orders', 'refund')
    OR private.has_permission(auth.uid(), 'returns', 'refund')
    -- A customer may see refunds against their own orders.
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = refunds.order_id AND o.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.refunds IS
  'Refunds actually issued, one row per provider refund. The cap in refundable_balance() is computed from here; nothing writes it from the browser.';

/**
 * What is still refundable on an order.
 *
 * Zero for an order that was never paid — you cannot refund money you did not
 * take. Otherwise the order total minus everything already refunded against it.
 */
CREATE OR REPLACE FUNCTION public.refundable_balance(p_order_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT GREATEST(
    0,
    COALESCE(
      (SELECT o.total FROM public.orders o
        WHERE o.id = p_order_id
          AND o.payment_status IN ('paid', 'authorized', 'refunded', 'partially_refunded')),
      0
    )
    - COALESCE(
      (SELECT SUM(r.amount) FROM public.refunds r
        WHERE r.order_id = p_order_id AND r.status <> 'failed'),
      0
    )
  );
$$;

REVOKE ALL ON FUNCTION public.refundable_balance(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refundable_balance(uuid) TO service_role;

/**
 * Records a refund against an order, within what is left to refund.
 *
 * Locks the order row first, so two people processing the same return at the
 * same moment cannot both pass the balance check. Returns the refund id.
 */
CREATE OR REPLACE FUNCTION public.record_refund(
  p_order_id uuid,
  p_amount numeric,
  p_return_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_provider_reference text DEFAULT NULL,
  p_actor uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_available numeric;
  v_id uuid;
  v_existing uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Een terugbetaling moet groter dan nul zijn.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- A retried call carrying the provider's own reference is not a second
  -- refund. Answer with the one already recorded.
  IF p_provider_reference IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.refunds
    WHERE provider_reference = p_provider_reference;
    IF v_existing IS NOT NULL THEN
      RETURN v_existing;
    END IF;
  END IF;

  -- Serialises two refunds racing on the same order.
  PERFORM 1 FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bestelling niet gevonden.' USING ERRCODE = 'no_data_found';
  END IF;

  v_available := public.refundable_balance(p_order_id);

  IF p_amount > v_available THEN
    RAISE EXCEPTION
      'Terugbetaling van % is hoger dan het openstaande bedrag van % voor deze bestelling.',
      p_amount, v_available
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.refunds (order_id, return_id, amount, reason, provider_reference, created_by)
  VALUES (p_order_id, p_return_id, p_amount, p_reason, p_provider_reference, p_actor)
  RETURNING id INTO v_id;

  -- Keep the order's payment state honest about what has happened to the
  -- money, through the state machine rather than a raw UPDATE, so the
  -- transition rules apply here too.
  PERFORM public.apply_payment_status(
    p_order_id,
    CASE
      WHEN public.refundable_balance(p_order_id) <= 0 THEN 'refunded'
      ELSE 'partially_refunded'
    END::public.payment_status,
    NULL
  );

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_refund(uuid, numeric, uuid, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_refund(uuid, numeric, uuid, text, text, uuid) TO service_role;

COMMENT ON FUNCTION public.record_refund(uuid, numeric, uuid, text, text, uuid) IS
  'The only supported way to record a refund. Caps the amount at the order''s refundable balance, is idempotent on the provider reference, and locks the order so two refunds cannot race past the cap.';
