import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireRoles } from "./admin.server";

/** Roles a super admin can hand out. "customer" is not one of them. */
const ASSIGNABLE_ROLES = [
  "super_admin",
  "store_manager",
  "warehouse",
  "customer_service",
  "content_editor",
  "financial",
] as const;

export const getStaffAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRoles(context, ["super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { listStaffAccounts } = await import("./staff.server");
    return listStaffAccounts(supabaseAdmin);
  });

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; fullName: string; role: string; password: string }) => {
    const email = String(input?.email ?? "")
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new Error("Vul een geldig e-mailadres in.");
    }
    const fullName = String(input?.fullName ?? "").trim();
    if (fullName.length < 2) throw new Error("Vul de naam van de medewerker in.");
    if (!(ASSIGNABLE_ROLES as readonly string[]).includes(input?.role)) {
      throw new Error("Kies een geldige rol.");
    }
    const password = String(input?.password ?? "");
    if (password.length < 12) {
      // Staff hold the keys to the shop, so their passwords are held to more
      // than the customer minimum.
      throw new Error("Kies een wachtwoord van minimaal 12 tekens.");
    }
    return { email, fullName, role: input.role, password };
  })
  .handler(async ({ context, data }) => {
    await requireRoles(context, ["super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createStaffAccount } = await import("./staff.server");
    return createStaffAccount(supabaseAdmin, data, context.userId);
  });

export const setStaffAccountActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; active: boolean }) => {
    if (!input?.userId) throw new Error("Geen account opgegeven.");
    return { userId: String(input.userId), active: input.active === true };
  })
  .handler(async ({ context, data }) => {
    await requireRoles(context, ["super_admin"]);
    if (data.userId === context.userId && !data.active) {
      // Locking yourself out would leave the shop with no way back in.
      throw new Error("Je kunt je eigen account niet deactiveren.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { setStaffActive } = await import("./staff.server");
    return setStaffActive(supabaseAdmin, data.userId, data.active);
  });

/**
 * Whether the signed-in account belongs to the staff pool. The storefront uses
 * it to send staff away from customer areas rather than letting them hit a
 * database error at checkout.
 */
export const getIsStaffAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isStaffAccount } = await import("./staff.server");
    return { staff: await isStaffAccount(supabaseAdmin, context.userId) };
  });

/**
 * Clears a colleague's authenticators after a lost phone. Super admin only —
 * a self-service reset would let anyone holding the password strip the second
 * factor, which is the thing it exists to stop.
 */
export const resetStaffMfaFactors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input?.userId) throw new Error("Geen account opgegeven.");
    return { userId: String(input.userId) };
  })
  .handler(async ({ context, data }) => {
    await requireRoles(context, ["super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resetStaffMfa } = await import("./staff.server");
    return resetStaffMfa(supabaseAdmin, data.userId);
  });
