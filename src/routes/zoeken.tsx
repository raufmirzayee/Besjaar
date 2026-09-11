import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductListing } from "@/components/product-listing";
import { SiteSearch } from "@/components/site-search";
import { parseListingSearch, type ListingSearch } from "@/lib/listing-search";
import { localeFromHead, seo } from "@/lib/seo";
import { pageSeo } from "@/lib/page-seo";
import { useI18n } from "@/lib/i18n";
import { allProductsQuery } from "@/routes/winkel";

export const Route = createFileRoute("/zoeken")({
  validateSearch: (search: Record<string, unknown>): ListingSearch => parseListingSearch(search),
  loader: ({ context }) => context.queryClient.ensureQueryData(allProductsQuery),
  head: (ctx) => {
    const locale = localeFromHead(ctx);
    const query = (ctx.match.search as ListingSearch).q;
    const copy = pageSeo("search", locale);
    return seo({
      // The query itself is the visitor's own words; only the frame around it
      // needs translating.
      title: query ? `${copy.title}: “${query}”` : copy.title,
      description: copy.description,
      path: "/zoeken",
      locale,
      // Search result pages should not compete with the category pages.
      noindex: true,
    });
  },
  component: SearchPage,
});

function SearchPage() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const { data: allProducts } = useSuspenseQuery(allProductsQuery);

  return (
    <div className="container-page py-8 md:py-10">
      <Breadcrumbs trail={[{ name: "Home", to: "/" }, { name: t("search.resultsTitle") }]} />

      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
          {search.q ? `“${search.q}”` : t("search.resultsTitle")}
        </h1>
        <div className="mt-4 max-w-lg">
          <SiteSearch />
        </div>
      </header>

      {search.q ? (
        <ProductListing products={allProducts} search={search} />
      ) : (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center text-muted-foreground">
          {t("search.hint")}
        </p>
      )}
    </div>
  );
}
