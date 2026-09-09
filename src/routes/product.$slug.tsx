import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, Minus, Plus, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductReviews } from "@/components/product-reviews";
import { StarRating } from "@/components/star-rating";
import { WishlistButton } from "@/components/wishlist-button";
import { useCart } from "@/lib/cart";
import { getProductBySlug } from "@/lib/catalog.functions";
import { discountPercentage, effectivePrice, formatPrice } from "@/lib/format";
import { localize } from "@/lib/content-i18n";
import { useI18n } from "@/lib/i18n";

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
    return {
      name: product.name,
      description: product.short_description,
      slug: product.slug,
      brand: product.brand,
      ean: product.ean,
      image: product.images[0] ?? null,
      price: effectivePrice(product.regular_price, product.sale_price),
      inStock: product.stock_quantity > 0,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Product niet beschikbaar — Besjaar" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.name} — Besjaar`;
    const description = loaderData.description ?? `${loaderData.name} bestel je bij Besjaar.`;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: loaderData.name,
      description,
      brand: { "@type": "Brand", name: loaderData.brand ?? "Besjaar" },
      ...(loaderData.ean ? { gtin13: loaderData.ean } : {}),
      offers: {
        "@type": "Offer",
        price: loaderData.price.toFixed(2),
        priceCurrency: "EUR",
        availability: loaderData.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      },
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
      ],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(slug));
  const { addItem } = useCart();
  const { t, locale } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (!data) return null;

  const name = localize(data, "name", locale);
  const shortDescription = localize(data, "short_description", locale);
  const fullDescription = localize(data, "full_description", locale);
  const brand = localize(
    { translations: data.brand_translations },
    "name",
    locale,
    data.brand ?? "Besjaar",
  );
  const categoryName = localize(
    { translations: data.category_translations },
    "name",
    locale,
    data.category,
  );
  const price = effectivePrice(data.regular_price, data.sale_price);
  const discount = discountPercentage(data.regular_price, data.sale_price);
  const inStock = data.stock_quantity > 0;
  const specs = Object.entries(data.specifications ?? {});

  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          {t("product.home")}
        </Link>
        <span className="px-2">/</span>
        {data.category_slug ? (
          <>
            <Link
              to="/categorie/$slug"
              params={{ slug: data.category_slug }}
              className="hover:text-primary"
            >
              {categoryName}
            </Link>
            <span className="px-2">/</span>
          </>
        ) : null}
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-3xl border bg-surface shadow-soft">
            {data.images[activeImage] ? (
              <img
                src={data.images[activeImage]}
                alt={name}
                width={1024}
                height={1024}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-muted-foreground">
                {t("product.noImage")}
              </div>
            )}
          </div>
          {data.images.length > 1 ? (
            <div className="mt-3 flex gap-3">
              {data.images.map((img, index) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(index)}
                  className={`h-20 w-20 overflow-hidden rounded-xl border ${
                    index === activeImage ? "border-primary" : ""
                  }`}
                  aria-label={t("product.image", { index: index + 1 })}
                >
                  <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {brand}
          </p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{name}</h1>

          <a href="#beoordelingen" className="mt-3 inline-flex items-center gap-2 text-sm">
            <StarRating value={data.rating_average} />
            <span className="text-muted-foreground">
              {data.rating_count > 0
                ? t("product.reviewsSummary", {
                    average: data.rating_average.toFixed(1),
                    count: data.rating_count,
                  })
                : t("product.noReviewsYet")}
            </span>
          </a>

          {shortDescription ? (
            <p className="mt-4 text-lg text-muted-foreground">{shortDescription}</p>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-3xl font-bold">{formatPrice(price)}</span>
            {discount ? (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(data.regular_price)}
                </span>
                <Badge className="bg-sale text-sale-foreground">-{discount}%</Badge>
              </>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("product.vatNote")}</p>

          <p className="mt-4 text-sm">
            {inStock ? (
              <span className="font-medium text-success">
                {t("product.inStock", { count: data.stock_quantity })}
              </span>
            ) : (
              <span className="font-medium text-muted-foreground">{t("product.soldOut")}</span>
            )}
          </p>

          {data.selling_points.length > 0 ? (
            <ul className="mt-6 space-y-2">
              {data.selling_points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
          ) : null}

          <Separator className="my-6" />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border">
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("product.less")}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("product.more")}
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="lg"
              className="flex-1 sm:flex-none"
              disabled={!inStock}
              onClick={() => {
                addItem(
                  {
                    productId: data.id,
                    slug: data.slug,
                    name,
                    price,
                    imageUrl: data.images[0] ?? null,
                  },
                  quantity,
                );
                toast.success(t("product.added"));
              }}
            >
              {t("product.addToCart")}
            </Button>
            <WishlistButton productId={data.id} variant="full" />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" /> {t("product.freeFrom")}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RotateCcw className="h-4 w-4 text-primary" /> {t("product.returns")}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {data.warranty_months
                ? t("product.warrantyMonths", { months: data.warranty_months })
                : t("product.warrantyDefault")}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="omschrijving" className="mt-14">
        <TabsList>
          <TabsTrigger value="omschrijving">{t("product.tabDescription")}</TabsTrigger>
          <TabsTrigger value="specificaties">{t("product.tabSpecs")}</TabsTrigger>
          <TabsTrigger value="verzending">{t("product.tabShipping")}</TabsTrigger>
        </TabsList>
        <TabsContent
          value="omschrijving"
          className="max-w-3xl whitespace-pre-line py-6 text-muted-foreground"
        >
          {fullDescription || shortDescription || t("product.noDescription")}
        </TabsContent>
        <TabsContent value="specificaties" className="py-6">
          {specs.length === 0 ? (
            <p className="text-muted-foreground">{t("product.noSpecs")}</p>
          ) : (
            <dl className="max-w-2xl divide-y rounded-xl border">
              {specs.map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
                  <dt className="font-medium">{key}</dt>
                  <dd className="text-muted-foreground">{String(value)}</dd>
                </div>
              ))}
              {data.ean ? (
                <div className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
                  <dt className="font-medium">EAN</dt>
                  <dd className="text-muted-foreground">{data.ean}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </TabsContent>
        <TabsContent value="verzending" className="max-w-3xl py-6 text-muted-foreground">
          <p>{t("product.shippingText")}</p>
        </TabsContent>
      </Tabs>

      <ProductReviews
        slug={data.slug}
        ratingAverage={data.rating_average}
        ratingCount={data.rating_count}
      />
    </div>
  );
}
