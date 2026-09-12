-- Revoke the hardcoded super_admin grant.
--
-- 20260730204508 contains:
--
--   INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'super_admin' FROM public.profiles WHERE email = '<a personal address>'
--
-- Two problems with that. It hardcodes one person's identity into the security
-- model, so anyone who can register that address on a fresh deployment becomes
-- an administrator; and it puts a private e-mail address into source control,
-- where it stays in the git history of every clone.
--
-- Why the old migration is not edited
-- -----------------------------------
-- Editing an applied migration does not un-apply it. On a database that has
-- already run it the grant exists regardless, and rewriting the file would
-- only hide that from whoever reads the history next — while changing the
-- file's checksum and risking the migration tooling's own bookkeeping.
--
-- Running forward covers both cases. On an existing database this revokes the
-- grant. On a fresh one the old migration grants and this immediately takes it
-- back, so the net effect is no grant at all.
--
-- The supported way in is ADMIN_BOOTSTRAP_EMAIL plus the claim in the admin,
-- or a deliberate SQL grant — both documented in DEPLOYMENT.md.

-- ---------------------------------------------------------------------------
-- Revoke
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_removed integer := 0;
BEGIN
  -- Matched through profiles the same way the original grant was, so this
  -- reverses exactly what that statement created and nothing else.
  WITH revoked AS (
    DELETE FROM public.user_roles ur
    USING public.profiles p
    WHERE ur.user_id = p.id
      AND ur.role = 'super_admin'
      AND lower(p.email) = 'rauf.mirzayee@gmail.com'
    RETURNING ur.user_id
  )
  SELECT count(*) INTO v_removed FROM revoked;

  IF v_removed > 0 THEN
    RAISE NOTICE
      'Revoked % hardcoded super_admin grant(s). If that account is your own administrator, re-grant it deliberately — see DEPLOYMENT.md.',
      v_removed;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- A standing check, so this is auditable rather than a one-off
-- ---------------------------------------------------------------------------

/**
 * Lists every account currently holding a staff role.
 *
 * Run this after deploying to confirm the administrators are exactly who you
 * expect. A grant you cannot account for is the thing worth investigating.
 */
CREATE OR REPLACE VIEW public.staff_role_audit AS
SELECT
  ur.user_id,
  p.email,
  ur.role,
  ur.created_at AS granted_at,
  EXISTS (
    SELECT 1 FROM public.staff_accounts sa
    WHERE sa.user_id = ur.user_id AND sa.is_active
  ) AS in_staff_pool
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.role <> 'customer'
ORDER BY ur.created_at;

COMMENT ON VIEW public.staff_role_audit IS
  'Every account holding a staff role, with whether it belongs to the staff pool. Review after deployment; an unexpected row is a finding.';

REVOKE ALL ON public.staff_role_audit FROM PUBLIC, anon;
GRANT SELECT ON public.staff_role_audit TO authenticated, service_role;
