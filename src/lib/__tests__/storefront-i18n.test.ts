import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

import { adminMessages } from "@/lib/translations/admin";
import { translations } from "@/lib/translations";

/**
 * The storefront in all four languages.
 *
 * `admin-i18n.test.ts` covers the backoffice, which only has to exist in Dutch
 * and English. The shop itself is different: it is advertised to visitors in
 * German and French, and a key that resolves to Dutch there is not a fallback
 * a customer forgives — it is a page that looks broken in the middle of a
 * purchase.
 *
 * The type system already requires every locale to supply every key. It cannot
 * tell whether the value is empty, whether the placeholders survived, or
 * whether someone pasted the Dutch in to make the build pass.
 */

const LOCALES = ["nl", "en", "de", "fr"] as const;

/** Backoffice keys are deliberately Dutch and English only. */
const adminKeys = new Set(Object.keys(adminMessages.nl ?? {}));
const storefrontKeys = Object.keys(translations.nl).filter((key) => !adminKeys.has(key));

const dict = (locale: (typeof LOCALES)[number]) =>
  translations[locale] as unknown as Record<string, string | undefined>;

/**
 * Words that are genuinely the same in more than one of these languages.
 *
 * Each one was checked by reading it, not by assuming. "Garantie" is Dutch,
 * German and French; "Kontakt" is the German spelling and differs; "Gratis" is
 * both Dutch and German. Anything not on this list that matches the Dutch is a
 * string somebody forgot.
 */
const COGNATES = new Set([
  "footer.contact",
  "home.bestsellers",
  "shop.countOne",
  "cookie.marketing",
  "product.home",
  "checkout.postalCode",
  "checkout.creditcardHint",
  "order.trackingTitle",
  "category.home",
  "contact.eyebrow",
  "faq.introLink",
  "shipping.trackLabel",
  "cart.free",
  "reviews.reviewTitle",
  "checkout.country",
  "checkout.free",
  "shipping.thCountry",
  "privacy.s5t",
  "nav.shop",
  "pdp.articleNumber",
  "pdp.warranty",
  "contact.labelEmail",
  "nav.menu",
  // "Datum" is the same word in Dutch and German.
  "withdrawal.lineDate",
  // English and Dutch happen to share these outright.
  "privacy.eyebrow",
  "filters.title",
  "filters.open",
  "list.resultsOne",
]);

describe("storefront translations", () => {
  it("has a substantial dictionary to check", () => {
    // A guard on the guard: if the key extraction above ever breaks, every
    // other assertion here would pass over an empty list.
    expect(storefrontKeys.length).toBeGreaterThan(400);
  });

  it.each(LOCALES)("has every storefront key in %s", (locale) => {
    const values = dict(locale);
    const missing = storefrontKeys.filter((key) => !(key in values));
    expect(missing, `${locale} is missing these keys`).toEqual([]);
  });

  it.each(LOCALES)("leaves nothing blank in %s", (locale) => {
    const values = dict(locale);
    const blank = storefrontKeys.filter((key) => !String(values[key] ?? "").trim());
    expect(blank, `${locale} has blank values`).toEqual([]);
  });

  it.each(LOCALES.filter((locale) => locale !== "nl"))(
    "keeps the placeholders intact in %s",
    (locale) => {
      // A dropped {count} renders the literal text; a renamed one renders
      // nothing at all. Both are only visible in that language.
      const values = dict(locale);
      const names = (value: string | undefined) =>
        (String(value ?? "").match(/\{(\w+)\}/g) ?? []).sort().join(",");

      const broken = storefrontKeys.filter(
        (key) => names(values[key]) !== names(translations.nl[key as never]),
      );
      expect(broken, `${locale} placeholders differ from Dutch`).toEqual([]);
    },
  );

  it.each(LOCALES.filter((locale) => locale !== "nl"))(
    "has no untranslated Dutch left in %s",
    (locale) => {
      const values = dict(locale);
      const copied = storefrontKeys.filter(
        (key) => !COGNATES.has(key) && values[key] === translations.nl[key as never],
      );
      expect(copied, `${locale} still carries the Dutch string`).toEqual([]);
    },
  );

  it("does not treat a word as a cognate that is no longer identical", () => {
    // Keeps the allow-list honest: once a string is properly translated its
    // exemption should go, or the next copy-paste hides behind it.
    const stale = [...COGNATES].filter((key) =>
      LOCALES.filter((locale) => locale !== "nl").every(
        (locale) => dict(locale)[key] !== translations.nl[key as never],
      ),
    );
    expect(stale, "these keys no longer match Dutch anywhere; drop them").toEqual([]);
  });
});

describe("no Dutch left on the storefront", () => {
  /**
   * Words that only occur in Dutch prose, never in code or in English.
   *
   * A screen string that slipped past the dictionary is invisible in review —
   * the page still renders, it just renders in the wrong language for three
   * quarters of the visitors it was translated for. This catches it.
   */
  const DUTCH =
    /\b(je|jij|jouw|niet|geen|wij|onze|wordt|worden|hebt|hebben|kunt|kunnen|graag|bericht|bestelling|retour|voorraad|verzend|betaal|winkelwagen|klant|gegevens|aanvraag|versturen|terugsturen|invullen|opnieuw|alleen|altijd|keuze|aanpassen|verkopen|formulier|pagina|inhoud|herroep|bedenktijd|consument)\b/i;

  /**
   * A route path is not copy. `to="/merken/$slug"` matches the word list by
   * accident, and rewriting route paths in four languages is not the job.
   */
  const ROUTE_PATH = /^\/[a-z0-9$/{}.$-]*$/i;

  const files = [
    ...readdirSync("src/routes")
      .filter((name) => name.endsWith(".tsx") && !name.startsWith("beheer"))
      .map((name) => `src/routes/${name}`),
    ...readdirSync("src/components")
      .filter((name) => name.endsWith(".tsx"))
      .map((name) => `src/components/${name}`),
  ];

  it("scans a meaningful number of files", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("has no untranslated screen copy", () => {
    const offenders: string[] = [];

    for (const path of files) {
      let source = readFileSync(path, "utf8");
      source = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

      const found = new Set<string>();
      // JSX text nodes.
      for (const match of source.matchAll(/>\s*([^<>{}\n][^<>{}]{6,140}?)\s*</g)) {
        const text = match[1].trim();
        if (DUTCH.test(text) && !ROUTE_PATH.test(text)) found.add(text.slice(0, 90));
      }
      // A Dutch phrase used as an object key that maps to a translation key is
      // not copy — it is the value stored in the database being looked up.
      source = source.replace(/["'`][^"'`\n]+["'`]\s*:\s*["'`]\w+\.\w+["'`]/g, "");

      // String literals, which is where a placeholder or an aria-label hides.
      for (const match of source.matchAll(/["'`]([^"'`\n]{8,140})["'`]/g)) {
        const text = match[1].trim();
        if (!DUTCH.test(text) || ROUTE_PATH.test(text)) continue;
        // A lowercase-only phrase is a class list or an identifier.
        if (/^[a-z-]+(\s+[a-z-]+)*$/.test(text)) continue;
        found.add(text.slice(0, 90));
      }

      for (const text of found) offenders.push(`${path.split("/").pop()}: ${text}`);
    }

    expect(offenders, "these strings never reach the dictionary").toEqual([]);
  });
});
