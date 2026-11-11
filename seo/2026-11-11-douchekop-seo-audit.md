# Besjaar.eu – SEO audit and plan for "douchekop"

**Date:** 11 November 2026 · **Market:** Netherlands (nl-NL) · **Primary page:** `https://www.besjaar.eu/collections/showerhead`
**Status:** Audit complete. **Nothing has been changed on the live store.** Everything below marked "proposed" waits for your approval.

Supporting files in this repository:

| File | What it is |
|---|---|
| `seo/baseline/2026-11-11/metrics.md` | Traffic, order and Lighthouse baseline (28d / 90d) |
| `seo/baseline/2026-11-11/url-inventory.csv` | Title, meta description, robots, canonical, `lang`, hreflang, H1 and schema types for 300 of the 375 sitemap URLs in 5 languages (the 75 not captured are listed in `url-inventory-missing.txt`) |
| `seo/baseline/2026-11-11/collections/*.json`, `products/*.json` | Exact current collection and product descriptions (rollback source) |
| `seo/content/collection-showerhead.description.nl.html` | Ready-to-paste Dutch collection description (proposed) |
| `seo/tools/snapshot_heads.py` | Re-runnable snapshot + diff tool for before/after checks |

---

## Executive summary

1. **The collection is technically ready to rank, but currently gets almost no organic traffic.** It is indexable,
   self-canonical, in the sitemap, has correct hreflang for all 5 languages, a single H1, valid
   BreadcrumbList / CollectionPage / ItemList schema, and many internal links. Yet it received **2 classic organic
   sessions in the last 28 days** (12 "search" sessions in 90 days, some of which were paid). It is very unlikely
   to be on page 1 for "douchekop" today. Which URL Google associates with "douchekop" **cannot be verified
   without Search Console**.
2. **Most "search" traffic in Shopify is paid.** 639 of 930 "search" sessions in the last 28 days carried a Google
   Ads click ID. Of the orders where Shopify records a journey, Google orders come almost entirely through the
   **Merchant Center product feed (Shopping)**: 12 orders, versus **1** order from a classic organic result. That
   makes protecting product titles, prices and the feed a priority.
3. **What limits "douchekop" visibility is mostly not technical.** In order of evidence:
   - (a) A small range: 4 shower heads against competitors' 64–520+ products.
   - (b) A young domain: organic traffic only started in September 2026.
   - (c) Internal competition for the same phrase: a ~3,800-word guide titled **"Douchekop kopen? …"**, published
     9 Nov, plus homepage and collection titles that use the same modifiers.
   - (d) Thin, mostly collapsed category copy: 311 words.
   - (e) Slow mobile rendering in lab tests (LCP 4.2–6.4 s).
4. **Earlier SEO work on this store was extensive and largely good** (see `assets/besjaar-seo-release-notes.txt` in
   the theme): native product schema, shipping and return schema, noindex rules, hreflang, internal linking. This
   plan builds on it and avoids redoing or undoing it.
5. **Recommended first step (low risk, Admin-only, no theme code):**
   - expand the collection copy with the ready-to-paste text;
   - make the collection title keyword-first;
   - re-aim the "douchekop kopen" guide at "douchekop kiezen";
   - vary internal anchor texts;
   - fix two inaccurate or expiring meta descriptions;
   - connect Search Console so results can be measured.

Realistic expectation: for the head term "douchekop", page-1 rankings against bol.com, Praxis, Gamma and
specialist shops with large ranges needs more than on-page work. Range depth, reviews and external links
matter too. The long-tail terms ("douchekop met filter", "douchekop met slang", "douchekop 3 standen",
"waterbesparende douchekop met filter") are where Besjaar can win first.

---

## A. SEO audit – what limits stronger visibility?

### A1. Main collection `/collections/showerhead` – current state (verified live, 11 Nov 2026)

| Check | Result | Verdict |
|---|---|---|
| HTTP status / indexability | 200, `index,follow,max-image-preview:large,…` | OK |
| Canonical | `https://www.besjaar.eu/collections/showerhead` (self) | OK |
| Sitemap | Listed in `sitemap_collections_1.xml` (+ /de, /fr, /en, /es sitemaps) | OK |
| robots.txt | Shopify default; collections allowed; sort/filter crawl traps blocked | OK |
| hreflang | nl, de, fr, en, es + x-default; reciprocal; self-referencing on all 5 versions | OK |
| `<html lang>` | `nl` | OK |
| SEO title | "Besjaar® \| Douchekop Kopen – Waterbesparend & Hoge Druk" (55 chars) | Good; brand first |
| Meta description | "Vergelijk alle Besjaar douchekoppen: 3 of 10 standen, … vanaf €25." (150 chars) | Good |
| H1 | "Douchekoppen" (exactly one) | OK |
| H2/H3 | One content H2 ("Welke Besjaar douchekop past bij jou?") inside a collapsed panel; product cards are H3 | Thin structure |
| Copy | 311 words. The first sentence is shown under the H1; the rest sits in a collapsed "Meer over douchekoppen" `<details>` panel | Thin compared with competitors |
| Products | 5 items: 4 shower heads + 1 hose (manual sort) | Small range |
| Structured data | Organization, Brand, WebSite (head), BreadcrumbList, CollectionPage, ItemList (visible grid) | Correct; no duplicates |
| Internal links in | Homepage ×6, header menu, footer, every product breadcrumb, 10+ guides | Strong (anchors mostly branded) |
| Mobile (lab) | Perf 81, LCP 4.2 s (text LCP held back by render delay) | Needs field-data check |
| Desktop (lab) | Perf 96, LCP 1.3 s | Good |

**Is it the strongest candidate for "douchekop"?** Yes. It is the only page whose purpose matches the
commercial intent: a choice of shower heads with add-to-cart. Of the alternatives, the homepage is the
brand page, the products are single models, and the guide is informational. Keep it as the primary target,
**keep the handle `showerhead`**, and strengthen it rather than creating a new collection.

### A2. Which URL does Google associate with "douchekop"? (not verifiable here)

Search Console was not connected, and this environment's network blocks Google, Bing and DuckDuckGo
results pages. What the data does show:

- Classic organic entrances to the collection: 2 in 28 days. A page-1 position for a mainstream head term would
  normally produce far more, so the collection is very probably not on page 1.
- Classic organic entrances are led by the homepage (50, probably brand searches), the
  "douchekop met filter en slang" product (41) and how-to guides.
- The Besjaar bol.com listing appeared in a web search sample for "hoge druk douchekop". That is a non-Google,
  non-localised sample, so treat it as a signal only.

**To verify:** Search Console → Performance → Search results → Queries, filter *Query contains "douchekop"*,
then switch to the **Pages** tab. Repeat for the exact query "douchekop".

### A3. Findings, ranked

| # | Finding | Evidence | Impact |
|---|---|---|---|
| 1 | **Range depth.** 4 shower heads; ranking category pages offer 64 (Ecorain) to 520+ (Sanitairkamer, per its title) | Competitor pages and titles | High for the head term; low for long-tail |
| 2 | **Young site / authority.** Classic organic sessions grew from ~0/week (Aug) to 95/week (2–8 Nov). No backlink data available | Shopify weekly series | High for the head term |
| 3 | **Cannibalisation.** `/blogs/gids/douchekop-kopen` (published 9 Nov, ~3,800 words, title "Douchekop kopen? Complete koopgids 2026") competes with the collection's "Douchekop Kopen". The homepage title ("Waterbesparende Douchekoppen met Hoge Druk") repeats the collection's modifiers. The collection H2 duplicates the H1 of `/blogs/news/besjaar-assortiment-welke-douchekop` | Live titles and H1s | Medium |
| 4 | **Category copy is thin and hidden.** 311 words, only the first sentence visible; Ecorain shows ~1,100 words under 7 subtopic H2s | Page comparison | Medium |
| 5 | **Anchor texts are almost all branded** ("Besjaar douchekoppen", "Bekijk de Besjaar douchekoppen →") | Link extraction from 11 guides | Low–medium |
| 6 | **Mobile rendering (lab).** Collection LCP 4.2 s (86 % render delay; 26 stylesheets ≈ 626 KB + 43 scripts ≈ 1 MB uncompressed); product LCP 6.4 s (main image loads late and too large) | Lighthouse | Low–medium (CWV is a tie-breaker); field data unknown |
| 7 | **No review stars in search.** Correctly so: the Judge.me review counts (145/153/61/79 = 438) match the bol.com total shown on the site (433), which strongly suggests imported bol reviews. Google does not allow marking up reviews collected on other sites | Metafields `reviews.rating` exist; no aggregateRating in output | Medium for CTR, long term |
| 8 | **Inaccurate / expiring meta descriptions** on the two douchesets: the Design Doucheset says "Black Friday €249,99" while the price is €199,99; both mention end dates | Admin SEO fields vs live price | Low (accuracy, CTR) |
| 9 | Minor technical: `/collections/vendors?q=besjaar` is indexable with the bare title "Besjaar"; two untranslated new articles are indexable under `/de/` with Dutch titles (duplicate titles); Organization schema `url` is `https://besjaar.eu` while the canonical host is `www`; a removed flashlight URL (404) still gets a few organic visits | Inventory CSV and live checks | Low |

**Checked and fine (no action):** canonicals (300/300 self-referencing), one H1 on every captured page,
no invalid JSON-LD, hreflang reciprocity, noindex on `/collections/all`, `/collections`, search, cart and
track-order, product images have descriptive alt text (the empty-alt collection hero image is
intentionally decorative and hidden), and `ProductGroup`/`Product` schema with correct shipping. NL shipping
is €2.99 and free from €25, which matches the delivery profile. Return policy schema is present.

---

## B. Keyword-to-page map

| Keyword (intent) | Target page | Supporting pages | Notes |
|---|---|---|---|
| **douchekop**, douchekoppen, douchekop kopen (commercial) | `/collections/showerhead` | Homepage, koopgids, all guides | The only page that should use "Douchekop kopen" in its title |
| waterbesparende douchekop (commercial / informational) | `/collections/showerhead` | `/blogs/gids/waterbesparende-douchekop-hoeveel-bespaar-je`, `/blogs/gids/wat-kost-een-douchebeurt-emmertest` | See the "waterbesparend" caveat below |
| hoge druk douchekop | `/collections/showerhead` | `/blogs/gids/hoge-druk-douchekop-wat-betekent-dat`, `/blogs/gids/douchekop-lage-waterdruk` | Honest framing: a shower head does not raise mains pressure |
| handdouche | `/collections/showerhead` | `/products/…douchekop-3-sproeistanden…`, `/blogs/gids/regendouche-of-handdouche` | All Besjaar heads are handdouches |
| douchekop met slang | `/products/…met-slang-handdouche-met-3-sproeistanden…` | Collection, `/blogs/gids/doucheslang-kiezen` | |
| luxe douchekop | `/collections/showerhead` (secondary only) | – | Weak fit (€19.99–€30.99, ABS/chrome per the koopgids). Do not force it |
| douchekop met filter | `/collections/douchekop-met-filter` | `/blogs/gids/beste-douchekop-met-filter-vergeleken`, `/blogs/gids/douchefilter-zin-of-onzin` | Keep this collection filter-specific |
| douchekop met filter en slang | `/products/…met-slang-hoge-druk-met-filter-10-sproeistanden…` | Filter collection | |
| douchekop met filter 10 standen / zonder slang | `/products/…douchekop-met-filter-model-1002025…` | Filter collection | |
| douchekop 3 standen | `/products/…douchekop-3-sproeistanden…` | Collection | |
| doucheslang | `/products/besjaar-doucheslang-150-cm-chroom` | `/collections/accessoires`, `/blogs/gids/doucheslang-kiezen` | |
| douchefilter, vervangfilter | `/collections/shower-filter`, `/products/besjaar-douchefilter` | Filter guides | |
| regendoucheset, doucheset met thermostaat | `/collections/douchesets` + 2 products | `/blogs/gids/regendouche-of-handdouche` | |
| douchekop kiezen, waar let je op (informational) | `/blogs/gids/douchekop-kopen` (retitled) | – | Proposed re-aim; URL unchanged |
| welke Besjaar douchekop, Besjaar douchekop vergelijken (brand) | `/blogs/news/besjaar-assortiment-welke-douchekop` | Collection | |
| besjaar, besjaar douchekop (brand) | Homepage | `/blogs/news/wat-is-besjaar`, `/blogs/gids/is-besjaar-betrouwbaar` | |

**"Waterbesparend" caveat:** all models are specified at max. 8 l/min. I could not reach rvo.nl or
milieucentraal.nl from this environment to check how Dutch public sources define "waterbesparende
douchekop". Please confirm that 8 l/min meets the definition you want to rely on before stressing the word
further. The proposed copy uses the measurable "maximaal 8 liter per minuut" and does not promise a fixed
saving.

---

## Competitor analysis (Google NL) – what could and could not be verified

**Limitation:** the live Google.nl results pages (organic results, ads, Shopping units) could not be loaded:
this environment's proxy blocks google.*, bing.com and duckduckgo.com. I used a general web-search tool,
which is not Google NL and not localised, to identify candidate pages. Treat the list below as "pages that
compete", **not** as Google NL positions. No search volumes, difficulty scores, backlink counts or positions
are claimed. Of the candidate pages, only `ecorain.nl` could be fetched. bol.com, praxis.nl, gamma.nl,
karwei.nl, sanitairkamer.nl, tegeldepot.nl, badkranenwinkel.nl and rvo.nl are blocked by the session's
network policy and would need to be allowed for a deeper comparison.

Candidate category pages for "douchekop" / "douchekop kopen" (search-result titles as returned):

| Site | Page | Title pattern (from results) | Observed |
|---|---|---|---|
| bol.com | `/nl/nl/l/douchekoppen/13337/` | "Douchekop kopen? Alle Douchekoppen online" | Marketplace; also lists Besjaar's own bol product for "hoge druk douchekop" |
| sanitairkamer.nl | `/douche/douchekop/` | "Douchekop kopen? ➤ 520+ douchekoppen & eerlijke prijs!" | Very large range |
| praxis.nl | `/badkamer-wc/douches/douchekoppen/ba017/` | "Douchekop kopen? Handdouches voor jouw douche" | DIY chain |
| karwei.nl, gamma.nl/.be, brico.be | Category pages | "Douche(kop/koppen) kopen? Bekijk …" | DIY chains |
| beslist.nl | Comparison listing | "Douchekoppen kopen? ✔️ Tot 76% korting!" | Price comparison |
| tegeldepot.nl | `/kranen/regendouche/douchekop` | "Regendouchekop kopen? Losse douchekop" | Specialist |
| **ecorain.nl** (Shopify, fetched) | `/collections/douchekop` | "Douchekop kopen? Ruim Assortiment en Duurzaam \| EcoRain" | Details below |

**Ecorain `/collections/douchekop` (fetched 11 Nov 2026):**
- **Title and meta:** keyword-first title; meta description lists USPs (free shipping, next day, 30 days, warranty).
- **Range:** H1 "Douchekoppen", 64 products with a review count on each card, plus "4.85/5, 1.100+ reviews" in the header.
- **Copy:** ~1,100 words below the grid under 7 H2s:
  - AquaPro (their water-saving technology)
  - waterbesparend
  - "De beste douchekop kopen: waar moet je op letten?"
  - grotere douchekop
  - zwarte douchekop
  - houder
  - douchekop met slang
- **Schema:** only BreadcrumbList. Besjaar's markup is richer.
- **hreflang:** NL plus a separate .de domain.

**Pattern across the candidates:** every commercial result leads with "Douchekop kopen?". Category pages
combine a large range with filters, prominent review totals and a buying-guide block under the grid.

### Five most important opportunities for Besjaar

1. **Turn the collection into the best "choose a douchekop" page in the niche.** Add a compact, honest
   buying guide with a comparison table under the grid (content ready in section D). Besjaar's honesty about
   filters and pressure is a real differentiator against marketing-heavy copy.
2. **Use one keyword-first commercial title on one URL.** Make the collection the only "Douchekop kopen" page;
   move the koopgids to "douchekop kiezen / waar let je op".
3. **Win the long-tail first** (douchekop met filter, met slang, met filter en slang, 3 standen, 10 standen,
   pauzeknop), where big retailers are generic and Besjaar has dedicated pages. Your own bol listing appears
   for "hoge druk douchekop", which shows the demand exists.
4. **Build first-party trust signals.** Collect reviews on besjaar.eu (Judge.me request e-mails) and on
   Trustpilot (already started 27 Oct), so that genuine store reviews can be shown and, once collected
   first-party, marked up. Competitors show 1,100+ reviews prominently.
5. **Close the range gap over time.** A business decision, not an SEO trick. Two or three extra heads (for
   example a black finish, or a larger or rain-style head that fits the existing douchesets range) would make
   the collection a more credible answer to the broad "douchekop" query. Earning a few genuine links from Dutch
   comparison or test sites and suppliers would also help.

---

## C. Priority action plan (top 10)

Scores: Benefit / Evidence / Effort / Risk = H(igh), M(edium), L(ow). "Admin" means a content change in Shopify
admin (no theme code). Theme changes are made only in an unpublished copy that you preview and publish yourself.

| # | Action | Benefit | Evidence | Effort | Risk | Where | Phase |
|---|---|---|---|---|---|---|---|
| 1 | Connect Google Search Console; export the 28d and 3-month baseline; verify which URL ranks for "douchekop" | H (enables everything) | – | L | None | You (GSC) | 0 – now |
| 2 | Replace the collection description with the expanded Dutch guide (D2); first paragraph stays the visible intro | M–H | M | L | L | Admin | 1 |
| 3 | Collection SEO title → "Douchekop Kopen – Waterbesparend & Hoge Druk \| Besjaar®"; new meta description (D1) | M | M | L | L* | Admin | 1 |
| 4 | Re-aim the koopgids: title/SEO title to "Douchekop kiezen…", meta description, a "Direct vergelijken?" link to the collection near the top (D3) | M | H | L | L | Admin | 1 |
| 5 | Vary anchor texts in 4 guides and add one contextual link (D4) | L–M | M | L | L | Admin | 1 |
| 6 | Fix the 2 inaccurate/expiring doucheset meta descriptions (D6) | L | H | L | L | Admin | 1 |
| 7 | Mark the 2 untranslated new articles `custom.primary_locale_only = true` (noindex on /de, /en, /fr, /es until translated) | L | H | L | L | Admin | 1 |
| 8 | Homepage title de-overlap (D5) – **only if** GSC shows the homepage taking "douchekop(pen)" impressions | L–M | Pending GSC | L | M | Admin | 2 |
| 9 | Theme: noindex vendor/type listings; optional NL-only H1 override; mobile hero test; Organization URL (E1–E4) | L | M | M | M | Theme copy | 3 |
| 10 | Long term: first-party reviews, range expansion, genuine links/PR, product-page intros (D7) | H (long term) | M | H | L | Business | Ongoing |

\* Low because the collection currently receives ~2 organic sessions per 28 days, so there is very little
ranking to lose. Still confirm in GSC (action 1) that it holds no valuable impressions before switching.

**Explicitly not recommended:**
- renaming the handle to `/collections/douchekoppen`;
- a second "douchekoppen" collection;
- FAQPage schema (no rich-result eligibility for shops);
- marking up imported bol reviews;
- editing robots.txt;
- installing another SEO app. The StoreRank.ai app already left an unpublished collection and an IndexNow redirect; check whether you still use it.

---

## D. Ready-to-publish content (Dutch)

### D1. Main collection `/collections/showerhead`

| Field | Current | Proposed |
|---|---|---|
| SEO title | Besjaar® \| Douchekop Kopen – Waterbesparend & Hoge Druk (55) | **Douchekop Kopen – Waterbesparend & Hoge Druk \| Besjaar®** (55) |
| Meta description | Vergelijk alle Besjaar douchekoppen: 3 of 10 standen, met of zonder filter of slang, volle straal bij max. 8 l/min. Gratis verzending in NL vanaf €25. (150) | **Douchekop kopen? Vergelijk Besjaar handdouches met 3 of 10 standen, met of zonder filter en slang, max. 8 l/min. Gratis verzending in NL vanaf €25.** (147) |
| H1 | Douchekoppen | **Keep "Douchekoppen"** (recommended). Optional: "Douchekoppen – vind jouw ideale douchekop" via E2 (NL only) |
| Collection title (menu, breadcrumb, schema) | Douchekoppen | Keep |
| Handle | showerhead | Keep |

Why not your suggested "Besjaar® | Douchekop Kopen – Hoge Druk & Waterbesparend"? It is the current title
with two words swapped, so it would change practically nothing. Moving "Douchekop Kopen" to the front
matches every ranking competitor's pattern and keeps both supporting modifiers.

I also considered "Douchekop kopen? Met of zonder filter & slang | Besjaar®" and rejected it: it would
overlap with the filter collection's "Douchekop met Filter – Met of Zonder Slang".

Why keep the H1? "Douchekoppen" is the exact plural head term, and the collection title also drives the
menu, breadcrumbs and BreadcrumbList schema. Changing the title would ripple through those. A separate H1
needs a small theme change (E2).

### D2. Collection description (paste into Admin → Collections → Douchekoppen → Description → `<>` HTML view)

Full text: **`seo/content/collection-showerhead.description.nl.html`** (928 words, 8 H2s, 3 FAQ H3s, 17 contextual links, no new claims).

- **First paragraph** (33 words, no links): rendered under the H1 as the hero intro. It is also the mobile LCP
  element, so it is kept about as short as today.
- **Everything else** renders in the existing collapsed "Meer over douchekoppen" panel. No theme change is
  needed. Google indexes content in `<details>` panels.
- **The comparison table and all current facts are kept.** The H2 is renamed to "Douchekoppen vergelijken:
  welke past bij jou?" so it no longer duplicates the news article's H1.
- **Every fact comes from your own product data, policies or delivery settings:**
  - max. 8 l/min; 3 standen (regen, massage, power); 10 standen = 8 wellness + 2 PowerWash + pauzeknop;
  - 13 cm head; 8-traps filter; filter life 3–5 months; G½;
  - fitting without tools; silicone nozzles;
  - next working day when ordered before 16:00; €2.99 / free from €25; 30 days; 12 months' warranty.
- **No health, pressure-increase or fixed-saving claims.** The copy states that a shower head cannot raise
  mains pressure and points to the emmertest so customers can measure their own usage.
- **Translations are not touched.** EN/DE/FR/ES keep their own (already "outdated"-flagged) descriptions until
  you update them in Translate & Adapt.

Section outline:
1. Intro (visible)
2. Douchekoppen vergelijken: welke past bij jou? (table)
3. Soorten douchekoppen (handdouche, regendouche → douchesets, met filter)
4. 3 of 10 standen: wat is het verschil?
5. Douchekop met of zonder filter
6. Waterverbruik en douchecomfort
7. Past een Besjaar douchekop op jouw doucheslang? (met/zonder slang)
8. Monteren, onderhouden en vervangen
9. Veelgestelde vragen over douchekoppen (3 questions)
10. Closing link to the koopgids.

### D3. Koopgids `/blogs/gids/douchekop-kopen` (URL unchanged)

| Field | Current | Proposed |
|---|---|---|
| Article title (H1) | Douchekop kopen: waar let je op? De complete koopgids (2026) | **Douchekop kiezen: waar let je op? De complete koopgids (2026)** |
| SEO title | Douchekop kopen? Complete koopgids 2026 \| Besjaar (49) | **Douchekop kiezen: waar let je op? Koopgids 2026 \| Besjaar** (57) |
| Meta description | Douchekop kopen? Zo kies je de juiste: aansluiting, liters per minuut, ketel, standen, filter, slang en prijs. Met checklist en eerlijk advies. | **Waar let je op bij een nieuwe douchekop? Aansluiting, liters per minuut, standen, filter, slang en prijs uitgelegd, met checklist en eerlijk advies.** (148) |

Insert after the article's first body paragraph:

```html
<p><strong>Direct vergelijken?</strong> Bekijk <a href="/collections/showerhead">alle douchekoppen</a> naast elkaar: 3 of 10 standen, met of zonder filter en slang.</p>
```

Existing sentence, change the anchor only:
`Of bekijk direct alle <a href="/collections/showerhead">Besjaar-douchekoppen</a>` → `Of bekijk direct <a href="/collections/showerhead">alle douchekoppen</a>`.

Risk: low. The article is 2 days old and has no ranking history yet; this is the cheapest moment to re-aim it.

### D4. Anchor-text variation in guides (find → replace inside the article body)

| Article | Current | Proposed |
|---|---|---|
| `/blogs/gids/hoge-druk-douchekop-wat-betekent-dat` | `ontdek alle <a href="/collections/showerhead">Besjaar douchekoppen</a>` | `ontdek alle <a href="/collections/showerhead">douchekoppen met een volle straal</a>` |
| `/blogs/gids/douchekop-vervangen-in-5-minuten` | `Alle <a href="/collections/showerhead">Besjaar douchekoppen</a> passen op` | `Alle <a href="/collections/showerhead">Besjaar handdouches</a> passen op` |
| `/blogs/gids/regendouche-of-handdouche` | No contextual link (only the generic CTA) | Add at the end of the handdouche section: `<p>Kies je voor een handdouche? <a href="/collections/showerhead">Vergelijk de Besjaar handdouches</a>: 3 of 10 standen, met of zonder filter en slang.</p>` |
| `/blogs/gids/douchekop-kopen` | See D3 | See D3 |

Unchanged on purpose: `waterbesparende-douchekop-…` already uses "collectie waterbesparende douchekoppen",
and `douchekop-lage-waterdruk` uses "Bekijk alle Besjaar douchekoppen". The shared CTA "Bekijk de Besjaar
douchekoppen →" stays. That keeps the anchors varied without stuffing.

### D5. Homepage (Phase 2 – only after GSC check)

| Field | Current | Proposed |
|---|---|---|
| SEO title | Besjaar® \| Waterbesparende Douchekoppen met Hoge Druk (53) | **Besjaar® \| Nederlands merk voor douchekoppen en douchefilters** (61) |
| Meta description | Ontdek de waterbesparende douchekoppen van Besjaar … Bestel eenvoudig online! (152) | Keep |
| H1 | Besjaar douchekoppen comfortabel en zuinig. | Keep (brand + category, not a head-term copy) |
| Internal links | 6 links to `/collections/showerhead` ("Bekijk douchekoppen →", "Bekijk alle douchekoppen →", "SHOP DOUCHEKOPPEN →", "Vergelijk de modellen →", menu, footer) | No change needed. Linking is already strong; adding more would be noise |

Condition: apply only if Search Console shows the homepage receiving non-brand "douchekop(pen)" impressions
while the collection does not. Brand stays first, so "besjaar" brand rankings are protected.

### D6. Product SEO fixes (Phase 1)

| Product | Field | Current | Proposed |
|---|---|---|---|
| Besjaar® Design Doucheset – Mat Zwart | Meta description | …extra handsproeier. Black Friday €249,99 t/m 30/11. (price is actually €199,99) | Regendoucheset in mat zwart met drukknopbediening: regendouche, handdouche, aflegplank en extra handsproeier. Bekijk de set, prijs en levertijd. (144) |
| Besjaar® Complete Doucheset | Meta description | …Black Friday-prijs €199,99 t/m 30 november. (expires) | Regendoucheset in chroom: regendouche 30 × 20 cm, handdouche met 3 standen en messing thermostaatkraan (15 cm hartafstand). Bekijk prijs en levertijd. (150) |

### D7. Product pages (review result and optional Phase 3)

All four shower-head products already have:
- unique SEO titles and meta descriptions;
- a single H1 with the model name;
- descriptive image alt texts;
- native Product/ProductGroup schema with GTIN, shipping and return policy;
- a breadcrumb Home › Douchekoppen › product;
- "Bijpassende producten" links.

**Keep product titles, handles, variant IDs, prices and descriptions** (these feed Merchant Center, which
drives most Google orders).

Optional, after GSC shows which product queries have impressions: brand-last SEO titles (product titles unchanged):

| Product | Current SEO title | Optional SEO title | Long-tail target |
|---|---|---|---|
| Douchekop 3 standen | Besjaar® \| Waterbesparende Douchekop – 3 Standen | Douchekop 3 Standen – Handdouche Chroom, 13 cm \| Besjaar® (57) | douchekop 3 standen, handdouche |
| Douchekop met slang | Besjaar® \| Douchekop met Slang 1,5 m – 3 Standen | Douchekop met Slang 1,5 m – 3 Standen, Chroom \| Besjaar® (56) | douchekop met slang |
| Douchekop met filter | Besjaar® \| Douchekop met Filter – 10 Standen, Zonder Slang | Douchekop met Filter – 10 Standen, Zonder Slang \| Besjaar® (58) | douchekop met filter 10 standen |
| Douchekop met filter en slang | Besjaar® \| Douchekop met Filter en Slang – 10 Standen | Douchekop met Filter en Slang – 10 Standen \| Besjaar® (53) | douchekop met filter en slang |

The two filter products' descriptions are 76 % identical. The theme's release notes say a product metafield
`custom.introduction` overrides the lede. Verify in the theme preview that it is still honoured. Filling it
leaves the feed description untouched:

- **Douchekop met filter (zonder slang):** "Is je doucheslang nog goed? Dan draai je deze douchekop met filter er
  zonder gereedschap op. Je krijgt het ingebouwde 8-traps filter, 10 standen en een pauzeknop, zonder een
  slang die je niet nodig hebt."
- **Douchekop met filter en slang:** "Wil je alles in één keer vervangen? Deze set bevat de douchekop met
  filter, 10 standen en pauzeknop, plus een nieuwe doucheslang van 1,5 meter, afdichtringen en teflontape.
  Handig als je oude slang lekt of vol kalk zit."

---

## E. Technical changes (Liquid) – only where necessary

All theme edits go into a **duplicate of the live theme** ("Besjaar – Douchesets (specs fix)",
`gid://shopify/OnlineStoreTheme/204425953607`). The Shopify connector I use cannot write to the live theme
or publish one, so you preview and publish yourself, and the current theme stays in your library as the
rollback.

### E1. Noindex Shopify's automatic vendor/type listings – `snippets/meta-tags.liquid`

`/collections/vendors?q=besjaar` is indexable with the bare title "Besjaar" and repeats the range.
Insert directly after the existing `/collections/all` rule:

```liquid
    if collection.handle == 'all'
      assign besjaar_ui_noindex = true
    endif
    comment
      2026-11-11: /collections/vendors?q=… and /collections/types?q=… are Shopify's
      automatic vendor/type listings. They repeat the range that /collections/showerhead
      owns, with a bare title. noindex,follow keeps links crawlable.
    endcomment
    if collection.handle == 'vendors' or collection.handle == 'types'
      assign besjaar_ui_noindex = true
    endif
```

Verify in preview: `/collections/vendors?q=Besjaar` → `noindex,follow`; `/collections/showerhead` → still
`index,follow`.

### E2. Optional: NL-only H1 override – `snippets/besjaar-collection-wow-hero.liquid`

Only if you want "Douchekoppen – vind jouw ideale douchekop". First create a collection metafield definition
`custom.seo_h1` (single line text) in Settings → Custom data → Collections, and fill it on Douchekoppen. Then replace:

```liquid
      <h1 class="bjc-hero__title">{{ hero_title | escape_once }}</h1>
```

with:

```liquid
      {%- liquid
        comment
          2026-11-11: optional SEO H1 for the primary language only. Other languages keep
          their translated collection title, so an untranslated Dutch value can never leak
          into /en, /de, /fr or /es. Breadcrumb, menu and schema keep the collection title.
        endcomment
        assign hero_h1 = hero_title
        if is_all != true and request.locale.primary and collection.metafields.custom.seo_h1 != blank
          assign hero_h1 = collection.metafields.custom.seo_h1.value | strip
        endif
      -%}
      <h1 class="bjc-hero__title">{{ hero_h1 | escape_once }}</h1>
```

### E3. Mobile render test – `assets/besjaar-collection-wow.css` (experiment, keep only if measured better)

The collection hero has a 460 px circle with `filter: blur(80px)` and an infinite animation. That is
expensive to paint on phones, and the hero text (the LCP element) waits on a busy main thread. Append:

```css
@media (max-width:749px){.bjc-wow .bjc-hero__glow{display:none}}
```

Run Lighthouse mobile on the preview theme before and after. Keep the change only if LCP or TBT improve.
The bigger lever, consolidating 626 KB of CSS, is a larger refactor. Do it only if the Search Console Core
Web Vitals report shows "Poor" or "Needs improvement" field data.

### E4. Organization `url` → `https://www.besjaar.eu` – `snippets/structured-data.liquid`

The Organization node uses `https://besjaar.eu` while the canonical host is `https://www.besjaar.eu`.
Align it, for example with `{{ shop.url }}`, during implementation after reading the exact line. Cosmetic;
low priority.

**Not changed on purpose:**
- canonical and hreflang output (Shopify-owned and correct);
- robots.txt (Shopify default and correct);
- Product schema (Shopify native, valid);
- Judge.me blocks;
- review markup.

---

## F. Implementation record

| Item | Status |
|---|---|
| Live store (products, collections, articles, SEO fields, theme, settings, apps, redirects) | **No changes made** |
| Repository | Added: this report, `seo/baseline/2026-11-11/*` (metrics, 300-URL inventory, exact collection and product JSON), `seo/content/collection-showerhead.description.nl.html`, `seo/tools/snapshot_heads.py` |
| Pending your approval | Items 2–7 (Phase 1, Admin), 8 (Phase 2, needs GSC), 9 (Phase 3, theme copy), D7 options |
| Pending on your side | Connect GSC and export the baseline (section I); confirm the "waterbesparend" definition; decide on range expansion and review collection |

---

## G. Verification results – what was actually tested

**Tested in this session:**
- **Live HTML** of the homepage, both target collections, 5 product pages and 11 guides: title, meta, robots,
  canonical, hreflang, H1–H3, JSON-LD, internal links and image alt text.
- **300 live URLs in 5 languages:** canonical/H1/schema sanity checks (`url-inventory.csv`).
- **hreflang/canonical reciprocity** on NL/EN/DE/FR/ES versions of the collection, a product and the homepage.
- **Indexability** of `/collections/all`, `/collections`, `/search`, vendors listing, StoreRank collection (404)
  and the old flashlight URL (404).
- **Shipping schema** against the actual delivery profile (NL €2.99, free ≥ €25; BE/DE/FR/ES €2.99, free ≥ €30).
- **Review metafields** against the schema output.
- **Shopify Analytics:** traffic, paid vs organic split, landing pages, orders and order journeys (28d/90d).
- **Lighthouse** mobile and desktop for the collection, homepage and the 3-standen product.
- **Ecorain** category page comparison.

**Not tested / not possible here:**
- Google Search Console (not connected) and Google's live NL results (blocked).
- Google Rich Results Test and Core Web Vitals field data (CrUX).
- PageSpeed Insights API (daily quota exhausted).
- Competitor pages other than Ecorain (network policy).
- Rendering of the proposed content in the theme (no change applied yet).
- 75 of 375 sitemap URLs (blog articles: 54 EN, 10 ES, 7 FR, 4 DE) stayed rate-limited (HTTP 429) after three
  slow retry rounds; they are listed in `url-inventory-missing.txt`. All homepage, collection, product and
  page URLs in all 5 languages, and all Dutch articles, were captured.
  Re-run `snapshot_heads.py --only /blogs/` later to complete it.

---

## H. SEO protection – how existing rankings, URLs and languages are protected

- **Baseline captured before any change:** the 300-URL head inventory, the exact current descriptions
  (collection/product JSON) and the traffic/order baseline. After each phase, re-run
  `python3 seo/tools/snapshot_heads.py --out after.csv` and
  `--diff seo/baseline/2026-11-11/url-inventory.csv after.csv`. Only the intended fields may change.
- **No URL, handle, product ID, variant ID, price, inventory, warranty or review changes.** No pages deleted.
  Product titles, which feed Merchant Center, stay untouched.
- **Multilingual:**
  - Every proposed edit is to the Dutch (primary) fields only.
  - Translate & Adapt keeps EN/DE/FR/ES values separately (verified for the collection), so other languages
    keep their current content.
  - The optional H1 override (E2) is explicitly limited to the primary locale.
  - hreflang and canonicals are Shopify-generated and untouched.
- **Theme:** edits only in an unpublished duplicate. The current live theme stays in the library, and
  rollback is "Publish" on the previous theme.
- **Content rollback:** the old collection description is in `seo/baseline/2026-11-11/collections/showerhead.json`
  (`description`). Old SEO titles and meta descriptions are in this report and the inventory CSV.
- **Staging the risk:** Phase 1 changes only pages with negligible current organic traffic (collection: 2
  sessions/28d; koopgids: 2 days old). The homepage, the main organic page, waits for GSC evidence.
- **Feed safety:** no change to product titles, descriptions, GTINs, prices or availability, so the Shopping
  feed is unaffected.

---

## I. Monitoring plan (90 days)

### Day 0 – before implementation (you)

1. Add or verify `https://www.besjaar.eu/` as a **Domain** or URL-prefix property in Google Search Console.
   Submit `https://www.besjaar.eu/sitemap.xml` if it isn't already.
2. **Performance → Search results**, dates "Last 28 days" and "Last 3 months", country **Netherlands**,
   search type **Web**. Export (Export → CSV):
   - Queries, filter *Query contains "douchekop"*;
   - Pages, filter *Page = `https://www.besjaar.eu/collections/showerhead`*;
   - all pages.
   Save the exports in `seo/baseline/2026-11-11/gsc/`.
3. Note the average position, impressions, clicks and CTR for: the exact query "douchekop", "douchekop kopen",
   "waterbesparende douchekop", "hoge druk douchekop", "douchekop met filter".
4. Optionally connect a GSC connector to Claude (Windsor.ai or Supermetrics appeared in the connector
   directory) so future checks can be automated.

### Day 0 – after implementation

- **URL Inspection → Request indexing** for `/collections/showerhead` and `/blogs/gids/douchekop-kopen`.
  This can speed up recrawling; it does not guarantee faster ranking.
- Write the change date and exact changes in a change log (this repo).

### Weekly (light touch)

- **GSC:** Pages report for the collection (impressions, average position), and the query "douchekop" with
  Pages tab (which URL ranks).
- **Shopify classic organic sessions**, excluding paid. Copy-paste the queries below into Analytics → Reports
  → new exploration.

```text
FROM sessions SHOW sessions WHERE referrer_source = 'search' AND landing_page_url NOT CONTAINS 'gclid' AND landing_page_url NOT CONTAINS 'gbraid' AND landing_page_url NOT CONTAINS 'wbraid' AND landing_page_url NOT CONTAINS 'gad_source' AND landing_page_url NOT CONTAINS 'sag_organic' GROUP BY landing_page_path SINCE -28d UNTIL today ORDER BY sessions DESC LIMIT 30

FROM sessions SHOW sessions WHERE referrer_source = 'search' AND landing_page_url NOT CONTAINS 'gclid' AND landing_page_url NOT CONTAINS 'gbraid' AND landing_page_url NOT CONTAINS 'wbraid' AND landing_page_url NOT CONTAINS 'gad_source' AND landing_page_url NOT CONTAINS 'sag_organic' TIMESERIES week SINCE -90d UNTIL today
```

### Day 28 and day 90 – evaluation

| Metric | Source | Compare |
|---|---|---|
| Impressions, clicks, CTR, average position for queries containing "douchekop" (NL, Web) | GSC | 28d after vs 28d before (day 28); 3 months after vs the 3-month baseline (day 90) |
| Which URL ranks for "douchekop" / "douchekop kopen" (should become the collection, not the guide) | GSC Queries → Pages | Before vs after |
| Collection: impressions, clicks, average position | GSC Pages | Same |
| Koopgids: impressions for "douchekop kiezen / waar op letten" queries | GSC | Same |
| Classic organic sessions and conversion rate to the collection and products | ShopifyQL above | Same windows |
| Orders with `sourceType: SEO` journey | Shopify order journeys | Same windows |
| Core Web Vitals (mobile) | GSC → Core Web Vitals | Status per URL group |

**Interpreting the data:**

- **Seasonality.** Black Friday/Black Week (20–30 Nov), Sinterklaas and Christmas will raise commercial
  searches and paid activity in the first 28-day window. Prefer **position and CTR** (less
  seasonality-sensitive) over raw clicks and sessions. Compare the same weekdays, and add the 90-day comparison
  in February. No year-on-year baseline exists because organic traffic only began in September 2026.
- **Normal fluctuation.** Daily position swings of several places are normal for a young site; judge trends
  on weekly averages over at least 3–4 weeks. Note any Google core update dates in the change log.
- **Paid interference.** Google Ads campaigns (three campaign IDs seen in landing URLs) can absorb clicks for
  the same queries. Check Ads search terms for "douchekop" before reading organic CTR changes.
- **Success at day 90:**
  - the collection is the URL Google shows for "douchekop" and "douchekop kopen";
  - collection impressions and average position improve;
  - long-tail product queries grow;
  - classic organic orders rise above today's ~1 per 90 days.
  A page-1 position for "douchekop" itself is a longer-term goal that depends on range, reviews and authority.

---

## What I need from you to proceed

Reply with the item numbers you approve (for example "Approve 2, 3, 4, 5, 6, 7"):

- **2** – replace the collection description with `seo/content/collection-showerhead.description.nl.html`
- **3** – collection SEO title and meta description (D1)
- **4** – koopgids title, SEO title, meta description and the "Direct vergelijken?" link (D3)
- **5** – anchor-text variations in 3 guides (D4)
- **6** – doucheset meta descriptions (D6)
- **7** – `custom.primary_locale_only = true` on "besjaar-douchekop-handleiding" and "black-friday-2026-vroege-toegang"
- **8** – homepage title (D5): after you share the GSC export
- **9** – theme copy with E1 (and E2 / E3 / E4 if wanted), for your preview
- **D7** – optional product SEO titles and `custom.introduction` texts

After approval I will:
- apply the Admin changes one by one;
- re-snapshot the changed URLs and diff them against the baseline;
- check the rendered pages on mobile and desktop widths, the collection and product links, and that canonical
  and hreflang output is unchanged;
- record exactly what changed in this repository.
