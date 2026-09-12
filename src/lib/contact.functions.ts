import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "./admin-core.server";
import { contactSchema, createContactMessage, type ContactMessage } from "./contact.server";

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator(v.validator(contactSchema))
  .handler(async ({ data }) => {
    // createContactMessage already caps messages per e-mail address per hour.
    // That does nothing about one sender working through a list of addresses,
    // which is what a spam run looks like.
    const { enforceRateLimit } = await import("./rate-limit.server");
    await enforceRateLimit("contact", {
      limit: 5,
      windowSeconds: 3600,
      blockSeconds: 3600,
    });

    return createContactMessage(data);
  });

export const getContactMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    // "all" is this list's no-filter sentinel.
    v.validator(
      z.object({ status: z.union([v.contactStatus, z.literal("all")]).optional() }).strict(),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "support", "view");
    let query = context.supabase
      .from("contact_messages")
      .select(
        "id, name, email, phone, order_number, subject, message, status, staff_note, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data?.status && data.status !== "all") query = query.eq("status", data.status);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as ContactMessage[];
  });

export const setContactMessageStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z.object({ id: v.uuid, status: v.contactStatus, staffNote: v.text(2000).optional() }),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "support", "edit");
    const { error } = await context.supabase
      .from("contact_messages")
      .update({
        status: data.status,
        staff_note: data.staffNote ?? null,
        handled_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
