import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  auditProductTranslations,
  formatTranslationIssues,
  type AuditableProduct,
} from "@/lib/translation-audit";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const hasBackend = Boolean(url && key);

/**
 * CI regression guard: every active product must have its own title and long
 * description in EN/DE/FR so the storefront never falls back to Dutch.
 */
describe.skipIf(!hasBackend)("active product translation coverage", () => {
  it("has no Dutch fallbacks for titles or long descriptions", async () => {
    const supabase = createClient(url!, key!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key!.startsWith("sb_")) headers.delete("Authorization");
          headers.set("apikey", key!);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { data, error } = await supabase
      .from("products")
      .select("slug, name, full_description, translations")
      .eq("status", "active");

    expect(error, error?.message).toBeNull();
    const products = (data ?? []) as unknown as AuditableProduct[];
    expect(products.length).toBeGreaterThan(0);

    const issues = auditProductTranslations(products);
    expect(issues, `Dutch fallbacks found:\n${formatTranslationIssues(issues)}`).toEqual([]);
  }, 30_000);
});
