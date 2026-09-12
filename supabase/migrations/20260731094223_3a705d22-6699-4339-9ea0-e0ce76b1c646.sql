GRANT USAGE ON SCHEMA private TO anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION private.has_any_role(uuid, app_role[]) TO anon;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO anon;
GRANT EXECUTE ON FUNCTION private.can_manage_catalog(uuid) TO anon;