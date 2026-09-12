import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { countryFromHeaders, pickLocale, type Locale } from "./locale-detect";

/**
 * Chooses the visitor's language on the server, before anything is rendered.
 *
 * Doing this on the client meant the first paint was always Dutch and then
 * flipped — a visible flash, and markup whose `lang` attribute was wrong for
 * every non-Dutch visitor, which is what a screen reader and a search engine
 * both read.
 *
 * Only privacy-friendly signals: a country header the CDN already attached to
 * the request, and the Accept-Language the browser already sent. No
 * geolocation prompt, no GPS, nothing stored about the visitor.
 *
 * The visitor's own saved choice is not read here — it lives in their browser,
 * and the provider applies it after hydration, where it overrides this.
 */
export const getInitialLocale = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const request = getRequest();
    const url = new URL(request.url);
    const decision = pickLocale({
      urlLocale: url.searchParams.get("lang"),
      country: countryFromHeaders(request.headers),
      acceptLanguage: request.headers.get("accept-language"),
    });
    return { locale: decision.locale as Locale, source: decision.source };
  } catch {
    // No request in scope. The provider's own default covers it.
    return { locale: "nl" as Locale, source: "fallback" as const };
  }
});
