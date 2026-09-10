import { createServerFn } from "@tanstack/react-start";

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
    await requirePermission(context, "dashboard", "view");
    return fetchBadges(context.supabase, context.userId);
  });

export const getAdminNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "dashboard", "view");
    return fetchNotifications(context.supabase, context.userId);
  });

export const readNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids?: string[] | null }) => input ?? {})
  .handler(async ({ context, data }) => {
    await requirePermission(context, "dashboard", "view");
    return markNotifications(context.supabase, context.userId, data?.ids ?? null);
  });

export const searchAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { term: string }) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context, "dashboard", "view");
    return globalSearch(context.supabase, data.term);
  });

export const getDashboardOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { period?: DashboardPeriod }) => input ?? {})
  .handler(async ({ context, data }) => {
    await requirePermission(context, "dashboard", "view");
    return fetchDashboardOverview(context.supabase, data?.period ?? "30d");
  });
