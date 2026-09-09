import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { translations, type TranslationKey } from "@/lib/translations";

export const LOCALES = ["nl", "en", "de", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

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

const STORAGE_KEY = "besjaar-locale";
const DEFAULT_LOCALE: Locale = "nl";

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

function detectLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const nav = window.navigator.language?.slice(0, 2).toLowerCase();
  return isLocale(nav) ? nav : DEFAULT_LOCALE;
}

type Vars = Record<string, string | number>;

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Always start at the default locale so server and client markup match,
  // then switch to the stored/browser preference after hydration.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const detected = detectLocale();
    if (detected !== DEFAULT_LOCALE) setLocaleState(detected);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Vars) => {
      const dict = translations[locale] as Partial<Record<TranslationKey, string>>;
      let text = dict[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
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
