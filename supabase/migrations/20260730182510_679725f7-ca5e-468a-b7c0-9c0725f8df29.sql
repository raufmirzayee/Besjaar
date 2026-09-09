CREATE TABLE public.channel_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel text NOT NULL DEFAULT 'bol',
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  ean text,
  external_offer_id text,
  external_product_id text,
  channel_price numeric,
  price_sync_enabled boolean NOT NULL DEFAULT true,
  stock_sync_enabled boolean NOT NULL DEFAULT true,
  last_synced_at timestamp with time zone,
  last_sync_status text,
  last_sync_error text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX channel_listings_channel_offer_key ON public.channel_listings (channel, external_offer_id) WHERE external_offer_id IS NOT NULL;
CREATE INDEX channel_listings_product_idx ON public.channel_listings (product_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_listings TO authenticated;
GRANT ALL ON public.channel_listings TO service_role;
ALTER TABLE public.channel_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff reads channel listings" ON public.channel_listings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "managers write channel listings" ON public.channel_listings FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role,'store_manager'::app_role,'warehouse'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role,'store_manager'::app_role,'warehouse'::app_role]));
CREATE TRIGGER update_channel_listings_updated_at BEFORE UPDATE ON public.channel_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sync_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel text NOT NULL DEFAULT 'bol',
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  processed_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  attempt integer NOT NULL DEFAULT 1,
  error_message text,
  triggered_by uuid,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX sync_jobs_created_idx ON public.sync_jobs (created_at DESC);

GRANT SELECT ON public.sync_jobs TO authenticated;
GRANT ALL ON public.sync_jobs TO service_role;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff reads sync jobs" ON public.sync_jobs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER update_sync_jobs_updated_at BEFORE UPDATE ON public.sync_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.sync_jobs(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'bol',
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX sync_logs_job_idx ON public.sync_logs (job_id, created_at DESC);

GRANT SELECT ON public.sync_logs TO authenticated;
GRANT ALL ON public.sync_logs TO service_role;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff reads sync logs" ON public.sync_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sales_channel text NOT NULL DEFAULT 'webshop';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS external_order_id text;
CREATE UNIQUE INDEX orders_external_order_key ON public.orders (sales_channel, external_order_id) WHERE external_order_id IS NOT NULL;