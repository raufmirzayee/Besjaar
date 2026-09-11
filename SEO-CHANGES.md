# Besjaar — SEO changes (2026-09-11)

Theme: **Besjaar - SEO Optimized - 2026-09-11** (Shopify theme ID `200618934599`)
Status: **UNPUBLISHED**. Copied from the live theme
`besjaar-improved-v37-clear-clickable-welcome-popup` (ID `200516993351`),
which was **not modified**.

Only 3 of the 281 theme files differ from the live theme. Everything else is
byte-identical.

---

## 1. layout/theme.liquid — home page LCP preload corrected

**Problem.** The head preloaded `besjaar-premium-hero-pressure-v3.webp` at
`fetchpriority="high"`, but the home page hero (`sections/besjaar-store-hero.liquid`)
renders `besjaar-hero-premium-spa.webp`. Every home page visit downloaded ~77 KB
that was never used, while competing with the real LCP image, which received no
priority at all.

**Fix.** Preload the asset the hero actually renders. No `srcset`, for the reason
the hero section documents: Shopify's CDN does not generate size variants for
theme assets.

**Benefit.** Faster Largest Contentful Paint; ~77 KB of wasted transfer removed.

---

## 2. layout/theme.liquid — merchant SEO title now honoured on the home page

**Problem.** `if request.page_type == 'index'` overwrote `page_title`
unconditionally, discarding a Search engine listing title set in
Online Store > Preferences — directly contradicting the comment above it, which
claimed a merchant title always wins.

**Fix.** Use `page_title` when it differs from `shop.name` (Shopify's "not set"
signal); otherwise fall back to the localized brand title.

---

## 3. layout/theme.liquid — on-topic meta description fallback

**Problem.** The last-resort fallback was `shop.description`, which on this store
is generic boilerplate that never mentions showerheads or filters. Any page
without its own SEO description inherited off-topic copy.

**Fix.** Fall back to a short on-topic brand line in the visitor's language
(NL/EN/DE/FR), each 123-135 characters.

**Note.** The store-level description in Online Store > Preferences is still that
boilerplate. Worth fixing in admin — it is outside theme code.

---

## 4. snippets/meta-tags.liquid — consistent home page social metadata

**Problem.** The home page forced `og:title` / `og:description` to two translation
keys. Combined with the `<title>` and the `WebPage` JSON-LD node, one document
advertised three different home page titles, and merchant-entered values were
ignored.

**Fix.** Removed the override. `layout/theme.liquid` passes the computed title and
description in, so the social tags now mirror `<title>` and the meta description.

---

## 5. snippets/structured-data.liquid — WebPage node reflects the real page

**Problem.** The `WebPage` node restated translation keys instead of the page's
actual title and description.

**Fix.** `layout/theme.liquid` passes the computed values in; the translation keys
remain only as a fallback.

---

## 6. snippets/structured-data.liquid — no empty Product properties

**Problem.** Products with no media emitted `"image": []`, and products with no
description emitted `"description": ""`. Both are invalid structured data.

**Fix.** Omit each property entirely when there is nothing to put in it.

---

## Deliberately NOT changed

- **hreflang.** Not added. Shopify automatically injects hreflang for
  multi-language stores, and a duplicate set would make Google ignore both.
  Verify first: open the site, View Source, search `hreflang`. Add only if absent.
- **Render-blocking CSS (~626 KB across 14 always-loaded stylesheets).** The
  largest remaining performance item, but cascade order is load-bearing
  (`besjaar-premium-lux.css` must stay last) and it needs visual regression
  testing.
- **Hero `alt` text.** Currently reuses the H1 sentence. A descriptive alt needs
  someone who can see the image; inventing one would risk describing it wrongly.
- **B2B consent checkbox** has no `name` attribute, so the agreement is not
  recorded in the notification email. Fixing it changes the email body, so it was
  left alone.
- Products, prices, inventory, orders, customers, payments, shipping, taxes,
  checkout, domains, Markets, analytics, pixels and apps: untouched.

---

## Verification performed

- Liquid syntax validated server-side by Shopify on every write.
- Uploaded bytes confirmed byte-identical to local copies via MD5.
- Liquid tag balance and JSON-LD brace/bracket balance checked across all blocks.
- All 281 files in this archive re-downloaded from the theme and re-validated;
  every `.json` file parses.

**Not performed:** no page was rendered. The environment could not reach
`www.besjaar.eu`, so browser testing (variants, cart, mobile menu, language
switcher, Willdesk, app embeds) and rendered-HTML validation remain outstanding.
Preview at `https://www.besjaar.eu/?preview_theme_id=200618934599`.
