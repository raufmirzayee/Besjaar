# Theme pre-publish SEO check: `Besjaar – speed fix 13 okt (copy)`

**Theme:** `gid://shopify/OnlineStoreTheme/202511286599` (unpublished), checked 14 Oct 2026.
**Method:** I mirrored all 326 theme files locally and matched each file to its source by checksum, downloading the files that didn't match. I then traced every template that is in use, plus the header and footer groups and every snippet they render. Everything below refers to that copy.

**Verdict:** nothing on the list blocks publishing. The six areas are all in place. I found two minor issues, and neither affects any page Google can currently reach (see "Fixes" at the end).

Publishing a theme does not change any URL, the sitemap or robots.txt, because those are store-level. Rankings risk comes only from what the new theme renders, which is covered below.

---

## 1. Structured data (JSON-LD)

| Page | Output | Status |
|---|---|---|
| Product | One `Product` (or `ProductGroup`) node from Shopify's own `product \| structured_data`. The theme merges exactly one `aggregateRating` into it from the `reviews.rating` / `reviews.rating_count` metafields, emitted only when real reviews exist (`snippets/structured-data.liquid:150–414`). Each `Offer` gets `shippingDetails` (NL plus zone 2, transit 1–3 days), `hasMerchantReturnPolicy` (NL, BE, DE, FR, ES) and a GTIN when the barcode passes the GS1 check | ✅ |
| Product | `BreadcrumbList`: Home › collection › product (`structured-data.liquid:553`) | ✅ |
| Product | Duplicate guard: Judge.me's own JSON-LD is switched off (`seo-head.liquid:64–65`, `jldDisable`), so there is one rating source | ✅ |
| Collection | `BreadcrumbList` + `CollectionPage` (`:626`) + one `ItemList` of the visible products (`snippets/seo-visible-item-list.liquid`) | ✅ |
| Home | `Organization`, `Brand`, `WebSite` | ✅ |
| Article / blog / page | `BlogPosting` / `Blog` / `WebPage` + `BreadcrumbList` | ✅ |
| FAQ | `FAQPage` only on /pages/faqs and /pages/about-us, once per page | ✅ (no duplicates) |

- **Product markup on collection pages:** there is no `Product`/`Offer`/`AggregateRating` on collection pages, and that is correct. Google wants product markup on the product page; listing pages use `ItemList`. Adding Product nodes there would risk "duplicate product" warnings.
- **Duplicates or broken tags:** none found. Each page has one Product node, one rating and one breadcrumb.

## 2. Headings

Exactly one `<h1>` renders on every template in use:

| Template | `<h1>` | Then |
|---|---|---|
| Home | hero title (`besjaar-store-hero.liquid:81`) | H2 per section, H3 for feature cards |
| Product | product title (`besjaar-store-product.liquid:650`) | H2: reviews, recently viewed, CTA; description sections are H2 (fixed today) |
| Collection | collection title (`besjaar-shower-collection.liquid:170`; the `/collections/all` hub has its own exclusive branch at `:36`) | H2 per group, H3 product cards |
| Blog / article | blog title / article title | H2 |
| Pages | about / FAQ / generic, in exclusive `if`/`elsif`/`else` branches (`main-page.liquid:68/125/231`); contact, B2B, club each have one | — |

The header has no `<h1>`; the logo is a link. No script adds an `<h1>`, except the order-tracking page, which is noindexed.

## 3. Canonicals and URLs

- **Canonical tag:** `layout/theme.liquid:63–68` emits a canonical built from `canonical_url`, forced to the primary domain `www.besjaar.eu`. This is better than plain `{{ canonical_url }}`, because the store also answers on other domains. The 404 page has no canonical, which is correct.
- **Product links:** no template uses `| within: collection`. Every product link is `/products/<handle>` (or the language version), never `/collections/…/products/…`. Shopify's `canonical_url` would collapse nested URLs anyway.
- **hreflang:** Shopify adds it automatically through `{{ content_for_header }}`; the theme doesn't add its own, so there are no conflicting tags.

## 4. Meta tags and indexing

- **Title:** `<title>{{ page_title }}…</title>` (`seo-head.liquid:42`). The page-number and tag suffixes now follow the page language.
- **Description:** `<meta name="description" content="{{ page_description }}">` (`:43`).
- **Robots:** `snippets/meta-tags.liquid:233–236`. The default is `index,follow,max-image-preview:large`. `noindex,follow` is applied only on purpose:
  - search, cart, 404, gift card, account pages, `/collections/all`;
  - tag and filter collection views;
  - order-tracking pages;
  - any resource whose SEO setting is hidden.
- **Development leftovers:** none. The only other `noindex` is in `layout/password.liquid`, which shows only while the store is password-protected.

## 5. Performance

- **Images:**
  - Product gallery, cards and content images use `loading="lazy"`.
  - LCP images are `loading="eager"` + `fetchpriority="high"`: homepage hero, first product image, article hero, first 2 collection cards.
  - The header logo has no `loading` attribute, which means eager; that is correct above the fold.
- **Preloads:** the homepage hero and the selected product image are preloaded with a matching `imagesrcset` (`theme.liquid:71–75`). Both font files are preloaded (`:28–29`) with `font-display: swap` and metric-matched fallbacks, so there is no layout shift.
- **CSS:** about 40% lighter than the live theme after the cleanup. The head stylesheets are still render-blocking; splitting critical CSS per page type is the next step but needs a rendered browser.
- **Scripts:** every theme script uses `defer`, and none of the rendered files has a blocking `<script src>`. GTM loads with `async`. Shopify's and the apps' scripts come in through `content_for_header`, which loads asynchronously.

## 6. Analytics and Search Console

- **Site verification:** `<meta name="google-site-verification" content="ET57Ssi2…">` is in `theme.liquid:7`, identical to the live theme, so Search Console stays verified after publishing.
- **GTM:** container `GTM-T9HGBD6S`:
  - consent defaults followed by the GTM loader at the top of `<head>` (`:9`);
  - consent updates from Shopify's privacy API right after `content_for_header` (`:103`);
  - `<noscript>` iframe directly after `<body>` (`:550`).
- **GA4:** runs inside the GTM container. **Check one thing yourself:** if the Google & YouTube sales channel also sends GA4 for the same measurement ID, page views are counted twice. Use one of the two.

---

## Fixes (optional; no page Google currently reaches is affected)

**A. GemPages layouts:** the canonical isn't forced to the primary domain, and there is no verification tag. `layout/theme.gempages.{blank,header,footer}.liquid:20` uses plain `canonical_url`. No page, product or collection uses these layouts today, so this only matters if GemPages is used again. In that case, replace line 20 in each of the three files with:

```liquid
{%- liquid
  assign bj_canonical_url = canonical_url
  if request.origin != shop.url
    assign bj_canonical_url = canonical_url | replace_first: request.origin, shop.url
  endif
-%}
{% unless request.page_type == '404' %}<link rel="canonical" href="{{ bj_canonical_url | escape }}">{% endunless %}
<meta name="google-site-verification" content="ET57Ssi2w5bkFfwg4r7who5Vc9EHNf3lUAmXMDQYKHI" />
```

**B. `sections/besjaar-store-collection.liquid:38` builds broken tag links.** `handleize` runs on the whole path (`/collections/x/Filter` → `collections-x-filter`). No template uses this section. If it is ever used again:

```liquid
{% assign tag_handle = tag | handleize %}
{% assign tag_url = collection.url | append: '/' | append: tag_handle %}
```

---

## Publish checklist (fastest re-crawl)

1. **Before publishing:** open the copy's preview and run 2 URLs through https://search.google.com/test/rich-results: one product and `/collections/showerhead`. Expect Product + Merchant listing + Breadcrumb as valid.
2. **Publish**, then within an hour:
   - Search Console → URL Inspection → *Request indexing* for the homepage, `/collections/showerhead`, `/collections/shower-filter` and the 5 product pages (NL; repeat for `/de/`).
   - Sitemaps → resubmit `sitemap.xml`.
3. **Publish the `douchekop-met-filter` collection**, delete its 5 temporary redirects, and request indexing for it.
4. **Watch for 2 weeks:** Search Console → Pages (indexed count), Enhancements (Product snippets, Merchant listings, Breadcrumbs), Core Web Vitals.
