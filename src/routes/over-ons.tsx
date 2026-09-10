import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, MapPin, PackageCheck, Sparkles } from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { brands, categories, products } from "@/data/catalogue";
import { localeFromHead, localisedSeo } from "@/lib/seo";
import { storeConfig } from "@/lib/store-config";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/over-ons")({
  head: (ctx) => localisedSeo("about", { path: "/over-ons", locale: localeFromHead(ctx) }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();

  // Figures come from the catalogue itself, so they cannot drift out of date.
  const facts = [
    { icon: Boxes, value: `${products.length}`, label: t("home.heroStatProducts") },
    { icon: Sparkles, value: `${categories.length}`, label: t("home.heroStatCategories") },
    { icon: PackageCheck, value: `${brands.length}`, label: t("home.heroStatBrands") },
    { icon: MapPin, value: "NL · BE · DE", label: t("home.trustShipping") },
  ];

  return (
    <div>
      <div className="brand-band">
        <div className="container-page py-12 md:py-16">
          <Breadcrumbs
            trail={[{ name: "Home", to: "/" }, { name: t("about.title") }]}
            tone="dark"
          />
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-extrabold text-white sm:text-5xl">
              {t("about.title")}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white/80">{t("about.intro")}</p>
          </div>
        </div>
      </div>

      <div className="container-page py-10 md:py-14">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {facts.map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <dd className="mt-3 font-display text-2xl font-extrabold tabular-nums">{value}</dd>
              <dt className="text-sm text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <section>
            <h2 className="font-display text-2xl font-bold">Wat wij verkopen</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Besjaar richt zich op praktische producten die je dagelijks gebruikt: verlichting voor
              onderweg en in de tuin, douchecomfort in de badkamer, en handige hulpjes voor keuken,
              werkplek, auto en fiets. Wij kiezen liever een klein aantal doordachte producten dan
              een eindeloos assortiment.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Het assortiment is verdeeld over {categories.length} categorieën en {brands.length}{" "}
              merken. Elk product heeft een eigen productpagina met de specificaties zoals de
              fabrikant die aanlevert.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">Onze merken</h2>
            <ul className="mt-3 space-y-4">
              {brands.map((brand) => (
                <li key={brand.slug} className="rounded-xl border border-border bg-card p-5">
                  <Link
                    to="/merken/$slug"
                    params={{ slug: brand.slug }}
                    className="font-display text-lg font-bold hover:text-primary hover:underline"
                  >
                    {brand.name}
                  </Link>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {brand.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-12 rounded-xl border border-border bg-surface p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold">Bedrijfsgegevens</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Besjaar is een handelsnaam van {storeConfig.legalEntity}. Vragen over een bestelling,
            een retour of een product? Neem gerust contact op — wij reageren op werkdagen.
          </p>
          {/* KvK, VAT and the registered address are deliberately absent: they
              must come from the business, not be invented here. See README. */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/contact">{t("footer.contact")}</Link>
            </Button>
            <Button asChild variant="subtle">
              <Link to="/veelgestelde-vragen">{t("footer.faq")}</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
