import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { effectivePriceOf, isOnSale } from "@/lib/product-filters";
import { seo } from "@/lib/seo";
import { useWishlist } from "@/lib/wishlist";
import { allProductsQuery } from "@/routes/winkel";

export const Route = createFileRoute("/verlanglijst")({
  loader: ({ context }) => context.queryClient.ensureQueryData(allProductsQuery),
  head: () =>
    seo({
      title: "Verlanglijst",
      description: "Bewaar je favoriete Besjaar producten om ze later terug te vinden.",
      path: "/verlanglijst",
      noindex: true,
    }),
  component: WishlistPage,
});

function WishlistPage() {
  const { t } = useI18n();
  const { items, remove } = useWishlist();
  const { addItem, openCart } = useCart();
  const { data: allProducts } = useSuspenseQuery(allProductsQuery);

  // The wishlist stores product ids; resolve them against the live catalogue so
  // a product that has since been removed simply drops out of the list.
  const saved = items
    .map((id) => allProducts.find((product) => product.id === id))
    .filter((product): product is (typeof allProducts)[number] => Boolean(product));

  return (
    <div className="container-page py-8 md:py-10">
      <Breadcrumbs trail={[{ name: "Home", to: "/" }, { name: t("header.wishlist") }]} />

      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t("header.wishlist")}</h1>
        {saved.length > 0 ? (
          <p className="mt-2 text-muted-foreground">
            {t("wishlist.count", { count: saved.length })}
          </p>
        ) : null}
      </header>

      {saved.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-14 text-center shadow-soft">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary">
            <Heart className="size-7 text-primary" aria-hidden="true" />
          </span>
          <p className="mt-5 font-display text-xl font-bold">{t("wishlist.empty")}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {t("wishlist.emptyText")}
          </p>
          <Button className="mt-6" size="lg" asChild>
            <Link to="/winkel">{t("wishlist.emptyCta")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          {saved.map((product) => {
            const price = effectivePriceOf(product);
            const onSale = isOnSale(product);
            const inStock = product.stock_quantity > 0;

            return (
              <li key={product.id} className="flex flex-wrap items-center gap-4 p-4">
                <Link
                  to="/product/$slug"
                  params={{ slug: product.slug }}
                  className="size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-white p-2"
                >
                  <ProductImage
                    src={product.image_url}
                    alt={product.name}
                    width={192}
                    height={192}
                    sizes="96px"
                  />
                </Link>

                <div className="min-w-[12rem] flex-1">
                  {product.brand ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {product.brand}
                    </span>
                  ) : null}
                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    className="block font-semibold leading-snug hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span
                      className={`font-display text-lg font-extrabold tabular-nums ${onSale ? "text-sale" : ""}`}
                    >
                      {formatPrice(price)}
                    </span>
                    {onSale ? (
                      <span className="text-xs text-muted-foreground line-through tabular-nums">
                        {formatPrice(product.regular_price)}
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    disabled={!inStock}
                    onClick={() => {
                      addItem({
                        productId: product.id,
                        slug: product.slug,
                        name: product.name,
                        brand: product.brand,
                        price,
                        compareAtPrice: onSale ? product.regular_price : null,
                        imageUrl: product.image_url,
                        maxQuantity: product.stock_quantity,
                      });
                      toast.success(t("cart.added", { name: product.name }));
                      openCart();
                    }}
                  >
                    <ShoppingBag className="size-4" />
                    {t("wishlist.moveToCart")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("wishlist.remove", { name: product.name })}
                    onClick={() => {
                      void remove(product.id);
                      toast.success(t("wishlist.removed"));
                    }}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
