# Showing real Shopify discounts on the Besjaar storefront

This describes how the storefront shows the discounts configured in Shopify —
on product cards everywhere and on the product page — without inventing a
second, theme-side discount system.

---

## 1. The Shopify limitation this works around

**Liquid has no discount object.** Shopify's storefront (Liquid) API exposes
`product`, `variant`, `collection`, `cart` and `line_item`, but nothing on a
product or variant says "an automatic discount or a discount code applies to
me". Discounts only become visible to the theme once a line is already in the
cart:

| Where | What Liquid can see |
| --- | --- |
| Product page / collection / search | *Nothing.* No discount data at all. |
| Cart & cart drawer | `line_item.discount_allocations`, `cart.cart_level_discount_applications` |
| Checkout | Shopify renders it; the theme is not involved |

`compare_at_price` is **not** a discount. It is a merchandising number a
merchant types on the variant, and a product can have one with no Shopify
discount attached — which is exactly why the theme never treats it as one. The
theme's existing "SALE / −20%" badges still come from `compare_at_price`; the
new discount badges are a separate, independent thing.

So the only Shopify-supported way to put **real** discount facts in front of a
browsing shopper is to copy the discount configuration out of the Admin API
into storefront-readable data. That is what this implementation does.

## 2. How it works

```
Shopify Admin API (discountNodes)
        │  tools/sync-shopify-discounts.mjs
        ▼
Shop metafield  besjaar_discounts.active   (type: json)
        │  shop.metafields.besjaar_discounts.active.value
        ▼
snippets/besjaar-discount-badge.liquid  →  badge on cards + block on the PDP
```

The sync keeps only discounts that can be stated truthfully on a product, and
resolves collection- and variant-scoped discounts down to a list of product ids
so the theme does not have to walk `product.collections` on every card.

**The theme does not blindly trust the mirror.** On every single request the
snippet re-checks:

1. **The schedule** — `starts_at` must be in the past and `ends_at`, if set,
   in the future. A discount that expires between two syncs stops showing by
   itself, with no sync needed.
2. **Customer eligibility** — anything limited to named customers or a customer
   segment is dropped at sync time and would be dropped again here. The
   storefront cannot know who is looking, so it never guesses.
3. **Product scope** — the product id must be in the rule's product list (or
   the rule must cover all products).
4. **Freshness** — see the staleness guard below.

### What the shopper sees

| Discount | Badge | Supporting line |
| --- | --- | --- |
| Automatic | filled navy pill, `10% KORTING` | *Automatisch verrekend bij het afrekenen* |
| Code | outlined pill, `20% KORTING` | *Met code **WELKOM20** bij het afrekenen* |

On the product page the block also shows `€23,95 → €21,56` and every condition
attached to the discount (once per customer, minimum order value, minimum
quantity, end date).

Prices are never rewritten. The theme's own price element keeps showing what
Shopify charges today; the discounted figure sits beside it, labelled as
something that happens at checkout. Percentage maths uses the same half-up cent
rounding Shopify uses, computed on the variant price in cents.

### One badge per product

A product can be covered by several discounts at once. Only one is ever shown,
so there are no duplicate or competing badges:

- An **automatic** discount wins by default, even when a code is worth more,
  because it applies to everyone with no code, no minimum and no action. Set
  `"preference": "best_value"` in the metafield to promote the larger offer
  instead.
- Among discounts of the same kind, the largest wins.
- On the product page only, the runner-up is mentioned on one extra line, and
  the wording follows the discount's own `combinesWith` setting — "instead of"
  when Shopify will not stack them, "on top of" when it will.

### What is deliberately not shown

- **Buy-X-get-Y, free shipping and app discounts.** These cannot be reduced to
  an honest per-product percentage or amount, so the sync skips them.
- **Customer-specific and segment discounts** (e.g. the one-off `TT-…` codes).
- **Order-level fixed amounts** (`€10 off your order`) never appear on product
  cards — they are not a per-product saving. They do appear on the product page,
  worded as an order-level discount, with no per-product price calculated.
- **The "Recently viewed" strip.** That strip is built in the browser from
  `localStorage` (`assets/besjaar-1150.js`), not from Liquid, and it stores only
  a handle, title, image and price. It shows no badges of any kind today — not
  the sale badge, not the stock chip — so adding a discount badge there would
  mean reimplementing the whole rule-resolution in JavaScript and keeping two
  copies in step. It was left out on purpose. Every server-rendered surface
  (collections, search, recommendations, home range, product page) is covered.

## 3. Keeping it accurate

Re-run the sync whenever you:

- create, edit, pause, activate or delete a discount;
- change which products are in a discounted collection;
- add a product to a collection a discount targets.

```bash
SHOPIFY_STORE=bc8d9f-69.myshopify.com \
SHOPIFY_ADMIN_TOKEN=shpat_xxx \
node tools/sync-shopify-discounts.mjs
```

Use `--dry-run` to print what would be written without touching the metafield,
and `--disable` to switch every badge off while keeping the data.

The token comes from a custom app (Shopify admin → **Settings → Apps and sales
channels → Develop apps**) with the Admin API scopes `read_discounts`,
`read_products`, `read_metafields`, `write_metafields`.

### The staleness guard

A discount you **delete or disable** in Shopify stays in the metafield until
the next sync. To bound how long a stale badge could survive, the whole feature
switches itself off once the mirror is older than `max_age_days` (default
**30**). Badges simply stop appearing — nothing breaks, and the next sync brings
them back.

A daily scheduled run keeps that from ever happening. If you would rather the
data never expire, set `max_age_days` to `0` in `tools/sync-shopify-discounts.mjs`
and re-run — but then a deleted discount will keep showing until you sync.

## 4. Things to be aware of

- **Discount codes still have to be entered.** The badge says so ("met code
  WELKOM20"), and Shopify will not apply the code on its own. Automatic
  discounts do apply on their own, which is why they are worded differently.
- **"One use per customer" is shown but cannot be checked.** The storefront
  does not know whether a given visitor has already used `WELKOM10`. The
  condition is printed on the product page for exactly that reason.
- **Discount codes and the automatic discount do not stack** in the current
  configuration — all four discounts have `combinesWith` set to false for both
  order and product discounts. If a shopper enters `WELKOM20`, Shopify applies
  the code and drops the automatic 10%.
- **Multi-quantity lines.** Shopify rounds a percentage discount on the line
  total. The price shown is the quantity-1 price, so a large quantity can differ by
  a cent from the theme's figure × quantity. The cart and checkout always show
  Shopify's real number.
- **Markets / multi-currency.** Amounts go through Liquid's `money` filter, so
  they follow the presentment currency. Fixed-amount discounts are stored in
  the shop currency; on a store selling in several currencies, prefer
  percentage discounts for the clearest display.
- **The metafield caps at 64 KB.** The sync refuses to write past 60 KB. With
  collection-scoped discounts over very large collections you would need to
  split the payload; the current store uses about 2 KB.

## 5. Files

| File | Role |
| --- | --- |
| `theme/snippets/besjaar-discount-badge.liquid` | Resolves and renders the applicable discount |
| `theme/assets/besjaar-discount-badge.css` | Badge and product-page block styling |
| `theme/sections/besjaar-discount-1174.liquid` | Loads the stylesheet once per page (header group) |
| `theme/sections/header-group.json` | Registers that carrier section |
| `theme/snippets/product-card.liquid` | Search results, recommendations |
| `theme/snippets/besjaar-grouped-product-card.liquid` | Collection pages |
| `theme/snippets/premium-home-product-card.liquid` | Home "Premium shower range" |
| `theme/snippets/besjaar-shop-card.liquid` | Shop cards |
| `theme/snippets/shower-product-card.liquid` | Shower collection cards |
| `theme/sections/besjaar-store-product.liquid` | Product page buy box |
| `tools/sync-shopify-discounts.mjs` | Admin API → metafield sync |
| `docs/discount-metafield.example.json` | The payload currently written to the shop |
