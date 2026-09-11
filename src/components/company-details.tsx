import { Link } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n";

import {
  companyAddressLines,
  hasCompanyIdentity,
  missingCompanyIdentity,
  storeConfig,
} from "@/lib/store-config";

/**
 * The company identification a Dutch webshop must publish (BW 6:230m, EU
 * e-Commerce Directive art. 5): legal name, registered address, KvK number,
 * VAT number and a contact address.
 *
 * These come from configuration and are empty until the shop owner fills them
 * in. Rather than printing a placeholder number — which would be a false legal
 * statement on a live shop — the block shows what is still missing, and says
 * so in plain language.
 */
export function CompanyDetails({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const complete = hasCompanyIdentity();
  const missing = missingCompanyIdentity();
  const address = companyAddressLines();

  return (
    <div className={className}>
      <p className="font-semibold text-foreground">{t("about.companyTitle")}</p>

      {address.length > 0 ? (
        <address className="mt-2 not-italic">
          {address.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
      ) : null}

      <dl className="mt-2 space-y-1">
        {storeConfig.company.kvk ? (
          <div className="flex gap-2">
            <dt>{t("company.kvk")}</dt>
            <dd className="text-foreground">{storeConfig.company.kvk}</dd>
          </div>
        ) : null}
        {storeConfig.company.vat ? (
          <div className="flex gap-2">
            <dt>{t("company.vat")}</dt>
            <dd className="text-foreground">{storeConfig.company.vat}</dd>
          </div>
        ) : null}
        <div className="flex gap-2">
          <dt>{t("company.email")}</dt>
          <dd>
            <a
              href={`mailto:${storeConfig.email}`}
              className="text-foreground underline underline-offset-4"
            >
              {storeConfig.email}
            </a>
          </dd>
        </div>
        {storeConfig.phone ? (
          <div className="flex gap-2">
            <dt>{t("company.phone")}</dt>
            <dd className="text-foreground">{storeConfig.phone}</dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-2">{t("company.ownBrands")}</p>

      {!complete ? (
        <p className="mt-3 rounded-lg border border-sale/30 bg-sale/5 p-3 text-xs text-foreground">
          {t("company.incompletePrefix")} {missing.map((field) => field.label).join(", ")}.{" "}
          {t("company.missingSuffix")}{" "}
          <a href={`mailto:${storeConfig.email}`} className="underline underline-offset-4">
            {storeConfig.email}
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}

/** One-line company footprint for footers and email-adjacent contexts. */
export function CompanyLine({ className = "" }: { className?: string }) {
  const parts = [
    storeConfig.company.legalName || null,
    storeConfig.company.kvk ? `KvK ${storeConfig.company.kvk}` : null,
    storeConfig.company.vat ? `Btw ${storeConfig.company.vat}` : null,
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <p className={className}>
      Besjaar is een handelsnaam van {parts.join(" · ")}.{" "}
      <Link to="/voorwaarden" className="underline underline-offset-4">
        Algemene voorwaarden
      </Link>
    </p>
  );
}
