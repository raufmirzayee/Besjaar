-- 1. Role permissions -------------------------------------------------------
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL,
  module text NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, module, action)
);

GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read permissions"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

CREATE POLICY "Super admins manage permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (private.has_role(auth.uid(), 'super_admin'));

-- Seed defaults
INSERT INTO public.role_permissions (role, module, action)
SELECT 'super_admin'::app_role, m, a
FROM unnest(ARRAY['dashboard','products','categories','brands','inventory','stock_movements','receipts','low_stock','orders','bol','shipments','returns','customers','reviews','promotions','coupons','content','reports','sync','support','users','settings','audit']) m
CROSS JOIN unnest(ARRAY['view','create','edit','archive','export','approve','refund','manage_settings']) a;

INSERT INTO public.role_permissions (role, module, action)
SELECT 'store_manager'::app_role, m, a
FROM unnest(ARRAY['dashboard','products','categories','brands','inventory','stock_movements','receipts','low_stock','orders','bol','shipments','returns','customers','reviews','promotions','coupons','content','reports','sync','support','audit']) m
CROSS JOIN unnest(ARRAY['view','create','edit','archive','export','approve']) a;

INSERT INTO public.role_permissions (role, module, action)
SELECT 'store_manager'::app_role, m, 'refund'
FROM unnest(ARRAY['orders','returns']) m;

INSERT INTO public.role_permissions (role, module, action)
SELECT 'warehouse'::app_role, m, a
FROM unnest(ARRAY['dashboard','products','inventory','stock_movements','receipts','low_stock','orders','shipments','returns','bol']) m
CROSS JOIN unnest(ARRAY['view','export']) a;

INSERT INTO public.role_permissions (role, module, action)
SELECT 'warehouse'::app_role, m, a
FROM unnest(ARRAY['inventory','stock_movements','receipts','shipments','low_stock']) m
CROSS JOIN unnest(ARRAY['create','edit']) a;

INSERT INTO public.role_permissions (role, module, action)
SELECT 'customer_service'::app_role, m, a
FROM unnest(ARRAY['dashboard','orders','returns','customers','reviews','support','shipments','products','bol']) m
CROSS JOIN unnest(ARRAY['view','export']) a;

INSERT INTO public.role_permissions (role, module, action)
SELECT 'customer_service'::app_role, m, a
FROM unnest(ARRAY['orders','returns','customers','reviews','support']) m
CROSS JOIN unnest(ARRAY['create','edit']) a;

INSERT INTO public.role_permissions (role, module, action)
VALUES ('customer_service','returns','approve'), ('customer_service','reviews','approve');

INSERT INTO public.role_permissions (role, module, action)
SELECT 'content_editor'::app_role, m, a
FROM unnest(ARRAY['dashboard','products','categories','brands','content','reviews','promotions']) m
CROSS JOIN unnest(ARRAY['view','create','edit','export']) a;

INSERT INTO public.role_permissions (role, module, action)
SELECT 'financial'::app_role, m, a
FROM unnest(ARRAY['dashboard','orders','returns','reports','customers','coupons','promotions','audit']) m
CROSS JOIN unnest(ARRAY['view','export']) a;

INSERT INTO public.role_permissions (role, module, action)
VALUES ('financial','orders','refund'), ('financial','returns','refund'), ('financial','returns','approve');

-- 2. Audit log --------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  user_email text,
  action text NOT NULL,
  module text NOT NULL,
  entity_type text,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX audit_logs_module_idx ON public.audit_logs (module);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers read audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    private.has_role(auth.uid(), 'super_admin')
    OR private.has_role(auth.uid(), 'store_manager')
    OR private.has_role(auth.uid(), 'financial')
  );

-- 3. Admin notifications ----------------------------------------------------
CREATE TABLE public.admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  module text,
  entity_id text,
  severity text NOT NULL DEFAULT 'info',
  read_by uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_notifications_created_at_idx ON public.admin_notifications (created_at DESC);

GRANT SELECT, UPDATE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read notifications"
  ON public.admin_notifications FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

CREATE POLICY "Staff mark notifications read"
  ON public.admin_notifications FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()));