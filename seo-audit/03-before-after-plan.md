# Deliverable 3 — Before-and-after SEO plan, page by page

Format per page as requested: **A. Existing SEO – verified** (copied from the live HTML captured before changes) · **B. Recommended SEO** · **C. Implementation** · **D. Status**. Status values: *IMPLEMENTED + verified* = changed via the Shopify Admin API and re-crawled live on 2026-11-07 19:20 UTC; *PREVIEW* = applied to the unpublished theme "Besjaar – SEO audit 2026-11-07 (preview)" (id 204218663239) and verified in preview; *MANUAL* = needs merchant action or an access scope this session did not have; *RECOMMENDED* = not changed.

**Title rule applied:** `Besjaar® | Primary keyword – Key benefit` for commercial and brand pages (homepage already followed it). The theme appends " – Besjaar" only when a title lacks "Besjaar", so brand-first titles are never double-branded. **Guide articles keep question-first titles with the brand at the end** — for informational queries the searcher's question has to lead the title; this is the "where appropriate" exception in the brief.

Localized versions (en/de/fr/es) follow the same structure; their exact current values are in the inventory CSV. Localized brand-first SEO titles were registered for all 6 products, 3 collections, the reviews page and both blogs (see Deliverable 5).

## Homepage

### `/`

**A. Existing SEO — verified**

- Current title: `Besjaar® | Waterbesparende Douchekoppen met Hoge Druk` (53 chars)
- Current meta description: `Ontdek de waterbesparende douchekoppen van Besjaar met krachtige waterdruk, verschillende straalstanden en een stijlvol design. Bestel eenvoudig online!` (152 chars)
- Current H1: `Besjaar douchekoppen comfortabel en zuinig.`
- Current headings (H2/H3, first 12): h2: Vind jouw Besjaar douchekop.; h3: Douchekop met filter en slang – 10 standen; h3: Douchekop met filter – 10 standen; h3: Douchekop met slang – 3 standen; h3: Douchekop met 3 standen – chroom; h2: Jouw douche, precies zoals jij hem wilt.; h3: Hoge druk, laag verbruik; h3: 3 of 10 sproeistanden; h3: dagen bedenktijd; h3: Siliconen nozzles; h3: Filter in de handgreep; h3: Universele ½″-aansluiting
- Current canonical: self (https://www.besjaar.eu/)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,ContactPoint,ImageObject,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebPage,WebSite
- Content: 521 words in `<main>`; images 17 (no alt attribute: 0, empty alt in main: 3); inbound internal links: 87
- Current target keywords (observed from title/H1): Besjaar; waterbesparende douchekoppen; hoge druk douchekop
- Existing strengths: Brand-first title; one H1; Organization + WebSite + MemberProgram JSON-LD; hero, product grid (4 showerheads), trust row, guides, bol.com proof with source link.
- Existing problems: Meta description = generic shop description and says "krachtige waterdruk" (a showerhead cannot raise mains pressure – the store's own guide says so). Mobile LCP 4.5 s (lab) from a 1,672 px hero WebP; product-card images served at 480 px for ~170 px slots. Trust strip promises "Voor 16:00 besteld, morgen in huis" without "meestal". No direct link to the filter collection in the hero area (only via menu). An H3 reads "dagen bedenktijd" because the number sits outside the heading.

**B. Recommended SEO**

- Primary keyword: Besjaar
- Secondary keywords: douchekop kopen; douchekop met filter; Besjaar douchekop
- Search intent: Brand + broad commercial (navigational for "Besjaar")
- Proposed SEO title: `KEEP: Besjaar® | Waterbesparende Douchekoppen met Hoge Druk` — KEEP
- Proposed meta description: `Officiële Besjaar webshop: douchekoppen met een volle straal bij max. 8 l/min, met of zonder filter of slang. Gratis verzending in NL vanaf €25.` — MANUAL
- Proposed H1: KEEP: "Besjaar douchekoppen comfortabel en zuinig." (already names brand + category; the two spans render on separate lines)
- Content changes: Keep the page compact (no SEO text wall). Change trust strip to "Vóór 16:00 besteld, meestal morgen in huis". Add a secondary hero link "Douchekop met filter" → /collections/douchekop-met-filter. Put the "30" inside the H3 of the "dagen bedenktijd" card.
- Internal links to add: Hero secondary CTA → /collections/douchekop-met-filter; keep primary CTA → /collections/showerhead.
- Image optimizations: Serve hero with srcset/sizes (mobile ≤ 828 px), keep fetchpriority=high on LCP image; product cards: sizes="(max-width: 760px) 45vw, 25vw".
- Structured-data changes: Keep. Organization.url uses non-www (fixed in preview theme). sameAs points at a bol.com product listing – set theme setting "Bol.com brand page URL" to https://www.bol.com/nl/nl/b/besjaar/603580876/.
- Technical changes: Homepage title/description live in Online Store › Preferences (no Admin API) → manual.

**C. Implementation**

- Where: Online Store › Preferences (title/description); Theme editor › Home (hero, strip)
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: View source: <title>, meta description; Rich Results Test (Organization).
- Priority: **Medium**

**D. Status:** MANUAL (description) / RECOMMENDED (hero tweaks)

## Collections

### `/collections/showerhead`

**A. Existing SEO — verified**

- Current title: `Douchekop Kopen? Hoge Druk & Waterbesparend | Besjaar` (53 chars)
- Current meta description: `Besjaar douchekoppen: hoge druk bij max. 8 l/min, 3 of 10 standen, met of zonder filter of slang. Gratis verzending in NL vanaf €25, 30 dagen retour.` (149 chars)
- Current H1: `Douchekoppen`
- Current headings (H2/H3, first 12): h3: Douchekop met filter en slang – 10 standen; h3: Douchekop met filter – 10 standen; h3: Douchekop met slang – 3 standen; h3: Douchekop met 3 standen – chroom; h3: Doucheslang 1,5 m – universeel ½"
- Current canonical: self (https://www.besjaar.eu/collections/showerhead)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,CollectionPage,ContactPoint,ImageObject,ItemList,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 362 words in `<main>`; images 16 (no alt attribute: 0, empty alt in main: 1); inbound internal links: 87
- Current target keywords (observed from title/H1): douchekop kopen; douchekoppen; douchekop
- Existing strengths: Strong commercial title; accurate description; honest filter explanation (no softening/limescale claim); CollectionPage + ItemList JSON-LD; 5 products with prices, ratings, stock.
- Existing problems: No H2 and no side-by-side comparison of the models; the doucheslang (an accessory) sits in the "Douchekoppen" collection; guides not linked from the category.

**B. Recommended SEO**

- Primary keyword: douchekop kopen
- Secondary keywords: waterbesparende douchekop; hoge druk douchekop; douchekop met slang
- Search intent: Commercial – compare and buy
- Proposed SEO title: `Besjaar® | Douchekop Kopen – Waterbesparend & Hoge Druk` — IMPLEMENTED
- Proposed meta description: `Vergelijk alle Besjaar douchekoppen: 3 of 10 standen, met of zonder filter of slang, volle straal bij max. 8 l/min. Gratis verzending in NL vanaf €25.` — IMPLEMENTED
- Proposed H1: KEEP: "Douchekoppen" (collection title; also used in menus/breadcrumbs)
- Content changes: ADDED (live): H2 "Welke Besjaar douchekop past bij jou?" + 4-column comparison table (standen / filter / slang) for all 5 products + paragraph linking 4 buying guides. It renders in the existing collapsed "Meer over douchekoppen" panel (verified on 390 px – no overflow).
- Internal links to add: ADDED: regendouche-of-handdouche, hoge-druk-douchekop-wat-betekent-dat, douchekop-vervangen-in-5-minuten, beste-douchekop-met-filter-vergeleken; all 5 product URLs from the table.
- Image optimizations: Collection image alt already descriptive. Product-card images oversized on mobile (Lighthouse: 256 KiB saving).
- Structured-data changes: Keep CollectionPage/ItemList.
- Technical changes: Consider moving the doucheslang to its own "Doucheslangen" collection or label it "Accessoire" in the grid.

**C. Implementation**

- Where: Admin › Collections › Douchekoppen (SEO + description)
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Translations of the description are now marked outdated (EN/DE/FR/ES keep the previous text until re-translated).
- Tests: Re-crawled live 2026-11-07: title, description, H2, table and links present; 200; canonical self.
- Priority: **High**

**D. Status:** IMPLEMENTED + verified

### `/collections/douchekop-met-filter`

**A. Existing SEO — verified**

- Current title: `Douchekop met Filter – Met of Zonder Slang | Besjaar` (52 chars)
- Current meta description: `Douchekop met ingebouwd 8-traps filter tegen deeltjes en vrij chloor, met of zonder 1,5 m slang. Vervangfilters los te koop. Gratis verzending in NL.` (149 chars)
- Current H1: `Douchekop met filter`
- Current headings (H2/H3, first 12): h3: Douchekop met filter – 10 standen; h3: Douchekop met filter en slang – 10 standen
- Current canonical: self (https://www.besjaar.eu/collections/douchekop-met-filter)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,CollectionPage,ContactPoint,ImageObject,ItemList,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 335 words in `<main>`; images 10 (no alt attribute: 0, empty alt in main: 1); inbound internal links: 83
- Current target keywords (observed from title/H1): douchekop met filter
- Existing strengths: Exact-match H1 and title; best on-site explanation of what the filter does and does not do; explains with/without hose; links to refills.
- Existing problems: No links to the filter guides (zin of onzin, hoe werkt, beste douchekop met filter) – the comparison article had only 2 inbound links; no collection image.

**B. Recommended SEO**

- Primary keyword: douchekop met filter
- Secondary keywords: douchekop met filter en slang; handdouche met filter; douchekop filter chloor
- Search intent: Commercial – buy a filtered showerhead
- Proposed SEO title: `Besjaar® | Douchekop met Filter – Met of Zonder Slang` — IMPLEMENTED
- Proposed meta description: `KEEP (already accurate and complete)` — KEEP
- Proposed H1: KEEP: "Douchekop met filter"
- Content changes: ADDED (live): closing paragraph linking "douchefilter: zin of onzin?", "hoe een douchefilter werkt" and the filter comparison.
- Internal links to add: ADDED: 3 guide links (see content).
- Image optimizations: Add a collection image (e.g. the filter-in-handle close-up) with alt "Besjaar douchekop met filter in de handgreep".
- Structured-data changes: Keep.
- Technical changes: —

**C. Implementation**

- Where: Admin › Collections › Douchekop met filter
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Description translations outdated until re-translated.
- Tests: Re-crawled live: OK.
- Priority: **High**

**D. Status:** IMPLEMENTED + verified

### `/collections/shower-filter`

**A. Existing SEO — verified**

- Current title: `Douchefilters & Navulsets – 8-Traps Filtratie | Besjaar` (55 chars)
- Current meta description: `Vervangfilters voor de Besjaar douchekop met filter: houden deeltjes tegen en breken vrij chloor af. 3–5 maanden per filter. Gratis verzending in NL vanaf €25.` (159 chars)
- Current H1: `Douchefilters`
- Current headings (H2/H3, first 12): h3: Vervangfilters – set van 2
- Current canonical: self (https://www.besjaar.eu/collections/shower-filter)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,CollectionPage,ContactPoint,ImageObject,ItemList,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 184 words in `<main>`; images 8 (no alt attribute: 0, empty alt in main: 1); inbound internal links: 83
- Current target keywords (observed from title/H1): douchefilter; vervangfilter douchekop
- Existing strengths: States lifespan (3–5 months), compatibility (only the two filter models) and that the filter does not soften water.
- Existing problems: Thin (184 words) and only 1 product, so it competes with the product page for "vervangfilter"; generic "douchefilter" searchers may expect a universal inline filter – the page must keep saying it only fits Besjaar filter heads.

**B. Recommended SEO**

- Primary keyword: douchefilter
- Secondary keywords: douchefilter navulset; douchefilter cartridge; Besjaar vervangfilters
- Search intent: Commercial – buy refills (existing owners)
- Proposed SEO title: `Besjaar® | Douchefilters & Vervangfilters – 8-Traps` — IMPLEMENTED
- Proposed meta description: `KEEP` — KEEP
- Proposed H1: KEEP: "Douchefilters"
- Content changes: ADDED (live): set contents (2 cartridges) + links to replacement step-by-step, yearly cost article and Besjaar Club (20% member discount – verified active automatic discount).
- Internal links to add: ADDED: douchefilter-vervangen-stappenplan, douchefilter-kosten-per-jaar, /pages/besjaar-club.
- Image optimizations: OK.
- Structured-data changes: Keep.
- Technical changes: —

**C. Implementation**

- Where: Admin › Collections › Douchefilters
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: Re-crawled live: OK.
- Priority: **Medium**

**D. Status:** IMPLEMENTED + verified

## Products

### `/products/besjaar-hoge-druk-douchekop-met-filter-model-1002025-10-sproeistanden-waterbesparende-zilver`

**A. Existing SEO — verified**

- Current title: `Douchekop met Filter – 10 Standen, Hoge Druk | Besjaar` (54 chars)
- Current meta description: `Douchekop met ingebouwd 8-traps filter: houdt deeltjes tegen en breekt vrij chloor af. 10 standen, pauzeknop, G½-aansluiting. Gratis verzending in NL.` (150 chars)
- Current H1: `Douchekop met filter – 10 standen`
- Current headings (H2/H3, first 12): h2: Wat je merkt; h2: In de doos; h2: Specificaties; h2: Echte klanten, echte douches.; h2: Gefilterd, krachtig en slim.; h3: 8-traps filter; h3: 8 wellness + 2 PowerWash; h3: Pauzeknop; h3: G½-aansluiting; h2: Klantbeoordelingen; h2: Recent bekeken; h2: Publieke klantsignalen, mét bron.
- Current canonical: self (https://www.besjaar.eu/products/besjaar-hoge-druk-douchekop-met-filter-model-1002025-10-sproeistanden-waterbesparende-zilver)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPoint,DefinedRegion,ImageObject,ListItem,MemberProgram,MemberProgramTier,MerchantReturnPolicy,MonetaryAmount,Offer,OfferShippingDetails,Organization,PostalAddress,Product,ProductGroup,QuantitativeValue,ShippingDeliveryTime,WebPage,WebSite
- Content: 1683 words in `<main>`; images 22 (no alt attribute: 2, empty alt in main: 4); inbound internal links: 87
- Current target keywords (observed from title/H1): douchekop met filter 10 standen
- Existing strengths: Accurate filter claims; GTIN 8720726284516; 9 images with descriptive file names and alt text; specs incl. model 1002025.
- Existing problems: Lede paragraph identical to the "met slang" product (duplicate copy); never said explicitly that a hose is NOT included; no link to refills; gallery contains the photo of the version WITH hose; 2 video posters without alt; mobile LCP 6.6 s (lab).

**B. Recommended SEO**

- Primary keyword: douchekop met filter 10 standen
- Secondary keywords: handdouche met filter; hoge druk douchekop met filter; douchekop met filter zonder slang
- Search intent: Transactional – specific model
- Proposed SEO title: `Besjaar® | Douchekop met Filter – 10 Standen, Zonder Slang` — IMPLEMENTED
- Proposed meta description: `Douchekop met 8-traps filter en 10 standen, zonder slang: past op je eigen G½-doucheslang. Met pauzeknop en vervangbaar filter. Gratis verzending in NL.` — IMPLEMENTED
- Proposed H1: KEEP: "Douchekop met filter – 10 standen"
- Content changes: ADDED (live): lede starts "Deze douchekop komt zonder slang…"; spec row "Slang: Niet inbegrepen, past op je eigen G½-slang"; closing line linking refills (set van 2) and the "met slang" version.
- Internal links to add: ADDED: /products/besjaar-douchefilter; /products/…met-slang…filter…
- Image optimizations: Video alt added (2 files). Recommend removing or relabelling the "met filter en slang" photo in this gallery.
- Structured-data changes: Keep Shopify ProductGroup + Offer with shippingDetails/returnPolicy (verified values match checkout: NL €2,99 / free ≥ €25; BE-DE-FR-ES €2,99 / free ≥ €30). No aggregateRating is emitted – correct, because most on-site reviews were imported from bol.com.
- Technical changes: Preload/size the main gallery image for mobile (LCP).

**C. Implementation**

- Where: Admin › Products › [product] › Search engine listing + Description
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Description translations (EN/DE/FR/ES) marked outdated – re-translate the added sentences.
- Tests: Re-crawled live 2026-11-07 19:20 UTC: new title/description/copy present, canonical self, index,follow, no Liquid errors.
- Priority: **High**

**D. Status:** IMPLEMENTED + verified

### `/products/besjaar-douchekop-met-slang-hoge-druk-met-filter-10-sproeistanden-regendouche-waterbesparende-handdouche-zilver`

**A. Existing SEO — verified**

- Current title: `Douchekop met Filter en Slang – 10 Standen | Besjaar` (52 chars)
- Current meta description: `Douchekop met 8-traps filter, 10 standen en 1,5 m slang in één set. Houdt deeltjes tegen, breekt vrij chloor af. Gratis verzending in NL, 30 dagen retour.` (154 chars)
- Current H1: `Douchekop met filter en slang – 10 standen`
- Current headings (H2/H3, first 12): h2: Wat je merkt; h2: In de doos; h2: Specificaties; h2: Echte klanten, echte douches.; h2: Gefilterd, krachtig en slim.; h3: 8-traps filter; h3: 8 wellness + 2 PowerWash; h3: Pauzeknop; h3: Doucheslang 1,5 m; h2: Klantbeoordelingen; h2: Recent bekeken; h2: Publieke klantsignalen, mét bron.
- Current canonical: self (https://www.besjaar.eu/products/besjaar-douchekop-met-slang-hoge-druk-met-filter-10-sproeistanden-regendouche-waterbesparende-handdouche-zilver)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPoint,DefinedRegion,ImageObject,ListItem,MemberProgram,MemberProgramTier,MerchantReturnPolicy,MonetaryAmount,Offer,OfferShippingDetails,Organization,PostalAddress,Product,ProductGroup,QuantitativeValue,ShippingDeliveryTime,WebPage,WebSite
- Content: 1443 words in `<main>`; images 21 (no alt attribute: 2, empty alt in main: 4); inbound internal links: 87
- Current target keywords (observed from title/H1): douchekop met filter en slang
- Existing strengths: Accurate; box contents list hose, tape, 2 seals, manual; GTIN present.
- Existing problems: Opening copy identical to the no-hose model; did not explain the difference; no link back to the cheaper no-hose model.

**B. Recommended SEO**

- Primary keyword: douchekop met filter en slang
- Secondary keywords: douchekop 10 standen met slang; complete doucheset met filter; douchekop hoge druk met slang
- Search intent: Transactional – complete set
- Proposed SEO title: `Besjaar® | Douchekop met Filter en Slang – 10 Standen` — IMPLEMENTED
- Proposed meta description: `Complete set: douchekop met 8-traps filter en 10 standen, 1,5 m doucheslang, afdichtringen en teflontape. Breekt vrij chloor af. Gratis verzending in NL.` — IMPLEMENTED
- Proposed H1: KEEP: "Douchekop met filter en slang – 10 standen"
- Content changes: ADDED (live): lede "Dit is de Besjaar douchekop met filter als complete set: met een doucheslang van 1,5 meter, twee afdichtringen en teflontape…"; closing line linking the no-hose model and refills.
- Internal links to add: ADDED: no-hose model; refills.
- Image optimizations: OK (shares gallery with the no-hose model, correct for this product).
- Structured-data changes: Keep Shopify ProductGroup + Offer with shippingDetails/returnPolicy (verified values match checkout: NL €2,99 / free ≥ €25; BE-DE-FR-ES €2,99 / free ≥ €30). No aggregateRating is emitted – correct, because most on-site reviews were imported from bol.com.
- Technical changes: —

**C. Implementation**

- Where: Admin › Products › [product] › Search engine listing + Description
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Description translations (EN/DE/FR/ES) marked outdated – re-translate the added sentences.
- Tests: Re-crawled live 2026-11-07 19:20 UTC: new title/description/copy present, canonical self, index,follow, no Liquid errors.
- Priority: **High**

**D. Status:** IMPLEMENTED + verified

### `/products/besjaar-douchekop-3-sproeistanden-hoge-druk-luxe-moderne-handdouche-chrome`

**A. Existing SEO — verified**

- Current title: `Douchekop 3 Standen – Waterbesparend, Hoge Druk | Besjaar` (57 chars)
- Current meta description: `Douchekop met 3 standen (regen, massage, power) en een volle straal bij max. 8 l/min. Past op vrijwel elke G½-slang, zonder gereedschap. 30 dagen retour.` (153 chars)
- Current H1: `Douchekop met 3 standen – chroom`
- Current headings (H2/H3, first 12): h2: Wat je merkt; h2: In de doos; h2: Specificaties; h2: Een volle straal, elke dag.; h3: Max. 8 liter per minuut; h3: 3 standen; h3: Extra brede kop van 13 cm; h3: Siliconen sproeiers; h2: Klantbeoordelingen; h2: Recent bekeken; h2: Publieke klantsignalen, mét bron.; h2: Upgrade de douche die je elke dag gebruikt.
- Current canonical: self (https://www.besjaar.eu/products/besjaar-douchekop-3-sproeistanden-hoge-druk-luxe-moderne-handdouche-chrome)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPoint,DefinedRegion,ImageObject,ListItem,MemberProgram,MemberProgramTier,MerchantReturnPolicy,MonetaryAmount,Offer,OfferShippingDetails,Organization,PostalAddress,Product,QuantitativeValue,ShippingDeliveryTime,WebPage,WebSite
- Content: 1211 words in `<main>`; images 20 (no alt attribute: 0, empty alt in main: 4); inbound internal links: 87
- Current target keywords (observed from title/H1): douchekop 3 standen
- Existing strengths: Clear 3 modes, 13 cm, max. 8 l/min, chrome; 145 reviews shown (Judge.me, mostly imported from bol.com – disclosed on /pages/reviews).
- Existing problems: Spec table lacked the connection (G½) and did not say hose/filter are not included. "Waterbesparend" at max. 8 l/min conflicts with the Milieu Centraal threshold (≤ 7,2 l/min) cited in the store's own guides – see Deliverable 4, claim C2.

**B. Recommended SEO**

- Primary keyword: douchekop 3 standen
- Secondary keywords: waterbesparende handdouche; douchekop chroom; douchekop zonder slang
- Search intent: Transactional – entry model
- Proposed SEO title: `Besjaar® | Waterbesparende Douchekop – 3 Standen` — IMPLEMENTED
- Proposed meta description: `Douchekop met 3 standen (regen, massage, power) en een volle straal bij max. 8 l/min. Zonder slang of filter: past op je eigen G½-slang. 30 dagen retour.` — IMPLEMENTED
- Proposed H1: KEEP: "Douchekop met 3 standen – chroom"
- Content changes: ADDED (live): spec rows "Aansluiting: Universeel G½, past op elke standaard doucheslang" and "Slang en filter: Niet inbegrepen".
- Internal links to add: Existing link to filter model kept.
- Image optimizations: OK.
- Structured-data changes: Keep Shopify ProductGroup + Offer with shippingDetails/returnPolicy (verified values match checkout: NL €2,99 / free ≥ €25; BE-DE-FR-ES €2,99 / free ≥ €30). No aggregateRating is emitted – correct, because most on-site reviews were imported from bol.com.
- Technical changes: —

**C. Implementation**

- Where: Admin › Products › [product] › Search engine listing + Description
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Description translations (EN/DE/FR/ES) marked outdated – re-translate the added sentences.
- Tests: Re-crawled live 2026-11-07 19:20 UTC: new title/description/copy present, canonical self, index,follow, no Liquid errors.
- Priority: **High**

**D. Status:** IMPLEMENTED + verified

### `/products/besjaar-douchekop-met-slang-handdouche-met-3-sproeistanden-regendouche-hoge-druk-chromen-douchekop`

**A. Existing SEO — verified**

- Current title: `Douchekop met Slang 1,5 m – 3 Standen, Chroom | Besjaar` (55 chars)
- Current meta description: `Complete set: douchekop met 3 standen en 1,5 m anti-draai slang. Volle straal bij max. 8 l/min, handvast te monteren. Gratis verzending in NL.` (142 chars)
- Current H1: `Douchekop met slang – 3 standen`
- Current headings (H2/H3, first 12): h2: Wat je merkt; h2: In de doos; h2: Specificaties; h2: Een volle straal, elke dag.; h3: Max. 8 liter per minuut; h3: 3 standen; h3: Extra brede kop van 13 cm; h3: 1,5 m flexibele slang; h2: Klantbeoordelingen; h2: Recent bekeken; h2: Publieke klantsignalen, mét bron.; h2: Upgrade de douche die je elke dag gebruikt.
- Current canonical: self (https://www.besjaar.eu/products/besjaar-douchekop-met-slang-handdouche-met-3-sproeistanden-regendouche-hoge-druk-chromen-douchekop)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPoint,DefinedRegion,ImageObject,ListItem,MemberProgram,MemberProgramTier,MerchantReturnPolicy,MonetaryAmount,Offer,OfferShippingDetails,Organization,PostalAddress,Product,QuantitativeValue,ShippingDeliveryTime,WebPage,WebSite
- Content: 1397 words in `<main>`; images 18 (no alt attribute: 0, empty alt in main: 4); inbound internal links: 87
- Current target keywords (observed from title/H1): douchekop met slang
- Existing strengths: Box contents explicit (head, 1,5 m hose, 2 seals, flow part); 153 reviews.
- Existing problems: Not differentiated from the filtered set (no "zonder filter"); no connection spec.

**B. Recommended SEO**

- Primary keyword: douchekop met slang
- Secondary keywords: douchekop met slang 1,5 meter; handdouche met slang; waterbesparende douchekop met slang
- Search intent: Transactional – complete set without filter
- Proposed SEO title: `Besjaar® | Douchekop met Slang 1,5 m – 3 Standen` — IMPLEMENTED
- Proposed meta description: `Complete set: douchekop met 3 standen, 1,5 m anti-draai slang en afdichtingen. Max. 8 l/min, montage zonder gereedschap. Zonder filter. Gratis verzending in NL.` — IMPLEMENTED
- Proposed H1: KEEP: "Douchekop met slang – 3 standen"
- Content changes: ADDED (live): spec rows "Aansluiting: Universeel G½" and "Filter: Niet inbegrepen"; line linking the filtered set.
- Internal links to add: ADDED: filtered set.
- Image optimizations: OK.
- Structured-data changes: Keep Shopify ProductGroup + Offer with shippingDetails/returnPolicy (verified values match checkout: NL €2,99 / free ≥ €25; BE-DE-FR-ES €2,99 / free ≥ €30). No aggregateRating is emitted – correct, because most on-site reviews were imported from bol.com.
- Technical changes: —

**C. Implementation**

- Where: Admin › Products › [product] › Search engine listing + Description
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Description translations (EN/DE/FR/ES) marked outdated – re-translate the added sentences.
- Tests: Re-crawled live 2026-11-07 19:20 UTC: new title/description/copy present, canonical self, index,follow, no Liquid errors.
- Priority: **High**

**D. Status:** IMPLEMENTED + verified

### `/products/besjaar-doucheslang-150-cm-chroom`

**A. Existing SEO — verified**

- Current title: `Doucheslang 1,5 m – Universeel ½", Anti-Draai | Besjaar` (55 chars)
- Current meta description: `Doucheslang van 1,5 m met anti-draai en universele ½"-aansluiting aan beide kanten. Past op vrijwel elke handdouche, ook op Besjaar met filter.` (143 chars)
- Current H1: `Doucheslang 1,5 m – universeel ½"`
- Current headings (H2/H3, first 12): h2: Wat je merkt; h2: In de doos; h2: Specificaties; h2: Een volle straal, elke dag.; h3: Max. 8 liter per minuut; h3: 3 standen; h3: Extra brede kop van 13 cm; h3: Siliconen sproeiers; h2: Klantbeoordelingen; h2: Recent bekeken; h2: Publieke klantsignalen, mét bron.; h2: Upgrade de douche die je elke dag gebruikt.
- Current canonical: self (https://www.besjaar.eu/products/besjaar-doucheslang-150-cm-chroom)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPoint,DefinedRegion,ImageObject,ListItem,MemberProgram,MemberProgramTier,MerchantReturnPolicy,MonetaryAmount,Offer,OfferShippingDetails,Organization,PostalAddress,Product,QuantitativeValue,ShippingDeliveryTime,WebPage,WebSite
- Content: 543 words in `<main>`; images 14 (no alt attribute: 0, empty alt in main: 2); inbound internal links: 83
- Current target keywords (observed from title/H1): doucheslang 150 cm
- Existing strengths: Already states "Douchekop niet inbegrepen" in copy and image alt; compatibility (½"/G½ both ends).
- Existing problems: 0 reviews; no GTIN verified in schema (check barcode); title used "1,5 m" only – "150 cm" is the other common query form (now in title).

**B. Recommended SEO**

- Primary keyword: doucheslang 150 cm
- Secondary keywords: doucheslang 1,5 meter; universele doucheslang; anti draai doucheslang
- Search intent: Transactional – replacement part
- Proposed SEO title: `Besjaar® | Doucheslang 150 cm – Universeel ½", Anti-Draai` — IMPLEMENTED
- Proposed meta description: `Doucheslang van 150 cm met anti-draai en universele ½"-aansluiting aan beide kanten. Past op vrijwel elke handdouche en kraan. Douchekop niet inbegrepen.` — IMPLEMENTED
- Proposed H1: KEEP: "Doucheslang 1,5 m – universeel ½""
- Content changes: None needed.
- Internal links to add: Add from guide doucheslang-kiezen translations (EN/DE/FR/ES lack the product link).
- Image optimizations: OK.
- Structured-data changes: Keep Shopify ProductGroup + Offer with shippingDetails/returnPolicy (verified values match checkout: NL €2,99 / free ≥ €25; BE-DE-FR-ES €2,99 / free ≥ €30). No aggregateRating is emitted – correct, because most on-site reviews were imported from bol.com.
- Technical changes: Add barcode (GTIN) in Admin if the hose has one.

**C. Implementation**

- Where: Admin › Products › [product] › Search engine listing + Description
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Description translations (EN/DE/FR/ES) marked outdated – re-translate the added sentences.
- Tests: Re-crawled live 2026-11-07 19:20 UTC: new title/description/copy present, canonical self, index,follow, no Liquid errors.
- Priority: **Medium**

**D. Status:** IMPLEMENTED + verified

### `/products/besjaar-douchefilter`

**A. Existing SEO — verified**

- Current title: `Vervangfilters Douchekop met Filter – Set van 2 | Besjaar` (57 chars)
- Current meta description: `2 vervangfilters voor de Besjaar douchekop met filter: samen tot 10 maanden gebruik. Wisselen zonder gereedschap. Gratis verzending in NL vanaf €25.` (148 chars)
- Current H1: `Vervangfilters – set van 2`
- Current headings (H2/H3, first 12): h2: Wat je merkt; h2: In de doos; h2: Specificaties; h2: Vers filter, zo gewisseld.; h3: 8-traps filtratie; h3: Warm én koud water; h3: 3–5 maanden per filter; h3: Wisselen zonder gereedschap; h2: Klantbeoordelingen; h2: Recent bekeken; h2: Publieke klantsignalen, mét bron.; h2: Upgrade de douche die je elke dag gebruikt.
- Current canonical: self (https://www.besjaar.eu/products/besjaar-douchefilter)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPoint,DefinedRegion,ImageObject,ListItem,MemberProgram,MemberProgramTier,MerchantReturnPolicy,MonetaryAmount,Offer,OfferShippingDetails,Organization,PostalAddress,Product,QuantitativeValue,ShippingDeliveryTime,UnitPriceSpecification,WebPage,WebSite
- Content: 619 words in `<main>`; images 18 (no alt attribute: 0, empty alt in main: 2); inbound internal links: 27
- Current target keywords (observed from title/H1): vervangfilter douchekop
- Existing strengths: Explicit compatibility ("Niet geschikt voor andere douchekoppen"); explicit "maakt water niet zachter"; custom.introduction metafield set.
- Existing problems: Old description promised "Gratis verzending in NL vanaf €25" on a €9,99 item – true, but the compatibility restriction is more important for the snippet; only 1 review.

**B. Recommended SEO**

- Primary keyword: vervangfilter douchekop
- Secondary keywords: douchefilter navulset; douchefilter cartridge; Besjaar vervangfilters
- Search intent: Transactional – refill for owners
- Proposed SEO title: `Besjaar® | Vervangfilters Douchekop – Set van 2` — IMPLEMENTED
- Proposed meta description: `2 vervangfilters, alleen voor de Besjaar douchekop met filter (10 standen). 3–5 maanden per filter, wisselen zonder gereedschap. Breekt vrij chloor af.` — IMPLEMENTED
- Proposed H1: KEEP: "Vervangfilters – set van 2"
- Content changes: None (copy already accurate).
- Internal links to add: Link the step-by-step guide from the product page (product FAQ snippet) – recommended.
- Image optimizations: Alt text descriptive; image 8 alt mentions model 1002026.
- Structured-data changes: Keep Shopify ProductGroup + Offer with shippingDetails/returnPolicy (verified values match checkout: NL €2,99 / free ≥ €25; BE-DE-FR-ES €2,99 / free ≥ €30). No aggregateRating is emitted – correct, because most on-site reviews were imported from bol.com.
- Technical changes: —

**C. Implementation**

- Where: Admin › Products › [product] › Search engine listing + Description
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Description translations (EN/DE/FR/ES) marked outdated – re-translate the added sentences.
- Tests: Re-crawled live 2026-11-07 19:20 UTC: new title/description/copy present, canonical self, index,follow, no Liquid errors.
- Priority: **High**

**D. Status:** IMPLEMENTED + verified

## Brand, trust and support pages

### `/pages/about-us`

**A. Existing SEO — verified**

- Current title: `Over Besjaar | Douchekoppen, Douchefilters & Service` (52 chars)
- Current meta description: `Besjaar is de officiële webshop voor douchekoppen met filter en douchefilters. Ontworpen in Assen: hoge druk, max. 8 liter per minuut, eerlijk advies.` (150 chars)
- Current H1: `Douchekoppen. Eén duidelijkere keuze.`
- Current headings (H2/H3, first 12): h2: Gericht assortiment; h2: Duidelijk vóór aankoop; h2: Service na checkout; h2: Minder producten. Betere keuzes.; h2: Alles ondersteunt de keuze van je douchekop.; h2: Een douchekop kopen moet eenvoudig voelen.; h2: Besjaar, kort uitgelegd
- Current canonical: self (https://www.besjaar.eu/pages/about-us)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: AboutPage,Answer,Brand,BreadcrumbList,ContactPoint,FAQPage,ImageObject,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,Question,WebSite
- Content: 409 words in `<main>`; images 5 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): over Besjaar; Besjaar merk
- Existing strengths: Good title; page body in Admin is strong (Assen, honest filter statement, link to guide).
- Existing problems: The Admin body is NOT rendered: the template shows generic copy ("Besjaar beweegt weg van een brede algemene webshop…") instead. The H1 does not mention the brand. No company identity (Univex B.V., KvK) in the visible text.

**B. Recommended SEO**

- Primary keyword: over Besjaar
- Secondary keywords: Besjaar Assen; Univex
- Search intent: Brand / trust
- Proposed SEO title: `KEEP: Over Besjaar | Douchekoppen, Douchefilters & Service` — KEEP
- Proposed meta description: `KEEP` — KEEP
- Proposed H1: Over Besjaar: douchekoppen uit Assen (current: "Douchekoppen. Eén duidelijkere keuze.")
- Content changes: Render page.content in the about template (sections/main-page.liquid about variant) above the generic tiles, or replace the tiles copy with the Admin body. Add "Besjaar is een merk van Univex B.V., Dr. A.F. Philipsweg 39 A, Assen (KvK 97438650)" once the address question (see Deliverable 4, C5) is resolved.
- Internal links to add: → /pages/reviews, /blogs/gids/is-besjaar-betrouwbaar, /pages/contact-us.
- Image optimizations: —
- Structured-data changes: AboutPage is optional; keep Organization.
- Technical changes: Theme change (main-page.liquid / locale nl.json key for the H1).

**C. Implementation**

- Where: Theme code (main-page.liquid) + locales
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: Preview about page on mobile/desktop.
- Priority: **Medium**

**D. Status:** RECOMMENDED

### `/pages/faqs`

**A. Existing SEO — verified**

- Current title: `Besjaar FAQ | Douchekoppen, Filters, Levering & Retouren` (56 chars)
- Current meta description: `Veelgestelde vragen over Besjaar douchekoppen en douchefilters: montage, filters vervangen, verzending en retourneren.` (118 chars)
- Current H1: `Veelgestelde vragen over Besjaar douchekoppen`
- Current headings (H2/H3, first 12): h2: Je douchekop kiezen en passend maken; h2: Bezorging, retouren & bestellingen; h2: Filters, onderhoud & hulp
- Current canonical: self (https://www.besjaar.eu/pages/faqs)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPoint,ImageObject,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebPage,WebSite
- Content: 612 words in `<main>`; images 5 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): Besjaar veelgestelde vragen
- Existing strengths: Template-driven FAQ with concrete answers (30 dagen, €25/€2,99, 16:00, G½, 3–5 maanden).
- Existing problems: The Admin page body (generic, formal "u", "Absoluut!") is stored but not the visible content – fine, but keep it out of sync risk: delete or align it. No FAQPage markup (correct: FAQ rich results are limited to authoritative gov/health sites since 2023).

**B. Recommended SEO**

- Primary keyword: Besjaar veelgestelde vragen
- Secondary keywords: douchekop vragen; levering; retour
- Search intent: Support
- Proposed SEO title: `KEEP: Besjaar FAQ | Douchekoppen, Filters, Levering & Retouren` — KEEP
- Proposed meta description: `KEEP` — KEEP
- Proposed H1: KEEP
- Content changes: Align Admin body with the template or empty it to avoid confusion.
- Internal links to add: → /blogs/news/besjaar-douchekop-veelgestelde-vragen (brand FAQ) and vice versa.
- Image optimizations: —
- Structured-data changes: Do not add FAQPage expecting rich results.
- Technical changes: —

**C. Implementation**

- Where: Admin › Pages › Veelgestelde vragen
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: —
- Priority: **Low**

**D. Status:** RECOMMENDED

### `/pages/contact-us`

**A. Existing SEO — verified**

- Current title: `Contact Besjaar | Productadvies & Klantenservice` (48 chars)
- Current meta description: `Neem contact op met Besjaar. Vragen over je bestelling, douchekop of douchefilter? De officiële Besjaar klantenservice helpt je snel verder.` (140 chars)
- Current H1: `Contact Besjaar`
- Current headings (H2/H3, first 12): h2: Sneller iets regelen?
- Current canonical: self (https://www.besjaar.eu/pages/contact-us)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPage,ContactPoint,ImageObject,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 93 words in `<main>`; images 5 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): Besjaar contact
- Existing strengths: Email, phone, response time (1–2 werkdagen), company line with Univex B.V., address and KvK visible.
- Existing problems: Address shown (Dr. A.F. Philipsweg 39 A, 9403 AD) differs from the Legal notice policy (Elbestraat 113, 9406 SV) – see C5. Intro uses "u" while the rest of the site uses "je".

**B. Recommended SEO**

- Primary keyword: Besjaar contact
- Secondary keywords: Besjaar klantenservice
- Search intent: Support / navigational
- Proposed SEO title: `KEEP: Contact Besjaar | Productadvies & Klantenservice` — KEEP
- Proposed meta description: `KEEP` — KEEP
- Proposed H1: KEEP: "Contact Besjaar"
- Content changes: After C5 is resolved, show "Retouradres" separately if Elbestraat is the warehouse.
- Internal links to add: —
- Image optimizations: —
- Structured-data changes: ContactPoint in Organization already present.
- Technical changes: —

**C. Implementation**

- Where: Admin › Pages › contact-us (body) / theme main-contact
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: —
- Priority: **Medium**

**D. Status:** RECOMMENDED

### `/pages/reviews`

**A. Existing SEO — verified**

- Current title: `Klantbeoordelingen — Besjaar douchekoppen en douchefilters` (58 chars)
- Current meta description: `Waar de beoordelingen van Besjaar vandaan komen: per product op deze website en openbaar op Bol.com. Lees hoe kopers de douchekoppen en douchefilters ervaren.` (158 chars)
- Current H1: `Klantbeoordelingen`
- Current headings (H2/H3, first 12): h2: Beoordelingen per product; h2: Openbare beoordelingen op Bol.com; h2: Zelf een beoordeling achterlaten; h2: Waarom u niet alles bij ons leest
- Current canonical: self (https://www.besjaar.eu/pages/reviews)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPoint,ImageObject,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebPage,WebSite
- Content: 312 words in `<main>`; images 5 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): Besjaar reviews; Besjaar ervaringen
- Existing strengths: Transparent about review origin (imported from bol.com) – required under EU Omnibus rules; no review markup.
- Existing problems: Formal "u" register; linked to noindexed /collections/all; did not link the "Is Besjaar betrouwbaar?" guide or the Trustpilot article.

**B. Recommended SEO**

- Primary keyword: Besjaar reviews
- Secondary keywords: Besjaar beoordelingen
- Search intent: Brand / trust
- Proposed SEO title: `Besjaar® | Reviews & Ervaringen met Douchekoppen` — IMPLEMENTED
- Proposed meta description: `KEEP` — KEEP
- Proposed H1: KEEP: "Klantbeoordelingen"
- Content changes: DONE (live): "u" → "je"; link to /collections/showerhead; links to Trustpilot article and is-besjaar-betrouwbaar.
- Internal links to add: ADDED: see content.
- Image optimizations: —
- Structured-data changes: Do not add AggregateRating built from imported reviews.
- Technical changes: —

**C. Implementation**

- Where: Admin › Pages › Klantbeoordelingen
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Body translations outdated.
- Tests: Re-crawled live: OK.
- Priority: **Medium**

**D. Status:** IMPLEMENTED + verified

### `/pages/zakelijk`

**A. Existing SEO — verified**

- Current title: `Zakelijk bestellen bij Besjaar | Grotere aantallen & B2B` (56 chars)
- Current meta description: `Zakelijk bestellen bij Besjaar: douchekoppen met filter en douchefilters voor bedrijven en projecten. Neem contact op voor de mogelijkheden.` (140 chars)
- Current H1: `BESJAAR zakelijk: douchekoppen in grotere aantallen.`
- Current headings (H2/H3, first 12): h2: Duidelijk inkopen, zonder ingewikkeld proces.; h3: Prijs op volume; h3: Zakelijke factuur; h3: Levering afstemmen; h3: Persoonlijk contact; h2: Klaar om zakelijk te bestellen?; h2: Vertel ons wat je nodig hebt.
- Current canonical: self (https://www.besjaar.eu/pages/zakelijk)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPoint,ImageObject,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebPage,WebSite
- Content: 284 words in `<main>`; images 6 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): douchekoppen zakelijk bestellen; douchekoppen groothandel
- Existing strengths: Clear H1 with "douchekoppen", form.
- Existing problems: Only 1 inbound link from main content.

**B. Recommended SEO**

- Primary keyword: douchekoppen zakelijk bestellen
- Secondary keywords: B2B douchekoppen
- Search intent: B2B lead
- Proposed SEO title: `KEEP` — KEEP
- Proposed meta description: `KEEP` — KEEP
- Proposed H1: KEEP
- Content changes: —
- Internal links to add: Link from footer (already) and from about page.
- Image optimizations: —
- Structured-data changes: —
- Technical changes: —

**C. Implementation**

- Where: —
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: —
- Tests: —
- Priority: **Low**

**D. Status:** RECOMMENDED

### `/pages/besjaar-club`

**A. Existing SEO — verified**

- Current title: `Besjaar Club | Gratis lid, 20% korting op vervangfilters` (56 chars)
- Current meta description: `Word gratis lid van de Besjaar Club: eenmalig 20% welkomstkorting en 20% korting op elke set vervangfilters. Geen punten, geen abonnement.` (138 chars)
- Current H1: `Besjaar Club Gratis lid. Voordeel bij elke navulset.`
- Current headings (H2/H3, first 12): h2: Wat je als lid krijgt.; h3: Welkomstkorting; h3: Ledenprijs op elke set vervangfilters; h3: Bestellingen en track & trace op één plek; h2: In drie stappen lid.; h3: Log in met je e-mail; h3: Je ledenprijs staat klaar; h3: Gebruik je welkomstcode; h2: Een vers filter, precies op tijd.; h3: Zet een herinnering in je agenda; h2: Altijd inbegrepen, lid of niet.; h2: Goed om te weten.
- Current canonical: self (https://www.besjaar.eu/pages/besjaar-club)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPoint,ImageObject,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebPage,WebSite
- Content: 670 words in `<main>`; images 6 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): Besjaar Club
- Existing strengths: Brand-first title; MemberProgram schema.
- Existing problems: —

**B. Recommended SEO**

- Primary keyword: Besjaar Club
- Secondary keywords: korting vervangfilters
- Search intent: Loyalty
- Proposed SEO title: `KEEP` — KEEP
- Proposed meta description: `KEEP` — KEEP
- Proposed H1: KEEP
- Content changes: —
- Internal links to add: Now linked from /collections/shower-filter.
- Image optimizations: —
- Structured-data changes: Keep MemberProgram.
- Technical changes: —

**C. Implementation**

- Where: —
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: —
- Tests: —
- Priority: **Low**

**D. Status:** KEEP

### `/pages/track-order`

**A. Existing SEO — verified**

- Current title: `Bestelling volgen – Track & Trace | Besjaar` (43 chars)
- Current meta description: `Volg je Besjaar-bestelling met de track & trace-code uit je verzendmail of via je account. Plus levertijden en hulp als je pakket niet aankomt.` (143 chars)
- Current H1: `Volg je bestelling`
- Current headings (H2/H3, first 12): h2: Via de verzendmail; h2: Via je account; h2: Wanneer komt mijn pakket?; h2: Besteld via bol.com?; h2: Hulp nodig?
- Current canonical: self (https://www.besjaar.eu/pages/track-order)
- Current robots: `noindex,follow,max-image-preview:large`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Brand,BreadcrumbList,ContactPoint,ImageObject,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebPage,WebSite
- Content: 160 words in `<main>`; images 5 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): — (utility, noindex)
- Existing strengths: Correctly noindex,follow.
- Existing problems: Listed in sitemap while noindex (Shopify adds all published pages). Harmless; could set seo.hidden=1 to also drop it from the sitemap.

**B. Recommended SEO**

- Primary keyword: — (utility, noindex)
- Secondary keywords: —
- Search intent: Utility
- Proposed SEO title: `KEEP` — KEEP
- Proposed meta description: `KEEP` — KEEP
- Proposed H1: KEEP
- Content changes: —
- Internal links to add: —
- Image optimizations: —
- Structured-data changes: —
- Technical changes: Optional: metafield seo.hidden = 1.

**C. Implementation**

- Where: Admin › Pages › Bestelling volgen
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: —
- Priority: **Low**

**D. Status:** RECOMMENDED

## Blog indexes

### `/blogs/gids`

**A. Existing SEO — verified**

- Current title: `Gids: douchekop & douchefilter tips | Besjaar` (45 chars)
- Current meta description: `Praktische gidsen over douchekoppen en douchefilters: kalkaanslag verwijderen, water besparen, een douchekop vervangen en of een douchefilter zin heeft.` (152 chars)
- Current H1: `Gids`
- Current headings (H2/H3, first 12): h2: Douchekop met filter in Duitsland: kalk, chloor en wat je echt nodig hebt; h2: Douchekop met filter in Frankrijk: kalk en chloor in Frans kraanwater; h2: Douchekop met filter in Spanje: kalk en chloor in Spaans kraanwater; h2: Douchen met een boiler of warmtepomp: hoe lang heb je warm water?; h2: Wanneer is je douchekop aan vervanging toe? Signalen, levensduur en weggooien; h2: Douche-woordenboek: 27 begrippen van G½ tot volumestroomklasse; h2: Regendouche of handdouche: wat past bij jou?; h2: Douchekop met filter in België: kalk, chloor en wat je echt nodig hebt; h2: Is Besjaar betrouwbaar? Ervaringen, reviews en garantie; h2: Beste douchekop met filter 2026: eerlijk vergeleken; h2: Hoge waterdruk thuis? Zo kies en gebruik je de juiste douchekop; h2: Douchekop bij lage waterdruk: zo kies je er een die wél lekker doucht
- Current canonical: self (https://www.besjaar.eu/blogs/gids)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Blog,BlogPosting,Brand,BreadcrumbList,ContactPoint,ImageObject,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 451 words in `<main>`; images 17 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): douchekop advies; douchefilter gids
- Existing strengths: 35 articles, good intro, Blog JSON-LD.
- Existing problems: Blog tag pages (/blogs/gids/tagged/…) were indexable and copied this description.

**B. Recommended SEO**

- Primary keyword: douchekop advies
- Secondary keywords: douche tips
- Search intent: Informational hub
- Proposed SEO title: `Besjaar® | Gids: Douchekop & Douchefilter Advies` — IMPLEMENTED
- Proposed meta description: `KEEP` — KEEP
- Proposed H1: KEEP: "Gids"
- Content changes: —
- Internal links to add: —
- Image optimizations: —
- Structured-data changes: Keep.
- Technical changes: Tag pages noindex (preview theme).

**C. Implementation**

- Where: Admin › Blogs › Gids; theme meta-tags.liquid
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: Preview verified: /blogs/gids/tagged/douchefilter → noindex,follow.
- Priority: **Medium**

**D. Status:** IMPLEMENTED (title) / PREVIEW (tag noindex)

### `/blogs/news`

**A. Existing SEO — verified**

- Current title: `Nieuws: douchekoppen, acties en tips | Besjaar` (46 chars)
- Current meta description: `Nieuws van Besjaar: nieuwe douchekoppen en filters, acties en praktische tips voor een betere douche met minder water.` (118 chars)
- Current H1: `Nieuws`
- Current headings (H2/H3, first 12): h2: Besjaar douchekoppen vergeleken: twee designs, hetzelfde verfrissende douchegevoel; h2: Besjaar staat nu op Trustpilot: deel je ervaring met onze webshop; h2: Nieuw in de Besjaar Gids: zeven praktische artikelen; h2: Gas is duurder geworden: zo houd je je douche betaalbaar deze winter; h2: Terug van vakantie: zo spoel je je douche door en houd je de kop schoon; h2: Een douchekop cadeau geven: 5 ideeën voor Sinterklaas en kerst; h2: Hond wassen onder de douche: zo doe je het stap voor stap; h2: Besjaar Club: gratis lid en 20% korting op elke set vervangfilters; h2: Besjaar kopen: in de webshop of op Bol.com? Dit is het verschil; h2: Besjaar-douchekop: de 10 meest gestelde vragen; h2: Welke Besjaar-douchekop past bij jou? Het hele assortiment vergeleken; h2: Wat is Besjaar? Het Nederlandse merk voor douchekoppen met filter
- Current canonical: self (https://www.besjaar.eu/blogs/news)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: yes
- Current schema types: Blog,BlogPosting,Brand,BreadcrumbList,ContactPoint,ImageObject,ListItem,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 440 words in `<main>`; images 17 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): douchetips; Besjaar nieuws
- Existing strengths: Distinct purpose from Gids (brand news, comparisons, seasonal).
- Existing problems: Generic H1; showed the Gids kicker and Gids intro (identical intro on both blog indexes in all 5 languages); some articles overlap Gids topics (lage waterdruk).

**B. Recommended SEO**

- Primary keyword: douchetips
- Secondary keywords: douchekop tips; productnieuws
- Search intent: News / brand updates
- Proposed SEO title: `Besjaar® | Douchetips, Productnieuws & Acties` — IMPLEMENTED
- Proposed meta description: `Douchetips en nieuws van Besjaar: productvergelijkingen, nieuwe gidsen, acties en de Besjaar Club. Voor een betere douche met minder water.` — IMPLEMENTED
- Proposed H1: Douchetips & nieuws (was "Nieuws"; EN "News" → "Shower tips & news", DE "Dusch-Tipps & Neuigkeiten", FR "Conseils douche & actualités", ES "Consejos de ducha y novedades"). URL /blogs/news unchanged.
- Content changes: DONE: blog title. PREVIEW: own kicker "NIEUWS / BESJAAR" + own intro per language.
- Internal links to add: —
- Image optimizations: —
- Structured-data changes: Blog name follows the new title.
- Technical changes: —

**C. Implementation**

- Where: Admin › Blogs › Nieuws; theme main-blog.liquid
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: Live H1 verified (NL + DE). Preview intro verified (NL + EN).
- Priority: **Medium**

**D. Status:** IMPLEMENTED (title/H1) / PREVIEW (intro)

## Policy pages

### `/policies/shipping-policy`

**A. Existing SEO — verified**

- Current title: `Verzendbeleid – Besjaar` (23 chars)
- Current meta description: `` (0 chars)
- Current H1: `Verzendbeleid`
- Current headings (H2/H3, first 12): h3: Verwerkingstijd:; h3: Verzendmethoden:; h3: Verzendkosten:; h3: Geschatte Levertijd:; h3: Ordertracking:; h3: Nauwkeurigheid van het Adres:; h3: Niet-geleverde of Verlies van Pakketten:
- Current canonical: self (https://www.besjaar.eu/policies/shipping-policy)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: no
- Current schema types: Brand,ContactPoint,ImageObject,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 366 words in `<main>`; images 5 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): — (legal)
- Existing strengths: Present and linked in footer.
- Existing problems: Empty meta description (content=""). Shipping policy text said "Nederland: altijd gratis verzending, op elke bestelling" – contradicts checkout (€2,99 below €25).

**B. Recommended SEO**

- Primary keyword: — (legal)
- Secondary keywords: —
- Search intent: Legal / trust
- Proposed SEO title: `KEEP (Shopify policy title)` — KEEP
- Proposed meta description: `Theme fallback: "<Policy title> van Besjaar (Univex B.V., Assen), de officiële webshop voor douchekoppen en douchefilters. Vragen? Mail naar info@univexbv.com." (localized in 5 languages)` — PREVIEW
- Proposed H1: KEEP
- Content changes: Replace the NL bullet with: "Nederland: een vast tarief van €2,99. Bestellingen vanaf €25: gratis verzending." (exact HTML in Deliverable 5, M1).
- Internal links to add: —
- Image optimizations: —
- Structured-data changes: —
- Technical changes: Description fallback in seo-head.liquid (preview theme).

**C. Implementation**

- Where: Settings › Policies (Shipping) – API access lacks write_legal_policies
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: Preview verified for shipping (NL) and refund (DE).
- Priority: **Critical**

**D. Status:** MANUAL (text) / PREVIEW (description)

### `/policies/refund-policy`

**A. Existing SEO — verified**

- Current title: `Terugbetalingsbeleid – Besjaar` (30 chars)
- Current meta description: `` (0 chars)
- Current H1: `Terugbetalingsbeleid`
- Current headings (H2/H3, first 12): h3: Wettelijke bedenktijd van 14 dagen; h3: Voorwaarden; h3: Zo retourneer je; h3: Terugbetaling; h3: Ruilen; h3: Defect of verkeerd product; h3: Vragen
- Current canonical: self (https://www.besjaar.eu/policies/refund-policy)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: no
- Current schema types: Brand,ContactPoint,ImageObject,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 398 words in `<main>`; images 5 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): — (legal)
- Existing strengths: Present and linked in footer.
- Existing problems: Empty meta description (content="").

**B. Recommended SEO**

- Primary keyword: — (legal)
- Secondary keywords: —
- Search intent: Legal / trust
- Proposed SEO title: `KEEP (Shopify policy title)` — KEEP
- Proposed meta description: `Theme fallback: "<Policy title> van Besjaar (Univex B.V., Assen), de officiële webshop voor douchekoppen en douchefilters. Vragen? Mail naar info@univexbv.com." (localized in 5 languages)` — PREVIEW
- Proposed H1: KEEP
- Content changes: —
- Internal links to add: —
- Image optimizations: —
- Structured-data changes: —
- Technical changes: Description fallback in seo-head.liquid (preview theme).

**C. Implementation**

- Where: theme seo-head.liquid
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: Preview verified for shipping (NL) and refund (DE).
- Priority: **Low**

**D. Status:** PREVIEW

### `/policies/privacy-policy`

**A. Existing SEO — verified**

- Current title: `Privacybeleid – Besjaar` (23 chars)
- Current meta description: `` (0 chars)
- Current H1: `Privacybeleid`
- Current headings (H2/H3, first 12): h2: Persoonlijke informatie die we verzamelen of verwerken; h2: Bronnen van persoonlijke informatie; h2: Hoe we je persoonlijke informatie gebruiken; h2: Hoe we persoonlijke informatie openbaar maken; h2: Relatie met Shopify; h2: Websites en links van externe partijen; h2: Gegevens van kinderen; h2: Beveiliging en retentie van je informatie; h2: Je rechten en keuzes; h2: Klachten; h2: Internationale overdrachten; h2: Wijzigingen in dit privacybeleid
- Current canonical: self (https://www.besjaar.eu/policies/privacy-policy)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: no
- Current schema types: Brand,ContactPoint,ImageObject,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 2471 words in `<main>`; images 5 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): — (legal)
- Existing strengths: Present and linked in footer.
- Existing problems: Empty meta description (content="").

**B. Recommended SEO**

- Primary keyword: — (legal)
- Secondary keywords: —
- Search intent: Legal / trust
- Proposed SEO title: `KEEP (Shopify policy title)` — KEEP
- Proposed meta description: `Theme fallback: "<Policy title> van Besjaar (Univex B.V., Assen), de officiële webshop voor douchekoppen en douchefilters. Vragen? Mail naar info@univexbv.com." (localized in 5 languages)` — PREVIEW
- Proposed H1: KEEP
- Content changes: —
- Internal links to add: —
- Image optimizations: —
- Structured-data changes: —
- Technical changes: Description fallback in seo-head.liquid (preview theme).

**C. Implementation**

- Where: theme seo-head.liquid
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: Preview verified for shipping (NL) and refund (DE).
- Priority: **Low**

**D. Status:** PREVIEW

### `/policies/terms-of-service`

**A. Existing SEO — verified**

- Current title: `Algemene voorwaarden – Besjaar` (30 chars)
- Current meta description: `` (0 chars)
- Current H1: `Algemene voorwaarden`
- Current headings (H2/H3, first 12): h3: 1. Algemene Voorwaarden:; h3: 2. Bestellen en Betalen:; h3: 3. Verzending en Levering:; h3: 4. Retourneren en Terugbetalingen:; h3: 5. Beperking van Aansprakelijkheid:; h3: 6. Schadeloosstelling:; h3: 7. Toepasselijk Recht en Jurisdictie:; h3: 8. Wijzigingen in de Voorwaarden:
- Current canonical: self (https://www.besjaar.eu/policies/terms-of-service)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: no
- Current schema types: Brand,ContactPoint,ImageObject,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 932 words in `<main>`; images 5 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 83
- Current target keywords (observed from title/H1): — (legal)
- Existing strengths: Present and linked in footer.
- Existing problems: Empty meta description (content="").

**B. Recommended SEO**

- Primary keyword: — (legal)
- Secondary keywords: —
- Search intent: Legal / trust
- Proposed SEO title: `KEEP (Shopify policy title)` — KEEP
- Proposed meta description: `Theme fallback: "<Policy title> van Besjaar (Univex B.V., Assen), de officiële webshop voor douchekoppen en douchefilters. Vragen? Mail naar info@univexbv.com." (localized in 5 languages)` — PREVIEW
- Proposed H1: KEEP
- Content changes: —
- Internal links to add: —
- Image optimizations: —
- Structured-data changes: —
- Technical changes: Description fallback in seo-head.liquid (preview theme).

**C. Implementation**

- Where: theme seo-head.liquid
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: Preview verified for shipping (NL) and refund (DE).
- Priority: **Low**

**D. Status:** PREVIEW

### `/policies/legal-notice`

**A. Existing SEO — verified**

- Current title: `Wettelijke kennisgeving – Besjaar` (33 chars)
- Current meta description: `` (0 chars)
- Current H1: `Wettelijke kennisgeving`
- Current headings (H2/H3, first 12): none in <main>
- Current canonical: self (https://www.besjaar.eu/policies/legal-notice)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: no
- Current schema types: Brand,ContactPoint,ImageObject,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 23 words in `<main>`; images 5 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 1
- Current target keywords (observed from title/H1): — (legal)
- Existing strengths: Present and linked in footer.
- Existing problems: Empty meta description (content=""). Address Elbestraat 113, 9406 SV differs from the contact/schema address.

**B. Recommended SEO**

- Primary keyword: — (legal)
- Secondary keywords: —
- Search intent: Legal / trust
- Proposed SEO title: `KEEP (Shopify policy title)` — KEEP
- Proposed meta description: `Theme fallback: "<Policy title> van Besjaar (Univex B.V., Assen), de officiële webshop voor douchekoppen en douchefilters. Vragen? Mail naar info@univexbv.com." (localized in 5 languages)` — PREVIEW
- Proposed H1: KEEP
- Content changes: —
- Internal links to add: —
- Image optimizations: —
- Structured-data changes: —
- Technical changes: Description fallback in seo-head.liquid (preview theme).

**C. Implementation**

- Where: theme seo-head.liquid
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: Preview verified for shipping (NL) and refund (DE).
- Priority: **Low**

**D. Status:** PREVIEW

### `/policies/contact-information`

**A. Existing SEO — verified**

- Current title: `Contactgegevens – Besjaar` (25 chars)
- Current meta description: `` (0 chars)
- Current H1: `Contactgegevens`
- Current headings (H2/H3, first 12): none in <main>
- Current canonical: self (https://www.besjaar.eu/policies/contact-information)
- Current robots: `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`; hreflang: 6 (x-default,nl,de,fr,en,es); in sitemap: no
- Current schema types: Brand,ContactPoint,ImageObject,MemberProgram,MemberProgramTier,Organization,PostalAddress,WebSite
- Content: 27 words in `<main>`; images 5 (no alt attribute: 0, empty alt in main: 0); inbound internal links: 1
- Current target keywords (observed from title/H1): — (legal)
- Existing strengths: Present and linked in footer.
- Existing problems: Empty meta description (content="").

**B. Recommended SEO**

- Primary keyword: — (legal)
- Secondary keywords: —
- Search intent: Legal / trust
- Proposed SEO title: `KEEP (Shopify policy title)` — KEEP
- Proposed meta description: `Theme fallback: "<Policy title> van Besjaar (Univex B.V., Assen), de officiële webshop voor douchekoppen en douchefilters. Vragen? Mail naar info@univexbv.com." (localized in 5 languages)` — PREVIEW
- Proposed H1: KEEP
- Content changes: —
- Internal links to add: —
- Image optimizations: —
- Structured-data changes: —
- Technical changes: Description fallback in seo-head.liquid (preview theme).

**C. Implementation**

- Where: theme seo-head.liquid
- Existing value replaced: see A (title/description) — full previous HTML in `backups/`
- Risks: Low
- Tests: Preview verified for shipping (NL) and refund (DE).
- Priority: **Low**

**D. Status:** PREVIEW

## Articles (49 published)

Every article was checked for: a unique search intent, its exact title/description/H1/headings, date, internal links, sources, and filter/limescale claims. **No published article claims that the filter softens water or removes dissolved limescale** (the only such sentences are in two *unpublished* drafts — see Deliverable 4, C1). BlogPosting + BreadcrumbList JSON-LD is emitted once per article by the theme (no duplicates). FAQ/HowTo markup is deliberately not added (no rich results for this site type).

| Article | Published | Title (exact, before) | Meta description (exact, before) | H1 (exact) | H2 count | Words | Inbound | Primary keyword / intent | Decision | Content / link actions | Priority | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `gids/kalkaanslag-douchekop-verwijderen` | 2026-09-13 | Kalkaanslag Douchekop Verwijderen in 4 Stappen \| Besjaar | Witte vlekken en verstopte sproeiers? Verwijder kalkaanslag van je douchekop met azijn of citroenzuur in 4 stappen - en voorkom dat het terugkomt. | Kalkaanslag op je douchekop verwijderen (en voorkomen) | 7 | 613 | 83 | kalkaanslag douchekop verwijderen; douchekop ontkalken — How-to | KEEP title/description | Make this the hub for "douchekop ontkalken": add a "hoe vaak ontkalken per waterhardheid" table and link azijn-of-citroenzuur as the deep dive; avoid repeating the full step-by-step in both articles. | Medium | RECOMMENDED |
| `gids/douchefilter-zin-of-onzin` | 2026-09-13 | Douchefilter: Zin of Onzin? Eerlijke Gids \| Besjaar | Heeft een douchefilter zin in Nederland? Eerlijk over wat 8-traps filtratie wel en niet doet: deeltjes en chloor wel, kalk niet. | Douchefilter: zin of onzin? Wat het wel en niet doet | 8 | 720 | 87 | douchefilter zin of onzin — Informational → commercial | KEEP | Refresh EN/DE/FR/ES body translations (outdated since 2026-11-06; they miss the new link to /collections/douchekop-met-filter). | Medium | RECOMMENDED |
| `gids/waterbesparende-douchekop-hoeveel-bespaar-je` | 2026-09-13 | Waterbesparende Douchekop: Hoeveel Bespaar Je? \| Besjaar | Een waterbesparende douchekop bespaart vooral energie. Rekenvoorbeeld voor een huishouden van twee: liters, euro's per jaar en wat je echt merkt. | Waterbesparende douchekop: hoeveel bespaar je echt? | 8 | 547 | 87 | waterbesparende douchekop besparing — Informational / calculation | KEEP | Reconcile with the Milieu Centraal threshold (≤ 7,2 l/min) used in other guides: say plainly that Besjaar heads use max. 8 l/min, show the 12 → 8 l/min calculation with dated 2026 water and gas tariffs and their source. Expand from 410 words with a table (1–4 persons). | High | RECOMMENDED |
| `gids/douchekop-vervangen-in-5-minuten` | 2026-09-13 | Douchekop Vervangen in 5 Minuten Zonder Loodgieter \| Besjaar | Douchekop vervangen of monteren doe je zelf, meestal zonder gereedschap. In 4 stappen klaar - inclusief tips tegen lekkage bij de aansluiting. | Douchekop vervangen of monteren in 5 minuten (zonder loodgieter) | 7 | 493 | 87 | douchekop vervangen; douchekop monteren — How-to | KEEP | Expand (352 words): which end of the hose has the conical nut, when to use teflon tape, what to do if it leaks, link doucheslang-kiezen + douchekop-vervangen-huurwoning. No HowTo markup (Google retired HowTo rich results). | Medium | RECOMMENDED |
| `gids/waterhardheid-per-provincie` | 2026-10-06 | Waterhardheid per Provincie en Postcode \| Besjaar | Hoe hard is jouw kraanwater? Bekijk de waterhardheid per provincie, check je postcode en lees wat kalk doet met je douche, huid en haar. | Waterhardheid per provincie: hoe hard is het water bij jou? | 9 | 907 | 83 | waterhardheid per provincie; waterhardheid postcode — Informational | KEEP | Add "laatst gecontroleerd" date and the drinking-water companies used as sources. | Low | RECOMMENDED |
| `gids/douchekop-kalk-5-signalen` | 2026-10-06 | Douchekop vol Kalk? 5 Signalen en Wat Je Doet \| Besjaar | Scheve straal, minder druk of witte korstjes? Herken kalk in je douchekop met deze 5 signalen en een snelle test, en lees wat je eraan doet. | Douchekop vol kalk? 5 signalen dat het tijd is om te ontkalken | 11 | 755 | 5 | douchekop kalk; douchekop verstopt — Diagnostic | KEEP | Link to the ontkalken hub as next step. | Low | RECOMMENDED |
| `news/lage-waterdruk-in-de-douche-zo-krijg-je-een-krachtigere-waterstraal` | 2026-10-06 | Lage waterdruk in de douche? Zo los je het op \| Besjaar | Een douche met weinig waterdruk kan behoorlijk vervelend zijn. De waterstraal voelt zwak aan, het duurt langer om shampoo uit je haar te spoelen en een ontspannen douche  | Lage waterdruk in de douche? Zo krijg je een krachtigere waterstraal | 9 | 646 | 6 | lage waterdruk douche — Troubleshooting | Description ADDED (was missing → 320-char excerpt fallback) | Overlaps gids/douchekop-lage-waterdruk. Move to the Gids blog as "Lage waterdruk in de douche: 7 oorzaken en oplossingen" (301 old URL), keep the Gids article focused on choosing a showerhead, cross-link both. It has 0 links to other articles. | Medium | IMPLEMENTED + verified |
| `gids/hard-water-haar` | 2026-10-07 | Hard Water en Je Haar: Wat Het Doet en Wat Helpt \| Besjaar | Dof, stug of klittend haar? Lees wat hard water echt met je haar doet, wat een fabel is en wat helpt, van zuiverende shampoo tot douchefilter. | Wat doet hard water met je haar? Dit merk je wel (en niet) | 10 | 822 | 1 | hard water haar — Informational | KEEP | Only 1 inbound link: link from kalk-water-droge-huid and douchefilter-zin-of-onzin. Add alt to its featured image (alt is empty in Admin). | Low | RECOMMENDED |
| `news/besjaar-gids-in-vijf-talen` | 2026-10-07 | Nieuw: de Besjaar Gids in vijf talen \| Besjaar | De Besjaar Gids is live: eerlijke, praktische artikelen over kalk, waterhardheid, douchefilters en douchekoppen. Nu te lezen in vijf talen. | Nieuw op besjaar.eu: de Besjaar Gids, nu in vijf talen | 6 | 391 | 0 | — — Announcement | KEEP | 0 inbound internal links (orphan). Low value: either link it from wat-is-besjaar or unpublish + 301 to /blogs/gids if it gets no traffic in GSC. Featured image alt empty. | Low | RECOMMENDED |
| `gids/kalk-water-droge-huid` | 2026-10-08 | Kalkrijk Water en Droge Huid: Wat Klopt Er? \| Besjaar | Droge, strakke huid na het douchen? Lees wat kalk in je water echt met je huid doet, wat onderzoek zegt over eczeem en wat helpt tegen uitdroging. | Kalkrijk water en een droge huid: wat is het verband? | 9 | 1016 | 4 | kalk droge huid; hard water eczeem — Informational (health-adjacent) | KEEP | Keep claims cautious; cite the studies by name/year; no promise that a filter helps. | Medium | RECOMMENDED |
| `gids/douchekop-ontkalken-azijn-of-citroenzuur` | 2026-10-08 | Douchekop Ontkalken: Azijn of Citroenzuur? \| Besjaar | Azijn of citroenzuur voor je douchekop? Bekijk het verschil in werking, geur en veiligheid voor chroom en rubbers, plus een stappenplan dat werkt. | Douchekop ontkalken: azijn of citroenzuur? | 12 | 1001 | 13 | douchekop ontkalken azijn of citroenzuur — Comparison how-to | KEEP | Focus on the comparison; link the hub for the full routine. | Medium | RECOMMENDED |
| `gids/kalkvlekken-douchewand-voorkomen` | 2026-10-08 | Kalkvlekken op de Douchewand Voorkomen \| Besjaar | Nooit meer witte vlekken op je glazen douchewand? Met deze routine van 30 seconden per dag voorkom je kalkvlekken. Plus: zo krijg je ze weg. | Douchewand zonder kalkvlekken in 30 seconden per dag | 10 | 869 | 5 | kalkvlekken douchewand — How-to | KEEP | — | Low | KEEP |
| `news/wat-is-besjaar` | 2026-10-08 | Wat is Besjaar? Het merk voor douchekoppen uit Assen | Besjaar is een Nederlands merk uit Assen voor douchekoppen met filter en douchefilters. Lees wie we zijn, wat we maken en waar je Besjaar koopt. | Wat is Besjaar? Het Nederlandse merk voor douchekoppen met filter | 9 | 713 | 7 | wat is Besjaar — Brand | KEEP | Link besjaar-gids-in-vijf-talen; keep consistent with /pages/about-us. | Low | RECOMMENDED |
| `news/besjaar-assortiment-welke-douchekop` | 2026-10-08 | Welke Besjaar-douchekop past bij jou? Alle modellen vergeleken | Vergelijk alle Besjaar-douchekoppen: met of zonder filter, met of zonder slang, 3 of 10 standen. Zo kies je in een minuut de juiste Besjaar. | Welke Besjaar-douchekop past bij jou? Het hele assortiment vergeleken | 9 | 678 | 10 | welke Besjaar douchekop; Besjaar douchekoppen vergelijken — Brand comparison | KEEP as the canonical range comparison | Merge the unique parts of besjaar-douchekoppen-twee-designs-vergeleken into this article, then 301 that article here. | Medium | RECOMMENDED |
| `news/besjaar-douchekop-veelgestelde-vragen` | 2026-10-08 | Besjaar Douchekop: de 10 Meest Gestelde Vragen | Alles over de Besjaar-douchekop: montage, kalk, filters, waterverbruik, levering en retour. De 10 vragen die we het vaakst krijgen, kort beantwoord. | Besjaar-douchekop: de 10 meest gestelde vragen | 13 | 705 | 2 | Besjaar douchekop vragen — Brand FAQ | KEEP | Cross-link with /pages/faqs. | Low | RECOMMENDED |
| `news/besjaar-webshop-of-bol-com` | 2026-10-08 | Besjaar Kopen: Webshop of Bol.com? Het Verschil | Besjaar koop je op besjaar.eu en op Bol.com. Lees wat het verschil is: Club-korting, vervangfilters, gidsen, levering naar 5 landen en service. | Besjaar kopen: in de webshop of op Bol.com? Dit is het verschil | 8 | 624 | 6 | Besjaar bol.com — Brand | KEEP | — | Low | KEEP |
| `news/besjaar-club-ledenvoordeel` | 2026-10-08 | Besjaar Club: Gratis Lid, 20% op Vervangfilters | Word gratis lid van de Besjaar Club: 20% korting op elke set vervangfilters, een welkomstkorting en je bestellingen op één plek. Zonder punten of abonnement. | Besjaar Club: gratis lid en 20% korting op elke set vervangfilters | 7 | 537 | 4 | Besjaar Club — Loyalty | KEEP | — | Low | KEEP |
| `gids/waterontharder-of-douchefilter` | 2026-10-09 | Waterontharder of Douchefilter: Wat Heb Je Nodig? \| Besjaar | Waterontharder of douchefilter? Besjaar vergelijkt wat ze doen, wat ze kosten en wanneer je ze nodig hebt. Met eerlijk advies voor Nederlands kraanwater. | Waterontharder of douchefilter: wat heb je echt nodig? | 11 | 1058 | 14 | waterontharder of douchefilter — Comparison | KEEP | — | Low | KEEP |
| `gids/chloor-in-kraanwater-nederland` | 2026-10-09 | Chloor in Nederlands Kraanwater? Het Antwoord \| Besjaar | Nee, normaal zit er geen chloor in Nederlands kraanwater. Zo blijft het toch veilig, en zo zit het bij calamiteiten en in het buitenland. | Zit er chloor in Nederlands kraanwater? Het eerlijke antwoord | 10 | 919 | 12 | chloor in kraanwater — Informational | KEEP | Re-translate meta_title (EN/FR/ES outdated). | Low | RECOMMENDED |
| `gids/hoe-werkt-een-douchefilter` | 2026-10-09 | Hoe Werkt een Douchefilter? Alle Filtertypes Uitgelegd \| Besjaar | Koolfilter, KDF, calciumsulfiet of vitamine C: Besjaar legt uit hoe een douchefilter werkt, wat elke filterlaag doet en wat een douchefilter niet kan. | Hoe werkt een douchefilter? De filtertypes uitgelegd | 11 | 1039 | 7 | hoe werkt een douchefilter — Informational | KEEP | Refresh body translations (outdated; they miss the internal links added in NL). | Medium | RECOMMENDED |
| `gids/hoge-druk-douchekop-wat-betekent-dat` | 2026-10-09 | Hoge Druk Douchekop: Wat Betekent Dat? \| Besjaar | Een hogedrukdouchekop verhoogt de waterdruk niet. Besjaar legt uit wat 'hoge druk' wel betekent en wat de Besjaar Luxe Handdouche doet. | Hoge druk douchekop: wat betekent dat eigenlijk? | 10 | 747 | 6 | hoge druk douchekop — Informational | KEEP | Honest about 8 vs 7,2 l/min – keep. Now linked from /collections/showerhead. | Low | RECOMMENDED |
| `gids/doucheslang-kiezen` | 2026-10-09 | Doucheslang Kiezen: Lengte, Aansluiting, Anti-draai \| Besjaar | Welke doucheslang heb je nodig? Lees welke lengte past, hoe de aansluitingen van een halve inch werken, wat anti-draai doet en wanneer je vervangt. | Doucheslang kiezen: lengte, aansluiting en anti-draai uitgelegd | 11 | 789 | 8 | doucheslang kiezen; doucheslang vervangen — Buying guide | KEEP | Refresh body translations (outdated; EN/DE/FR/ES lack the link to the doucheslang product). | Medium | RECOMMENDED |
| `gids/pauzeknop-douchekop-besparen` | 2026-10-09 | Pauzeknop op je Douchekop: Zo Bespaar Je \| Besjaar | Met een pauzeknop zet je de straal stil tijdens het inzepen. Besjaar rekent uit wat dat bespaart, met tips voor de Besjaar Douchekop met Filter. | De pauzeknop op je douchekop: zo werkt hij en dit bespaar je | 10 | 710 | 7 | douchekop met pauzeknop — Informational | KEEP | — | Low | KEEP |
| `news/hond-wassen-onder-de-douche` | 2026-10-09 | Hond Wassen Onder de Douche: Het Stappenplan \| Besjaar | Zo was je je hond onder de douche: lauw water, hondenshampoo en goed naspoelen. Met tips voor de Besjaar Douchekop met Slang en Filter. | Hond wassen onder de douche: zo doe je het stap voor stap | 11 | 832 | 2 | hond wassen douche — Lifestyle | KEEP | — | Low | KEEP |
| `gids/douchefilter-kosten-per-jaar` | 2026-10-09 | Wat Kost een Douchefilter per Jaar? \| Besjaar | Met de Besjaar Vervangfilters betaal je zo'n € 12 tot € 20 per jaar aan filters, of minder met Club-korting. Zo reken je het zelf uit. | Wat kost een douchefilter per jaar? De Besjaar-filters doorgerekend | 9 | 666 | 4 | douchefilter kosten — Calculation | KEEP | Check that the €12–20/year figure matches €9,99 per set of 2 and the 20% Club price. | Low | RECOMMENDED |
| `gids/douchefilter-vervangen-stappenplan` | 2026-10-12 | Douchefilter vervangen in 4 stappen \| Besjaar | Zo wissel je het filter van je Besjaar-douchekop zonder gereedschap. Hoe vaak, wat het kost per maand en welke filters passen. | Douchefilter vervangen: zo wissel je de filters van je Besjaar-douchekop | 6 | 426 | 8 | douchefilter vervangen — How-to | KEEP title | Thin (286 words) for the primary "douchefilter vervangen" query: add when to replace (signals + 3–5 months), compatible models only, what to do if it leaks after replacement, disposal, and link the refill product. Now linked from /collections/shower-filter. | High | RECOMMENDED |
| `news/douchekop-cadeau-sinterklaas-kerst` | 2026-10-12 | Douchekop cadeau: 5 ideeën voor Sinterklaas en kerst – Besjaar | Een douchekop cadeau geven? Vijf ideeën van Besjaar per budget, van € 9,99 tot € 30,99, plus tips om het juiste model te kiezen. | Een douchekop cadeau geven: 5 ideeën voor Sinterklaas en kerst | 5 | 426 | 14 | douchekop cadeau — Seasonal | KEEP | Check prices before 5 December (article quotes €9,99–€30,99). | Low | RECOMMENDED |
| `news/douche-doorspoelen-na-vakantie` | 2026-10-12 | Douche doorspoelen na vakantie: zo doe je dat – Besjaar | Na een vakantie eerst je leidingen en douche doorspoelen. Zo doe je dat zonder nevel, plus tips voor een schone douchekop. | Terug van vakantie: zo spoel je je douche door en houd je de kop schoon | 9 | 561 | 15 | douche doorspoelen na vakantie — Health-adjacent how-to | KEEP | Align with RIVM/legionella guidance and cite it. | Low | RECOMMENDED |
| `gids/douchekop-lekt-oplossen` | 2026-10-16 | Douchekop of Doucheslang Lekt? Zo Los Je Het Op \| Besjaar | Lekt je douchekop bij de aansluiting, druppelt hij na of lekt de slang zelf? Zo vind je waar het lek zit en los je het meestal zelf op. | Douchekop of doucheslang lekt? Zo vind en verhelp je het lek | 12 | 1010 | 6 | douchekop lekt — Troubleshooting | KEEP | Refresh body translations (outdated). | Low | RECOMMENDED |
| `gids/roze-zwarte-aanslag-douche` | 2026-10-16 | Roze of Zwarte Aanslag in de Douche? De Oplossing \| Besjaar | Roze aanslag is meestal een bacterie, zwarte puntjes zijn schimmel. Zo verwijder je allebei veilig en houd je douche, kitranden en douchekop schoon. | Roze of zwarte aanslag in de douche: wat is het en hoe kom je ervan af? | 10 | 814 | 4 | roze aanslag douche — Informational | KEEP | Re-translate meta_title (EN/DE/FR outdated). | Low | RECOMMENDED |
| `gids/wat-kost-een-douchebeurt-emmertest` | 2026-10-16 | Wat Kost een Douchebeurt? Doe de Emmertest \| Besjaar | Meet in een minuut hoeveel liter je douche per minuut gebruikt en zie wat een douchebeurt kost aan water en gas, gerekend met prijzen van 2026. | Wat kost een douchebeurt? Meet je douchekop met de emmertest | 11 | 999 | 9 | wat kost een douchebeurt — Calculation | KEEP | Date-stamp the 2026 tariffs and name the source. | Low | RECOMMENDED |
| `gids/douchekop-vervangen-huurwoning` | 2026-10-16 | Douchekop Vervangen in een Huurwoning: Mag Dat? \| Besjaar | Mag je als huurder zelf je douchekop of doucheslang vervangen? Wat de wet zegt, wie betaalt en waarom je de oude kop het beste bewaart. | Douchekop vervangen in een huurwoning: mag dat? | 11 | 780 | 4 | douchekop vervangen huurwoning — Informational (legal) | KEEP | Name the legal basis (Besluit kleine herstellingen) and link it. | Low | RECOMMENDED |
| `gids/doucheafvoer-stinkt-of-loopt-traag` | 2026-10-16 | Doucheputje Stinkt of Loopt Traag? Zo Los Je Het Op \| Besjaar | Stinkt je doucheputje of blijft het water staan? Meestal zijn het haren, zeepresten of een droge sifon. Zo los je het zelf op, zonder loodgieter. | Doucheputje stinkt of loopt traag? Zo los je het op | 12 | 899 | 3 | doucheputje stinkt — Troubleshooting | KEEP | Off-core but useful; no change. | Low | RECOMMENDED |
| `gids/douchekop-lage-waterdruk` | 2026-10-16 | Douchekop bij Lage Waterdruk: Zo Kies Je \| Besjaar | Weinig druk op de douche? Check eerst zeefjes en hoofdkraan, en kies dan een douchekop die de beschikbare druk zo goed mogelijk benut. | Douchekop bij lage waterdruk: zo kies je er een die wél lekker doucht | 9 | 935 | 3 | douchekop lage waterdruk — Buying guide | KEEP | Differentiate from the news troubleshooting article (see above) and cross-link. | Medium | RECOMMENDED |
| `gids/douchekop-hoge-waterdruk` | 2026-10-16 | Hoge Waterdruk? Zo Kies Je de Juiste Douchekop \| Besjaar | Spat je douche alle kanten op? Zo herken je hoge waterdruk, wanneer een drukverminderaar verstandig is en welke douchekop de druk goed benut. | Hoge waterdruk thuis? Zo kies en gebruik je de juiste douchekop | 10 | 809 | 3 | hoge waterdruk douche — Buying guide | KEEP | — | Low | KEEP |
| `news/gasprijs-omhoog-douche-besparen` | 2026-10-16 | Gas Duurder: Zo Houd Je Je Douche Betaalbaar \| Besjaar | De gasprijs steeg per 1 oktober 2026. Wat kost douchen nu per minuut, en vijf manieren om je douche deze winter betaalbaar te houden. | Gas is duurder geworden: zo houd je je douche betaalbaar deze winter | 7 | 662 | 17 | douchen kosten gasprijs — News (time-sensitive) | KEEP | Cite the tariff source for "per 1 oktober 2026". | Low | RECOMMENDED |
| `news/nieuw-in-de-gids-oktober-2026` | 2026-10-16 | Nieuw in de Besjaar Gids: 7 Praktische Artikelen \| Besjaar | Zeven nieuwe artikelen in de Besjaar Gids: lekkende douchekop, roze aanslag, kosten van douchen, huurwoning, doucheputje en lage of hoge waterdruk. | Nieuw in de Besjaar Gids: zeven praktische artikelen | 4 | 374 | 14 | — — Announcement | KEEP | Low value; fine as news. | Low | RECOMMENDED |
| `gids/beste-douchekop-met-filter-vergeleken` | 2026-10-24 | Beste douchekop met filter 2026: eerlijk vergeleken – Besjaar | Besjaar, Philips en Grohe naast elkaar: filter, standen en prijs. Plus welke douchekop met filter past bij jouw water. | Beste douchekop met filter 2026: eerlijk vergeleken | 9 | 737 | 2 | beste douchekop met filter — Commercial investigation | KEEP | Add method + "prijzen gecontroleerd op <datum>" next to competitor prices; refresh translations (EN version has no product links). Now linked from both filter-related collections. | High | RECOMMENDED |
| `gids/is-besjaar-betrouwbaar` | 2026-10-24 | Is Besjaar betrouwbaar? Reviews, garantie en bedrijf | Besjaar is een merk van Univex B.V. uit Assen. Bekijk de reviews (4,7 van 5 op bol.com), garantie, retour en verzending. | Is Besjaar betrouwbaar? Ervaringen, reviews en garantie | 9 | 604 | 1 | Besjaar betrouwbaar; Besjaar ervaringen — Brand trust | KEEP | States "4,7 van 5 uit 437 reviews" while the homepage says 433 – use one dated figure from bol.com. Now linked from /pages/reviews. | Medium | RECOMMENDED |
| `gids/douchekop-met-filter-belgie` | 2026-10-24 | Douchekop met filter in België: kalk en chloor – Besjaar | Belgisch kraantjeswater is vaak middelhard tot hard en bevat soms chloor. Wat een douchefilter wel en niet doet. | Douchekop met filter in België: kalk, chloor en wat je echt nodig hebt | 10 | 752 | 2 | douchekop met filter België — Informational (BE) | KEEP | — | Low | KEEP |
| `gids/regendouche-of-handdouche` | 2026-10-24 | Regendouche of handdouche: wat past bij jou? – Besjaar | Een regendouche gebruikt 15 tot 20 liter per minuut, een handdouche veel minder. Vergelijk verbruik, kosten en gemak. | Regendouche of handdouche: wat past bij jou? | 10 | 741 | 1 | regendouche of handdouche — Comparison | KEEP | Now linked from /collections/showerhead (was 1 inbound link). | Low | RECOMMENDED |
| `gids/douche-woordenboek` | 2026-10-24 | Douche-woordenboek: 27 begrippen uitgelegd \| Besjaar | Van G½ tot volumestroomklasse: 27 begrippen over douchekoppen, water en filters, elk in één of twee zinnen. | Douche-woordenboek: 27 begrippen van G½ tot volumestroomklasse | 6 | 786 | 36 | douche begrippen — Glossary | Description → "Van G½ en anti-draai tot volumestroomklasse: 27 begrippen over douchekoppen, doucheslangen, water en filters, elk kort en helder uitgelegd." (current 107 chars) | — | Low | KEEP |
| `gids/douchekop-met-filter-duitsland` | 2026-10-24 | Douchekop met filter in Duitsland: kalk en chloor – Besjaar | Duits kraanwater bevat zelden chloor en de hardheid verschilt per gemeente. Wat een douchefilter in Duitsland wel en niet doet. | Douchekop met filter in Duitsland: kalk, chloor en wat je echt nodig hebt | 8 | 593 | 36 | Duschkopf mit Filter Deutschland (via DE translation) — Informational (DE) | KEEP | Translate the handle in DE (currently Dutch slug under /de/). | Low | RECOMMENDED |
| `gids/douchekop-met-filter-frankrijk` | 2026-10-24 | Douchekop met filter in Frankrijk: kalk en chloor – Besjaar | Frans kraanwater is gemiddeld hard en bevat bijna altijd wat chloor. Wat een douchefilter in Frankrijk wel en niet doet. | Douchekop met filter in Frankrijk: kalk en chloor in Frans kraanwater | 9 | 610 | 36 | pommeau de douche filtrant France (via FR) — Informational (FR) | KEEP | Translate the handle in FR. | Low | RECOMMENDED |
| `gids/douchekop-met-filter-spanje` | 2026-10-24 | Douchekop met filter in Spanje: kalk en chloor – Besjaar | Spaans kraanwater bevat meestal chloor en is aan de kust vaak hard. Wat een douchefilter in Spanje wel en niet doet. | Douchekop met filter in Spanje: kalk en chloor in Spaans kraanwater | 9 | 557 | 36 | alcachofa con filtro España (via ES) — Informational (ES) | KEEP | Translate the handle in ES. | Low | RECOMMENDED |
| `gids/douchen-boiler-warmtepomp-hoe-lang` | 2026-10-24 | Hoe lang douchen met een boiler of warmtepomp? – Besjaar | Hoeveel minuten douchen met een boiler van 80 tot 200 liter? Een rekentabel per douchekop, plus tips voor langer warm water. | Douchen met een boiler of warmtepomp: hoe lang heb je warm water? | 9 | 643 | 35 | hoe lang douchen boiler — Calculation | KEEP | Translate handles. | Low | RECOMMENDED |
| `gids/douchekop-vervangen-wanneer` | 2026-10-24 | Wanneer douchekop vervangen? 5 signalen \| Besjaar | Wanneer is je douchekop aan vervanging toe, en wat doe je met de oude? Vijf signalen, levensduur en weggooien uitgelegd. | Wanneer is je douchekop aan vervanging toe? Signalen, levensduur en weggooien | 9 | 597 | 35 | wanneer douchekop vervangen — Informational | KEEP | No product/collection link yet: add one to /collections/showerhead. Translate handles. | Low | RECOMMENDED |
| `news/besjaar-op-trustpilot` | 2026-10-27 | Besjaar op Trustpilot: Beoordeel Onze Webshop \| Besjaar | Besjaar staat nu op Trustpilot. Lees hoe je een beoordeling schrijft, wat het verschil is met productreviews en hoe we met elke beoordeling omgaan. | Besjaar staat nu op Trustpilot: deel je ervaring met onze webshop | 9 | 694 | 14 | Besjaar Trustpilot — Brand trust | KEEP | Now linked from /pages/reviews. | Low | RECOMMENDED |
| `news/besjaar-douchekoppen-twee-designs-vergeleken` | 2026-11-02 | Besjaar douchekoppen vergeleken: twee designs, één gevoel | Besjaar is een Nederlands merk voor douchekoppen en badkameraccessoires. Je koopt Besjaar via de officiële webshop besjaar.eu en op Bol.com. De collectie draait om twee d | Besjaar douchekoppen vergeleken: twee designs, hetzelfde verfrissende douchegevoel | 9 | 1055 | 14 | Besjaar douchekoppen vergeleken — Brand comparison | Description ADDED (was missing) | NOT translated: /de /en /fr /es served Dutch text with foreign lang + hreflang. Metafield custom.primary_locale_only=true set; preview theme noindexes those 4 URLs. Longer-term: merge into besjaar-assortiment-welke-douchekop and 301. | Medium | IMPLEMENTED + verified |