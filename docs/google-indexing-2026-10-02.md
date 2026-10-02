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

- **Canonical and `og:url` on the primary domain** (commit 96fd2ca).
  - The canonical link and `og:url` always point to **www.besjaar.eu**, whatever
    domain served the page. On www.besjaar.eu itself nothing changes.
  - It was uploaded to 201811820871, but Shopify's background theme copy overwrote
    it about 25 seconds later. That theme was then published **without** the fix.
  - Re-applied on preview theme 201817555271 after the copy had finished.
    Checksums were verified twice.
- **bol.com brand link** (commit ac0ce1b). The theme linked to
  `bol.com/nl/nl/b/besjaar/603580876/`. The real Besjaar brand page is
  `…/604080876/`. Fixed in three places:
  - Organization/Brand `sameAs` (structured data that tells Google the bol.com
    brand and this site are the same Besjaar)
  - the theme-setting default
  - the "Bekijk op bol.com" source link in the homepage block
    "Publieke klantsignalen" (4.7/5 · 391 reviews)

  Check that these two figures still match bol.com.

## To do in Shopify Admin (owner)

1. **Publish** the preview theme `Besjaar – bol.com merklink 2 okt (preview)`
   (id 201817555271, Online Store › Themes). It carries both fixes, verified
   after the copy had finished. The live theme 201811820871 has neither.
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

## Deeper check — brand search "Besjaar" (same day)

What Google sees when it looks for "Besjaar", from strongest to weakest:

1. **Marketplaces own the name.** bol.com (brand page with 40 Besjaar
   articles), Amazon.nl/.be, and resellers (2dekansje.com, maxict.nl, bhznet.nl,
   krulborstel.com) sell "Besjaar" products: flashlights, doorbells, powerbanks,
   shower heads. To Google, "Besjaar" is a product brand on bol.com, not a website.
   besjaar.eu has to earn that by being clearly the official source (steps below).
2. **The store's history is spread over other domains.**
   - **bestezaklampen.nl** used to be this store. Google still has its homepage
     titled "Besjaar" and the flashlight pages. Its DNS no longer resolves
     (no A or CNAME record), so Google is losing those pages. The brand value
     they built goes nowhere instead of moving to besjaar.eu.
   - **www.slimhome.nl** still serves the full catalogue (DNS → Shopify).
   - **besjaar.eu** is the newest web presence on the store, so it is the
     youngest domain in Google's eyes.
3. **Four different names for one shop.**
   - Website: Besjaar.
   - Shop app profile: **SlimHome** (shop.app/m/2mwpq5zr63, selling the Besjaar
     shower heads).
   - E-mail and legal notice: Univex B.V. (info@univexbv.com).
   - Contact policy: SelectStore B.V.

   Google uses these to decide which site *is* the brand.
4. **Public GitHub repository.** `github.com/raufmirzayee/Besjaar` is public
   and ranks for "besjaar.eu". Its branches hold full theme copies and these
   internal notes (legal issues, phone numbers, e-mail addresses).
5. **The theme itself is not the problem.** It already does what brand SEO needs:
   - Title "Besjaar® | Hoogwaardige Douchekoppen & Douchefilters".
   - Organization, Brand and WebSite structured data named "Besjaar".
   - The "Dit is de officiële website van Besjaar" line on the homepage.
   - Image alt texts with Besjaar.
   - Server-rendered HTML.
   - All 5 products, 2 collections, 6 pages and 4 guides published to the
     Online Store, so they are in the sitemap.

   **Rewriting the whole website would not change any of points 1–4.**

DNS (checked from this environment):

| Host | Resolves to | Note |
|---|---|---|
| www.besjaar.eu | CNAME shops.myshopify.com → 23.227.38.74 | correct |
| besjaar.eu | A 23.227.38.69 | Shopify range; Shopify's documented value is 23.227.38.65 |
| www.slimhome.nl / slimhome.nl | Shopify | serves the same shop |
| bestezaklampen.nl / www | **nothing** | DNS missing or domain lapsed |
| univexbv.com / www | Shopify | no web presence, redirects to besjaar.eu |

### Brand steps (owner)

1. **bestezaklampen.nl:** renew the domain if it lapsed. Then set DNS at the
   registrar to A `23.227.38.65` and `www` CNAME `shops.myshopify.com`. In
   Shopify › Domains, set it to **redirect to www.besjaar.eu**. Its old Google
   pages then 301 to besjaar.eu and pass on their value.
2. **slimhome.nl:** redirect to www.besjaar.eu as well, unless it must stay a
   separate shop.
3. **Shop app name:** Sales channels › Shop › Store details (or Settings ›
   Brand). Change "SlimHome" to "Besjaar", with the Besjaar logo.
4. **One company name everywhere:** the legal notice, contact information,
   footer and e-mail should all name the same entity.
5. **Make the GitHub repository private:** GitHub › Settings › General ›
   Danger Zone › Change visibility.
6. **Links that point to besjaar.eu:**
   - Put www.besjaar.eu in the bol.com and Amazon seller/brand profiles where
     allowed, and on any Instagram/Facebook/TikTok profiles (then add those
     profile URLs in Theme settings so they appear in `sameAs`).
   - Also: product inserts or packaging, and a Trustpilot or KvK listing.
7. **Search Console:** Domain property, submit `sitemap.xml`, request indexing
   of the homepage. The **Page indexing** report and **URL Inspection** of
   `https://www.besjaar.eu/` then state Google's exact reason, for example
   "Duplicate, Google chose different canonical" or "Discovered – currently not
   indexed". Share that line to confirm which of the points above applies.
