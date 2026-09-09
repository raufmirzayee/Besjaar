import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { seo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";
import { clearConsent } from "@/lib/consent";
import type { TranslationKey } from "@/lib/translations";

export const Route = createFileRoute("/cookies")({
  head: () =>
    seo({
      title: "Cookiebeleid",
      description:
        "Welke cookies Besjaar gebruikt, waarvoor ze dienen en hoe je je keuze op elk moment aanpast.",
      path: "/cookies",
    }),
  component: CookiePolicyPage,
});

const CATEGORIES: {
  id: string;
  titleKey: TranslationKey;
  textKey: TranslationKey;
  always: boolean;
}[] = [
  {
    id: "necessary",
    titleKey: "cookie.necessary",
    textKey: "cookie.necessaryText",
    always: true,
  },
  {
    id: "analytics",
    titleKey: "cookie.analytics",
    textKey: "cookie.analyticsText",
    always: false,
  },
  {
    id: "marketing",
    titleKey: "cookie.marketing",
    textKey: "cookie.marketingText",
    always: false,
  },
];

function CookiePolicyPage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-10 md:py-14">
      <div className="max-w-3xl">
        <Breadcrumbs trail={[{ name: "Home", to: "/" }, { name: t("footer.cookies") }]} />

        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t("footer.cookies")}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Wij plaatsen alleen cookies die nodig zijn om de winkel te laten werken, tenzij je
          toestemming geeft voor meer. Je keuze wordt bewaard en je kunt hem op elk moment
          aanpassen.
        </p>

        <div className="mt-8 space-y-4">
          {CATEGORIES.map((category) => (
            <section
              key={category.id}
              className="rounded-xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold">{t(category.titleKey)}</h2>
                {category.always ? (
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-secondary-foreground">
                    Altijd actief
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t(category.textKey)}
              </p>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-bold">Je keuze aanpassen</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Wis je huidige keuze om de cookiemelding opnieuw te tonen. Analytische en
            marketingcookies worden pas geladen nadat je daar toestemming voor geeft.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              clearConsent();
              window.location.reload();
            }}
          >
            {t("cookie.settings")}
          </Button>
        </section>

        <p className="mt-8 text-sm text-muted-foreground">
          Meer over hoe wij met persoonsgegevens omgaan lees je in de{" "}
          <Link
            to="/privacy"
            className="text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            {t("footer.privacy")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
