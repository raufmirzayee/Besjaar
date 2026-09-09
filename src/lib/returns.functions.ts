import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireRoles } from "./admin.server";
import {
  createReturn,
  fetchAllReturns,
  fetchMyReturns,
  fetchReturnableOrders,
  type CreateReturnInput,
  type ReturnStatus,
} from "./returns.server";

const STAFF: Parameters<typeof requireRoles>[2] = [
  "super_admin",
  "store_manager",
  "warehouse",
  "customer_service",
];

export const getMyReturns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => fetchMyReturns(context.supabase, context.userId));

export const getReturnableOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => fetchReturnableOrders(context.supabase, context.userId));

export const requestReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CreateReturnInput) => input)
  .handler(async ({ context, data }) => createReturn(context.supabase, context.userId, data));

export const cancelMyReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { returnId: string }) => input)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("returns")
      .update({ status: "cancelled" as never })
      .eq("id", data.returnId)
      .eq("user_id", context.userId)
      .eq("status", "requested");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAdminReturns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: string }) => input ?? {})
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, STAFF);
    return fetchAllReturns(context.supabase, data?.status);
  });

export const updateReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      returnId: string;
      status?: ReturnStatus;
      staffNote?: string | null;
      refundAmount?: number | null;
      trackingCode?: string | null;
      restock?: boolean;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, STAFF);

    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.staffNote !== undefined) patch.staff_note = data.staffNote;
    if (data.refundAmount !== undefined) patch.refund_amount = data.refundAmount;
    if (data.trackingCode !== undefined) patch.tracking_code = data.trackingCode;
    if (data.status === "received") patch.received_at = new Date().toISOString();
    if (data.status === "refunded") patch.refunded_at = new Date().toISOString();

    const { error } = await context.supabase
      .from("returns")
      .update(patch as never)
      .eq("id", data.returnId);
    if (error) throw new Error(error.message);

    if (data.restock && data.status === "received") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: items, error: itemsError } = await supabaseAdmin
        .from("return_items")
        .select("product_id, quantity, product_name")
        .eq("return_id", data.returnId);
      if (itemsError) throw new Error(itemsError.message);

      for (const item of (items ?? []) as { product_id: string | null; quantity: number }[]) {
        if (!item.product_id) continue;
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .maybeSingle();
        const next = Number(product?.stock_quantity ?? 0) + Number(item.quantity);
        await supabaseAdmin
          .from("products")
          .update({ stock_quantity: next, updated_at: new Date().toISOString() })
          .eq("id", item.product_id);
        await supabaseAdmin.from("stock_movements").insert({
          product_id: item.product_id,
          quantity_change: Number(item.quantity),
          reason: "Retour ontvangen",
          reference_type: "return",
          reference_id: data.returnId,
          created_by: context.userId,
        });
      }
    }

    return { ok: true };
  });
