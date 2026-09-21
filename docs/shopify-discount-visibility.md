# Showing real Shopify discounts on the Besjaar storefront

When an **automatic** Shopify discount is running on a product, the storefront
shows it while people browse: a `-20%` badge on the card, and the price they
actually pay leading, with the undiscounted price struck through beside it.

No theme-side discount system is invented, and `compare_at_price` is never
treated as a discount.

---

## 1. The Shopify limitation this works around

**Liquid has no discount object.** Shopify's storefront (Liquid) API exposes
`product`, `variant`, `collection`, `cart` and `line_item`, but nothing on a
product or variant says "a discount applies to me". Discounts only become
visible to the theme once a line is already in the cart:

| Where | What Liquid can see |
| --- | --- |
| Product page / collection / search | *Nothing.* No discount data at all. |
| Cart & cart drawer | `line_item.discount_allocations`, `cart.cart_level_discount_applications` |
| Checkout | Shopify renders it; the theme is not involved |

`compare_at_price` is **not** a discount. It is a merchandising number a
merchant types on the variant, and a product can have one with no Shopify
discount attached — which is exactly why the theme never treats it as one. The
theme's existing compare-at sale badge still works; it just steps aside when a
real discount badge is showing, so a card never carries two.

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
snippets/besjaar-discount-badge.liquid  →  badge + price on every card and PDP
```

The sync keeps only discounts that can be stated truthfully as a price, and
resolves collection- and variant-scoped discounts down to a list of product ids
so the theme does not have to walk `product.collections` on every card.

**The theme does not blindly trust the mirror.** On every single request the
snippet re-checks the schedule, the customer eligibility, the minimums, the
value type and the product scope, plus a freshness guard (below).

## 3. Automatic discounts only — no codes

Discount codes are **never** shown, anywhere. A code only takes effect once the
shopper types it at checkout, so a struck-through price next to it would not be
the price Shopify charges. Codes are dropped at sync time and would be dropped
again by the theme.

A discount is only shown when **all** of these hold:

1. It is an **automatic** discount (Shopify applies it by itself).
2. It is running right now — `startsAt` in the past, `endsAt` unset or future.
3. It reaches **every** shopper — no customer segment, no named customers.
4. It has **no minimum order value** and **no minimum quantity**. A minimum
   makes the discount conditional, so a single product's price cannot be
   restated from it.
5. Its value is **per item** — a percentage, or a fixed amount that applies to
   each item. An order-level amount is spread across the whole order.
6. It actually covers this product (and this variant, if variant-scoped).

That list is what makes the number on the page the number Shopify charges.

Each sync prints the discounts it skipped and why, so nothing disappears
silently:

```
1 automatic discount(s) shown on the storefront, 493 bytes:
  -10%     1 product(s)     10% KORTING

3 discount(s) not shown:
  WELKOM10 — discount code (codes are never shown on the storefront)
  WELKOM15 — discount code (codes are never shown on the storefront)
  WELKOM20 — discount code (codes are never shown on the storefront)
```

## 4. What the shopper sees

**On a product card** — collection pages, search, recommendations, the home
range and the shower cards:

- a red **`-10%`** badge, in the card's own existing badge slot (so it keeps the
  theme's position and shape, never covers the image, and never appears
  alongside the compare-at sale badge);
- the price line becomes **`€21,55`** in red with **`€23,95`** struck through
  beside it.

**On the product page**:

- the same `-10%` badge at the top of the buy box, next to BESJAAR®;
- the buy box price shows `€21,55` in red with `€23,95` struck through;
- one small line underneath: *Korting automatisch verrekend bij het afrekenen*
  (EN/DE/FR equivalents included) — because the deduction happens in the cart,
  not on the product record;
- switching variant keeps it correct: each `<option>` carries its own
  server-rendered discounted price, so no currency is ever formatted in
  JavaScript.

If a product also has a `compare_at_price`, that struck compare-at is
suppressed while a discount is showing, so the row never displays three
numbers.

**Rounding** matches Shopify's: half up, to the cent, on the variant price.
€23,95 − 10% = €2,395 → €2,40 → **€21,55**, which is what checkout charges.

## 5. Keeping it accurate

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

## 6. Things to be aware of

- **Set the discount up as an automatic product discount** (Shopify admin →
  Discounts → Create discount → **Amount off products** → Automatic discount).
  A discount code will not appear on the storefront by design.
- **Do not add a minimum order amount or quantity** to a discount you want
  shown — it would make the displayed price conditional, so the theme skips it
  and the sync tells you why.
- **Multi-quantity lines.** Shopify rounds a percentage discount on the line
  total. The price shown is the quantity-1 price, so a large quantity can differ
  by a cent from the theme's figure × quantity. Cart and checkout always show
  Shopify's real number.
- **Markets / multi-currency.** Amounts go through Liquid's `money` filter, so
  they follow the presentment currency. Fixed-amount discounts are stored in the
  shop currency; on a store selling in several currencies, prefer percentage
  discounts for the clearest display.
- **The "Recently viewed" strip** is built in the browser from `localStorage`
  (`assets/besjaar-1150.js`) and shows no badges of any kind today — not the
  sale badge, not the stock chip. Adding one would mean a second copy of the
  rule-resolution in JavaScript, so it was left out on purpose. Every
  server-rendered surface is covered.
- **The metafield caps at 64 KB.** The sync refuses to write past 60 KB. The
  current payload is under 1 KB.

## 7. Files

| File | Role |
| --- | --- |
| `theme/snippets/besjaar-discount-badge.liquid` | Resolves the discount; renders badge / price / note |
| `theme/assets/besjaar-discount-badge.css` | Red badge and price styling |
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
