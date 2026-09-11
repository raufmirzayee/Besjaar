import { createFileRoute, Link } from "@tanstack/react-router";
import { localeFromHead, localisedSeo } from "@/lib/seo";

import { CompanyDetails } from "@/components/company-details";
import { useI18n } from "@/lib/i18n";
import { storeConfig } from "@/lib/store-config";

/**
 * The statutory model withdrawal form.
 *
 * EU Consumer Rights Directive 2011/83/EU, Annex I(B), implemented in Dutch law
 * as the "modelformulier voor herroeping": a webshop must make this available
 * to consumers. The wording below follows the model text; only the trader's
 * details are filled in from configuration.
 *
 * The form deliberately submits by e-mail rather than through an API, so a
 * withdrawal is never silently lost if the site is down — and so the customer
 * keeps a copy of what they sent.
 */
export const Route = createFileRoute("/herroeping")({
  head: (ctx) => localisedSeo("withdrawal", { path: "/herroeping", locale: localeFromHead(ctx) }),
  component: WithdrawalPage,
});

function WithdrawalPage() {
  const { t } = useI18n();
  const { returns, email, company } = storeConfig;
  const traderLines = [
    company.legalName || "Besjaar",
    company.street,
    [company.postalCode, company.city].filter(Boolean).join(" "),
    company.postalCode || company.city ? company.country : "",
    email,
  ].filter(Boolean);

  return (
    <div className="container-page py-12">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {t("withdrawal.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          {t("withdrawal.title")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("withdrawal.intro", { days: returns.days })}
        </p>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">{t("withdrawal.howTitle")}</h2>
          <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                1
              </span>
              <span>{t("withdrawal.step1", { days: returns.days })}</span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                2
              </span>
              <span>{t("withdrawal.step2")}</span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                3
              </span>
              <span>{t("withdrawal.step3")}</span>
            </li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("withdrawal.portalPrefix")}{" "}
            <Link
              to="/retouren"
              className="text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              {t("returns.title")}
            </Link>
            .
          </p>
        </section>

        {/* The model text from Annex I(B). Printable, and copy-pasteable into
            an e-mail, so nobody needs an account to exercise the right. */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">{t("withdrawal.formTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("withdrawal.printPrefix")}{" "}
            <a
              href={`mailto:${email}?subject=${encodeURIComponent(t("withdrawal.mailSubject"))}`}
              className="text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              {email}
            </a>
            .
          </p>

          <div className="mt-4 rounded-2xl border bg-card p-6 text-sm leading-relaxed shadow-soft">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("withdrawal.onlyIf")}
            </p>

            <div className="mt-4">
              <p className="font-semibold">{t("withdrawal.to")}</p>
              <address className="mt-1 not-italic text-muted-foreground">
                {traderLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>

            <dl className="mt-6 space-y-4">
              <FormLine label={t("withdrawal.lineNotice")} />
              <FormLine label={t("withdrawal.lineOrdered")} />
              <FormLine label={t("withdrawal.lineOrderNumber")} />
              <FormLine label={t("withdrawal.lineName")} />
              <FormLine label={t("withdrawal.lineAddress")} lines={2} />
              <FormLine label={t("withdrawal.lineSignature")} />
              <FormLine label={t("withdrawal.lineDate")} />
            </dl>

            <p className="mt-6 text-xs text-muted-foreground">
              {t("withdrawal.deleteAsAppropriate")}
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">{t("withdrawal.exceptionsTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("withdrawal.exceptions1")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("withdrawal.exceptions2")}</p>
        </section>

        <CompanyDetails className="mt-10 rounded-xl border bg-surface p-6 text-sm text-muted-foreground" />

        <p className="mt-6 text-sm text-muted-foreground">
          {t("withdrawal.seeAlsoPrefix")}{" "}
          <Link
            to="/voorwaarden"
            className="text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            {t("withdrawal.seeAlsoTerms")}
          </Link>{" "}
          {t("withdrawal.and")}{" "}
          <Link
            to="/verzending"
            className="text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            {t("withdrawal.seeAlsoShipping")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function FormLine({ label, lines = 1 }: { label: string; lines?: number }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}:</dt>
      <dd>
        {Array.from({ length: lines }).map((_, index) => (
          <span key={index} className="mt-3 block border-b border-dashed border-border" />
        ))}
      </dd>
    </div>
  );
}
