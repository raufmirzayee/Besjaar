
-- ===== helpers =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== roles =====
CREATE TYPE public.app_role AS ENUM (
  'super_admin','store_manager','warehouse','customer_service','content_editor','financial','customer'
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  first_name text,
  last_name text,
  phone text,
  company_name text,
  vat_number text,
  language text NOT NULL DEFAULT 'nl',
  newsletter_opt_in boolean NOT NULL DEFAULT false,
  marketing_consent_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role <> 'customer');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_catalog(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('super_admin','store_manager','content_editor'));
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager','customer_service']::public.app_role[]))
  WITH CHECK (id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager','customer_service']::public.app_role[]));

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "super admin manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email,
          NEW.raw_user_meta_data ->> 'first_name',
          NEW.raw_user_meta_data ->> 'last_name')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== brands =====
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brands TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads active brands" ON public.brands FOR SELECT USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "catalog managers write brands" ON public.brands FOR ALL TO authenticated
  USING (public.can_manage_catalog(auth.uid())) WITH CHECK (public.can_manage_catalog(auth.uid()));
CREATE TRIGGER trg_brands_updated BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== categories =====
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads visible categories" ON public.categories FOR SELECT
  USING ((is_visible AND NOT is_archived) OR public.is_staff(auth.uid()));
CREATE POLICY "catalog managers write categories" ON public.categories FOR ALL TO authenticated
  USING (public.can_manage_catalog(auth.uid())) WITH CHECK (public.can_manage_catalog(auth.uid()));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== products =====
CREATE TYPE public.product_status AS ENUM ('draft','active','out_of_stock','archived','discontinued');

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  slug text NOT NULL UNIQUE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  status public.product_status NOT NULL DEFAULT 'draft',
  short_description text,
  full_description text,
  selling_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ean text UNIQUE,
  internal_sku text UNIQUE,
  supplier_sku text,
  bol_product_id text,
  regular_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (regular_price >= 0),
  sale_price numeric(10,2) CHECK (sale_price IS NULL OR sale_price >= 0),
  purchase_cost numeric(10,2),
  vat_rate numeric(5,2) NOT NULL DEFAULT 21,
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  safety_stock integer NOT NULL DEFAULT 0,
  weight numeric(10,3),
  length numeric(10,2), width numeric(10,2), height numeric(10,2),
  shipping_class text DEFAULT 'standard',
  warranty_months integer NOT NULL DEFAULT 24,
  return_eligible boolean NOT NULL DEFAULT true,
  seo_title text,
  seo_description text,
  search_keywords text,
  featured boolean NOT NULL DEFAULT false,
  bestseller boolean NOT NULL DEFAULT false,
  rating_average numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  sales_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_brand ON public.products(brand_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_subcategory ON public.products(subcategory_id);
CREATE INDEX idx_products_featured ON public.products(featured) WHERE featured;
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads active products" ON public.products FOR SELECT
  USING (status IN ('active','out_of_stock') OR public.is_staff(auth.uid()));
CREATE POLICY "catalog managers write products" ON public.products FOR ALL TO authenticated
  USING (public.can_manage_catalog(auth.uid())) WITH CHECK (public.can_manage_catalog(auth.uid()));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== variants =====
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  option_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  ean text UNIQUE,
  sku text UNIQUE,
  bol_offer_id text,
  regular_price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2),
  purchase_cost numeric(10,2),
  warehouse_stock integer NOT NULL DEFAULT 0,
  safety_stock integer NOT NULL DEFAULT 0,
  weight numeric(10,3),
  dimensions jsonb,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  status public.product_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_variants_product ON public.product_variants(product_id);
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads variants" ON public.product_variants FOR SELECT
  USING (status IN ('active','out_of_stock') OR public.is_staff(auth.uid()));
CREATE POLICY "catalog managers write variants" ON public.product_variants FOR ALL TO authenticated
  USING (public.can_manage_catalog(auth.uid())) WITH CHECK (public.can_manage_catalog(auth.uid()));
CREATE TRIGGER trg_variants_updated BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== images =====
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  alt_text text,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  is_main boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_images_product ON public.product_images(product_id);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "catalog managers write images" ON public.product_images FOR ALL TO authenticated
  USING (public.can_manage_catalog(auth.uid())) WITH CHECK (public.can_manage_catalog(auth.uid()));

-- ===== settings =====
CREATE TABLE public.application_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.application_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_settings TO authenticated;
GRANT ALL ON public.application_settings TO service_role;
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads public settings" ON public.application_settings FOR SELECT
  USING (is_public OR public.is_staff(auth.uid()));
CREATE POLICY "admins write settings" ON public.application_settings FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','store_manager']::public.app_role[]));
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.application_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
