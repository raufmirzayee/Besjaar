import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductListing } from "@/components/product-listing";
import { parseListingSearch, type ListingSearch } from "@/lib/listing-search";
import { isOnSale } from "@/lib/product-filters";
import { breadcrumbSchema, jsonLd, seo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";
import { allProductsQuery } from "@/routes/winkel";

export const Route = createFileRoute("/aanbiedingen")({
  validateSearch: (search: Record<string, unknown>): ListingSearch => parseListingSearch(search),
  loader: ({ context }) => context.queryClient.ensureQueryData(allProductsQuery),
  head: () =>
    seo({
      title: "Aanbiedingen",
      description:
        "Producten met een actuele actieprijs bij Besjaar. Elke korting is berekend uit de reguliere prijs van het product zelf.",
      path: "/aanbiedingen",
    }),
  component: DealsPage,
});

function DealsPage() {
  const { t } = useI18n();
  // The page is the sale, so the sale facet is not offered again.
  const search: ListingSearch = { ...Route.useSearch(), sale: undefined };
  const { data: allProducts } = useSuspenseQuery(allProductsQuery);

  // Only products whose regular price is genuinely higher than what they sell
  // for. Nothing is put on this page to manufacture urgency.
  const products = allProducts.filter(isOnSale);

  return (
    <div className="container-page py-8 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: t("deals.title"), path: "/aanbiedingen" },
            ]),
          ),
        }}
      />
      <Breadcrumbs trail={[{ name: "Home", to: "/" }, { name: t("deals.title") }]} />

      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t("deals.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("deals.intro")}</p>
      </header>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center text-muted-foreground">
          {t("deals.empty")}
        </p>
      ) : (
        <ProductListing
          products={products}
          search={{ ...search, sort: search.sort ?? "korting" }}
          facets={["category", "brand", "price"]}
        />
      )}
    </div>
  );
}
