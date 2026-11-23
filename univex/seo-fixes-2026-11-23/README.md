# Univex SEO fixes, 23 Nov 2026

These are the fixes from `../seo-audit-2026-11-23.md`. They were applied through the Admin API, in all five languages (nl, de, en, fr, es).
`changes.py` holds every old and new value. Running it rewrites `payloads.json` (what was sent) and `rollback.json` (the old values).

| # | Fix | Status |
|---|---|---|
| 1 | Homepage title | de/en/fr/es **live** (e.g. `Univex Shop \| Duschköpfe, Taschenlampen & praktische Gadgets`). **Dutch: manual.** The Dutch title lives in Online Store → Preferences and the API can't write it. Change "Univex BV" to `Univex Shop \| Douchekoppen, zaklampen & handige gadgets`. The four translations stay in place; Shopify will only mark them "outdated". |
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

- **Address in the Black Friday article.**
  - The article (all languages) says "Doctor A.F. Philipsweg 39 A", and so does the Legal notice policy.
  - The Contact information policy says 37 B.
  - The article tells readers to check the address against the KvK number, so it should match the KvK register. Change it once the KvK registration is confirmed.
- **Seasonal posts** (wintertijd 2026, herfstvakantie 2026, halloween 2026): left as they are. They are best updated next autumn with the 2027 dates.
- **The two news posts without an image** (gratis verzending, 30 dagen bedenktijd): left as they are.
- **Theme card images with `alt=""`**: this needs a theme copy that you then publish.

## Rollback

- **Product titles:** add " | Univex" back with `productUpdate` (seo.title) and the translations.
- **Article titles:** the old values are in `rollback.json`.
- **New descriptions, Producten SEO and `seo.hidden`:** delete the metafields, or empty the fields.
- **Black Friday article:** `articleUpdate` with `isPublished: true, publishDate: "2026-10-12T07:45:36Z"`.
