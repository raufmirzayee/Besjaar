-- Order creation in one transaction, and a guest access token.
--
-- Order creation used to be five separate round trips: create the Mollie
-- payment, insert the order, insert the items, insert history, insert stock
-- movements. Any step could fail after the ones before it had committed,
-- leaving a paid customer with no order, or an order with no lines, or an
-- order holding no stock. This puts the parts that must not come apart into
-- one function, so they commit together or not at all.
--
-- Stock reservation is inside that boundary. An order that cannot be stocked
-- is never created at all, rather than created and then found to be unfillable.

-- ---------------------------------------------------------------------------
-- Guest order access token
-- ---------------------------------------------------------------------------

-- Order numbers run in sequence, so "order number + email" is guessable at a
-- few thousand tries. Guests get an unguessable token instead; the link in
-- their confirmation e-mail carries it.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS access_token text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_access_token_idx
  ON public.orders (access_token) WHERE access_token IS NOT NULL;

-- Two random v4 UUIDs, hyphens stripped: 256 bits of randomness from a
-- built-in, so this does not depend on the pgcrypto extension being present.
CREATE OR REPLACE FUNCTION public.generate_order_access_token()
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$;

-- Existing orders get one too, so old confirmation links can be re-issued.
UPDATE public.orders
SET access_token = public.generate_order_access_token()
WHERE access_token IS NULL;

-- ---------------------------------------------------------------------------
-- Atomic order creation
-- ---------------------------------------------------------------------------

/**
 * Creates an order, its lines and its stock reservation in one transaction.
 *
 * Raises if any line exceeds available stock — and because that happens inside
 * the function, the order and its lines are rolled back with it. There is no
 * state in which an order exists without the stock behind it.
 *
 * Returns the new order's id, number and guest access token.
 *
 * The payment reference is deliberately not a parameter: the caller creates
 * the payment *after* this returns, using the real order number, then records
 * the reference with attach_payment_reference().
 */
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_order jsonb,
  p_items jsonb
) RETURNS TABLE (order_id uuid, order_number text, access_token text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
  v_number text;
  v_token text;
  v_existing record;
BEGIN
  -- A retried submission returns the original order rather than a second one.
  IF p_order ? 'idempotency_key' AND p_order->>'idempotency_key' IS NOT NULL THEN
    SELECT o.id, o.order_number, o.access_token INTO v_existing
    FROM public.orders o
    WHERE o.idempotency_key = p_order->>'idempotency_key';
    IF FOUND THEN
      order_id := v_existing.id;
      order_number := v_existing.order_number;
      access_token := v_existing.access_token;
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;

  v_token := public.generate_order_access_token();

  INSERT INTO public.orders (
    user_id, email, first_name, last_name, phone, company_name,
    shipping_address, billing_address, shipping_method_id, shipping_method_name,
    subtotal, shipping_cost, vat_amount, total, customer_note, payment_method,
    idempotency_key, terms_accepted_at, terms_version, payment_status, status,
    access_token
  )
  SELECT
    NULLIF(p_order->>'user_id','')::uuid,
    p_order->>'email',
    p_order->>'first_name',
    p_order->>'last_name',
    NULLIF(p_order->>'phone',''),
    NULLIF(p_order->>'company_name',''),
    (p_order->'shipping_address')::jsonb,
    (p_order->'billing_address')::jsonb,
    NULLIF(p_order->>'shipping_method_id','')::uuid,
    p_order->>'shipping_method_name',
    (p_order->>'subtotal')::numeric,
    (p_order->>'shipping_cost')::numeric,
    (p_order->>'vat_amount')::numeric,
    (p_order->>'total')::numeric,
    NULLIF(p_order->>'customer_note',''),
    p_order->>'payment_method',
    NULLIF(p_order->>'idempotency_key',''),
    (p_order->>'terms_accepted_at')::timestamptz,
    p_order->>'terms_version',
    COALESCE(p_order->>'payment_status','open')::payment_status,
    COALESCE(p_order->>'status','pending')::order_status,
    v_token
  RETURNING id, orders.order_number INTO v_id, v_number;

  INSERT INTO public.order_items
    (order_id, product_id, product_name, product_slug, image_url, sku, unit_price, quantity, line_total)
  SELECT
    v_id,
    NULLIF(item->>'product_id','')::uuid,
    item->>'product_name',
    NULLIF(item->>'product_slug',''),
    NULLIF(item->>'image_url',''),
    NULLIF(item->>'sku',''),
    (item->>'unit_price')::numeric,
    (item->>'quantity')::integer,
    (item->>'line_total')::numeric
  FROM jsonb_array_elements(p_items) AS item;

  -- Inside the transaction: if stock is short this raises, and the order and
  -- its lines above are rolled back with it.
  PERFORM public.reserve_stock_for_order(v_id);

  INSERT INTO public.order_status_history (order_id, status, note)
  VALUES (v_id, COALESCE(p_order->>'status','pending')::order_status,
          'Bestelling aangemaakt en voorraad gereserveerd.');

  order_id := v_id;
  order_number := v_number;
  access_token := v_token;
  RETURN NEXT;
END;
$$;

/**
 * Records the payment provider's reference once the payment exists.
 *
 * Separate from creation because the payment can only be created after the
 * real order number is known — the provider needs it for its own records and
 * for the return URL.
 */
CREATE OR REPLACE FUNCTION public.attach_payment_reference(
  p_order_id uuid,
  p_reference text,
  p_payment_status text DEFAULT NULL,
  p_status text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.orders
  SET payment_reference = p_reference,
      payment_status = COALESCE(NULLIF(p_payment_status,'')::payment_status, payment_status),
      status = COALESCE(NULLIF(p_status,'')::order_status, status),
      updated_at = now()
  WHERE id = p_order_id;
END;
$$;

/**
 * Abandons an order whose payment could not be created, returning its stock.
 *
 * Without this, a Mollie outage would leave orders holding stock that nobody
 * is going to pay for.
 */
CREATE OR REPLACE FUNCTION public.abandon_order(p_order_id uuid, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.release_stock_for_order(p_order_id, 'order_cancelled',
    COALESCE(p_note, 'Betaling kon niet worden aangemaakt'));

  UPDATE public.orders
  SET status = 'cancelled', payment_status = 'failed', cancelled_at = now(), updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history (order_id, status, note)
  VALUES (p_order_id, 'cancelled', COALESCE(p_note, 'Betaling kon niet worden aangemaakt'));
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attach_payment_reference(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.abandon_order(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.attach_payment_reference(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.abandon_order(uuid, text) TO service_role;
