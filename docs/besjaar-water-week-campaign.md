# BESJAAR WATER WEEK 💧 — Nationale Kraanwaterdag campaign

A temporary campaign for the Dutch market, **21 – 30 September 2026**.

- Name: **BESJAAR WATER WEEK 💧**
- Tagline: *Meer uit je water. Meer uit je douche.*
- Promotional line: *Profiteer t/m 30 september van 15% korting*
- CTA: **Bekijk de actie →**

It is built on top of the discount-visibility work described in
[`shopify-discount-visibility.md`](shopify-discount-visibility.md); read that
first for why a metafield mirror exists at all.

---

## 1. The campaign carries no discount of its own

Everything the campaign shows is driven by **one real automatic Shopify
discount**. The theme cannot invent a promotion, and it cannot keep one on
screen after Shopify stops applying it.

The link is made by title. `tools/sync-shopify-discounts.mjs` has:

```js
const CAMPAIGN = {
  enabled: true,
  match_title: 'BESJAAR WATER WEEK',   // ← the Shopify discount's title
  ...
};
```

At sync time the script looks for an automatic discount whose title contains
that text **among the discounts it is already allowed to advertise** — so a
campaign can never be linked to a code, a customer-segment discount or anything
with a minimum. If it finds one it records `campaign.discount_id`. If it does
not, it writes `linked: false` and says so:

```
Campaign "BESJAAR WATER WEEK 💧" is NOT linked and will not appear.
  No advertisable automatic discount has a title containing "BESJAAR WATER WEEK".
```

## 2. What has to be true before anything renders

Re-checked on **every request**, not just at sync time:

1. the discount mirror is present, enabled and not stale;
2. the campaign is enabled **and** was linked to a discount;
3. now is inside the campaign window (21 Sept 00:00 → 1 Oct 00:00, Amsterdam);
4. that exact discount is still in the mirror **and** inside its own window;
5. for the product block: the product is actually covered by that discount;
6. for the banner: the shopper's market country is in the campaign's list (NL).

Fail any one and the campaign renders nothing at all — no banner, no badge
wording, no countdown.

**The percentage is never hard-coded.** The badge reads
`{discount value} KORTING` and the line is `Profiteer t/m 30 september van
{value} korting`, both filled from the discount itself. Change the discount to
20% in Shopify, re-sync, and every surface says 20%.

## 3. What the shopper sees

| Surface | What appears |
| --- | --- |
| Campaign bar (all pages, NL) | One compact line: name · tagline · promotional line · countdown · **Bekijk de actie →**. The whole bar is the link. As the viewport narrows it drops the tagline (1180px), then the CTA label (900px), then the countdown (700px), then the campaign name (560px), so the offer always fits on one line. |
| Product cards — collections, search, recommendations, home range, shower cards | Badge reads **15% KORTING** instead of the usual `-15%`, plus the discounted price in red with the original struck through |
| Product page | The same badge at the top of the buy box and the discounted price. There is no separate campaign block in the buy box — the badge and price already carry it. |

Products **not** in the Shopify discount show nothing — no badge, no block. A
product with a different discount keeps the normal `-10%` badge; the campaign
wording is reserved for the campaign's own discount.

### Countdown

`assets/besjaar-campaign.js` fills `[data-bj-countdown]` from the end timestamp
Liquid renders. It reads *Actie eindigt over: 3 dagen 12 uur 25 min*, ships
hidden and only appears once there is a positive amount of time to show, so it
**can never display a negative value**. When the deadline passes while a page is
open it stops, hides itself and removes the campaign bar. It also re-checks on
`pageshow` and when a tab becomes visible again, so a tab left open overnight
does not show a stale number.

## 4. Turning it on

The campaign is already deployed and wired. It needs one thing: the discount.

1. Shopify admin → **Discounts → Create discount → Amount off products**.
2. Choose **Automatic discount** (not a discount code).
3. Title: **BESJAAR WATER WEEK** — this is what links it, so keep those words.
4. Value: **15%**, applied to the products or collections in the promotion.
5. **No minimum purchase amount and no minimum quantity.** A minimum would make
   the discounted price conditional, so the theme would refuse to advertise it
   and the sync would tell you why.
6. Active dates: starts **21 September 2026**, ends **30 September 2026** (end
   of day).
7. Re-run the sync:

```bash
SHOPIFY_STORE=bc8d9f-69.myshopify.com \
SHOPIFY_ADMIN_TOKEN=shpat_xxx \
node tools/sync-shopify-discounts.mjs
```

It will print `Campaign "BESJAAR WATER WEEK 💧" linked to discount ...`.

## 5. Testing before publishing

1. Preview the unpublished theme
   (`https://www.besjaar.eu/?preview_theme_id=<id>`).
2. **Banner** — visible at the top of every page. If it is missing, the sync
   output will say whether the campaign is linked.
3. **Collection page** — campaign products show `15% KORTING` and the
   discounted price; anything outside the discount shows nothing.
4. **Product page** — badge, discounted price, campaign block and countdown.
5. **Prove it is real** — add a campaign product to the cart and open checkout.
   Shopify deducts the 15% automatically, matching the price on the page.
6. **Prove it is not fake** — pause the discount in Shopify, re-run the sync,
   reload: the whole campaign disappears. Un-pause and re-sync to bring it back.
7. **Test the ending** — temporarily set `CAMPAIGN.ends_at` to a few minutes
   from now, re-sync, and watch the countdown run out and the bar remove itself.
   Put the real date back afterwards.
8. **Mobile** — the bar stacks to name/tagline, line, countdown, CTA.

## 6. Ending the campaign

**It ends by itself.** At 00:00 on 1 October (Amsterdam) the campaign window
closes and the banner, campaign badge wording and countdown stop rendering. The
Shopify discount's own end date does the same independently. No deploy, no edit,
nothing to remember.

When you want to remove the code as well, in increasing order of thoroughness:

1. **Switch it off** — set `enabled: false` in `CAMPAIGN` in
   `tools/sync-shopify-discounts.mjs` and re-run. Everything goes quiet; the
   files stay put and can be reused for the next campaign by changing the copy,
   the dates and `match_title`.
2. **Remove the banner section** — delete the `besjaar-campaign` entry from
   `sections/header-group.json` (both the `sections` object and the `order`
   array), or switch it off in the theme editor under the header group.
3. **Delete the files** — `sections/besjaar-campaign-1175.liquid`,
   `snippets/besjaar-campaign.liquid`, `assets/besjaar-campaign.css` and
   `assets/besjaar-campaign.js`. Also drop the
   `bjd_campaign_badge` block in `snippets/besjaar-discount-badge.liquid` if you
   want the badge to go back to `-15%` permanently.

Steps 2 and 3 are optional. Nothing else in the theme depends on these files,
and the ordinary discount badges keep working either way.

## 7. Things to be aware of

- **The existing announcement bar** ("GRATIS VERZENDING IN NL VANAF €25") still
  shows below the campaign bar. Two bars is a lot; consider switching
  `show_announcement` off in the header section for the duration of the campaign.
- **Banner targeting** is by market country (`NL`). Change `countries` in
  `CAMPAIGN` — `[]` means everywhere. The copy is Dutch only; the campaign is a
  Dutch national day, so there is no EN/DE/FR translation. The product-page
  block is not country-gated, because a shopper looking at a discounted product
  should see why it is discounted.
- **Dates are Amsterdam time.** `ends_at` is `2026-10-01T00:00:00+02:00`, i.e.
  the first moment after the campaign, so the whole of 30 September counts.
- **If the discount and the campaign dates disagree**, the stricter of the two
  wins, because both windows are checked.

## 8. Files

| File | Role |
| --- | --- |
| `theme/snippets/besjaar-campaign.liquid` | Campaign resolution and the single-line bar |
| `theme/sections/besjaar-campaign-1175.liquid` | Header-group carrier: renders the bar, loads CSS/JS |
| `theme/assets/besjaar-campaign.css` | Bar and product-block styling |
| `theme/assets/besjaar-campaign.js` | Countdown |
| `theme/sections/header-group.json` | Registers the carrier |
| `theme/snippets/besjaar-discount-badge.liquid` | Badge says "15% KORTING" during the campaign |
| `tools/sync-shopify-discounts.mjs` | `CAMPAIGN` config and the title → discount link |
