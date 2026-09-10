/**
 * Transactional email.
 *
 * EU consumer law requires the customer to receive confirmation of the
 * contract on a durable medium, so an order confirmation is not optional for a
 * real shop. This module sends it, plus the shipping notification.
 *
 * The provider is pluggable and the whole thing is inert without credentials:
 * with no API key configured nothing is sent, the attempt is recorded in
 * email_log as "skipped", and the caller carries on. An order is never lost
 * because email is down.
 *
 * Required environment variables (see .env.example):
 *   EMAIL_PROVIDER   "resend" (default) or "none" to disable explicitly
 *   RESEND_API_KEY   from resend.com
 *   EMAIL_FROM       verified sender, e.g. "Besjaar <bestellingen@besjaar.nl>"
 *   EMAIL_REPLY_TO   optional, defaults to the store's customer service address
 */

import { storeConfig } from "./store-config";

export type EmailTemplate =
  "order_confirmation" | "payment_received" | "order_shipped" | "order_cancelled";

export type SendResult = {
  sent: boolean;
  skipped: boolean;
  provider: string;
  messageId: string | null;
  error: string | null;
};

function providerName(): string {
  return (process.env.EMAIL_PROVIDER ?? "resend").toLowerCase();
}

export function isEmailConfigured(): boolean {
  if (providerName() === "none") return false;
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Escapes text before it goes into an HTML email body. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const money = (value: number) => euro.format(Number.isFinite(value) ? value : 0);

export type OrderEmailData = {
  orderNumber: string;
  firstName: string;
  email: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: Record<string, unknown>;
  shippingMethodName: string | null;
  carrier?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  paymentPending?: boolean;
};

function layout(title: string, bodyHtml: string): string {
  const origin = storeConfig.origin.replace(/\/$/, "");
  return `<!doctype html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:24px 12px;background:#F6FAFC;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#132A3E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:0 0 20px;">
      <a href="${origin}" style="color:#173B5E;font-size:22px;font-weight:800;text-decoration:none;">Besjaar</a>
    </td></tr>
    <tr><td style="background:#FFFFFF;border:1px solid #DDECF4;border-radius:12px;padding:28px;">
      ${bodyHtml}
    </td></tr>
    <tr><td style="padding:18px 4px;color:#566C82;font-size:12px;line-height:1.6;">
      Vragen over je bestelling? Mail ons op
      <a href="mailto:${esc(storeConfig.email)}" style="color:#24547C;">${esc(storeConfig.email)}</a>.<br>
      Besjaar is een handelsnaam van ${esc(storeConfig.legalEntity)}.
    </td></tr>
  </table>
</body></html>`;
}

function addressBlock(address: Record<string, unknown>): string {
  const line = (key: string) => (address[key] ? esc(String(address[key])) : "");
  const houseNumber = [line("house_number"), line("house_number_addition")]
    .filter(Boolean)
    .join(" ");
  return [
    [line("first_name"), line("last_name")].filter(Boolean).join(" "),
    line("company_name"),
    [line("street"), houseNumber].filter(Boolean).join(" "),
    [line("postal_code"), line("city")].filter(Boolean).join("  "),
    line("country"),
  ]
    .filter(Boolean)
    .join("<br>");
}

function itemsTable(data: OrderEmailData): string {
  const rows = data.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #EDF6FA;">${esc(item.name)}<br>
          <span style="color:#566C82;font-size:13px;">${item.quantity} ×</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #EDF6FA;text-align:right;white-space:nowrap;">${money(item.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:18px 0;">
    ${rows}
    <tr><td style="padding:10px 0 0;color:#566C82;">Subtotaal</td>
        <td style="padding:10px 0 0;text-align:right;">${money(data.subtotal)}</td></tr>
    <tr><td style="padding:4px 0;color:#566C82;">Verzendkosten</td>
        <td style="padding:4px 0;text-align:right;">${data.shippingCost === 0 ? "Gratis" : money(data.shippingCost)}</td></tr>
    <tr><td style="padding:10px 0 0;font-weight:700;border-top:1px solid #DDECF4;">Totaal</td>
        <td style="padding:10px 0 0;text-align:right;font-weight:700;border-top:1px solid #DDECF4;">${money(data.total)}</td></tr>
  </table>
  <p style="color:#566C82;font-size:12px;margin:0;">Alle bedragen zijn inclusief btw.</p>`;
}

/** Builds the subject and HTML for a template. Pure, so it can be unit tested. */
export function renderEmail(
  template: EmailTemplate,
  data: OrderEmailData,
): { subject: string; html: string } {
  const origin = storeConfig.origin.replace(/\/$/, "");
  const orderUrl = `${origin}/bestelling/${encodeURIComponent(data.orderNumber)}?email=${encodeURIComponent(data.email)}`;

  switch (template) {
    case "order_confirmation": {
      // Says only that the order was received. It does not claim payment was
      // taken — that is the payment_received message, sent when the provider
      // confirms it.
      const paymentLine = data.paymentPending
        ? `<p style="margin:0 0 16px;padding:12px;background:#FBF8F2;border-radius:8px;font-size:14px;">
             We hebben je bestelling ontvangen. Zodra je betaling is bevestigd, sturen we je een
             bevestiging en gaan we je pakket klaarmaken.</p>`
        : "";
      return {
        subject: `Bestelling ${data.orderNumber} ontvangen`,
        html: layout(
          `Bestelling ${data.orderNumber}`,
          `<h1 style="margin:0 0 8px;font-size:20px;">Bedankt voor je bestelling, ${esc(data.firstName)}</h1>
           <p style="margin:0 0 16px;color:#566C82;font-size:14px;">
             Je bestelnummer is <strong style="color:#132A3E;">${esc(data.orderNumber)}</strong>.</p>
           ${paymentLine}
           ${itemsTable(data)}
           <h2 style="font-size:15px;margin:22px 0 6px;">Bezorgadres</h2>
           <p style="margin:0;font-size:14px;line-height:1.6;">${addressBlock(data.shippingAddress)}</p>
           ${data.shippingMethodName ? `<p style="margin:10px 0 0;font-size:14px;color:#566C82;">Verzendmethode: ${esc(data.shippingMethodName)}</p>` : ""}
           <p style="margin:22px 0 0;"><a href="${orderUrl}" style="background:#173B5E;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;display:inline-block;font-weight:600;font-size:14px;">Bekijk je bestelling</a></p>
           <p style="margin:22px 0 0;color:#566C82;font-size:12px;line-height:1.6;">
             Je hebt ${storeConfig.returns.days} dagen bedenktijd. Wil je de bestelling annuleren of
             retourneren? Gebruik het <a href="${origin}/herroeping" style="color:#24547C;">modelformulier voor herroeping</a>
             of neem contact met ons op.</p>`,
        ),
      };
    }

    case "payment_received":
      return {
        subject: `Betaling ontvangen voor ${data.orderNumber}`,
        html: layout(
          `Betaling ontvangen`,
          `<h1 style="margin:0 0 8px;font-size:20px;">We hebben je betaling ontvangen</h1>
           <p style="margin:0 0 16px;color:#566C82;font-size:14px;">
             Bestelling <strong style="color:#132A3E;">${esc(data.orderNumber)}</strong> wordt nu klaargemaakt
             voor verzending. Je krijgt bericht zodra het pakket onderweg is.</p>
           ${itemsTable(data)}
           <p style="margin:22px 0 0;"><a href="${orderUrl}" style="background:#173B5E;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;display:inline-block;font-weight:600;font-size:14px;">Bekijk je bestelling</a></p>`,
        ),
      };

    case "order_shipped": {
      const tracking = data.trackingCode
        ? `<p style="margin:0 0 16px;padding:12px;background:#EDF6FA;border-radius:8px;font-size:14px;">
             ${data.carrier ? `${esc(data.carrier)} · ` : ""}Track &amp; trace:
             <strong>${esc(data.trackingCode)}</strong>
             ${data.trackingUrl ? `<br><a href="${esc(data.trackingUrl)}" style="color:#24547C;">Volg je pakket</a>` : ""}
           </p>`
        : "";
      return {
        subject: `Je bestelling ${data.orderNumber} is verzonden`,
        html: layout(
          `Bestelling verzonden`,
          `<h1 style="margin:0 0 8px;font-size:20px;">Je pakket is onderweg</h1>
           <p style="margin:0 0 16px;color:#566C82;font-size:14px;">
             Bestelling <strong style="color:#132A3E;">${esc(data.orderNumber)}</strong> is verzonden.</p>
           ${tracking}
           ${itemsTable(data)}
           <p style="margin:22px 0 0;"><a href="${orderUrl}" style="background:#173B5E;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;display:inline-block;font-weight:600;font-size:14px;">Bekijk je bestelling</a></p>`,
        ),
      };
    }

    case "order_cancelled":
      return {
        subject: `Bestelling ${data.orderNumber} geannuleerd`,
        html: layout(
          `Bestelling geannuleerd`,
          `<h1 style="margin:0 0 8px;font-size:20px;">Je bestelling is geannuleerd</h1>
           <p style="margin:0 0 16px;color:#566C82;font-size:14px;">
             Bestelling <strong style="color:#132A3E;">${esc(data.orderNumber)}</strong> is geannuleerd.
             Is er al betaald, dan storten we het bedrag terug op dezelfde betaalmethode.</p>
           <p style="margin:16px 0 0;color:#566C82;font-size:14px;">
             Vragen? Mail ons op <a href="mailto:${esc(storeConfig.email)}" style="color:#24547C;">${esc(storeConfig.email)}</a>.</p>`,
        ),
      };
  }
}

/**
 * Sends one transactional email and records the attempt.
 *
 * Never throws: a failed send is logged and reported, because losing an order
 * because the mail provider is down would be far worse than a missing email.
 */
export async function sendTransactionalEmail(input: {
  template: EmailTemplate;
  data: OrderEmailData;
  orderId?: string | null;
}): Promise<SendResult> {
  const { subject, html } = renderEmail(input.template, input.data);
  const provider = providerName();
  const recipient = input.data.email;

  const record = async (result: SendResult) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("email_log").insert({
        order_id: input.orderId ?? null,
        recipient,
        template: input.template,
        subject,
        status: result.skipped ? "skipped" : result.sent ? "sent" : "failed",
        provider: result.provider,
        provider_message_id: result.messageId,
        error: result.error,
      });
    } catch (error) {
      console.error("[email] could not write email_log:", error);
    }
    return result;
  };

  if (!isEmailConfigured()) {
    console.warn(
      `[email] ${input.template} for ${recipient} not sent: no email provider configured.`,
    );
    return record({
      sent: false,
      skipped: true,
      provider: provider === "none" ? "none" : "unconfigured",
      messageId: null,
      error: null,
    });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [recipient],
        reply_to: process.env.EMAIL_REPLY_TO ?? storeConfig.email,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      console.error("[email] provider rejected the message:", response.status, detail);
      return record({
        sent: false,
        skipped: false,
        provider: "resend",
        messageId: null,
        error: `HTTP ${response.status}: ${detail}`,
      });
    }

    const body = (await response.json().catch(() => ({}))) as { id?: string };
    return record({
      sent: true,
      skipped: false,
      provider: "resend",
      messageId: body.id ?? null,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[email] send failed:", message);
    return record({
      sent: false,
      skipped: false,
      provider: "resend",
      messageId: null,
      error: message.slice(0, 300),
    });
  }
}

/** Loads an order and shapes it for the email templates. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function orderEmailData(admin: any, orderId: string): Promise<OrderEmailData | null> {
  const { data, error } = await admin
    .from("orders")
    .select(
      `order_number, email, first_name, subtotal, shipping_cost, total, shipping_address,
       shipping_method_name, carrier, tracking_code, tracking_url, payment_status,
       order_items ( product_name, quantity, line_total )`,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    console.error("[email] could not load order", orderId, error?.message);
    return null;
  }

  const row = data as any;
  return {
    orderNumber: String(row.order_number),
    firstName: String(row.first_name ?? ""),
    email: String(row.email),
    items: ((row.order_items ?? []) as any[]).map((item) => ({
      name: String(item.product_name),
      quantity: Number(item.quantity),
      lineTotal: Number(item.line_total),
    })),
    subtotal: Number(row.subtotal),
    shippingCost: Number(row.shipping_cost),
    total: Number(row.total),
    shippingAddress: (row.shipping_address ?? {}) as Record<string, unknown>,
    shippingMethodName: row.shipping_method_name ?? null,
    carrier: row.carrier ?? null,
    trackingCode: row.tracking_code ?? null,
    trackingUrl: row.tracking_url ?? null,
    paymentPending: row.payment_status !== "paid",
  };
}
