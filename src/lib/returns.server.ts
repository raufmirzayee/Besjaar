import type { SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

export {
  RETURN_REASONS,
  RETURN_STATUSES,
  RETURN_STATUS_LABELS,
  type ReturnStatus,
} from "./admin-labels";
import type { ReturnStatus } from "./admin-labels";

export type ReturnItemRow = {
  id: string;
  order_item_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  item_reason: string | null;
  item_condition: string | null;
};

export type ReturnRow = {
  id: string;
  return_number: string;
  order_id: string;
  order_number: string | null;
  email: string;
  status: ReturnStatus;
  reason: string;
  customer_note: string | null;
  staff_note: string | null;
  refund_amount: number | null;
  tracking_code: string | null;
  requested_at: string;
  received_at: string | null;
  refunded_at: string | null;
  items: ReturnItemRow[];
};

const SELECT = `id, return_number, order_id, email, status, reason, customer_note, staff_note,
  refund_amount, tracking_code, requested_at, received_at, refunded_at,
  orders ( order_number ),
  return_items ( id, order_item_id, product_name, quantity, unit_price, item_reason, item_condition )`;

function mapReturn(row: any): ReturnRow {
  return {
    id: row.id,
    return_number: row.return_number,
    order_id: row.order_id,
    order_number: row.orders?.order_number ?? null,
    email: row.email,
    status: row.status,
    reason: row.reason,
    customer_note: row.customer_note,
    staff_note: row.staff_note,
    refund_amount: row.refund_amount === null ? null : Number(row.refund_amount),
    tracking_code: row.tracking_code,
    requested_at: row.requested_at,
    received_at: row.received_at,
    refunded_at: row.refunded_at,
    items: ((row.return_items ?? []) as any[]).map((i) => ({
      id: i.id,
      order_item_id: i.order_item_id,
      product_name: i.product_name,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price ?? 0),
      item_reason: i.item_reason,
      item_condition: i.item_condition,
    })),
  };
}

export async function fetchMyReturns(supabase: Client, userId: string): Promise<ReturnRow[]> {
  const { data, error } = await supabase
    .from("returns")
    .select(SELECT)
    .eq("user_id", userId)
    .order("requested_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map(mapReturn);
}

export async function fetchAllReturns(supabase: Client, status?: string): Promise<ReturnRow[]> {
  let query = supabase
    .from("returns")
    .select(SELECT)
    .order("requested_at", { ascending: false })
    .limit(200);
  if (status && status !== "alle") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map(mapReturn);
}

export type ReturnableOrder = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    product_id: string | null;
    variant_id: string | null;
    returned_quantity: number;
  }[];
};

/** Orders that are paid/shipped/delivered and still have items left to return. */
export async function fetchReturnableOrders(
  supabase: Client,
  userId: string,
): Promise<ReturnableOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, created_at, status,
       order_items ( id, product_name, quantity, unit_price, product_id, variant_id )`,
    )
    .eq("user_id", userId)
    .in("status", ["paid", "processing", "packed", "shipped", "delivered"])
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  const orders = (data ?? []) as any[];
  if (orders.length === 0) return [];

  const { data: existing, error: existingError } = await supabase
    .from("return_items")
    .select("order_item_id, quantity, returns!inner ( user_id, status )")
    .eq("returns.user_id", userId);
  if (existingError) throw new Error(existingError.message);

  const returnedByItem = new Map<string, number>();
  for (const row of (existing ?? []) as any[]) {
    if (["cancelled", "rejected"].includes(row.returns?.status)) continue;
    returnedByItem.set(
      row.order_item_id,
      (returnedByItem.get(row.order_item_id) ?? 0) + Number(row.quantity),
    );
  }

  return orders
    .map((o) => ({
      id: o.id,
      order_number: o.order_number,
      created_at: o.created_at,
      status: o.status,
      items: ((o.order_items ?? []) as any[]).map((i) => ({
        id: i.id,
        product_name: i.product_name,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price ?? 0),
        product_id: i.product_id ?? null,
        variant_id: i.variant_id ?? null,
        returned_quantity: returnedByItem.get(i.id) ?? 0,
      })),
    }))
    .map((o) => ({ ...o, items: o.items.filter((i) => i.returned_quantity < i.quantity) }))
    .filter((o) => o.items.length > 0);
}

export function makeReturnNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RET-${stamp}-${random}`;
}

export type CreateReturnInput = {
  orderId: string;
  reason: string;
  customerNote?: string | null;
  items: { orderItemId: string; quantity: number }[];
};

export async function createReturn(
  supabase: Client,
  userId: string,
  input: CreateReturnInput,
): Promise<{ return_number: string }> {
  if (!input.items.length) throw new Error("Selecteer minimaal één product om te retourneren");
  if (!input.reason) throw new Error("Kies een reden voor de retour");

  const orders = await fetchReturnableOrders(supabase, userId);
  const order = orders.find((o) => o.id === input.orderId);
  if (!order) throw new Error("Deze bestelling kan niet (meer) geretourneerd worden");

  const lines = input.items.map((sel) => {
    const item = order.items.find((i) => i.id === sel.orderItemId);
    if (!item) throw new Error("Onbekend product in de retouraanvraag");
    const max = item.quantity - item.returned_quantity;
    const qty = Math.floor(Number(sel.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > max) {
      throw new Error(`Aantal voor ${item.product_name} moet tussen 1 en ${max} liggen`);
    }
    return { item, qty };
  });

  const { data: profile } = await supabase
    .from("orders")
    .select("email")
    .eq("id", input.orderId)
    .maybeSingle();

  const returnNumber = makeReturnNumber();
  const { data: created, error } = await supabase
    .from("returns")
    .insert({
      return_number: returnNumber,
      order_id: input.orderId,
      user_id: userId,
      email: (profile as any)?.email ?? "",
      reason: input.reason,
      customer_note: input.customerNote ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: itemsError } = await supabase.from("return_items").insert(
    lines.map(({ item, qty }) => ({
      return_id: (created as any).id,
      order_item_id: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      quantity: qty,
      unit_price: item.unit_price,
    })),
  );
  if (itemsError) throw new Error(itemsError.message);

  return { return_number: returnNumber };
}
