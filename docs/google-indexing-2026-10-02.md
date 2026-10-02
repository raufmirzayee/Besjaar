# Why besjaar.eu is not in Google — 2 Oct 2026

## Short answer

The Besjaar theme does not block Google. The cause is the **domain setup**.
One Shopify store serves the same shop on several websites, and Google indexed
the older ones instead of www.besjaar.eu.

## Theme check: Besjaar vs Univex

Checked: `layout/theme.liquid`, `snippets/seo-head.liquid`, `snippets/meta-tags.liquid`, robots template.

| Check | Besjaar (live theme) | Univex |
|---|---|---|
| `robots` meta | `index,follow`. `noindex` only on search, cart, account, 404, `/collections/all`, filtered or tag pages, tracking | none (Shopify default = indexable) |
| Canonical | `<link rel="canonical">` (now fixed, see below) | `<link rel="canonical">` |
| Google verification tag | `ET57Ssi2…` (besjaar property) | `2wYZJLPV…` (a different property) |
| `templates/robots.txt.liquid` | none (Shopify default robots.txt + sitemap) | none |
| Content in HTML | server-rendered, nothing hidden until JS | server-rendered |
| Password protection | off | — |

Nothing in the Besjaar theme stops Google reading the site or the sitemap. The
Univex theme does nothing extra that Besjaar lacks.

## What actually holds besjaar.eu back

1. **One store, four separate websites with the same catalogue.** In Shopify,
   each of these has its own web presence and serves the full shop:
   - www.besjaar.eu (primary; nl, de, fr, en, es)
   - www.slimhome.nl (nl, de, fr, en)
   - www.bestezaklampen.nl (nl)
   - bc8d9f-69.myshopify.com

   Every copy told Google it was the original, because Shopify's canonical
   uses the domain that served the page. Google keeps one copy and prefers
   the older domain.

   In search today, bestezaklampen.nl has the homepage titled "Besjaar" and
   old flashlight pages indexed. besjaar.eu has only one indexed page (a guide).

2. **Old flashlight pages.** Google still lists bestezaklampen.nl product pages
   for the flashlights. Those 9 products are now *Draft*, so the URLs return 404.
   That is fine; they drop out by themselves.

3. **Search Console "Couldn't fetch".** Usually one of:
   - The property is `https://besjaar.eu/` (without www) or `http://`. The
     sitemap URL then redirects to `https://www.besjaar.eu/…`, which is outside
     that property.
   - The sitemap was added to the wrong property, e.g. the Univex/slimhome one.
     The two themes carry different verification tags.
   - A new submission sits on "Couldn't fetch" for a while before Google
     processes it.

## Fixed in the theme

Preview theme `Besjaar – Google canonical 2 okt (preview)` (id 201811820871),
copied from the live theme. Commit 96fd2ca, checksums verified.

- The canonical link and `og:url` always point to **www.besjaar.eu**, whatever
  domain served the page. On www.besjaar.eu itself nothing changes.
- Publishing this theme makes slimhome.nl, bestezaklampen.nl and myshopify
  pages tell Google the original is on www.besjaar.eu.

## To do in Shopify Admin (owner)

1. **Publish** the preview theme 201811820871 (Online Store › Themes).
2. **Settings › Domains:** make the extra domains redirect to the primary
   domain instead of serving their own copy:
   - `www.slimhome.nl` / `slimhome.nl`
   - `www.bestezaklampen.nl` / `bestezaklampen.nl`

   In Settings › Markets / Domains, remove them as separate web presences or
   set them to *Redirect to www.besjaar.eu*. This is the real fix: Google then
   gets a 301 to besjaar.eu and moves the existing ranking over. Skip this only
   if slimhome.nl must stay a separate shop, which would need a separate store.
3. **Google Search Console:**
   - Add a **Domain property** `besjaar.eu` (DNS TXT record at the registrar),
     or a URL-prefix property exactly `https://www.besjaar.eu/`.
   - Sitemaps › submit `sitemap.xml`. The full URL is
     `https://www.besjaar.eu/sitemap.xml`.
   - URL Inspection › `https://www.besjaar.eu/` › *Request indexing*. Do the
     same for the two collections and the 5 products.
   - Also add the old domains as properties (bestezaklampen.nl, slimhome.nl).
     After the redirects are live, use *Settings › Change of address* from
     bestezaklampen.nl to besjaar.eu.
4. Expect days to a few weeks before Google shows the new pages.
