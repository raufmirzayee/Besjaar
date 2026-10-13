# Speed fix: CSS cleanup (theme copy, 13 Oct 2026)

**Theme copy:** `Besjaar – speed fix 13 okt (copy)`, `gid://shopify/OnlineStoreTheme/202511286599`, **unpublished**.
It was duplicated from the live theme `Besjaar – materiaal schema 9 okt (preview)` (`…/202222895431`). Only the 24 stylesheets in `assets/` here were changed. **No Liquid, JSON, JS or image file was touched**, and the stylesheet names and load order are identical, so the copy behaves exactly like the live theme apart from CSS weight.

## Result

| Page type | CSS before | CSS after | Compressed (gzip) before → after |
|---|---|---|---|
| Homepage | 876 KB | ≈ 530 KB | 125 → ≈ 76 KB |
| Product | 905 KB | ≈ 545 KB | 133 → ≈ 81 KB |
| Collection | 844 KB | ≈ 520 KB | 121 → ≈ 75 KB |
| Content page / blog | 847 KB | ≈ 523 KB | 121 → ≈ 76 KB |

All 24 changed files together: 1,141 KB → 731 KB (−36%). About 40% less CSS for the browser to download and process before the first paint, on every page.

## What was removed, and why it cannot change what visitors see

1. **Rules for markup the theme no longer renders (566 class names).** A selector that *requires* a class no reachable template, section, snippet, script, locale file or store content (pages, all 33 articles, product and collection descriptions in all 5 languages, app metafields) can ever output never matches any element. These are leftovers from earlier designs: `besjaar-ui-hero--v11/v12/v13`, the wishlist, `product-v16`, the category grid, `besjaar-store-hotspots`, and so on. Kept on purpose:
   - classes built dynamically in code (`besjaar-ui-delivery-promise--cart`, …);
   - classes from apps (`jdgm-*` Judge.me, `shopify-*`, …);
   - classes that only appear inside `:not()`, `:is()` or `:has()`.

   Disabled sections (e.g. the footer guide links) count as reachable, so they keep their styling if switched back on.
2. **Declarations that can never win the cascade (1,853).** A declaration is removed only when a stylesheet that loads *later on every page where it loads* sets the same property:
   - on the identical selector,
   - in the same or a broader media condition,
   - with equal or stronger `!important`.

   The later rule must not use vendor prefixes, `:has()` or newer units such as `dvh`, so intentional fallbacks are never touched. Every removal is logged with the rule that overrides it (`override-log.json.gz`).
3. **Comments.** Values were not minified; the files are otherwise byte-for-byte what the theme already had.

Load order used (from `layout/theme.liquid` and the header-group sections): `seo-base` → `ui-cart` → `seo-design` → `seo-commerce` → `seo-finish` → `discount-badge` → `seo-carriers-early` → `seo-carriers-late`.
- `besjaar-campaign.css` only loads during a campaign, so it never counts as an override.
- Some files are loaded a second time from a body section, so a copy also sits *after* the global files: the 3 collection stylesheets and `ui-shower-trust-education`. These got step 1 only.

## Two pre-existing CSS errors

- `besjaar-seo-carriers-late.css` line 145 has a stray `}`. Browsers glue it onto the next rule's selector and ignore that rule (`…drawer--cart .besjaar-ui-cart-upsell{padding:0;border:0;border-radius:0;background:transparent}`). The cleaned file drops both, exactly matching what browsers do today, so the look doesn't change. If that cart-upsell style was meant to apply, add it back deliberately and check the cart drawer.
- `besjaar-ui-product-page.css` has a missing semicolon. It only loads on the unused `product.shower` template, so it was left unchanged.

## Not changed (and why)

- **Homepage hero photo.** On phones it fills a square card (`object-fit: cover`), so the wide 1916×821 image is already scaled *up*. A smaller file would look blurrier. Serving phones the visible crop at the same quality saves only ~21 KB, which isn't worth a new image plus `<picture>` markup tied to the CSS crop position.
- **Fonts.** Browsers only download the font weights a page actually uses. The extra `@font-face` declarations cost nothing.
- **Splitting CSS per page type.** About 26% of the remaining CSS only applies to one page type. Moving it safely needs rendered pages to rule out cascade ties with `body.besjaar-ui-polish-v34 …` rules; without them it would save only 15–30 KB per page.

## Check before publishing

1. Online Store → Themes → `Besjaar – speed fix 13 okt (copy)` → **⋯ → Preview**.
2. Compare against the live site, on a phone **and** a desktop:
   - homepage;
   - a product page: gallery, buy box, sticky add-to-cart, reviews;
   - `/collections/showerhead`;
   - **the cart drawer**: add a product, open it, check the "Misschien ook interessant" rail;
   - `/pages/about-us` and a Gids article;
   - search;
   - account login;
   - the cookie banner.
3. Run https://pagespeed.web.dev/ on the live homepage first and on the preview URL afterwards, for the before/after scores.
4. If everything looks identical: **⋯ → Publish**.

## Rollback

The live theme is untouched. Publishing the copy only switches which theme is live. To go back, publish `Besjaar – materiaal schema 9 okt (preview)` again.

## Reproduce

`tools/` contains the scripts:
- `reach.py`: files reachable from the templates in use;
- `corpus.mjs`: which class names exist;
- `prune.mjs`: rules for classes that never render;
- `override.mjs`: declarations that can never win;
- `strip.mjs`: comment removal;
- `pipeline.mjs`: runs it all.
