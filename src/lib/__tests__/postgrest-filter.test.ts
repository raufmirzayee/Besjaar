import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { likePattern, quoteFilterValue } from "../postgrest-filter";

describe("quoteFilterValue", () => {
  it("quotes a plain value", () => {
    expect(quoteFilterValue("lamp")).toBe('"lamp"');
  });

  it("escapes the characters that would end the quoted value early", () => {
    expect(quoteFilterValue('say "hi"')).toBe('"say \\"hi\\""');
    expect(quoteFilterValue("back\\slash")).toBe('"back\\\\slash"');
  });

  it("escapes backslashes before quotes, not after", () => {
    // The other order would escape the backslash this step adds, and the value
    // would end one character early.
    expect(quoteFilterValue('a\\"b')).toBe('"a\\\\\\"b"');
  });
});

describe("likePattern", () => {
  it("wraps the term and trims it", () => {
    expect(likePattern("  lamp  ")).toBe('"%lamp%"');
  });

  it("keeps a grammar character inside the value", () => {
    expect(likePattern("a,b")).toBe('"%a,b%"');
    expect(likePattern("a.b")).toBe('"%a.b%"');
    expect(likePattern("a(b)")).toBe('"%a(b)%"');
  });
});

/**
 * The escaping only matters if it survives into the request supabase-js
 * actually builds, so this asserts the URL rather than the helper's return
 * value. The builder exposes the URL it will fetch, which is as far as this can
 * go without a PostgREST server; how PostgREST then parses that URL is checked
 * against its documented quoting rule, not here.
 */
describe("the URL supabase-js builds", () => {
  const client = createClient("https://probe.invalid", "not-a-real-key");

  const urlFor = (filter: string) =>
    decodeURIComponent(
      (
        client.from("products").select("id").or(filter).limit(5) as unknown as { url: URL }
      ).url.toString(),
    );

  it("puts an injected condition inside the value instead of beside it", () => {
    // Unquoted, `or=(name.ilike.%a,id.gte.0%,ean.ilike.%a,id.gte.0%)` is four
    // comma-separated conditions, and `id.gte.0` — the caller's, not the
    // shop's — matches every row in the table. Quoted, the comma is part of
    // the pattern.
    const term = "a,id.gte.0";

    const injected = urlFor(`name.ilike.%${term}%,ean.ilike.%${term}%`);
    expect(injected).toContain("or=(name.ilike.%a,id.gte.0%,ean.ilike.%a,id.gte.0%)");

    const quoted = urlFor(`name.ilike.${likePattern(term)},ean.ilike.${likePattern(term)}`);
    expect(quoted).toContain('or=(name.ilike."%a,id.gte.0%",ean.ilike."%a,id.gte.0%")');
  });

  it("still builds an ordinary search the same way", () => {
    expect(urlFor(`name.ilike.${likePattern("lamp")}`)).toContain('or=(name.ilike."%lamp%")');
  });
});
