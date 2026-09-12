import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "./admin-core.server";
import {
  FULFILMENT_STATUSES,
  RESENDABLE_TEMPLATES,
  type FulfilmentStatus,
  type ResendableTemplate,
} from "./fulfilment";

/** Roles allowed to move an order along. */
const FULFILMENT_ROLES = ["super_admin", "store_manager", "warehouse"] as const;

export const getOrderDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ orderId: v.uuid })))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "orders", "view");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fetchOrderDetail } = await import("./fulfilment.server");
    return fetchOrderDetail(supabaseAdmin, data.orderId);
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z.object({
        orderId: v.uuid,
        status: z.enum(
          FULFILMENT_STATUSES as unknown as [FulfilmentStatus, ...FulfilmentStatus[]],
          {
            message: "Onbekende status",
          },
        ),
        note: v.optionalText(500),
        carrier: v.optionalText(60),
        trackingCode: v.optionalText(100),
        notifyCustomer: z.boolean().default(true),
      }),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "shipments", "edit");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { transitionOrder } = await import("./fulfilment.server");
    return transitionOrder(supabaseAdmin, data, context.userId);
  });

export const resendEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z.object({
        orderId: v.uuid,
        template: z.enum(
          RESENDABLE_TEMPLATES as unknown as [ResendableTemplate, ...ResendableTemplate[]],
          { message: "Onbekende e-mail" },
        ),
      }),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "shipments", "edit");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resendOrderEmail } = await import("./fulfilment.server");
    return resendOrderEmail(supabaseAdmin, data.orderId, data.template);
  });

/** Reports whether transactional email is live, so the admin can say so. */
export const getEmailStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "orders", "view");
    const { isEmailConfigured } = await import("./email.server");
    return { configured: await isEmailConfigured() };
  });
