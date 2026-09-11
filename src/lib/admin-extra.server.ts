import type { SupabaseClient } from "@supabase/supabase-js";
import { likePattern, quoteFilterValue } from "./postgrest-filter";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

/* ------------------------------- categories ------------------------------- */

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  parent_name: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_visible: boolean;
  is_archived: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  product_count: number;
  updated_at: string;
};

export async function fetchAdminCategories(supabase: Client): Promise<AdminCategory[]> {
  const [cats, products] = await Promise.all([
    supabase
      .from("categories")
      .select(
        "id, name, slug, parent_id, description, image_url, sort_order, is_visible, is_archived, is_featured, seo_title, seo_description, updated_at",
      )
      .order("sort_order"),
    supabase.from("products").select("category_id, subcategory_id"),
  ]);
  if (cats.error) throw new Error(cats.error.message);
  if (products.error) throw new Error(products.error.message);

  const counts = new Map<string, number>();
  for (const p of (products.data ?? []) as any[]) {
    for (const key of [p.category_id, p.subcategory_id]) {
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const rows = (cats.data ?? []) as any[];
  const byId = new Map(rows.map((c) => [c.id, c]));
  return rows.map((c) => ({
    ...c,
    parent_name: c.parent_id ? (byId.get(c.parent_id)?.name ?? null) : null,
    product_count: counts.get(c.id) ?? 0,
  })) as AdminCategory[];
}

export type CategoryInput = {
  id?: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_visible?: boolean;
  is_featured?: boolean;
  is_archived?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveCategory(supabase: Client, input: CategoryInput) {
  const payload = {
    name: input.name.trim(),
    slug: (input.slug || slugify(input.name)).trim(),
    parent_id: input.parent_id ?? null,
    description: input.description ?? null,
    image_url: input.image_url ?? null,
    sort_order: input.sort_order ?? 0,
    is_visible: input.is_visible ?? true,
    is_featured: input.is_featured ?? false,
    is_archived: input.is_archived ?? false,
    seo_title: input.seo_title ?? null,
    seo_description: input.seo_description ?? null,
    updated_at: new Date().toISOString(),
  };
  if (!payload.name) throw new Error("Naam is verplicht");

  if (input.id) {
    const { error } = await supabase.from("categories").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
    return { id: input.id };
  }
  const { data, error } = await supabase.from("categories").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  return { id: (data as any).id as string };
}

export async function archiveCategory(supabase: Client, id: string) {
  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    // Safe as written only because `id` is a validated uuid and cannot carry a
    // comma; anything user-typed here needs quoteFilterValue.
    .or(`category_id.eq.${id},subcategory_id.eq.${id}`)
    .neq("status", "archived");
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error(
      `Deze categorie heeft nog ${count} actieve producten. Verplaats die producten eerst.`,
    );
  }
  const { error } = await supabase
    .from("categories")
    .update({ is_archived: true, is_visible: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/* --------------------------------- brands --------------------------------- */

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  product_count: number;
  updated_at: string;
};

export async function fetchAdminBrands(supabase: Client): Promise<AdminBrand[]> {
  const [brands, products] = await Promise.all([
    supabase
      .from("brands")
      .select(
        "id, name, slug, description, logo_url, sort_order, is_active, seo_title, seo_description, updated_at",
      )
      .order("sort_order"),
    supabase.from("products").select("brand_id"),
  ]);
  if (brands.error) throw new Error(brands.error.message);
  if (products.error) throw new Error(products.error.message);

  const counts = new Map<string, number>();
  for (const p of (products.data ?? []) as any[]) {
    if (p.brand_id) counts.set(p.brand_id, (counts.get(p.brand_id) ?? 0) + 1);
  }
  return ((brands.data ?? []) as any[]).map((b) => ({
    ...b,
    product_count: counts.get(b.id) ?? 0,
  })) as AdminBrand[];
}

export type BrandInput = {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  logo_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
};

export async function saveBrand(supabase: Client, input: BrandInput) {
  const payload = {
    name: input.name.trim(),
    slug: (input.slug || slugify(input.name)).trim(),
    description: input.description ?? null,
    logo_url: input.logo_url ?? null,
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active ?? true,
    seo_title: input.seo_title ?? null,
    seo_description: input.seo_description ?? null,
    updated_at: new Date().toISOString(),
  };
  if (!payload.name) throw new Error("Naam is verplicht");

  if (input.id) {
    const { error } = await supabase.from("brands").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
    return { id: input.id };
  }
  const { data, error } = await supabase.from("brands").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  return { id: (data as any).id as string };
}

/* ---------------------------- stock movements ----------------------------- */

export const MOVEMENT_REASON_LABELS: Record<string, string> = {
  website_sale: "Webshop verkoop",
  bol_sale: "bol.com verkoop",
  manual_order: "Handmatige order",
  customer_return: "Klantretour",
  supplier_receipt: "Leveranciersontvangst",
  damaged: "Beschadigd",
  lost: "Vermist",
  manual: "Handmatige correctie",
  manual_correction: "Handmatige correctie",
  order_cancelled: "Orderannulering",
  reservation: "Voorraadreservering",
  reservation_release: "Reservering vrijgegeven",
  transfer: "Overboeking",
  order: "Bestelling",
  return: "Retour",
};

export type MovementFilters = {
  productId?: string | null;
  reason?: string | null;
  from?: string | null;
  to?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
};

export type MovementRow = {
  id: string;
  created_at: string;
  product_id: string | null;
  product_name: string | null;
  ean: string | null;
  reason: string;
  quantity_change: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  created_by_email: string | null;
};

export async function fetchMovements(
  supabase: Client,
  filters: MovementFilters,
): Promise<{ rows: MovementRow[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, filters.pageSize ?? 25);

  let query = supabase
    .from("stock_movements")
    .select(
      "id, created_at, product_id, quantity_change, reason, reference_type, reference_id, note, created_by, products ( name, ean )",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (filters.productId) query = query.eq("product_id", filters.productId);
  if (filters.reason && filters.reason !== "alle") query = query.eq("reason", filters.reason);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);

  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as any[]).map((m) => ({
    id: m.id,
    created_at: m.created_at,
    product_id: m.product_id,
    product_name: m.products?.name ?? null,
    ean: m.products?.ean ?? null,
    reason: m.reason,
    quantity_change: Number(m.quantity_change ?? 0),
    reference_type: m.reference_type,
    reference_id: m.reference_id,
    note: m.note,
    created_by: m.created_by,
    created_by_email: null as string | null,
  }));

  const userIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))] as string[];
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    const emails = new Map(((profiles ?? []) as any[]).map((p) => [p.id, p.email]));
    for (const row of rows) {
      row.created_by_email = row.created_by ? (emails.get(row.created_by) ?? null) : null;
    }
  }

  const term = filters.search?.trim().toLowerCase();
  const filtered = term
    ? rows.filter(
        (r) =>
          (r.product_name ?? "").toLowerCase().includes(term) ||
          (r.ean ?? "").toLowerCase().includes(term) ||
          (r.note ?? "").toLowerCase().includes(term),
      )
    : rows;

  return { rows: filtered, total: count ?? filtered.length };
}

/* ----------------------------- low stock logic ---------------------------- */

export type LowStockAlert = {
  id: string;
  name: string;
  ean: string | null;
  brand: string | null;
  category: string | null;
  stock_quantity: number;
  safety_stock: number;
  low_stock_threshold: number;
  sales4m: number;
  sales6m: number;
  monthlyAverage: number;
  coverageMonths: number | null;
  recommendedOrder: number;
  level: "critical" | "high" | "medium" | "low";
};

export async function fetchLowStockAlerts(supabase: Client): Promise<LowStockAlert[]> {
  const now = Date.now();
  const from6 = new Date(now - 182 * 86400000).toISOString();
  const from4 = new Date(now - 122 * 86400000).toISOString();

  const [productsRes, itemsRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, ean, status, stock_quantity, safety_stock, low_stock_threshold, brands ( name ), categories!products_category_id_fkey ( name )",
      )
      .neq("status", "archived"),
    supabase
      .from("order_items")
      .select("product_id, quantity, created_at")
      .gte("created_at", from6),
  ]);
  if (productsRes.error) throw new Error(productsRes.error.message);
  if (itemsRes.error) throw new Error(itemsRes.error.message);

  const sales4 = new Map<string, number>();
  const sales6 = new Map<string, number>();
  for (const item of (itemsRes.data ?? []) as any[]) {
    if (!item.product_id) continue;
    const qty = Number(item.quantity ?? 0);
    sales6.set(item.product_id, (sales6.get(item.product_id) ?? 0) + qty);
    if (item.created_at >= from4) {
      sales4.set(item.product_id, (sales4.get(item.product_id) ?? 0) + qty);
    }
  }

  const alerts = ((productsRes.data ?? []) as any[])
    .map((p) => {
      const stock = Number(p.stock_quantity ?? 0);
      const s4 = sales4.get(p.id) ?? 0;
      const s6 = sales6.get(p.id) ?? 0;
      const monthlyAverage = s6 / 6;
      const coverage = monthlyAverage > 0 ? stock / monthlyAverage : null;
      const recommended = Math.max(
        0,
        Math.ceil(monthlyAverage * 3 + Number(p.safety_stock ?? 0) - stock),
      );
      const threshold = Number(p.low_stock_threshold ?? 5);
      const level: LowStockAlert["level"] =
        stock <= 0
          ? "critical"
          : coverage !== null && coverage < 1
            ? "high"
            : stock <= threshold
              ? "medium"
              : "low";
      return {
        id: p.id,
        name: p.name,
        ean: p.ean,
        brand: p.brands?.name ?? null,
        category: p.categories?.name ?? null,
        stock_quantity: stock,
        safety_stock: Number(p.safety_stock ?? 0),
        low_stock_threshold: threshold,
        sales4m: s4,
        sales6m: s6,
        monthlyAverage,
        coverageMonths: coverage,
        recommendedOrder: recommended,
        level,
      } satisfies LowStockAlert;
    })
    // business rule: 4-month sales above current physical stock => alert
    .filter((a) => a.sales4m > a.stock_quantity || a.stock_quantity <= a.low_stock_threshold)
    .sort((a, b) => (a.coverageMonths ?? 999) - (b.coverageMonths ?? 999));

  return alerts;
}

/* -------------------------------- customers ------------------------------- */

export type CustomerRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  is_active: boolean;
  newsletter_opt_in: boolean;
  created_at: string;
  orderCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt: string | null;
};

export async function fetchCustomers(
  supabase: Client,
  search?: string | null,
): Promise<CustomerRow[]> {
  const [profilesRes, ordersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, is_active, newsletter_opt_in, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("orders").select("user_id, email, total, created_at, status"),
  ]);
  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (ordersRes.error) throw new Error(ordersRes.error.message);

  const orders = (ordersRes.data ?? []) as any[];
  const term = search?.trim().toLowerCase();

  return ((profilesRes.data ?? []) as any[])
    .map((p) => {
      const mine = orders.filter(
        (o) => (o.user_id && o.user_id === p.id) || (p.email && o.email === p.email),
      );
      const valid = mine.filter((o) => !["cancelled", "refunded"].includes(o.status));
      const totalSpent = valid.reduce((s, o) => s + Number(o.total ?? 0), 0);
      const last = mine
        .map((o) => o.created_at as string)
        .sort()
        .pop();
      return {
        ...p,
        orderCount: mine.length,
        totalSpent,
        averageOrderValue: valid.length ? totalSpent / valid.length : 0,
        lastOrderAt: last ?? null,
      } as CustomerRow;
    })
    .filter((c) => {
      if (!term) return true;
      return [c.email, c.first_name, c.last_name, c.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
}

export type CustomerDetail = {
  customer: CustomerRow;
  addresses: any[];
  orders: any[];
  returns: any[];
  reviews: any[];
  tickets: any[];
};

export async function fetchCustomerDetail(
  supabase: Client,
  customerId: string,
): Promise<CustomerDetail> {
  const list = await fetchCustomers(supabase, null);
  const customer = list.find((c) => c.id === customerId);
  if (!customer) throw new Error("Klant niet gevonden");

  const [addresses, orders, returns, reviews, tickets] = await Promise.all([
    supabase.from("customer_addresses").select("*").eq("user_id", customerId),
    supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total, created_at")
      // customerId is a validated uuid; the address is not this shop's text.
      .or(
        `user_id.eq.${customerId}` +
          (customer.email ? `,email.eq.${quoteFilterValue(customer.email)}` : ""),
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("returns")
      .select("id, return_number, status, created_at, refund_amount")
      .eq("user_id", customerId),
    supabase
      .from("product_reviews")
      .select("id, rating, title, status, created_at")
      .eq("user_id", customerId),
    supabase
      .from("contact_messages")
      .select("id, subject, status, created_at")
      .eq("user_id", customerId),
  ]);

  return {
    customer,
    addresses: (addresses.data ?? []) as any[],
    orders: (orders.data ?? []) as any[],
    returns: (returns.data ?? []) as any[],
    reviews: (reviews.data ?? []) as any[],
    tickets: (tickets.data ?? []) as any[],
  };
}

/* -------------------------------- audit log ------------------------------- */

export type AuditRow = {
  id: string;
  created_at: string;
  user_email: string | null;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: string | null;
  new_value: string | null;
};

export async function fetchAuditLogs(
  supabase: Client,
  filters: { module?: string | null; search?: string | null; page?: number },
): Promise<{ rows: AuditRow[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = 30;

  let query = supabase
    .from("audit_logs")
    .select(
      "id, created_at, user_email, action, module, entity_type, entity_id, old_value, new_value",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (filters.module && filters.module !== "alle") query = query.eq("module", filters.module);
  if (filters.search?.trim()) {
    const like = likePattern(filters.search);
    query = query.or(`user_email.ilike.${like},action.ilike.${like},entity_id.ilike.${like}`);
  }

  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(error.message);
  const rows: AuditRow[] = ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    created_at: r.created_at,
    user_email: r.user_email,
    action: r.action,
    module: r.module,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    old_value: r.old_value === null ? null : JSON.stringify(r.old_value),
    new_value: r.new_value === null ? null : JSON.stringify(r.new_value),
  }));
  return { rows, total: count ?? 0 };
}
