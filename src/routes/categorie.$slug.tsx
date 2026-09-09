import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/catalog.functions";
import { localize } from "@/lib/content-i18n";
import { useI18n } from "@/lib/i18n";

function categoryProductsQuery(slug: string) {
  return queryOptions({
    queryKey: ["products", "categorie", slug],
    queryFn: () => getProducts({ data: { categorySlugs: [slug] } }),
  });
}

const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => getCategories(),
});

export const Route = createFileRoute("/categorie/$slug")({
  loader: async ({ context, params }) => {
    const categories = await context.queryClient.ensureQueryData(categoriesQuery);
    const category = categories.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    await context.queryClient.ensureQueryData(categoryProductsQuery(params.slug));
    return { name: category.name, description: category.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Categorie niet beschikbaar — Besjaar" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.name} — Besjaar`;
    const description = loaderData.description ?? `Bekijk alle producten in ${loaderData.name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { t, locale } = useI18n();
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const { data: products } = useSuspenseQuery(categoryProductsQuery(slug));
  const { data: categories } = useSuspenseQuery(categoriesQuery);

  const current = categories.find((c) => c.slug === slug);
  const children = categories.filter((c) => c.parent_id === current?.id);
  const name = current ? localize(current, "name", locale) : loaderData.name;
  const description = current
    ? localize(current, "description", locale) || null
    : loaderData.description;

  return (
    <div className="container-page py-10">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          {t("category.home")}
        </Link>
        <span className="px-2">/</span>
        <Link to="/winkel" className="hover:text-primary">
          {t("category.shop")}
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      <h1 className="text-3xl font-bold sm:text-4xl">{name}</h1>
      {description ? <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p> : null}

      {children.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {children.map((c) => (
            <Link
              key={c.id}
              to="/categorie/$slug"
              params={{ slug: c.slug }}
              className="rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              {localize(c, "name", locale)}
            </Link>
          ))}
        </div>
      ) : null}

      {products.length === 0 ? (
        <p className="mt-12 text-muted-foreground">{t("category.empty")}</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
