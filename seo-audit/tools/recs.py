# Recommendation records per Dutch URL path. Used to generate Deliverable 3.
# status: "IMPLEMENTED" (made + verified live), "PREVIEW" (in unpublished theme), "RECOMMENDED", "MANUAL" (needs merchant action/access)
H = {}
def r(path, **kw): H[path] = kw

r('/', kw='Besjaar; waterbesparende douchekoppen; hoge druk douchekop', sec='douchekop kopen; douchekop met filter; Besjaar douchekop', intent='Brand + broad commercial (navigational for "Besjaar")',
  title_new='KEEP: Besjaar® | Waterbesparende Douchekoppen met Hoge Druk', title_status='KEEP',
  desc_new='Officiële Besjaar webshop: douchekoppen met een volle straal bij max. 8 l/min, met of zonder filter of slang. Gratis verzending in NL vanaf €25.', desc_status='MANUAL',
  h1_new='KEEP: "Besjaar douchekoppen comfortabel en zuinig." (already names brand + category; the two spans render on separate lines)',
  strengths='Brand-first title; one H1; Organization + WebSite + MemberProgram JSON-LD; hero, product grid (4 showerheads), trust row, guides, bol.com proof with source link.',
  problems='Meta description = generic shop description and says "krachtige waterdruk" (a showerhead cannot raise mains pressure – the store\'s own guide says so). Mobile LCP 4.5 s (lab) from a 1,672 px hero WebP; product-card images served at 480 px for ~170 px slots. Trust strip promises "Voor 16:00 besteld, morgen in huis" without "meestal". No direct link to the filter collection in the hero area (only via menu). An H3 reads "dagen bedenktijd" because the number sits outside the heading.',
  content='Keep the page compact (no SEO text wall). Change trust strip to "Vóór 16:00 besteld, meestal morgen in huis". Add a secondary hero link "Douchekop met filter" → /collections/douchekop-met-filter. Put the "30" inside the H3 of the "dagen bedenktijd" card.',
  links='Hero secondary CTA → /collections/douchekop-met-filter; keep primary CTA → /collections/showerhead.',
  images='Serve hero with srcset/sizes (mobile ≤ 828 px), keep fetchpriority=high on LCP image; product cards: sizes="(max-width: 760px) 45vw, 25vw".',
  schema='Keep. Organization.url uses non-www (fixed in preview theme). sameAs points at a bol.com product listing – set theme setting "Bol.com brand page URL" to https://www.bol.com/nl/nl/b/besjaar/603580876/.',
  tech='Homepage title/description live in Online Store › Preferences (no Admin API) → manual.', where='Online Store › Preferences (title/description); Theme editor › Home (hero, strip)', risk='Low', test='View source: <title>, meta description; Rich Results Test (Organization).', prio='Medium', status='MANUAL (description) / RECOMMENDED (hero tweaks)')

r('/collections/showerhead', kw='douchekop kopen; douchekoppen; douchekop', sec='waterbesparende douchekop; hoge druk douchekop; douchekop met slang', intent='Commercial – compare and buy',
  title_new='Besjaar® | Douchekop Kopen – Waterbesparend & Hoge Druk', title_status='IMPLEMENTED',
  desc_new='Vergelijk alle Besjaar douchekoppen: 3 of 10 standen, met of zonder filter of slang, volle straal bij max. 8 l/min. Gratis verzending in NL vanaf €25.', desc_status='IMPLEMENTED',
  h1_new='KEEP: "Douchekoppen" (collection title; also used in menus/breadcrumbs)',
  strengths='Strong commercial title; accurate description; honest filter explanation (no softening/limescale claim); CollectionPage + ItemList JSON-LD; 5 products with prices, ratings, stock.',
  problems='No H2 and no side-by-side comparison of the models; the doucheslang (an accessory) sits in the "Douchekoppen" collection; guides not linked from the category.',
  content='ADDED (live): H2 "Welke Besjaar douchekop past bij jou?" + 4-column comparison table (standen / filter / slang) for all 5 products + paragraph linking 4 buying guides. It renders in the existing collapsed "Meer over douchekoppen" panel (verified on 390 px – no overflow).',
  links='ADDED: regendouche-of-handdouche, hoge-druk-douchekop-wat-betekent-dat, douchekop-vervangen-in-5-minuten, beste-douchekop-met-filter-vergeleken; all 5 product URLs from the table.',
  images='Collection image alt already descriptive. Product-card images oversized on mobile (Lighthouse: 256 KiB saving).', schema='Keep CollectionPage/ItemList.', tech='Consider moving the doucheslang to its own "Doucheslangen" collection or label it "Accessoire" in the grid.',
  where='Admin › Collections › Douchekoppen (SEO + description)', risk='Translations of the description are now marked outdated (EN/DE/FR/ES keep the previous text until re-translated).', test='Re-crawled live 2026-11-07: title, description, H2, table and links present; 200; canonical self.', prio='High', status='IMPLEMENTED + verified')

r('/collections/douchekop-met-filter', kw='douchekop met filter', sec='douchekop met filter en slang; handdouche met filter; douchekop filter chloor', intent='Commercial – buy a filtered showerhead',
  title_new='Besjaar® | Douchekop met Filter – Met of Zonder Slang', title_status='IMPLEMENTED', desc_new='KEEP (already accurate and complete)', desc_status='KEEP',
  h1_new='KEEP: "Douchekop met filter"',
  strengths='Exact-match H1 and title; best on-site explanation of what the filter does and does not do; explains with/without hose; links to refills.',
  problems='No links to the filter guides (zin of onzin, hoe werkt, beste douchekop met filter) – the comparison article had only 2 inbound links; no collection image.',
  content='ADDED (live): closing paragraph linking "douchefilter: zin of onzin?", "hoe een douchefilter werkt" and the filter comparison.', links='ADDED: 3 guide links (see content).',
  images='Add a collection image (e.g. the filter-in-handle close-up) with alt "Besjaar douchekop met filter in de handgreep".', schema='Keep.', tech='—',
  where='Admin › Collections › Douchekop met filter', risk='Description translations outdated until re-translated.', test='Re-crawled live: OK.', prio='High', status='IMPLEMENTED + verified')

r('/collections/shower-filter', kw='douchefilter; vervangfilter douchekop', sec='douchefilter navulset; douchefilter cartridge; Besjaar vervangfilters', intent='Commercial – buy refills (existing owners)',
  title_new='Besjaar® | Douchefilters & Vervangfilters – 8-Traps', title_status='IMPLEMENTED', desc_new='KEEP', desc_status='KEEP',
  h1_new='KEEP: "Douchefilters"',
  strengths='States lifespan (3–5 months), compatibility (only the two filter models) and that the filter does not soften water.',
  problems='Thin (184 words) and only 1 product, so it competes with the product page for "vervangfilter"; generic "douchefilter" searchers may expect a universal inline filter – the page must keep saying it only fits Besjaar filter heads.',
  content='ADDED (live): set contents (2 cartridges) + links to replacement step-by-step, yearly cost article and Besjaar Club (20% member discount – verified active automatic discount).',
  links='ADDED: douchefilter-vervangen-stappenplan, douchefilter-kosten-per-jaar, /pages/besjaar-club.', images='OK.', schema='Keep.', tech='—',
  where='Admin › Collections › Douchefilters', risk='Low', test='Re-crawled live: OK.', prio='Medium', status='IMPLEMENTED + verified')

PRODUCT_COMMON = dict(schema='Keep Shopify ProductGroup + Offer with shippingDetails/returnPolicy (verified values match checkout: NL €2,99 / free ≥ €25; BE-DE-FR-ES €2,99 / free ≥ €30). No aggregateRating is emitted – correct, because most on-site reviews were imported from bol.com.',
  where='Admin › Products › [product] › Search engine listing + Description', risk='Description translations (EN/DE/FR/ES) marked outdated – re-translate the added sentences.', test='Re-crawled live 2026-11-07 19:20 UTC: new title/description/copy present, canonical self, index,follow, no Liquid errors.')

r('/products/besjaar-hoge-druk-douchekop-met-filter-model-1002025-10-sproeistanden-waterbesparende-zilver', kw='douchekop met filter 10 standen', sec='handdouche met filter; hoge druk douchekop met filter; douchekop met filter zonder slang', intent='Transactional – specific model',
  title_new='Besjaar® | Douchekop met Filter – 10 Standen, Zonder Slang', title_status='IMPLEMENTED',
  desc_new='Douchekop met 8-traps filter en 10 standen, zonder slang: past op je eigen G½-doucheslang. Met pauzeknop en vervangbaar filter. Gratis verzending in NL.', desc_status='IMPLEMENTED',
  h1_new='KEEP: "Douchekop met filter – 10 standen"',
  strengths='Accurate filter claims; GTIN 8720726284516; 9 images with descriptive file names and alt text; specs incl. model 1002025.',
  problems='Lede paragraph identical to the "met slang" product (duplicate copy); never said explicitly that a hose is NOT included; no link to refills; gallery contains the photo of the version WITH hose; 2 video posters without alt; mobile LCP 6.6 s (lab).',
  content='ADDED (live): lede starts "Deze douchekop komt zonder slang…"; spec row "Slang: Niet inbegrepen, past op je eigen G½-slang"; closing line linking refills (set van 2) and the "met slang" version.',
  links='ADDED: /products/besjaar-douchefilter; /products/…met-slang…filter…', images='Video alt added (2 files). Recommend removing or relabelling the "met filter en slang" photo in this gallery.', **PRODUCT_COMMON, tech='Preload/size the main gallery image for mobile (LCP).', prio='High', status='IMPLEMENTED + verified')

r('/products/besjaar-douchekop-met-slang-hoge-druk-met-filter-10-sproeistanden-regendouche-waterbesparende-handdouche-zilver', kw='douchekop met filter en slang', sec='douchekop 10 standen met slang; complete doucheset met filter; douchekop hoge druk met slang', intent='Transactional – complete set',
  title_new='Besjaar® | Douchekop met Filter en Slang – 10 Standen', title_status='IMPLEMENTED',
  desc_new='Complete set: douchekop met 8-traps filter en 10 standen, 1,5 m doucheslang, afdichtringen en teflontape. Breekt vrij chloor af. Gratis verzending in NL.', desc_status='IMPLEMENTED',
  h1_new='KEEP: "Douchekop met filter en slang – 10 standen"',
  strengths='Accurate; box contents list hose, tape, 2 seals, manual; GTIN present.',
  problems='Opening copy identical to the no-hose model; did not explain the difference; no link back to the cheaper no-hose model.',
  content='ADDED (live): lede "Dit is de Besjaar douchekop met filter als complete set: met een doucheslang van 1,5 meter, twee afdichtringen en teflontape…"; closing line linking the no-hose model and refills.',
  links='ADDED: no-hose model; refills.', images='OK (shares gallery with the no-hose model, correct for this product).', **PRODUCT_COMMON, tech='—', prio='High', status='IMPLEMENTED + verified')

r('/products/besjaar-douchekop-3-sproeistanden-hoge-druk-luxe-moderne-handdouche-chrome', kw='douchekop 3 standen', sec='waterbesparende handdouche; douchekop chroom; douchekop zonder slang', intent='Transactional – entry model',
  title_new='Besjaar® | Waterbesparende Douchekop – 3 Standen', title_status='IMPLEMENTED',
  desc_new='Douchekop met 3 standen (regen, massage, power) en een volle straal bij max. 8 l/min. Zonder slang of filter: past op je eigen G½-slang. 30 dagen retour.', desc_status='IMPLEMENTED',
  h1_new='KEEP: "Douchekop met 3 standen – chroom"',
  strengths='Clear 3 modes, 13 cm, max. 8 l/min, chrome; 145 reviews shown (Judge.me, mostly imported from bol.com – disclosed on /pages/reviews).',
  problems='Spec table lacked the connection (G½) and did not say hose/filter are not included. "Waterbesparend" at max. 8 l/min conflicts with the Milieu Centraal threshold (≤ 7,2 l/min) cited in the store\'s own guides – see Deliverable 4, claim C2.',
  content='ADDED (live): spec rows "Aansluiting: Universeel G½, past op elke standaard doucheslang" and "Slang en filter: Niet inbegrepen".', links='Existing link to filter model kept.', images='OK.', **PRODUCT_COMMON, tech='—', prio='High', status='IMPLEMENTED + verified')

r('/products/besjaar-douchekop-met-slang-handdouche-met-3-sproeistanden-regendouche-hoge-druk-chromen-douchekop', kw='douchekop met slang', sec='douchekop met slang 1,5 meter; handdouche met slang; waterbesparende douchekop met slang', intent='Transactional – complete set without filter',
  title_new='Besjaar® | Douchekop met Slang 1,5 m – 3 Standen', title_status='IMPLEMENTED',
  desc_new='Complete set: douchekop met 3 standen, 1,5 m anti-draai slang en afdichtingen. Max. 8 l/min, montage zonder gereedschap. Zonder filter. Gratis verzending in NL.', desc_status='IMPLEMENTED',
  h1_new='KEEP: "Douchekop met slang – 3 standen"',
  strengths='Box contents explicit (head, 1,5 m hose, 2 seals, flow part); 153 reviews.',
  problems='Not differentiated from the filtered set (no "zonder filter"); no connection spec.',
  content='ADDED (live): spec rows "Aansluiting: Universeel G½" and "Filter: Niet inbegrepen"; line linking the filtered set.', links='ADDED: filtered set.', images='OK.', **PRODUCT_COMMON, tech='—', prio='High', status='IMPLEMENTED + verified')

r('/products/besjaar-doucheslang-150-cm-chroom', kw='doucheslang 150 cm', sec='doucheslang 1,5 meter; universele doucheslang; anti draai doucheslang', intent='Transactional – replacement part',
  title_new='Besjaar® | Doucheslang 150 cm – Universeel ½", Anti-Draai', title_status='IMPLEMENTED',
  desc_new='Doucheslang van 150 cm met anti-draai en universele ½"-aansluiting aan beide kanten. Past op vrijwel elke handdouche en kraan. Douchekop niet inbegrepen.', desc_status='IMPLEMENTED',
  h1_new='KEEP: "Doucheslang 1,5 m – universeel ½""',
  strengths='Already states "Douchekop niet inbegrepen" in copy and image alt; compatibility (½"/G½ both ends).',
  problems='0 reviews; no GTIN verified in schema (check barcode); title used "1,5 m" only – "150 cm" is the other common query form (now in title).',
  content='None needed.', links='Add from guide doucheslang-kiezen translations (EN/DE/FR/ES lack the product link).', images='OK.', **PRODUCT_COMMON, tech='Add barcode (GTIN) in Admin if the hose has one.', prio='Medium', status='IMPLEMENTED + verified')

r('/products/besjaar-douchefilter', kw='vervangfilter douchekop', sec='douchefilter navulset; douchefilter cartridge; Besjaar vervangfilters', intent='Transactional – refill for owners',
  title_new='Besjaar® | Vervangfilters Douchekop – Set van 2', title_status='IMPLEMENTED',
  desc_new='2 vervangfilters, alleen voor de Besjaar douchekop met filter (10 standen). 3–5 maanden per filter, wisselen zonder gereedschap. Breekt vrij chloor af.', desc_status='IMPLEMENTED',
  h1_new='KEEP: "Vervangfilters – set van 2"',
  strengths='Explicit compatibility ("Niet geschikt voor andere douchekoppen"); explicit "maakt water niet zachter"; custom.introduction metafield set.',
  problems='Old description promised "Gratis verzending in NL vanaf €25" on a €9,99 item – true, but the compatibility restriction is more important for the snippet; only 1 review.',
  content='None (copy already accurate).', links='Link the step-by-step guide from the product page (product FAQ snippet) – recommended.', images='Alt text descriptive; image 8 alt mentions model 1002026.', **PRODUCT_COMMON, tech='—', prio='High', status='IMPLEMENTED + verified')

r('/pages/about-us', kw='over Besjaar; Besjaar merk', sec='Besjaar Assen; Univex', intent='Brand / trust',
  title_new='KEEP: Over Besjaar | Douchekoppen, Douchefilters & Service', title_status='KEEP', desc_new='KEEP', desc_status='KEEP',
  h1_new='Over Besjaar: douchekoppen uit Assen (current: "Douchekoppen. Eén duidelijkere keuze.")',
  strengths='Good title; page body in Admin is strong (Assen, honest filter statement, link to guide).',
  problems='The Admin body is NOT rendered: the template shows generic copy ("Besjaar beweegt weg van een brede algemene webshop…") instead. The H1 does not mention the brand. No company identity (Univex B.V., KvK) in the visible text.',
  content='Render page.content in the about template (sections/main-page.liquid about variant) above the generic tiles, or replace the tiles copy with the Admin body. Add "Besjaar is een merk van Univex B.V., Dr. A.F. Philipsweg 39 A, Assen (KvK 97438650)" once the address question (see Deliverable 4, C5) is resolved.',
  links='→ /pages/reviews, /blogs/gids/is-besjaar-betrouwbaar, /pages/contact-us.', images='—', schema='AboutPage is optional; keep Organization.', tech='Theme change (main-page.liquid / locale nl.json key for the H1).', where='Theme code (main-page.liquid) + locales', risk='Low', test='Preview about page on mobile/desktop.', prio='Medium', status='RECOMMENDED')

r('/pages/faqs', kw='Besjaar veelgestelde vragen', sec='douchekop vragen; levering; retour', intent='Support', title_new='KEEP: Besjaar FAQ | Douchekoppen, Filters, Levering & Retouren', title_status='KEEP', desc_new='KEEP', desc_status='KEEP', h1_new='KEEP',
  strengths='Template-driven FAQ with concrete answers (30 dagen, €25/€2,99, 16:00, G½, 3–5 maanden).', problems='The Admin page body (generic, formal "u", "Absoluut!") is stored but not the visible content – fine, but keep it out of sync risk: delete or align it. No FAQPage markup (correct: FAQ rich results are limited to authoritative gov/health sites since 2023).',
  content='Align Admin body with the template or empty it to avoid confusion.', links='→ /blogs/news/besjaar-douchekop-veelgestelde-vragen (brand FAQ) and vice versa.', images='—', schema='Do not add FAQPage expecting rich results.', tech='—', where='Admin › Pages › Veelgestelde vragen', risk='Low', test='—', prio='Low', status='RECOMMENDED')

r('/pages/contact-us', kw='Besjaar contact', sec='Besjaar klantenservice', intent='Support / navigational', title_new='KEEP: Contact Besjaar | Productadvies & Klantenservice', title_status='KEEP', desc_new='KEEP', desc_status='KEEP', h1_new='KEEP: "Contact Besjaar"',
  strengths='Email, phone, response time (1–2 werkdagen), company line with Univex B.V., address and KvK visible.', problems='Address shown (Dr. A.F. Philipsweg 39 A, 9403 AD) differs from the Legal notice policy (Elbestraat 113, 9406 SV) – see C5. Intro uses "u" while the rest of the site uses "je".',
  content='After C5 is resolved, show "Retouradres" separately if Elbestraat is the warehouse.', links='—', images='—', schema='ContactPoint in Organization already present.', tech='—', where='Admin › Pages › contact-us (body) / theme main-contact', risk='Low', test='—', prio='Medium', status='RECOMMENDED')

r('/pages/reviews', kw='Besjaar reviews; Besjaar ervaringen', sec='Besjaar beoordelingen', intent='Brand / trust',
  title_new='Besjaar® | Reviews & Ervaringen met Douchekoppen', title_status='IMPLEMENTED', desc_new='KEEP', desc_status='KEEP', h1_new='KEEP: "Klantbeoordelingen"',
  strengths='Transparent about review origin (imported from bol.com) – required under EU Omnibus rules; no review markup.',
  problems='Formal "u" register; linked to noindexed /collections/all; did not link the "Is Besjaar betrouwbaar?" guide or the Trustpilot article.',
  content='DONE (live): "u" → "je"; link to /collections/showerhead; links to Trustpilot article and is-besjaar-betrouwbaar.', links='ADDED: see content.', images='—', schema='Do not add AggregateRating built from imported reviews.', tech='—', where='Admin › Pages › Klantbeoordelingen', risk='Body translations outdated.', test='Re-crawled live: OK.', prio='Medium', status='IMPLEMENTED + verified')

r('/pages/zakelijk', kw='douchekoppen zakelijk bestellen; douchekoppen groothandel', sec='B2B douchekoppen', intent='B2B lead', title_new='KEEP', title_status='KEEP', desc_new='KEEP', desc_status='KEEP', h1_new='KEEP',
  strengths='Clear H1 with "douchekoppen", form.', problems='Only 1 inbound link from main content.', content='—', links='Link from footer (already) and from about page.', images='—', schema='—', tech='—', where='—', risk='—', test='—', prio='Low', status='RECOMMENDED')

r('/pages/besjaar-club', kw='Besjaar Club', sec='korting vervangfilters', intent='Loyalty', title_new='KEEP', title_status='KEEP', desc_new='KEEP', desc_status='KEEP', h1_new='KEEP', strengths='Brand-first title; MemberProgram schema.', problems='—', content='—', links='Now linked from /collections/shower-filter.', images='—', schema='Keep MemberProgram.', tech='—', where='—', risk='—', test='—', prio='Low', status='KEEP')

r('/pages/track-order', kw='— (utility, noindex)', sec='—', intent='Utility', title_new='KEEP', title_status='KEEP', desc_new='KEEP', desc_status='KEEP', h1_new='KEEP', strengths='Correctly noindex,follow.', problems='Listed in sitemap while noindex (Shopify adds all published pages). Harmless; could set seo.hidden=1 to also drop it from the sitemap.', content='—', links='—', images='—', schema='—', tech='Optional: metafield seo.hidden = 1.', where='Admin › Pages › Bestelling volgen', risk='Low', test='—', prio='Low', status='RECOMMENDED')

r('/blogs/gids', kw='douchekop advies; douchefilter gids', sec='douche tips', intent='Informational hub',
  title_new='Besjaar® | Gids: Douchekop & Douchefilter Advies', title_status='IMPLEMENTED', desc_new='KEEP', desc_status='KEEP', h1_new='KEEP: "Gids"',
  strengths='35 articles, good intro, Blog JSON-LD.', problems='Blog tag pages (/blogs/gids/tagged/…) were indexable and copied this description.', content='—', links='—', images='—', schema='Keep.', tech='Tag pages noindex (preview theme).', where='Admin › Blogs › Gids; theme meta-tags.liquid', risk='Low', test='Preview verified: /blogs/gids/tagged/douchefilter → noindex,follow.', prio='Medium', status='IMPLEMENTED (title) / PREVIEW (tag noindex)')

r('/blogs/news', kw='douchetips; Besjaar nieuws', sec='douchekop tips; productnieuws', intent='News / brand updates',
  title_new='Besjaar® | Douchetips, Productnieuws & Acties', title_status='IMPLEMENTED',
  desc_new='Douchetips en nieuws van Besjaar: productvergelijkingen, nieuwe gidsen, acties en de Besjaar Club. Voor een betere douche met minder water.', desc_status='IMPLEMENTED',
  h1_new='Douchetips & nieuws (was "Nieuws"; EN "News" → "Shower tips & news", DE "Dusch-Tipps & Neuigkeiten", FR "Conseils douche & actualités", ES "Consejos de ducha y novedades"). URL /blogs/news unchanged.',
  strengths='Distinct purpose from Gids (brand news, comparisons, seasonal).', problems='Generic H1; showed the Gids kicker and Gids intro (identical intro on both blog indexes in all 5 languages); some articles overlap Gids topics (lage waterdruk).',
  content='DONE: blog title. PREVIEW: own kicker "NIEUWS / BESJAAR" + own intro per language.', links='—', images='—', schema='Blog name follows the new title.', tech='—', where='Admin › Blogs › Nieuws; theme main-blog.liquid', risk='Low', test='Live H1 verified (NL + DE). Preview intro verified (NL + EN).', prio='Medium', status='IMPLEMENTED (title/H1) / PREVIEW (intro)')

for pol in ['shipping-policy','refund-policy','privacy-policy','terms-of-service','legal-notice','contact-information']:
    r('/policies/'+pol, kw='— (legal)', sec='—', intent='Legal / trust', title_new='KEEP (Shopify policy title)', title_status='KEEP',
      desc_new='Theme fallback: "<Policy title> van Besjaar (Univex B.V., Assen), de officiële webshop voor douchekoppen en douchefilters. Vragen? Mail naar info@univexbv.com." (localized in 5 languages)', desc_status='PREVIEW',
      h1_new='KEEP', strengths='Present and linked in footer.', problems='Empty meta description (content="").' + (' Shipping policy text said "Nederland: altijd gratis verzending, op elke bestelling" – contradicts checkout (€2,99 below €25).' if pol=='shipping-policy' else '') + (' Address Elbestraat 113, 9406 SV differs from the contact/schema address.' if pol=='legal-notice' else ''),
      content=('Replace the NL bullet with: "Nederland: een vast tarief van €2,99. Bestellingen vanaf €25: gratis verzending." (exact HTML in Deliverable 5, M1).' if pol=='shipping-policy' else '—'),
      links='—', images='—', schema='—', tech='Description fallback in seo-head.liquid (preview theme).', where=('Settings › Policies (Shipping) – API access lacks write_legal_policies' if pol=='shipping-policy' else 'theme seo-head.liquid'), risk='Low', test='Preview verified for shipping (NL) and refund (DE).', prio=('Critical' if pol=='shipping-policy' else 'Low'), status=('MANUAL (text) / PREVIEW (description)' if pol=='shipping-policy' else 'PREVIEW'))

# Articles: (primary keyword, intent, decision, content/links action, priority)
A = {
'gids/kalkaanslag-douchekop-verwijderen': ('kalkaanslag douchekop verwijderen; douchekop ontkalken','How-to','KEEP title/description','Make this the hub for "douchekop ontkalken": add a "hoe vaak ontkalken per waterhardheid" table and link azijn-of-citroenzuur as the deep dive; avoid repeating the full step-by-step in both articles.','Medium'),
'gids/douchefilter-zin-of-onzin': ('douchefilter zin of onzin','Informational → commercial','KEEP','Refresh EN/DE/FR/ES body translations (outdated since 2026-11-06; they miss the new link to /collections/douchekop-met-filter).','Medium'),
'gids/waterbesparende-douchekop-hoeveel-bespaar-je': ('waterbesparende douchekop besparing','Informational / calculation','KEEP','Reconcile with the Milieu Centraal threshold (≤ 7,2 l/min) used in other guides: say plainly that Besjaar heads use max. 8 l/min, show the 12 → 8 l/min calculation with dated 2026 water and gas tariffs and their source. Expand from 410 words with a table (1–4 persons).','High'),
'gids/douchekop-vervangen-in-5-minuten': ('douchekop vervangen; douchekop monteren','How-to','KEEP','Expand (352 words): which end of the hose has the conical nut, when to use teflon tape, what to do if it leaks, link doucheslang-kiezen + douchekop-vervangen-huurwoning. No HowTo markup (Google retired HowTo rich results).','Medium'),
'gids/waterhardheid-per-provincie': ('waterhardheid per provincie; waterhardheid postcode','Informational','KEEP','Add "laatst gecontroleerd" date and the drinking-water companies used as sources.','Low'),
'gids/douchekop-kalk-5-signalen': ('douchekop kalk; douchekop verstopt','Diagnostic','KEEP','Link to the ontkalken hub as next step.','Low'),
'news/lage-waterdruk-in-de-douche-zo-krijg-je-een-krachtigere-waterstraal': ('lage waterdruk douche','Troubleshooting','Description ADDED (was missing → 320-char excerpt fallback)','Overlaps gids/douchekop-lage-waterdruk. Move to the Gids blog as "Lage waterdruk in de douche: 7 oorzaken en oplossingen" (301 old URL), keep the Gids article focused on choosing a showerhead, cross-link both. It has 0 links to other articles.','Medium'),
'gids/hard-water-haar': ('hard water haar','Informational','KEEP','Only 1 inbound link: link from kalk-water-droge-huid and douchefilter-zin-of-onzin. Add alt to its featured image (alt is empty in Admin).','Low'),
'news/besjaar-gids-in-vijf-talen': ('—','Announcement','KEEP','0 inbound internal links (orphan). Low value: either link it from wat-is-besjaar or unpublish + 301 to /blogs/gids if it gets no traffic in GSC. Featured image alt empty.','Low'),
'gids/kalk-water-droge-huid': ('kalk droge huid; hard water eczeem','Informational (health-adjacent)','KEEP','Keep claims cautious; cite the studies by name/year; no promise that a filter helps.','Medium'),
'gids/douchekop-ontkalken-azijn-of-citroenzuur': ('douchekop ontkalken azijn of citroenzuur','Comparison how-to','KEEP','Focus on the comparison; link the hub for the full routine.','Medium'),
'gids/kalkvlekken-douchewand-voorkomen': ('kalkvlekken douchewand','How-to','KEEP','—','Low'),
'news/wat-is-besjaar': ('wat is Besjaar','Brand','KEEP','Link besjaar-gids-in-vijf-talen; keep consistent with /pages/about-us.','Low'),
'news/besjaar-assortiment-welke-douchekop': ('welke Besjaar douchekop; Besjaar douchekoppen vergelijken','Brand comparison','KEEP as the canonical range comparison','Merge the unique parts of besjaar-douchekoppen-twee-designs-vergeleken into this article, then 301 that article here.','Medium'),
'news/besjaar-douchekop-veelgestelde-vragen': ('Besjaar douchekop vragen','Brand FAQ','KEEP','Cross-link with /pages/faqs.','Low'),
'news/besjaar-webshop-of-bol-com': ('Besjaar bol.com','Brand','KEEP','—','Low'),
'news/besjaar-club-ledenvoordeel': ('Besjaar Club','Loyalty','KEEP','—','Low'),
'gids/waterontharder-of-douchefilter': ('waterontharder of douchefilter','Comparison','KEEP','—','Low'),
'gids/chloor-in-kraanwater-nederland': ('chloor in kraanwater','Informational','KEEP','Re-translate meta_title (EN/FR/ES outdated).','Low'),
'gids/hoe-werkt-een-douchefilter': ('hoe werkt een douchefilter','Informational','KEEP','Refresh body translations (outdated; they miss the internal links added in NL).','Medium'),
'gids/hoge-druk-douchekop-wat-betekent-dat': ('hoge druk douchekop','Informational','KEEP','Honest about 8 vs 7,2 l/min – keep. Now linked from /collections/showerhead.','Low'),
'gids/doucheslang-kiezen': ('doucheslang kiezen; doucheslang vervangen','Buying guide','KEEP','Refresh body translations (outdated; EN/DE/FR/ES lack the link to the doucheslang product).','Medium'),
'gids/pauzeknop-douchekop-besparen': ('douchekop met pauzeknop','Informational','KEEP','—','Low'),
'news/hond-wassen-onder-de-douche': ('hond wassen douche','Lifestyle','KEEP','—','Low'),
'gids/douchefilter-kosten-per-jaar': ('douchefilter kosten','Calculation','KEEP','Check that the €12–20/year figure matches €9,99 per set of 2 and the 20% Club price.','Low'),
'gids/douchefilter-vervangen-stappenplan': ('douchefilter vervangen','How-to','KEEP title','Thin (286 words) for the primary "douchefilter vervangen" query: add when to replace (signals + 3–5 months), compatible models only, what to do if it leaks after replacement, disposal, and link the refill product. Now linked from /collections/shower-filter.','High'),
'news/douchekop-cadeau-sinterklaas-kerst': ('douchekop cadeau','Seasonal','KEEP','Check prices before 5 December (article quotes €9,99–€30,99).','Low'),
'news/douche-doorspoelen-na-vakantie': ('douche doorspoelen na vakantie','Health-adjacent how-to','KEEP','Align with RIVM/legionella guidance and cite it.','Low'),
'gids/douchekop-lekt-oplossen': ('douchekop lekt','Troubleshooting','KEEP','Refresh body translations (outdated).','Low'),
'gids/roze-zwarte-aanslag-douche': ('roze aanslag douche','Informational','KEEP','Re-translate meta_title (EN/DE/FR outdated).','Low'),
'gids/wat-kost-een-douchebeurt-emmertest': ('wat kost een douchebeurt','Calculation','KEEP','Date-stamp the 2026 tariffs and name the source.','Low'),
'gids/douchekop-vervangen-huurwoning': ('douchekop vervangen huurwoning','Informational (legal)','KEEP','Name the legal basis (Besluit kleine herstellingen) and link it.','Low'),
'gids/doucheafvoer-stinkt-of-loopt-traag': ('doucheputje stinkt','Troubleshooting','KEEP','Off-core but useful; no change.','Low'),
'gids/douchekop-lage-waterdruk': ('douchekop lage waterdruk','Buying guide','KEEP','Differentiate from the news troubleshooting article (see above) and cross-link.','Medium'),
'gids/douchekop-hoge-waterdruk': ('hoge waterdruk douche','Buying guide','KEEP','—','Low'),
'news/gasprijs-omhoog-douche-besparen': ('douchen kosten gasprijs','News (time-sensitive)','KEEP','Cite the tariff source for "per 1 oktober 2026".','Low'),
'news/nieuw-in-de-gids-oktober-2026': ('—','Announcement','KEEP','Low value; fine as news.','Low'),
'gids/beste-douchekop-met-filter-vergeleken': ('beste douchekop met filter','Commercial investigation','KEEP','Add method + "prijzen gecontroleerd op <datum>" next to competitor prices; refresh translations (EN version has no product links). Now linked from both filter-related collections.','High'),
'gids/is-besjaar-betrouwbaar': ('Besjaar betrouwbaar; Besjaar ervaringen','Brand trust','KEEP','States "4,7 van 5 uit 437 reviews" while the homepage says 433 – use one dated figure from bol.com. Now linked from /pages/reviews.','Medium'),
'gids/douchekop-met-filter-belgie': ('douchekop met filter België','Informational (BE)','KEEP','—','Low'),
'gids/regendouche-of-handdouche': ('regendouche of handdouche','Comparison','KEEP','Now linked from /collections/showerhead (was 1 inbound link).','Low'),
'gids/douche-woordenboek': ('douche begrippen','Glossary','Description → "Van G½ en anti-draai tot volumestroomklasse: 27 begrippen over douchekoppen, doucheslangen, water en filters, elk kort en helder uitgelegd." (current 107 chars)','—','Low'),
'gids/douchekop-met-filter-duitsland': ('Duschkopf mit Filter Deutschland (via DE translation)','Informational (DE)','KEEP','Translate the handle in DE (currently Dutch slug under /de/).','Low'),
'gids/douchekop-met-filter-frankrijk': ('pommeau de douche filtrant France (via FR)','Informational (FR)','KEEP','Translate the handle in FR.','Low'),
'gids/douchekop-met-filter-spanje': ('alcachofa con filtro España (via ES)','Informational (ES)','KEEP','Translate the handle in ES.','Low'),
'gids/douchen-boiler-warmtepomp-hoe-lang': ('hoe lang douchen boiler','Calculation','KEEP','Translate handles.','Low'),
'gids/douchekop-vervangen-wanneer': ('wanneer douchekop vervangen','Informational','KEEP','No product/collection link yet: add one to /collections/showerhead. Translate handles.','Low'),
'news/besjaar-op-trustpilot': ('Besjaar Trustpilot','Brand trust','KEEP','Now linked from /pages/reviews.','Low'),
'news/besjaar-douchekoppen-twee-designs-vergeleken': ('Besjaar douchekoppen vergeleken','Brand comparison','Description ADDED (was missing)','NOT translated: /de /en /fr /es served Dutch text with foreign lang + hreflang. Metafield custom.primary_locale_only=true set; preview theme noindexes those 4 URLs. Longer-term: merge into besjaar-assortiment-welke-douchekop and 301.','Medium'),
}
