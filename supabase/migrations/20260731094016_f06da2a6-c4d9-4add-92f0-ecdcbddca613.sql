CREATE SCHEMA IF NOT EXISTS private;

ALTER FUNCTION public.has_role(uuid, app_role) SET SCHEMA private;
ALTER FUNCTION public.has_any_role(uuid, app_role[]) SET SCHEMA private;
ALTER FUNCTION public.is_staff(uuid) SET SCHEMA private;
ALTER FUNCTION public.can_manage_catalog(uuid) SET SCHEMA private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

REVOKE ALL ON FUNCTION private.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_manage_catalog(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_any_role(uuid, app_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_manage_catalog(uuid) TO authenticated, service_role;