-- An order that came back says so.
--
-- `order_status` gained `returned` and `partially_returned` when the payment
-- enum was widened, and then nothing ever set them. A shop that takes goods
-- back and leaves the order reading "delivered" has a record that contradicts
-- its own warehouse: the picker sees a delivered order, the shelf count says
-- the items are back, and only the separate returns screen knows why.
--
-- The status is derived, never typed in. Comparing what was ordered against
-- what has actually been received back is the only way it stays true after a
-- second return on the same order, or after one is reopened.
--
-- Fulfilment status and payment status stay independent on purpose. A returned
-- order may be refunded, partially refunded or not yet refunded at all, and
-- collapsing the two would lose the difference between "we have the goods" and
-- "the customer has their money".

/**
 * Recomputes one order's fulfilment status from the returns booked against it.
 *
 * Called after a return is marked received. Idempotent: it reads the current
 * totals rather than incrementing, so running it twice changes nothing.
 *
 * Returns the status the order ended on, so a caller can log it.
 */
CREATE OR REPLACE FUNCTION public.refresh_order_return_status(p_order_id uuid)
RETURNS public.order_status
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_ordered   bigint;
  v_returned  bigint;
  v_current   public.order_status;
  v_next      public.order_status;
BEGIN
  -- Locked for the duration: two returns received at the same moment would
  -- otherwise both read the pre-update totals and both write "partially".
  SELECT status INTO v_current FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bestelling % bestaat niet.', p_order_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- A cancelled order has no fulfilment left to describe, and a refunded one
  -- is already at the end of its own road. Neither is overwritten.
  IF v_current IN ('cancelled', 'refunded') THEN
    RETURN v_current;
  END IF;

  SELECT COALESCE(sum(oi.quantity), 0) INTO v_ordered
  FROM public.order_items oi WHERE oi.order_id = p_order_id;

  -- Only returns that physically arrived count. A requested or approved
  -- return is a customer's intention, not goods on the shelf.
  SELECT COALESCE(sum(ri.quantity), 0) INTO v_returned
  FROM public.return_items ri
  JOIN public.returns r ON r.id = ri.return_id
  WHERE r.order_id = p_order_id
    AND r.status IN ('received', 'refunded');

  IF v_returned <= 0 THEN
    RETURN v_current;
  END IF;

  -- `>=` rather than `=`: a goodwill return of something not on the original
  -- order still means the customer is not keeping the order.
  v_next := CASE WHEN v_returned >= v_ordered THEN 'returned' ELSE 'partially_returned' END;

  IF v_next IS DISTINCT FROM v_current THEN
    UPDATE public.orders
    SET status = v_next, updated_at = now()
    WHERE id = p_order_id;

    INSERT INTO public.order_status_history (order_id, status, note)
    VALUES (
      p_order_id,
      v_next,
      format('Automatisch: %s van %s artikelen retour ontvangen.', v_returned, v_ordered)
    );
  END IF;

  RETURN v_next;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_order_return_status(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_order_return_status(uuid) TO service_role;

COMMENT ON FUNCTION public.refresh_order_return_status(uuid) IS
  'Derives orders.status from the quantities actually received back. Idempotent; '
  'leaves cancelled and refunded orders alone.';
