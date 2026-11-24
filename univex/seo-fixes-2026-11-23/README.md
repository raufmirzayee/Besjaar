# Univex SEO fixes, 23 Nov 2026

These are the fixes from `../seo-audit-2026-11-23.md`. They were applied through the Admin API, in all five languages (nl, de, en, fr, es).
`changes.py` holds every old and new value. Running it rewrites `payloads.json` (what was sent) and `rollback.json` (the old values).

| # | Fix | Status |
|---|---|---|
| 1 | Homepage title | **Live in all five languages.** Dutch was set by hand on 24 Nov: `Univex Shop \| Douchekoppen, zaklampen & handige gadgets`; the other four are translations. |
| 3 | Meta descriptions for Contact, Veelgestelde vragen, and the Tips & advies and Nieuws blogs | Live in all languages |
| 4 | SEO title and description for "Producten" (`/collections/all`) | Live in all languages |
| 5 | "Aanbiedingen" text no longer says the crossed-out price is the lowest of the last 30 days | Done in all languages; the collection is still unpublished |
| 6 | " \| Univex" removed from the SEO titles of the 5 Besjaar shower products | Live (25 titles) |
| 7 | Black Friday article `black-friday-2026-veilig-online-shoppen` hidden | Scheduled: hidden now, visible again on **1 Dec 2026 00:00 Amsterdam** (`publishDate` 2026-11-30T23:00:00Z). No other page links to it. |
| 9 | Blog SEO titles from English Title Case to sentence case | 17 Dutch titles, plus the French and Spanish versions of 7 of them; German and English are unchanged. The other translations were re-registered so none show as outdated. |
| 10 | "Home page" collection (`/collections/frontpage`) hidden from search | `seo.hidden = 1`: now `noindex,nofollow` and out of the sitemap |

## Checked on the live site after the change

- Titles and descriptions above, in all five languages.
- `/collections/frontpage` returns `noindex`.
- The Black Friday article returns 404.
- The sitemap no longer lists either of those two pages.

## Not changed

- **Address 39 A → 37 B** (confirmed by you on 23 Nov):
  - Black Friday article: done in all five languages; it stays scheduled for 1 Dec. The old Dutch text is in `bf-article-body.before.json`.
  - Legal notice policy: done in de/en/fr/es.
  - **Dutch Legal notice: manual.** The connector lacks `write_legal_policies`. In Settings → Policies → Legal notice, change `Philipsweg 39 A` to `Philipsweg 37 B`.
- **Seasonal posts** (wintertijd 2026, herfstvakantie 2026, halloween 2026): left as they are. They are best updated next autumn with the 2027 dates.
- **The two news posts without an image** (gratis verzending, 30 dagen bedenktijd): left as they are.
- **Theme card images with `alt=""`**: this needs a theme copy that you then publish.

## Rollback

- **Product titles:** add " | Univex" back with `productUpdate` (seo.title) and the translations.
- **Article titles:** the old values are in `rollback.json`.
- **New descriptions, Producten SEO and `seo.hidden`:** delete the metafields, or empty the fields.
- **Black Friday article:** `articleUpdate` with `isPublished: true, publishDate: "2026-10-12T07:45:36Z"`.

## Correction, 24 Nov 2026

Fix 6 used `productUpdate(seo: {title})`, which also cleared the SEO description of those 5 products: Shopify replaces the whole SEO object. Found and repaired on 24 Nov. The original descriptions were restored, and their translations registered again. See `../new-products-2026-11-24/README.md`.
