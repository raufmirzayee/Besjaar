import { describe, expect, it } from "vitest";

import {
  countryFromHeaders,
  parseAcceptLanguage,
  pickLocale,
  FALLBACK_LOCALE,
} from "../locale-detect";

describe("Accept-Language parsing", () => {
  it("orders by quality, best first", () => {
    expect(parseAcceptLanguage("de;q=0.5,en;q=0.9,fr;q=0.7")).toEqual(["en", "fr", "de"]);
  });

  it("keeps the header's own order for equal quality", () => {
    expect(parseAcceptLanguage("nl,en,de")).toEqual(["nl", "en", "de"]);
  });

  it("reduces a regional tag to its base language", () => {
    expect(parseAcceptLanguage("nl-BE,fr-BE;q=0.8")).toEqual(["nl", "fr"]);
  });

  it("drops duplicates, keeping the best position", () => {
    expect(parseAcceptLanguage("nl-NL,nl;q=0.9,en;q=0.8")).toEqual(["nl", "en"]);
  });

  it("ignores a q=0 tag, which means 'not this one'", () => {
    expect(parseAcceptLanguage("de;q=0,en;q=0.9")).toEqual(["en"]);
  });

  it("survives a malformed header rather than throwing", () => {
    // Caller-supplied, so it will eventually be garbage.
    expect(parseAcceptLanguage("")).toEqual([]);
    expect(parseAcceptLanguage(null)).toEqual([]);
    expect(parseAcceptLanguage(";;;q=")).toEqual([]);
    expect(parseAcceptLanguage("*")).toEqual([]);
    expect(parseAcceptLanguage("en;q=notanumber,de")).toEqual(["de"]);
  });

  it("does not read an unbounded header", () => {
    const huge = Array.from({ length: 500 }, (_, i) => `x${i}`).join(",");
    expect(parseAcceptLanguage(huge).length).toBeLessThanOrEqual(20);
  });
});

describe("locale decision", () => {
  it("1. the visitor's own choice wins over everything", () => {
    const decision = pickLocale({
      stored: "fr",
      urlLocale: "de",
      country: "NL",
      acceptLanguage: "nl",
    });
    expect(decision).toEqual({ locale: "fr", source: "stored" });
  });

  it("2. a locale in the URL beats the country and the browser", () => {
    expect(pickLocale({ urlLocale: "de", country: "NL", acceptLanguage: "nl" })).toEqual({
      locale: "de",
      source: "url",
    });
  });

  it("3. the country beats the browser language", () => {
    // A Dutch customer whose laptop is in English, buying from Rotterdam.
    expect(pickLocale({ country: "NL", acceptLanguage: "en-US,en" })).toEqual({
      locale: "nl",
      source: "country",
    });
  });

  it("3. Germany, Austria and Liechtenstein all read German", () => {
    for (const country of ["DE", "AT", "LI"]) {
      expect(pickLocale({ country, acceptLanguage: "en" }).locale).toBe("de");
    }
  });

  it("3. France and Monaco read French", () => {
    for (const country of ["FR", "MC"]) {
      expect(pickLocale({ country, acceptLanguage: "en" }).locale).toBe("fr");
    }
  });

  it("3. Belgium is settled by the browser", () => {
    expect(pickLocale({ country: "BE", acceptLanguage: "fr-BE,fr" }).locale).toBe("fr");
    expect(pickLocale({ country: "BE", acceptLanguage: "nl-BE,nl" }).locale).toBe("nl");
  });

  it("3. Belgium falls back to Dutch when the browser asks for neither", () => {
    expect(pickLocale({ country: "BE", acceptLanguage: "en-GB,en" }).locale).toBe("nl");
  });

  it("3. Switzerland and Luxembourg use their own defaults", () => {
    expect(pickLocale({ country: "CH", acceptLanguage: "it" }).locale).toBe("de");
    expect(pickLocale({ country: "CH", acceptLanguage: "fr-CH,fr" }).locale).toBe("fr");
    expect(pickLocale({ country: "LU", acceptLanguage: "en" }).locale).toBe("fr");
    expect(pickLocale({ country: "LU", acceptLanguage: "de-LU,de" }).locale).toBe("de");
  });

  it("4. an unlisted country falls through to the browser", () => {
    // Germany's language, but bought from Spain: the browser is all we have.
    expect(pickLocale({ country: "ES", acceptLanguage: "de-DE,de" })).toEqual({
      locale: "de",
      source: "browser",
    });
  });

  it("5. an unplaceable visitor gets English, not Dutch", () => {
    // The bug this replaces: a visitor from São Paulo got a Dutch shop.
    expect(pickLocale({ country: "BR", acceptLanguage: "pt-BR,pt" })).toEqual({
      locale: FALLBACK_LOCALE,
      source: "fallback",
    });
    expect(pickLocale({}).locale).toBe("en");
    expect(pickLocale({ country: "JP", acceptLanguage: "ja" }).locale).toBe("en");
  });

  it("ignores a stored value that is not a language we have", () => {
    // A stale or hand-edited localStorage entry must not blank the shop.
    expect(pickLocale({ stored: "kl", country: "NL" }).locale).toBe("nl");
    expect(pickLocale({ stored: "", acceptLanguage: "de" }).locale).toBe("de");
  });

  it("accepts a country header in any case", () => {
    expect(pickLocale({ country: "nl" }).locale).toBe("nl");
    expect(pickLocale({ country: " De " }).locale).toBe("de");
  });
});

describe("country header", () => {
  const headersOf = (values: Record<string, string>) => ({
    get: (name: string) => values[name.toLowerCase()] ?? null,
  });

  it("reads Cloudflare's header first", () => {
    expect(countryFromHeaders(headersOf({ "cf-ipcountry": "DE" }))).toBe("DE");
  });

  it("falls back to the other CDNs' headers", () => {
    expect(countryFromHeaders(headersOf({ "x-vercel-ip-country": "fr" }))).toBe("FR");
    expect(countryFromHeaders(headersOf({ "x-country-code": "be" }))).toBe("BE");
  });

  it("treats Cloudflare's unknown markers as no country", () => {
    // XX is "could not place"; T1 is Tor. Both would otherwise look like a
    // real country code and send the visitor somewhere arbitrary.
    expect(countryFromHeaders(headersOf({ "cf-ipcountry": "XX" }))).toBeNull();
    expect(countryFromHeaders(headersOf({ "cf-ipcountry": "T1" }))).toBeNull();
  });

  it("rejects anything that is not two letters", () => {
    expect(countryFromHeaders(headersOf({ "cf-ipcountry": "NLD" }))).toBeNull();
    expect(countryFromHeaders(headersOf({ "cf-ipcountry": "" }))).toBeNull();
    expect(countryFromHeaders(headersOf({}))).toBeNull();
  });
});
