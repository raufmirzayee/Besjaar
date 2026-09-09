import { Link } from "@tanstack/react-router";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";
import { WishlistButton } from "@/components/wishlist-button";
import { useCart } from "@/lib/cart";
import type { ProductListItem } from "@/lib/catalog.server";
import { discountOf, effectivePriceOf, isOnSale } from "@/lib/product-filters";
import { formatPrice } from "@/lib/format";
import { localize } from "@/lib/content-i18n";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The product card used by every listing.
 *
 * Cards are a fixed shape: square image, brand, two-line name, one spec line,
 * then price and action pinned to the bottom, so a grid stays even whatever the
 * copy length. Badges only appear when the product's own data supports them,
 * and no star rating is shown for products that have review counts but no
 * genuine rating value.
 */
export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductListItem;
  priority?: boolean;
  className?: string;
}) {
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

  const price = effectivePriceOf(product);
  const onSale = isOnSale(product);
  const discount = discountOf(product);
  const inStock = product.stock_quantity > 0;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card",
        "shadow-soft transition-shadow duration-200 ease-brand hover:shadow-lift",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          tabIndex={-1}
          aria-hidden="true"
          className="block h-full w-full p-4"
        >
          <ProductImage
            src={product.image_url}
            alt={name}
            priority={priority}
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 45vw"
            className="transition-transform duration-500 ease-brand group-hover:scale-[1.04]"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {onSale ? <Badge variant="sale">-{discount}%</Badge> : null}
          {product.bestseller ? <Badge variant="bestseller">{t("card.bestseller")}</Badge> : null}
        </div>

        {/* Above the card-wide link overlay, so it stays clickable. */}
        <div className="absolute right-3 top-3 z-10">
          <WishlistButton productId={product.id} productName={name} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 border-t border-border p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {brand}
        </p>

        <h3 className="text-sm font-semibold leading-snug text-foreground">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="line-clamp-2 outline-none after:absolute after:inset-0 after:content-['']"
          >
            {name}
          </Link>
        </h3>

        {shortDescription ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">{shortDescription}</p>
        ) : null}

        {/* Review counts come from the source listing; there is no rating value
            in that data, so the card reports the count without inventing stars. */}
        {product.rating_count > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("card.reviewCount", { count: product.rating_count })}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span
                className={cn(
                  "font-display text-lg font-extrabold tabular-nums",
                  onSale ? "text-sale" : "text-foreground",
                )}
              >
                {formatPrice(price)}
              </span>
              {onSale ? (
                <span className="text-xs text-muted-foreground line-through tabular-nums">
                  {formatPrice(product.regular_price)}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs">
              {inStock ? (
                <>
                  <Check className="size-3 shrink-0 text-success" aria-hidden="true" />
                  <span className="text-success">{t("card.inStock")}</span>
                </>
              ) : (
                <span className="text-muted-foreground">{t("card.soldOut")}</span>
              )}
            </p>
          </div>

          {/* Sits above the card-wide link overlay so it stays clickable. */}
          <Button
            type="button"
            size="icon"
            aria-label={t("card.addToCart", { name })}
            title={t("card.addToCart", { name })}
            disabled={!inStock}
            className="relative z-10 shrink-0"
            onClick={() => {
              addItem({
                productId: product.id,
                slug: product.slug,
                name,
                brand,
                price,
                compareAtPrice: onSale ? product.regular_price : null,
                imageUrl: product.image_url,
                maxQuantity: product.stock_quantity,
              });
              toast.success(t("cart.added", { name }));
            }}
          >
            <ShoppingBag className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

/** Matching skeleton so grids do not jump while products load. */
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="flex flex-1 flex-col gap-2 border-t border-border p-4">
        <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="h-6 w-20 animate-pulse rounded bg-muted" />
          <div className="size-10 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
