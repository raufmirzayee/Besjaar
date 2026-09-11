import { createFileRoute, Link } from "@tanstack/react-router";
import { localeFromHead, localisedSeo } from "@/lib/seo";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Truck } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CARRIER_LABELS } from "@/lib/fulfilment";
import { getOrderByNumber } from "@/lib/checkout.functions";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { safeExternalUrl } from "@/lib/safe-url";
import type { TranslationKey } from "@/lib/translations";

export const Route = createFileRoute("/bestelling/$orderNumber")({
  // `token` is what the payment provider's return link carries: a guest never
  // typed a password, and asking them for the e-mail address they just entered
  // to see the order they just paid for reads like the order went missing.
  validateSearch: z.object({
    email: z.string().optional(),
    token: z.string().optional(),
  }),
  head: (ctx) =>
    localisedSeo("orderConfirmed", {
      path: "/bestelling",
      locale: localeFromHead(ctx),
      noindex: true,
    }),
  component: OrderPage,
});

function OrderPage() {
  const { t } = useI18n();
  const { orderNumber } = Route.useParams();
  const { email, token } = Route.useSearch();
  const hasCredential = Boolean(email) || Boolean(token);

  const { data, isPending } = useQuery({
    queryKey: ["order", orderNumber, email, token],
    queryFn: () =>
      getOrderByNumber({
        data: { orderNumber, email: email ?? undefined, token: token ?? undefined },
      }),
    enabled: hasCredential,
    // The lookup is rate limited, so retrying a refusal only spends the
    // customer's remaining budget.
    retry: false,
  });

  if (!hasCredential) {
    return (
      <Shell title={t("order.notFound")}>
        <p className="text-muted-foreground">{t("order.needEmail")}</p>
      </Shell>
    );
  }

  if (isPending) return <Shell title={t("order.loading")}>{null}</Shell>;
  if (!data) {
    return (
      <Shell title={t("order.notFound")}>
        <p className="text-muted-foreground">{t("order.noMatch", { number: orderNumber })}</p>
      </Shell>
    );
  }

  const address = data.shipping_address;
  // Filled by a warehouse colleague or by a channel import, so it is checked
  // before it becomes a link the customer is invited to click.
  const trackingUrl = safeExternalUrl(data.tracking_url);

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-6 shadow-soft">
          <CheckCircle2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t("order.thanks")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("order.meta", {
                number: data.order_number,
                status: t(statusKey(data.status)),
                payment: data.payment_status === "paid" ? t("order.paid") : data.payment_status,
              })}
            </p>
          </div>
        </div>

        {/* The shipping e-mail carries the tracking code, but a customer who
            deleted it still needs somewhere to find it. */}
        {data.tracking_code ? (
          <div className="mt-6 rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold">{t("order.trackingTitle")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.carrier ? `${carrierLabel(data.carrier)} · ` : ""}
                  <span className="font-medium text-foreground">{data.tracking_code}</span>
                </p>
                {trackingUrl ? (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-primary underline underline-offset-4 hover:text-primary-hover"
                  >
                    {t("order.trackParcel")}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">{t("order.products")}</h2>
          <ul className="mt-4 divide-y">
            {data.items.map((item, index) => (
              <li key={index} className="flex items-center gap-4 py-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity}× {formatPrice(item.unit_price)}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(item.line_total)}</p>
              </li>
            ))}
          </ul>

          <Separator className="my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("checkout.subtotal")}</dt>
              <dd>{formatPrice(data.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {t("order.shippingLine")}{" "}
                {data.shipping_method_name ? `(${data.shipping_method_name})` : ""}
              </dt>
              <dd>
                {data.shipping_cost === 0 ? t("checkout.free") : formatPrice(data.shipping_cost)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("order.vatOf")}</dt>
              <dd>{formatPrice(data.vat_amount)}</dd>
            </div>
          </dl>
          <Separator className="my-4" />
          <div className="flex justify-between text-base font-semibold">
            <span>{t("checkout.total")}</span>
            <span>{formatPrice(data.total)}</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">{t("order.address")}</h2>
          <address className="mt-2 text-sm not-italic text-muted-foreground">
            {address.first_name} {address.last_name}
            <br />
            {address.street} {address.house_number}
            {address.house_number_addition ?? ""}
            <br />
            {address.postal_code} {address.city}
            <br />
            {address.country}
          </address>
        </div>

        <div className="mt-6 flex gap-2">
          <Button asChild>
            <Link to="/winkel">{t("order.keepShopping")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/account">{t("order.myAccount")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

const STATUS_KEYS: Record<string, TranslationKey> = {
  pending: "status.pending",
  paid: "status.paid",
  processing: "status.processing",
  packed: "status.packed",
  shipped: "status.shipped",
  delivered: "status.delivered",
  cancelled: "status.cancelled",
  refunded: "status.refunded",
};

function statusKey(status: string): TranslationKey {
  return STATUS_KEYS[status] ?? "status.pending";
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-soft">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="mt-3">{children}</div>
        <Button className="mt-6" asChild>
          <Link to="/winkel">{t("checkout.toShop")}</Link>
        </Button>
      </div>
    </div>
  );
}

/** Prints "PostNL" rather than the stored "postnl". */
function carrierLabel(carrier: string): string {
  return CARRIER_LABELS[carrier.toLowerCase()] ?? carrier;
}
