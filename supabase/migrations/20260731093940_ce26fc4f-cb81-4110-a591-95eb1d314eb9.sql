-- 1. Replace always-true WITH CHECK on staff review moderation
DROP POLICY IF EXISTS "Staff moderate reviews" ON public.product_reviews;
CREATE POLICY "Staff moderate reviews" ON public.product_reviews
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'store_manager'::app_role)
    OR has_role(auth.uid(), 'customer_service'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'store_manager'::app_role)
    OR has_role(auth.uid(), 'customer_service'::app_role)
  );

-- 2. Newsletter insert: no longer unconditionally true
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email ~* '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(email) <= 255
    AND confirmed = false
    AND unsubscribed_at IS NULL
  );

-- 3. Review images: verify ownership against product_reviews, not folder name only
DROP POLICY IF EXISTS "own review images read" ON storage.objects;
DROP POLICY IF EXISTS "own review images upload" ON storage.objects;
DROP POLICY IF EXISTS "own review images delete" ON storage.objects;

CREATE POLICY "own review images read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'review-images'
    AND (
      is_staff(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.product_reviews r
        WHERE r.user_id = auth.uid()
          AND (storage.foldername(name))[1] = r.id::text
      )
    )
  );

CREATE POLICY "own review images upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'review-images'
    AND EXISTS (
      SELECT 1 FROM public.product_reviews r
      WHERE r.user_id = auth.uid()
        AND (storage.foldername(name))[1] = r.id::text
    )
  );

CREATE POLICY "own review images delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'review-images'
    AND (
      is_staff(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.product_reviews r
        WHERE r.user_id = auth.uid()
          AND (storage.foldername(name))[1] = r.id::text
      )
    )
  );

-- 4. Return images: verify ownership against returns
DROP POLICY IF EXISTS "own return images read" ON storage.objects;
DROP POLICY IF EXISTS "own return images upload" ON storage.objects;
DROP POLICY IF EXISTS "own return images delete" ON storage.objects;

CREATE POLICY "own return images read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'return-images'
    AND (
      is_staff(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.returns t
        WHERE t.user_id = auth.uid()
          AND (storage.foldername(name))[1] = t.id::text
      )
    )
  );

CREATE POLICY "own return images upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'return-images'
    AND EXISTS (
      SELECT 1 FROM public.returns t
      WHERE t.user_id = auth.uid()
        AND (storage.foldername(name))[1] = t.id::text
    )
  );

CREATE POLICY "own return images delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'return-images'
    AND (
      is_staff(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.returns t
        WHERE t.user_id = auth.uid()
          AND (storage.foldername(name))[1] = t.id::text
      )
    )
  );

-- 5. Lock down SECURITY DEFINER / trigger functions from direct API execution.
-- Trigger functions are never called directly; they execute as part of the trigger.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_product_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Role helpers are used inside RLS policies, so signed-in users must keep EXECUTE,
-- but anonymous visitors have no reason to probe them.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_catalog(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_catalog(uuid) TO authenticated, service_role;