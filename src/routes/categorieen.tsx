import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductImage } from "@/components/product-image";
import { categories, countByCategory, productsInCategory } from "@/data/catalogue";
import { breadcrumbSchema, jsonLd, seo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/categorieen")({
  head: () =>
    seo({
      title: "Categorieën",
      description:
        "Alle categorieën van Besjaar: kamperen en outdoor, badkamer, persoonlijke verzorging, tuin, keuken, elektronica en meer.",
      path: "/categorieen",
    }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { t } = useI18n();
  const counts = countByCategory();

  return (
    <div className="container-page py-8 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: t("category.title"), path: "/categorieen" },
            ]),
          ),
        }}
      />
      <Breadcrumbs trail={[{ name: "Home", to: "/" }, { name: t("category.title") }]} />

      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t("category.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("category.intro")}</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          // The category's own best-reviewed product supplies the card image,
          // so every tile shows real merchandise rather than an icon.
          const hero = productsInCategory(category.slug).sort(
            (a, b) => b.reviewCount - a.reviewCount,
          )[0];
          return (
            <Link
              key={category.slug}
              to="/categorie/$slug"
              params={{ slug: category.slug }}
              className="group flex gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift"
            >
              <div className="size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-white p-2">
                <ProductImage
                  src={hero?.imageUrl}
                  alt=""
                  width={192}
                  height={192}
                  sizes="96px"
                  className="transition-transform duration-500 ease-brand group-hover:scale-105"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold group-hover:text-primary">
                  {category.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {category.description}
                </p>
                <p className="mt-2 text-xs font-semibold tabular-nums text-muted-foreground">
                  {t("brand.productCount", { count: counts[category.slug] ?? 0 })}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
