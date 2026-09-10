import { createFileRoute } from "@tanstack/react-router";

/**
 * Mollie payment webhook.
 *
 * Mollie posts only a payment id here; the status is never taken from the
 * request body. The handler reads the payment back from the Mollie API using
 * the server-side key, so a forged request cannot mark an order as paid.
 *
 * Configure the public URL of this endpoint as MOLLIE_WEBHOOK_URL.
 */
export const Route = createFileRoute("/api/public/mollie-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.MOLLIE_API_KEY) {
          // No provider configured: nothing can legitimately arrive here.
          return new Response("Payment provider not configured", { status: 503 });
        }

        let paymentId = "";
        try {
          const form = await request.formData();
          paymentId = String(form.get("id") ?? "");
        } catch {
          try {
            const body = (await request.json()) as { id?: string };
            paymentId = String(body.id ?? "");
          } catch {
            paymentId = "";
          }
        }

        if (!paymentId || !/^tr_[A-Za-z0-9]+$/.test(paymentId)) {
          return new Response("Bad request", { status: 400 });
        }

        const { fetchPayment, mapPaymentStatus } = await import("@/lib/payments.server");
        const payment = await fetchPayment(paymentId);
        if (!payment) return new Response("Unknown payment", { status: 404 });

        const mapped = mapPaymentStatus(payment.status);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: order, error } = await supabaseAdmin
          .from("orders")
          .select("id, order_number, payment_status")
          .eq("payment_reference", paymentId)
          .maybeSingle();

        if (error) {
          console.error("[mollie] order lookup failed:", error.message);
          return new Response("Server error", { status: 500 });
        }
        if (!order) return new Response("Order not found", { status: 404 });

        const row = order as { id: string; order_number: string; payment_status: string };
        // Mollie retries webhooks; applying the same status twice is a no-op.
        if (row.payment_status === mapped.payment_status) {
          return new Response("OK", { status: 200 });
        }

        const { error: updateError } = await supabaseAdmin
          .from("orders")
          .update({ payment_status: mapped.payment_status, status: mapped.status })
          .eq("id", row.id);
        if (updateError) {
          console.error("[mollie] order update failed:", updateError.message);
          return new Response("Server error", { status: 500 });
        }

        await supabaseAdmin.from("order_status_history").insert({
          order_id: row.id,
          status: mapped.status,
          note: `Betaalstatus bijgewerkt door de betaalprovider: ${payment.status}.`,
        });

        // Tell the customer their payment landed. Best-effort: a mail failure
        // must not make the webhook fail, or Mollie will keep retrying it.
        if (mapped.payment_status === "paid") {
          try {
            const { orderEmailData, sendTransactionalEmail } = await import("@/lib/email.server");
            const data = await orderEmailData(supabaseAdmin, row.id);
            if (data) {
              await sendTransactionalEmail({
                template: "payment_received",
                data,
                orderId: row.id,
              });
            }
          } catch (mailError) {
            console.error("[mollie] payment confirmation email failed:", mailError);
          }
        }

        // Any state the payment cannot recover from returns the reservation to
        // stock — failed, cancelled *and* expired. Expiry used to be missing,
        // so every abandoned iDEAL payment held its goods hostage indefinitely.
        //
        // The database keys the release on the order, so Mollie's retries land
        // here repeatedly and only the first one moves anything.
        const { shouldReleaseStock } = await import("@/lib/payment-lifecycle");
        if (shouldReleaseStock(mapped.payment_status)) {
          const { releaseStockForOrder } = await import("@/lib/inventory.server");
          try {
            await releaseStockForOrder(
              row.id,
              "order_cancelled",
              `Betaling ${payment.status} voor bestelling ${row.order_number}`,
            );
          } catch (releaseError) {
            // Never fail the webhook over this, or Mollie retries forever.
            console.error("[mollie] stock release failed:", releaseError);
          }
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});
