import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "./admin-core.server";

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
    await requirePermission(context, "users", "view");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { listStaffAccounts } = await import("./staff.server");
    return listStaffAccounts(supabaseAdmin);
  });

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z.object({
        email: v.email,
        fullName: v.text(120).min(2, "Vul de naam van de medewerker in."),
        role: z.enum(ASSIGNABLE_ROLES as unknown as [string, ...string[]], {
          message: "Kies een geldige rol.",
        }),
        // Staff hold the keys to the shop, so their passwords are held to more
        // than the customer minimum. Not trimmed: spaces are legitimate
        // characters in a passphrase.
        password: z
          .string()
          .min(12, "Kies een wachtwoord van minimaal 12 tekens.")
          .max(200, "Wachtwoord is te lang."),
      }),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "users", "manage_settings");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createStaffAccount } = await import("./staff.server");
    return createStaffAccount(supabaseAdmin, data, context.userId);
  });

export const setStaffAccountActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ userId: v.uuid, active: z.boolean() })))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "users", "manage_settings");
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
  .inputValidator(v.validator(z.object({ userId: v.uuid })))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "users", "manage_settings");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resetStaffMfa } = await import("./staff.server");
    return resetStaffMfa(supabaseAdmin, data.userId);
  });
