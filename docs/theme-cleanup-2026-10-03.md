# Theme cleanup, 3 October 2026

Unused files and switched-off features removed from a copy of the live theme
`Besjaar – bol.com merklink 2 okt (preview)` (id 201817555271). Nothing that
shows on the shop changes. The live theme stays in Online Store › Themes as a
backup.

"Unused" was checked from the templates, section groups and layout the shop
actually uses (products, collections, pages and blog posts were checked for
alternate templates), following every `render`, `section` and `asset_url`
reference, including the file names the header builds at runtime (the 360°
frames `besjaar-360-01…23.webp` used by the homepage spin stay).

## Removed files (117)

### Switched-off features (7)

Built into the theme but turned off in Theme settings.

- `assets/besjaar-ui-analytics.js`
- `assets/besjaar-ui-consent.css`
- `assets/besjaar-ui-consent.js`
- `sections/besjaar-ui-product-qa.liquid`
- `snippets/besjaar-ui-cookie-banner.liquid`
- `snippets/besjaar-ui-measurement-debug.liquid`
- `snippets/besjaar-ui-privacy-center.liquid`

### Shower product page and its extras (14)

No product uses the `shower` product template, so none of this showed on the shop.

- `assets/besjaar-360-24.webp`
- `assets/besjaar-ui-bundle.css`
- `assets/besjaar-ui-bundle.js`
- `assets/besjaar-ui-gallery-fix.js`
- `assets/besjaar-ui-product-page.css`
- `assets/besjaar-ui-product.js`
- `sections/besjaar-ui-product-360.liquid`
- `sections/besjaar-ui-restock.liquid`
- `sections/besjaar-ui-shower-bundle.liquid`
- `sections/besjaar-ui-shower-faq.liquid`
- `sections/besjaar-ui-shower-installation.liquid`
- `sections/besjaar-ui-shower-model-finder.liquid`
- `sections/besjaar-ui-shower-specifications.liquid`
- `templates/product.shower.json`

### GemPages leftovers (18)

Backup templates and layouts left by the GemPages app. No product, collection or page uses them.

- `assets/gp-global.css`
- `layout/theme.gempages.blank.liquid`
- `layout/theme.gempages.footer.liquid`
- `layout/theme.gempages.header.liquid`
- `sections/gp-variant-selected.liquid`
- `snippets/gp-head.liquid`
- `templates/collection.gem-1790230945-template.json`
- `templates/collection.gem-1790686410-template.json`
- `templates/collection.gem-backup-default.json`
- `templates/collection.gp-template-bk-default.json`
- `templates/index.gem-1790230943-template.json`
- `templates/index.gem-1790686406-template.json`
- `templates/index.gem-backup-default.json`
- `templates/index.gp-template-bk-default.json`
- `templates/product.gem-1790230944-template.json`
- `templates/product.gem-1790686407-template.json`
- `templates/product.gem-backup-default.json`
- `templates/product.gp-template-bk-default.json`

### Unused page templates (4)

No page or collection is assigned to these templates.

- `templates/collection.shower.json`
- `templates/page.club.json`
- `templates/page.faq.json`
- `templates/page.track-order.json`

### Sections never placed on any page (38)

Not in any template or section group that the shop uses.

- `sections/besjaar-bol-1170.liquid`
- `sections/besjaar-real-product-showcase.liquid`
- `sections/besjaar-runtime-1166.liquid`
- `sections/besjaar-shower-goals.liquid`
- `sections/besjaar-store-collection.liquid`
- `sections/besjaar-store-header.liquid`
- `sections/besjaar-store-hotspots.liquid`
- `sections/besjaar-store-scene.liquid`
- `sections/besjaar-store-specs.liquid`
- `sections/besjaar-ui-account-benefits.liquid`
- `sections/besjaar-ui-bol-proof.liquid`
- `sections/besjaar-ui-brand-search-topics.liquid`
- `sections/besjaar-ui-cart-addons.liquid`
- `sections/besjaar-ui-club.liquid`
- `sections/besjaar-ui-customer-proof.liquid`
- `sections/besjaar-ui-delivery.liquid`
- `sections/besjaar-ui-home-360.liquid`
- `sections/besjaar-ui-home-contact.liquid`
- `sections/besjaar-ui-home-faq.liquid`
- `sections/besjaar-ui-marquee.liquid`
- `sections/besjaar-ui-newsletter.liquid`
- `sections/besjaar-ui-seo-topic-hub.liquid`
- `sections/besjaar-ui-shower-benefits.liquid`
- `sections/besjaar-ui-shower-buying-guide.liquid`
- `sections/besjaar-ui-shower-education.liquid`
- `sections/besjaar-ui-shower-trust.liquid`
- `sections/besjaar-ui-shower-visual-story.liquid`
- `sections/besjaar-ui-social-proof.liquid`
- `sections/besjaar-ui-testimonials.liquid`
- `sections/besjaar-ui-trust.liquid`
- `sections/custom-liquid.liquid`
- `sections/main-cart.liquid`
- `sections/main-collection.liquid`
- `sections/main-faq-page.liquid`
- `sections/main-product.liquid`
- `sections/main-shower-collection.liquid`
- `sections/main-track-order.liquid`
- `sections/site-footer.liquid`

### Snippets nothing renders (5)

- `snippets/besjaar-shop-card.liquid`
- `snippets/besjaar-ui-account-sidebar.liquid`
- `snippets/localized-link-title.liquid`
- `snippets/price-filter-input-value.liquid`
- `snippets/shower-product-card.liquid`

### Old stylesheets, scripts and images (31)

Replaced by the newer files the theme loads; nothing loads these.

- `assets/besjaar-1150.css`
- `assets/besjaar-cart-polish-1140.css`
- `assets/besjaar-commerce-step5.css`
- `assets/besjaar-editorial-base.css`
- `assets/besjaar-final-step6.css`
- `assets/besjaar-foundation-v1.css`
- `assets/besjaar-lady-shower-mobile.webp`
- `assets/besjaar-logo-leaf.svg`
- `assets/besjaar-mobile-corrections.css`
- `assets/besjaar-polish-layer.css`
- `assets/besjaar-premium-home.css`
- `assets/besjaar-premium-home.js`
- `assets/besjaar-premium-lux.css`
- `assets/besjaar-premium-sections.css`
- `assets/besjaar-product-back-exact.webp`
- `assets/besjaar-real-360-01.webp`
- `assets/besjaar-seo-release-notes.txt`
- `assets/besjaar-ui-bol-proof.css`
- `assets/besjaar-ui-collection-filters.js`
- `assets/besjaar-ui-conversion-qa.css`
- `assets/besjaar-ui-customer-proof.css`
- `assets/besjaar-ui-faq.js`
- `assets/besjaar-ui-home.css`
- `assets/besjaar-ui-polish.css`
- `assets/besjaar-ui-product-story.css`
- `assets/besjaar-ui-shell.css`
- `assets/besjaar-ui-shower-collection.css`
- `assets/besjaar-ui-shower-finder.js`
- `assets/besjaar-welcome-offer-chip.css`
- `assets/besjaar-welcome-offer.css`
- `assets/besjaar-welcome-offer.js`

## Code removed from files that stay

- `layout/theme.liquid`: cookie banner, privacy centre and analytics scripts,
  the style that hid Shopify's cookie banner, the measurement debug panel, the
  analytics settings that only those scripts read (the page/cart context the
  cart uses stays), and the stylesheet/script loads for the shower product
  page and for bundle add-ons on the cart page (no bundle block exists there).
- `sections/site-header.liquid`, `sections/header-group.json`: announcement
  countdown and its setting.
- `sections/besjaar-store-footer.liquid`: the "cookie preferences" footer link
  (it only appeared when the switched-off cookie centre was on).
- `sections/besjaar-store-product.liquid`: the model-finder link (shower
  template only) and the script that synced the back-in-stock and Q&A forms.
- `sections/besjaar-ui-smart-recommendations.liquid`: the model-finder link
  (product context only; the section is used on the cart page).

## Theme settings removed (nothing read them)

Privacy & analytics group (whole group): show cookie preferences, show Besjaar
cookie banner, campaign attribution, campaign countdowns, analytics debug mode,
measurement layer.

Others: enable shower bundles, preselect bundle accessories, enable product
Q&A, enable restock requests, show account in mobile navigation, show
delivery section on home, show home review summary, popular search terms,
show search filters, show search sorting, show collection discovery in
search, show account section on home, club referral page, show club section
on home.

## Kept on purpose

- Translations (`locales/*.json`) are unchanged. Strings of removed features
  stay; they do nothing and removing keys from five languages risks breaking
  live text.
- CSS rules for removed features inside stylesheets that are still used.
- The GemPages app embed in Theme settings › App embeds (an app setting, not a
  theme file). Turn it off there if GemPages is no longer used.
- Disabled sections that are still placed (footer "guide links", the Judge.me
  badge on collections); they can be switched on in the editor.

## Checks

- Shopify theme-check: 683 offenses before, 349 after, none new (two
  complexity warnings changed only their score).
- Every `render`, `section`, `sections` and `asset_url` reference resolves;
  every template, section group and section schema parses.

