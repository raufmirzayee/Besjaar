-- A customer cannot rename themselves into somebody else.
--
-- `profiles` granted UPDATE on every column to `authenticated`, and the policy
-- only checked `id = auth.uid()`. So any signed-in shopper could run
--
--   UPDATE public.profiles SET email = 'iemand.anders@example.com'
--   WHERE id = auth.uid();
--
-- and the shop believed them, because `auth.users.email` is the address that
-- was actually verified and `profiles.email` is only a copy of it.
--
-- What that copy is used for is the problem. The admin's customer page finds a
-- customer's orders with
--
--   .or(`user_id.eq.${id},email.eq.${profile.email}`)
--
-- — matching on the address so that orders placed as a guest, before the
-- account existed, still appear. Point that at somebody else's address and a
-- colleague opening the attacker's customer page is shown the victim's orders:
-- order numbers, totals, payment status, dates. Nothing leaks to the attacker
-- directly, but the shop's own record of who bought what is now wrong, and a
-- staff member reading it out over the telephone is the rest of the attack.
--
-- The same copy names whoever made a stock movement in the ledger, so a staff
-- account could also make the audit trail attribute its own corrections to a
-- different-looking address.
--
-- The fix is not a better policy. An address is only meaningful because it was
-- verified, and only Supabase Auth can verify one — so the column stops being
-- writable by anyone and becomes a mirror of `auth.users.email` instead.

-- ---------------------------------------------------------------------------
-- 1. Nobody writes the identity columns from a browser
-- ---------------------------------------------------------------------------
--
-- Column grants are role-wide, so this covers staff too, and deliberately: a
-- customer service agent correcting a typo in an address would decouple the
-- profile from the login just as effectively. The customer changes their
-- address through Supabase Auth, which re-verifies it, and the trigger below
-- carries it across.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  first_name,
  last_name,
  phone,
  company_name,
  vat_number,
  language,
  newsletter_opt_in,
  marketing_consent_at,
  updated_at
) ON public.profiles TO authenticated;

-- `id` and `email` stay on INSERT: handle_new_user runs as the definer, and
-- the signup path writes the row once with the values auth already holds. The
-- INSERT policy pins id to auth.uid(), so a caller cannot create a row for
-- somebody else, and the trigger below corrects the address regardless.
REVOKE INSERT ON public.profiles FROM authenticated;
GRANT INSERT (
  id,
  email,
  first_name,
  last_name,
  phone,
  company_name,
  vat_number,
  language,
  newsletter_opt_in,
  marketing_consent_at
) ON public.profiles TO authenticated;

-- `is_active` was writable by the account it belongs to, which makes it
-- useless as a control the shop applies *to* that account. It is not in either
-- grant above.

-- ---------------------------------------------------------------------------
-- 2. The copy follows the verified address
-- ---------------------------------------------------------------------------

/**
 * Mirrors `auth.users.email` onto the profile.
 *
 * Runs on the address Supabase has actually confirmed, so the copy the rest of
 * the shop reads can be trusted the way the original is.
 */
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email, updated_at = now()
  WHERE id = NEW.id
    AND email IS DISTINCT FROM NEW.email;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_profile_email();

-- ---------------------------------------------------------------------------
-- 3. Repair anything already decoupled
-- ---------------------------------------------------------------------------
--
-- On a shop that has been running, a profile may already carry an address its
-- owner typed in. This puts every one of them back to the verified value and
-- says how many it had to correct — a number above zero is worth looking into,
-- because it means somebody had a reason to change it.
DO $$
DECLARE
  v_fixed integer;
BEGIN
  WITH corrected AS (
    UPDATE public.profiles p
    SET email = u.email, updated_at = now()
    FROM auth.users u
    WHERE u.id = p.id
      AND p.email IS DISTINCT FROM u.email
    RETURNING p.id
  )
  SELECT count(*) INTO v_fixed FROM corrected;

  IF v_fixed > 0 THEN
    RAISE WARNING
      'Corrected % profile e-mail address(es) that did not match the verified login. Worth reviewing why.',
      v_fixed;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. A standing check
-- ---------------------------------------------------------------------------

/** Profiles whose address no longer matches the account it belongs to. */
CREATE OR REPLACE FUNCTION public.audit_profile_email_drift()
RETURNS TABLE (user_id uuid, profile_email text, verified_email text)
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT p.id, p.email, u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.email IS DISTINCT FROM u.email;
$$;

REVOKE ALL ON FUNCTION public.audit_profile_email_drift() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_profile_email_drift() TO service_role;
