import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductListing } from "@/components/product-listing";
import { getBrandBySlug } from "@/data/catalogue";
import { parseListingSearch, type ListingSearch } from "@/lib/listing-search";
import { breadcrumbSchema, jsonLd, seo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";
import { allProductsQuery } from "@/routes/winkel";

export const Route = createFileRoute("/merken/$slug")({
  validateSearch: (search: Record<string, unknown>): ListingSearch => parseListingSearch(search),
  loader: async ({ context, params }) => {
    const brand = getBrandBySlug(params.slug);
    if (!brand) throw notFound();
    await context.queryClient.ensureQueryData(allProductsQuery);
    return brand;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return seo({
        title: "Merk niet gevonden",
        description: "Dit merk bestaat niet.",
        path: "/merken",
        noindex: true,
      });
    }
    return seo({
      title: `${loaderData.name} producten`,
      description: loaderData.description,
      path: `/merken/${loaderData.slug}`,
    });
  },
  component: BrandPage,
});

function BrandPage() {
  const { t } = useI18n();
  const brand = Route.useLoaderData();
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
              { name: brand.name, path: `/merken/${brand.slug}` },
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
              { name: brand.name },
            ]}
            tone="dark"
          />
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">
              {t("brand.title")}
            </p>
            <h1 className="mt-2 font-display text-4xl font-extrabold text-white sm:text-5xl">
              {brand.name}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-white/80">{brand.description}</p>
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
