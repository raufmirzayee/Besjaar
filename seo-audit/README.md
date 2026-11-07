# Besjaar® — page-by-page SEO audit and implementation (2026-11-07)

Scope: www.besjaar.eu (Shopify, NL primary + EN/DE/FR/ES). 356 URLs crawled from the live sitemap (100% HTTP 200) + Shopify Admin data (SEO fields, translations, shipping rates, policies, theme code).

## The five deliverables

| # | File | What it contains |
|---|---|---|
| 1 | [01-existing-seo-inventory.md](01-existing-seo-inventory.md) + [data/01-existing-seo-inventory-all-urls.csv](data/01-existing-seo-inventory-all-urls.csv) | Exact current title, description, H1, headings, canonical, robots, hreflang, JSON-LD types, OG, images/alt, word count and inbound links for every URL in all 5 languages, captured **before** any change; verified issues; items marked NOT VERIFIED with how to verify |
| 2 | [02-keyword-intent-map.md](02-keyword-intent-map.md) | One primary intent per URL, informational map, 8 cannibalization cases with decisions (no invented volumes) |
| 3 | [03-before-after-plan.md](03-before-after-plan.md) | A/B/C/D block for every Dutch page (home, 3 collections, 6 products, 7 pages, 2 blogs, 6 policies) + a row for each of the 49 published articles |
| 4 | [04-technical-seo-fixes.md](04-technical-seo-fixes.md) + [data/04-lighthouse-lab-2026-11-07.csv](data/04-lighthouse-lab-2026-11-07.csv) | Claim-consistency findings (filter/limescale, 8 vs 7,2 l/min, shipping, address, warranty, reviews), prioritized technical fixes, validation results |
| 5 | [05-implementation-measurement-report.md](05-implementation-measurement-report.md) + [data/05-after-change-verification-2026-11-07.csv](data/05-after-change-verification-2026-11-07.csv) | Exact change log (before → after, verified live), preview-theme changes, manual steps M1–M12, Search Console measurement plan |

Supporting folders: `backups/` (verbatim pre-change values for rollback), `theme-patches/` (diffs of the theme files), `tools/` (crawler and report generators used for this audit).

## What changed on the live store (verified)

- Brand-first SEO titles (`Besjaar® | … – …`) and sharper descriptions for 6 products, 3 collections, the reviews page and both blogs. Localized brand-first titles were also registered for EN, DE, FR and ES.
- Product copy: each product now says what it includes and what it doesn't (hose/filter), and how it differs from its sibling model; G½ connection specs added.
- Showerhead collection: comparison table + links to buying guides; filter collections link their guides and refills.
- News blog H1 "Nieuws" → "Douchetips & nieuws" (URL unchanged, 5 languages); two missing article descriptions added; reviews page in "je" register with better internal links; alt text for two product videos.

## What needs the merchant

1. **Critical:** shipping policy says NL shipping is always free; checkout charges €2,99 below €25 (M1, exact text in Deliverable 5). The connector lacked the scope to edit policies.
2. **Decide:** "waterbesparend" at max. 8 l/min vs the Milieu Centraal ≤ 7,2 l/min definition the site itself cites (C2), and which Assen address is the registered one (C5).
3. Preview and publish the theme **"Besjaar – SEO audit 2026-11-07 (preview)"**, which adds: noindex for the untranslated article in DE/EN/FR/ES and for blog tag pages, policy meta descriptions, and a separate intro for the news blog.
4. Homepage meta description (Online Store › Preferences), translation refresh, the two article merges/moves, and the mobile image/CSS performance work.
