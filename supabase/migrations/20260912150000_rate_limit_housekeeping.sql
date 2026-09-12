-- Rate limit housekeeping, and a note about what the bucket name now holds.
--
-- Two things were wrong with the limiter as shipped.
--
-- The first is in the application: the bucket name was built from
-- `x-forwarded-for`, which is a list every hop *appends* to. Its leftmost
-- entry is whatever the caller typed, so a fresh value per request bought a
-- fresh counter and the limiter never counted past one. That is fixed in
-- `src/lib/caller-identity.ts`, which reads only the header the configured
-- host is known to overwrite; bucket names now look like
-- 'order_lookup:v4:203.0.113.7', 'checkout:user:<uuid>' or
-- 'mollie_webhook:on:tr_xxx' rather than 'order_lookup:<anything>'.
--
-- The second is here. `prune_rate_limits()` was written and then never called
-- by anything, so every bucket ever created stayed in the table for good. On a
-- shop taking real traffic that is one row per address per limited endpoint,
-- forever, and the flood the limiter exists to stop is also the fastest way to
-- fill it.
--
-- Rather than add a cron endpoint that has to be wired up before it does
-- anything, the cleanup happens inside the counter itself, on a small fraction
-- of calls. It costs one indexed DELETE roughly once in a thousand attempts and
-- needs no configuration to start working.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer,
  p_block_seconds integer DEFAULT NULL
) RETURNS TABLE (allowed boolean, attempts integer, retry_after_seconds integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_now timestamptz := now();
  v_block interval := make_interval(secs => COALESCE(p_block_seconds, p_window_seconds * 4));
  v_row public.rate_limits%ROWTYPE;
BEGIN
  -- Housekeeping, roughly once every thousand attempts. Deliberately before
  -- the count rather than after: the early returns below would skip it.
  IF random() < 0.001 THEN
    DELETE FROM public.rate_limits
    WHERE updated_at < v_now - interval '1 day'
      AND (blocked_until IS NULL OR blocked_until < v_now);
  END IF;

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

-- A bucket is dead weight long before a day is out on a busy shop, but the
-- window can be as long as an hour and a lockout longer still, so a day is the
-- shortest age at which a row is certainly finished with.
COMMENT ON TABLE public.rate_limits IS
  'Rate limit counters. The bucket name is built server-side from a trusted '
  'caller identity (see src/lib/caller-identity.ts) and never from a raw '
  'request header. Rows older than a day are pruned opportunistically by '
  'check_rate_limit().';
