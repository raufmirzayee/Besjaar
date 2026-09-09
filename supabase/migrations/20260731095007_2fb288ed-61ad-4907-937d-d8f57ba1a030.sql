DROP POLICY IF EXISTS "public reads product images" ON public.product_images;

CREATE POLICY "public reads images of visible products"
ON public.product_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_images.product_id
      AND p.status IN ('active', 'out_of_stock')
  )
  OR private.can_manage_catalog(auth.uid())
);