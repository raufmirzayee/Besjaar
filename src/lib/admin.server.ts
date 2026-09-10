import type { SupabaseClient } from "@supabase/supabase-js";

// Roles and their labels live in ./staff, which the browser can import; this
// module re-exports them so existing callers keep working and there is still
// only one definition.
export type { AppRole } from "./staff";
export { ROLE_LABELS, STAFF_ROLES } from "./staff";

import type { AppRole } from "./staff";

// One source of truth for order statuses: the fulfilment state machine defines
// them, and the admin filter reuses it so the two can never drift apart.
export { FULFILMENT_STATUSES as ORDER_STATUSES } from "./fulfilment";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

export async function fetchMyRoles(supabase: Client, userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((r) => r.role as AppRole);
}

function assertRole(roles: AppRole[], allowed: AppRole[]) {
  if (!roles.some((r) => allowed.includes(r))) {
    throw new Error("Geen rechten voor deze actie");
  }
}

export async function requireRoles(supabase: Client, userId: string, allowed: AppRole[]) {
  const roles = await fetchMyRoles(supabase, userId);
  assertRole(roles, allowed);
  return roles;
}

export type DashboardStats = {
  revenue30d: number;
  orders30d: number;
  ordersOpen: number;
  averageOrderValue: number;
  productCount: number;
  lowStockCount: number;
  customerCount: number;
  revenueByDay: { day: string; total: number }[];
  recentOrders: {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: number;
    created_at: string;
    first_name: string;
    last_name: string;
  }[];
  topProducts: { id: string; name: string; sales_count: number; stock_quantity: number }[];
};

export async function fetchDashboard(supabase: Client): Promise<DashboardStats> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [ordersRes, recentRes, productsRes, customersRes] = await Promise.all([
    supabase.from("orders").select("total, status, created_at").gte("created_at", since),
    supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total, created_at, first_name, last_name")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("products")
      .select("id, name, sales_count, stock_quantity, low_stock_threshold, status"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  for (const res of [ordersRes, recentRes, productsRes, customersRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const orders = (ordersRes.data ?? []) as any[];
  const products = (productsRes.data ?? []) as any[];

  const revenue30d = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const byDay = new Map<string, number>();
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders) {
    const day = String(o.created_at).slice(0, 10);
    if (byDay.has(day)) byDay.set(day, (byDay.get(day) ?? 0) + Number(o.total));
  }

  return {
    revenue30d,
    orders30d: orders.length,
    ordersOpen: orders.filter((o) => ["pending", "paid", "processing", "packed"].includes(o.status))
      .length,
    averageOrderValue: orders.length ? revenue30d / orders.length : 0,
    productCount: products.length,
    lowStockCount: products.filter(
      (p) => Number(p.stock_quantity) <= Number(p.low_stock_threshold ?? 5),
    ).length,
    customerCount: customersRes.count ?? 0,
    revenueByDay: [...byDay.entries()].map(([day, total]) => ({ day, total })),
    recentOrders: (recentRes.data ?? []) as any,
    topProducts: [...products]
      .sort((a, b) => Number(b.sales_count) - Number(a.sales_count))
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sales_count: Number(p.sales_count ?? 0),
        stock_quantity: Number(p.stock_quantity ?? 0),
      })),
  };
}

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  status: string;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  featured: boolean;
  bestseller: boolean;
  internal_sku: string | null;
  category: string | null;
  brand: string | null;
};

export async function fetchAdminProducts(
  supabase: Client,
  search?: string,
): Promise<AdminProduct[]> {
  let query = supabase
    .from("products")
    .select(
      `id, name, slug, status, regular_price, sale_price, stock_quantity, low_stock_threshold,
       featured, bestseller, internal_sku,
       brands ( name ), categories!products_category_id_fkey ( name )`,
    )
    .order("name");
  if (search) query = query.ilike("name", `%${search}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    status: p.status,
    regular_price: Number(p.regular_price),
    sale_price: p.sale_price === null ? null : Number(p.sale_price),
    stock_quantity: Number(p.stock_quantity ?? 0),
    low_stock_threshold: Number(p.low_stock_threshold ?? 5),
    featured: !!p.featured,
    bestseller: !!p.bestseller,
    internal_sku: p.internal_sku,
    brand: p.brands?.name ?? null,
    category: p.categories?.name ?? null,
  }));
}

export type ProductPatch = {
  id: string;
  name?: string;
  status?: string;
  regular_price?: number;
  sale_price?: number | null;
  low_stock_threshold?: number;
  featured?: boolean;
  bestseller?: boolean;
  short_description?: string | null;
};

export async function updateProduct(supabase: Client, patch: ProductPatch) {
  const { id, ...fields } = patch;
  const { error } = await supabase
    .from("products")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export type AdminOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  email: string;
  first_name: string;
  last_name: string;
  total: number;
  created_at: string;
  shipping_method_name: string | null;
  items: { product_name: string; quantity: number; unit_price: number; line_total: number }[];
};

export async function fetchAdminOrders(supabase: Client, status?: string): Promise<AdminOrder[]> {
  let query = supabase
    .from("orders")
    .select(
      `id, order_number, status, payment_status, payment_method, email, first_name, last_name,
       total, created_at, shipping_method_name,
       order_items ( product_name, quantity, unit_price, line_total )`,
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (status && status !== "alle") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((o) => ({
    ...o,
    total: Number(o.total),
    items: ((o.order_items ?? []) as any[]).map((i) => ({
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      line_total: Number(i.line_total),
    })),
  }));
}

export type LowStockRow = {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  safety_stock: number;
  sales_count: number;
  recommended_order: number;
};

export async function fetchLowStock(supabase: Client): Promise<LowStockRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, stock_quantity, low_stock_threshold, safety_stock, sales_count")
    .order("stock_quantity");
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[])
    .map((p) => {
      const stock = Number(p.stock_quantity ?? 0);
      const threshold = Number(p.low_stock_threshold ?? 5);
      const safety = Number(p.safety_stock ?? 0);
      return {
        id: p.id,
        name: p.name,
        stock_quantity: stock,
        low_stock_threshold: threshold,
        safety_stock: safety,
        sales_count: Number(p.sales_count ?? 0),
        recommended_order: Math.max(0, threshold * 3 + safety - stock),
      };
    })
    .filter((p) => p.stock_quantity <= p.low_stock_threshold * 2);
}

export type StockMovementRow = {
  id: string;
  quantity_change: number;
  reason: string;
  note: string | null;
  created_at: string;
  product_name: string | null;
};

export async function fetchStockMovements(supabase: Client): Promise<StockMovementRow[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("id, quantity_change, reason, note, created_at, products ( name )")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((m) => ({
    id: m.id,
    quantity_change: m.quantity_change,
    reason: m.reason,
    note: m.note,
    created_at: m.created_at,
    product_name: m.products?.name ?? null,
  }));
}

export type AdminUserRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  roles: AppRole[];
};

export async function fetchAdminUsers(supabase: Client): Promise<AdminUserRow[]> {
  const [profiles, roles] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, first_name, last_name, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (profiles.error) throw new Error(profiles.error.message);
  if (roles.error) throw new Error(roles.error.message);

  const byUser = new Map<string, AppRole[]>();
  for (const r of (roles.data ?? []) as any[]) {
    byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
  }
  return ((profiles.data ?? []) as any[]).map((p) => ({
    ...p,
    roles: byUser.get(p.id) ?? [],
  }));
}
