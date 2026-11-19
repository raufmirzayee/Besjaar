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
