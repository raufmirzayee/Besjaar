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

        // A failed or cancelled payment releases the stock the order reserved.
        if (mapped.payment_status === "failed" || mapped.payment_status === "cancelled") {
          const { data: items } = await supabaseAdmin
            .from("order_items")
            .select("product_id, quantity")
            .eq("order_id", row.id);

          const movements = ((items ?? []) as { product_id: string; quantity: number }[])
            .filter((item) => item.product_id)
            .map((item) => ({
              product_id: item.product_id,
              quantity_change: item.quantity,
              reason: "order_cancelled",
              reference_type: "order",
              reference_id: row.id,
              note: `Betaling mislukt voor bestelling ${row.order_number}`,
            }));
          if (movements.length) {
            await supabaseAdmin.from("stock_movements").insert(movements);
          }
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});
