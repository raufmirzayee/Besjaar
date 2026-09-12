CREATE TABLE public.product_import_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  file_name text NOT NULL,
  total_lines integer NOT NULL DEFAULT 0,
  processed integer NOT NULL DEFAULT 0,
  products_updated integer NOT NULL DEFAULT 0,
  variants_updated integer NOT NULL DEFAULT 0,
  listings_updated integer NOT NULL DEFAULT 0,
  stock_mutations integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_import_runs TO authenticated;
GRANT ALL ON public.product_import_runs TO service_role;

ALTER TABLE public.product_import_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read product import runs"
  ON public.product_import_runs
  FOR SELECT
  TO authenticated
  USING (
    private.has_role(auth.uid(), 'super_admin')
    OR private.has_role(auth.uid(), 'store_manager')
    OR private.has_role(auth.uid(), 'warehouse')
    OR private.has_role(auth.uid(), 'content_editor')
    OR private.has_role(auth.uid(), 'financial')
  );

CREATE INDEX product_import_runs_created_at_idx ON public.product_import_runs (created_at DESC);