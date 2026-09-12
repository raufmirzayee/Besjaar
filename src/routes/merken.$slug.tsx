import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductListing } from "@/components/product-listing";
import { getBrandBySlug } from "@/data/catalogue";
import { parseListingSearch, type ListingSearch } from "@/lib/listing-search";
import { breadcrumbSchema, jsonLd, localeFromHead, localisedSeo, seo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";
import { withBrandTranslations } from "@/data/catalogue-translations";
import { localize } from "@/lib/content-i18n";
import { translations } from "@/lib/translations";
import { allProductsQuery } from "@/routes/winkel";

export const Route = createFileRoute("/merken/$slug")({
  validateSearch: (search: Record<string, unknown>): ListingSearch => parseListingSearch(search),
  loader: async ({ context, params }) => {
    const brand = getBrandBySlug(params.slug);
    if (!brand) throw notFound();
    await context.queryClient.ensureQueryData(allProductsQuery);
    // Carried through so `head()` and the page localise from the same source.
    return withBrandTranslations(brand);
  },
  head: (ctx) => {
    const { loaderData } = ctx;
    if (!loaderData) {
      return localisedSeo("notFound", {
        path: "/merken",
        locale: localeFromHead(ctx),
        noindex: true,
      });
    }
    const locale = localeFromHead(ctx);
    // head() runs outside React, so the dictionary is read directly.
    const name = localize(loaderData, "name", locale ?? "nl");
    return seo({
      title: translations[locale ?? "nl"]["brand.productsTitle"].replace("{brand}", name),
      description: localize(loaderData, "description", locale ?? "nl"),
      path: `/merken/${loaderData.slug}`,
      locale,
    });
  },
  component: BrandPage,
});

function BrandPage() {
  const { t, locale } = useI18n();
  const brand = Route.useLoaderData();
  const brandName = localize(brand, "name", locale);
  const brandDescription = localize(brand, "description", locale);
  const { data: allProducts } = useSuspenseQuery(allProductsQuery);
  // The route fixes the brand, so that facet is not offered again.
  const search = { ...Route.useSearch(), merk: undefined };

  const products = allProducts.filter(
    (product) => (product.brand ?? "").toLowerCase() === brand.name.toLowerCase(),
  );

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: t("brand.title"), path: "/merken" },
              { name: brandName, path: `/merken/${brand.slug}` },
            ]),
          ),
        }}
      />

      <div className="brand-band">
        <div className="container-page py-12 md:py-16">
          <Breadcrumbs
            trail={[
              { name: "Home", to: "/" },
              { name: t("brand.title"), to: "/merken" },
              { name: brandName },
            ]}
            tone="dark"
          />
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">
              {t("brand.title")}
            </p>
            <h1 className="mt-2 font-display text-4xl font-extrabold text-white sm:text-5xl">
              {brandName}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-white/80">{brandDescription}</p>
            <p className="mt-4 text-sm font-semibold text-white/70">
              {t("brand.productCount", { count: products.length })}
            </p>
          </div>
        </div>
      </div>

      <div className="container-page py-8 md:py-10">
        <ProductListing
          products={products}
          search={search}
          facets={["category", "price", "availability", "sale"]}
        />
      </div>
    </div>
  );
}
