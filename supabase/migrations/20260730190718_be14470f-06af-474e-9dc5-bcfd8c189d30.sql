CREATE TYPE public.review_status AS ENUM ('pending','approved','rejected');

CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text NOT NULL,
  verified_purchase boolean NOT NULL DEFAULT false,
  status public.review_status NOT NULL DEFAULT 'pending',
  moderator_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_reviews_product_idx ON public.product_reviews(product_id, status);
CREATE INDEX product_reviews_status_idx ON public.product_reviews(status, created_at DESC);

GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reviews are public" ON public.product_reviews
  FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Users read own reviews" ON public.product_reviews
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff read all reviews" ON public.product_reviews
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'store_manager')
    OR public.has_role(auth.uid(), 'customer_service')
    OR public.has_role(auth.uid(), 'content_editor')
  );
CREATE POLICY "Users create own reviews" ON public.product_reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Users update own pending reviews" ON public.product_reviews
  FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Users delete own reviews" ON public.product_reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff moderate reviews" ON public.product_reviews
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'store_manager')
    OR public.has_role(auth.uid(), 'customer_service')
  ) WITH CHECK (true);
CREATE POLICY "Staff delete reviews" ON public.product_reviews
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'store_manager')
  );

CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlist_items
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'website',
  confirmed boolean NOT NULL DEFAULT false,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff read subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'store_manager')
    OR public.has_role(auth.uid(), 'content_editor')
  );

CREATE OR REPLACE FUNCTION public.refresh_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE public.products p
  SET rating_average = COALESCE(agg.avg_rating, 0),
      rating_count = COALESCE(agg.cnt, 0)
  FROM (
    SELECT AVG(rating)::numeric(3,2) AS avg_rating, COUNT(*) AS cnt
    FROM public.product_reviews
    WHERE product_id = target AND status = 'approved'
  ) agg
  WHERE p.id = target;
  RETURN NULL;
END;
$$;

CREATE TRIGGER product_reviews_rating_sync
AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

CREATE TRIGGER product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();