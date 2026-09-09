CREATE TYPE public.return_status AS ENUM ('requested','approved','rejected','received','refunded','cancelled');

CREATE TABLE public.returns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number text NOT NULL UNIQUE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  status public.return_status NOT NULL DEFAULT 'requested',
  reason text NOT NULL,
  customer_note text,
  staff_note text,
  refund_amount numeric(10,2),
  tracking_code text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  received_at timestamp with time zone,
  refunded_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.return_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id uuid NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  item_reason text,
  item_condition text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_returns_order ON public.returns(order_id);
CREATE INDEX idx_returns_user ON public.returns(user_id);
CREATE INDEX idx_return_items_return ON public.return_items(return_id);

GRANT SELECT, INSERT, UPDATE ON public.returns TO authenticated;
GRANT ALL ON public.returns TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.return_items TO authenticated;
GRANT ALL ON public.return_items TO service_role;

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own returns" ON public.returns
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Staff view all returns" ON public.returns
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager','warehouse','customer_service']::public.app_role[]));

CREATE POLICY "Customers create own returns" ON public.returns
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Customers cancel own requested returns" ON public.returns
  FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status = 'requested')
  WITH CHECK (user_id = auth.uid() AND status IN ('requested','cancelled'));

CREATE POLICY "Staff update returns" ON public.returns
  FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager','warehouse','customer_service']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager','warehouse','customer_service']::public.app_role[]));

CREATE POLICY "Customers view own return items" ON public.return_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Staff view all return items" ON public.return_items
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager','warehouse','customer_service']::public.app_role[]));

CREATE POLICY "Customers create own return items" ON public.return_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_id AND r.user_id = auth.uid() AND r.status = 'requested')
  );

CREATE POLICY "Staff update return items" ON public.return_items
  FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager','warehouse','customer_service']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager','warehouse','customer_service']::public.app_role[]));

CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();