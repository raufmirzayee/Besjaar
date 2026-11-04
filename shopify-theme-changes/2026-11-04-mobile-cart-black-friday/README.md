# Mobile cart + Black Friday popup (4 Nov 2026)

Copies of the files changed in the Shopify theme
"Besjaar – mobiele winkelwagen + Black Friday (preview)" (unpublished copy of
"Besjaar – koppen, video, fotopijlen, koopblok"). The live theme is unchanged.

New
- `sections/besjaar-cart-mobile-1176.liquid`: mobile cart: 40px tap targets,
  16px fields (no iOS zoom), Apple Pay / Google Pay / Shop Pay under the
  checkout button, one-tap accessory in the free-shipping band, pinned checkout
  bar on the cart page on phones.
- `assets/besjaar-cart-mobile-1176.js`: the script for that section.
- `sections/besjaar-express-checkout.liquid`: express buttons for the drawer
  refresh (Section Rendering API).

Changed
- `sections/header-group.json`: adds `besjaar-cart-mobile` after `besjaar-cart`.
- `snippets/besjaar-welcome-offer.liquid`: until 21 Nov 2026 the 20% popup and
  corner tab become "Black Friday: vroege toegang" (sign-ups tagged
  `besjaar-bf-early-access-2026`); hidden 21–30 Nov; normal welcome offer back
  on 1 Dec.
