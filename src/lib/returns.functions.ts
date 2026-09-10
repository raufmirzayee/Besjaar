import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAudit, requirePermission } from "./admin-core.server";
import {
  createReturn,
  fetchAllReturns,
  fetchMyReturns,
  fetchReturnableOrders,
  type CreateReturnInput,
  type ReturnStatus,
} from "./returns.server";

export const getMyReturns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => fetchMyReturns(context.supabase, context.userId));

export const getReturnableOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => fetchReturnableOrders(context.supabase, context.userId));

export const requestReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z.object({
        orderId: v.uuid,
        reason: v.text(60).min(2),
        customerNote: v.optionalText(1000),
        items: z
          .array(z.object({ orderItemId: v.uuid, quantity: v.quantity }))
          .min(1, "Kies minimaal één product")
          .max(50),
      }),
    ),
  )
  .handler(async ({ context, data }) => createReturn(context.supabase, context.userId, data));

export const cancelMyReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ returnId: v.uuid })))
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
  .inputValidator(
    // "alle" is the no-filter sentinel the admin list sends; the query layer
    // already knows to ignore it.
    v.validator(
      z.object({ status: z.union([v.returnStatus, z.literal("alle")]).optional() }).strict(),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "returns", "view");
    return fetchAllReturns(context.supabase, data?.status);
  });

export const updateReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z
        .object({
          returnId: v.uuid,
          status: v.returnStatus.optional(),
          staffNote: v.optionalText(1000),
          refundAmount: v.price.nullish(),
          trackingCode: v.optionalText(100),
          restock: z.boolean().optional(),
        })
        .strict(),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "returns", "edit");

    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.staffNote !== undefined) patch.staff_note = data.staffNote;
    if (data.trackingCode !== undefined) patch.tracking_code = data.trackingCode;
    if (data.status === "received") patch.received_at = new Date().toISOString();
    if (data.status === "refunded") patch.refunded_at = new Date().toISOString();

    // refund_amount is deliberately absent from this patch, and from the
    // column-level UPDATE grant on `returns`. Money leaving the business goes
    // through record_refund(), which caps it at what was actually paid and
    // requires returns:refund — a narrower set of roles than returns:edit.
    if (Object.keys(patch).length > 0) {
      const { error } = await context.supabase
        .from("returns")
        .update(patch as never)
        .eq("id", data.returnId);
      if (error) throw new Error(error.message);
    }

    if (data.refundAmount !== undefined && data.refundAmount !== null) {
      await requirePermission(context, "returns", "refund");

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: returnRow, error: returnError } = await supabaseAdmin
        .from("returns")
        .select("order_id, return_number")
        .eq("id", data.returnId)
        .maybeSingle();
      if (returnError) throw new Error(returnError.message);
      const orderId = (returnRow as { order_id?: string } | null)?.order_id;
      if (!orderId) throw new Error("Deze retour hoort niet bij een bestelling.");

      const { error: refundError } = await supabaseAdmin.rpc("record_refund", {
        p_order_id: orderId,
        p_amount: data.refundAmount,
        p_return_id: data.returnId,
        p_reason: `Retour ${(returnRow as { return_number?: string }).return_number ?? ""}`.trim(),
        p_actor: context.userId,
      });
      // The database refuses an amount above what is left to refund. That
      // message names the figures, so it is worth showing rather than
      // replacing with something generic.
      if (refundError) throw new Error(refundError.message);

      await logAudit({
        userId: context.userId,
        userEmail: (context.claims as { email?: string | null } | undefined)?.email ?? null,
        action: "return.refund",
        module: "returns",
        entityType: "return",
        entityId: data.returnId,
        newValue: { amount: data.refundAmount },
      });
    }

    if (data.restock && data.status === "received") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: items, error: itemsError } = await supabaseAdmin
        .from("return_items")
        .select("product_id, quantity, product_name")
        .eq("return_id", data.returnId);
      if (itemsError) throw new Error(itemsError.message);

      const { recordMovement } = await import("./inventory.server");

      for (const item of (items ?? []) as { product_id: string | null; quantity: number }[]) {
        if (!item.product_id) continue;
        // Keyed on the return, so booking the same return in twice — a
        // double-clicked button, or a status set back and forth — restocks
        // once. This used to update the column and insert a movement, which
        // put the goods back on the shelf twice over.
        await recordMovement({
          productId: item.product_id,
          change: Number(item.quantity),
          reason: "return_restocked",
          referenceType: "return",
          referenceId: data.returnId,
          note: "Retour ontvangen",
          createdBy: context.userId,
        });
      }
    }

    return { ok: true };
  });
