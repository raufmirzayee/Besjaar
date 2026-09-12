import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "./admin-core.server";
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
    await requirePermission(context, "bol", "view");
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
    v.validator(
      z
        .object({
          id: v.uuid.optional(),
          product_id: v.uuid.nullish(),
          ean: v.optionalText(20),
          external_offer_id: v.optionalText(80),
          channel_price: v.price.nullish(),
          price_sync_enabled: z.boolean().optional(),
          stock_sync_enabled: z.boolean().optional(),
          is_active: z.boolean().optional(),
        })
        .strict(),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "bol", "edit");
    return upsertListing(context.supabase, data);
  });

export const removeBolListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.idOnly))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "bol", "archive");
    return deleteListing(context.supabase, data.id);
  });

export const startBolSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(z.object({ jobType: z.enum(["orders", "stock", "offers", "shipments"]) })),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "sync", "edit");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runSyncJob } = await import("./bol.server");
    return runSyncJob(supabaseAdmin as never, data.jobType, { triggeredBy: context.userId });
  });
