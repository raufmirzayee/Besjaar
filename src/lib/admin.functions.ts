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

export const getAdminProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.searchOnly))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "view");
    return fetchAdminProducts(context.supabase, data?.search);
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

      // Removing the last super admin locks the shop out of user management
      // permanently: only a super admin may call this, and claimFirstAdmin
      // refuses as soon as any staff role exists — so a warehouse account left
      // behind is enough to keep the bootstrap closed too. The way back would
      // be SQL against the production database.
      if (data.role === "super_admin") {
        const { count, error: countError } = await supabaseAdmin
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "super_admin");
        if (countError) throw new Error(countError.message);
        if ((count ?? 0) <= 1) {
          throw new Error(
            "Dit is de laatste super admin. Wijs eerst iemand anders aan voordat je deze rol verwijdert.",
          );
        }
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
 * Gathers the facts `decideFirstAdminClaim` decides on.
 *
 * Shared by the check below and the claim itself, so the button and the action
 * behind it can never disagree about who is allowed.
 */
async function firstAdminDecision(userId: string) {
  const { decideFirstAdminClaim } = await import("./admin-bootstrap");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // The address comes from the verified session, never from the request body.
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (userError) throw new Error(userError.message);

  const { data: existing, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .neq("role", "customer")
    .limit(1);
  if (error) throw new Error(error.message);

  return {
    decision: decideFirstAdminClaim({
      configuredEmail: process.env.ADMIN_BOOTSTRAP_EMAIL,
      callerEmail: userData?.user?.email,
      staffExists: (existing ?? []).length > 0,
    }),
    email: userData?.user?.email ?? null,
  };
}

/**
 * Whether this caller may claim the first admin role.
 *
 * Drawn on for one thing only: whether to offer the button. It answers a plain
 * boolean and never says why not, because "no, because a beheerder already
 * exists" and "no, because you are not the configured address" are two
 * different disclosures to someone who should be seeing an ordinary 404.
 */
export const canClaimFirstAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { decision } = await firstAdminDecision(context.userId);
      return { allowed: decision.allowed };
    } catch (error) {
      // A failure to establish the facts is not a licence to offer the claim.
      console.error("[bootstrap] could not evaluate the first-admin claim:", error);
      return { allowed: false };
    }
  });

/**
 * First-run admin bootstrap. The rule itself lives in `admin-bootstrap.ts`
 * so it is covered by tests; this only gathers the facts it decides on.
 *
 * The very first signed-in user may claim super admin when the shop has no
 * staff member yet AND their address is the one the operator configured.
 * Afterwards this endpoint always refuses.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // The one endpoint in the shop that hands out super admin. It refuses
    // once any staff member exists, but until then it is a guess at one
    // configured address, and an unlimited number of guesses is the whole
    // attack. Fails closed: if the counter cannot be reached, no claim is
    // granted, because "the database is unreachable" must not read as
    // "unlimited attempts".
    const { enforceRateLimit } = await import("./rate-limit.server");
    await enforceRateLimit("admin_bootstrap", {
      limit: 5,
      windowSeconds: 3600,
      blockSeconds: 3600,
      identity: context.userId,
      failClosed: true,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { decision, email } = await firstAdminDecision(context.userId);
    if (!decision.allowed) throw new Error(decision.reason);

    // The staff pool comes first: the database refuses a staff role for an
    // account that is not in it.
    const { error: poolError } = await supabaseAdmin.from("staff_accounts").insert({
      user_id: context.userId,
      email,
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
