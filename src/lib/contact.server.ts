import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Vul je naam in.").max(100),
  email: z.string().trim().email("Vul een geldig e-mailadres in.").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  orderNumber: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Vul een onderwerp in.").max(150),
  message: z.string().trim().min(10, "Je bericht is te kort.").max(2000),
  // Anti-spam: hidden field that must stay empty + minimum time on the form.
  company: z.string().max(0).optional().or(z.literal("")),
  elapsedMs: z.number().int().nonnegative().optional(),
});

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  order_number: string | null;
  subject: string;
  message: string;
  status: string;
  staff_note: string | null;
  created_at: string;
};

export type ContactInput = z.infer<typeof contactSchema>;

const MIN_FORM_TIME_MS = 2500;

export async function createContactMessage(input: ContactInput) {
  const parsed = contactSchema.parse(input);

  if (parsed.company) throw new Error("Bericht geweigerd.");
  if (typeof parsed.elapsedMs === "number" && parsed.elapsedMs < MIN_FORM_TIME_MS) {
    throw new Error("Bericht geweigerd: formulier te snel verzonden.");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Simple abuse guard: max 5 messages per e-mail per hour.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("email", parsed.email.toLowerCase())
    .gte("created_at", since);
  if ((count ?? 0) >= 5) {
    throw new Error("Je hebt recent al meerdere berichten gestuurd. Probeer het later opnieuw.");
  }

  const { error } = await supabaseAdmin.from("contact_messages").insert({
    name: parsed.name,
    email: parsed.email.toLowerCase(),
    phone: parsed.phone || null,
    order_number: parsed.orderNumber || null,
    subject: parsed.subject,
    message: parsed.message,
  });
  if (error) throw new Error(error.message);

  return { ok: true as const };
}
