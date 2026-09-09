import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/catalog.functions";
import { localize } from "@/lib/content-i18n";
import { useI18n } from "@/lib/i18n";

const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => getCategories(),
});

const featuredQuery = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: () => getProducts({ data: { featured: true, limit: 8 } }),
});

const bestsellerQuery = queryOptions({
  queryKey: ["products", "bestseller"],
  queryFn: () => getProducts({ data: { bestseller: true, limit: 4 } }),
});

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(featuredQuery),
      context.queryClient.ensureQueryData(bestsellerQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Besjaar — Slimme producten voor huis, tuin en onderweg" },
      {
        name: "description",
        content:
          "Ontdek zaklampen, douchekoppen, powerbanks en airstylers van Besjaar, RYNEX en LYNEX. Snel geleverd in NL, BE en DE.",
      },
      { property: "og:title", content: "Besjaar — Slimme producten voor huis, tuin en onderweg" },
      {
        property: "og:description",
        content:
          "Ontdek zaklampen, douchekoppen, powerbanks en airstylers van Besjaar, RYNEX en LYNEX. Snel geleverd in NL, BE en DE.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: featured } = useSuspenseQuery(featuredQuery);
  const { data: bestsellers } = useSuspenseQuery(bestsellerQuery);
  const { t, locale } = useI18n();

  const topLevel = categories.filter((c) => c.parent_id === null);

  return (
    <div>
      <section className="border-b bg-surface">
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
              {t("home.badge")}
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t("home.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/winkel">
                  {t("home.ctaShop")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/categorie/$slug" params={{ slug: "verlichting-en-outdoor" }}>
                  {t("home.ctaLighting")}
                </Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-lift">
            <img
              src="/images/hero.jpg"
              alt={t("home.heroAlt")}
              width={1920}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("home.categories")}</h2>
          <Link to="/winkel" className="text-sm font-medium text-primary hover:underline">
            {t("home.viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {topLevel.map((c) => (
            <Link
              key={c.id}
              to="/categorie/$slug"
              params={{ slug: c.slug }}
              className="group overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-lift"
            >
              <div className="aspect-4/3 overflow-hidden bg-surface">
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={localize(c, "name", locale)}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold">{localize(c, "name", locale)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pb-14">
        <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{t("home.featured")}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="border-y bg-surface py-14">
        <div className="container-page">
          <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{t("home.bestsellers")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
