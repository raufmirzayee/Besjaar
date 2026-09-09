import { Link } from "@tanstack/react-router";
import { PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";

import { NewsletterSignup } from "@/components/newsletter-signup";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

const services: { icon: typeof Truck; title: TranslationKey; text: TranslationKey }[] = [
  { icon: Truck, title: "footer.delivery.title", text: "footer.delivery.text" },
  { icon: RotateCcw, title: "footer.returns.title", text: "footer.returns.text" },
  { icon: ShieldCheck, title: "footer.warranty.title", text: "footer.warranty.text" },
  { icon: PackageCheck, title: "footer.warehouse.title", text: "footer.warehouse.text" },
];

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-20 border-t bg-surface">
      <div className="container-page grid gap-6 border-b py-10 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <div key={s.title} className="flex items-start gap-3">
            <s.icon className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">{t(s.title)}</p>
              <p className="text-sm text-muted-foreground">{t(s.text)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl font-bold text-primary">Besjaar</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t("footer.tagline")}</p>
        </div>
        <div>
          <NewsletterSignup />
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer.shopping")}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/winkel" className="hover:text-primary">
                {t("nav.allProducts")}
              </Link>
            </li>
            <li>
              <Link to="/winkelwagen" className="hover:text-primary">
                {t("cart.title")}
              </Link>
            </li>
            <li>
              <Link to="/verlanglijst" className="hover:text-primary">
                {t("footer.wishlist")}
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-primary">
                {t("footer.account")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer.customerService")}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/verzending" className="hover:text-primary">
                {t("footer.shipping")}
              </Link>
            </li>
            <li>
              <Link to="/retouren" className="hover:text-primary">
                {t("footer.returnsLink")}
              </Link>
            </li>
            <li>
              <Link to="/veelgestelde-vragen" className="hover:text-primary">
                {t("footer.faq")}
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">
                {t("footer.contact")}
              </Link>
            </li>
            <li>
              <Link to="/voorwaarden" className="hover:text-primary">
                {t("footer.terms")}
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-primary">
                {t("footer.privacy")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer.contact")}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>klantenservice@besjaar.nl</li>
            <li>{t("footer.hours")}</li>
            <li>KvK 00000000 · BTW NL000000000B01</li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <p>iDEAL · Bancontact · Creditcard · PayPal</p>
        </div>
      </div>
    </footer>
  );
}
