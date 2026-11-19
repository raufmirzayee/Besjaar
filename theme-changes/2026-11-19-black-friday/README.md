# Black Friday 2026 messaging (theme "Besjaar – Black Friday 35%", 205111918919)

A copy of the live theme "Besjaar – adres 37 B" (205100581191) with one new section, `sections/besjaar-black-friday-2026.liquid`.
The section is added to `sections/header-group.json` as `besjaar-black-friday`, after `header`. That makes 25 sections, Shopify's maximum for a group.

What visitors see until 1 Dec 2026 00:00 Amsterdam:

- **Homepage:** a compact black Black Friday banner directly under the menu, about 150 px tall on desktop and 135 px on phones. It shows "Black Friday · t/m 30 november · geen code nodig", "35% korting op alles", a live countdown (days, hours, minutes, seconds) and a "Shop alle Black Friday-deals" button ("Shop de deals" on phones).
- **Every other page:** a black bar under the menu: BLACK FRIDAY · 35% korting op alles · Geen code nodig · t/m 30 november · Nog 11d 10u 25m · Shop de deals →.
- **Product cards:** the discount badge reads "BLACK FRIDAY / 35% KORTING", in black and lime.
- **Product page:**
  - the badge next to the price reads "BLACK FRIDAY · 35% KORTING";
  - the photo badge reads "BLACK FRIDAY · BESPAAR €…";
  - a black line under the price reads "Black Friday-prijs: 35% korting t/m 30 november. Geen code nodig."
- All text is translated for nl, en, de, fr and es.

It switches itself off at 1796079600 (1 Dec 2026 00:00 Amsterdam), the same moment the prices go back and the codes restart.
A page left open past that moment removes the banner and badges in the browser. Nothing needs to be edited afterwards.

Verified in preview with Playwright (desktop 1440 px and iPhone 13) on the homepage, `/collections/showerhead` and `/products/besjaar-douchefilter`: no Liquid errors and no horizontal scroll.
The uploaded section's checksum matches this file.

To make it live: Online Store → Themes → "Besjaar – Black Friday 35%" → ⋯ → Publish.

## Update: compact banner (theme "Besjaar – Black Friday 35% (compact)", 205113196871)

After the first version went live, the user found the homepage banner too big.
It was about 480 px tall and is now about 150 px on desktop and 135 px on phones.
Only `sections/besjaar-black-friday-2026.liquid` changed.

To make it live: Online Store → Themes → "Besjaar – Black Friday 35% (compact)" → ⋯ → Publish.

## Update: one line at the top (same theme, 205113196871)

At the user's request, the Black Friday message is now a single line at the very top of every page.
It replaces the announcement strip ("Gratis verzending vanaf €25 · Morgen in huis · 30 dagen retour"), which is hidden with CSS until 1 Dec.
The homepage banner was removed.

`sections/header-group.json` now places `besjaar-black-friday` directly before `header`.
The bar is 40 px tall on desktop and 38 px on phones.

Verified on `/` (1920 px), `/collections/showerhead` (1440 px), and `/` and `/products/besjaar-douchefilter` (iPhone 13):

- the bar sits at the top of the page;
- the announcement strip is hidden;
- there are no Liquid errors and no horizontal scroll.

## Update: no line under the price (theme "Besjaar – Black Friday 35% (zonder prijsregel)", 205115523399)

The user published 205113196871 and then asked to remove the black "Black Friday-prijs: 35% korting t/m 30 november. Geen code nodig." line under the product price.
It is removed in a fresh copy of the live theme. The top line and the Black Friday badges are unchanged.
Checked in preview on `/products/besjaar-douchefilter` (desktop) and `/products/besjaar-complete-doucheset` (iPhone 13): no line under the price, no Liquid errors.

To make it live: Online Store → Themes → "Besjaar – Black Friday 35% (zonder prijsregel)" → ⋯ → Publish.

## Update: deals link and wrong "20% KORTING" badges (theme "Besjaar – Black Friday 35% (deals-link)", 205116080455)

- **Deals link.** "Shop de deals" now goes to `/collections/all#Collection-showerhead`, so the shower heads are on screen right away instead of the hero at the top.
- **Wrong 20% badges.** `/collections/all` showed "BLACK FRIDAY 20% KORTING" to a shopper who had claimed a welcome code or the Black Friday early-access code.
  - Cause: `assets/besjaar-x-welcome-applied-2.js` rewrites prices and badges to the claimed code's price. The early-access claim never expires.
  - All codes are paused, so checkout would not give that price.
  - Fix: the Black Friday section empties `rewards` in `#BesjaarWelcomeAppliedConfig` when the document turns "interactive", just before the deferred script reads it. This only happens until 1 Dec 00:00, and nothing is removed from shoppers' browsers.
- **Verified with Playwright**, with both claims set in localStorage:
  - live theme: "20% KORTING";
  - this preview: "35% KORTING", no welcome notice.
  - Clicking the bar on the homepage lands on `/collections/all#Collection-showerhead` with the shower head cards fully in view.

To make it live: Online Store → Themes → "Besjaar – Black Friday 35% (deals-link)" → ⋯ → Publish.

## Update: 30% (theme "Besjaar – Black Friday 30%", 205135741255)

The top line reads its percentage from the real prices instead of a fixed "35%".
`collections.all` is scanned, and the smallest floor((compare-at − price) × 100 / compare-at) is used.
If no product is reduced, the section does not render.
Checked in preview on `/`, `/en/collections/all`, `/fr` and a product page: the line follows the prices ("35%" before the change, "30%" after) with no Liquid errors.

To make it live: Online Store → Themes → "Besjaar – Black Friday 30%" → ⋯ → Publish.
