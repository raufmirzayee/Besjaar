-- Who may change what in Setup & Connections.
--
-- Before this, `settings` was a single module held only by super_admin, which
-- made the whole area all-or-nothing: the one person who can replace a payment
-- credential is also the only person who can correct a typo in the support
-- telephone number. That is not least privilege, it is a bottleneck that ends
-- with the super admin's password being shared.
--
-- Split along the line that actually matters — what happens if this person
-- gets it wrong, or is compromised:
--
--   settings      ordinary business configuration. Wrong value, wrong price
--                 for an hour. A store manager can hold this.
--   integrations  connecting and testing a service, and running a sync.
--                 Disruptive, not dangerous.
--   secrets       replacing a credential, and approving live payments. Real
--                 money and real access. Super admin only.
--   security      reading and changing the security posture. Reading it is
--                 useful to a manager; changing it is not.
--
-- The permission is checked server-side in every settings server function and
-- again by the RLS policies on store_settings. A hidden button is not a
-- control.

-- ---------------------------------------------------------------------------
-- Modules
-- ---------------------------------------------------------------------------

-- A store manager runs the shop day to day: company details, shipping wording,
-- SEO copy, store policy. Everything here is reversible from the same screen.
INSERT INTO public.role_permissions (role, module, action)
SELECT 'store_manager'::app_role, 'settings', a
FROM unnest(ARRAY['view', 'edit']) a
ON CONFLICT DO NOTHING;

-- Seeing whether an integration is connected is diagnostic: it is what anyone
-- answering "why did that order not come through" needs. Financial and
-- customer service get the read, not the write.
INSERT INTO public.role_permissions (role, module, action)
SELECT r::app_role, 'integrations', 'view'
FROM unnest(ARRAY['store_manager', 'financial', 'customer_service']) r
ON CONFLICT DO NOTHING;

-- Connecting a service, testing it, and kicking off a synchronisation.
INSERT INTO public.role_permissions (role, module, action)
SELECT 'store_manager'::app_role, 'integrations', a
FROM unnest(ARRAY['edit', 'create']) a
ON CONFLICT DO NOTHING;

-- The warehouse runs bol.com synchronisation already; seeing whether the
-- connection is up is part of that job.
INSERT INTO public.role_permissions (role, module, action)
VALUES ('warehouse'::app_role, 'integrations', 'view')
ON CONFLICT DO NOTHING;

-- Reading the security dashboard is how a manager notices something is wrong.
-- Changing it is a different question and stays with the super admin.
INSERT INTO public.role_permissions (role, module, action)
VALUES ('store_manager'::app_role, 'security', 'view')
ON CONFLICT DO NOTHING;

-- The super admin holds everything in the four new modules, including the two
-- that nobody else gets: replacing a credential, and approving live payments.
INSERT INTO public.role_permissions (role, module, action)
SELECT 'super_admin'::app_role, m, a
FROM unnest(ARRAY['settings', 'integrations', 'secrets', 'security']) m
CROSS JOIN unnest(ARRAY['view', 'create', 'edit', 'approve', 'export', 'manage_settings']) a
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- The two that stay with one person
-- ---------------------------------------------------------------------------
--
-- Stated as a check rather than a comment, so that a later migration that
-- grants `secrets` to another role has to argue with this one.
DO $$
DECLARE
  v_holders text;
BEGIN
  SELECT string_agg(DISTINCT role::text, ', ')
  INTO v_holders
  FROM public.role_permissions
  WHERE module = 'secrets' AND role <> 'super_admin';

  IF v_holders IS NOT NULL THEN
    RAISE EXCEPTION
      'Replacing integration credentials is super_admin only; also granted to: %',
      v_holders;
  END IF;

  SELECT string_agg(DISTINCT role::text, ', ')
  INTO v_holders
  FROM public.role_permissions
  WHERE module = 'security' AND action <> 'view' AND role <> 'super_admin';

  IF v_holders IS NOT NULL THEN
    RAISE EXCEPTION
      'Changing security settings is super_admin only; also granted to: %',
      v_holders;
  END IF;

  RAISE NOTICE 'ok   secrets and security writes are super_admin only';
END $$;

-- ---------------------------------------------------------------------------
-- A standing check
-- ---------------------------------------------------------------------------

/**
 * Which roles hold each of the configuration modules.
 *
 * For the security dashboard, and for answering "who can change our payment
 * credentials" without reading a migration.
 */
CREATE OR REPLACE FUNCTION public.audit_settings_permissions()
RETURNS TABLE (module text, action text, roles text)
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT rp.module, rp.action, string_agg(rp.role::text, ', ' ORDER BY rp.role::text)
  FROM public.role_permissions rp
  WHERE rp.module IN ('settings', 'integrations', 'secrets', 'security')
  GROUP BY rp.module, rp.action
  ORDER BY rp.module, rp.action;
$$;

REVOKE ALL ON FUNCTION public.audit_settings_permissions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.audit_settings_permissions() TO authenticated, service_role;
