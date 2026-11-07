# Deliverable 2 — Keyword and search-intent map

**Basis:** the live content of every Dutch URL (Deliverable 1), the product range in Shopify, and the queries named in the brief. **No search volumes, positions or difficulty scores are given.** No Search Console or keyword-tool data was available in this session; adding numbers would be invention. Section 4 explains how to fill the "impressions / position" columns from Search Console.

One primary intent per URL. Related vocabulary may overlap (that is normal and useful); what must not overlap is two URLs answering **the same intent**.

## 1. Commercial and brand map (primary market NL)

| Primary query (intent) | Owner URL | Secondary queries on the same URL | Must NOT be the owner | Notes |
|---|---|---|---|---|
| **Besjaar** (navigational) | `/` | Besjaar douchekop, Besjaar webshop | — | Brand-first title already in place. |
| **douchekop kopen**, **douchekoppen**, **douchekop** (compare & buy) | `/collections/showerhead` | waterbesparende douchekop, hoge druk douchekop, douchekop met slang (category level) | `/` (homepage may rank for the brand + category combination, which is fine) | Comparison table + guide links added 2026-11-07. |
| **waterbesparende douchekop(pen)** (commercial) | `/collections/showerhead` (+ `/` for brand combination) | zuinige douchekop | `gids/waterbesparende-douchekop-hoeveel-bespaar-je` (informational: "hoeveel bespaar je") | Claim conflict C2 (8 vs 7,2 l/min) must be resolved; see Deliverable 4. |
| **hoge druk douchekop** (commercial) | `/collections/showerhead` | douchekop met hoge druk | `gids/hoge-druk-douchekop-wat-betekent-dat` owns "wat betekent hoge druk" (informational) | |
| **douchekop met filter** (commercial) | `/collections/douchekop-met-filter` | handdouche met filter, douchekop chloorfilter | product pages (they own model-specific queries) | |
| **beste douchekop met filter** (commercial investigation) | `gids/beste-douchekop-met-filter-vergeleken` | douchekop met filter review, vergelijking | collection | Now linked from both filter collections. |
| **douchekop met filter 10 standen**, douchekop met filter zonder slang | `/products/…filter-model-1002025…` | handdouche met filter | collection | Title now ends "Zonder Slang" to separate it from the set. |
| **douchekop met filter en slang** | `/products/…met-slang…met-filter…` | complete doucheset met filter, douchekop 10 standen met slang | collection | |
| **douchekop 3 standen** | `/products/…3-sproeistanden…chrome` | waterbesparende handdouche, douchekop chroom, douchekop zonder slang | — | |
| **douchekop met slang** | `/products/…met-slang…3-sproeistanden…` | douchekop met slang 1,5 meter, handdouche met slang | collection | |
| **doucheslang 150 cm**, doucheslang 1,5 meter | `/products/besjaar-doucheslang-150-cm-chroom` | universele doucheslang, anti draai doucheslang | `gids/doucheslang-kiezen` (owns "welke doucheslang", "doucheslang kiezen") | |
| **vervangfilter douchekop**, Besjaar vervangfilters | `/products/besjaar-douchefilter` | douchefilter navulset, douchefilter cartridge | — | Only fits Besjaar filter heads; said in title, description, copy. |
| **douchefilter** (category) | `/collections/shower-filter` | douchefilters, navulsets | product | Generic "douchefilter" searchers often want a universal inline filter; the page states compatibility so mismatched visitors leave quickly. Do not over-optimise this term. |
| **Besjaar reviews / ervaringen** | `/pages/reviews` | Besjaar beoordelingen | `gids/is-besjaar-betrouwbaar` owns "is Besjaar betrouwbaar" | Brand SERP can show both; they now link to each other. |
| **over Besjaar / wat is Besjaar** | `/pages/about-us` | Besjaar Assen | `news/wat-is-besjaar` (acceptable second result for the question form) | |
| **Besjaar contact / klantenservice** | `/pages/contact-us` | — | — | |
| **Besjaar veelgestelde vragen** | `/pages/faqs` | — | `news/besjaar-douchekop-veelgestelde-vragen` (product-FAQ angle) | Cross-link both. |
| **Besjaar Club** | `/pages/besjaar-club` | korting vervangfilters | `news/besjaar-club-ledenvoordeel` | |
| **douchekoppen zakelijk** | `/pages/zakelijk` | B2B douchekoppen | — | |

## 2. Informational map (Gids and Nieuws)

| Primary query | Owner URL | Supporting / must not compete |
|---|---|---|
| douchekop vervangen, douchekop monteren | `gids/douchekop-vervangen-in-5-minuten` | `gids/douchekop-vervangen-wanneer` (when), `gids/douchekop-vervangen-huurwoning` (rental), distinct intents |
| douchekop ontkalken, kalkaanslag douchekop verwijderen | `gids/kalkaanslag-douchekop-verwijderen` (hub) | `gids/douchekop-ontkalken-azijn-of-citroenzuur` (agent comparison only), `gids/douchekop-kalk-5-signalen` (diagnosis) |
| douchefilter vervangen | `gids/douchefilter-vervangen-stappenplan` | product + collection own the purchase |
| douchefilter zin of onzin | `gids/douchefilter-zin-of-onzin` | `gids/hoe-werkt-een-douchefilter` (mechanism), `gids/waterontharder-of-douchefilter` (comparison) |
| lage waterdruk douche (troubleshooting) | **currently** `news/lage-waterdruk-in-de-douche-…` | **conflict** with `gids/douchekop-lage-waterdruk` (choosing a head). Recommended: move the news article to Gids as the troubleshooting owner; keep the Gids article for "douchekop bij lage waterdruk" (buying). |
| hoge waterdruk douche | `gids/douchekop-hoge-waterdruk` | — |
| doucheslang kiezen | `gids/doucheslang-kiezen` | product owns "doucheslang 150 cm" |
| regendouche of handdouche | `gids/regendouche-of-handdouche` | — |
| waterhardheid per provincie | `gids/waterhardheid-per-provincie` | — |
| chloor in kraanwater | `gids/chloor-in-kraanwater-nederland` | — |
| hard water haar / droge huid | `gids/hard-water-haar` / `gids/kalk-water-droge-huid` | distinct |
| wat kost een douchebeurt | `gids/wat-kost-een-douchebeurt-emmertest` | `news/gasprijs-omhoog-douche-besparen` (news angle, time-bound) |
| waterbesparende douchekop besparing | `gids/waterbesparende-douchekop-hoeveel-bespaar-je` | `gids/pauzeknop-douchekop-besparen` (pause button) |
| douchekop lekt | `gids/douchekop-lekt-oplossen` | — |
| douchefilter kosten | `gids/douchefilter-kosten-per-jaar` | — |
| roze aanslag douche / doucheputje stinkt / kalkvlekken douchewand | respective Gids articles | distinct |
| Besjaar douchekoppen vergelijken | `news/besjaar-assortiment-welke-douchekop` | **conflict** with `news/besjaar-douchekoppen-twee-designs-vergeleken` (same intent, newer, untranslated). Recommended: merge, 301. |
| douchekop met filter België / Duitsland / Frankrijk / Spanje | country articles (value mainly in their translated versions) | distinct per country |

## 3. Cannibalization found and decisions

| # | Competing URLs | Same intent? | Decision | Status |
|---|---|---|---|---|
| K1 | `news/lage-waterdruk-…` vs `gids/douchekop-lage-waterdruk` | Partly (both open with "check zeefje / kraan") | Troubleshooting → news article (move to Gids, 301), buying → Gids article; cross-link | RECOMMENDED (meta description for the news article added) |
| K2 | `news/besjaar-assortiment-welke-douchekop` vs `news/besjaar-douchekoppen-twee-designs-vergeleken` | Yes | Merge into the older, translated article; 301 the newer one. Until then its 4 untranslated language versions are noindexed (preview theme) | PREVIEW + RECOMMENDED |
| K3 | `gids/kalkaanslag-douchekop-verwijderen` vs `gids/douchekop-ontkalken-azijn-of-citroenzuur` | Partly (both carry a descaling step plan) | Hub + deep dive; remove the duplicated full routine from one of them | RECOMMENDED |
| K4 | `/collections/shower-filter` (1 product) vs `/products/besjaar-douchefilter` | Overlap on "vervangfilters" | Collection = category ("douchefilters"), product = "vervangfilters set van 2"; titles now differ in head term | IMPLEMENTED |
| K5 | `/` vs `/collections/showerhead` for "waterbesparende douchekoppen hoge druk" | Overlap | Homepage keeps brand + category; collection now leads with "Douchekop Kopen" | IMPLEMENTED |
| K6 | Product A vs Product B (same head, with/without hose) | Previously near-identical copy | Titles, descriptions and ledes now state "zonder slang" / "complete set met slang" | IMPLEMENTED |
| K7 | `/blogs/gids` vs `/blogs/gids/tagged/*` | Yes (same description) | noindex,follow tag pages | PREVIEW |
| K8 | Brand pages: about-us, wat-is-besjaar, is-besjaar-betrouwbaar, reviews, besjaar-op-trustpilot | Brand SERP | Acceptable (several results for the brand name help); each now has a distinct primary query and they cross-link | IMPLEMENTED (links) |

## 4. How to complete this map with Search Console data

1. GSC › Performance › Search results › last 3 months and last 6 months (compare to the previous period) › export **Queries** and **Pages**.
2. For each primary query above, filter Query = exact term and look at the **Pages** tab. If more than one Besjaar URL receives impressions for the same query, check whether that is the cannibalization case listed above.
3. Add to this table: impressions, clicks, CTR, average position per query/owner URL. Queries with many impressions, few clicks and position 3–10 are the first title/description candidates.
4. Re-check 4–6 weeks after the 2026-11-07 changes (see Deliverable 5 for the measurement plan).
