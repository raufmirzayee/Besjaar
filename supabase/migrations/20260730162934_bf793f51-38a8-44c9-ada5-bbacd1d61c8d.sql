
CREATE POLICY "product images readable" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'product-images');
CREATE POLICY "catalog managers upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.can_manage_catalog(auth.uid()));
CREATE POLICY "catalog managers update product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.can_manage_catalog(auth.uid()));
CREATE POLICY "catalog managers delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.can_manage_catalog(auth.uid()));

CREATE POLICY "own review images read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'review-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid())));
CREATE POLICY "own review images upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own review images delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'review-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid())));

CREATE POLICY "own return images read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'return-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid())));
CREATE POLICY "own return images upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'return-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own return images delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'return-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid())));
