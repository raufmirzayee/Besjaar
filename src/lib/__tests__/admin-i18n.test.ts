import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

import { adminMessages } from "@/lib/translations/admin";
import { translations } from "@/lib/translations";
import { LOCALES } from "@/lib/i18n";

const nl = adminMessages.nl!;
const en = adminMessages.en!;

describe("admin translations", () => {
  it("covers the backoffice in both languages", () => {
    expect(Object.keys(nl).length).toBeGreaterThan(300);
    expect(Object.keys(en)).toHaveLength(Object.keys(nl).length);
  });

  it("translates every Dutch key into English", () => {
    const missing = Object.keys(nl).filter((key) => !(key in en));
    expect(missing, "English is missing these keys").toEqual([]);
  });

  it("has no English key without a Dutch source", () => {
    const orphans = Object.keys(en).filter((key) => !(key in nl));
    expect(orphans, "English has keys Dutch does not").toEqual([]);
  });

  it("leaves nothing blank", () => {
    for (const [key, value] of Object.entries({ ...nl, ...en })) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("actually translated the English, rather than copying the Dutch", () => {
    // A handful of words are legitimately identical (Dashboard, Content,
    // bol.com, Super admin). Beyond that, copies mean untranslated strings.
    const identical = Object.keys(nl).filter(
      (key) => nl[key as keyof typeof nl] === en[key as keyof typeof en],
    );
    expect(identical.length / Object.keys(nl).length).toBeLessThan(0.2);
  });

  it("keeps placeholders intact across languages", () => {
    for (const key of Object.keys(nl) as (keyof typeof nl)[]) {
      const vars = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort().join(",");
      expect(vars(en[key]), `placeholders differ in ${key}`).toBe(vars(nl[key]));
    }
  });

  it("resolves through the shared dictionary for both admin locales", () => {
    for (const locale of ["nl", "en"] as const) {
      expect(translations[locale]["admin.shell.title" as never]).toBeTruthy();
      expect(translations[locale]["admin.nav.orders" as never]).toBeTruthy();
    }
  });

  it("falls back to Dutch for locales the backoffice does not cover", () => {
    // German and French have no admin copy; t() drops to Dutch, so the key
    // must still resolve rather than render as a raw key name.
    for (const locale of LOCALES) {
      const dict = translations[locale] as Record<string, string | undefined>;
      const value = dict["admin.nav.orders"] ?? translations.nl["admin.nav.orders" as never];
      expect(value, locale).toBeTruthy();
    }
  });
});

describe("no Dutch left in the backoffice", () => {
  const files = [
    ...readdirSync("src/routes")
      .filter((f) => f.startsWith("beheer") && f.endsWith(".tsx"))
      .map((f) => `src/routes/${f}`),
    ...readdirSync("src/components/admin").map((f) => `src/components/admin/${f}`),
  ];

  it("has no untranslated screen copy", () => {
    const offenders: string[] = [];
    for (const path of files) {
      let src = readFileSync(path, "utf8");
      // head() runs outside React, so its meta tags keep their literals; they
      // are noindex pages and nobody reads them.
      src = src.replace(/head: \(\) => \(\{[\s\S]*?\n {2}\}\),/g, "");
      const found = new Set<string>();
      for (const m of src.matchAll(/>\s*([A-ZÀ-Ý][a-zéëïöüà-ý][^<>{}\n]{3,70}?)\s*</g)) {
        const text = m[1].trim();
        // A lone capitalised identifier is a generic type annotation
        // (Promise<T>, Record<K,V>), not screen copy.
        if (/^[A-Za-z]+$/.test(text) && !/[a-z]{2,}\s/.test(text)) continue;
        found.add(text);
      }
      for (const s of found) offenders.push(`${path.split("/").pop()}: ${s}`);
    }
    expect(offenders).toEqual([]);
  });
});
