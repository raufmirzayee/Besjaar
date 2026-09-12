import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { translations, type TranslationKey } from "@/lib/translations";
import { isLocale, LOCALES, type Locale } from "@/lib/locale-detect";

export { LOCALES, isLocale };
export type { Locale };

export const LOCALE_LABELS: Record<Locale, string> = {
  nl: "Nederlands",
  en: "English",
  de: "Deutsch",
  fr: "Français",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  nl: "NL",
  en: "EN",
  de: "DE",
  fr: "FR",
};

export const STORAGE_KEY = "besjaar-locale";

/**
 * The language every `t()` falls back to when a key is missing from the
 * visitor's own. Dutch, because that is the language the shop is written in
 * and the one guaranteed to be complete — this is not the language a visitor
 * is *shown*, which locale-detect.ts decides.
 */
const SOURCE_LOCALE: Locale = "nl";

/** The visitor's own saved choice, if they have made one. */
function storedLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    // Private browsing, or storage disabled. Not a reason to fail.
    return null;
  }
}

/**
 * A translator for code that runs outside the provider.
 *
 * The root error boundary is the case this exists for: it replaces the
 * component that renders `I18nProvider`, so `useI18n()` there would throw on
 * top of the error it is trying to report. It reads the language off the
 * document — the same value the server put in `<html lang>` — and falls back to
 * Dutch when there is no document, which is the SSR path.
 */
export function translateOutsideProvider(key: TranslationKey, locale?: Locale): string {
  let resolved: Locale = locale ?? SOURCE_LOCALE;
  if (!locale && typeof document !== "undefined") {
    // The same value the server put in <html lang>.
    const lang = document.documentElement.lang;
    if (isLocale(lang)) resolved = lang;
  }
  return translations[resolved][key] ?? translations[SOURCE_LOCALE][key] ?? key;
}

/**
 * The locale the router was given, for code that has a router but no provider.
 *
 * During server rendering there is no `document` to read the language off, so
 * `translateOutsideProvider` alone would answer in Dutch for everyone. The
 * router context carries the locale the server detected — the same value the
 * root route's `head()` uses — so an error page renders in the visitor's
 * language on the first response rather than after hydration.
 */
export function localeFromRouterState(state: unknown): Locale | undefined {
  const matches = (state as { matches?: { context?: { locale?: unknown } }[] })?.matches;
  const locale = matches?.[0]?.context?.locale;
  return isLocale(locale) ? locale : undefined;
}

type Vars = Record<string, string | number>;

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  /**
   * Decided on the server from the CDN country header and Accept-Language, so
   * the very first paint is already in the visitor's language. Server and
   * client render the same thing, so there is no hydration mismatch and no
   * visible flash.
   */
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? SOURCE_LOCALE);

  useEffect(() => {
    // A choice the visitor made themselves outranks anything detected, and it
    // only exists in their browser — so it can only be applied here, after
    // hydration. Applying it in useState would make the client render
    // something the server did not.
    const chosen = storedLocale();
    if (chosen && chosen !== locale) setLocaleState(chosen);
    // Runs once: later changes come through setLocale, which already stores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable. The choice still holds for this visit.
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Vars) => {
      const dict = translations[locale] as Partial<Record<TranslationKey, string>>;
      let text = dict[key] ?? translations[SOURCE_LOCALE][key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
