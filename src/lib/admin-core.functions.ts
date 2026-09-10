import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  fetchAccess,
  fetchBadges,
  fetchDashboardOverview,
  fetchNotifications,
  globalSearch,
  markNotifications,
  requirePermission,
  type DashboardPeriod,
} from "./admin-core.server";

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => fetchAccess(context.supabase, context.userId));

export const getAdminBadges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await requirePermission(context, "dashboard", "view");
    return fetchBadges(context.supabase, context.userId, access);
  });

export const getAdminNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "dashboard", "view");
    return fetchNotifications(context.supabase, context.userId);
  });

export const readNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z
        .object({ ids: z.array(v.uuid).max(500).nullish() })
        .strict()
        .partial(),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "dashboard", "view");
    return markNotifications(context.supabase, context.userId, data?.ids ?? null);
  });

export const searchAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ term: v.text(120) })))
  .handler(async ({ context, data }) => {
    // The caller's own permissions decide which modules are searched, so
    // dashboard:view no longer doubles as a key to customer and order data.
    const access = await requirePermission(context, "dashboard", "view");
    return globalSearch(context.supabase, data.term, access);
  });

export const getDashboardOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z
        .object({
          period: z.enum(["today", "7d", "30d", "month", "last_month", "year"]).optional(),
        })
        .strict(),
    ),
  )
  .handler(async ({ context, data }) => {
    const access = await requirePermission(context, "dashboard", "view");
    return fetchDashboardOverview(context.supabase, data?.period ?? "30d", access);
  });
