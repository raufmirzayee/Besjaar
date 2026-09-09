import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireRoles } from "./admin.server";
import {
  deleteListing,
  fetchChannelListings,
  fetchConnectionStatus,
  fetchSyncJobs,
  fetchSyncLogs,
  upsertListing,
} from "./bol.server";

export const getBolOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "warehouse",
    ]);
    const [status, listings, jobs, logs] = await Promise.all([
      fetchConnectionStatus(context.supabase),
      fetchChannelListings(context.supabase),
      fetchSyncJobs(context.supabase),
      fetchSyncLogs(context.supabase),
    ]);
    return { status, listings, jobs, logs };
  });

export const saveBolListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id?: string;
      product_id?: string | null;
      ean?: string | null;
      external_offer_id?: string | null;
      channel_price?: number | null;
      price_sync_enabled?: boolean;
      stock_sync_enabled?: boolean;
      is_active?: boolean;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "warehouse",
    ]);
    return upsertListing(context.supabase, data);
  });

export const removeBolListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, ["super_admin", "store_manager"]);
    return deleteListing(context.supabase, data.id);
  });

export const startBolSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobType: "orders" | "stock" | "offers" | "shipments" }) => input)
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "warehouse",
    ]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runSyncJob } = await import("./bol.server");
    return runSyncJob(supabaseAdmin as never, data.jobType, { triggeredBy: context.userId });
  });
