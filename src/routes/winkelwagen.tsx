import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { categories } from "@/data/catalogue";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { seo } from "@/lib/seo";
import { storeConfig } from "@/lib/store-config";

export const Route = createFileRoute("/winkelwagen")({
  head: () =>
    seo({
      title: "Winkelwagen",
      description: "Bekijk en bewerk de producten in je Besjaar winkelwagen.",
      path: "/winkelwagen",
      noindex: true,
    }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, savings, setQuantity, removeItem } = useCart();
  const { t } = useI18n();

  const { freeShippingThreshold, rate } = storeConfig.shipping;
  const qualifiesForFreeShipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;
  const shipping = lines.length === 0 || qualifiesForFreeShipping ? 0 : rate;

  return (
    <div className="container-page py-8 md:py-10">
      <Breadcrumbs trail={[{ name: "Home", to: "/" }, { name: t("cart.title") }]} />
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t("cart.title")}</h1>

      {lines.length === 0 ? <EmptyCart /> : null}

      {lines.length > 0 ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-soft">
            {lines.map((line) => (
              <li key={line.productId} className="flex flex-wrap gap-4 p-4">
                <Link
                  to="/product/$slug"
                  params={{ slug: line.slug }}
                  className="size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-white p-2"
                >
                  <ProductImage
                    src={line.imageUrl}
                    alt={line.name}
                    width={192}
                    height={192}
                    sizes="96px"
                  />
                </Link>

                <div className="flex min-w-[12rem] flex-1 flex-col">
                  {line.brand ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {line.brand}
                    </span>
                  ) : null}
                  <Link
                    to="/product/$slug"
                    params={{ slug: line.slug }}
                    className="font-semibold leading-snug hover:underline"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatPrice(line.price)}
                    {line.compareAtPrice && line.compareAtPrice > line.price ? (
                      <span className="ml-2 line-through">{formatPrice(line.compareAtPrice)}</span>
                    ) : null}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                    <div className="flex items-center rounded-lg border border-border">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("cart.decrease")}
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span
                        aria-label={t("cart.quantity")}
                        className="w-9 text-center text-sm font-semibold tabular-nums"
                      >
                        {line.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("cart.increase")}
                        disabled={
                          line.maxQuantity !== undefined && line.quantity >= line.maxQuantity
                        }
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(line.productId)}
                      className="text-muted-foreground"
                    >
                      <Trash2 className="size-4" />
                      {t("cart.remove", { name: "" }).trim()}
                    </Button>
                  </div>
                </div>

                <p className="ml-auto self-start font-display text-lg font-extrabold tabular-nums">
                  {formatPrice(line.price * line.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-32">
            <h2 className="font-display text-lg font-bold">{t("cart.summary")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              {savings > 0 ? (
                <div className="flex justify-between gap-3 text-sale">
                  <dt>{t("cart.savings")}</dt>
                  <dd className="font-semibold tabular-nums">−{formatPrice(savings)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t("cart.shipping")}</dt>
                <dd className="tabular-nums">
                  {shipping === 0 ? t("cart.free") : formatPrice(shipping)}
                </dd>
              </div>
            </dl>

            <Separator className="my-4" />
            <div className="flex justify-between gap-3 text-base font-bold">
              <span>{t("cart.total")}</span>
              <span className="font-display text-xl tabular-nums">
                {formatPrice(subtotal + shipping)}
              </span>
            </div>

            {freeShippingThreshold > 0 && subtotal < freeShippingThreshold ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {t("cart.freeShippingRemaining", {
                  amount: formatPrice(freeShippingThreshold - subtotal),
                })}
              </p>
            ) : null}

            <Button className="mt-5" size="block" asChild>
              <Link to="/afrekenen">
                {t("cart.checkout")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="subtle" size="block" className="mt-2" asChild>
              <Link to="/winkel">{t("cart.continue")}</Link>
            </Button>

            {/* Totals shown here are indicative; checkout recalculates every
                amount server-side from the catalogue before payment. */}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t("cart.shippingNote")}
            </p>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

/** Empty cart: says what happened and offers the next step, not a dead end. */
function EmptyCart() {
  const { t } = useI18n();
  const suggestions = categories.slice(0, 4);

  return (
    <div className="mt-8 rounded-xl border border-border bg-card px-6 py-14 text-center shadow-soft">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary">
        <ShoppingBag className="size-7 text-primary" aria-hidden="true" />
      </span>
      <p className="mt-5 font-display text-xl font-bold">{t("cart.empty")}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t("cart.emptyText")}</p>

      <Button className="mt-6" size="lg" asChild>
        <Link to="/winkel">{t("cart.emptyCta")}</Link>
      </Button>

      <div className="mt-8 border-t border-border pt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t("category.title")}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {suggestions.map((category) => (
            <Link
              key={category.slug}
              to="/categorie/$slug"
              params={{ slug: category.slug }}
              className="rounded-full border border-border-strong px-3 py-1.5 text-sm font-semibold transition-colors hover:border-primary hover:bg-secondary"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
