import { Link } from "@tanstack/react-router";
import { ShoppingBag, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import type { ProductListItem } from "@/lib/catalog.server";
import { discountPercentage, effectivePrice, formatPrice } from "@/lib/format";
import { localize } from "@/lib/content-i18n";
import { useI18n } from "@/lib/i18n";

export function ProductCard({ product }: { product: ProductListItem }) {
  const { addItem } = useCart();
  const { t, locale } = useI18n();
  const name = localize(product, "name", locale);
  const shortDescription = localize(product, "short_description", locale);
  const brand = localize(
    { translations: product.brand_translations },
    "name",
    locale,
    product.brand ?? "Besjaar",
  );
  const price = effectivePrice(product.regular_price, product.sale_price);
  const discount = discountPercentage(product.regular_price, product.sale_price);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-lift">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-surface"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={name}
            loading="lazy"
            width={1024}
            height={1024}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t("card.noImage")}
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {discount ? <Badge className="bg-sale text-sale-foreground">-{discount}%</Badge> : null}
          {product.bestseller ? (
            <Badge className="bg-accent text-accent-foreground">{t("card.bestseller")}</Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{brand}</p>
        <h3 className="text-base font-semibold leading-snug">
          <Link to="/product/$slug" params={{ slug: product.slug }} className="hover:underline">
            {name}
          </Link>
        </h3>
        {shortDescription ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{shortDescription}</p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold">{formatPrice(price)}</span>
              {discount ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.regular_price)}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {product.stock_quantity > 0 ? (
                <span className="text-success">{t("card.inStock")}</span>
              ) : (
                t("card.soldOut")
              )}
            </p>
          </div>
          <Button
            size="icon"
            aria-label={t("card.addToCart", { name })}
            disabled={product.stock_quantity <= 0}
            onClick={() =>
              addItem({
                productId: product.id,
                slug: product.slug,
                name,
                price,
                imageUrl: product.image_url,
              })
            }
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>

        {product.rating_count > 0 ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {product.rating_average.toFixed(1)} ({product.rating_count})
          </p>
        ) : null}
      </div>
    </article>
  );
}
