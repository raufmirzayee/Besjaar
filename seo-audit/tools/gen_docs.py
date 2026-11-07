import json, re, sys, collections, csv
sys.path.insert(0, '/tmp/claude-0/-home-user-Besjaar/c422f68a-66fe-5d1a-9550-db9e9d78e385/scratchpad/tools')
from recs import H, A
B = 'https://www.besjaar.eu'
SP = '/tmp/claude-0/-home-user-Besjaar/c422f68a-66fe-5d1a-9550-db9e9d78e385/scratchpad'
OUT = '/home/user/Besjaar/seo-audit'
crawl = {x['url']: x for x in json.load(open(SP + '/crawl/crawl_final.json'))}
inv = {r['url']: r for r in csv.DictReader(open(OUT + '/data/01-existing-seo-inventory-all-urls.csv'))}
arts = {a['blog']['handle'] + '/' + a['handle']: a for a in json.load(open(SP + '/admin/article_bodies.json'))['data']['articles']['nodes']}

def esc(s):
    return (s or '').replace('|', '\\|').replace('\n', ' ')

def loc(u):
    m = re.match(r'https://www\.besjaar\.eu/(de|fr|en|es)(/|$)', u); return m.group(1) if m else 'nl'

nl_rows = [r for r in inv.values() if r['locale'] == 'nl' and r['url'].startswith(B) and r['http_status'] == '200' and '?' not in r['url'] and '/collections/showerhead/products' not in r['url']]
order = ['home', 'collection', 'product', 'page', 'blog', 'article', 'policy', 'search', 'other']
nl_rows.sort(key=lambda r: (order.index(r['type']), r['url']))

# ---------------- Deliverable 1 ----------------
o = []
o.append('# Deliverable 1 — Existing SEO inventory (verified)\n')
o.append('**Captured:** 2026-11-07, 18:37–19:05 UTC, before any change in this audit. **Method:** raw HTML of every URL in `sitemap.xml` (all 25 child sitemaps, 5 languages) plus policy pages and test URLs, fetched with a desktop Chrome user agent, no JavaScript. Values below are copied verbatim from the HTML `<title>`, `<meta name="description">`, `<h1>`, `<link rel="canonical">` and `<meta name="robots">`. Shopify Admin values (SEO fields, translations, theme code) were used to explain *why* a value renders, never to replace what the HTML shows.\n')
o.append('**Coverage:** 356 of 356 URLs returned HTTP 200 (plus one deliberate 404 test). 20 localized blog URLs were rate-limited (HTTP 429) on the first two passes and fetched on a third, single-threaded pass. Full per-URL data, including all 280 localized URLs, OG tags, hreflang sets, JSON-LD types, image/alt counts and inbound-link counts: [`data/01-existing-seo-inventory-all-urls.csv`](data/01-existing-seo-inventory-all-urls.csv).\n')
o.append('**Google search-result titles were not used.** Where this table differs from titles observed in the brief (e.g. "News – Besjaar"), the HTML value is authoritative: "News" is the H1 of `/en/blogs/news`; the Dutch blog H1 was "Nieuws".\n')
# summary per locale
o.append('## Site-wide summary per language\n')
o.append('| Language | Indexable URLs | Duplicate titles | Duplicate descriptions | Missing/empty descriptions | Titles > 60 chars | Descriptions > 160 chars | noindex URLs | Pages with `<img>` lacking alt attribute |')
o.append('|---|---|---|---|---|---|---|---|---|')
for L in ['nl', 'en', 'de', 'fr', 'es']:
    rows = [r for r in inv.values() if r['locale'] == L and r['http_status'] == '200' and r['url'].startswith(B) and '?' not in r['url'] and '/collections/showerhead/products' not in r['url']]
    idx = [r for r in rows if 'noindex' not in r['meta_robots']]
    t = collections.Counter(r['title'] for r in idx); d = collections.Counter(r['meta_description'] for r in idx if r['meta_description'] not in ('', '(missing)'))
    o.append(f"| {L} | {len(idx)} | {sum(1 for v in t.values() if v > 1)} | {sum(1 for v in d.values() if v > 1)} | {sum(1 for r in idx if r['meta_description'] in ('', '(missing)'))} | {sum(1 for r in idx if int(r['title_len'] or 0) > 60)} | {sum(1 for r in idx if int(r['description_len'] or 0) > 160)} | {len(rows) - len(idx)} | {sum(1 for r in rows if int(r['images_no_alt_attr'] or 0) > 0)} |")
o.append('\nAll indexable URLs: exactly one `<h1>`, one `<title>`, one meta description tag, a self-referencing canonical on the primary domain `https://www.besjaar.eu`, `<html lang>` matching the URL language, and a complete reciprocal hreflang set (nl, de, fr, en, es + x-default → Dutch). No JSON-LD parse errors on any page. `besjaar.eu` and `http://` 301 to `https://www.besjaar.eu/`; `/collections/showerhead/products/…` 301s to `/products/…`; `?page=2` keeps its own canonical.\n')
o.append('## Dutch (primary market) — every indexable URL\n')
o.append('Columns: exact title · exact meta description · exact H1 · robots · JSON-LD types · words in `<main>` · inbound internal links (from all 356 crawled pages). Canonical = the URL itself on every row (verified).\n')
o.append('| URL | Type | Title (exact) | Meta description (exact) | H1 (exact) | Robots | JSON-LD types | Words | Inbound links |')
o.append('|---|---|---|---|---|---|---|---|---|')
for r in nl_rows:
    p = r['url'].replace(B, '') or '/'
    can_ok = 'self' if r['canonical'] == r['url'] else esc(r['canonical'])
    o.append(f"| `{p}` | {r['type']} | {esc(r['title'])} ({r['title_len']}) | {esc(r['meta_description'])} ({r['description_len']}) | {esc(r['h1'])} | {r['meta_robots'].split(',')[0]} | {esc(r['jsonld_types'])} | {r['word_count_main']} | {r['inbound_internal_links']} |")
o.append('\n## Verified issues found in the inventory\n')
issues = [
 ('Critical', 'Shipping policy text says "Nederland: altijd gratis verzending, op elke bestelling". Checkout (Settings › Shipping, read via Admin API) charges €2,99 below €25. Product/collection snippets and the theme correctly say "gratis vanaf €25".', '/policies/shipping-policy'),
 ('High', 'Claim conflict: every product is called "waterbesparend" at "max. 8 l/min", while 6 guides cite Milieu Centraal that a showerhead counts as water-saving at ≤ 7,2 l/min. No test pressure or test report for the 8 l/min figure is published.', 'products, collections, homepage, guides'),
 ('High', 'Company address differs: contact page, theme settings and Organization JSON-LD use "Dr. A.F. Philipsweg 39 A, 9403 AD Assen"; the Legal notice policy and the refund (return) address use "Elbestraat 113, 9406 SV Assen".', '/pages/contact-us, /policies/legal-notice, /policies/refund-policy'),
 ('High', '`news/besjaar-douchekoppen-twee-designs-vergeleken` has no translations but is in the de/en/fr/es sitemaps, served with `lang="de"` etc. and Dutch text (4 wrong-language duplicates).', '/{de,en,fr,es}/blogs/news/besjaar-douchekoppen-twee-designs-vergeleken'),
 ('Medium', 'Both blog indexes printed the same kicker ("GIDS / BESJAAR") and the same intro paragraph, in all 5 languages; the news index H1 was the generic "Nieuws"/"News".', '/blogs/news (+4 languages)'),
 ('Medium', 'Product descriptions: the two filter models shared an identical opening paragraph; the no-hose filter model never said the hose is not included; 3-setting models had no connection (G½) spec and no "niet inbegrepen" line.', '4 product pages'),
 ('Medium', 'Two articles had no meta description, so Shopify printed a 320-character body excerpt (all 5 languages).', 'news/lage-waterdruk-…, news/besjaar-douchekoppen-twee-designs-vergeleken'),
 ('Medium', 'About page renders generic template copy; the merchant-written body (Assen, honest filter note) is not shown; H1 "Douchekoppen. Eén duidelijkere keuze." does not name the brand.', '/pages/about-us'),
 ('Medium', 'Policy pages output `<meta name="description" content="">` (6 pages × 5 languages).', '/policies/*'),
 ('Low', 'Blog tag pages are indexable and duplicate the blog description (only collection tag pages were noindexed).', '/blogs/*/tagged/*'),
 ('Low', 'Two product-page video posters have no alt attribute (Lighthouse SEO 92 on product pages).', 'filter products (all languages)'),
 ('Low', 'Weakly linked pages: besjaar-gids-in-vijf-talen (0 inbound), is-besjaar-betrouwbaar, regendouche-of-handdouche, hard-water-haar (1 each), beste-douchekop-met-filter-vergeleken (2).', 'articles'),
 ('Low', 'Organization JSON-LD `url` is `https://besjaar.eu` (non-www) and `sameAs` points to a bol.com product listing instead of the bol.com brand page.', 'all pages'),
 ('Low', '29 localized descriptions exceed 160 characters (mostly the 320-char excerpt fallbacks above); 34 titles exceed 60 characters (mostly long localized article titles).', 'localized'),
]
o.append('| Priority | Issue | Where |'); o.append('|---|---|---|')
for p, t, w in issues: o.append(f'| {p} | {t} | {w} |')
o.append('\n## Items that could not be verified (and how to verify)\n')
o.append('''| Item | Status | How to verify |
|---|---|---|
| Field Core Web Vitals (CrUX: LCP/INP/CLS at p75) | NOT VERIFIED – the anonymous PageSpeed Insights API quota was exhausted and no CrUX key is available | Search Console › Core Web Vitals, or pagespeed.web.dev for `/`, `/collections/showerhead`, one product, one article |
| Google index status, canonical chosen by Google, impressions/clicks | NOT VERIFIED – no Search Console access | GSC › Pages (indexing), URL Inspection for the URLs in Deliverable 2, Performance export (3 and 6 months) |
| Merchant Center feed and listing issues | NOT VERIFIED – no Merchant Center access | Merchant Center › Products › Diagnostics; compare price/availability/shipping with the Product JSON-LD |
| bol.com rating (homepage says 4,7 / 433 reviews; a guide says 437) | NOT VERIFIED – bol.com is blocked from this environment | Open the bol.com brand page and update both figures with a date |
| `www.bestezaklampen.nl` redirect | NOT VERIFIED – unreachable from here. `www.slimhome.nl` verified: 301 → `https://www.besjaar.eu/` | `curl -I https://www.bestezaklampen.nl/` must return 301 to www.besjaar.eu |
| Flow rate test conditions (8 l/min) and low-pressure performance | NOT VERIFIED – no test report published or found in Admin | Ask the supplier for the EN 1112 / flow test report (pressure in bar) |
| Filter effectiveness (chlorine reduction %) | NOT VERIFIED – no lab report; the site only claims "breekt vrij chloor af" without a percentage (acceptable) | Keep claims qualitative unless a lab report is available |
''')
open(OUT + '/01-existing-seo-inventory.md', 'w').write('\n'.join(o))

# ---------------- Deliverable 3 ----------------
o = []
o.append('# Deliverable 3 — Before-and-after SEO plan, page by page\n')
o.append('Format per page as requested: **A. Existing SEO – verified** (copied from the live HTML captured before changes) · **B. Recommended SEO** · **C. Implementation** · **D. Status**. Status values: *IMPLEMENTED + verified* = changed via the Shopify Admin API and re-crawled live on 2026-11-07 19:20 UTC; *PREVIEW* = applied to the unpublished theme "Besjaar – SEO audit 2026-11-07 (preview)" (id 204218663239) and verified in preview; *MANUAL* = needs merchant action or an access scope this session did not have; *RECOMMENDED* = not changed.\n')
o.append('**Title rule applied:** `Besjaar® | Primary keyword – Key benefit` for commercial and brand pages (homepage already followed it). The theme appends " – Besjaar" only when a title lacks "Besjaar", so brand-first titles are never double-branded. **Guide articles keep question-first titles with the brand at the end** — for informational queries the searcher\'s question has to lead the title; this is the "where appropriate" exception in the brief.\n')
o.append('Localized versions (en/de/fr/es) follow the same structure; their exact current values are in the inventory CSV. Localized brand-first SEO titles were registered for all 6 products, 3 collections, the reviews page and both blogs (see Deliverable 5).\n')

def block(path, r=None):
    u = B + path
    c = crawl.get(u, {}); iv = inv.get(u, {})
    hs = [f"{h[0]}: {h[1]}" for h in c.get('headings_main', []) if h[0] in ('h2', 'h3')]
    s = []
    s.append(f"### `{path}`\n")
    s.append('**A. Existing SEO — verified**\n')
    s.append(f"- Current title: `{iv.get('title','NOT VERIFIED')}` ({iv.get('title_len','')} chars)")
    s.append(f"- Current meta description: `{iv.get('meta_description','NOT VERIFIED')}` ({iv.get('description_len','')} chars)")
    s.append(f"- Current H1: `{iv.get('h1','NOT VERIFIED')}`")
    s.append(f"- Current headings (H2/H3, first 12): {'; '.join(hs[:12]) if hs else 'none in <main>'}")
    s.append(f"- Current canonical: {'self (' + iv.get('canonical','') + ')' if iv.get('canonical') == u else iv.get('canonical','NOT VERIFIED')}")
    s.append(f"- Current robots: `{iv.get('meta_robots','')}`; hreflang: {iv.get('hreflang_count','')} ({iv.get('hreflang_langs','')}); in sitemap: {iv.get('in_sitemap','')}")
    s.append(f"- Current schema types: {iv.get('jsonld_types','')}")
    s.append(f"- Content: {iv.get('word_count_main','')} words in `<main>`; images {iv.get('images_total','')} (no alt attribute: {iv.get('images_no_alt_attr','')}, empty alt in main: {iv.get('main_images_empty_alt','')}); inbound internal links: {iv.get('inbound_internal_links','')}")
    if r:
        s.append(f"- Current target keywords (observed from title/H1): {r['kw']}")
        s.append(f"- Existing strengths: {r['strengths']}")
        s.append(f"- Existing problems: {r['problems']}\n")
        s.append('**B. Recommended SEO**\n')
        s.append(f"- Primary keyword: {r['kw'].split(';')[0]}")
        s.append(f"- Secondary keywords: {r['sec']}")
        s.append(f"- Search intent: {r['intent']}")
        s.append(f"- Proposed SEO title: `{r['title_new']}` — {r['title_status']}")
        s.append(f"- Proposed meta description: `{r['desc_new']}` — {r['desc_status']}")
        s.append(f"- Proposed H1: {r['h1_new']}")
        s.append(f"- Content changes: {r['content']}")
        s.append(f"- Internal links to add: {r['links']}")
        s.append(f"- Image optimizations: {r['images']}")
        s.append(f"- Structured-data changes: {r['schema']}")
        s.append(f"- Technical changes: {r['tech']}\n")
        s.append('**C. Implementation**\n')
        s.append(f"- Where: {r['where']}")
        s.append(f"- Existing value replaced: see A (title/description) — full previous HTML in `backups/`")
        s.append(f"- Risks: {r['risk']}")
        s.append(f"- Tests: {r['test']}")
        s.append(f"- Priority: **{r['prio']}**\n")
        s.append(f"**D. Status:** {r['status']}\n")
    return '\n'.join(s)

sections = [('Homepage', ['/']), ('Collections', ['/collections/showerhead', '/collections/douchekop-met-filter', '/collections/shower-filter']),
            ('Products', [p for p in H if p.startswith('/products/')]), ('Brand, trust and support pages', [p for p in H if p.startswith('/pages/')]),
            ('Blog indexes', ['/blogs/gids', '/blogs/news']), ('Policy pages', [p for p in H if p.startswith('/policies/')])]
for name, paths in sections:
    o.append(f'## {name}\n')
    for p in paths: o.append(block(p, H[p]))

o.append('## Articles (49 published)\n')
o.append('Every article was checked for: a unique search intent, its exact title/description/H1/headings, date, internal links, sources, and filter/limescale claims. **No published article claims that the filter softens water or removes dissolved limescale** (the only such sentences are in two *unpublished* drafts — see Deliverable 4, C1). BlogPosting + BreadcrumbList JSON-LD is emitted once per article by the theme (no duplicates). FAQ/HowTo markup is deliberately not added (no rich results for this site type).\n')
o.append('| Article | Published | Title (exact, before) | Meta description (exact, before) | H1 (exact) | H2 count | Words | Inbound | Primary keyword / intent | Decision | Content / link actions | Priority | Status |')
o.append('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for h, (kw, intent, dec, act, prio) in A.items():
    u = B + '/blogs/' + h
    iv = inv.get(u, {}); c = crawl.get(u, {})
    a = arts.get(h, {})
    h2 = sum(1 for x in c.get('headings_main', []) if x[0] == 'h2')
    st = 'IMPLEMENTED + verified' if 'ADDED' in dec else ('PREVIEW (noindex non-NL) + RECOMMENDED' if 'twee-designs' in h else 'RECOMMENDED' if act != '—' else 'KEEP')
    o.append(f"| `{h}` | {(a.get('publishedAt') or '')[:10]} | {esc(iv.get('title'))} | {esc(iv.get('meta_description'))[:170]} | {esc(iv.get('h1'))} | {h2} | {iv.get('word_count_main','')} | {iv.get('inbound_internal_links','')} | {esc(kw)} — {intent} | {esc(dec)} | {esc(act)} | {prio} | {st} |")
open(OUT + '/03-before-after-plan.md', 'w').write('\n'.join(o))
print('written')
