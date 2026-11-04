# Besjaar theme – optimized assets

Stylesheets and scripts for the Shopify theme "Besjaar – sneller (preview)".
These are the same public files the storefront already serves from Shopify's CDN.

- `besjaar-*.css` (existing names): minified copies of the theme's stylesheets.
  Whitespace and comments removed, values shortened; every rule and declaration kept.
- `besjaar-x-*.css` / `besjaar-x-*.js` (new): code that used to be written inline into
  every page's HTML. Each file is loaded at the exact spot where the inline block was,
  so it applies and runs at the same moment, but browsers can now cache it.
