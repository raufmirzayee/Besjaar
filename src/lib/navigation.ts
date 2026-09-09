/**
 * Storefront navigation model.
 *
 * The catalogue has ten categories — too many for a flat menu bar, but they
 * group naturally into four themes. The mega-menu shows the themes; every
 * category still has its own page and appears under exactly one theme, so
 * nothing is hidden and the structure scales as the range grows.
 */

import { categories } from "@/data/catalogue";
import type { TranslationKey } from "@/lib/translations";

export type CategoryTheme = {
  id: string;
  titleKey: TranslationKey;
  /** Category slugs, in the order they should be listed. */
  categorySlugs: string[];
};

export const CATEGORY_THEMES: CategoryTheme[] = [
  {
    id: "outdoor",
    titleKey: "edit.outdoorTitle",
    categorySlugs: ["kamperen-outdoor", "tuin"],
  },
  {
    id: "bathroom",
    titleKey: "edit.bathroomTitle",
    categorySlugs: ["badkamer", "persoonlijke-verzorging"],
  },
  {
    id: "home",
    titleKey: "edit.homeTitle",
    categorySlugs: ["klussen-huis", "koken-tafelen", "creatief-hobby"],
  },
  {
    id: "tech",
    titleKey: "edit.techTitle",
    categorySlugs: ["elektronica-accessoires", "auto-fiets-reizen", "lifestyle-accessoires"],
  },
];

/**
 * Guard against a category silently disappearing from the menu when the
 * catalogue gains a new one. Anything not placed in a theme is appended to the
 * last theme rather than dropped.
 */
export function themedCategories(): CategoryTheme[] {
  const placed = new Set(CATEGORY_THEMES.flatMap((theme) => theme.categorySlugs));
  const orphans = categories.map((c) => c.slug).filter((slug) => !placed.has(slug));
  if (orphans.length === 0) return CATEGORY_THEMES;
  return CATEGORY_THEMES.map((theme, index) =>
    index === CATEGORY_THEMES.length - 1
      ? { ...theme, categorySlugs: [...theme.categorySlugs, ...orphans] }
      : theme,
  );
}

/** Service links used by the footer and the mobile menu. */
export const SERVICE_LINKS = [
  { to: "/contact", labelKey: "footer.contact" },
  { to: "/verzending", labelKey: "footer.shipping" },
  { to: "/retouren", labelKey: "footer.returnsLink" },
  { to: "/veelgestelde-vragen", labelKey: "footer.faq" },
] as const;

export const LEGAL_LINKS = [
  { to: "/privacy", labelKey: "footer.privacy" },
  { to: "/cookies", labelKey: "footer.cookies" },
  { to: "/voorwaarden", labelKey: "footer.terms" },
] as const;

export const ACCOUNT_LINKS = [
  { to: "/account", labelKey: "footer.account" },
  { to: "/verlanglijst", labelKey: "footer.wishlist" },
] as const;
