# Besjaar — SEO changes (2026-09-11)

Working copies of the theme files changed during the SEO pass.

- **Source theme (live, unmodified):** `besjaar-improved-v37-clear-clickable-welcome-popup` — ID `200516993351`, role `MAIN`
- **Target theme (unpublished):** `Besjaar - SEO Optimized - 2026-09-11` — ID `200618934599`, role `UNPUBLISHED`

The live theme was never written to. Each file below was reproduced byte-for-byte
from the live theme first (MD5-verified against the Admin API) and only then patched,
so the diff contains nothing but the intended changes.

## Changes

### `layout/theme.liquid`
1. **Homepage LCP preload corrected.** Preloaded `besjaar-premium-hero-pressure-v3.webp`
   at `fetchpriority="high"`, but the hero section renders `besjaar-hero-premium-spa.webp`.
   Cost ~77 KB of unused download per homepage visit while leaving the real LCP image
   unprioritised. Now preloads the asset actually rendered.
2. **Merchant homepage SEO title is honoured.** `if request.page_type == 'index'`
   overwrote `page_title` unconditionally, contradicting the comment above it. Now a
   title set under Online Store > Preferences wins; the localized brand title is the
   fallback (`shop.name` is Shopify's "not set" signal).
3. Passes the computed title/description into `structured-data.liquid`
   (`{% render %}` isolates scope, so the snippet could not otherwise see them).

### `snippets/meta-tags.liquid`
Removed the homepage override that forced `og:title` / `og:description` to two
translation keys. It produced three different homepage titles in one document
(`<title>`, `og:title`, JSON-LD `WebPage.name`) and discarded merchant-entered values.
Social tags now mirror `<title>` and `<meta name="description">`.

### `snippets/structured-data.liquid`
1. `WebPage` `name`/`description` use the real computed page metadata; the translation
   keys remain as fallback only.
2. Product JSON-LD no longer emits `"image": []` for products with no media — the
   property is omitted instead.

No schema values were fabricated; no ratings, GTINs, addresses or reviews were added.

## Verification

Shopify server-side Liquid validation passed; uploaded bytes MD5-match these files
(`c12b34…`, `10fee3…`, `af9a03…`); Liquid tags and JSON-LD braces balanced;
12 sampled untouched files byte-identical between live and duplicate.

**Not verified:** the environment's network policy blocks `www.besjaar.eu`, so no page
was render-tested and no rendered HTML was inspected.

## Open item — hreflang

The theme emits no hreflang tags, but Shopify auto-injects them via `content_for_header`
for multi-language stores. Adding our own could duplicate them. Check
`view-source:https://www.besjaar.eu/` for `hreflang`: if `nl` + `en` + `x-default` are
present, nothing is needed; if absent, they should be added.

Published languages: `nl` (primary), `en`. `de` and `fr` exist but are unpublished.
