import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductImage } from "@/components/product-image";
import { brands, countByBrand, productsForBrand } from "@/data/catalogue";
import { breadcrumbSchema, jsonLd, seo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/merken/")({
  head: () =>
    seo({
      title: "Merken",
      description:
        "De merken van Besjaar: Besjaar zelf voor huis, badkamer en outdoor, RYNEX voor accessoires en LYNEX voor persoonlijke verzorging.",
      path: "/merken",
    }),
  component: BrandsIndexPage,
});

function BrandsIndexPage() {
  const { t } = useI18n();
  const counts = countByBrand();

  return (
    <div className="container-page py-8 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: t("brand.title"), path: "/merken" },
            ]),
          ),
        }}
      />
      <Breadcrumbs trail={[{ name: "Home", to: "/" }, { name: t("brand.title") }]} />

      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t("brand.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("brand.intro")}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {brands.map((brand) => {
          // Three product shots give each brand card a real face.
          const preview = productsForBrand(brand.slug).slice(0, 3);
          return (
            <Link
              key={brand.slug}
              to="/merken/$slug"
              params={{ slug: brand.slug }}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift"
            >
              <div className="grid grid-cols-3 gap-px bg-border">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={preview[index]?.slug ?? index} className="aspect-square bg-white p-2">
                    <ProductImage
                      src={preview[index]?.imageUrl}
                      alt=""
                      width={240}
                      height={240}
                      sizes="(min-width: 768px) 12vw, 30vw"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-extrabold group-hover:text-primary">
                    {brand.name}
                  </h2>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {t("brand.productCount", { count: counts[brand.slug] ?? 0 })}
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {brand.description}
                </p>
                <span className="mt-4 text-sm font-semibold text-primary group-hover:underline">
                  {t("brand.viewAll", { brand: brand.name })} →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
