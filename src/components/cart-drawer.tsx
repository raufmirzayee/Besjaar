import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductImage } from "@/components/product-image";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

/**
 * Mini cart. Opens when a product is added and from the header cart button.
 * The full cart page at /winkelwagen shows the same lines with more room.
 */
export function CartDrawer() {
  const { lines, itemCount, subtotal, savings, isOpen, closeCart, setQuantity, removeItem } =
    useCart();
  const { t } = useI18n();

  return (
    <Sheet open={isOpen} onOpenChange={(next) => (next ? undefined : closeCart())}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="size-4" aria-hidden="true" />
            {t("cart.title")}
            {itemCount > 0 ? (
              <span className="text-sm font-normal text-muted-foreground">
                (
                {itemCount === 1
                  ? t("cart.itemCountOne")
                  : t("cart.itemCount", { count: itemCount })}
                )
              </span>
            ) : null}
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="size-7 text-primary" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-lg font-bold">{t("cart.empty")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("cart.emptyText")}</p>
            </div>
            <Button asChild onClick={closeCart}>
              <Link to="/winkel">{t("cart.emptyCta")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.productId} className="flex gap-3 py-4">
                  <Link
                    to="/product/$slug"
                    params={{ slug: line.slug }}
                    onClick={closeCart}
                    className="size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-white p-1.5"
                  >
                    <ProductImage src={line.imageUrl} alt={line.name} width={160} height={160} />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    {line.brand ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {line.brand}
                      </span>
                    ) : null}
                    <Link
                      to="/product/$slug"
                      params={{ slug: line.slug }}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-semibold hover:underline"
                    >
                      {line.name}
                    </Link>

                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <div className="flex items-center rounded-lg border border-border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("cart.decrease")}
                          onClick={() => setQuantity(line.productId, line.quantity - 1)}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span
                          aria-label={t("cart.quantity")}
                          className="w-8 text-center text-sm font-semibold tabular-nums"
                        >
                          {line.quantity}
                        </span>
                        <Button
                          type="button"
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

                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold tabular-nums">
                          {formatPrice(line.price * line.quantity)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("cart.remove", { name: line.name })}
                          onClick={() => removeItem(line.productId)}
                        >
                          <Trash2 className="size-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-border bg-surface px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">{t("cart.subtotal")}</span>
                <span className="font-display text-xl font-extrabold tabular-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {savings > 0 ? (
                <p className="mt-1 text-right text-xs font-semibold text-sale">
                  {t("cart.savings")} {formatPrice(savings)}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">{t("cart.shippingNote")}</p>

              <div className="mt-4 grid gap-2">
                <Button asChild size="block" onClick={closeCart}>
                  <Link to="/afrekenen">{t("cart.checkout")}</Link>
                </Button>
                <Button asChild variant="subtle" size="block" onClick={closeCart}>
                  <Link to="/winkelwagen">{t("cart.viewCart")}</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
