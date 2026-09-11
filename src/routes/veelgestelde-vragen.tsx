import { createFileRoute, Link } from "@tanstack/react-router";
import { localeFromHead, localisedSeo } from "@/lib/seo";

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
  head: (ctx) => localisedSeo("faq", { path: "/veelgestelde-vragen", locale: localeFromHead(ctx) }),
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
          <Link
            to="/contact"
            className="text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            {t("faq.introLink")}
          </Link>
          {t("faq.introSuffix")}
        </p>

        <Accordion type="single" collapsible className="mt-8">
          {FAQ_KEYS.map((key, index) => (
            <AccordionItem key={key} value={`item-${index}`}>
              <AccordionTrigger headingLevel={2} className="text-left">
                {t(`faq.q${key}`)}
              </AccordionTrigger>
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
