import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/winkelwagen")({
  head: () => ({
    meta: [
      { title: "Winkelwagen — Besjaar" },
      { name: "description", content: "Bekijk en bewerk de producten in je Besjaar winkelwagen." },
      { property: "og:title", content: "Winkelwagen — Besjaar" },
      { property: "og:description", content: "Bekijk je winkelwagen en reken veilig af." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 4.95;

function CartPage() {
  const { lines, subtotal, setQuantity, removeItem } = useCart();
  const { t } = useI18n();
  const shipping = lines.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{t("cart.title")}</h1>

      {lines.length === 0 ? (
        <div className="mt-10 rounded-2xl border bg-card p-10 text-center shadow-soft">
          <p className="text-muted-foreground">{t("cart.empty")}</p>
          <Button className="mt-6" asChild>
            <Link to="/winkel">{t("cart.continue")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <ul className="divide-y rounded-2xl border bg-card shadow-soft">
            {lines.map((line) => (
              <li key={line.productId} className="flex gap-4 p-4">
                <Link
                  to="/product/$slug"
                  params={{ slug: line.slug }}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface"
                >
                  {line.imageUrl ? (
                    <img
                      src={line.imageUrl}
                      alt={line.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link
                    to="/product/$slug"
                    params={{ slug: line.slug }}
                    className="font-semibold hover:underline"
                  >
                    {line.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(line.price)} {t("cart.each")}
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-3">
                    <div className="flex items-center rounded-lg border">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("cart.less")}
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-sm">{line.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("cart.more")}
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(line.productId)}
                      className="text-muted-foreground"
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> {t("cart.remove")}
                    </Button>
                  </div>
                </div>
                <p className="font-semibold">{formatPrice(line.price * line.quantity)}</p>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold">{t("cart.summary")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("cart.shipping")}</dt>
                <dd>{shipping === 0 ? t("cart.free") : formatPrice(shipping)}</dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex justify-between text-base font-semibold">
              <span>{t("cart.total")}</span>
              <span>{formatPrice(subtotal + shipping)}</span>
            </div>
            {subtotal < FREE_SHIPPING_THRESHOLD ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {t("cart.freeShippingRemaining", {
                  amount: formatPrice(FREE_SHIPPING_THRESHOLD - subtotal),
                })}
              </p>
            ) : null}
            <Button className="mt-6 w-full" size="lg" asChild>
              <Link to="/afrekenen">{t("cart.checkout")}</Link>
            </Button>
            <Button variant="outline" className="mt-2 w-full" asChild>
              <Link to="/winkel">{t("cart.continue")}</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
