-- The permission matrix becomes the only authority on who may do what.
--
-- Until now the server functions carried their own hand-written role lists
-- (`requireRoles(context, ["super_admin", "store_manager", "warehouse"])`)
-- while the admin navigation, the dashboard and the RLS policies all consulted
-- `role_permissions`. Two authorities that nobody kept in step: a role could
-- be shown a screen it could not use, or be refused an action its permissions
-- said it had.
--
-- The application side is being moved onto requirePermission(). That exposed
-- three jobs the warehouse role does every day but that the matrix never
-- granted, because the code was letting it through on the role name instead:
--
--   * receiving returns and putting the goods back on the shelf,
--   * maintaining bol.com listings,
--   * running the bol.com synchronisation.
--
-- Granting these is not a widening: it is writing down access the warehouse
-- already had. Without it, moving the code onto the matrix would quietly take
-- away three parts of that role's job.
--
-- What is deliberately NOT granted here: the `users` module to store_manager.
-- The navigation has always hidden the user-and-roles screens from anyone
-- without `users` permissions, so only the server function was more permissive
-- than the matrix. That one is corrected in the code, by tightening it.

INSERT INTO public.role_permissions (role, module, action)
SELECT 'warehouse'::app_role, m, a
FROM unnest(ARRAY['returns','bol','sync']) m
CROSS JOIN unnest(ARRAY['view','create','edit','export']) a
ON CONFLICT DO NOTHING;

-- Receiving a return is an approval step, not just an edit.
INSERT INTO public.role_permissions (role, module, action)
VALUES ('warehouse'::app_role, 'returns', 'approve')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_missing text;
BEGIN
  -- Fails the migration rather than shipping a matrix that would lock the
  -- warehouse out of its own screens.
  SELECT string_agg(m || ':' || a, ', ')
  INTO v_missing
  FROM unnest(ARRAY['returns','bol','sync']) m
  CROSS JOIN unnest(ARRAY['view','edit']) a
  WHERE NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    WHERE rp.role = 'warehouse'::app_role AND rp.module = m AND rp.action = a
  );

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'warehouse role is missing permissions after grant: %', v_missing;
  END IF;

  RAISE NOTICE 'Permission matrix aligned: warehouse holds returns, bol and sync.';
END;
$$;
