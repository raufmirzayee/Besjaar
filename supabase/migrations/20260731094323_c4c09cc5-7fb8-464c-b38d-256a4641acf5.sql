DROP POLICY IF EXISTS "product images readable" ON storage.objects;

CREATE POLICY "catalog managers read product images" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'product-images'
    AND private.can_manage_catalog(auth.uid())
  );