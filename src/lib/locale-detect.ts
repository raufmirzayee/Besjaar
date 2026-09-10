/**
 * Which language a visitor sees before they have chosen one.
 *
 * The old rule was localStorage, then `navigator.language.slice(0, 2)`, then
 * Dutch. Two things were wrong with it. A visitor from São Paulo got a Dutch
 * shop, because "pt" is not one of the four languages and the fallback was the
 * home language rather than the one most people can read. And a Dutch customer
 * whose laptop is set to English got an English shop while standing in
 * Rotterdam, because the country was never consulted.
 *
 * The order below is deliberate, and country comes before browser language:
 * where someone is buying from is a better guide to what they want to read
 * than how their operating system happened to be installed. A country with
 * more than one language falls back to the browser to break the tie.
 *
 *   1. the language they chose themselves — never overridden
 *   2. a locale in the URL, for a link that names one
 *   3. the country, from a CDN header (no geolocation prompt, no GPS)
 *   4. the browser's Accept-Language, in the order it lists them
 *   5. English — the language most visitors we cannot place will read
 *
 * Everything here is pure so it can be tested without a browser or a request.
 */

export const LOCALES = ["nl", "en", "de", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

/** English, not Dutch: this is what an unplaceable visitor gets. */
export const FALLBACK_LOCALE: Locale = "en";

/** The shop's home language, used where a country says Dutch. */
export const HOME_LOCALE: Locale = "nl";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Country to language.
 *
 * A country listing more than one language does not decide on its own — the
 * browser breaks the tie, and the first entry is the default when the browser
 * asks for something else entirely. Belgium leads with Dutch because that is
 * the shop's home language and its Flemish customers are the larger half of
 * its Belgian trade; a Walloon visitor whose browser says French still gets
 * French.
 */
const COUNTRY_LANGUAGES: Record<string, readonly Locale[]> = {
  NL: ["nl"],
  BE: ["nl", "fr"],
  DE: ["de"],
  AT: ["de"],
  CH: ["de", "fr"],
  LI: ["de"],
  FR: ["fr"],
  MC: ["fr"],
  LU: ["fr", "de"],
};

/**
 * Parses an Accept-Language header into base languages, best first.
 *
 * "nl-BE,nl;q=0.9,en;q=0.8" → ["nl", "en"]. Quality values order the list;
 * anything unparseable is skipped rather than throwing, because this is a
 * caller-supplied header and a malformed one must not break the page.
 */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  const seen = new Set<string>();
  const ordered: string[] = [];

  const entries = header
    .split(",")
    .slice(0, 20)
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const quality = q === undefined ? 1 : Number.parseFloat(q);
      return {
        base: tag.trim().slice(0, 8).split("-")[0].toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter((entry) => /^[a-z]{2,3}$/.test(entry.base) && entry.quality > 0)
    // A stable sort keeps equal-quality tags in the order the header listed
    // them, which is the order the browser meant.
    .sort((a, b) => b.quality - a.quality);

  for (const entry of entries) {
    if (seen.has(entry.base)) continue;
    seen.add(entry.base);
    ordered.push(entry.base);
  }
  return ordered;
}

export type LocaleSignals = {
  /** The visitor's own choice. Nothing overrides it. */
  stored?: string | null;
  /** A locale named in the URL, e.g. ?lang=de. */
  urlLocale?: string | null;
  /** ISO-3166 alpha-2, from a CDN header. */
  country?: string | null;
  /** The raw Accept-Language header, or navigator.language on the client. */
  acceptLanguage?: string | null;
};

export type LocaleDecision = {
  locale: Locale;
  /** Which rule decided, so the behaviour can be tested and explained. */
  source: "stored" | "url" | "country" | "browser" | "fallback";
};

/** Applies the five rules above and reports which one decided. */
export function pickLocale(signals: LocaleSignals): LocaleDecision {
  if (isLocale(signals.stored)) return { locale: signals.stored, source: "stored" };
  if (isLocale(signals.urlLocale)) return { locale: signals.urlLocale, source: "url" };

  const browser = parseAcceptLanguage(signals.acceptLanguage);

  const country = signals.country?.trim().toUpperCase();
  if (country && country in COUNTRY_LANGUAGES) {
    const spoken = COUNTRY_LANGUAGES[country];
    // One language: the country decides on its own.
    if (spoken.length === 1) return { locale: spoken[0], source: "country" };
    // More than one: the browser breaks the tie, and the country's first
    // language is the answer when the browser wants none of them.
    const preferred = browser.find((tag): tag is Locale => spoken.includes(tag as Locale));
    return { locale: preferred ?? spoken[0], source: "country" };
  }

  const fromBrowser = browser.find(isLocale);
  if (fromBrowser) return { locale: fromBrowser, source: "browser" };

  return { locale: FALLBACK_LOCALE, source: "fallback" };
}

/** The header names the common CDNs use for the caller's country. */
export const COUNTRY_HEADERS = [
  "cf-ipcountry", // Cloudflare — what this shop deploys behind
  "x-vercel-ip-country",
  "x-nf-client-connection-country",
  "x-geo-country",
  "x-country-code",
] as const;

/** Reads the first country header present. `XX` and `T1` mean "unknown". */
export function countryFromHeaders(headers: {
  get(name: string): string | null | undefined;
}): string | null {
  for (const name of COUNTRY_HEADERS) {
    const value = headers.get(name)?.trim().toUpperCase();
    // Cloudflare sends XX when it cannot place the address and T1 for Tor.
    if (value && /^[A-Z]{2}$/.test(value) && value !== "XX" && value !== "T1") return value;
  }
  return null;
}
