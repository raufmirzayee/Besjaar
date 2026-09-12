import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { BesjaarLogo } from "@/components/besjaar-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { brands, categories, countByBrand, countByCategory } from "@/data/catalogue";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ACCOUNT_LINKS, SERVICE_LINKS, themedCategories } from "@/lib/navigation";

const categoryCounts = countByCategory();
const brandCounts = countByBrand();

/**
 * Full-height mobile navigation.
 *
 * Built for a phone rather than squeezed down from the desktop bar: large tap
 * targets, the deep sections behind accordions, and account and language
 * controls at the bottom where a thumb reaches.
 */
export function MobileMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const close = () => onOpenChange(false);
  const themes = themedCategories();
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  const rowClass =
    "flex items-center justify-between rounded-lg px-3 py-3 text-base font-semibold text-foreground transition-colors hover:bg-secondary";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-full max-w-sm flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle asChild>
            <span className="text-primary">
              <BesjaarLogo />
            </span>
          </SheetTitle>
        </SheetHeader>

        <nav aria-label={t("nav.menu")} className="flex-1 overflow-y-auto px-3 py-3">
          <Link to="/winkel" onClick={close} className={rowClass}>
            {t("nav.shop")}
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
          </Link>

          <Accordion type="multiple" className="mt-1">
            <AccordionItem value="categories" className="border-none">
              <AccordionTrigger className="rounded-lg px-3 py-3 text-base font-semibold hover:bg-secondary hover:no-underline">
                {t("nav.categories")}
              </AccordionTrigger>
              <AccordionContent className="pb-1">
                {themes.map((theme) => (
                  <div key={theme.id} className="mb-2">
                    <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t(theme.titleKey)}
                    </p>
                    {theme.categorySlugs.map((slug) => {
                      const category = bySlug.get(slug);
                      if (!category) return null;
                      return (
                        <Link
                          key={slug}
                          to="/categorie/$slug"
                          params={{ slug }}
                          onClick={close}
                          className="flex items-center justify-between rounded-lg py-2.5 pl-6 pr-3 text-sm font-medium transition-colors hover:bg-secondary"
                        >
                          <span>{category.name}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {categoryCounts[slug] ?? 0}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="brands" className="border-none">
              <AccordionTrigger className="rounded-lg px-3 py-3 text-base font-semibold hover:bg-secondary hover:no-underline">
                {t("nav.brands")}
              </AccordionTrigger>
              <AccordionContent className="pb-1">
                {brands.map((brand) => (
                  <Link
                    key={brand.slug}
                    to="/merken/$slug"
                    params={{ slug: brand.slug }}
                    onClick={close}
                    className="flex items-center justify-between rounded-lg py-2.5 pl-6 pr-3 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    <span>{brand.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {brandCounts[brand.slug] ?? 0}
                    </span>
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="service" className="border-none">
              <AccordionTrigger className="rounded-lg px-3 py-3 text-base font-semibold hover:bg-secondary hover:no-underline">
                {t("nav.service")}
              </AccordionTrigger>
              <AccordionContent className="pb-1">
                {SERVICE_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={close}
                    className="block rounded-lg py-2.5 pl-6 pr-3 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Link to="/aanbiedingen" onClick={close} className={`${rowClass} text-sale`}>
            {t("nav.deals")}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
          <Link to="/over-ons" onClick={close} className={rowClass}>
            {t("nav.about")}
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
          </Link>

          <div className="mt-3 border-t border-border pt-3">
            {ACCOUNT_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={close}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </div>
        </nav>

        <div className="border-t border-border bg-surface p-4">
          <Button asChild size="block" onClick={close}>
            <Link to={user ? "/account" : "/inloggen"}>
              {user ? t("header.account") : t("reviews.loginCta")}
            </Link>
          </Button>
          <div className="mt-3 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
