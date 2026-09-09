import { createFileRoute, Link } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacyverklaring — Besjaar" },
      {
        name: "description",
        content:
          "Hoe Besjaar persoonsgegevens verwerkt: welke data we bewaren, waarom, hoe lang en welke rechten je hebt.",
      },
      { property: "og:title", content: "Privacyverklaring — Besjaar" },
      {
        property: "og:description",
        content: "Onze werkwijze rond persoonsgegevens, cookies en jouw AVG-rechten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

function PrivacyPage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-12">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {t("privacy.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t("privacy.title")}</h1>
        <p className="mt-3 text-muted-foreground">
          {t("privacy.introPrefix")}
          <Link
            to="/contact"
            className="text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            {t("privacy.introLink")}
          </Link>
          .
        </p>

        <div className="mt-8 space-y-6">
          {SECTIONS.map((key) => (
            <section key={key}>
              <h2 className="font-display text-lg font-semibold">{t(`privacy.${key}t`)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(`privacy.${key}b`)}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
