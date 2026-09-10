import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "./admin-core.server";
import {
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminUsers,
  fetchDashboard,
  fetchLowStock,
  fetchMyRoles,
  fetchStockMovements,
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
    await requirePermission(context, "dashboard", "view");
    return fetchDashboard(context.supabase);
  });

export const getAdminProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.searchOnly))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "view");
    return fetchAdminProducts(context.supabase, data?.search);
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.productPatch))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "edit");
    return updateProduct(context.supabase, data);
  });

export const getAdminOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    // "alle" is the no-filter sentinel the admin list sends.
    v.validator(
      z.object({ status: z.union([v.orderStatus, z.literal("alle")]).optional() }).strict(),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "orders", "view");
    return fetchAdminOrders(context.supabase, data?.status);
  });

export const getLowStock = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "low_stock", "view");
    return fetchLowStock(context.supabase);
  });

export const getStockMovements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "stock_movements", "view");
    return fetchStockMovements(context.supabase);
  });

export const adjustStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z.object({
        productId: v.uuid,
        change: v.stockDelta,
        reason: z.enum(["correctie", "supplier_receipt", "stocktake"]).default("correctie"),
        note: v.optionalText(500),
      }),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "stock_movements", "edit");
    if (!Number.isFinite(data.change) || data.change === 0) {
      throw new Error("Voer een aantal in dat niet 0 is");
    }

    const { recordMovement } = await import("./inventory.server");

    // One ledger row; the database trigger applies it. This used to update
    // stock_quantity here as well, so every correction landed twice.
    const stock = await recordMovement({
      productId: data.productId,
      change: data.change,
      reason: data.reason,
      note: data.note ?? null,
      createdBy: context.userId,
    });

    return { stock_quantity: stock };
  });

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "users", "view");
    return fetchAdminUsers(context.supabase);
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ userId: v.uuid, role: v.appRole, grant: z.boolean() })))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "users", "manage_settings");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      if (data.role !== "customer") {
        const { isStaffAccount } = await import("./staff.server");
        if (!(await isStaffAccount(supabaseAdmin, data.userId))) {
          throw new Error(
            "Dit is geen medewerkersaccount. Maak een apart medewerkersaccount aan in plaats van een klant te promoveren.",
          );
        }
      }
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

    // The staff pool comes first: the database refuses a staff role for an
    // account that is not in it.
    const { error: poolError } = await supabaseAdmin.from("staff_accounts").insert({
      user_id: context.userId,
      email: userData?.user?.email ?? null,
      created_by: context.userId,
    });
    if (poolError && !poolError.message.toLowerCase().includes("duplicate")) {
      throw new Error(poolError.message);
    }

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "super_admin" });
    if (insertError) throw new Error(insertError.message);
    return { ok: true };
  });
