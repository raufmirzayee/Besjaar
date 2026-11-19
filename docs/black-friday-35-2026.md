# Black Friday 2026: 35% off the compare-at price, all discount codes stopped

Period: from 19 Nov 2026 until **30 Nov 2026 23:59 Amsterdam time** (2026-11-30T22:59:59Z).
That is the same end as the existing "Black Friday 25% korting op alles" code.

## Prices (compare-at price unchanged; new price = compare-at × 0.65, rounded down to the cent)

| Product | Variant ID | Compare-at | Price before | BF price |
|---|---|---|---|---|
| Douchekop – 3 Standen – Chroom | 54600092909895 | 25.99 | 19.99 | 16.89 |
| Vervangfilters – Set van 2 | 54600303345991 | 12.99 | 9.99 | 8.44 |
| Douchekop met Slang 1,5 m – 3 Standen | 54600550744391 | 34.99 | 29.99 | 22.74 |
| Douchekop met Filter – 10 Standen (zonder slang) | 54600773992775 | 29.99 | 25.99 | 19.49 |
| Douchekop met Filter en Slang – 10 Standen | 54600792768839 | 34.99 | 30.99 | 22.74 |
| Doucheslang 1,5 m | 55510917382471 | 11.99 | 9.99 | 7.79 |
| Complete Doucheset – Chroom | 55801259819335 | 249.99 | 199.99 | 162.49 |
| Design Doucheset – Mat Zwart | 55802120732999 | 249.99 | 199.99 | 162.49 |

Product IDs (same order): 10997729591623, 10997821243719, 10997944648007, 10998051602759,
10998054912327, 11374965653831, 11505826103623, 11506247958855.

## Discount codes before the change (all ACTIVE)

| Code | Title | Node ID | startsAt | endsAt | Action |
|---|---|---|---|---|---|
| STRAAL-ZBXT6M | WELKOM10 | DiscountCodeNode/1918469046599 | 2026-09-08T14:20:35Z | – | paused: startsAt → 2026-11-30T23:00:00Z |
| WELKOM15 | WELKOM15 | DiscountCodeNode/1918469374279 | 2026-09-08T14:24:12Z | – | paused: startsAt → 2026-11-30T23:00:00Z |
| VOLLESTRAAL-639SC5 | WELKOM20 | DiscountCodeNode/1918469472583 | 2026-09-08T14:25:21Z | – | paused: startsAt → 2026-11-30T23:00:00Z |
| WELKOMSHIP | WELKOMSHIP (free shipping) | DiscountCodeNode/1918469701959 | 2026-09-08T14:26:02Z | – | paused: startsAt → 2026-11-30T23:00:00Z |
| SHOP20 | SHOP20 | DiscountCodeNode/1923674505543 | 2026-09-27T18:47:00Z | – | paused: startsAt → 2026-11-30T23:00:00Z |
| SHOP15 | SHOP15 | DiscountCodeNode/1923683516743 | 2026-09-27T18:47:00Z | – | paused: startsAt → 2026-11-30T23:00:00Z |
| CLUBFILTER20 | Besjaar Club – 20% op vervangfilters | DiscountCodeNode/1926067061063 | 2026-10-06T00:00:00Z | – | paused: startsAt → 2026-11-30T23:00:00Z |
| ER_BlackFriday | ER_BlackFriday | DiscountCodeNode/1935108079943 | 2026-11-04T11:18:27Z | – | ended now (Black Friday code) |
| VROEG20-PJX6SL | Black Friday-popup – 20% bij aanmelding | DiscountCodeNode/1935359082823 | 2026-11-05T10:00:00Z | 2026-11-20T23:00:00Z | ended now (Black Friday code) |
| BLACKFRIDAY25 | Black Friday 25% korting op alles | DiscountCodeNode/1939465994567 | 2026-11-18T09:20:38Z | 2026-11-30T22:59:59Z | ended now (Black Friday code) |

Paused codes start working again by themselves on 1 Dec 00:00 Amsterdam time (2026-11-30T23:00:00Z).

Not a code, left on: the automatic "Besjaar Club – ledenprijs 20% op vervangfilters"
(DiscountAutomaticNode/1926094061895). It applies only to Club members.

## Restore after Black Friday

- Prices: set each variant back to its "Price before" value. Compare-at prices were not changed.
- Codes: nothing to do. They restart on 1 Dec. To restore the exact original `startsAt`, use the values above.

## Done on 19 Nov 2026 (about 10:16 UTC)

- All 8 prices changed. Checked on the storefront: `/products/besjaar-douchefilter.js` returns 8.44 against 12.99, and the collection shows "35% KORTING" badges.
- No market price list overrides them. The only price list is Channable's, at a 0% adjustment with no fixed prices.
- 7 codes are SCHEDULED for 2026-11-30T23:00:00Z. ER_BlackFriday, VROEG20-PJX6SL and BLACKFRIDAY25 are EXPIRED (endsAt 2026-11-19T10:16:03Z).

## Theme: pop-ups that hand out codes

The live theme already hides the welcome pop-up from 21 Nov 00:00 to 1 Dec 00:00 Amsterdam.
Until 21 Nov 00:00, though, it shows the "Black Friday: 20% korting" pop-up, and that pop-up applies VROEG20-PJX6SL, which has now ended.

Fix in the unpublished copy "Besjaar – adres 37 B" (205100581191), which also holds the address change:

- `snippets/besjaar-welcome-offer-main.liquid` is a byte-identical copy of the original snippet (checksum 962fe79b…).
- `snippets/besjaar-welcome-offer.liquid` is now a small gate: it renders the original only from 1796079600 (1 Dec 2026 00:00 Amsterdam).
- Checked in preview on `/`, `/en`, `/collections/showerhead` and `/products/besjaar-douchefilter`: no pop-up tab, no Liquid errors.

The connector cannot publish themes. Publish the copy in Online Store → Themes.

## Scheduled

A scheduled task fires into this session on 1 Dec 2026 00:00 Amsterdam (trig_01FqUKKZd9G7eokViDCbvmvs) to restore the prices above.
If it cannot run, restore the "Price before" values by hand.

## Update 19 Nov, afternoon

- The user published "Besjaar – adres 37 B" (205100581191) around 12:22 UTC. The new address and the pop-up gate are live.
- Black Friday messaging was built in a new copy, "Besjaar – Black Friday 35%" (205111918919). It waits for the user to publish it.
  See `theme-changes/2026-11-19-black-friday/README.md`.
