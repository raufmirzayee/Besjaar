import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import {
  brands,
  categories,
  countByBrand,
  countByCategory,
  products as catalogueProducts,
  productsInCategory,
} from "@/data/catalogue";
import type { ProductListItem } from "@/lib/catalog.server";
import { useI18n } from "@/lib/i18n";
import { CATEGORY_THEMES } from "@/lib/navigation";
import { discountOf, isOnSale } from "@/lib/product-filters";
import { jsonLd, organizationSchema, localeFromHead, localisedSeo, webSiteSchema } from "@/lib/seo";
import type { TranslationKey } from "@/lib/translations";
import { allProductsQuery } from "@/routes/winkel";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(allProductsQuery),
  head: (ctx) => localisedSeo("home", { path: "/", locale: localeFromHead(ctx) }),
  component: HomePage,
});

function HomePage() {
  const { t } = useI18n();
  const { data: allProducts } = useSuspenseQuery(allProductsQuery);

  const bestsellers = allProducts.filter((p) => p.bestseller).slice(0, 8);
  const deals = allProducts
    .filter(isOnSale)
    .sort((a, b) => discountOf(b) - discountOf(a))
    .slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(webSiteSchema()) }}
      />

      <Hero />
      <TrustStrip />
      <CategoryGrid />

      {bestsellers.length > 0 ? (
        <ProductSection
          title={t("home.bestsellersTitle")}
          text={t("home.bestsellersText")}
          to="/winkel"
          products={bestsellers}
        />
      ) : null}

      <EditorialSections />

      {deals.length > 0 ? (
        <ProductSection
          title={t("home.dealsTitle")}
          text={t("home.dealsText")}
          to="/aanbiedingen"
          products={deals}
          tone="surface"
        />
      ) : null}

      <BrandSection />
    </>
  );
}

function Hero() {
  const { t } = useI18n();

  const stats = [
    { value: catalogueProducts.length, label: t("home.heroStatProducts") },
    { value: categories.length, label: t("home.heroStatCategories") },
    { value: brands.length, label: t("home.heroStatBrands") },
  ];

  return (
    <section className="border-b border-border bg-ice">
      <div className="container-page grid items-center gap-8 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
        <div>
          <p className="inline-flex rounded-full border border-border-strong bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
            {t("home.heroEyebrow")}
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("home.heroText")}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/winkel">
                {t("home.heroPrimary")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/aanbiedingen">{t("home.heroSecondary")}</Link>
            </Button>
          </div>

          <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="font-display text-2xl font-extrabold tabular-nums text-foreground">
                  {stat.value}
                </dd>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          <img
            src="/images/brand/hero-douchekop.webp"
            alt={t("home.heroImageAlt")}
            width={1916}
            height={821}
            // The hero is the largest-contentful paint, so it loads eagerly.
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            className="aspect-[16/10] w-full object-cover lg:aspect-[16/11]"
          />
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const { t } = useI18n();

  const points: { icon: LucideIcon; title: TranslationKey; text: TranslationKey }[] = [
    { icon: ShieldCheck, title: "home.trustSecure", text: "home.trustSecureText" },
    { icon: RotateCcw, title: "home.trustReturns", text: "home.trustReturnsText" },
    { icon: Truck, title: "home.trustShipping", text: "home.trustShippingText" },
    { icon: Headphones, title: "home.trustService", text: "home.trustServiceText" },
  ];

  return (
    <section aria-label={t("home.trustSecure")} className="border-b border-border bg-card">
      <div className="container-page grid gap-5 py-7 sm:grid-cols-2 lg:grid-cols-4">
        {points.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">{t(title)}</p>
              <p className="text-sm text-muted-foreground">{t(text)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryGrid() {
  const { t } = useI18n();
  const counts = countByCategory();

  return (
    <section className="section-y">
      <div className="container-page">
        <SectionHeader
          title={t("home.categoriesTitle")}
          text={t("home.categoriesText")}
          to="/categorieen"
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => {
            // Each tile is fronted by the category's own best-reviewed product,
            // so the grid shows real merchandise instead of emoji or icons.
            const hero = productsInCategory(category.slug).sort(
              (a, b) => b.reviewCount - a.reviewCount,
            )[0];
            return (
              <Link
                key={category.slug}
                to="/categorie/$slug"
                params={{ slug: category.slug }}
                aria-label={t("home.viewCategory", { name: category.name })}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="aspect-4/3 overflow-hidden bg-white p-3">
                  <ProductImage
                    src={hero?.imageUrl}
                    alt=""
                    width={320}
                    height={240}
                    sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
                    className="transition-transform duration-500 ease-brand group-hover:scale-105"
                  />
                </div>
                <div className="border-t border-border px-3 py-2.5">
                  <p className="text-sm font-semibold leading-snug group-hover:text-primary">
                    {category.name}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {t("brand.productCount", { count: counts[category.slug] ?? 0 })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Editorial groupings. Each block is built from real catalogue categories, so
 * the "collection" it promises always resolves to actual products.
 */
function EditorialSections() {
  const { t } = useI18n();
  const counts = countByCategory();

  return (
    <section className="border-y border-border bg-surface section-y">
      <div className="container-page grid gap-5 md:grid-cols-2">
        {CATEGORY_THEMES.map((theme) => {
          const themeProducts = theme.categorySlugs.flatMap((slug) => productsInCategory(slug));
          const preview = themeProducts
            .slice()
            .sort((a, b) => b.reviewCount - a.reviewCount)
            .slice(0, 3);
          const total = theme.categorySlugs.reduce((sum, slug) => sum + (counts[slug] ?? 0), 0);

          return (
            <article
              key={theme.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
            >
              <div className="grid grid-cols-3 gap-px bg-border">
                {preview.map((product) => (
                  <Link
                    key={product.slug}
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    className="aspect-square bg-white p-3 transition-opacity hover:opacity-80"
                    aria-label={product.name}
                  >
                    <ProductImage
                      src={product.imageUrl}
                      alt=""
                      width={280}
                      height={280}
                      sizes="(min-width: 768px) 15vw, 30vw"
                    />
                  </Link>
                ))}
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-xl font-extrabold uppercase tracking-tight">
                  {t(theme.titleKey)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`${theme.titleKey.replace("Title", "Text")}` as TranslationKey)}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {theme.categorySlugs.map((slug) => {
                    const category = categories.find((c) => c.slug === slug);
                    if (!category) return null;
                    return (
                      <Link
                        key={slug}
                        to="/categorie/$slug"
                        params={{ slug }}
                        className="rounded-full border border-border-strong px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:bg-secondary"
                      >
                        {category.name}
                      </Link>
                    );
                  })}
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {t("brand.productCount", { count: total })}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BrandSection() {
  const { t } = useI18n();
  const counts = countByBrand();

  return (
    <section className="section-y">
      <div className="container-page">
        <SectionHeader title={t("home.brandsTitle")} text={t("home.brandsText")} to="/merken" />

        <div className="grid gap-5 md:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              to="/merken/$slug"
              params={{ slug: brand.slug }}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-2xl font-extrabold group-hover:text-primary">
                  {brand.name}
                </h3>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {t("brand.productCount", { count: counts[brand.slug] ?? 0 })}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {brand.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {t("edit.discover")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSection({
  title,
  text,
  to,
  products,
  tone = "default",
}: {
  title: string;
  text: string;
  to: "/winkel" | "/aanbiedingen";
  products: ProductListItem[];
  tone?: "default" | "surface";
}) {
  return (
    <section
      className={tone === "surface" ? "border-y border-border bg-surface section-y" : "section-y"}
    >
      <div className="container-page">
        <SectionHeader title={title} text={text} to={to} />
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  text,
  to,
}: {
  title: string;
  text: string;
  to: "/winkel" | "/aanbiedingen" | "/merken" | "/categorieen";
}) {
  const { t } = useI18n();
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{text}</p>
      </div>
      <Link
        to={to}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-semibold text-primary hover:underline"
      >
        {t("home.viewAll")}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
