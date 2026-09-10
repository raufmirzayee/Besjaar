import { createFileRoute, Link } from "@tanstack/react-router";
import { localeFromHead, localisedSeo } from "@/lib/seo";

import { CompanyDetails } from "@/components/company-details";
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
          Herroepingsrecht
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Modelformulier voor herroeping
        </h1>
        <p className="mt-3 text-muted-foreground">
          Je hebt {returns.days} dagen bedenktijd vanaf de dag waarop je de bestelling ontvangt. Je
          mag je aankoop in die periode zonder opgave van redenen herroepen. Dit formulier hoef je
          alleen te gebruiken als je dat wilt — een duidelijke mededeling per e-mail volstaat ook.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Hoe het werkt</h2>
          <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                1
              </span>
              <span>
                Laat ons binnen {returns.days} dagen na ontvangst weten dat je herroept. Vul het
                formulier hieronder in, of mail ons in je eigen woorden.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                2
              </span>
              <span>
                Stuur de producten daarna binnen 14 dagen terug. We laten je per e-mail weten naar
                welk adres, en wie de retourkosten draagt.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                3
              </span>
              <span>
                We betalen binnen 14 dagen na je melding terug, met dezelfde betaalmethode. We mogen
                wachten tot we de producten terug hebben, of tot je hebt aangetoond dat je ze hebt
                verzonden.
              </span>
            </li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            Wil je liever een retour aanmelden in je account? Dat kan via{" "}
            <Link
              to="/retouren"
              className="text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              retouren
            </Link>
            .
          </p>
        </section>

        {/* The model text from Annex I(B). Printable, and copy-pasteable into
            an e-mail, so nobody needs an account to exercise the right. */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Het formulier</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Print deze pagina, of neem de tekst over in een e-mail aan{" "}
            <a
              href={`mailto:${email}?subject=${encodeURIComponent("Herroeping van mijn bestelling")}`}
              className="text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              {email}
            </a>
            .
          </p>

          <div className="mt-4 rounded-2xl border bg-card p-6 text-sm leading-relaxed shadow-soft">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Alleen invullen en terugsturen als je de overeenkomst wilt herroepen
            </p>

            <div className="mt-4">
              <p className="font-semibold">Aan:</p>
              <address className="mt-1 not-italic text-muted-foreground">
                {traderLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>

            <dl className="mt-6 space-y-4">
              <FormLine label="Ik/Wij (*) deel/delen (*) u hierbij mede dat ik/wij (*) onze overeenkomst betreffende de verkoop van de volgende goederen herroep/herroepen (*)" />
              <FormLine label="Besteld op (*) / Ontvangen op (*)" />
              <FormLine label="Bestelnummer" />
              <FormLine label="Naam consument(en)" />
              <FormLine label="Adres consument(en)" lines={2} />
              <FormLine label="Handtekening consument(en) (alleen wanneer dit formulier op papier wordt ingediend)" />
              <FormLine label="Datum" />
            </dl>

            <p className="mt-6 text-xs text-muted-foreground">
              (*) Doorhalen wat niet van toepassing is.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Uitzonderingen</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Het herroepingsrecht geldt niet voor producten die om redenen van hygiëne of
            gezondheidsbescherming verzegeld zijn geleverd en waarvan de verzegeling na levering is
            verbroken. Denk aan neusstrips, pleisters en vergelijkbare persoonlijke
            verzorgingsproducten. Zolang de verzegeling intact is, kun je gewoon herroepen.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Je mag het product uitpakken en beoordelen zoals je in een winkel zou doen. Gebruik je
            het verder dan dat, dan kunnen we de waardevermindering in rekening brengen.
          </p>
        </section>

        <CompanyDetails className="mt-10 rounded-xl border bg-surface p-6 text-sm text-muted-foreground" />

        <p className="mt-6 text-sm text-muted-foreground">
          Zie ook onze{" "}
          <Link
            to="/voorwaarden"
            className="text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            algemene voorwaarden
          </Link>{" "}
          en{" "}
          <Link
            to="/verzending"
            className="text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            verzending &amp; retour
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
