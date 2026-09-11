import { createFileRoute } from "@tanstack/react-router";

/**
 * Mollie payment webhook.
 *
 * Mollie posts a payment id and nothing else. The status is read back from the
 * Mollie API with the server-side key, so a forged request cannot mark an order
 * as paid — the body is a hint about which payment changed, never a claim about
 * what it changed to.
 *
 * Three things this has to survive, because all three happen in production:
 *
 *   * the same notification arriving several times;
 *   * notifications arriving out of order, so a retried `open` lands after
 *     `paid` — handled by the transition rules in apply_payment_status, which
 *     refuse to move a payment backwards;
 *   * a payment whose reference was never written onto its order, because the
 *     write failed after Mollie had already created the payment — handled by
 *     the order id in the payment's metadata.
 *
 * It answers 200 for anything it has understood, including a stale event.
 * A non-2xx makes Mollie retry, so it is reserved for cases where retrying
 * might actually help.
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

        // Every id here costs a call to the Mollie API, so anyone can spend
        // the shop's provider quota by posting well-formed ids. Keyed on the
        // payment rather than on the caller: Mollie sends every notification
        // in the shop from its own addresses, so a caller limit would throttle
        // real payments on a busy day while leaving a replay of one id cheap.
        // Allows through on a counter failure — Mollie stops retrying, and a
        // dropped notification means an order that was paid for stays unpaid.
        const { enforceRateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
        try {
          await enforceRateLimit("mollie_webhook", {
            limit: 20,
            windowSeconds: 600,
            blockSeconds: 600,
            subject: paymentId,
          });
        } catch (error) {
          if (error instanceof RateLimitError) {
            return new Response("Too Many Requests", {
              status: 429,
              headers: { "retry-after": String(error.retryAfterSeconds) },
            });
          }
          throw error;
        }

        const { fetchPayment, mapPaymentStatus } = await import("@/lib/payments.server");
        const payment = await fetchPayment(paymentId);
        if (!payment) return new Response("Unknown payment", { status: 404 });

        const mapped = mapPaymentStatus(payment.status);
        if (!mapped) {
          // Mollie introduced a status this build does not know. Changing the
          // order on a guess is how a refunded payment used to reset an order
          // to pending, so it changes nothing and says so. 200, because
          // retrying will deliver the same unknown status.
          console.error(
            `[mollie] unrecognised payment status "${payment.status}" for ${paymentId}; order left untouched`,
          );
          return new Response("OK", { status: 200 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Normally the order carries the reference. If attaching it failed
        // after the payment was created, the metadata is the way back.
        type OrderRow = { id: string; order_number: string; total: number };
        let order: OrderRow | null = null;

        const byReference = await supabaseAdmin
          .from("orders")
          .select("id, order_number, total")
          .eq("payment_reference", paymentId)
          .maybeSingle();
        if (byReference.error) {
          console.error("[mollie] order lookup failed:", byReference.error.message);
          return new Response("Server error", { status: 500 });
        }
        order = (byReference.data as OrderRow | null) ?? null;

        if (!order && payment.metadata?.order_id) {
          const byMetadata = await supabaseAdmin
            .from("orders")
            .select("id, order_number, total")
            .eq("id", payment.metadata.order_id)
            .maybeSingle();
          if (byMetadata.error) {
            console.error("[mollie] metadata lookup failed:", byMetadata.error.message);
            return new Response("Server error", { status: 500 });
          }
          order = (byMetadata.data as OrderRow | null) ?? null;
          if (order) {
            console.warn(
              `[mollie] order ${order.order_number} was recovered through payment metadata: its payment reference was never attached. Repairing it now.`,
            );
          }
        }

        if (!order) {
          // Nothing to apply this to. 404 rather than 200: if the order is
          // mid-creation, a retry a minute from now may well find it.
          console.error(`[mollie] no order for payment ${paymentId}`);
          return new Response("Order not found", { status: 404 });
        }

        // The amount is checked before anything is marked paid. A payment for
        // the wrong amount against the right order is not a completed sale.
        if (mapped.payment_status === "paid" && payment.amount) {
          const paid = Number(payment.amount);
          const expected = Number(order.total);
          if (
            Number.isFinite(paid) &&
            Number.isFinite(expected) &&
            Math.abs(paid - expected) > 0.01
          ) {
            console.error(
              `[mollie] amount mismatch on ${order.order_number}: provider says ${paid}, order says ${expected}. Not marking paid.`,
            );
            return new Response("OK", { status: 200 });
          }
        }

        // The transition rules live in the database, next to the row they
        // protect, so a second code path cannot skip them.
        const { data: applied, error: applyError } = await supabaseAdmin.rpc(
          "apply_payment_status",
          {
            p_order_id: order.id,
            p_status: mapped.payment_status,
            p_order_status: mapped.status,
            p_reference: paymentId,
          },
        );
        if (applyError) {
          console.error("[mollie] status transition failed:", applyError.message);
          return new Response("Server error", { status: 500 });
        }

        const result = (Array.isArray(applied) ? applied[0] : applied) as
          { outcome: string; previous: string; current: string } | undefined;
        const outcome = result?.outcome ?? "unknown";

        console.info(
          `[mollie] ${order.order_number} payment=${paymentId} provider=${payment.status} -> ${outcome} (${result?.previous} -> ${result?.current})`,
        );

        if (outcome === "stale") {
          // A retried older notification. Nothing to do, and Mollie must stop
          // resending it.
          return new Response("OK", { status: 200 });
        }
        if (outcome === "unchanged") {
          return new Response("OK", { status: 200 });
        }

        await supabaseAdmin.from("order_status_history").insert({
          order_id: order.id,
          status: mapped.status,
          note: `Betaalstatus bijgewerkt door de betaalprovider: ${payment.status}.`,
        });

        // Tell the customer their payment landed. Best-effort: a mail failure
        // must not make the webhook fail, or Mollie will keep retrying it.
        // Only on the transition into paid, so a later refund event cannot
        // send a second confirmation.
        if (mapped.payment_status === "paid") {
          try {
            const { orderEmailData, sendTransactionalEmail } = await import("@/lib/email.server");
            const data = await orderEmailData(supabaseAdmin, order.id);
            if (data) {
              await sendTransactionalEmail({
                template: "payment_received",
                data,
                orderId: order.id,
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
              order.id,
              "order_cancelled",
              `Betaling ${payment.status} voor bestelling ${order.order_number}`,
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
