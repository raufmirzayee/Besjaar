# Deliverable 5 — Implementation and measurement report

All changes below were made on 2026-11-07 between 19:09 and 19:25 UTC through the Shopify Admin GraphQL API, each mutation approved through the connector's confirmation prompt. Every "before" value is stored verbatim in `backups/`. Every "after" value was re-fetched from the **live storefront HTML** at 19:20 UTC (`data/05-after-change-verification-2026-11-07.csv`).

## 1. Change log — live store (implemented and verified)

| # | Resource | Field | Before (exact) | After (exact) | Verified live |
|---|---|---|---|---|---|
| 1 | Product: douchekop met filter (zonder slang) | SEO title | Douchekop met Filter – 10 Standen, Hoge Druk \| Besjaar | Besjaar® \| Douchekop met Filter – 10 Standen, Zonder Slang | ✔ |
| 2 | 〃 | SEO description | Douchekop met ingebouwd 8-traps filter: houdt deeltjes tegen en breekt vrij chloor af. 10 standen, pauzeknop, G½-aansluiting. Gratis verzending in NL. | Douchekop met 8-traps filter en 10 standen, zonder slang: past op je eigen G½-doucheslang. Met pauzeknop en vervangbaar filter. Gratis verzending in NL. | ✔ |
| 3 | 〃 | Description | Lede started "Het ingebouwde 8-traps filter…" (identical to product B) | Lede starts "Deze douchekop komt zonder slang: je draait hem met de hand op je bestaande G½-doucheslang." + spec row "Slang: Niet inbegrepen, past op je eigen G½-slang" + line linking refills and the hose version | ✔ |
| 4 | Product: douchekop met filter en slang | SEO title | Douchekop met Filter en Slang – 10 Standen \| Besjaar | Besjaar® \| Douchekop met Filter en Slang – 10 Standen | ✔ |
| 5 | 〃 | SEO description | Douchekop met 8-traps filter, 10 standen en 1,5 m slang in één set. Houdt deeltjes tegen, breekt vrij chloor af. Gratis verzending in NL, 30 dagen retour. | Complete set: douchekop met 8-traps filter en 10 standen, 1,5 m doucheslang, afdichtringen en teflontape. Breekt vrij chloor af. Gratis verzending in NL. | ✔ |
| 6 | 〃 | Description | Lede identical to product A | Lede starts "Dit is de Besjaar douchekop met filter als complete set: met een doucheslang van 1,5 meter, twee afdichtringen en teflontape vervang je kop en slang in één keer." + line linking product A and refills | ✔ |
| 7 | Product: douchekop 3 standen | SEO title | Douchekop 3 Standen – Waterbesparend, Hoge Druk \| Besjaar | Besjaar® \| Waterbesparende Douchekop – 3 Standen | ✔ |
| 8 | 〃 | SEO description | Douchekop met 3 standen (regen, massage, power) en een volle straal bij max. 8 l/min. Past op vrijwel elke G½-slang, zonder gereedschap. 30 dagen retour. | Douchekop met 3 standen (regen, massage, power) en een volle straal bij max. 8 l/min. Zonder slang of filter: past op je eigen G½-slang. 30 dagen retour. | ✔ |
| 9 | 〃 | Description | Specs without connection; no "niet inbegrepen" | + "Aansluiting: Universeel G½, past op elke standaard doucheslang", "Slang en filter: Niet inbegrepen" | ✔ |
| 10 | Product: douchekop met slang (3 standen) | SEO title | Douchekop met Slang 1,5 m – 3 Standen, Chroom \| Besjaar | Besjaar® \| Douchekop met Slang 1,5 m – 3 Standen | ✔ |
| 11 | 〃 | SEO description | Complete set: douchekop met 3 standen en 1,5 m anti-draai slang. Volle straal bij max. 8 l/min, handvast te monteren. Gratis verzending in NL. | Complete set: douchekop met 3 standen, 1,5 m anti-draai slang en afdichtingen. Max. 8 l/min, montage zonder gereedschap. Zonder filter. Gratis verzending in NL. | ✔ |
| 12 | 〃 | Description | No connection spec; no filter statement | + "Aansluiting: Universeel G½", "Filter: Niet inbegrepen", line linking the filtered set | ✔ |
| 13 | Product: doucheslang | SEO title | Doucheslang 1,5 m – Universeel ½", Anti-Draai \| Besjaar | Besjaar® \| Doucheslang 150 cm – Universeel ½", Anti-Draai | ✔ |
| 14 | 〃 | SEO description | Doucheslang van 1,5 m met anti-draai en universele ½"-aansluiting aan beide kanten. Past op vrijwel elke handdouche, ook op Besjaar met filter. | Doucheslang van 150 cm met anti-draai en universele ½"-aansluiting aan beide kanten. Past op vrijwel elke handdouche en kraan. Douchekop niet inbegrepen. | ✔ |
| 15 | Product: vervangfilters | SEO title | Vervangfilters Douchekop met Filter – Set van 2 \| Besjaar | Besjaar® \| Vervangfilters Douchekop – Set van 2 | ✔ |
| 16 | 〃 | SEO description | 2 vervangfilters voor de Besjaar douchekop met filter: samen tot 10 maanden gebruik. Wisselen zonder gereedschap. Gratis verzending in NL vanaf €25. | 2 vervangfilters, alleen voor de Besjaar douchekop met filter (10 standen). 3–5 maanden per filter, wisselen zonder gereedschap. Breekt vrij chloor af. | ✔ |
| 17 | Collection: Douchekoppen | SEO title | Douchekop Kopen? Hoge Druk & Waterbesparend \| Besjaar | Besjaar® \| Douchekop Kopen – Waterbesparend & Hoge Druk | ✔ |
| 18 | 〃 | SEO description | Besjaar douchekoppen: hoge druk bij max. 8 l/min, 3 of 10 standen, met of zonder filter of slang. Gratis verzending in NL vanaf €25, 30 dagen retour. | Vergelijk alle Besjaar douchekoppen: 3 of 10 standen, met of zonder filter of slang, volle straal bij max. 8 l/min. Gratis verzending in NL vanaf €25. | ✔ |
| 19 | 〃 | Description | 5 paragraphs, no H2 | + H2 "Welke Besjaar douchekop past bij jou?", comparison table (5 products × standen/filter/slang), paragraph with 4 guide links (renders in the collapsed "Meer over douchekoppen" panel; checked at 390 px and 1366 px, no overflow) | ✔ |
| 20 | Collection: Douchekop met filter | SEO title | Douchekop met Filter – Met of Zonder Slang \| Besjaar | Besjaar® \| Douchekop met Filter – Met of Zonder Slang | ✔ |
| 21 | 〃 | Description | — | + paragraph linking 3 filter guides | ✔ |
| 22 | Collection: Douchefilters | SEO title | Douchefilters & Navulsets – 8-Traps Filtratie \| Besjaar | Besjaar® \| Douchefilters & Vervangfilters – 8-Traps | ✔ |
| 23 | 〃 | Description | — | + set contents, links to replacement guide, cost guide, Besjaar Club (20%) | ✔ |
| 24 | Page: Klantbeoordelingen | SEO title | Klantbeoordelingen — Besjaar douchekoppen en douchefilters | Besjaar® \| Reviews & Ervaringen met Douchekoppen | ✔ |
| 25 | 〃 | Body | Formal "u"; link to noindexed /collections/all | "je" register; link to /collections/showerhead; links to Trustpilot article and is-besjaar-betrouwbaar | ✔ |
| 26 | Blog: Gids | SEO title | Gids: douchekop & douchefilter tips \| Besjaar | Besjaar® \| Gids: Douchekop & Douchefilter Advies | ✔ |
| 27 | Blog: news | Title (= H1) | Nieuws | Douchetips & nieuws (handle `news` unchanged) | ✔ |
| 28 | 〃 | SEO title | Nieuws: douchekoppen, acties en tips \| Besjaar | Besjaar® \| Douchetips, Productnieuws & Acties | ✔ |
| 29 | 〃 | SEO description | Nieuws van Besjaar: nieuwe douchekoppen en filters, acties en praktische tips voor een betere douche met minder water. | Douchetips en nieuws van Besjaar: productvergelijkingen, nieuwe gidsen, acties en de Besjaar Club. Voor een betere douche met minder water. | ✔ |
| 30 | Article: news/lage-waterdruk-… | SEO description | (empty → 320-char excerpt) | Weinig druk onder de douche? Controleer eerst je douchekop, slang en de waterdruk in huis. 7 oorzaken en oplossingen, plus wanneer een andere douchekop helpt. | ✔ |
| 31 | Article: news/besjaar-douchekoppen-twee-designs-vergeleken | SEO description | (empty → 320-char excerpt) | Besjaar Douchekop met 3 standen of met filter en 10 standen? Vergelijk prijs, standen, filter en slang in één tabel en kies welke bij jouw douche past. | ✔ |
| 32 | 〃 | Metafield `custom.primary_locale_only` | (none) | true (read only by the preview theme) | ✔ (Admin) |
| 33 | Files: shower.mp4, douchekop.mp4 | alt | "" | "Video: Besjaar handdouche met volle waterstraal boven een bad" / "Video: chromen Besjaar handdouche met krachtige waterstraal, in de hand gehouden" | ✔ (Admin) |
| 34 | Translations EN/DE/FR/ES | meta_title of 6 products, 3 collections, reviews page, Gids blog; title + meta_title + meta_description of the news blog | Keyword-first, brand last (exact values in `backups/2026-11-07_before_translations_meta.json`) | Brand-first equivalents, e.g. EN "Besjaar® \| Shower Head with Filter – 10 Modes, No Hose", DE "Besjaar® \| Duschkopf kaufen – wassersparend & hoher Druck", news H1 EN "Shower tips & news", DE "Dusch-Tipps & Neuigkeiten" | ✔ (sampled EN product, DE collection, FR product, ES reviews, DE blog) |

**Rollback:** every value can be restored from `backups/` with the same mutations (`productUpdate`, `collectionUpdate`, `pageUpdate`, `blogUpdate`, `metafieldsSet`, `translationsRegister`, `fileUpdate`).

## 2. Theme changes — unpublished preview (verified in preview, not live)

Theme **"Besjaar – SEO audit 2026-11-07 (preview)"** (id `204218663239`), a duplicate of the live theme made at 19:19 UTC. Before patching, the checksums of the four files matched the live theme. Uploaded files are byte-identical to `theme-patches/` (MD5 verified).

| File | Change | Preview test |
|---|---|---|
| `snippets/meta-tags.liquid` | noindex,follow for blog tag pages; noindex,follow for articles with `custom.primary_locale_only = true` on non-primary languages | `/blogs/gids/tagged/douchefilter` → noindex ✔; `/de/blogs/news/besjaar-douchekoppen-twee-designs-vergeleken` → noindex ✔; Dutch version → index ✔ |
| `snippets/seo-head.liquid` | Localized meta description fallback for `/policies/*` | `/policies/shipping-policy` (NL) ✔, `/de/policies/refund-policy` (DE) ✔ |
| `sections/main-blog.liquid` | News blog gets its own kicker and intro (5 languages); Gids unchanged | `/blogs/news` "NIEUWS / BESJAAR" ✔, `/en/blogs/news` "NEWS / BESJAAR" ✔, `/blogs/gids` unchanged ✔ |
| — | No Liquid errors on home, product, blog, article, policy pages in preview | ✔ |

**To publish:** Online Store › Themes › "Besjaar – SEO audit 2026-11-07 (preview)" › Preview (check home, a product, cart, the news blog on mobile and desktop) › Publish. **Caution:** if anything was edited in the live theme after 2026-11-07 19:19 UTC, publishing the preview would discard it. In that case apply the three small diffs in `theme-patches/` to the live theme's code editor instead.

## 3. Manual steps for the merchant (copy-ready)

| # | Priority | Where | Exact change |
|---|---|---|---|
| **M1** | Critical | Settings › Policies › Shipping policy | Replace `<li><strong>Nederland</strong>: altijd <strong>gratis verzending</strong>, op elke bestelling.</li>` with `<li><strong>Nederland</strong>: een vast tarief van <strong>€2,99</strong>. Bestellingen vanaf <strong>€25</strong>: <strong>gratis verzending</strong>.</li>`. Also fix or delete the unpublished page "Verzendbeleid" (handle `shipping-policy`), whose table says "gratis, altijd". |
| **M2** | High | Decision (C2) | Choose how "waterbesparend" at max. 8 l/min is substantiated (flow test at stated pressure) or softened to a comparison claim. |
| **M3** | High | Decision (C5) | Confirm the registered address; align Legal notice, contact page, Organization schema; label the other address "Retouradres". |
| M4 | Medium | Online Store › Preferences | Homepage meta description → `Officiële Besjaar webshop: douchekoppen met een volle straal bij max. 8 l/min, met of zonder filter of slang. Gratis verzending in NL vanaf €25.` (143 chars). Keep the title. |
| M5 | Medium | Translate & Adapt | Re-translate items marked "outdated": 4 product descriptions, 3 collection descriptions, reviews page body, 5 guide bodies (zin-of-onzin, hoe-werkt, doucheslang-kiezen, douchekop-lekt, beste-douchekop-met-filter), meta descriptions of the 2 news articles. |
| M6 | Medium | Theme (preview or live) | Theme settings › "Bol.com brand page URL" → `https://www.bol.com/nl/nl/b/besjaar/603580876/`; apply `theme-patches/snippets_structured-data.liquid.diff` (Organization url → www). |
| M7 | Medium | Theme editor › Home | Strip "Voor 16:00 besteld, morgen in huis" → "Vóór 16:00 besteld, meestal morgen in huis"; same wording for product/collection trust rows. |
| M8 | Medium | Blog | Merge `besjaar-douchekoppen-twee-designs-vergeleken` into `besjaar-assortiment-welke-douchekop`, then unpublish it and add a 301 (Online Store › Navigation › URL redirects) for the NL path and the 4 localized paths. |
| M9 | Medium | Blog | Move `news/lage-waterdruk-in-de-douche-…` to Gids (new article, same content, title "Lage waterdruk in de douche: 7 oorzaken en oplossingen"), 301 the old URLs, cross-link with `gids/douchekop-lage-waterdruk`. |
| M10 | Medium | Products › douchekop met filter (zonder slang) › Media | Remove or caption the image "Besjaar hoge druk douchekop met filter en slang…" (shows a hose that is not included). |
| M11 | Low | Blog drafts | Correct or delete the two unpublished drafts that say the filter catches limescale (C1). |
| M12 | Low | Theme (performance) | Implement the image `sizes`/hero and CSS items from Deliverable 4 (largest expected LCP gain on mobile). |

## 4. What remains (not done, and why)

- **Shipping policy text (M1):** the API token has no `write_legal_policies` scope. Attempted; refused by Shopify; nothing changed.
- **Homepage title/description:** no Admin API for Online Store › Preferences.
- **Search Console, Merchant Center, CrUX field data:** no access in this session; nothing was assumed.
- **Article rewrites/merges and redirects:** editorial decisions (content removal, URL changes) are left to the merchant; exact steps are given above.
- **Theme publish:** publishing is blocked for the connector by design and should follow a human preview.

## 5. How to measure the results in Google Search Console

**Baseline (record now, before Google re-crawls):** GSC › Performance › Search results, date range 2026-08-07 → 2026-11-06 (3 months) and 2026-05-07 → 2026-11-06 (6 months). Export Queries, Pages, Countries (NL, BE, DE, FR, ES) and Devices. Also save Pages (indexing) status and Core Web Vitals.

**Speed up discovery:** URL Inspection › Request indexing for the 6 products, 3 collections, `/blogs/news`, `/pages/reviews` (NL). Resubmit `sitemap.xml` in Sitemaps.

**What to compare after 28 days and after 8–12 weeks (same-length period, compare mode):**

| Question | GSC view | Expected direction | Watch-out |
|---|---|---|---|
| Do brand-first titles change CTR on commercial pages? | Pages filter = each product/collection URL → CTR and clicks | Stable or higher CTR for brand + product queries; non-brand CTR may move either way | If non-brand CTR on a product drops by more than ~20% with stable position, test keyword-first again for that page only |
| Do the product pages now match model-specific queries? | Queries containing "met slang", "zonder slang", "met filter en slang", "3 standen", "150 cm" → Pages tab | Each query mainly on its own product URL | Two products sharing one query = remaining cannibalization |
| Does the showerhead collection gain "douchekop kopen / douchekoppen"? | Query filter; Page = /collections/showerhead | Impressions ↑ | Compare with the homepage URL for the same queries (K5) |
| Do the newly linked guides gain visibility? | Pages: beste-douchekop-met-filter-vergeleken, regendouche-of-handdouche, is-besjaar-betrouwbaar, douchefilter-vervangen-stappenplan | Impressions ↑ | — |
| Are the untranslated duplicates dropping out? (after publishing the preview theme) | Pages (indexing) › "Excluded by 'noindex' tag" | +4 URLs (de/en/fr/es twee-designs) and blog tag URLs | Nothing else commercial should appear there |
| Policy description fix | URL Inspection of /policies/shipping-policy › View crawled page | Non-empty description | — |
| Product rich results | Enhancements › Merchant listings / Product snippets | No new errors; shipping and returns detected | If "Missing field 'aggregateRating'" warnings appear, ignore them (warnings, not errors) |
| Core Web Vitals (after M12) | Experience › Core Web Vitals (mobile) | Fewer "LCP > 2.5 s" URLs | Field data lags ~28 days |

**Merchant Center (when accessible):** Products › Diagnostics. Check that price, availability and shipping (NL €2,99 / free ≥ €25; BE/DE/FR/ES €2,99 / free ≥ €30) match the site and the JSON-LD. Do not add a second feed; the Google & YouTube app is the single source (its theme app embed is currently disabled, which is fine).

**Do not attribute** a traffic change to a single edit without checking the date against other events: Black Friday (vroege toegang 21 Nov, Black Week 23–30 Nov), the Sinterklaas/Christmas season and Google core updates all fall inside the measurement window.
