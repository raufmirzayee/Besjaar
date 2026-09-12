-- Rate limiting for the public endpoints.
--
-- Order numbers are sequential (BES-10001, BES-10002, …), so the order lookup
-- is enumerable by design: anyone who knows a customer's e-mail address can
-- walk the numbers until one answers, and anyone who knows an order number can
-- guess at e-mail addresses. Neither attempt costs anything today.
--
-- This makes attempts cost something. It lives in the database rather than in
-- process memory on purpose: the shop is deployed as workers, and an in-memory
-- counter resets on every cold start and is not shared between instances — so
-- it would look like a control while barely being one.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  -- What is being limited and who by: 'order_lookup:203.0.113.7'.
  bucket text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  -- The start of the current window. Attempts before this are forgotten.
  window_started_at timestamptz NOT NULL DEFAULT now(),
  -- Set while a caller is locked out, so a lockout survives the window rolling.
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limits_updated_at_idx ON public.rate_limits (updated_at);

-- Nobody but the server touches this. It is not customer data and reading it
-- would tell an attacker exactly how close to the limit they are.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.rate_limits TO service_role;

/**
 * Counts one attempt against a bucket and says whether it is allowed.
 *
 * Returns the attempt number and the moment the caller may try again. The
 * whole decision happens in one statement under the primary key, so two
 * simultaneous requests cannot both read "4 attempts" and both be let through.
 *
 * A caller who exceeds the limit is blocked for p_block_seconds — longer than
 * the window, so hitting the limit is not simply a matter of waiting for the
 * window to roll and continuing at full speed.
 */
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer,
  p_block_seconds integer DEFAULT NULL
) RETURNS TABLE (allowed boolean, attempts integer, retry_after_seconds integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_now timestamptz := now();
  v_block interval := make_interval(secs => COALESCE(p_block_seconds, p_window_seconds * 4));
  v_row public.rate_limits%ROWTYPE;
BEGIN
  INSERT INTO public.rate_limits (bucket, attempts, window_started_at, updated_at)
  VALUES (p_bucket, 1, v_now, v_now)
  ON CONFLICT (bucket) DO UPDATE SET
    -- A window that has run out starts again at one attempt.
    attempts = CASE
      WHEN public.rate_limits.window_started_at < v_now - make_interval(secs => p_window_seconds)
        THEN 1
      ELSE public.rate_limits.attempts + 1
    END,
    window_started_at = CASE
      WHEN public.rate_limits.window_started_at < v_now - make_interval(secs => p_window_seconds)
        THEN v_now
      ELSE public.rate_limits.window_started_at
    END,
    updated_at = v_now
  RETURNING * INTO v_row;

  -- Still serving a lockout from an earlier burst.
  IF v_row.blocked_until IS NOT NULL AND v_row.blocked_until > v_now THEN
    RETURN QUERY SELECT false, v_row.attempts,
                        GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_row.blocked_until - v_now)))::integer);
    RETURN;
  END IF;

  IF v_row.attempts > p_limit THEN
    UPDATE public.rate_limits
    SET blocked_until = v_now + v_block, updated_at = v_now
    WHERE bucket = p_bucket;
    RETURN QUERY SELECT false, v_row.attempts,
                        GREATEST(1, CEIL(EXTRACT(EPOCH FROM v_block))::integer);
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_row.attempts, 0;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer, integer) TO service_role;

/** Clears a bucket after a success, so one good login does not count against the next. */
CREATE OR REPLACE FUNCTION public.clear_rate_limit(p_bucket text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.rate_limits WHERE bucket = p_bucket AND blocked_until IS NULL;
$$;

REVOKE ALL ON FUNCTION public.clear_rate_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_rate_limit(text) TO service_role;

/** Housekeeping: rows nobody has touched in a day carry no information. */
CREATE OR REPLACE FUNCTION public.prune_rate_limits()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.rate_limits
  WHERE updated_at < now() - interval '1 day'
    AND (blocked_until IS NULL OR blocked_until < now());
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_rate_limits() TO service_role;
