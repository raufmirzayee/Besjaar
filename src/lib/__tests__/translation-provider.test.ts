import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, globSync } from "node:fs";

import {
  NEVER_TRANSLATE,
  TRANSLATABLE_FIELDS,
  resolveTranslationProvider,
} from "../translation-provider.server";

/**
 * Three things must hold, and none of them is visible in review.
 *
 * The provider key must never reach the browser bundle. A shop that leaks its
 * translation key pays someone else's bill until it notices.
 *
 * Nothing technical may be sent to a translator. A translator will happily
 * turn a model number into a formatted figure, or localise a URL, and the
 * product silently stops matching what the supplier sells.
 *
 * With no key, nothing may be invented. A fabricated translation is worse than
 * a missing one: it is wrong in a language nobody in the office can check.
 */

const ORIGINAL_KEY = process.env.DEEPL_API_KEY;

beforeEach(() => {
  delete process.env.DEEPL_API_KEY;
  delete process.env.DEEPL_API_URL;
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.DEEPL_API_KEY;
  else process.env.DEEPL_API_KEY = ORIGINAL_KEY;
  vi.unstubAllGlobals();
});

describe("provider credentials", () => {
  it("returns no provider when no key is configured", () => {
    expect(resolveTranslationProvider()).toBeNull();
  });

  it("returns a provider when a key is configured", () => {
    process.env.DEEPL_API_KEY = "test-key";
    expect(resolveTranslationProvider()?.name).toBe("deepl");
  });

  it("sends a free-tier key to the free-tier host", async () => {
    // A ":fx" key on the paid host returns 403 with no explanation.
    process.env.DEEPL_API_KEY = "abc:fx";
    const fetchMock = vi.fn(
      async (_url: unknown, _init?: unknown) =>
        new Response(JSON.stringify({ translations: [{ text: "Torch" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await resolveTranslationProvider()!.translate({
      fields: { name: "Zaklamp" },
      from: "nl",
      to: "en",
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("api-free.deepl.com");
  });

  it("sends a paid key to the paid host", async () => {
    process.env.DEEPL_API_KEY = "abc";
    const fetchMock = vi.fn(
      async (_url: unknown, _init?: unknown) =>
        new Response(JSON.stringify({ translations: [{ text: "Torch" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await resolveTranslationProvider()!.translate({
      fields: { name: "Zaklamp" },
      from: "nl",
      to: "en",
    });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("api.deepl.com");
    expect(url).not.toContain("api-free");
  });

  it("never names the provider module in a file that ships to the browser", () => {
    // The rule that keeps the key server-side: a *.functions.ts file and a
    // route file are both bundled for the client, so neither may import this
    // module at the top level. A dynamic import inside a handler is fine —
    // that stays on the server.
    const offenders: string[] = [];
    const clientReachable = [
      ...globSync("src/routes/**/*.tsx"),
      ...globSync("src/components/**/*.tsx"),
      ...globSync("src/lib/*.functions.ts"),
    ];

    for (const path of clientReachable) {
      const source = readFileSync(path, "utf8");
      for (const line of source.split("\n")) {
        const isStaticImport = /^\s*import\s[^(]*from\s+["'].*translation-provider\.server/.test(
          line,
        );
        const isStaticAutoTranslate = /^\s*import\s[^(]*from\s+["'].*auto-translate\.server/.test(
          line,
        );
        if (isStaticImport || isStaticAutoTranslate) offenders.push(`${path}: ${line.trim()}`);
      }
    }
    expect(
      offenders,
      "these files ship to the browser and statically import a server-only translation module",
    ).toEqual([]);
  });

  it("keeps the key out of the module's own exported surface", () => {
    process.env.DEEPL_API_KEY = "super-secret-key";
    const provider = resolveTranslationProvider()!;
    // The key is a private constructor field; serialising the provider must
    // not spill it into a log line or an error report.
    expect(JSON.stringify(provider) ?? "").not.toContain("super-secret-key");
    expect(String(provider)).not.toContain("super-secret-key");
  });
});

describe("what may be translated", () => {
  it("never translates identifiers, codes, URLs or prices", () => {
    for (const field of NEVER_TRANSLATE) {
      for (const entity of Object.keys(
        TRANSLATABLE_FIELDS,
      ) as (keyof typeof TRANSLATABLE_FIELDS)[]) {
        expect(
          TRANSLATABLE_FIELDS[entity] as readonly string[],
          `${entity} must not translate ${field}`,
        ).not.toContain(field);
      }
    }
  });

  it("covers the fields the review asked for", () => {
    expect(TRANSLATABLE_FIELDS.product).toContain("name");
    expect(TRANSLATABLE_FIELDS.product).toContain("short_description");
    expect(TRANSLATABLE_FIELDS.product).toContain("full_description");
    expect(TRANSLATABLE_FIELDS.product).toContain("seo_title");
    expect(TRANSLATABLE_FIELDS.product).toContain("seo_description");
    expect(TRANSLATABLE_FIELDS.category).toContain("description");
    expect(TRANSLATABLE_FIELDS.brand).toContain("description");
  });

  it("leaves a brand name alone", () => {
    // RYNEX is RYNEX in every language.
    expect(TRANSLATABLE_FIELDS.brand as readonly string[]).not.toContain("name");
  });
});

describe("provider behaviour", () => {
  it("returns nothing for an empty batch, without calling out", async () => {
    process.env.DEEPL_API_KEY = "abc";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await resolveTranslationProvider()!.translate({
      fields: {},
      from: "nl",
      to: "de",
    });
    expect(result.fields).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps each returned string back to the field it came from", async () => {
    process.env.DEEPL_API_KEY = "abc";
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(
          JSON.stringify({ translations: [{ text: "Torch" }, { text: "A bright torch" }] }),
          { status: 200 },
        ),
    );
    const result = await resolveTranslationProvider()!.translate({
      fields: { name: "Zaklamp", short_description: "Een felle zaklamp" },
      from: "nl",
      to: "en",
    });
    expect(result.fields).toEqual({ name: "Torch", short_description: "A bright torch" });
  });

  it("drops a field the provider returned empty rather than writing a blank", async () => {
    process.env.DEEPL_API_KEY = "abc";
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(JSON.stringify({ translations: [{ text: "Torch" }, { text: "   " }] }), {
          status: 200,
        }),
    );
    const result = await resolveTranslationProvider()!.translate({
      fields: { name: "Zaklamp", short_description: "Een felle zaklamp" },
      from: "nl",
      to: "en",
    });
    expect(result.fields).toEqual({ name: "Torch" });
    expect(result.fields).not.toHaveProperty("short_description");
  });

  it("throws rather than inventing text when the provider fails", async () => {
    process.env.DEEPL_API_KEY = "abc";
    vi.stubGlobal("fetch", async () => new Response("quota exceeded", { status: 456 }));
    await expect(
      resolveTranslationProvider()!.translate({
        fields: { name: "Zaklamp" },
        from: "nl",
        to: "en",
      }),
    ).rejects.toThrow(/456/);
  });

  it("asks for English with a variant, which DeepL requires", async () => {
    process.env.DEEPL_API_KEY = "abc";
    const fetchMock = vi.fn(
      async (_url: unknown, _init?: unknown) =>
        new Response(JSON.stringify({ translations: [{ text: "Torch" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await resolveTranslationProvider()!.translate({
      fields: { name: "Zaklamp" },
      from: "nl",
      to: "en",
    });
    const body = String((fetchMock.mock.calls[0]?.[1] as { body?: unknown } | undefined)?.body);
    expect(body).toContain("target_lang=EN-GB");
    expect(body).toContain("source_lang=NL");
  });
});
