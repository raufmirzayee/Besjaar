# BESJAAR brand update — theme copy "Besjaar – merk & vertrouwen 14 okt (preview)"

Shopify theme ID `202575249735` (unpublished), duplicated from the live theme
`202542612807` "Besjaar – geen auto-popup 14 okt" on 2026-10-14. The live theme
was not modified. This folder holds an exact copy of every file that was added
or changed in the preview theme (checksums verified against Shopify).

## New files
- `snippets/besjaar-brand-copy.liquid` — all brand copy, localized for nl/en/de/fr/es.
- `assets/besjaar-brand.css` — scoped styles (`.bjb-*`) for the new sections + product-card chips.
- `sections/besjaar-brand-intro.liquid` — "Jouw dagelijkse douche verdient aandacht." + 3 principles.
- `sections/besjaar-brand-trust.liquid` — shipping, returns, warranty, payment, fitting help, contact.
- `sections/besjaar-brand-guides.liquid` + `snippets/besjaar-brand-guide-card.liquid` — 3 guides, each linked to a product.
- `sections/besjaar-brand-about.liquid` + `templates/page.about.json` — new About page.

## Changed files
- `sections/besjaar-store-hero.liquid` — new settings `use_brand_copy` and `primary_target`.
- `snippets/premium-home-product-card.liquid` — spray modes / filter / hose chips for showerheads.
- `templates/index.json` — new homepage order and settings (see below).

## Homepage order
Hero → service strip → brand intro → showerheads → model finder → why Besjaar →
Judge.me reviews → bol.com rating (with source) → guides → trust & support → closing CTA.

## Second review (2026-10-14)
Checked the new files against every stylesheet, inline style and header/footer
script that loads on the homepage and the About page. Fixed in
`assets/besjaar-brand.css`:
- "Vragen?" help panel: the theme's `body.besjaar-ui-polish-v34 h3` rule
  coloured the heading dark ink (#14201a) on the green panel; now pinned white.
- Model finder on the homepage: no empty fifth column with 4 models, and the
  tablet card width works (the original rule has a `flex:0 0:min(...)` typo).
- Product-card chips are compact below 460px.
Confirmed unchanged behaviour: feature-card links (runtime script uses
`BesjaarUIConfig.routes.allProducts`, not the hero button), About-page
structured data (keyed on the page handle), finder translations in all five
locales, no positional (`nth-child`) section styling on the homepage.

## Reverting
Publishing nothing changes the live store. To undo after publishing, re-publish
theme `202542612807`, which is untouched.
