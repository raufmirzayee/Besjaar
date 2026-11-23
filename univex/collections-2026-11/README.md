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

## Not covered

`/collections/all` ("Producten", also the Black Friday "Shop de deals" link) is not a real collection, so the theme sorts it alphabetically (A–Z).

## Rollback

Run `rollback.graphql`: the earlier sort orders (MOST_RELEVANT; aanbiedingen BEST_SELLING).
