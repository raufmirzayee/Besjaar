import type { SupabaseClient } from "@supabase/supabase-js";
import { assertStaffMfa, type AuthContext } from "./admin.server";

import { can } from "./admin-access";
import type { AdminAccess, AdminAction, AdminModule, PermissionKey } from "./admin-access";
import type { AppRole } from "./admin.server";
import { likePattern } from "./postgrest-filter";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

export async function fetchAccess(supabase: Client, userId: string): Promise<AdminAccess> {
  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (roleError) throw new Error(roleError.message);
  const roles = ((roleRows ?? []) as any[]).map((r) => r.role as AppRole);

  if (roles.length === 0) return { roles: [], permissions: [] };

  const { data: permRows, error: permError } = await supabase
    .from("role_permissions")
    .select("role, module, action")
    .in("role", roles);
  if (permError) throw new Error(permError.message);

  const permissions = [
    ...new Set(((permRows ?? []) as any[]).map((p) => `${p.module}:${p.action}` as PermissionKey)),
  ];
  return { roles, permissions };
}

/**
 * The authorisation choke point for permission-gated admin work. Takes the
 * request context so the two-factor assertion runs on every admin call — see
 * requireRoles in admin.server.ts for why the signature is shaped this way.
 */
export async function requirePermission(
  context: AuthContext,
  module: AdminModule,
  action: AdminAction,
): Promise<AdminAccess> {
  assertStaffMfa(context.claims);
  const access = await fetchAccess(context.supabase, context.userId);
  if (access.roles.includes("super_admin")) return access;
  if (!access.permissions.includes(`${module}:${action}`)) {
    throw new Error("Geen rechten voor deze actie");
  }
  return access;
}

export type AuditEntry = {
  userId: string | null;
  userEmail?: string | null;
  action: string;
  module: AdminModule | string;
  entityType?: string | null;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
};

/** Append-only. Failures never break the business action, but are logged. */
export async function logAudit(entry: AuditEntry) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("audit_logs").insert({
      user_id: entry.userId,
      user_email: entry.userEmail ?? null,
      action: entry.action,
      module: String(entry.module),
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      old_value: (entry.oldValue ?? null) as never,
      new_value: (entry.newValue ?? null) as never,
      ip_address: entry.ipAddress ?? null,
    });
  } catch (error) {
    console.error("audit log failed", error);
  }
}

export async function notifyAdmins(input: {
  kind: string;
  title: string;
  body?: string | null;
  module?: string | null;
  entityId?: string | null;
  severity?: "info" | "warning" | "critical" | "success";
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_notifications").insert({
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      module: input.module ?? null,
      entity_id: input.entityId ?? null,
      severity: input.severity ?? "info",
    });
  } catch (error) {
    console.error("notification failed", error);
  }
}

export type AdminBadges = {
  newOrders: number;
  readyToShip: number;
  lowStock: number;
  pendingReturns: number;
  openSupport: number;
  failedPayments: number;
  syncErrors: number;
  pendingReviews: number;
  unreadNotifications: number;
};

/**
 * Sidebar counts, restricted to what the caller may see.
 *
 * A badge is a number, but it is still information: "7 open support tickets"
 * tells a content editor about a workload they have no access to, and the
 * low-stock and failed-payment counts leak the shape of the business to roles
 * with no claim on it. Each count is now only queried when the permission for
 * its module is held; the rest come back as zero and their badges disappear.
 */
export async function fetchBadges(
  supabase: Client,
  userId: string,
  access: AdminAccess,
): Promise<AdminBadges> {
  const count = (table: string, build: (q: any) => any) =>
    build(supabase.from(table).select("id", { count: "exact", head: true }));
  const zero = Promise.resolve({ count: 0, data: [] as unknown[] });
  const may = (module: AdminModule) => can(access, module, "view");

  const [
    newOrders,
    readyToShip,
    products,
    pendingReturns,
    openSupport,
    failedPayments,
    syncErrors,
    pendingReviews,
    notifications,
  ] = await Promise.all([
    may("orders") ? count("orders", (q) => q.in("status", ["pending", "paid"])) : zero,
    may("shipments") || may("orders")
      ? count("orders", (q) => q.in("status", ["processing", "packed"]))
      : zero,
    may("inventory") || may("low_stock")
      ? supabase.from("products").select("stock_quantity, low_stock_threshold")
      : zero,
    may("returns")
      ? count("returns", (q) => q.in("status", ["requested", "approved", "received"]))
      : zero,
    may("support") ? count("contact_messages", (q) => q.in("status", ["new", "open"])) : zero,
    may("orders") ? count("orders", (q) => q.in("payment_status", ["failed", "expired"])) : zero,
    may("sync") || may("bol") ? count("sync_jobs", (q) => q.eq("status", "failed")) : zero,
    may("reviews") ? count("product_reviews", (q) => q.eq("status", "pending")) : zero,
    supabase.from("admin_notifications").select("read_by").limit(200),
  ]);

  const lowStock = ((products.data ?? []) as any[]).filter(
    (p) => Number(p.stock_quantity ?? 0) <= Number(p.low_stock_threshold ?? 5),
  ).length;

  // Notifications are already filtered by RLS to the modules this user may
  // view, so the unread count reflects only what they can actually open.
  const unread = ((notifications.data ?? []) as any[]).filter(
    (n) => !((n.read_by ?? []) as string[]).includes(userId),
  ).length;

  return {
    newOrders: (newOrders as any).count ?? 0,
    readyToShip: (readyToShip as any).count ?? 0,
    lowStock,
    pendingReturns: (pendingReturns as any).count ?? 0,
    openSupport: (openSupport as any).count ?? 0,
    failedPayments: (failedPayments as any).count ?? 0,
    syncErrors: (syncErrors as any).count ?? 0,
    pendingReviews: (pendingReviews as any).count ?? 0,
    unreadNotifications: unread,
  };
}

export type AdminNotification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  module: string | null;
  entity_id: string | null;
  severity: string;
  created_at: string;
  read: boolean;
};

export async function fetchNotifications(
  supabase: Client,
  userId: string,
): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("id, kind, title, body, module, entity_id, severity, created_at, read_by")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    module: n.module,
    entity_id: n.entity_id,
    severity: n.severity,
    created_at: n.created_at,
    read: ((n.read_by ?? []) as string[]).includes(userId),
  }));
}

export async function markNotifications(supabase: Client, userId: string, ids: string[] | null) {
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("id, read_by")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  const targets = ((data ?? []) as any[]).filter(
    (n) => (!ids || ids.includes(n.id)) && !((n.read_by ?? []) as string[]).includes(userId),
  );

  for (const n of targets) {
    const next = [...((n.read_by ?? []) as string[]), userId];
    const { error: updateError } = await supabase
      .from("admin_notifications")
      .update({ read_by: next })
      .eq("id", n.id);
    if (updateError) throw new Error(updateError.message);
  }
  return { updated: targets.length };
}

export type GlobalSearchResult = {
  type: "product" | "order" | "customer" | "return";
  id: string;
  label: string;
  hint: string | null;
};

/**
 * Cross-module search for the admin bar.
 *
 * Queries only the modules the caller may actually view. It used to run all
 * four regardless — gated on nothing but `dashboard:view`, which a
 * content_editor holds — so typing a surname into the product search returned
 * customers and orders to someone with no business seeing either.
 *
 * The unauthorised queries are not run and then filtered; they are not run.
 */
export async function globalSearch(
  supabase: Client,
  term: string,
  access: AdminAccess,
): Promise<GlobalSearchResult[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  // Quoted, not interpolated: `.or()` takes PostgREST's filter grammar, where a
  // comma in the search term would otherwise add a condition of the caller's
  // choosing. See postgrest-filter.ts.
  const like = likePattern(q);

  const may = (module: AdminModule) => can(access, module, "view");

  const [products, orders, customers, returns] = await Promise.all([
    may("products")
      ? supabase
          .from("products")
          .select("id, name, internal_sku, ean")
          .or(`name.ilike.${like},internal_sku.ilike.${like},ean.ilike.${like}`)
          .limit(5)
      : Promise.resolve({ data: [] as unknown[] }),
    may("orders")
      ? supabase
          .from("orders")
          .select("id, order_number, email, first_name, last_name")
          .or(`order_number.ilike.${like},email.ilike.${like},last_name.ilike.${like}`)
          .limit(5)
      : Promise.resolve({ data: [] as unknown[] }),
    may("customers")
      ? supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .or(`email.ilike.${like},last_name.ilike.${like},first_name.ilike.${like}`)
          .limit(5)
      : Promise.resolve({ data: [] as unknown[] }),
    may("returns")
      ? supabase
          .from("returns")
          .select("id, return_number, email")
          .ilike("return_number", like)
          .limit(5)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const out: GlobalSearchResult[] = [];
  for (const p of (products.data ?? []) as any[]) {
    out.push({ type: "product", id: p.id, label: p.name, hint: p.internal_sku ?? p.ean ?? null });
  }
  for (const o of (orders.data ?? []) as any[]) {
    out.push({
      type: "order",
      id: o.order_number,
      label: o.order_number,
      hint: `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim() || o.email,
    });
  }
  for (const c of (customers.data ?? []) as any[]) {
    out.push({
      type: "customer",
      id: c.id,
      label: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || (c.email ?? "Klant"),
      hint: c.email,
    });
  }
  for (const r of (returns.data ?? []) as any[]) {
    out.push({ type: "return", id: r.id, label: r.return_number, hint: r.email });
  }
  return out;
}

/* --------------------------- dashboard --------------------------- */

export type DashboardPeriod = "today" | "7d" | "30d" | "month" | "last_month" | "year";

export type MetricValue = { value: number; previous: number; change: number | null };

export type DashboardOverview = {
  period: DashboardPeriod;
  from: string;
  to: string;
  revenue: MetricValue;
  orders: MetricValue;
  averageOrderValue: MetricValue;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueYear: number;
  ordersToday: number;
  counts: {
    pending: number;
    paid: number;
    readyToShip: number;
    shipped: number;
    cancelled: number;
    pendingReturns: number;
    failedPayments: number;
    lowStock: number;
    outOfStock: number;
    syncErrors: number;
    openSupport: number;
  };
  series: { day: string; revenue: number; orders: number }[];
  byChannel: { channel: string; revenue: number; orders: number }[];
  byCategory: { name: string; revenue: number }[];
  byBrand: { name: string; revenue: number }[];
  byPaymentMethod: { method: string; orders: number }[];
  topProducts: { id: string; name: string; quantity: number; revenue: number }[];
  slowProducts: { id: string; name: string; sales_count: number; stock_quantity: number }[];
  inventoryValue: number;
  returnRate: number;
  customers: { new: number; returning: number };
  activity: { id: string; type: string; label: string; hint: string | null; at: string }[];
};

function periodRange(period: DashboardPeriod, now = new Date()) {
  const end = new Date(now);
  let start = new Date(now);
  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      start = new Date(now.getTime() - 7 * 86400000);
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 86400000);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { start, end: new Date(now.getFullYear(), now.getMonth(), 1) };
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
  }
  return { start, end };
}

function metric(current: number, previous: number): MetricValue {
  const change =
    previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / previous) * 100;
  return { value: current, previous, change };
}

const CANCELLED = ["cancelled", "refunded"];

/** Stands in for a query the caller may not run, so the shape stays the same. */
const EMPTY = Promise.resolve({ data: [] as any[], error: null }) as any;

/**
 * Dashboard figures, restricted to what the caller may see.
 *
 * `dashboard:view` used to be enough for the whole picture: revenue, customer
 * names and e-mail addresses in the activity feed, failed payments, support
 * load. A content editor holds `dashboard:view`, so a role scoped to product
 * copy was reading the shop's trading position and its customers' details.
 *
 * The queries a role is not entitled to are skipped, so a content editor's
 * dashboard shows catalogue information and nothing that belongs to finance,
 * support or the customer list.
 */
export async function fetchDashboardOverview(
  supabase: Client,
  period: DashboardPeriod,
  access: AdminAccess,
): Promise<DashboardOverview> {
  const may = (module: AdminModule) => can(access, module, "view");
  const mayOrders = may("orders") || may("reports");
  const mayCustomers = may("customers");
  const mayReturns = may("returns");
  const maySupport = may("support");
  const maySync = may("sync") || may("bol");
  const mayInventory = may("inventory") || may("low_stock") || may("products");
  const now = new Date();
  const { start, end } = periodRange(period, now);
  const span = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - span);

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 86400000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [ordersRes, itemsRes, productsRes, returnsRes, supportRes, syncRes, profilesRes] =
    await Promise.all([
      mayOrders
        ? supabase
            .from("orders")
            .select(
              "id, order_number, status, payment_status, payment_method, total, created_at, sales_channel, user_id, email, first_name, last_name",
            )
            .gte("created_at", prevStart.toISOString())
        : EMPTY,
      mayOrders
        ? supabase
            .from("order_items")
            .select("product_id, product_name, quantity, line_total, created_at")
            .gte("created_at", start.toISOString())
        : EMPTY,
      mayInventory
        ? supabase
            .from("products")
            .select(
              "id, name, status, stock_quantity, low_stock_threshold, sales_count, purchase_cost, regular_price, brand_id, category_id, brands ( name ), categories!products_category_id_fkey ( name )",
            )
        : EMPTY,
      mayReturns
        ? supabase.from("returns").select("id, return_number, status, created_at, email")
        : EMPTY,
      maySupport ? supabase.from("contact_messages").select("id, status") : EMPTY,
      maySync ? supabase.from("sync_jobs").select("id, status, channel, created_at") : EMPTY,
      mayCustomers
        ? supabase.from("profiles").select("id, created_at, first_name, last_name, email")
        : EMPTY,
    ]);

  for (const res of [
    ordersRes,
    itemsRes,
    productsRes,
    returnsRes,
    supportRes,
    syncRes,
    profilesRes,
  ]) {
    if (res.error) throw new Error(res.error.message);
  }

  const allOrders = (ordersRes.data ?? []) as any[];
  const products = (productsRes.data ?? []) as any[];
  const items = (itemsRes.data ?? []) as any[];
  const returns = (returnsRes.data ?? []) as any[];
  const support = (supportRes.data ?? []) as any[];
  const syncJobs = (syncRes.data ?? []) as any[];
  const profiles = (profilesRes.data ?? []) as any[];

  const inRange = (o: any, from: Date, to: Date) => {
    const t = new Date(o.created_at).getTime();
    return t >= from.getTime() && t < to.getTime();
  };
  const valid = (o: any) => !CANCELLED.includes(o.status);
  const sum = (rows: any[]) => rows.reduce((s, o) => s + Number(o.total ?? 0), 0);

  const current = allOrders.filter((o) => inRange(o, start, end) && valid(o));
  const previous = allOrders.filter((o) => inRange(o, prevStart, start) && valid(o));

  const revenue = sum(current);
  const prevRevenue = sum(previous);

  const days = Math.min(90, Math.max(1, Math.ceil(span / 86400000)));
  const series = new Map<string, { revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end.getTime() - i * 86400000);
    series.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const o of current) {
    const day = String(o.created_at).slice(0, 10);
    const entry = series.get(day);
    if (entry) {
      entry.revenue += Number(o.total ?? 0);
      entry.orders += 1;
    }
  }

  const groupSum = <T>(rows: any[], key: (row: any) => T) => {
    const map = new Map<T, { revenue: number; orders: number }>();
    for (const row of rows) {
      const k = key(row);
      const entry = map.get(k) ?? { revenue: 0, orders: 0 };
      entry.revenue += Number(row.total ?? 0);
      entry.orders += 1;
      map.set(k, entry);
    }
    return map;
  };

  const channelMap = groupSum(current, (o) => String(o.sales_channel ?? "webshop"));
  const paymentMap = groupSum(current, (o) => String(o.payment_method ?? "onbekend"));

  const productById = new Map(products.map((p) => [p.id, p]));
  const categoryRevenue = new Map<string, number>();
  const brandRevenue = new Map<string, number>();
  const productRevenue = new Map<string, { name: string; quantity: number; revenue: number }>();
  const currentIds = new Set(current.map((o) => o.id));

  for (const item of items) {
    const line = Number(item.line_total ?? 0);
    const product = item.product_id ? productById.get(item.product_id) : null;
    const catName = product?.categories?.name ?? "Overig";
    const brandName = product?.brands?.name ?? "Overig";
    categoryRevenue.set(catName, (categoryRevenue.get(catName) ?? 0) + line);
    brandRevenue.set(brandName, (brandRevenue.get(brandName) ?? 0) + line);
    const key = item.product_id ?? item.product_name;
    const entry = productRevenue.get(key) ?? { name: item.product_name, quantity: 0, revenue: 0 };
    entry.quantity += Number(item.quantity ?? 0);
    entry.revenue += line;
    productRevenue.set(key, entry);
  }

  const inventoryValue = products.reduce(
    (s, p) => s + Number(p.stock_quantity ?? 0) * Number(p.purchase_cost ?? p.regular_price ?? 0),
    0,
  );

  const userOrderCounts = new Map<string, number>();
  for (const o of allOrders) {
    const key = o.user_id ?? o.email;
    if (key) userOrderCounts.set(key, (userOrderCounts.get(key) ?? 0) + 1);
  }
  let newCustomers = 0;
  let returningCustomers = 0;
  for (const o of current) {
    const key = o.user_id ?? o.email;
    if ((userOrderCounts.get(key) ?? 1) > 1) returningCustomers += 1;
    else newCustomers += 1;
  }

  const activity: DashboardOverview["activity"] = [];
  for (const o of allOrders
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6)) {
    activity.push({
      id: o.id,
      type: "order",
      label: `Bestelling ${o.order_number}`,
      hint: `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim() || o.email,
      at: o.created_at,
    });
  }
  for (const r of returns.slice(0, 4)) {
    activity.push({
      id: r.id,
      type: "return",
      label: `Retour ${r.return_number}`,
      hint: r.status,
      at: r.created_at,
    });
  }
  for (const p of profiles
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 4)) {
    activity.push({
      id: p.id,
      type: "customer",
      label: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "Nieuwe klant",
      hint: "Nieuwe klant",
      at: p.created_at,
    });
  }
  for (const j of syncJobs.filter((j) => j.status === "failed").slice(0, 3)) {
    activity.push({
      id: j.id,
      type: "sync",
      label: `Synchronisatie mislukt (${j.channel})`,
      hint: null,
      at: j.created_at,
    });
  }
  activity.sort((a, b) => (a.at < b.at ? 1 : -1));

  const totalOrders = allOrders.length || 1;

  return {
    period,
    from: start.toISOString(),
    to: end.toISOString(),
    revenue: metric(revenue, prevRevenue),
    orders: metric(current.length, previous.length),
    averageOrderValue: metric(
      current.length ? revenue / current.length : 0,
      previous.length ? prevRevenue / previous.length : 0,
    ),
    revenueToday: sum(
      allOrders.filter((o) => valid(o) && inRange(o, startOfDay, new Date(now.getTime() + 1000))),
    ),
    revenueWeek: sum(
      allOrders.filter((o) => valid(o) && inRange(o, startOfWeek, new Date(now.getTime() + 1000))),
    ),
    revenueMonth: sum(
      allOrders.filter((o) => valid(o) && inRange(o, startOfMonth, new Date(now.getTime() + 1000))),
    ),
    revenueYear: sum(
      allOrders.filter((o) => valid(o) && inRange(o, startOfYear, new Date(now.getTime() + 1000))),
    ),
    ordersToday: allOrders.filter((o) => inRange(o, startOfDay, new Date(now.getTime() + 1000)))
      .length,
    counts: {
      pending: allOrders.filter((o) => o.status === "pending").length,
      paid: allOrders.filter((o) => o.status === "paid").length,
      readyToShip: allOrders.filter((o) => ["processing", "packed"].includes(o.status)).length,
      shipped: allOrders.filter((o) => ["shipped", "delivered"].includes(o.status)).length,
      cancelled: allOrders.filter((o) => o.status === "cancelled").length,
      pendingReturns: returns.filter((r) =>
        ["requested", "approved", "received"].includes(r.status),
      ).length,
      failedPayments: allOrders.filter((o) => ["failed", "expired"].includes(o.payment_status))
        .length,
      lowStock: products.filter(
        (p) =>
          Number(p.stock_quantity ?? 0) > 0 &&
          Number(p.stock_quantity ?? 0) <= Number(p.low_stock_threshold ?? 5),
      ).length,
      outOfStock: products.filter((p) => Number(p.stock_quantity ?? 0) <= 0).length,
      syncErrors: syncJobs.filter((j) => j.status === "failed").length,
      openSupport: support.filter((m) => ["new", "open"].includes(m.status)).length,
    },
    series: [...series.entries()].map(([day, v]) => ({ day, ...v })),
    byChannel: [...channelMap.entries()].map(([channel, v]) => ({ channel, ...v })),
    byCategory: [...categoryRevenue.entries()]
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    byBrand: [...brandRevenue.entries()]
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    byPaymentMethod: [...paymentMap.entries()].map(([method, v]) => ({ method, orders: v.orders })),
    topProducts: [...productRevenue.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    slowProducts: products
      .filter((p) => p.status === "active")
      .slice()
      .sort((a, b) => Number(a.sales_count ?? 0) - Number(b.sales_count ?? 0))
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sales_count: Number(p.sales_count ?? 0),
        stock_quantity: Number(p.stock_quantity ?? 0),
      })),
    inventoryValue,
    returnRate: (returns.length / totalOrders) * 100,
    customers: { new: newCustomers, returning: returningCustomers },
    activity: activity.slice(0, 12),
    // currentIds kept for future per-period item filtering
    ...({} as Record<string, never>),
  };
}
