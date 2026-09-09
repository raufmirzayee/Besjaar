import { createFileRoute, Link } from "@tanstack/react-router";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";
import { pageMessages } from "@/lib/translations/pages";

const FAQ_KEYS = ["1", "2", "3", "4", "5", "6", "7"] as const;

export const Route = createFileRoute("/veelgestelde-vragen")({
  head: () => ({
    meta: [
      { title: "Veelgestelde vragen — Besjaar" },
      {
        name: "description",
        content:
          "Antwoorden over levertijden, verzendkosten, retourneren, garantie en betalen bij Besjaar.",
      },
      { property: "og:title", content: "Veelgestelde vragen — Besjaar" },
      {
        property: "og:description",
        content: "Alles over bezorging, retourneren, garantie en betalen bij Besjaar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_KEYS.map((key) => ({
            "@type": "Question",
            name: pageMessages.nl[`faq.q${key}` as keyof typeof pageMessages.nl],
            acceptedAnswer: {
              "@type": "Answer",
              text: pageMessages.nl[`faq.a${key}` as keyof typeof pageMessages.nl],
            },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { t } = useI18n();

  return (
    <div className="container-page py-12">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {t("faq.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t("faq.title")}</h1>
        <p className="mt-3 text-muted-foreground">
          {t("faq.introPrefix")}
          <Link to="/contact" className="text-primary underline-offset-4 hover:underline">
            {t("faq.introLink")}
          </Link>
          {t("faq.introSuffix")}
        </p>

        <Accordion type="single" collapsible className="mt-8">
          {FAQ_KEYS.map((key, index) => (
            <AccordionItem key={key} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{t(`faq.q${key}`)}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t(`faq.a${key}`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
