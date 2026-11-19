# Black Friday 2026 messaging (theme "Besjaar – Black Friday 35%", 205111918919)

A copy of the live theme "Besjaar – adres 37 B" (205100581191) with one new section, `sections/besjaar-black-friday-2026.liquid`.
The section is added to `sections/header-group.json` as `besjaar-black-friday`, after `header`. That makes 25 sections, Shopify's maximum for a group.

What visitors see until 1 Dec 2026 00:00 Amsterdam:

- **Homepage:** a large black Black Friday banner directly under the menu: "35% korting op alles", "geen code nodig", a live countdown (days, hours, minutes, seconds) and a "Shop alle Black Friday-deals" button.
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
