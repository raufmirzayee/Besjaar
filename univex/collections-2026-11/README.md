# Univex Shop: collection order and category check (23 Nov 2026)

## Problem

Every collection was sorted "Most relevant", which in practice is newest first.
So "Douche & badkamer" opened with the refill set, and most categories started with a minor product.

## Rule used

There is no usable sales signal: 3 web orders in a year (sales mostly via bol.com), and no product reviews. So the order is:

1. Products tagged **Bestseller**.
2. The main and most complete products.
3. Refills and small accessories.

Drafts (not on the storefront) end up last on their own.

## Done

- 11 collections set to **Manual**, then reordered with `collectionReorderProducts`: douche-badkamer, zaklampen-verlichting, huis-keuken, elektronica-onderweg, verzorging-wellness, accessoires, bestsellers, besjaar, rynex, slimhome and aanbiedingen. The exact order is in `order.py`.
- Verified on the storefront (`/collections/<handle>/products.json`): all 10 published collections match.
- "aanbiedingen" is not published to any sales channel, so it is not on the storefront. Its order is set in admin.
- Not changed: hobby-creatief and frontpage (1 product each), and lynex (the only active product is already first).

## Category check

Membership follows product tags, and every product is in a fitting category.
The only double is the LED Kweeklamp, in "Zaklampen & verlichting" and "Huis & keuken". Both fit, so it stays, last in both.

## The "Producten" page (/collections/all)

`/collections/all` was Shopify's automatic all-products list, sorted A–Z. It is also where the Black Friday "Shop de deals" link leads.

At the user's request, a real collection now takes its place: "Producten" (gid://shopify/Collection/708027777372), handle `all`. Shopify serves a collection with that handle at /collections/all.

- **Contents:** automatic, every product with a variant price above €0, so new products are added by themselves.
- **Sort:** Manual, in the same order as "aanbiedingen" (bestsellers first, then showers, lights, home, care, electronics, accessories, refills last).
- **Title translations:** Produkte (de), Products (en), Produits (fr), Productos (es), matching the old page titles.
- **Published:** to the Online Store only.

Checked on the storefront:
- the title and h1 are unchanged in all 5 languages;
- the page shows 32 products with no Liquid errors;
- page 1 (24 products) is in exactly the planned order.

(`/collections/all/products.json` still returned an old order right after publishing, probably a cache; the page itself is correct.)

New products are added at the end of the manual order. Move them in Shopify admin (Products → Collections → Producten) if they should be higher.

To undo: delete the "Producten" collection; /collections/all then goes back to Shopify's automatic A–Z list.

## Rollback

Run `rollback.graphql`: the earlier sort orders (MOST_RELEVANT; aanbiedingen BEST_SELLING).
