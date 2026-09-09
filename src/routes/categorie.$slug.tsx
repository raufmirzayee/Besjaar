import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductListing } from "@/components/product-listing";
import { getCategoryBySlug } from "@/data/catalogue";
import { parseListingSearch, type ListingSearch } from "@/lib/listing-search";
import { breadcrumbSchema, jsonLd, seo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";
import { allProductsQuery } from "@/routes/winkel";

export const Route = createFileRoute("/categorie/$slug")({
  validateSearch: (search: Record<string, unknown>): ListingSearch => parseListingSearch(search),
  loader: async ({ context, params }) => {
    const category = getCategoryBySlug(params.slug);
    if (!category) throw notFound();
    await context.queryClient.ensureQueryData(allProductsQuery);
    return { name: category.name, description: category.description, slug: category.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return seo({
        title: "Categorie niet gevonden",
        description: "Deze categorie bestaat niet.",
        path: "/winkel",
        noindex: true,
      });
    }
    return seo({
      title: loaderData.name,
      description: loaderData.description,
      path: `/categorie/${loaderData.slug}`,
    });
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { t } = useI18n();
  const { slug } = Route.useParams();
  const { name, description } = Route.useLoaderData();
  const { data: allProducts } = useSuspenseQuery(allProductsQuery);
  // The route already scopes to one category, so any category filter in the
  // URL is ignored rather than intersected with it.
  const search = { ...Route.useSearch(), categorie: undefined };

  const products = allProducts.filter((product) => product.category_slug === slug);

  return (
    <div className="container-page py-8 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: t("shop.title"), path: "/winkel" },
              { name, path: `/categorie/${slug}` },
            ]),
          ),
        }}
      />
      <Breadcrumbs
        trail={[{ name: "Home", to: "/" }, { name: t("shop.title"), to: "/winkel" }, { name }]}
      />

      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{name}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </header>

      {/* The category is fixed by the route, so that facet is not offered again. */}
      <ProductListing
        products={products}
        search={search}
        facets={["brand", "price", "availability", "sale"]}
      />
    </div>
  );
}
