import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductListing } from "@/components/product-listing";
import { getAllProducts } from "@/lib/catalog.functions";
import { parseListingSearch, type ListingSearch } from "@/lib/listing-search";
import { breadcrumbSchema, jsonLd, seo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";

export const allProductsQuery = queryOptions({
  queryKey: ["products", "all"],
  queryFn: () => getAllProducts(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/winkel")({
  validateSearch: (search: Record<string, unknown>): ListingSearch => parseListingSearch(search),
  loader: ({ context }) => context.queryClient.ensureQueryData(allProductsQuery),
  head: () =>
    seo({
      title: "Alle producten",
      description:
        "Het volledige Besjaar assortiment: verlichting, badkamer, keuken, elektronica en meer van Besjaar, RYNEX en LYNEX. Filter op categorie, merk en prijs.",
      path: "/winkel",
    }),
  component: ShopPage,
});

function ShopPage() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const { data: products } = useSuspenseQuery(allProductsQuery);

  return (
    <div className="container-page py-8 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: t("shop.title"), path: "/winkel" },
            ]),
          ),
        }}
      />
      <Breadcrumbs trail={[{ name: "Home", to: "/" }, { name: t("shop.title") }]} />

      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t("shop.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("category.intro")}</p>
      </header>

      <ProductListing products={products} search={search} />
    </div>
  );
}
