-- Least privilege in the database, not just in the application.
--
-- Sensitive tables were gated on private.is_staff(), which means "holds any
-- role other than customer". So a content_editor — whose job is product copy —
-- could read every customer profile, every address, every order and every
-- support message. Not through the admin screens, which check finer
-- permissions, but by pointing the public Supabase client at the REST API from
-- the browser console with their own perfectly valid session.
--
-- Application RBAC cannot fix that, because the application is not in the way.
-- These policies now consult the same role_permissions table the admin screens
-- do, so a role sees exactly the modules it is granted and nothing else.

-- ---------------------------------------------------------------------------
-- The check
-- ---------------------------------------------------------------------------

/**
 * Whether a user may perform an action on a module, per role_permissions.
 *
 * Also requires a second factor, matching every other staff pathway: a
 * password-only session is not staff access. Customers are unaffected — none
 * of the policies below gate a customer's own rows on this.
 */
CREATE OR REPLACE FUNCTION private.has_permission(_user_id uuid, _module text, _action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT private.session_is_aal2() AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id
      AND rp.module = _module
      AND rp.action = _action
  );
$$;

REVOKE ALL ON FUNCTION private.has_permission(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_permission(uuid, text, text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION private.has_permission(uuid, text, text) IS
  'Row-level permission check backed by role_permissions. Use instead of is_staff() on anything holding customer or financial data.';

-- ---------------------------------------------------------------------------
-- Customer identity: customers:view
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.has_permission(auth.uid(), 'customers', 'view'));

DROP POLICY IF EXISTS "staff reads addresses" ON public.customer_addresses;
CREATE POLICY "staff reads addresses" ON public.customer_addresses FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'customers', 'view'));

-- ---------------------------------------------------------------------------
-- Orders and everything hanging off them: orders:view
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "own orders read" ON public.orders;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_permission(auth.uid(), 'orders', 'view'));

DROP POLICY IF EXISTS "own order items read" ON public.order_items;
CREATE POLICY "own order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR private.has_permission(auth.uid(), 'orders', 'view'))
  ));

DROP POLICY IF EXISTS "own order history read" ON public.order_status_history;
CREATE POLICY "own order history read" ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_status_history.order_id
      AND (o.user_id = auth.uid() OR private.has_permission(auth.uid(), 'orders', 'view'))
  ));

-- ---------------------------------------------------------------------------
-- Support correspondence: support:view / support:edit
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff can read contact messages" ON public.contact_messages;
CREATE POLICY "Staff can read contact messages" ON public.contact_messages FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'support', 'view'));

DROP POLICY IF EXISTS "Staff can update contact messages" ON public.contact_messages;
CREATE POLICY "Staff can update contact messages" ON public.contact_messages FOR UPDATE TO authenticated
  USING (private.has_permission(auth.uid(), 'support', 'edit'))
  WITH CHECK (private.has_permission(auth.uid(), 'support', 'edit'));

-- Customer e-mail is customer correspondence: support or order handling only.
DROP POLICY IF EXISTS "Staff read email log" ON public.email_log;
CREATE POLICY "Staff read email log" ON public.email_log FOR SELECT TO authenticated
  USING (
    private.has_permission(auth.uid(), 'support', 'view')
    OR private.has_permission(auth.uid(), 'orders', 'view')
  );

-- ---------------------------------------------------------------------------
-- Warehouse and channel data
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "staff reads stock movements" ON public.stock_movements;
CREATE POLICY "staff reads stock movements" ON public.stock_movements FOR SELECT TO authenticated
  USING (
    private.has_permission(auth.uid(), 'stock_movements', 'view')
    OR private.has_permission(auth.uid(), 'inventory', 'view')
  );

DROP POLICY IF EXISTS "staff reads channel listings" ON public.channel_listings;
CREATE POLICY "staff reads channel listings" ON public.channel_listings FOR SELECT TO authenticated
  USING (private.has_permission(auth.uid(), 'bol', 'view'));

-- ---------------------------------------------------------------------------
-- Who may see the permission model itself
-- ---------------------------------------------------------------------------

-- Knowing the whole role matrix is user administration, not general staff
-- knowledge. Everyone keeps the ability to read their own roles, which the
-- admin gate needs before a second factor is even offered.
DROP POLICY IF EXISTS "Staff can read permissions" ON public.role_permissions;
CREATE POLICY "Staff can read permissions" ON public.role_permissions FOR SELECT TO authenticated
  USING (
    private.has_permission(auth.uid(), 'users', 'view')
    OR role IN (SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Notifications, scoped to the module they concern
-- ---------------------------------------------------------------------------

-- A notification carries a title, a body and a module. Handing every staff
-- member every notification leaks the modules they cannot open — an order
-- total to a content editor, a customer name to the warehouse.
DROP POLICY IF EXISTS "Staff read notifications" ON public.admin_notifications;
CREATE POLICY "Staff read notifications" ON public.admin_notifications FOR SELECT TO authenticated
  USING (
    module IS NULL AND private.has_permission(auth.uid(), 'dashboard', 'view')
    OR module IS NOT NULL AND private.has_permission(auth.uid(), module, 'view')
  );

DROP POLICY IF EXISTS "Staff mark notifications read" ON public.admin_notifications;
CREATE POLICY "Staff mark notifications read" ON public.admin_notifications FOR UPDATE TO authenticated
  USING (
    module IS NULL AND private.has_permission(auth.uid(), 'dashboard', 'view')
    OR module IS NOT NULL AND private.has_permission(auth.uid(), module, 'view')
  )
  WITH CHECK (
    module IS NULL AND private.has_permission(auth.uid(), 'dashboard', 'view')
    OR module IS NOT NULL AND private.has_permission(auth.uid(), module, 'view')
  );

-- ---------------------------------------------------------------------------
-- Customer-submitted images
-- ---------------------------------------------------------------------------

-- Photographs a customer attached to a return or a review. The owner keeps
-- access; staff access follows the module that owns the workflow.
DROP POLICY IF EXISTS "own return images read" ON storage.objects;
CREATE POLICY "own return images read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'return-images'
    AND (
      private.has_permission(auth.uid(), 'returns', 'view')
      OR EXISTS (
        SELECT 1 FROM public.returns t
        WHERE t.user_id = auth.uid() AND (storage.foldername(objects.name))[1] = t.id::text
      )
    )
  );

DROP POLICY IF EXISTS "own return images delete" ON storage.objects;
CREATE POLICY "own return images delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'return-images'
    AND (
      private.has_permission(auth.uid(), 'returns', 'edit')
      OR EXISTS (
        SELECT 1 FROM public.returns t
        WHERE t.user_id = auth.uid() AND (storage.foldername(objects.name))[1] = t.id::text
      )
    )
  );

-- Catalogue tables (products, categories, brands, variants, shipping methods,
-- public settings) deliberately keep is_staff(): those policies only widen a
-- staff member's view to drafts and archived rows, which is not customer data
-- and which every staff role legitimately needs.
