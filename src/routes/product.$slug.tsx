import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, ExternalLink, Minus, Plus, RotateCcw, ShieldCheck, Truck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { ProductReviews } from "@/components/product-reviews";
import { WishlistButton } from "@/components/wishlist-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProductByProductId, getProductBySlug as catalogueBySlug } from "@/data/catalogue";
import { useCart } from "@/lib/cart";
import { getProductBySlug } from "@/lib/catalog.functions";
import { formatPrice } from "@/lib/format";
import { localize } from "@/lib/content-i18n";
import { useI18n } from "@/lib/i18n";
import { discountOf, effectivePriceOf, isOnSale } from "@/lib/product-filters";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { translations } from "@/lib/translations";
import { safeExternalUrl } from "@/lib/safe-url";
import {
  absoluteUrl,
  breadcrumbSchema,
  jsonLd,
  localeFromHead,
  localisedSeo,
  seo,
} from "@/lib/seo";
import { storeConfig } from "@/lib/store-config";
import { cn } from "@/lib/utils";
import { allProductsQuery } from "@/routes/winkel";

function productQuery(slug: string) {
  return queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });
}

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!product) throw notFound();
    await context.queryClient.ensureQueryData(allProductsQuery);
    return {
      // Carried so head() localises from the same source the page does. The
      // title used to be the Dutch name while the heading under it was
      // English, which is the version a search engine indexes.
      translations: product.translations ?? null,
      name: product.name,
      description: product.short_description,
      slug: product.slug,
      brand: product.brand,
      category: product.category,
      categorySlug: product.category_slug,
      productId: product.product_id,
      ean: product.ean,
      image: product.images[0] ?? null,
      price: effectivePriceOf(product),
      regularPrice: product.regular_price,
      onSale: isOnSale(product),
      inStock: product.stock_quantity > 0,
    };
  },
  head: (ctx) => {
    const { loaderData } = ctx;
    if (!loaderData) {
      return localisedSeo("notFound", {
        path: "/winkel",
        locale: localeFromHead(ctx),
        noindex: true,
      });
    }

    // head() runs outside React, so the dictionary is read directly rather
    // than through the hook. A product with no description of its own would
    // otherwise get a Dutch meta description in every language.
    const locale = localeFromHead(ctx) ?? "nl";
    const name = localize(loaderData, "name", locale, loaderData.name);
    const description =
      localize(loaderData, "short_description", locale, loaderData.description) ||
      translations[locale]["pdp.metaFallback"]
        .replace("{name}", name)
        .replace("{brand}", loaderData.brand ?? "Besjaar");

    /**
     * Product schema. AggregateRating is deliberately absent: the catalogue
     * carries review counts but no rating value, and inventing a score for
     * rich results would be fabricating data.
     */
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description,
      sku: loaderData.productId ?? undefined,
      brand: { "@type": "Brand", name: loaderData.brand ?? "Besjaar" },
      ...(loaderData.image ? { image: [loaderData.image] } : {}),
      ...(loaderData.ean ? { gtin13: loaderData.ean } : {}),
      offers: {
        "@type": "Offer",
        url: absoluteUrl(`/product/${loaderData.slug}`),
        price: loaderData.price.toFixed(2),
        priceCurrency: "EUR",
        itemCondition: "https://schema.org/NewCondition",
        availability: loaderData.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "Besjaar" },
      },
    };

    const meta = seo({
      title: name,
      description,
      path: `/product/${loaderData.slug}`,
      image: loaderData.image,
      type: "product",
    });

    return {
      ...meta,
      scripts: [
        { type: "application/ld+json", children: jsonLd(productSchema) },
        {
          type: "application/ld+json",
          children: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/winkel" },
              ...(loaderData.category && loaderData.categorySlug
                ? [{ name: loaderData.category, path: `/categorie/${loaderData.categorySlug}` }]
                : []),
              { name: loaderData.name, path: `/product/${loaderData.slug}` },
            ]),
          ),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { t, locale } = useI18n();
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const { data: allProducts } = useSuspenseQuery(allProductsQuery);
  const { addItem, openCart } = useCart();
  const { record, slugs: recentSlugs } = useRecentlyViewed();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (product) record(product.slug);
    setQuantity(1);
    setActiveImage(0);
  }, [product, record]);

  if (!product) return null;

  // The supplier feed fills source_url, so it is somebody else's text in an
  // href. React escapes the text it renders but not the addresses it links to.
  const sourceUrl = safeExternalUrl(product.source_url);

  const name = localize(product, "name", locale);
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
  const images = product.images.length ? product.images : [product.image_url].filter(Boolean);
  const specs = Object.entries(product.specifications ?? {});
  const highlights = product.selling_points?.length ? product.selling_points : product.highlights;

  // Related products: same category, then same brand, then well-reviewed
  // elsewhere. Deterministic, never random.
  const related = (() => {
    const seen = new Set([product.slug]);
    const picked: typeof allProducts = [];
    const take = (items: typeof allProducts) => {
      for (const item of items) {
        if (picked.length >= 4) return;
        if (seen.has(item.slug)) continue;
        seen.add(item.slug);
        picked.push(item);
      }
    };
    take(
      allProducts
        .filter((p) => p.category_slug === product.category_slug)
        .sort(
          (a, b) => Math.abs(effectivePriceOf(a) - price) - Math.abs(effectivePriceOf(b) - price),
        ),
    );
    take(allProducts.filter((p) => p.brand === product.brand));
    take([...allProducts].sort((a, b) => b.rating_count - a.rating_count));
    return picked;
  })();

  const recentlyViewed = recentSlugs
    .filter((s) => s !== product.slug)
    .map((s) => allProducts.find((p) => p.slug === s))
    .filter((p): p is (typeof allProducts)[number] => Boolean(p))
    .slice(0, 4);

  const addToCart = () => {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name,
        brand,
        price,
        compareAtPrice: onSale ? product.regular_price : null,
        imageUrl: images[0] ?? null,
        maxQuantity: product.stock_quantity,
      },
      quantity,
    );
    toast.success(t("cart.added", { name }));
  };

  return (
    <div className="pb-24 lg:pb-0">
      <div className="container-page pt-6">
        <Breadcrumbs
          trail={[
            { name: "Home", to: "/" },
            { name: t("shop.title"), to: "/winkel" },
            ...(product.category && product.category_slug
              ? [
                  {
                    name: product.category,
                    to: "/categorie/$slug",
                    params: { slug: product.category_slug },
                  },
                ]
              : []),
            { name },
          ]}
        />
      </div>

      <div className="container-page grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery ------------------------------------------------------- */}
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white">
            <button
              type="button"
              onClick={() => images.length > 0 && setLightboxOpen(true)}
              aria-label={t("pdp.zoom")}
              className="block aspect-square w-full cursor-zoom-in p-6"
            >
              <ProductImage
                src={images[activeImage] ?? null}
                alt={`${name} — ${t("pdp.gallery")} ${activeImage + 1}`}
                priority
                width={1000}
                height={1000}
                sizes="(min-width: 1024px) 46vw, 92vw"
              />
            </button>

            <div className="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-1.5">
              {onSale ? <Badge variant="sale">-{discount}%</Badge> : null}
              {product.bestseller ? (
                <Badge variant="bestseller">{t("card.bestseller")}</Badge>
              ) : null}
            </div>
          </div>

          {images.length > 1 ? (
            <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {images.map((image, index) => (
                <li key={image ?? index}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`${t("pdp.gallery")} ${index + 1}`}
                    aria-current={index === activeImage}
                    className={cn(
                      "size-20 overflow-hidden rounded-lg border-2 bg-white p-1.5 transition-colors",
                      index === activeImage ? "border-primary" : "border-border hover:border-input",
                    )}
                  >
                    <ProductImage src={image} alt="" width={160} height={160} sizes="80px" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Buy box ------------------------------------------------------- */}
        <div className="lg:py-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {product.brand ? (
              <Link
                to="/merken/$slug"
                params={{ slug: product.brand.toLowerCase() }}
                className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
              >
                {brand}
              </Link>
            ) : null}
            {product.product_id ? (
              <span className="text-xs text-muted-foreground">
                {t("pdp.articleNumber")} {product.product_id}
              </span>
            ) : null}
          </div>

          <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            {name}
          </h1>

          {/* Review counts come from the original listing and carry no rating
              value, so no star score is shown or implied. */}
          {product.rating_count > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("card.reviewCount", { count: product.rating_count })}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={cn(
                "font-display text-3xl font-extrabold tabular-nums",
                onSale ? "text-sale" : "text-foreground",
              )}
            >
              {formatPrice(price)}
            </span>
            {onSale ? (
              <>
                <span className="text-base text-muted-foreground line-through tabular-nums">
                  {formatPrice(product.regular_price)}
                </span>
                <Badge variant="sale">-{discount}%</Badge>
              </>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("pdp.vat")}</p>

          <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold">
            {inStock ? (
              <>
                <Check className="size-4 text-success" aria-hidden="true" />
                <span className="text-success">{product.availability ?? t("card.inStock")}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{t("card.soldOut")}</span>
            )}
          </p>

          {highlights.length > 0 ? (
            <ul className="mt-5 space-y-1.5 border-t border-border pt-5">
              {highlights.slice(0, 4).map((point) => (
                <li key={point} className="flex gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-input">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("cart.decrease")}
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <label htmlFor="qty" className="sr-only">
                {t("pdp.quantity")}
              </label>
              <input
                id="qty"
                type="number"
                inputMode="numeric"
                min={1}
                max={Math.max(product.stock_quantity, 1)}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Math.min(
                      Math.max(1, Number(event.target.value) || 1),
                      Math.max(product.stock_quantity, 1),
                    ),
                  )
                }
                className="w-12 border-0 bg-transparent text-center text-sm font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("cart.increase")}
                disabled={quantity >= product.stock_quantity}
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>

            <Button
              type="button"
              size="lg"
              disabled={!inStock}
              onClick={addToCart}
              className="flex-1 sm:flex-none sm:px-10"
            >
              {t("pdp.addToCart")}
            </Button>
            <WishlistButton productId={product.id} productName={name} variant="full" />
          </div>

          <Button
            type="button"
            variant="subtle"
            size="lg"
            disabled={!inStock}
            onClick={() => {
              addToCart();
              navigate({ to: "/afrekenen" });
            }}
            className="mt-3 w-full sm:w-auto sm:px-10"
          >
            {t("pdp.buyNow")}
          </Button>

          <ul className="mt-7 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
            {[
              { icon: Truck, label: t("home.trustShipping"), text: t("home.trustShippingText") },
              {
                icon: RotateCcw,
                label: t("home.trustReturns"),
                text: t("home.trustReturnsText"),
              },
              {
                icon: ShieldCheck,
                label: t("home.trustSecure"),
                text: t("home.trustSecureText"),
              },
            ].map(({ icon: Icon, label, text }) => (
              <li key={label} className="flex gap-2">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold">{label}</p>
                  <p className="text-xs text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detail sections ------------------------------------------------- */}
      <div className="container-page mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        <div>
          <Accordion type="multiple" defaultValue={["specs", "description"]}>
            {specs.length > 0 ? (
              <AccordionItem value="specs">
                <AccordionTrigger headingLevel={2} className="text-base font-bold">
                  {t("pdp.specifications")}
                </AccordionTrigger>
                <AccordionContent>
                  <dl className="divide-y divide-border">
                    {specs.map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-4 py-2.5 text-sm">
                        <dt className="text-muted-foreground">{key}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            ) : null}

            {product.full_description ? (
              <AccordionItem value="description">
                <AccordionTrigger headingLevel={2} className="text-base font-bold">
                  {t("pdp.fullTitle")}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-foreground">
                    {product.full_description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{t("pdp.fullTitleNote")}</p>
                  {sourceUrl ? (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      Originele productvermelding
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            ) : null}

            <AccordionItem value="shipping">
              <AccordionTrigger headingLevel={2} className="text-base font-bold">
                {t("pdp.shipping")} &amp; {t("pdp.returns")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("product.shippingText")}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    to="/verzending"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {t("footer.shipping")}
                  </Link>
                  <Link
                    to="/retouren"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {t("footer.returnsLink")}
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <aside>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display text-base font-bold">{t("pdp.availability")}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t("filters.brand")}</dt>
                <dd className="font-semibold">{brand}</dd>
              </div>
              {product.category ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("filters.category")}</dt>
                  <dd className="font-semibold">{product.category}</dd>
                </div>
              ) : null}
              {product.product_id ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("pdp.articleNumber")}</dt>
                  <dd className="font-mono text-xs font-semibold">{product.product_id}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t("pdp.warranty")}</dt>
                <dd className="font-semibold">
                  {t("pdp.warrantyValue", {
                    months: product.warranty_months ?? storeConfig.warranty.months,
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {/* Reviews --------------------------------------------------------- */}
      <div className="container-page mt-12">
        {product.rating_count > 0 ? (
          <p className="mb-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
            {t("pdp.reviewsNote", { count: product.rating_count })}
          </p>
        ) : null}
        <ProductReviews slug={product.slug} ratingAverage={0} ratingCount={0} />
      </div>

      {related.length > 0 ? (
        <section className="container-page mt-14">
          <h2 className="mb-5 font-display text-2xl font-extrabold">{t("pdp.related")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      {recentlyViewed.length > 0 ? (
        <section className="container-page mt-14">
          <h2 className="mb-5 font-display text-2xl font-extrabold">{t("recent.title")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {recentlyViewed.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Sticky mobile buy bar. Sits above the safe-area inset so it clears
          the browser chrome, and only on small screens. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-pop backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{name}</p>
            <p
              className={cn(
                "font-display text-lg font-extrabold tabular-nums",
                onSale ? "text-sale" : "text-foreground",
              )}
            >
              {formatPrice(price)}
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            disabled={!inStock}
            onClick={() => {
              addToCart();
              openCart();
            }}
            className="shrink-0"
          >
            {t("pdp.addToCart")}
          </Button>
        </div>
      </div>

      {lightboxOpen ? (
        <Lightbox
          src={images[activeImage] ?? null}
          alt={name}
          onClose={() => setLightboxOpen(false)}
          label={t("pdp.closeZoom")}
        />
      ) : null}
    </div>
  );
}

/** Minimal image lightbox: Escape closes, focus starts on the close button. */
function Lightbox({
  src,
  alt,
  onClose,
  label,
}: {
  src: string | null;
  alt: string;
  onClose: () => void;
  label: string;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-100 flex items-center justify-center bg-navy-deep/90 p-4"
      onClick={onClose}
    >
      <Button
        type="button"
        variant="subtle"
        size="icon"
        aria-label={label}
        autoFocus
        onClick={onClose}
        className="absolute right-4 top-4"
      >
        <X className="size-5" />
      </Button>
      <div
        className="max-h-full w-full max-w-3xl rounded-2xl bg-white p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <ProductImage src={src} alt={alt} width={1400} height={1400} priority />
      </div>
    </div>
  );
}
