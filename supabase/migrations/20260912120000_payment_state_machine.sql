-- Payment state transitions, so a late webhook cannot undo a paid order.
--
-- The webhook's only guard was "skip if the status is unchanged". Everything
-- else was applied in the order it arrived. Webhooks do not arrive in order:
-- providers retry, and a retry of an earlier `open` notification can land after
-- the `paid` one. The shop would then move a paid, picked, possibly shipped
-- order back to pending.
--
-- Rather than trusting arrival order, each status is given a rank and a set of
-- states it may legally move to. Anything else is refused and logged.

/**
 * How settled a payment state is.
 *
 * Higher is more final. Used to reject an event that would move a payment
 * backwards — an `open` notification arriving after `paid` is stale by
 * definition, whatever its timestamp says.
 */
CREATE OR REPLACE FUNCTION public.payment_status_rank(p_status public.payment_status)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp AS $$
  SELECT CASE p_status
    WHEN 'open'               THEN 10  -- created, nothing has happened
    WHEN 'pending'            THEN 20  -- with the bank
    WHEN 'authorized'         THEN 30  -- funds reserved
    WHEN 'paid'               THEN 40  -- money taken
    WHEN 'partially_refunded' THEN 50  -- some given back
    WHEN 'refunded'           THEN 60  -- all given back
    WHEN 'chargeback'         THEN 70  -- taken back by the bank
    -- The three ways a payment dies. Same rank: whichever arrives first wins,
    -- and none of them can follow another.
    WHEN 'failed'             THEN 35
    WHEN 'expired'            THEN 35
    WHEN 'cancelled'          THEN 35
  END;
$$;

/**
 * Whether a payment may move from one state to another.
 *
 * The rules, in words:
 *   * a payment that has died (failed, expired, cancelled) stays dead — a
 *     later `paid` for the same payment id is a provider error, not a sale;
 *   * a paid payment can only move to a refund state or a chargeback;
 *   * anything else may only move forward.
 */
CREATE OR REPLACE FUNCTION public.payment_transition_allowed(
  p_from public.payment_status,
  p_to public.payment_status
) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp AS $$
  SELECT CASE
    -- Re-delivery of the same event. Harmless, and common.
    WHEN p_from = p_to THEN true
    -- Dead ends.
    WHEN p_from IN ('failed', 'expired', 'cancelled') THEN false
    -- Money that has been taken can only be given back or clawed back.
    WHEN p_from IN ('paid', 'partially_refunded')
      THEN p_to IN ('partially_refunded', 'refunded', 'chargeback')
    WHEN p_from = 'refunded'   THEN p_to = 'chargeback'
    WHEN p_from = 'chargeback' THEN false
    -- Everything before payment may move forward, including to a dead end.
    ELSE public.payment_status_rank(p_to) > public.payment_status_rank(p_from)
      OR p_to IN ('failed', 'expired', 'cancelled')
  END;
$$;

/**
 * Applies a payment status from the provider, if the move is legal.
 *
 * Returns what happened so the caller can log it and answer the provider
 * without pretending. `stale` is not an error: it is the normal result of a
 * retried older notification, and the webhook must still return 200 or the
 * provider will keep resending it.
 */
CREATE OR REPLACE FUNCTION public.apply_payment_status(
  p_order_id uuid,
  p_status public.payment_status,
  p_order_status public.order_status DEFAULT NULL,
  p_reference text DEFAULT NULL
) RETURNS TABLE (outcome text, previous public.payment_status, current public.payment_status)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_from public.payment_status;
  v_order_status public.order_status;
BEGIN
  SELECT o.payment_status, o.status INTO v_from, v_order_status
  FROM public.orders o WHERE o.id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bestelling niet gevonden.' USING ERRCODE = 'no_data_found';
  END IF;

  IF v_from = p_status THEN
    RETURN QUERY SELECT 'unchanged'::text, v_from, v_from;
    RETURN;
  END IF;

  IF NOT public.payment_transition_allowed(v_from, p_status) THEN
    RETURN QUERY SELECT 'stale'::text, v_from, v_from;
    RETURN;
  END IF;

  UPDATE public.orders
  SET payment_status = p_status,
      -- Fulfilment state is only touched where payment genuinely decides it.
      -- A shipped order that gets refunded stays shipped: the box is gone.
      status = CASE
        WHEN p_order_status IS NULL THEN status
        WHEN status IN ('processing','packed','shipped','delivered') THEN status
        ELSE p_order_status
      END,
      payment_reference = COALESCE(p_reference, payment_reference),
      updated_at = now()
  WHERE id = p_order_id;

  RETURN QUERY SELECT 'applied'::text, v_from, p_status;
END;
$$;

REVOKE ALL ON FUNCTION public.payment_status_rank(public.payment_status) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.payment_transition_allowed(public.payment_status, public.payment_status) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_payment_status(uuid, public.payment_status, public.order_status, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.payment_status_rank(public.payment_status) TO service_role;
GRANT EXECUTE ON FUNCTION public.payment_transition_allowed(public.payment_status, public.payment_status) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_payment_status(uuid, public.payment_status, public.order_status, text) TO service_role;

COMMENT ON FUNCTION public.apply_payment_status(uuid, public.payment_status, public.order_status, text) IS
  'The only supported way to move an order''s payment state. Refuses a transition that would move it backwards, so a retried older webhook cannot un-pay a paid order.';
