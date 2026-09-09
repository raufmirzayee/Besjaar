CREATE TYPE public.order_status AS ENUM ('pending','paid','processing','packed','shipped','delivered','cancelled','refunded');
CREATE TYPE public.payment_status AS ENUM ('open','paid','failed','expired','cancelled','refunded');

CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text,
  address_type text NOT NULL DEFAULT 'shipping',
  first_name text NOT NULL,
  last_name text NOT NULL,
  company_name text,
  street text NOT NULL,
  house_number text NOT NULL,
  house_number_addition text,
  postal_code text NOT NULL,
  city text NOT NULL,
  country text NOT NULL DEFAULT 'NL',
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own addresses" ON public.customer_addresses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff reads addresses" ON public.customer_addresses FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER trg_customer_addresses_updated BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  carrier text NOT NULL DEFAULT 'PostNL',
  price numeric NOT NULL DEFAULT 0,
  free_above numeric,
  delivery_time text,
  countries text[] NOT NULL DEFAULT ARRAY['NL','BE','DE'],
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shipping_methods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_methods TO authenticated;
GRANT ALL ON public.shipping_methods TO service_role;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads active shipping methods" ON public.shipping_methods FOR SELECT
  USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "managers write shipping methods" ON public.shipping_methods FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager']::app_role[]));
CREATE TRIGGER trg_shipping_methods_updated BEFORE UPDATE ON public.shipping_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE public.order_number_seq START 10001;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('BES-' || nextval('public.order_number_seq')::text),
  user_id uuid,
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'open',
  payment_method text,
  payment_reference text,
  idempotency_key text UNIQUE,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  company_name text,
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  billing_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  shipping_method_id uuid REFERENCES public.shipping_methods(id),
  shipping_method_name text,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_cost numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  customer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.orders TO authenticated;
GRANT UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "staff updates orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager','warehouse','customer_service']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager','warehouse','customer_service']::app_role[]));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  variant_id uuid REFERENCES public.product_variants(id),
  product_name text NOT NULL,
  product_slug text,
  sku text,
  image_url text,
  unit_price numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 21,
  quantity integer NOT NULL DEFAULT 1,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  note text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own order history read" ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE INDEX idx_order_history_order ON public.order_status_history(order_id);

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id),
  variant_id uuid REFERENCES public.product_variants(id),
  quantity_change integer NOT NULL,
  reason text NOT NULL,
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff reads stock movements" ON public.stock_movements FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);

INSERT INTO public.shipping_methods (name, description, carrier, price, free_above, delivery_time, sort_order)
VALUES
  ('Standaard verzending', 'Bezorging met PostNL, gratis vanaf € 50', 'PostNL', 4.95, 50, '1-2 werkdagen', 1),
  ('Volgende dag bezorgd', 'Besteld voor 15:00, morgen in huis', 'PostNL', 8.95, NULL, 'Volgende werkdag', 2),
  ('Ophalen in ons magazijn', 'Gratis ophalen in Rotterdam', 'Besjaar', 0, NULL, 'Zelfde dag klaar', 3);