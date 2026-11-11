# Baseline metrics – 11 November 2026

Captured before any change was made. Source: Shopify Analytics (ShopifyQL via the Admin API), Shopify order
customer-journey data, and Lighthouse 12 run locally. **Google Search Console was not available in this
session**, so query-level data (impressions, clicks, CTR, average position) is missing and must be exported
by you (see the audit report, section I).

Periods: "28d" = `SINCE -28d UNTIL today` (≈ 14 Oct – 11 Nov 2026), "90d" = `SINCE -90d UNTIL today`
(≈ 13 Aug – 11 Nov 2026). Shop timezone: CET.

## 1. Sessions by referrer source

| Source | 28d sessions | 90d sessions |
|---|---:|---:|
| direct | 1,574 | 11,288 |
| search (Shopify label – includes paid Google Ads, see §2) | 930 | 1,251 |
| unknown | 145 | 312 |
| social | 11 | 98 |
| email | 2 | 4 |
| **Total** | **2,666** | **12,962** |

Search engines (90d, "search" sessions): Google 1,210 · Bing 27 · DuckDuckGo 10 · Ecosia 2 · Yahoo 2.

## 2. Shopify's "search" bucket is mostly paid traffic

Shopify files Google Ads clicks under referrer source "search". Splitting by landing-page URL parameters:

| 28d segment ("search" sessions) | Rule | Sessions |
|---|---|---:|
| Paid Google Ads click | landing URL contains `gclid` | 639 |
| Google Shopping free listing (likely) | `sag_organic` and no `gclid`/`gbraid`/`wbraid`/`gad_source` | 14 |
| Classic organic (blue links) | none of `gclid`, `gbraid`, `wbraid`, `gad_source`, `sag_organic` | 237 |
| Remainder (`gbraid`/`wbraid`/`gad_source` without `gclid`) | – | ~40 |

Classic organic sessions per week (90d), showing the trend since the site started getting organic traffic:

| Week starting | 10 Aug | 17 Aug | 24 Aug | 31 Aug | 7 Sep | 14 Sep | 21 Sep | 28 Sep | 5 Oct | 12 Oct | 19 Oct | 26 Oct | 2 Nov | 9 Nov* |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Organic sessions | 2 | 0 | 14 | 5 | 48 | 37 | 17 | 16 | 30 | 34 | 54 | 68 | 95 | 32 |

\* partial week (Mon–Wed). 90d total classic organic: 452 sessions.

## 3. Classic organic landing pages (28d, top)

| Landing page | Sessions |
|---|---:|
| `/` (homepage – mostly brand searches, assumed) | 50 |
| `/products/…met-slang-hoge-druk-met-filter-10-sproeistanden…` (douchekop met filter en slang) | 41 |
| `/blogs/gids/douchekop-vervangen-in-5-minuten` | 12 |
| `/en` | 12 |
| `/blogs/gids/douchen-boiler-warmtepomp-hoe-lang` | 8 |
| `/en/blogs/gids/descale-shower-head-vinegar-or-citric-acid` | 8 |
| `/blogs/gids/doucheslang-kiezen` | 7 |
| `/blogs/gids/douchekop-vervangen-huurwoning` | 7 |
| `/es/blogs/gids/manchas-rosas-negras-ducha` | 7 |
| `/products/…douchekop-3-sproeistanden…` (douchekop 3 standen) | 6 |
| `/products/…douchekop-met-filter…zilver` (douchekop met filter) | 4 |
| **`/collections/showerhead` (primary target page)** | **2** |

`/collections/showerhead`, 90d, all sources: direct 27 · search 12 (incl. paid) · social 1 = 40 sessions.

## 4. "Search" landing pages incl. paid (for reference)

28d: douchekop 3 standen 301 (295 with `gclid`) · met filter en slang 146 (103 `gclid`) · met slang 3 standen 119
(118 `gclid`) · met filter 80 (75 `gclid`) · homepage 50 · collection 4 (2 `gclid`).

## 5. Orders

| Period | Orders, referrer "search" | Net sales | Orders, no referrer | Net sales |
|---|---:|---:|---:|---:|
| 28d | 12 | €252.89 | 16 | €354.56 |
| 90d | 12 | €252.89 | 51 | €1,079.27 |

Customer-journey attribution of the 50 most recent orders (back to 17 Sep 2026):

- **Google via the Merchant Center product feed** (`utm_medium=product_sync`, `utm_campaign=sag_organic`):
  12 orders (#SH1060, 1064, 1065, 1071, 1077, 1078, 1079, 1080, 1083, 1084, 1088, 1089). Shopify strips the
  click ID from the stored landing page, so paid Shopping/PMax and free listings cannot be told apart here.
- **Classic organic search** (`sourceType: SEO`): 1 order (#SH1062, 14 Oct, landing `/en`).
- ChatGPT referral: 1 order (#SH1042). Amazon NL: 6 orders. Others: direct, shop.app or no journey data.

**Implication:** today almost all Google revenue comes through the product feed (Shopping), not organic
rankings. Product titles, prices, GTINs and availability feed that channel and must not be changed casually.

## 6. Lighthouse (lab data, 11 Nov 2026)

Lighthouse 12.x, headless Chromium, default throttling. Google Tag Manager and Shopify's monorail endpoint were
blocked by this environment's network proxy, so real-world numbers are probably slightly worse.
**These are lab values, not Core Web Vitals field data** – check Search Console → Core Web Vitals for the
real-user picture before acting.

| Page | Device | Perf | SEO | A11y | BP | LCP | CLS | TBT |
|---|---|---:|---:|---:|---:|---|---|---|
| `/collections/showerhead` | mobile | 81 | 100 | 95 | 96 | 4.2 s | 0 | 140 ms |
| `/collections/showerhead` | desktop | 96 | 100 | 95 | 96 | 1.3 s | 0.003 | 0 ms |
| `/` | mobile | 80 | 100 | 96 | 96 | 4.6 s | 0 | 90 ms |
| `/` | desktop | 95 | 100 | 97 | 96 | 1.3 s | 0.002 | 0 ms |
| `/products/…douchekop-3-sproeistanden…` | mobile | 68 | 100 | 100 | 96 | 6.4 s | 0 | 270 ms |
| `/products/…douchekop-3-sproeistanden…` | desktop | 97 | 100 | 100 | 96 | 1.1 s | 0.003 | 0 ms |

Mobile LCP breakdown:
- Collection: LCP element is the hero intro text (`p.bjc-hero__intro`); 86 % of LCP is render delay (main
  thread busy). The page loads 26 stylesheets (≈ 626 KB uncompressed) and 43 scripts (≈ 1 MB uncompressed).
- Homepage: LCP is the lifestyle image; 60 % is load delay (image discovered late).
- Product: LCP is the main product image; load delay 2.0 s and load time 2.8 s (image larger than needed,
  Lighthouse estimates 288 KB savings from responsive sizing).
