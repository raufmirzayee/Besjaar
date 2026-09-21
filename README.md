# Besjaar — storefront discount visibility

Theme work for [besjaar.eu](https://www.besjaar.eu): showing the discounts that
are actually configured in Shopify to customers while they browse, instead of
only at checkout.

Shopify's Liquid API exposes no discount object on a product, so the live
discount configuration is mirrored from the Admin API into a shop metafield and
read by the theme. `compare_at_price` is never treated as a discount.

**Read [`docs/shopify-discount-visibility.md`](docs/shopify-discount-visibility.md)**
for how it works, what it deliberately does not show, how to keep it accurate,
and the Shopify limitations involved.

A temporary campaign, **BESJAAR WATER WEEK 💧** (Nationale Kraanwaterdag,
21–30 September 2026), is built on top of it and documented in
[`docs/besjaar-water-week-campaign.md`](docs/besjaar-water-week-campaign.md) —
including how it ends by itself and how to remove it.

## Layout

```
theme/     the changed and added theme files (mirrors the Shopify theme structure)
tools/     sync-shopify-discounts.mjs — Admin API → shop metafield
docs/      documentation + the payload currently written to the shop
```

`theme/` contains only the files this change touches, not the whole theme. The
canonical theme lives in Shopify.
