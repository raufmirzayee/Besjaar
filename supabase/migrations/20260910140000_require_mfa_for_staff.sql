-- Require a second factor for staff, in the database as well as the app.
--
-- The application refuses every admin server function on a password-only
-- session. That is not enough on its own: a staff member holding just a
-- password could skip the app entirely and call PostgREST with their token,
-- and RLS would grant them everything their role allows. The assurance level
-- has to be part of the row-level check itself.
--
-- Rather than edit 36 policies, this teaches the three helpers those policies
-- already call. Every existing and future policy inherits the requirement.
--
-- Customer access is untouched: shoppers have no second factor and need none.

CREATE OR REPLACE FUNCTION private.session_is_aal2()
RETURNS boolean LANGUAGE sql STABLE AS $$
  -- The claims of the request's verified JWT. Supabase populates this setting
  -- from the token it has already checked, so it cannot be spoofed by the
  -- caller. Anything that is not exactly 'aal2' counts as password-only.
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal',
    ''
  ) = 'aal2';
$$;

REVOKE ALL ON FUNCTION private.session_is_aal2() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.session_is_aal2() TO anon, authenticated, service_role;

-- A staff role only counts when the session proved a second factor. The
-- customer role is exempt: it is not an access grant, it is what a shopper is.
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (role = 'customer' OR private.session_is_aal2())
  );
$$;

CREATE OR REPLACE FUNCTION private.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
      AND (role = 'customer' OR private.session_is_aal2())
  );
$$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.session_is_aal2() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role <> 'customer'
  );
$$;

-- can_manage_catalog queried user_roles directly instead of going through the
-- helpers above, so it would have kept letting a password-only session edit
-- products and prices while everything else was locked down. Exactly four
-- helpers gate all 36 policies; this is the fourth.
CREATE OR REPLACE FUNCTION private.can_manage_catalog(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.session_is_aal2() AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'store_manager', 'content_editor')
  );
$$;

-- The service role bypasses RLS, so the server's own admin client is
-- unaffected; it enforces the second factor at the application layer before it
-- ever reaches here.
