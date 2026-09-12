-- Separate the staff pool from the customer pool.
--
-- Until now any signed-in account could be granted a staff role, and the
-- customer account page advertised the admin to everyone. Roles alone are a
-- weak boundary: one bad INSERT into user_roles turns a shopper into an admin.
--
-- This makes the two pools structurally distinct and enforces it in the
-- database, so no application bug, forgotten check or direct API call can mix
-- them:
--
--   * a non-customer role can only exist for an account in staff_accounts;
--   * an order can never belong to an account in staff_accounts;
--   * only a super_admin can put an account into staff_accounts, and public
--     sign-up has no path into it at all.

-- ---------------------------------------------------------------------------
-- The staff pool
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.staff_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  -- Deactivating keeps the audit trail intact while removing access.
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz
);

ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.staff_accounts TO authenticated;
GRANT ALL ON public.staff_accounts TO service_role;

-- SECURITY DEFINER so the checks below can read the table regardless of the
-- caller's own RLS view of it.
CREATE OR REPLACE FUNCTION private.is_staff_account(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_accounts
    WHERE user_id = _user_id AND is_active
  );
$$;

REVOKE ALL ON FUNCTION private.is_staff_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_staff_account(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Backfill, before the constraints below start rejecting rows
-- ---------------------------------------------------------------------------

-- Anyone who already holds a staff role keeps it: they join the staff pool
-- rather than being locked out by the new rule.
INSERT INTO public.staff_accounts (user_id, email, full_name)
SELECT DISTINCT r.user_id, p.email, NULLIF(TRIM(CONCAT(p.first_name, ' ', p.last_name)), '')
FROM public.user_roles r
LEFT JOIN public.profiles p ON p.id = r.user_id
WHERE r.role <> 'customer'
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- A staff role requires a staff account
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_staff_role_pool()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role <> 'customer' AND NOT private.is_staff_account(NEW.user_id) THEN
    RAISE EXCEPTION
      'Account % is geen medewerkersaccount en kan de rol % niet krijgen.',
      NEW.user_id, NEW.role
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_staff_role_pool ON public.user_roles;
CREATE TRIGGER trg_enforce_staff_role_pool
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_staff_role_pool();

-- Leaving the staff pool must take the staff roles with it, or a deactivated
-- account would keep its access.
CREATE OR REPLACE FUNCTION public.revoke_roles_on_staff_removal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' OR NEW.is_active = false THEN
    DELETE FROM public.user_roles
    WHERE user_id = COALESCE(OLD.user_id, NEW.user_id) AND role <> 'customer';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_revoke_roles_on_staff_removal ON public.staff_accounts;
CREATE TRIGGER trg_revoke_roles_on_staff_removal
  AFTER UPDATE OR DELETE ON public.staff_accounts
  FOR EACH ROW EXECUTE FUNCTION public.revoke_roles_on_staff_removal();

-- ---------------------------------------------------------------------------
-- A staff account cannot shop
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reject_staff_orders()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND private.is_staff_account(NEW.user_id) THEN
    RAISE EXCEPTION 'Een medewerkersaccount kan geen bestelling plaatsen.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reject_staff_orders ON public.orders;
CREATE TRIGGER trg_reject_staff_orders
  BEFORE INSERT OR UPDATE OF user_id ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.reject_staff_orders();

-- ---------------------------------------------------------------------------
-- Who may see and change the staff pool
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff read own staff account" ON public.staff_accounts;
CREATE POLICY "Staff read own staff account" ON public.staff_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'super_admin'));

-- Only a super_admin may add or remove staff, and never through public
-- sign-up: there is deliberately no INSERT policy for anon.
DROP POLICY IF EXISTS "Super admin manages staff accounts" ON public.staff_accounts;
CREATE POLICY "Super admin manages staff accounts" ON public.staff_accounts
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (private.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS staff_accounts_active_idx
  ON public.staff_accounts (is_active) WHERE is_active;
