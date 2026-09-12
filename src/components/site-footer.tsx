import { Link } from "@tanstack/react-router";
import { Mail, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";

import { BesjaarLogo } from "@/components/besjaar-logo";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { brands } from "@/data/catalogue";
import { useI18n } from "@/lib/i18n";
import { ACCOUNT_LINKS, LEGAL_LINKS, SERVICE_LINKS } from "@/lib/navigation";
import { storeConfig } from "@/lib/store-config";

export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const assurances = [
    { icon: ShieldCheck, title: t("home.trustSecure"), text: t("home.trustSecureText") },
    { icon: RotateCcw, title: t("home.trustReturns"), text: t("home.trustReturnsText") },
    { icon: Truck, title: t("home.trustShipping"), text: t("home.trustShippingText") },
    { icon: PackageCheck, title: t("home.trustService"), text: t("home.trustServiceText") },
  ];

  const linkClass =
    "text-sm text-white/70 transition-colors hover:text-white hover:underline underline-offset-4";

  return (
    <footer className="mt-auto bg-navy-deep text-white">
      <div className="border-b border-white/10">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {assurances.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-sm text-white/70">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <BesjaarLogo showTagline />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            {t("footer.tagline")}
          </p>
          <a
            href={`mailto:${storeConfig.email}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white hover:underline"
          >
            <Mail className="size-4" aria-hidden="true" />
            {storeConfig.email}
          </a>
        </div>

        <FooterColumn title={t("footer.shopping")}>
          <li>
            <Link to="/winkel" className={linkClass}>
              {t("footer.allProducts")}
            </Link>
          </li>
          <li>
            <Link to="/categorieen" className={linkClass}>
              {t("footer.categories")}
            </Link>
          </li>
          <li>
            <Link to="/winkel" search={{ sort: "populariteit" }} className={linkClass}>
              {t("footer.bestsellers")}
            </Link>
          </li>
          <li>
            <Link to="/aanbiedingen" className={linkClass}>
              {t("footer.deals")}
            </Link>
          </li>
        </FooterColumn>

        <FooterColumn title={t("footer.customerService")}>
          {SERVICE_LINKS.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className={linkClass}>
                {t(link.labelKey)}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/account" className={linkClass}>
              {t("footer.trackOrder")}
            </Link>
          </li>
        </FooterColumn>

        <FooterColumn title={t("footer.company")}>
          <li>
            <Link to="/over-ons" className={linkClass}>
              {t("footer.about")}
            </Link>
          </li>
          <li>
            <Link to="/merken" className={linkClass}>
              {t("footer.brands")}
            </Link>
          </li>
          {brands.map((brand) => (
            <li key={brand.slug}>
              <Link to="/merken/$slug" params={{ slug: brand.slug }} className={linkClass}>
                {brand.name}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title={t("footer.account")}>
          {ACCOUNT_LINKS.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className={linkClass}>
                {t(link.labelKey)}
              </Link>
            </li>
          ))}
          {LEGAL_LINKS.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className={linkClass}>
                {t(link.labelKey)}
              </Link>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-lg font-bold">{t("home.newsletterTitle")}</h2>
            <p className="mt-1 text-sm text-white/70">{t("home.newsletterText")}</p>
            <div className="mt-4">
              <NewsletterSignup variant="footer" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-center text-xs text-white/60 sm:flex-row sm:text-left">
          <p>{t("footer.rights", { year })}</p>
          <p>{t("footer.operatedBy", { entity: storeConfig.legalEntity })}</p>
          <ul className="flex flex-wrap items-center justify-center gap-2">
            <li className="sr-only">{t("footer.paymentTitle")}</li>
            {storeConfig.payment.methods.map((method) => (
              <li
                key={method}
                className="rounded border border-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
              >
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/50">
        {title}
      </h2>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}
