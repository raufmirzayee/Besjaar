import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminUsers,
  fetchDashboard,
  fetchLowStock,
  fetchMyRoles,
  fetchStockMovements,
  requireRoles,
  updateProduct,
  type AppRole,
  type ProductPatch,
} from "./admin.server";

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return fetchMyRoles(context.supabase, context.userId);
  });

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "financial",
      "customer_service",
      "warehouse",
      "content_editor",
    ]);
    return fetchDashboard(context.supabase);
  });

export const getAdminProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string }) => input ?? {})
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "content_editor",
      "warehouse",
    ]);
    return fetchAdminProducts(context.supabase, data?.search);
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProductPatch) => input)
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "content_editor",
    ]);
    return updateProduct(context.supabase, data);
  });

export const getAdminOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: string }) => input ?? {})
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "warehouse",
      "customer_service",
      "financial",
    ]);
    return fetchAdminOrders(context.supabase, data?.status);
  });

export const getLowStock = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "warehouse",
    ]);
    return fetchLowStock(context.supabase);
  });

export const getStockMovements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "warehouse",
    ]);
    return fetchStockMovements(context.supabase);
  });

export const adjustStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { productId: string; change: number; reason: string; note?: string | null }) => input,
  )
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "warehouse",
    ]);
    if (!Number.isFinite(data.change) || data.change === 0) {
      throw new Error("Voer een aantal in dat niet 0 is");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: product, error: readError } = await supabaseAdmin
      .from("products")
      .select("stock_quantity")
      .eq("id", data.productId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!product) throw new Error("Product niet gevonden");

    const next = Math.max(0, Number(product.stock_quantity ?? 0) + data.change);
    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({ stock_quantity: next, updated_at: new Date().toISOString() })
      .eq("id", data.productId);
    if (updateError) throw new Error(updateError.message);

    await supabaseAdmin.from("stock_movements").insert({
      product_id: data.productId,
      quantity_change: data.change,
      reason: data.reason,
      reference_type: "manual",
      note: data.note ?? null,
      created_by: context.userId,
    });

    return { stock_quantity: next };
  });

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRoles(context.supabase, context.userId, ["super_admin", "store_manager"]);
    return fetchAdminUsers(context.supabase);
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: AppRole; grant: boolean }) => input)
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, ["super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role as never });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      if (data.userId === context.userId && data.role === "super_admin") {
        throw new Error("Je kunt je eigen super admin rol niet verwijderen");
      }
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/**
 * Bootstrap: the very first signed-in user may claim super admin when the shop
 * has no staff member yet. Afterwards this endpoint always refuses.
 */
/**
 * First-run admin bootstrap. The rule itself lives in `admin-bootstrap.ts`
 * so it is covered by tests; this only gathers the facts it decides on.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { decideFirstAdminClaim } = await import("./admin-bootstrap");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // The address comes from the verified session, never from the request body.
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    if (userError) throw new Error(userError.message);

    const { data: existing, error } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .neq("role", "customer")
      .limit(1);
    if (error) throw new Error(error.message);

    const decision = decideFirstAdminClaim({
      configuredEmail: process.env.ADMIN_BOOTSTRAP_EMAIL,
      callerEmail: userData?.user?.email,
      staffExists: (existing ?? []).length > 0,
    });
    if (!decision.allowed) throw new Error(decision.reason);

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "super_admin" });
    if (insertError) throw new Error(insertError.message);
    return { ok: true };
  });
