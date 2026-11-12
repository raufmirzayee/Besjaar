# Besjaar: "douchekop" visibility in Google NL (audit and changes, 12 Nov 2026)

Target page: https://www.besjaar.eu/collections/showerhead

## What was already strong (left untouched)

- Titles, meta descriptions and structured data across the site: CollectionPage, BreadcrumbList, ItemList, Product with offers, shipping details, return policy and GTIN.
- 52 guide and news articles. Every one already links to the collection.
- Canonicals, hreflang (nl as x-default, plus de/fr/en/es) and sitemaps are correct. Filter URLs, `/collections/all`, search and blog tag pages are `noindex`.
- Product data is rich: Shopify taxonomy, Google product category, GTINs, and all products are published to the Google channel.

## The 5 highest-impact gaps

| # | Gap | Evidence | Status |
|---|-----|----------|--------|
| 1 | The collection was not the strongest "douchekop kopen" page on its own site | The guide `/blogs/gids/douchekop-kopen` had the title "Douchekop kopen? Complete koopgids 2026", which is the exact pattern the ranking category pages use (Gamma, Praxis, bol, Ecorain: "Douchekop kopen? …"). It received 36 sitewide anchors reading "Douchekop kopen: …". The collection title started with "Besjaar® \|". | **Fixed** |
| 2 | No contextual, non-branded internal links to the collection | All 84 in-content links to the collection were branded or CTA text ("Bekijk de Besjaar douchekoppen →" ×52). The guide's only link to the collection was about 85% of the way down the page. | **Fixed** (7 links) |
| 3 | Narrow type coverage on the collection | The collection held 4 chrome handdouches and a hose. The regendouchesets (regendouche, mat zwart) were not in it, although Google blends them into this query (Hornbach ranks with "Douchekop of regendoucheset kopen?"). Ecorain ranks with about 50 products and sections on zwart, regendouche and slang. | **Partly fixed**. Product range expansion recommended. |
| 4 | Duplicate competing domain: univexbv.com | Search results show `univexbv.com/collections/douche-badkamer` ("Douchekop met Filter & Waterbesparende Douchekoppen") selling the same Besjaar models, plus a blog with overlapping topics. It splits relevance and links. | **Needs your decision** |
| 5 | Authority and brand entity | The search for "besjaar douchekop" returns bol.com, Amazon, Meubelo and univexbv.com, but not besjaar.eu. The Organization `sameAs` lists only one bol.com product URL. | **Plan below** |

## Exact changes made in Shopify (all reversible)

### 1. Collection `showerhead` (gid://shopify/Collection/681702064455)

| Field | Before | After |
|---|---|---|
| SEO title | `Besjaar® \| Douchekop Kopen – Waterbesparend & Hoge Druk` | `Douchekop kopen? Waterbesparend & hoge druk \| Besjaar®` |
| SEO description | unchanged | unchanged |
| Description | original text (see `rollback/collection-showerhead.description.html`) | original text kept byte-for-byte, plus about 230 words appended: **"Welk type douchekop heb je nodig?"** (handdouche, regendouche/hoofddouche, met filter, met slang) and **"Zo kies je de juiste douchekop"** (aansluiting, l/min, waterdruk, ketel), linking to the douchesets and douchekop-met-filter collections, the lage-waterdruk guide and the koopgids |
| Products | 5: filter+slang, filter, slang, 3 standen, doucheslang | 7: the same 4 heads, then **Complete Doucheset (chroom)** and **Design Doucheset (mat zwart)**, then doucheslang |

Why it should help:
- The title now leads with the query, in the same form as the pages that rank.
- The page now covers the sub-intents Google mixes into this query: handdouche, regendouche, zwart, met filter and met slang.

### 2. Guide `/blogs/gids/douchekop-kopen` (gid://shopify/Article/616008941895). URL unchanged.

| Field | Before | After |
|---|---|---|
| Title / H1 (also the anchor in 36 "Meer gidsen" blocks) | `Douchekop kopen: waar let je op? De complete koopgids (2026)` | `Douchekop kiezen: waar let je op? De complete koopgids (2026)` |
| SEO title | `Douchekop kopen? Complete koopgids 2026 \| Besjaar` | `Douchekop kiezen: waar let je op? Koopgids 2026 \| Besjaar` |
| SEO description | `Douchekop kopen? Zo kies je de juiste: aansluiting, liters per minuut, ketel, standen, filter, slang en prijs. Met checklist en eerlijk advies.` | `Waar let je op bij een nieuwe douchekop? Aansluiting, liters per minuut, ketel, standen, filter, slang en prijs. Met checklist en eerlijk advies.` |
| Body | see rollback file | (a) After the intro, added: "**Weet je al wat je zoekt?** Vergelijk direct alle [douchekoppen](/collections/showerhead) …". (b) Replaced the outdated "zoek je een grote vaste regendouche … dan heeft Besjaar die niet" with a link to the [regendouchesets](/collections/douchesets). |

Why it should help:
- The guide now targets the informational intent ("waar let je op", "kiezen"). It keeps its full content and all its "douchekop kopen" H2s and FAQs for long-tail queries.
- It stops competing with the collection for the head term, and it passes users and link equity to the collection from the top of the page.

### 3. One contextual link to the collection added in 6 articles (one phrase wrapped, nothing rewritten)

| Article | Anchor added |
|---|---|
| `/blogs/gids/regendouche-of-handdouche` | "zuinige handdouche" |
| `/blogs/gids/douchekop-vervangen-in-5-minuten` | "nieuwe douchekop" |
| `/blogs/gids/wat-kost-een-douchebeurt-emmertest` | "waterbesparende douchekop" |
| `/blogs/news/gasprijs-omhoog-douche-besparen` | "zuinigere kop" |
| `/blogs/gids/hoge-druk-douchekop-wat-betekent-dat` | existing anchor "Besjaar douchekoppen" changed to "Besjaar douchekoppen met hoge druk" |
| `/blogs/gids/douchekop-vervangen-wanneer` | added "Of vergelijk direct alle douchekoppen." |

The anchors are deliberately varied, and none is the exact match "douchekop kopen", to avoid an over-optimised anchor profile.

### 4. Doucheset card titles (product metafields `custom.short_title_nl` and `custom.best_for`)

- Complete Doucheset: "Regendoucheset met thermostaatkraan – chroom" / "je hele douche in één keer vernieuwen"
- Design Doucheset: "Design regendoucheset – mat zwart" / "een zwarte regendouche met drukknoppen en plank"

Before, these cards showed the long raw product title. All other products already used these fields.

### Verification

- Every stored article body was compared with the intended text and matches exactly.
- The collection description matches, ignoring Shopify's whitespace reformatting. The original part is unchanged.
- The live pages show the new title tags, H1, 7 products in order, the updated ItemList schema and the updated "Meer gidsen" anchors.

### Rollback

The pre-change HTML for the collection description and all 7 articles is in `rollback/`. The previous title and SEO values are in the tables above.

## Things deliberately NOT changed

- **Homepage title and H1.** They also target "douchekoppen". Changing them without Search Console data risks the brand page. See the GSC decision rules below.
- **Review star markup (aggregateRating).** All 61–153 Judge.me reviews per product have `verified_buyer: false` and midnight timestamps, which looks like an import from bol.com. Google's review-snippet rules forbid marking up reviews aggregated from other sites, and the theme correctly omits it. To earn stars legitimately, turn on Judge.me review requests for webshop orders.
- **URLs and handles.** No handle changes and no redirects needed.

## Your decisions and actions

### A. univexbv.com (potentially the largest single win)
Same company, same products, its own "douchekop" collection and blog. Options:
1. **Recommended:** retire the shop on univexbv.com and 301 every URL to the matching besjaar.eu URL:
   - collection `/collections/douche-badkamer` → `/collections/showerhead`
   - each product → the matching product
   - `/blogs/tips-advice/lage-waterdruk-douche` → `/blogs/gids/douchekop-lage-waterdruk`
   - and so on.

   If you add univexbv.com as a domain to this Shopify store, Shopify redirects it to www.besjaar.eu. I can then create the path-level URL redirects in this store; send me the univexbv.com URL list.
2. If univexbv.com must stay as a corporate site, remove the product and blog pages, or make them `noindex` and link to besjaar.eu.

### B. Google Search Console (not connected to this session)
1. Open Prestaties → Zoekresultaten. Filter Zoekopdracht exact `douchekop`, Land = Nederland, laatste 3 maanden. Open the **Pagina's** tab and note which URLs get impressions and their average position. Repeat for `douchekop kopen` and `douchekoppen`.
2. Run URL-inspectie → Indexering aanvragen for `/collections/showerhead` and `/blogs/gids/douchekop-kopen`.
3. Decision rules for 3–4 weeks from now:
   - If the **homepage** collects most "douchekop" impressions, change the homepage title to a brand-led one, for example: `Besjaar® – Nederlands douchemerk uit Assen | Douchekoppen & filters`.
   - If the guide loses more than 30% of its clicks while the collection gains nothing, restore the guide title from this file.

### C. Shipping-claim inconsistency (trust and Merchant Center risk)
- Banner, cart and collection meta description: "Gratis verzending vanaf €25".
- Shipping policy and koopgids: "Nederland: altijd gratis verzending".

Pick one and align everywhere, including the Merchant Center shipping settings.

## Backlink plan (quality only: no paid dofollow links, PBNs, mass directories or link swaps)

1. **Test and comparison sites that rank for "beste douchekop"**:
   - [consumententesten.nl](https://www.consumententesten.nl/beste-douchekop/)
   - [topvakmannen.nl](https://topvakmannen.nl/productadvies/badkamer/beste-douchekop/)
   - [bestetestreviews.nl](https://bestetestreviews.nl/beste-douchekop/)
   - [verbruikwijzer.nl](https://www.verbruikwijzer.nl/beste-douchekoppen/)
   - [productadviseurs.nl](https://productadviseurs.nl/beste-douchekop/)
   - [amacoo.nl](https://amacoo.nl/douchekop/)
   - [dokterfit.nl](https://dokterfit.nl/waterbesparende-douchekop/) (features EcoRain)
   - [wonenmetlef.nl](https://www.wonenmetlef.nl/nl/beste-douchekop/)
   - [debeterewereld.nl](https://www.debeterewereld.nl/?p=60949)

   Offer a free test unit and spec sheet, and ask for honest inclusion. If they want payment, the link must be `rel="sponsored"`.
2. **Energy-saving programmes.** Municipal energy coaches and "energiefixers" install free water-saving douchekoppen (for example [Den Haag](https://www.denhaag.nl/nl/verbouwen-en-wonen/duurzaam-wonen/voordeelacties-voor-duurzame-maatregelen/energiecoach-aanvragen/) and [Wormerland](https://wormerland.nl/print/pdf/node/941)). Pitch `/pages/zakelijk` to Regionale Energieloketten as a supplier. Be upfront that the model is 8 l/min (klasse A), because some schemes require ≤7.2 l/min.
3. **Local and brand press.** Ondernemend Assen / TechHub Assen, KHN Noord-Drenthe, Dagblad van het Noorden and RTV Drenthe. Angle: a Drents douchemerk with the data from "waterhardheid per provincie".
4. **Data PR with existing assets.** Pitch "waterhardheid per provincie", "emmertest: wat kost een douchebeurt" and the gas-price calculation to home and energy editors, for example ID.nl, which already covers zuinig douchen.
5. **Entity signals (theme code).** In the Organization JSON-LD, set `url` to `https://www.besjaar.eu` (it is currently non-www) and add your Trustpilot profile (`https://www.trustpilot.com/review/www.besjaar.eu`) and any social profiles to `sameAs`. The live theme cannot be written through the API.

## Secondary technical notes

- **Mobile lab test** (throttled 4G, 4× CPU slowdown):

  | Page | LCP | TBT |
  |---|---|---|
  | Collection | 2.9 s | 0.74 s |
  | Home | 4.8 s | 0.52 s |
  | Product | 5.4 s | 0.87 s |

  Pages weigh 1.6–1.9 MB across 107–122 requests, including 205 KB of fonts. Fixes:
  - Preload the LCP image with correct `sizes`.
  - Trim font files.
  - Defer the Judge.me and Trustpilot widgets.
- `/collections/vendors?q=besjaar` is indexable and self-canonical (a duplicate of all products). It is not linked internally, so the risk is low. Make it `noindex` in the theme.
- The collection description sits in a collapsed `<details>` block ("Meer over douchekoppen"). Google indexes it, so this is fine for SEO.
- **Biggest product-side gap.** Competitors win the head term with breadth. A mat zwarte handdouche and a losse regendouchekop would let the collection compete for "zwarte douchekop" and "regendouchekop" without thin content.
