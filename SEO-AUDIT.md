# besjaar.eu — Technical & Content SEO Audit + 30-Day Execution Plan

**Audited:** 13 Oct 2026 · **Store:** Besjaar (Univex B.V., Assen NL) · **Plan:** Shopify Basic · **Live theme:** "Besjaar – materiaal schema 9 okt (preview)" (custom, role MAIN)

**Method:** Everything below comes from live store data pulled through the Shopify Admin API: products, collections, translations, Markets, web presences, delivery profiles, policies, menus, pages, blogs, and the live theme's Liquid/JSON/asset files. The audit environment's network policy blocked direct HTTP requests to `www.besjaar.eu`. Three things were therefore not observed directly: rendered HTML output (hreflang emitted by `content_for_header`), `robots.txt`, and real Core Web Vitals. Each section that depends on them includes a verification step.

---

## 0. Executive summary — what actually matters for this store

The brief describes a broad home/lifestyle catalogue (shower heads, LED tools, personal care). **The live store is a 5-SKU single-category shop:** 4 shower heads plus 1 filter refill set, Dutch-primary, published in nl/de/en/fr/es, shipping to NL/BE/DE/FR/ES. This plan is built for that catalogue, with a pattern for adding categories later (§2.3).

The theme already gets a lot right, so it doesn't need a generic overhaul:

- Primary-domain canonical override for the extra domains (`layout/theme.liquid:62-68`).
- No collection-scoped product links. Every card links to `/products/<handle>`.
- Product JSON-LD built on Shopify's serializer, with one merged `aggregateRating`, a GS1-validated GTIN, `shippingDetails`, `hasMerchantReturnPolicy`, and a `MemberProgram` node.
- `noindex,follow` on `/collections/all`, tag/filter views, search, cart, account and tracking pages.
- Consent Mode v2 wired to Shopify's Customer Privacy API.
- Product LCP image preloaded with matching `srcset` and `fetchpriority="high"`.
- Fonts self-hosted on Shopify's CDN (the Google Fonts IP leak was removed).
- All products have SEO titles, descriptions and alt text in all 5 languages.

**The 10 issues that move the needle, ranked:**

| # | Issue | Impact | Effort |
|---|---|---|---|
| 1 | **`www.slimhome.nl` serves the whole store as a separate web presence** (nl/de/en/fr) instead of 301-redirecting. Its auto-generated hreflang points at slimhome URLs while the canonical points at besjaar.eu, so the two signals conflict. | High: duplicate site, split link equity | 15 min (admin) |
| 2 | **~880 KB (home) / ~910 KB (product) of render-blocking CSS** in 12–15 stylesheets, many of them layered "patch" files (`seo-carriers-early/late`, `seo-finish`, `polish-layer`, `*-step2..6`, `desktop-fixes`). This is the dominant mobile LCP/FCP cost. | High: CWV, crawl budget | 2–4 days dev |
| 3 | **Collection copy contradicts product copy.** Collection body and meta descriptions in all 5 languages say the filter removes *kalk* (limescale) and gives *zachter water*. Every product page states the opposite: *"een douchefilter maakt water niet zachter en verwijdert geen opgeloste kalk."* | High: misleading-claim risk (EU UCPD / ACM) and trust signals | 1 h |
| 4 | **Markets misconfigured for the EU.** BE/DE/FR/ES sit inside a "Worldwide" market of ~240 countries with **USD base currency**, and there are no shipping rates outside 5 countries. Googlebot (US IPs) may receive USD offers. | High: Merchant listings, price consistency | 30 min |
| 5 | **Published empty or duplicate pages block their own redirects.** `/pages/faq` (empty), `/pages/inloggen` (empty), and `/pages/privacy-policy`, `refund-policy`, `shipping-policy`, `terms-of-services` (duplicating `/policies/*`). Shopify redirects only fire when the source URL 404s, so the redirects you created never run. | Medium: thin and duplicate URLs ×5 languages | 10 min |
| 6 | **Blog cannibalization.** `/blogs/news` holds 5 posts that each restate one product page ("Besjaar Douchekop met Filter: 10 standen en een ingebouwd filter"). 33 posts in 5 weeks, published in batches minutes apart, translated ×5 languages, gives ~165 URLs of scaled content. | Medium | 2 h |
| 7 | **Schema accuracy.** Zone-2 transit time falls back to 1–1 day (the policy says 1–3 business days). The return policy is declared only for NL. JSON-LD `@id`/breadcrumb URLs use the request host, not the primary domain. **Patch included.** | Medium: Merchant listing eligibility | 15 min |
| 8 | **Main nav "Assortiment" links to `/collections/all`**, which is `noindex`. The highest-equity link on every page points to a page that can't rank. | Medium | 5 min |
| 9 | **Home hero LCP image**: a 145 KB, 1916×821 WebP theme asset served at full size to phones (theme assets can't use Shopify's resizer). | Medium: mobile LCP | 1 h |
| 10 | **Trust/legal hygiene.** Judge.me carousel has `show_sample_reviews: true`. Two different business addresses and two phone numbers across policies. Two different bol.com brand IDs (`604080876` vs `603580876`). No GPSR manufacturer block on product pages. | Medium: E-E-A-T and EU compliance | 1 h |

---

## 1. Shopify Technical & Performance Audit

### 1.1 Liquid theme bottlenecks (found in the live theme)

**A. Render-blocking CSS is the #1 problem.** Every `stylesheet_tag` blocks first paint, whether it's in `<head>` or preloaded from a section. On a product page using the live `product.json` template (all 5 products have an empty template suffix), the theme loads these (uncompressed sizes):

| File | KB | Loaded on |
|---|---|---|
| `besjaar-seo-base.css` | 263 | all |
| `besjaar-seo-design.css` | 200 | all |
| `besjaar-seo-carriers-late.css` (via `besjaar-desktop-fixes-1170`) | 119 | all |
| `besjaar-seo-carriers-early.css` (via `besjaar-runtime-1167`) | 97 | all |
| `besjaar-seo-finish.css` | 73 | all |
| `besjaar-seo-commerce.css` | 48 | all |
| `besjaar-product-step4.css` | 30 | product |
| `besjaar-store-home.css` | 22 | index + product |
| `besjaar-product-detail.css` (via `besjaar-store-product`) | 19 | product |
| `besjaar-ui-shower-trust-education.css` + `besjaar-reviews.css` (via `besjaar-ui-reviews`) | 15 | product |
| `besjaar-ui-cart.css`, `discount-badge`, `campaign`, `mobile-detail-clarity` | 22 | various |
| **Total** | **~910 KB product / ~880 KB home** | |

`besjaar-ui-product-page.css` (105 KB) only loads on the unused `product.shower` template. If nothing is assigned to that template, it's dead weight in the theme.

On top of that, the header group renders **21 sections** (`besjaar-tokens-1164` … `besjaar-menu-rows-1173`). Most of them only inject an inline `<style>` or `<script>` patch, which adds DOM and main-thread parse work to every page.

The file names show the cause: each design iteration added a new override layer ("step2", "step4", "step6", "finish", "polish", "late") instead of editing the base. Most of these rules override earlier rules, so a large share of the ~1 MB is dead or overridden CSS.

**Fix: a 3-step consolidation.** Do it on a duplicate theme.

1. **Measure.** In Chrome DevTools → *Coverage*, load `/`, `/collections/showerhead`, one product and one article at 390 px width. Export the coverage report. Expect 70–85% unused bytes.
2. **Consolidate** into 3 files:
   - `besjaar-global.css` (header, footer, cart drawer, typography, tokens)
   - `besjaar-template-{index|product|collection|content}.css` (one loaded per `request.page_type`)
   - Fold the 21 header-group patch sections' inline `<style>` blocks into the right file and delete those sections from `header-group.json`.

   Use PurgeCSS or `critters` locally against saved HTML from each template. Be careful with JS-toggled classes (`is-open`, `is-active`, drawer and modal states), and add them to a safelist.
3. **Inline critical CSS** for above-the-fold header + hero + PDP gallery (target < 14 KB), and load the rest without blocking render:

```liquid
{%- comment -%} layout/theme.liquid — replaces the chain of stylesheet_tag calls {%- endcomment -%}
<style id="bj-critical">{% render 'critical-css', template: request.page_type %}</style>

{%- liquid
  assign bj_tpl_css = 'besjaar-template-content.css'
  case request.page_type
    when 'index'
      assign bj_tpl_css = 'besjaar-template-index.css'
    when 'product'
      assign bj_tpl_css = 'besjaar-template-product.css'
    when 'collection', 'search', 'list-collections'
      assign bj_tpl_css = 'besjaar-template-collection.css'
  endcase
-%}
<link rel="preload" href="{{ 'besjaar-global.css' | asset_url }}" as="style">
<link rel="stylesheet" href="{{ 'besjaar-global.css' | asset_url }}" media="print" onload="this.media='all'">
<link rel="stylesheet" href="{{ bj_tpl_css | asset_url }}" media="print" onload="this.media='all'">
<noscript>
  {{ 'besjaar-global.css' | asset_url | stylesheet_tag }}
  {{ bj_tpl_css | asset_url | stylesheet_tag }}
</noscript>
```

Target: **≤ 120 KB total CSS per template, ≤ 14 KB inline critical**. Expect FCP/LCP gains of 0.5–1.5 s on mid-range Android over 4G.

**B. JavaScript is in good shape.** All theme JS is `defer`. GTM is async with consent defaults. Remaining items:
- `besjaar-ui-core.js` is 63 KB and runs on every page. Split out anything that only runs on PDP or cart.
- The `window.BesjaarUIConfig` inline block loops `besjaar_ui_search_collection.products limit: 50` on every request. That's fine at 5 SKUs, but cap it or move it to the predictive search API as the catalogue grows.
- The welcome-offer popup (`besjaar-welcome-offer.js`, plus the "popup 15 sec" theme copy) must not open on load on mobile. Google's intrusive-interstitial guideline applies to the first screen from search. A 15 s delay is acceptable; showing it on load is not.

**C. Theme housekeeping.** There are 9 unpublished theme copies and GemPages leftovers: `layout/theme.gempages.*`, 12 `*.gem-*` / `*.gp-*` templates and `gp-global.css`. If GemPages is no longer used, uninstall the app so its app embed stops loading, then delete the leftover templates. This doesn't affect rankings, but it removes accidental-assignment risk.

**D. Apps.** Judge.me stores ~58 KB of `review_widget_ssr_html` per product. The legacy widget is off (`enable_legacy_judgeme_widget: false`), so it isn't rendered. Keep it that way.

### 1.2 Image assets

> **Correction (13 Oct 2026):** the hero recommendation below was wrong for this theme. On phones (≤ 900 px) the CSS shows the photo in a *square* card with `object-fit: cover`, so the 1916×821 image is already scaled up and every pixel is used. Serving a smaller file would blur it. See `theme-patches/speed-fix/README.md`.

**Product and collection images are already correct:** `image_url` with `srcset` widths, `sizes`, `loading="lazy"` below the fold, `eager` + `fetchpriority="high"` on the first two collection cards and the PDP hero. Shopify's CDN negotiates **AVIF/WebP automatically** from the `Accept` header for `image_url` output, so the uploaded JPGs don't need converting.

**Rules to keep across all templates:**

| Element | `loading` | `fetchpriority` | widths | notes |
|---|---|---|---|---|
| PDP main image (LCP) | `eager` | `high` | 700/1100/1600 | already preloaded; keep `sizes` identical to preload |
| PDP thumbnails | `lazy` | — | 220 | ok |
| Collection cards 1–2 | `eager` | 1st `high` | 360–1000 | ok |
| Collection cards 3+ | `lazy` | — | 360–1000 | ok |
| Home hero | `eager` | `high` | **needs srcset** | see fix below |
| Everything below fold | `lazy` | — | — | always add `width`/`height` to prevent CLS |

**Fix the home hero (largest LCP risk on the home page).** `sections/besjaar-store-hero.liquid:98` serves `besjaar-hero-premium-spa.webp` (145 KB, 1916×821) to every device. A theme comment notes, correctly, that theme assets can't be resized. The fix is to move the image out of `assets/` into **Content → Files** and pick it through an `image_picker` setting, which enables CDN resizing and art direction:

```liquid
{%- comment -%} sections/besjaar-store-hero.liquid — replace the <img> at line 98 {%- endcomment -%}
{%- liquid
  assign hero_desktop = section.settings.hero_image
  assign hero_mobile = section.settings.hero_image_mobile | default: hero_desktop
-%}
{%- if hero_desktop != blank -%}
  <picture>
    <source media="(max-width: 749px)"
            srcset="{{ hero_mobile | image_url: width: 480 }} 480w,
                    {{ hero_mobile | image_url: width: 750 }} 750w,
                    {{ hero_mobile | image_url: width: 1000 }} 1000w"
            sizes="100vw">
    {{ hero_desktop | image_url: width: 1920 | image_tag:
        widths: '900, 1200, 1500, 1920',
        sizes: '(min-width: 750px) 56vw, 100vw',
        loading: 'eager',
        fetchpriority: 'high',
        decoding: 'async',
        alt: v_hero_alt }}
  </picture>
{%- else -%}
  <img src="{{ 'besjaar-hero-premium-spa.webp' | asset_url }}" width="1916" height="821" loading="eager" fetchpriority="high" alt="{{ v_hero_alt | escape }}">
{%- endif -%}

{% comment %} add to the section {% schema %} settings: {% endcomment %}
{% comment %}
{ "type": "image_picker", "id": "hero_image", "label": "Hero image (desktop)" },
{ "type": "image_picker", "id": "hero_image_mobile", "label": "Hero image (mobile, 4:5)" }
{% endcomment %}
```

Then update the preload in `layout/theme.liquid:71` to match (`imagesrcset` + `imagesizes` + `media` for mobile and desktop). An existing portrait asset, `besjaar-lady-shower-mobile.webp`, could serve as the mobile art-directed crop.

Also remove `besjaar-social-share.png` (395 KB) as the bundled OG fallback. Upload a ~100 KB 1200×630 JPG/WebP to *Theme settings → Social sharing image* instead. The `meta-tags.liquid` logic already prefers that setting.

### 1.3 Critical rendering path and mobile LCP checklist

1. **One LCP candidate per template, preloaded with identical `srcset`/`sizes`.** This is done for PDP; do it for home after the hero fix. Collection pages need no preload because card 1 is `fetchpriority=high`.
2. **Remove render-blocking CSS** (§1.1A). After that, the critical path is: HTML → inline critical CSS → preloaded LCP image → fonts (`swap`).
3. **Fonts:** 9 `font_face` declarations (Jost 400/600/700 plus Inter 400/500/600/700/800/italic), with only 2 preloaded. Cut to what the CSS actually uses: Jost 600 and Inter 400/600 is typical. Each unused weight costs a request once it's referenced.
4. **`content_for_header`** (Shopify, apps, pixels) runs before your CSS and can't be avoided. Keep app embeds minimal in *Customize → App embeds*.
5. **Verify on real data:** PageSpeed Insights for `/`, `/collections/showerhead`, the top product and `/de/`. Then Search Console → Core Web Vitals (mobile) after 28 days. Targets: **LCP < 2.5 s, INP < 200 ms, CLS < 0.1** at p75.

---

## 2. Information Architecture, Canonicalization & URL Strategy

### 2.1 The `/collections/x/products/y` canonical issue

**Status: not a problem on this store, and here's why.**

- Shopify's `canonical_url` on a collection-scoped product URL already returns `/products/<handle>`.
- The real damage on most stores comes from internally linking the collection-scoped variant (`{{ product.url | within: collection }}`), which creates thousands of crawlable duplicates. **This theme never uses `within`.** Every card goes through `localized-internal-url` with `card_product.url`.
- The theme also normalizes the host. Requests on `slimhome.nl`, `bestezaklampen.nl` or `*.myshopify.com` get a canonical on `www.besjaar.eu` (`layout/theme.liquid:62-68`).

**Reference canonical snippet** (equivalent to what's live; use it if the theme is ever replaced):

```liquid
{%- comment -%} snippets/canonical.liquid — render once in <head> {%- endcomment -%}
{%- liquid
  # 1. Always the primary domain (shop.url), whatever host served the request
  assign bj_canonical = canonical_url
  if request.origin != shop.url
    assign bj_canonical = canonical_url | replace_first: request.origin, shop.url
  endif

  # 2. Strip collection scope from product URLs (defensive; Shopify already does this)
  if request.page_type == 'product'
    assign bj_canonical = shop.url | append: request.locale.root_url | append: '/products/' | append: product.handle | replace: '//products', '/products'
  endif

  # 3. Paginated collections/blogs keep self-referencing page URLs (?page=2),
  #    tag/filter/sort views are handled by noindex,follow in meta-tags.liquid
-%}
{%- unless request.page_type == '404' -%}
  <link rel="canonical" href="{{ bj_canonical | escape }}">
{%- endunless -%}
```

**The canonical-related fixes that do matter here:**

1. **Redirect the extra domains instead of relying on the canonical.** A canonical is a hint; a 301 is an instruction. In *Settings → Domains*, set `www.slimhome.nl`, `slimhome.nl` and `bestezaklampen.nl` to **"Redirect to www.besjaar.eu"**. In *Settings → Markets → Domains and languages*, remove the `www.slimhome.nl` web presence. That web presence currently publishes its own nl/de/en/fr hreflang set, so Google sees two complete international sites. Afterwards, check that `curl -sI https://www.slimhome.nl/products/besjaar-douchefilter` returns `301` to besjaar.eu.
2. **Apply the JSON-LD host fix** (`theme-patches/`). Entity `@id`s and BreadcrumbList items currently use the request host, so they contradict the canonical on the non-primary domains.
3. **Let the existing redirects work.** In *Online Store → Pages*, delete or unpublish `faq` (empty), `inloggen` (empty), `privacy-policy`, `refund-policy`, `shipping-policy` and `terms-of-services`. Their redirects to `/pages/faqs`, `/account/login` and `/policies/*` already exist and start working as soon as the pages are gone.

### 2.2 URL handles

| Resource | Current | Recommendation |
|---|---|---|
| Collection: Douchekoppen | `/collections/showerhead` (English slug on an NL-primary site) | Change to `douchekoppen` (tick "create redirect") |
| Collection: Douchefilters | `/collections/shower-filter` | Change to `douchefilters` |
| Products | 20–110-character keyword-stuffed handles (`…-model-1002025-10-sproeistanden-waterbesparende-zilver`) | **Leave them.** They're indexed and the length is not a ranking factor. Only rename if you're also restructuring for other reasons. |
| Translated handles | none (`/de/products/besjaar-douchekop-…` has a Dutch slug) | Add handle translations in Translate & Adapt: `duschkopf-mit-filter-10-strahlarten`, `pommeau-de-douche-filtre-10-jets`, `alcachofa-ducha-filtro-10-chorros`, `shower-head-with-filter-10-settings` |

**Before renaming the collection handles,** update these theme dependencies:
- Theme setting `club_member_collection = "shower-filter"`. The member price breaks if you skip this.
- `snippets/seo-product-collection.liquid` uses `handle contains 'filter'`. `douchefilters` still matches.
- `layout/theme.liquid` falls back to `collections['douchekoppen']`. That already matches.

Do the rename on a duplicate theme and test the Club price before publishing.

### 2.3 Menu and internal linking (PageRank flow)

**Current main menu:** `Assortiment → /collections/all` (**noindex**) › Douchekoppen, Douchefilters, Alle producten · Zakelijk · Volg uw bestelling · Veelgestelde vragen · Blog › Gids, Nieuws · Contact · Over ons.

**Target architecture** (5 SKUs today, ready for more categories):

```
Home (/)
├── Douchekoppen  /collections/douchekoppen          ← primary money page (head terms)
│   ├── Douchekop met filter  /collections/douchekop-met-filter   ← NEW smart collection (tag: Filter + type: showerhead)
│   │   ├── PDP Douchekop met Filter – 10 standen
│   │   └── PDP Douchekop met Filter + Slang
│   ├── Douchekop met slang  /collections/douchekop-met-slang     ← NEW (optional; tag: Doucheset)
│   │   ├── PDP Regendouche met Slang
│   │   └── PDP Douchekop met Filter + Slang
│   └── PDP Luxe Handdouche
├── Douchefilters  /collections/douchefilters
│   └── PDP Vervangfilters (set van 2)
├── Gids  /blogs/gids   (informational hub → links down to the collections above)
└── Service: FAQ · Verzending · Retour · Contact · Over ons · Zakelijk
```

**Changes:**

1. **Menu:** make "Assortiment" point to `/collections/douchekoppen`, not `/collections/all`. Replace "Alle producten" with "Douchekop met filter". Move "Volg uw bestelling" to the header utility bar or footer; it's a noindex utility page taking a top-nav slot.
2. **New collection `douchekop-met-filter`**: a smart collection, product type `showerhead` AND tag `Filter`. Add 250–400 words of unique copy below the grid: how the filter works, what it does and doesn't do, the replacement interval and filter cost per year. Link to the Gids articles *hoe-werkt-een-douchefilter* and *douchefilter-zin-of-onzin*. "douchekop met filter" is the highest-intent non-brand query in the niche, and a collection can serve the 2-product comparison better than either PDP.
3. **Remove the refill set from "Douchekoppen".** That collection has 5 products, including the filter refill, which dilutes its relevance. The refill belongs in Douchefilters, cross-sold on the filter PDPs.
4. **Contextual links (highest value per link):**
   - Every Gids article: 1 link to the relevant **collection** (exact or partial anchor, e.g. "douchekoppen met filter") and 1 to the most relevant PDP. Today most links go PDP-only or brand-only.
   - Filter PDPs ↔ refill PDP (already present in the copy; also add it as an "accessory" block).
   - Non-filter PDPs → "Liever gefilterd water? → Douchekop met filter" (the 3-standen head already does this; replicate it on the slang variant).
5. ✅ **Done in the theme copy, 14 Oct 2026:** the Shop column gets "Douchekop met filter" once that collection is published, and there is a new Gids column with 5 evergreen guides. **Footer:** add a "Shop" column (Douchekoppen, Douchekop met filter, Douchefilters) and a "Gids" column (the top 5 evergreen guides). The current footer menu only links policies.
6. **Breadcrumbs:** visible and in schema on PDP, collection, article and page. Already implemented; keep the collection crumb pointing at the most specific collection once `douchekop-met-filter` exists (update `seo-product-collection.liquid` priority).

**When you add LED tools or personal care later,** give each category its own top-level collection hub with 2–4 intent-based child collections, and its own Gids topic cluster. Don't put them under a generic "Lifestyle" collection. Use mega-menu columns per category and never link `/collections/all` from navigation.

---

## 3. Structured Data (JSON-LD)

### 3.1 What's live (and why not to bolt on separate snippets)

`snippets/structured-data.liquid` already outputs the following:

- An `@graph` with **Organization**, **Brand** and **WebSite**.
- **Product**: Shopify's `product | structured_data` serializer (name, image, description, sku, brand, offers with price, priceCurrency, availability and url). The theme merges into that same JSON object a GS1-validated `gtin13`, `material`, one `aggregateRating` from `reviews.rating` / `reviews.rating_count`, and per-offer `shippingDetails` (2 zones), `hasMerchantReturnPolicy` and a member `priceSpecification`.
- **BreadcrumbList**, plus WebPage / CollectionPage / BlogPosting / Blog nodes.

Judge.me's own JSON-LD is disabled (`jldDisable`), so there's exactly one Product and one AggregateRating per page.

**Pasting a generic Product/Breadcrumb/Organization snippet into this theme would create duplicate entities.** That reintroduces the "multiple aggregate ratings" Search Console error the theme comments say you already fixed. The right move is to **patch the existing snippet**.

### 3.2 Fixes (ready to apply: `theme-patches/snippets/structured-data.liquid`)

| Fix | Why |
|---|---|
| All `@id`, `url` and BreadcrumbList `item` values use `sd_canonical` (primary domain) instead of `canonical_url` | Matches `<link rel=canonical>` and `og:url` on every host |
| `hasMerchantReturnPolicy.applicableCountry` = zone 1 ∪ zone 2 (`NL, BE, DE, FR, ES`) | It was NL-only, so BE/DE/FR/ES offers had no return policy for Merchant listings |
| `returnFees: ReturnFeesCustomerResponsibility` | Matches the refund policy (customer pays return shipping unless the item is defective) |

Apply it on a duplicate theme: *Edit code → snippets/structured-data.liquid → paste*. Validate with the Rich Results Test on one product URL per language, then publish. The full diff is in `theme-patches/structured-data.diff`.

**Settings-only fix (no code):** *Theme settings → Delivery & trust* → set **zone 2 transit min = 1, max = 3**. It's currently empty, so the schema falls back to 1–1 days for BE/DE/FR/ES. Your shipping policy says 1–3 working days, and Google Merchant Center flags mismatches.

**Verify these too:**

- `bol_brand_url` theme setting = `…/b/besjaar/604080876/`, while the product template's proof block links `…/b/besjaar/603580876/`. One of them is wrong. `sameAs` uses the setting.
- `settings.company_legal_name` → set it to "Univex B.V." so the Organization `legalName` is emitted.
- Optional: add `"cutoffTime": "16:00:00+02:00"` to `deliveryTime` (the policy has a 16:00 same-day cutoff).

### 3.3 Reference implementation (for a theme without `structured-data.liquid` only)

You asked for standalone code. Here it is, Rich Results-compliant. **Do not add it to the current theme** (see §3.1). It's here in case you ever move to a fresh theme such as Dawn.

```liquid
{%- comment -%} snippets/jsonld-product.liquid — render in <head> on product pages only {%- endcomment -%}
{%- liquid
  assign v = product.selected_or_first_available_variant
  assign host = shop.url
  assign pdp_url = host | append: product.url | split: '?' | first
  assign rating = product.metafields.reviews.rating.value
  assign rating_count = product.metafields.reviews.rating_count.value | default: 0
-%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": {{ pdp_url | append: '#product' | json }},
  "name": {{ product.title | json }},
  "url": {{ pdp_url | json }},
  "description": {{ product.description | strip_html | strip_newlines | truncate: 5000 | json }},
  "image": [{% for img in product.images limit: 6 %}{{ img | image_url: width: 1200 | prepend: 'https:' | json }}{% unless forloop.last %},{% endunless %}{% endfor %}],
  "sku": {{ v.sku | json }},
  {%- if v.barcode != blank and v.barcode.size == 13 %}"gtin13": {{ v.barcode | json }},{% endif %}
  "brand": { "@type": "Brand", "name": {{ product.vendor | default: 'Besjaar' | json }} },
  {%- if rating != blank and rating_count > 0 %}
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": {{ rating.rating | json }},
    "bestRating": {{ rating.scale_max | default: 5 | json }},
    "worstRating": {{ rating.scale_min | default: 1 | json }},
    "reviewCount": {{ rating_count | json }}
  },
  {%- endif %}
  "offers": [{% for variant in product.variants %}{
    "@type": "Offer",
    "url": {{ pdp_url | append: '?variant=' | append: variant.id | json }},
    "sku": {{ variant.sku | json }},
    "price": {{ variant.price | divided_by: 100.0 | json }},
    "priceCurrency": {{ cart.currency.iso_code | json }},
    "availability": "https://schema.org/{% if variant.available %}InStock{% else %}OutOfStock{% endif %}",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": { "@id": {{ host | append: '#organization' | json }} },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": ["NL","BE","DE","FR","ES"],
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 30,
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility"
    },
    "shippingDetails": [
      { "@type": "OfferShippingDetails",
        "shippingRate": { "@type": "MonetaryAmount", "value": 0, "currency": "EUR" },
        "shippingDestination": { "@type": "DefinedRegion", "addressCountry": ["NL"] },
        "deliveryTime": { "@type": "ShippingDeliveryTime",
          "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
          "transitTime":  { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 1, "unitCode": "DAY" } } },
      { "@type": "OfferShippingDetails",
        "shippingRate": { "@type": "MonetaryAmount", "value": {% if variant.price >= 3000 %}0{% else %}2.99{% endif %}, "currency": "EUR" },
        "shippingDestination": { "@type": "DefinedRegion", "addressCountry": ["BE","DE","FR","ES"] },
        "deliveryTime": { "@type": "ShippingDeliveryTime",
          "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
          "transitTime":  { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 3, "unitCode": "DAY" } } }
    ]
  }{% unless forloop.last %},{% endunless %}{% endfor %}]
}
</script>
```

```liquid
{%- comment -%} snippets/jsonld-breadcrumb.liquid {%- endcomment -%}
{%- liquid
  assign crumb_collection = collection
  if request.page_type == 'product' and crumb_collection == blank
    for c in product.collections
      unless c.handle == 'all' or c.handle == 'frontpage'
        assign crumb_collection = c
        break
      endunless
    endfor
  endif
-%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": {{ shop.url | append: routes.root_url | json }} }
    {%- if crumb_collection != blank -%},
    { "@type": "ListItem", "position": 2, "name": {{ crumb_collection.title | json }}, "item": {{ shop.url | append: crumb_collection.url | json }} }
    {%- endif -%}
    {%- if request.page_type == 'product' -%},
    { "@type": "ListItem", "position": {% if crumb_collection != blank %}3{% else %}2{% endif %}, "name": {{ product.title | json }}, "item": {{ shop.url | append: product.url | json }} }
    {%- endif -%}
  ]
}
</script>
```

```liquid
{%- comment -%} snippets/jsonld-organization.liquid — render on every page {%- endcomment -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.besjaar.eu/#organization",
  "name": "Besjaar",
  "legalName": "Univex B.V.",
  "url": "https://www.besjaar.eu/",
  {%- if shop.brand.logo != blank %}
  "logo": {{ shop.brand.logo | image_url: width: 600 | prepend: 'https:' | json }},
  {%- endif %}
  "vatID": "NL868051111B01",
  "taxID": "97438650",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Elbestraat 113",
    "postalCode": "9406 SV",
    "addressLocality": "Assen",
    "addressCountry": "NL"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "info@univexbv.com",
    "telephone": "+31687616931",
    "availableLanguage": ["nl","en","de","fr","es"]
  },
  "sameAs": ["https://www.bol.com/nl/nl/b/besjaar/604080876/"]
}
</script>
```

> Replace the address and phone with whichever one is correct. Your policies currently list **two addresses** (Doctor A.F. Philipsweg 39 A, 9403 AD vs Elbestraat 113, 9406 SV) and **two phone numbers** (+31 6 87616931 vs +31 6 44341881 in the privacy policy). Pick one, and make the policies, the Organization schema, Google Business Profile and KvK all match.

**Rules this follows:** no `aggregateRating` without on-page reviews; no ratings imported from bol.com in markup (Google forbids aggregating third-party reviews in your own markup); `price` as a number with a dot decimal; ISO 4217 `priceCurrency`; ISO 3166-1 alpha-2 countries; `availability` as a schema.org URL. **FAQPage is deliberately omitted.** Google only shows FAQ rich results for authoritative government/health sites (since 2023), so it adds bytes without a SERP feature.

---

## 4. Keyword & Content Strategy

> No keyword-volume tool was available during this audit, so volumes are not stated. Validate each cluster in Google Ads Keyword Planner (NL/BE/DE/FR/ES, per language) and in your own Search Console query data before committing content budget.

### 4.1 Intent clusters (5 languages)

| Intent | NL | DE | FR | ES | Target URL type |
|---|---|---|---|---|---|
| **Transactional – head** | douchekop met filter, douchekop kopen, waterbesparende douchekop, hoge druk douchekop | duschkopf mit filter, duschkopf kaufen, wassersparender duschkopf, duschkopf hoher druck | pommeau de douche filtrant, pommeau de douche haute pression, pommeau douche économie d'eau | alcachofa de ducha con filtro, alcachofa ducha alta presión, alcachofa ahorro agua | Collection |
| **Transactional – specific** | douchekop met slang, handdouche 3 standen, douchefilter navulling, vervangfilter douchekop | duschkopf mit schlauch, handbrause 3 strahlarten, duschfilter ersatzkartusche | pommeau de douche avec flexible, cartouche filtre douche | alcachofa con manguera, recambio filtro ducha | PDP |
| **Commercial investigation** | beste douchekop met filter, douchekop test, douchefilter ervaringen, douchefilter zin of onzin | duschkopf test, duschfilter erfahrungen, duschfilter sinnvoll | meilleur pommeau de douche filtrant, filtre douche avis | mejor alcachofa con filtro, filtro ducha opiniones | Gids comparison article → collection |
| **Informational – problem** | lage waterdruk douche, kalk douchekop verwijderen, douchekop ontkalken, waterhardheid per provincie, chloor in kraanwater | niedriger wasserdruck dusche, duschkopf entkalken, wasserhärte, chlor im leitungswasser | pression d'eau faible douche, détartrer pommeau de douche, eau calcaire cheveux | poca presión ducha, quitar cal alcachofa, cloro agua grifo | Gids article |
| **Brand / navigational** | besjaar, besjaar douchekop, besjaar bol.com | besjaar duschkopf | — | — | Home / PDP / reviews page |

**Market-specific angle (this is the EU differentiator).** Your own product copy says Dutch tap water usually contains no chlorine, and that the filter matters most where water is chlorinated, e.g. BE, FR and ES. So:
- **NL content** should lead with water pressure and water saving, with limescale-care articles as the informational funnel. Filter claims must stay modest.
- **FR, ES and BE content** can lead with *chlore / cloro*: "filtre de douche contre le chlore" and "filtro de ducha cloro" are directly relevant there.
- **DE**: water is generally unchlorinated too, so lead with *Wasserdruck / wassersparend*.

Localize the Gids rather than literally translating it. For example, *"Zit er chloor in Nederlands kraanwater?"* should become *"Y a-t-il du chlore dans l'eau du robinet en France ?"* in FR, not a translation of the Dutch article.

### 4.2 Content fixes from the audit

1. **Rewrite both collection descriptions in all 5 languages** to remove the *kalk/zachter water/Kalk/calcaire* removal claims (see the copy in §4.3). This is the only content issue with legal exposure.
2. **The 5 product-clone posts in `/blogs/news`** (`besjaar-luxe-handdouche-3-standen`, `besjaar-regendouche-met-slang-3-standen`, `besjaar-douchekop-met-filter-10-standen`, `besjaar-douchekop-met-slang-en-filter`, `besjaar-vervangfilters-set-van-2`): **301-redirect each to its PDP** (delete the article, then add a URL redirect), or rewrite each as a genuinely different piece such as a hands-on installation photo guide. As they stand, they compete with the PDP for brand+product queries.
3. **Move evergreen guides out of "News"** (`hoge-druk-douchekop-wat-betekent-dat`, `doucheslang-kiezen`, `pauzeknop-douchekop-besparen`, `douchefilter-kosten-per-jaar`, `douchefilter-vervangen-stappenplan`) into the Gids, with redirects. "News" should hold dated announcements only.
4. **Off-topic:** `hond-wassen-onder-de-douche` is fine as a PowerWash use case only if it links to the 10-standen PDP. Otherwise it dilutes topical focus.
5. **E-E-A-T on articles:** a named author with a short bio (who at Univex tests the products), a "last checked" date, and sources for factual claims (water hardness data from drinking-water companies such as Vitens, Waternet and Brabant Water; RIVM for chlorine). Publish at most 2 well-researched articles a week. Batch-publishing 4–5 at once looks like scaled content.
6. **Search Console:** watch *Pages → Crawled – currently not indexed* for `/de|fr|es|en/blogs/…`. If translated articles aren't getting indexed, noindex the weakest languages rather than keep them thin.

### 4.3 Meta title & description templates

**Formula:** Titles are `{generic search term} – {top differentiator(s)} | Besjaar`, ≤ 60 characters. Descriptions are `{what it is + key benefit} {2 specs} {shipping/returns USP}`, ≤ 155 characters, with no claims beyond the PDP copy.

Current titles lead with the brand ("Besjaar Douchekop – …"). For a brand with low awareness, the generic term should come first. Every current description also ends with "Direct van de officiële Besjaar website", which wastes ~40 characters that should carry the shipping and returns USP.

**Homepage** (*Online Store → Preferences*, then translate per language in Translate & Adapt)

| Lang | Title | Description |
|---|---|---|
| NL | Douchekop met Filter & Hoge Druk Douchekoppen \| Besjaar | Besjaar douchekoppen: volle straal bij max. 8 l/min, met of zonder 8-traps filter. Gratis verzending in NL, €2,99 naar BE/DE/FR/ES. 30 dagen retour. |
| DE | Duschkopf mit Filter & Hochdruck-Duschköpfe \| Besjaar | Besjaar Duschköpfe: voller Strahl bei max. 8 l/min, mit oder ohne 8-Stufen-Filter. Versand nach DE 2,99 €, ab 30 € gratis. 30 Tage Rückgabe. |
| FR | Pommeau de douche avec filtre & haute pression \| Besjaar | Pommeaux de douche Besjaar : jet généreux à 8 l/min max., avec ou sans filtre 8 étapes. Livraison FR/BE 2,99 €, offerte dès 30 €. Retour 30 jours. |
| ES | Alcachofa de ducha con filtro y alta presión \| Besjaar | Alcachofas de ducha Besjaar: chorro pleno con máx. 8 l/min, con o sin filtro de 8 etapas. Envío a España 2,99 €, gratis desde 30 €. 30 días de devolución. |

Also update *Preferences → Home page meta description / shop description*. Today it says "Bescherm je huid en haar met beter water", a health-adjacent claim the product pages don't support.

**Collections**

| Collection | Title | Description |
|---|---|---|
| Douchekoppen | Douchekoppen – Hoge Druk, Waterbesparend, Filter \| Besjaar | Alle Besjaar douchekoppen: 3 of 10 standen, max. 8 l/min, met of zonder slang en 8-traps filter. Vergelijk de modellen. Gratis verzending in NL. |
| Douchefilters | Douchefilter Navulset – Vervangfilters 8-Traps \| Besjaar | Vervangfilters voor de Besjaar douchekop met filter: houden deeltjes tegen en breken vrij chloor af. 3–5 maanden per filter. Gratis verzending in NL. |
| Douchekop met filter (new) | Douchekop met Filter – Met of Zonder Slang \| Besjaar | Douchekop met ingebouwd 8-traps filter tegen deeltjes en vrij chloor, met of zonder 1,5 m slang. Vervangfilters los te koop. Gratis verzending in NL. |

**Claim-safe body copy for Douchekoppen (NL)**, replacing the current text:

> De Besjaar douchekoppen geven een volle straal met maximaal 8 liter water per minuut: de straal wordt met lucht verrijkt, zodat hij krachtig aanvoelt terwijl je minder water en energie verbruikt. Kies uit modellen met 3 of 10 standen, met of zonder 1,5 m slang. De modellen met filter hebben een ingebouwd 8-traps filter dat deeltjes tegenhoudt en vrij chloor afbreekt; een douchefilter maakt water niet zachter en verwijdert geen opgeloste kalk. Alle douchekoppen passen op een standaard G½-aansluiting en monteer je zonder gereedschap.

**Products** (Liquid template for fallbacks, plus filled examples)

```liquid
{%- comment -%} Fallback title when the SEO title field is empty — snippets/seo-head.liquid {%- endcomment -%}
{%- liquid
  assign t_type = product.metafields.custom.short_title_nl | default: product.type
  assign t_modes = product.metafields.custom.spray_modes.value
  capture t_auto
    echo t_type
    if t_modes != blank
      echo ' – ' | append: t_modes | append: ' Standen'
    endif
    if product.metafields.custom.hose_included.value
      echo ', met Slang'
    endif
    echo ' | Besjaar'
  endcapture
  # page_title already returns the SEO title when one is set; use t_auto only when the field is empty
  assign bj_product_title = product.metafields.global.title_tag | default: t_auto | strip
-%}
<title>{{ bj_product_title | escape }}</title>
```

| Product | Title (≤ 60) | Description (≤ 155) |
|---|---|---|
| Luxe handdouche 3 standen | Handdouche Hoge Druk – 3 Standen, 8 l/min, Chroom \| Besjaar | Waterbesparende handdouche met luchtverrijkte straal: volle druk bij max. 8 l/min. 3 standen, 13 cm kop, zonder gereedschap. Gratis verzending in NL. |
| Regendouche met slang | Douchekop met Slang 1,5 m – 3 Standen, Chroom \| Besjaar | Complete set: douchekop met 3 standen en 1,5 m anti-draai slang. Volle straal bij max. 8 l/min, handvast te monteren. Gratis verzending in NL. |
| Douchekop met filter | Douchekop met Filter – 10 Standen, Hoge Druk \| Besjaar | Douchekop met ingebouwd 8-traps filter: houdt deeltjes tegen en breekt vrij chloor af. 10 standen, pauzeknop, G½-aansluiting. Gratis verzending in NL. |
| Douchekop filter + slang | Douchekop met Filter en Slang – 10 Standen \| Besjaar | Douchekop met 8-traps filter, 10 standen en 1,5 m slang in één set. Houdt deeltjes tegen, breekt vrij chloor af. Gratis verzending in NL, 30 dagen retour. |
| Vervangfilters set van 2 | Vervangfilters Douchekop met Filter – Set van 2 \| Besjaar | 2 vervangfilters voor de Besjaar douchekop met filter: samen tot 10 maanden gebruik. Wisselen zonder gereedschap. Gratis verzending in NL. |

For DE/FR/ES descriptions, swap the shipping clause for "Versand nach DE 2,99 €, ab 30 € gratis" / "Livraison 2,99 €, offerte dès 30 €" / "Envío 2,99 €, gratis desde 30 €". Saying "Gratis verzending in NL" on /de/ is irrelevant to the reader.

**Small `seo-head.liquid` fix:** the `<title>` suffixes "– tagged …" and "– Page N" are hardcoded in English on all 5 locales. Tag views are noindex, but paginated pages aren't. Use `{{ 'general.meta.page' | t: page: current_page }}` (add the key to each locale file).

### 4.4 SEO product page template (H1–H3, conversion + NLP coverage)

The live PDP renders an H1 from the title, plus highlights, specs and package contents from `custom.*` metafields, which is a good base. Meanwhile `body_html` is inline-styled HTML using **H3s with no H2 parent**, and it duplicates what the metafield blocks already show. Target structure:

```
H1  Douchekop met Filter – 10 Standen, Hoge Druk           (product.title, ≤ 70 chars, generic term first)
    ★ 4.x (n reviews) · €25,99 incl. btw · Op voorraad · Vóór 16:00 besteld, morgen in huis (NL)
    [Gallery: hero, in-use, 10 modes, filter cartridge exploded view, G½ connection, size vs hand, packaging]
    [Buy box: price · member price · ATC · shipping/return line · payment icons]

    Highlights (custom.highlights — 4–6 bullets, benefit → spec)
      • Volle straal bij max. 8 l/min (luchtverrijking)
      • 8-traps filter: houdt deeltjes tegen, breekt vrij chloor af
      • 10 standen incl. 2 PowerWash + pauzeknop
      • Past op elke standaard G½-slang, zonder gereedschap

H2  Waarom deze douchekop?                                   (60–120 words, the main search term once, naturally)
H2  Hoe werkt het 8-traps filter?                            (entities: calciumsulfiet, maifansteen, keramische bolletjes,
                                                              vrij chloor, deeltjes/sediment — and what it does NOT do: kalk, onthardingsfunctie)
H2  Specificaties                                            (table from metafields: model 1002025, Ø 13 cm, ABS chroom,
                                                              G½", 8 l/min, 10 standen, filterlevensduur 3–5 mnd, EAN 8720726284516)
H2  Wat zit er in de doos?                                   (custom.package_contents)
H2  Montage in 5 minuten                                     (3–5 numbered steps + short video; link Gids "douchekop vervangen")
H2  Vervangfilters & kosten per jaar                         (link refill PDP + Gids "douchefilter-kosten-per-jaar")
H2  Vergelijk Besjaar douchekoppen                           (4-column table: standen, filter, slang, prijs — internal links to each PDP)
H2  Veelgestelde vragen                                      (5–8 Q&As, visible accordion, real questions from support/bol.com Q&A:
      H3 Past deze douchekop op mijn slang?                    "Werkt het bij lage waterdruk?", "Haalt het filter kalk weg?",
      H3 Haalt het filter kalk uit het water?                  "Hoe vaak vervang ik het filter?", "Kan ik retourneren?")
      H3 Hoe vaak moet ik het filter vervangen?
H2  Reviews                                                  (Judge.me widget — sample reviews OFF)
H2  Productveiligheid & fabrikant (GPSR)                     (Univex B.V., address, contact, safety/usage warnings, EAN)
```

**NLP/entity coverage checklist** for each shower head PDP: waterdruk, l/min, luchtverrijking/air-injectie, sproeistanden (regen, massage, nevel), G½-aansluiting, doucheslang, kalkaanslag (care, not removal), vrij chloor, filtercartridge, levensduur, waterbesparing, energiekosten, montage zonder gereedschap.

**Move the inline-styled `body_html` into metafields.** Keep `body_html` to 2 clean paragraphs (the "Waarom" and "Hoe werkt" sections) with `<h2>` tags. The theme already renders highlights, specs and package contents from metafields, so the inline HTML duplicates them and adds ~3–6 KB of style attributes per language.

---

## 5. EU-Specific SEO & Internationalization

### 5.1 Current configuration (live)

| Item | State |
|---|---|
| Primary web presence | `www.besjaar.eu`: default `nl` at `/`; alternates `/de/`, `/en/`, `/fr/`, `/es/` (language-only subfolders) |
| Extra web presences | `www.slimhome.nl` (nl + /de /en /fr): **remove**. Myshopify: harmless |
| Markets | **Netherlands** (NL, EUR) · **Worldwide** (~240 countries incl. all EU, **base USD**, local currencies on) |
| Shipping zones | NL €0 · BE/DE/FR €2.99 (free ≥ €30) · ES €2.99 (free ≥ €30). **Nothing else.** |
| Taxes | Prices include VAT ✓ |
| hreflang | Not in theme code. Emitted by Shopify via `content_for_header` (correct approach) |

### 5.2 hreflang with Shopify Markets: what to do

**Recommended setup for this store:** keep **language-only subfolders**. You charge one EUR price and one shipping rule across BE/DE/FR/ES, so regional variants (`/de-de/`, `/fr-be/`, …) would create near-duplicate URL sets with no pricing difference to justify them.

1. **Create an "EU" market:** *Settings → Markets → Add market*, countries **BE, DE, FR, ES**, currency **EUR**, *Domains & languages* = the same `www.besjaar.eu` web presence (shares the subfolders). Add AT and LU later only when you add shipping rates for them. Those are cheap wins, since AT reuses /de/ and LU reuses /fr/.
2. **Deactivate the "Worldwide" market**, or at minimum remove every country without a shipping rate and switch its base currency to EUR. Visitors and Googlebot from non-market countries then fall back to the **primary market (NL, EUR)**. That means consistent EUR offers in JSON-LD, which Merchant Center needs.
3. **Remove `www.slimhome.nl` as a web presence** and set it to redirect (§2.1).
4. Shopify will then emit, on every page:

```html
<link rel="alternate" hreflang="x-default" href="https://www.besjaar.eu/products/besjaar-douchefilter">
<link rel="alternate" hreflang="nl" href="https://www.besjaar.eu/products/besjaar-douchefilter">
<link rel="alternate" hreflang="de" href="https://www.besjaar.eu/de/products/besjaar-douchefilter">
<link rel="alternate" hreflang="en" href="https://www.besjaar.eu/en/products/besjaar-douchefilter">
<link rel="alternate" hreflang="fr" href="https://www.besjaar.eu/fr/products/besjaar-douchefilter">
<link rel="alternate" hreflang="es" href="https://www.besjaar.eu/es/products/besjaar-douchefilter">
```

**Verify:** run `curl -s https://www.besjaar.eu/products/besjaar-douchefilter | grep -i hreflang`. Expect exactly 6 lines, all on `www.besjaar.eu`, each URL returning 200 and self-canonical. Check the same for a `/de/` URL (the set must be identical: reciprocal). Run it again on `www.slimhome.nl` after the redirect: expect a 301, not HTML.

**Don't** add a manual hreflang snippet to the theme. Shopify already outputs one, and two sets cause conflicts.

**If you ever need country-specific pages** (e.g. a different price or delivery promise for BE), use Shopify's market-specific subfolders. Shopify then emits `nl-BE` / `fr-BE` codes automatically. Never set hreflang by hand on Shopify.

**Language-quality rule:** a locale is published and in hreflang, so every PDP, collection and Gids article in it must be **fully translated**: title, body, SEO fields, image alt (Translate & Adapt supports media alt), and **handles**. Product content in de/fr/es/en is translated. Handles and theme strings like the Judge.me carousel header ("Customers are saying", hardcoded in English in `templates/product.json`) are not.

### 5.3 EU compliance with SEO impact

**GDPR and the consent banner**
- **What's in place:** Consent Mode v2 defaults to *denied* and updates from Shopify's Customer Privacy API. Shopify's native banner is used (`show_cookie_preferences = false`). Fonts are served first-party. This is correct.
- **SEO impact:** consent doesn't affect Googlebot, which ignores cookie banners. Make sure the banner is a **bottom sheet, not a full-screen modal**, so it doesn't cover the LCP element or count as an intrusive interstitial.
- **Analytics impact:** expect GA4 to report 30–60% fewer EU sessions than reality (modelled data fills part of the gap). Use **Search Console as the source of truth** for organic performance, and Shopify Analytics for sales attribution.
- **Check:** in *Settings → Customer privacy*, confirm the banner region covers **EEA + UK + CH**, not just "EU".

**Currency, VAT and canonicals**
- Use one canonical URL per language; never vary the URL by currency. Shopify Markets on a shared domain does this already (the currency comes from the cookie, not the URL).
- Show "incl. btw / inkl. MwSt. / TTC / IVA incluido" next to the price on PDP and collection cards (PIA requirement), with shipping costs reachable within one click.
- The JSON-LD `priceCurrency` must match the visible price. After the Markets fix, check URL Inspection → *View crawled page* → search `priceCurrency`; it should be `EUR`.

**Shipping and return transparency** (Merchant listings + consumer law)
- Put the shipping table (from the policy) on a dedicated `/pages/verzending` page per language, and link it from the PDP buy box ("€2,99 naar BE/DE/FR/ES · gratis vanaf €30").
- Fix the zone-2 transit setting to 1–3 days (§3.2).
- Mirror the shipping and return settings in **Merchant Center → Shipping & returns** for NL, BE, DE, FR and ES. Google cross-checks structured data, the feed and the policy pages.

**Omnibus Directive (reviews and price reductions)**
- **Set `show_sample_reviews: false`** on the Judge.me carousel block in `templates/product.json`. Sample reviews are fabricated content and banned under the Omnibus Directive / UCPD Annex I.
- The bol.com proof block (4.7/5, 391 reviews) is hardcoded. Keep it current or pull it from the `custom.bol_rating` / `custom.bol_reviews` metafields that already exist. Never mark it up as `aggregateRating`.
- Discount badges ("max 20% korting", automatic discounts, Club price): the strikethrough "was" price must be the **lowest price of the previous 30 days** (Prijsaanduidingsbesluit art. 6a).

**GPSR (EU 2023/988, in force since Dec 2024)**
- Online listings must show the manufacturer/importer name, postal and electronic address, product identifiers, and safety warnings/instructions in the buyer's language.
- Add a "Productveiligheid" block to the PDP fed by product metafields. This also adds trust content Google can read.

**European Accessibility Act (since June 2025)**
- Micro-enterprises (< 10 staff and ≤ €2 M turnover) are exempt for services. Even so, the existing `besjaar-ui-accessibility.*`, alt texts and focus states help both users and SEO.

---

## 6. Priority Execution Checklist (30 days)

### Week 1 — Quick technical wins & code fixes

| # | Task | Where | Owner | Done when |
|---|---|---|---|---|
| 1 | ✅ **Done 13 Oct 2026.** `slimhome.nl` + `www.slimhome.nl` set to Redirecting (by owner); the `www.slimhome.nl` web presence deleted (rollback: `content/slimhome-webpresence.previous.json`). `bestezaklampen.nl` is no longer connected to the store | Settings → Domains / Markets | Admin | `curl -I` on any slimhome URL → 301 to besjaar.eu |
| 2 | ✅ **Done 14 Oct 2026.** EU market (BE/DE/FR/ES, EUR) created; Worldwide set to draft | Settings → Markets | Admin | URL Inspection shows `priceCurrency: EUR` |
| 3 | ✅ **Done 14 Oct 2026.** The 6 pages are unpublished (not deleted), so their existing redirects now apply | Online Store → Pages | Admin | Each URL 301s to its target |
| 4 | ✅ **No change needed:** the theme does not render `main-menu`; its header Shop link already goes to `/collections/showerhead` | Navigation | Admin | No nav link to `/collections/all` |
| 5 | ✅ **Done in the theme copy, 14 Oct 2026:** sample reviews off, heading "Wat klanten zeggen" + EN/DE/FR/ES on product and home. Goes live when the copy is published | Customize → product template | Admin | — |
| 6 | ✅ **Uploaded to the theme copy, 14 Oct 2026.** Validate with the Rich Results Test on the preview, then publish | Edit code | Dev | Rich Results Test: Product + Merchant listing valid, 0 warnings on return policy |
| 7 | ✅ **Done in the theme copy, 14 Oct 2026:** zone-2 transit 1–3; bol.com → `…/603580876/` (setting + homepage block); legal name already defaulted to Univex B.V. | Theme settings | Admin | — |
| 8 | ⚠️ **Partly open:** the phone in the privacy policy must be changed by hand (no API permission for policies); the address was left as is (no preference given) | Policies | Admin | — |
| 9 | Baseline: PSI for 4 templates, GSC export (queries/pages, 3 months), Merchant Center diagnostics | — | SEO | Baseline sheet saved |

### Week 2 — On-page & schema markup

| # | Task | Done when |
|---|---|---|
| 1 | ~~Hero → `image_picker` + `<picture>` srcset~~ **Dropped 13 Oct 2026:** on phones the photo fills a square card with `object-fit: cover`, so it is already scaled *up*; a smaller file would blur it, and a same-quality crop saves only ~21 KB (see `theme-patches/speed-fix/README.md`) | — |
| 2 | ✅ **Done on a theme copy, 13 Oct 2026** (`Besjaar – speed fix 13 okt (copy)`, unpublished): rules for 566 retired classes + 1,853 never-winning declarations removed from 24 stylesheets; every page loads ~40% less CSS (homepage 876 → ~530 KB, 125 → ~76 KB gzipped). **Preview and publish it yourself** (checklist in `theme-patches/speed-fix/README.md`) | Render-blocking CSS ≤ 400 KB (reached ~520–545 KB; see phase 2) |
| 3 | CSS phase 2: per-template bundles + inline critical CSS + async rest. Needs rendered pages (browser Coverage) to do safely; ~26% of the remaining CSS is page-specific | ≤ 120 KB/template; PSI mobile LCP < 2.5 s (lab) |
| 4 | ~~Cut the font weights~~ **Not needed:** browsers only download weights a page actually uses, so unused `@font-face` declarations cost nothing | — |
| 5 | ⚠️ **Partly done in the theme copy, 14 Oct 2026.** The buy box already had "incl. btw" and the ship-date/free-shipping line. The VAT label now reads "incl. btw, gratis verzending" (NL) or "inkl. MwSt., zzgl. Versandkosten" (DE) etc., linked to the shipping policy. **GPSR block still open:** needs the manufacturer / EU responsible person's name and address | — |
| 6 | ✅ **Done 14 Oct 2026 (headings).** The 3 orphan H3s in every product description ("Wat je merkt", "In de doos", "Specificaties") are now H2s in all 5 languages. They look the same because their inline styles fix the size. The specs and box contents stay in the description: the theme shows the text metafields on /nl only, so moving them out would remove them from EN/DE/FR/ES | No H3 without a parent H2 |
| 7 | ✅ **Done in the theme copy, 14 Oct 2026:** Pagina / Page / Seite / Page / Página, and the tag suffix likewise | — |
| 8 | Request indexing for the home page, 2 collections and 5 PDPs (nl + de) | — |

### Week 3 — Content & metadata

| # | Task | Done when |
|---|---|---|
| 1 | ✅ **Done 13–14 Oct 2026.** Homepage hero + filter/nozzle cards fixed in the theme copy (NL; other languages were already accurate). Rewrote both collection descriptions + meta descriptions in nl/de/fr/es/en (claim-safe, §4.3); see `content/collection-descriptions.md` | No "kalk verwijderen/zachter water" claims anywhere (search Translate & Adapt) |
| 2 | ✅ **5 PDPs done 13 Oct 2026** (5 languages; see `content/product-meta.md`). Homepage: title live in all 5 languages and EN/DE/FR/ES descriptions live, 13 Oct 2026; NL description kept as is by decision | — |
| 3 | ⏳ **Created 14 Oct 2026, unpublished until the theme copy goes live.** Manual collection with the 2 filter heads, about 240 words of claim-safe copy, and meta in 5 languages (`content/collection-douchekop-met-filter.json`). The live theme treats *any* collection with "filter" in its handle as the refill collection (footer, mobile menu, homepage button, hub, FAQs, related products), and this handle sorts before `shower-filter`. The theme copy now skips it in all 7 places (`theme-patches/week3-copy/`). **After publishing the copy:** publish the collection to the sales channels and delete the 5 temporary `/collections/douchekop-met-filter` redirects. Menu link: the header nav is hardcoded in the theme, so add it there or in the footer "Shop" column (§2) | Indexed in GSC |
| 4 | ✅ **Done 14 Oct 2026.** Douchekoppen now holds the 4 heads only | — |
| 5 | ✅ **Done 14 Oct 2026.** The 5 clone posts are unpublished (not deleted) and redirect to their PDPs. The 5 evergreen guides moved to the Gids, with tags "Nieuws"/"Productnieuws" replaced by "Gids". 50 redirects cover every language version of the old URLs. 60 internal links in 9 articles × 5 languages were repointed straight to the Gids or product pages. Rollback: `content/week3-rollback.json` | Old URLs 301 |
| 6 | ✅ **Done 14 Oct 2026.** 13 of the now 18 Gids articles already had both links. Added the missing ones in 5 languages: 4 collection links ("douchekop met filter" → `/collections/douchekop-met-filter`, temporarily redirected to Douchekoppen until that collection is published) and 1 product link (douchekop-kalk-5-signalen → Luxe Handdouche) | — |
| 7 | ✅ **Products done 14 Oct 2026** (`content/product-handles.json`), with 20 safety redirects from the old `/<lang>/products/<nl-handle>` URLs. **Collections deliberately not translated:** the theme finds the refill collection by "filter" in its handle, and FR *filtres* / ES *filtros* would break the footer link, FAQ refill link, related products and breadcrumbs | `/de/products/besjaar-hochdruck-duschkopf-mit-filter-…` resolves; old URL redirects |
| 8 | Optional, on a duplicate theme: rename collection handles → `douchekoppen` / `douchefilters` (update the `club_member_collection` setting first) | Club price still applies to filters |
| 9 | Author box + sources on the Gids articles | — |
| 10 | ✅ **Done 14 Oct 2026.** Limescale claims removed from 9 articles in 5 languages. Before: "a filter catches part of the limescale". Now: it holds back loose particles and breaks down free chlorine; dissolved limescale passes straight through. The About us page (body and meta description, all 5 languages) was fixed the same way | No claim contradicts the PDPs |

### Week 4 — Off-page & EU link building

**Trust and citation links** (high trust, low effort, NL/BE/DE-specific):
- **Thuiswinkel Waarborg** (NL) or **WebwinkelKeur** (NL/BE). Membership gives a trust badge plus a profile link, and lifts conversion in NL.
- **Kiyoh** or **Trustpilot** shop reviews (separate from Judge.me product reviews). Answer every review.
- **Trusted Shops** for the DE market (the dominant trust mark there).
- **Google Business Profile** for Univex B.V. / Besjaar in Assen, if the address accepts visitors or pickups. Otherwise use a service-area business. Use consistent NAP.
- Brand profiles on bol.com (exists), Kieskeurig.nl, Tweakers Pricewatch (if listed), idealo.de (DE), and LeDénicheur / idealo.fr (FR).

**Linkable assets** (built on content you already have):
- *"Waterhardheid per provincie"* (NL) → expand into an **interactive map by postcode**, sourced from drinking-water companies. Pitch it to regional news sites (RTV Drenthe, Dagblad van het Noorden, Omroep Brabant) and home/DIY bloggers.
- *"Chloor in kraanwater: NL vs BE vs FR vs ES"*: a comparison sourced from national water authorities. This is the natural link hook for FR/ES/BE press and blogs, and it supports the filter's real use case there.
- *"Douchekosten per jaar"* calculator (l/min × minutes × energy price per country) → personal-finance blogs (geld.nl-type sites, Bespaarblogs) and DE "Energiesparen" blogs.

**Outreach and PR:**
- Send product samples to 10–15 NL/BE home and bathroom bloggers and 5–10 DE "Duschkopf Test" sites. Ask for **honest reviews**; links must be `rel="sponsored"` when the product was free (Google policy + Dutch Reclamecode).
- Use HARO-style platforms (Qwoted, Featured.com, Dutch journalist request groups) to quote Besjaar on water saving and limescale questions.
- Pitch "Besjaar Club" (free membership, 20% on refills) as a sustainability angle: reusable head, replaceable filter.

**Avoid:** bought link packages, PBNs, and mass "guest posts" on unrelated Dutch link farms. A 5-week-old domain cluster is exactly what spam filters look for.

**KPIs to review on day 30, and again on days 60 and 90:**

| KPI | Source | 30-day target |
|---|---|---|
| Indexed pages vs submitted (per language) | GSC → Pages | > 85% of PDPs/collections/Gids indexed; slimhome URLs dropping out |
| Non-brand clicks (queries without "besjaar") | GSC | Baseline + trend up |
| Avg. position for "douchekop met filter" (NL) | GSC | Tracked, collection page ranking |
| Merchant listing / Product snippet errors | GSC → Shopping | 0 errors |
| Mobile LCP p75 (CrUX) | GSC → CWV / PSI | < 2.5 s (lab immediately; field after 28 days) |
| Referring domains | GSC → Links / Ahrefs WMT (free) | +10 relevant NL/BE/DE domains |

---

## Appendix — verification commands (run from any machine with internet access)

```bash
# 1. Extra domains redirect (expect 301 → https://www.besjaar.eu/...)
for d in www.slimhome.nl slimhome.nl www.bestezaklampen.nl besjaar.eu; do
  curl -sI "https://$d/products/besjaar-douchefilter" | grep -iE "^(HTTP|location)"; done

# 2. hreflang set (expect 6 lines, all www.besjaar.eu)
curl -s https://www.besjaar.eu/de/products/besjaar-douchefilter | grep -io '<link rel="alternate"[^>]*hreflang[^>]*>'

# 3. Canonical + robots on a filtered collection (expect noindex,follow)
curl -s "https://www.besjaar.eu/collections/showerhead?filter.v.price.gte=20" | grep -iE 'rel="canonical"|name="robots"'

# 4. One Product node, one AggregateRating, EUR currency
curl -s https://www.besjaar.eu/products/besjaar-douchefilter | grep -o '"@type":"\(Product\|AggregateRating\)"' | sort | uniq -c
curl -s https://www.besjaar.eu/products/besjaar-douchefilter | grep -o '"priceCurrency":"[A-Z]*"' | sort -u

# 5. Render-blocking CSS weight
curl -s https://www.besjaar.eu/ | grep -o 'href="[^"]*\.css[^"]*"' | wc -l

# 6. Empty/duplicate pages now redirect
for p in faq inloggen privacy-policy refund-policy shipping-policy terms-of-services; do
  curl -sI "https://www.besjaar.eu/pages/$p" | grep -iE "^(HTTP|location)"; done
```
