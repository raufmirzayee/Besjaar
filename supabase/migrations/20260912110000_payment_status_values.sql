-- The payment status enum was missing half of what Mollie actually reports.
--
-- `payment_status` held: open, paid, failed, expired, cancelled, refunded.
-- Mollie reports those plus `pending` (with the bank), `authorized` (funds
-- confirmed, not yet captured) and, through its refunds API, partial refunds
-- and chargebacks.
--
-- mapPaymentStatus() had a `default:` arm that swept every unrecognised status
-- into `open`. That is worse than a missing case, because it is silent:
--
--   * an `authorized` payment — the money is there — read as unpaid;
--   * a `refunded` payment came back as `open`, which also set the order status
--     to `pending`. A completed, refunded order would present itself as a fresh
--     unpaid one.
--
-- ALTER TYPE ... ADD VALUE cannot be used in the same transaction that adds it,
-- so this migration only adds the values. 20260912120000 uses them.

DO $$
BEGIN
  -- pending: accepted by the provider, waiting on the bank or the customer.
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
                 WHERE t.typname='payment_status' AND e.enumlabel='pending') THEN
    ALTER TYPE public.payment_status ADD VALUE 'pending';
  END IF;

  -- authorized: funds reserved but not captured. The sale is going ahead.
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
                 WHERE t.typname='payment_status' AND e.enumlabel='authorized') THEN
    ALTER TYPE public.payment_status ADD VALUE 'authorized';
  END IF;

  -- partially_refunded: some money back, the order is not closed.
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
                 WHERE t.typname='payment_status' AND e.enumlabel='partially_refunded') THEN
    ALTER TYPE public.payment_status ADD VALUE 'partially_refunded';
  END IF;

  -- chargeback: the bank took it back. Distinct from a refund the shop chose
  -- to make, and it needs someone to look at it.
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
                 WHERE t.typname='payment_status' AND e.enumlabel='chargeback') THEN
    ALTER TYPE public.payment_status ADD VALUE 'chargeback';
  END IF;
END;
$$;

-- Fulfilment states the shop can genuinely reach but could not record.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
                 WHERE t.typname='order_status' AND e.enumlabel='returned') THEN
    ALTER TYPE public.order_status ADD VALUE 'returned';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
                 WHERE t.typname='order_status' AND e.enumlabel='partially_returned') THEN
    ALTER TYPE public.order_status ADD VALUE 'partially_returned';
  END IF;
END;
$$;
