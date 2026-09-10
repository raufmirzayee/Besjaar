/**
 * Page metadata helpers.
 *
 * Every public page gets a title, description, canonical URL and OpenGraph
 * tags from one place, so the storefront cannot drift into pages with missing
 * or duplicated metadata.
 */

import { storeConfig } from "./store-config";

const SITE_NAME = "Besjaar";
// A brand card, not a product photo: the default share image stands for the
// shop as a whole, and must not appear to depict a specific item.
const DEFAULT_OG_IMAGE = "/images/brand/og-besjaar.png";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${storeConfig.origin.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export type SeoInput = {
  title: string;
  description: string;
  /** Path only, e.g. "/winkel". Used for the canonical and og:url. */
  path: string;
  image?: string | null;
  /** Keep private or thin pages out of the index. */
  noindex?: boolean;
  type?: "website" | "product" | "article";
};

/**
 * Builds the meta + link arrays a TanStack Router `head` expects.
 * Titles are suffixed with the store name unless they already carry it.
 */
export function seo({ title, description, path, image, noindex, type = "website" }: SeoInput) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl(image ?? DEFAULT_OG_IMAGE);
  const clipped =
    description.length > 158 ? `${description.slice(0, 155).trimEnd()}…` : description;

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: clipped },
      ...(noindex ? [{ name: "robots", content: "noindex, follow" }] : []),
      { property: "og:type", content: type },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: clipped },
      { property: "og:url", content: url },
      { property: "og:image", content: ogImage },
      { property: "og:locale", content: "nl_NL" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: clipped },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/** Serialises JSON-LD for a <script type="application/ld+json"> tag. */
export function jsonLd(data: Record<string, unknown>): string {
  // Escaping "<" prevents a stray </script> in product copy closing the tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationSchema() {
  const company = storeConfig.company;

  // Registration details are only claimed when they have actually been
  // configured. A schema.org vatID that nobody supplied would be a false
  // statement about a real business, so nothing is filled in speculatively.
  const address =
    company.street || company.postalCode || company.city
      ? {
          "@type": "PostalAddress",
          streetAddress: company.street || undefined,
          postalCode: company.postalCode || undefined,
          addressLocality: company.city || undefined,
          addressCountry: "NL",
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    legalName: company.legalName || undefined,
    url: storeConfig.origin,
    logo: absoluteUrl("/apple-touch-icon.png"),
    email: storeConfig.email,
    telephone: storeConfig.phone || undefined,
    vatID: company.vat || undefined,
    // The KvK number is the Dutch company register identifier.
    identifier: company.kvk
      ? {
          "@type": "PropertyValue",
          propertyID: "KvK",
          value: company.kvk,
        }
      : undefined,
    address,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: storeConfig.email,
        telephone: storeConfig.phone || undefined,
        areaServed: [...storeConfig.shippingCountries],
        availableLanguage: ["nl", "en", "de", "fr"],
      },
    ],
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: storeConfig.origin,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${storeConfig.origin}/zoeken?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  };
}
