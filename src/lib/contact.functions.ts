import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireRoles } from "./admin.server";
import { createContactMessage, type ContactInput, type ContactMessage } from "./contact.server";

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: ContactInput) => input)
  .handler(async ({ data }) => createContactMessage(data));

export const getContactMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: string } | undefined) => input ?? {})
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "customer_service",
    ]);
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
  .inputValidator((input: { id: string; status: string; staffNote?: string }) => input)
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "customer_service",
    ]);
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
