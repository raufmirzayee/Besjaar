import { createFileRoute, Link } from "@tanstack/react-router";
import { localeFromHead, localisedSeo } from "@/lib/seo";

import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/voorwaarden")({
  head: (ctx) => localisedSeo("terms", { path: "/voorwaarden", locale: localeFromHead(ctx) }),
  component: TermsPage,
});

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"] as const;

function TermsPage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-12">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {t("terms.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t("terms.title")}</h1>
        <p className="mt-3 text-muted-foreground">
          {t("terms.introPrefix")}
          <Link
            to="/privacy"
            className="text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            {t("terms.introLink")}
          </Link>
          .
        </p>

        <div className="mt-8 space-y-6">
          {SECTIONS.map((key) => (
            <section key={key}>
              <h2 className="font-display text-lg font-semibold">{t(`terms.${key}t`)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(`terms.${key}b`)}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
