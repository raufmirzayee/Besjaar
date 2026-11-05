# besjaar.eu — mobile performance pass (2026-11-05)

`theme/` holds the text files of the live Shopify theme **"Besjaar – Trustpilot
Nederlands (preview)"** (theme id `204061278535`). The first commit on this branch
is an untouched export, so `git diff` against it shows exactly what changed.
The 42 image assets (webp/png) are not in the export and are unchanged.

> **Do not run a plain `shopify theme push` from `theme/`.** The images are not
> in this folder, so a full push would delete them from the store theme. Push only
> the changed files (see "Deploy" below).

Starting point (PageSpeed Insights, mobile, Nov 5 2026): **Performance 44** —
FCP 1.5 s, LCP 5.9 s, TBT 1,540 ms, CLS 0, Speed Index 8.3 s.

## What changed and why

| # | Change | Files | Targets |
|---|--------|-------|---------|
| 1 | 10 parser-blocking theme scripts are no longer parser-blocking. The two `fetch` wrappers (`besjaar-x-runtime-1.js`, `besjaar-x-cart-2.js`) moved into `<head>` with `defer`, placed **before** `besjaar-ui-core.js`, so they still run in the same order as before. The other 8 got `defer` (each waits for `DOMContentLoaded` or only touches elements rendered above it). `besjaar-x-catalog-1.js` now loads only on product pages, the only place it does anything. | `layout/theme*.liquid`, 7 header-group sections, 2 snippets | LCP, FCP, TBT |
| 2 | Hero photo (the LCP element) is preloaded through the `Link` header, so it downloads alongside the CSS instead of after the parser reaches the hero. New snippet `besjaar-theme-image` serves a **Content → Files** copy (same file name) through `image_url` / `image_tag` when there is one: CDN-resized `srcset`, AVIF/WebP, Early Hints. Until then it outputs the same `<img>` as before. Also used for the 3 showcase photos. | `snippets/besjaar-theme-image.liquid`, `sections/besjaar-wow-hero.liquid`, `sections/besjaar-wow-showcase.liquid` | LCP, image delivery |
| 3 | The homepage CTA 360° viewer mounts when the CTA comes within ~1200 px of the screen, not at page load. That covers the frame probes, `besjaar-ui-360.js` and the viewer setup. The Files frame list is only output when `besjaar-cta-360-01.webp` exists in Files; today it doesn't, so every homepage load was requesting a URL that returned 404. | `assets/besjaar-x-runtime-1.js`, `sections/besjaar-runtime-1167.liquid` | TBT, Speed Index |
| 4 | Cart-drawer CSS (`besjaar-x-cart-1.css`, `besjaar-cart-ux.css`, ~42 KB) no longer blocks the first paint outside the cart page. All their rules are scoped to the drawer or the cart page; the closed drawer is already off-screen via `besjaar-seo-base.css`. They stay blocking on `/cart`. | `sections/besjaar-cart-1168.liquid` | FCP, LCP |
| 5 | Removed the unused preconnect to `fonts.shopifycdn.com` (fonts come from the shop's own domain and are preloaded). The hero's pulsing dot now animates `transform`/`opacity` instead of `box-shadow` (no repaint every frame); it looks the same. | `layout/theme.liquid`, `assets/besjaar-home-wow.css` | preconnect warning, non-composited animations |

Shopify Theme Check (`@shopify/theme-check-node` 3.31): no new offenses; 11
`ParserBlockingScript` warnings resolved.

## One manual step (unlocks most of change 2)

Upload these files from the theme's assets to **Content → Files**, keeping the
exact file names. The theme picks them up automatically, with no code change:

- `besjaar-lifestyle-shower.webp` (hero, 161 KB today)
- `besjaar-web-real-water.webp` (141 KB)
- `besjaar-macro-nozzles.webp` (64 KB)
- `besjaar-web-real-modes.webp` (40 KB)

## Deploy

1. Duplicate the live theme in the admin (Online Store → Themes → ⋯ → Duplicate).
2. Push only the changed files into that copy, e.g.

   ```sh
   # 1800786 = the untouched baseline export
   ONLY=$(git diff --name-only 1800786 -- theme | sed 's#^theme/#--only #')
   shopify theme push --path theme --theme <copy-id> --nodelete $ONLY
   ```

   or paste the changed files into the code editor of the copy.
3. Run PageSpeed Insights on the copy's preview URL (`?preview_theme_id=<copy-id>`)
   several times (scores vary run to run), check the cart drawer, product page,
   welcome offer and mobile menu, then publish.

## Not changed here (needs a decision)

- **Third-party JavaScript** is probably most of the TBT: Google Tag Manager
  **plus** a separate `gtag.js` for Google Ads `AW-18547421882` in `<head>`
  (if the GTM container already has that Ads tag, this loads Google's tag twice);
  the Judge.me app embed on every page; two Trustpilot widgets on the homepage,
  one of them inside the hero (added 5 Nov, the day of this report). Compare a
  PSI run with the Trustpilot hero block disabled to see its cost.
- **Continuous hero animations on phones**: the shimmer on the headline (animates
  `background-position`), floating bubbles, glow and the slow zoom on the photo.
  Constant motion above the fold lowers Speed Index. Pausing them below 990 px is
  a design call.
- **CSS volume**: about 620 KB (uncompressed) of CSS must load before the hero can
  paint: 9 files in `<head>` plus 10 more from header-group sections, built up in
  layers that override each other. Merging the layers and splitting per page type
  is the biggest remaining structural win, but needs visual QA on every template.

## Also on this branch: address, VAT number, product photo colours

- **Public address.** The footer, contact page and Organization JSON-LD show
  *Dr. A.F. Philipsweg 39 A, 9403 AD Assen* (Theme settings → Brand & layout →
  Public address; snippet `besjaar-company-address`). The Shopify store address
  stays *Elbestraat 113, 9406 SV Assen*: that is where returns are received, and
  the refund policy already names it as the return address.
- **VAT number** hidden from the footer and contact page (theme setting
  `company_vat` emptied); the KVK number stays. It is still on the Contact
  information and Legal notice policy pages.
- **Product photos looked blue.** That was CSS: the gallery and thumbnails sat
  on a light-blue background with `mix-blend-mode: multiply`, which multiplied
  every photo by that blue. Both are now white with no blending, so the photos
  show their real colours (`besjaar-mobile-detail-clarity.css`,
  `besjaar-seo-carriers-late.css`).
