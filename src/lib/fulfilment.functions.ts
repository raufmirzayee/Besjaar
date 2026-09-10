import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireRoles } from "./admin.server";
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
  .inputValidator((input: { orderId: string }) => {
    if (!input?.orderId) throw new Error("Geen bestelling opgegeven");
    return { orderId: String(input.orderId) };
  })
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [...FULFILMENT_ROLES, "financial"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fetchOrderDetail } = await import("./fulfilment.server");
    return fetchOrderDetail(supabaseAdmin, data.orderId);
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      orderId: string;
      status: string;
      note?: string;
      carrier?: string;
      trackingCode?: string;
      notifyCustomer?: boolean;
    }) => {
      if (!input?.orderId) throw new Error("Geen bestelling opgegeven");
      if (!(FULFILMENT_STATUSES as readonly string[]).includes(input.status)) {
        throw new Error("Onbekende status");
      }
      return {
        orderId: String(input.orderId),
        status: input.status as FulfilmentStatus,
        note: input.note?.slice(0, 500) ?? null,
        carrier: input.carrier?.slice(0, 60) ?? null,
        trackingCode: input.trackingCode?.slice(0, 100) ?? null,
        notifyCustomer: input.notifyCustomer !== false,
      };
    },
  )
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [...FULFILMENT_ROLES]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { transitionOrder } = await import("./fulfilment.server");
    return transitionOrder(supabaseAdmin, data, context.userId);
  });

export const resendEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; template: string }) => {
    if (!input?.orderId) throw new Error("Geen bestelling opgegeven");
    if (!(RESENDABLE_TEMPLATES as readonly string[]).includes(input.template)) {
      throw new Error("Onbekende e-mail");
    }
    return {
      orderId: String(input.orderId),
      template: input.template as ResendableTemplate,
    };
  })
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [...FULFILMENT_ROLES]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resendOrderEmail } = await import("./fulfilment.server");
    return resendOrderEmail(supabaseAdmin, data.orderId, data.template);
  });

/** Reports whether transactional email is live, so the admin can say so. */
export const getEmailStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRoles(context.supabase, context.userId, [...FULFILMENT_ROLES, "financial"]);
    const { isEmailConfigured } = await import("./email.server");
    return { configured: isEmailConfigured() };
  });
