# Univex Shop: Black Friday 2026 prices

**Shop:** Univex Shop (uztncp-vt.myshopify.com, univexbv.com)
**Changed:** 23 Nov 2026, about 10:15 UTC
**Scope:** the 44 variants of all 32 active products. Draft products were not touched.

## What was done (the user's choice)

- **Compare-at (crossed-out) price:** current price + 10%, rounded to the cent. None of these products had one before.
- **Sale price:** 15% off that compare-at price, rounded down to the cent.
- **What the shop shows:** "15% korting" (15.0–15.1%).
- **Real saving against the price before:** 6.5–6.6%.

## Compliance note

The user was told before the change that the crossed-out prices are not prices the shop ever charged.
Under the EU price indication rules (Omnibus, enforced in the Netherlands by the ACM), a discount must be measured from the lowest price of the previous 30 days.
The user chose this option anyway.

## Restore

A scheduled task (trig_01FqUKKZd9G7eokViDCbvmvs) fires on 1 Dec 2026 00:00 Amsterdam. It runs `restore.graphql`, which sets each price back to `price_before` and the compare-at price back to none.

Before writing, it checks:
- that the connector is on this shop (switching if needed);
- that each variant is still at its Black Friday price.

The task also restores Besjaar.

Files:
- `prices.py`: calculation and generator. It writes `prices.json`, `apply.graphql` and `restore.graphql`.
- `apply.graphql`: the mutation that was run. All 44 variants were confirmed by the API with no errors.

## Prices

| Product | Variant | Before | Crossed-out (compare-at) | Black Friday price | Shown | Real saving vs before |
|---|---|---|---|---|---|---|
| Besjaar Douchekop met Filter en Slang |  | 28.49 | 31.34 | 26.63 | 15% | 6.5% |
| Besjaar Douchekop met Filter |  | 26.00 | 28.60 | 24.31 | 15% | 6.5% |
| Besjaar Douchekop met Slang 3 Standen |  | 28.49 | 31.34 | 26.63 | 15% | 6.5% |
| Besjaar Douchekop 3 Sproeistanden |  | 15.19 | 16.71 | 14.20 | 15% | 6.5% |
| Besjaar Douchefilter Navulset 2 st. |  | 10.19 | 11.21 | 9.52 | 15% | 6.6% |
| Besjaar Militaire Zaklamp 2000 lm | 1 stuk | 12.34 | 13.57 | 11.53 | 15% | 6.6% |
| Besjaar Militaire Zaklamp 2000 lm | 1 stuk + batterijen | 17.99 | 19.79 | 16.82 | 15% | 6.5% |
| Besjaar Militaire Zaklamp 2000 lm | 2 stuks + batterijen | 15.19 | 16.71 | 14.20 | 15% | 6.5% |
| Besjaar Zaklamp 5000 lm |  | 25.00 | 27.50 | 23.37 | 15% | 6.5% |
| Besjaar Zaklamp 7800 lm |  | 39.99 | 43.99 | 37.39 | 15% | 6.5% |
| Besjaar Zaklamp 9000 lm |  | 44.99 | 49.49 | 42.06 | 15% | 6.5% |
| Besjaar UV Zaklamp |  | 19.99 | 21.99 | 18.69 | 15% | 6.5% |
| Besjaar Hoofdlamp 1000 lm |  | 15.59 | 17.15 | 14.57 | 15% | 6.5% |
| Besjaar Hoofdlamp Bewegingssensor | 400 lumen | 9.99 | 10.99 | 9.34 | 15% | 6.5% |
| Besjaar Hoofdlamp Bewegingssensor | 500 lumen | 9.99 | 10.99 | 9.34 | 15% | 6.5% |
| Besjaar Solar Buitenlamp |  | 19.99 | 21.99 | 18.69 | 15% | 6.5% |
| Besjaar Draadloze Deurbel | 1 ontvanger | 15.99 | 17.59 | 14.95 | 15% | 6.5% |
| Besjaar Draadloze Deurbel | 2 ontvangers | 22.50 | 24.75 | 21.03 | 15% | 6.5% |
| Besjaar Sigarettendoosje | Zwart | 9.99 | 10.99 | 9.34 | 15% | 6.5% |
| Besjaar Sigarettendoosje | Zilver | 9.99 | 10.99 | 9.34 | 15% | 6.5% |
| Besjaar Sigarettendoosje | Goud | 9.99 | 10.99 | 9.34 | 15% | 6.5% |
| Besjaar Sigarettendoosje met Aansteker | Zwart | 15.99 | 17.59 | 14.95 | 15% | 6.5% |
| Besjaar Sigarettendoosje met Aansteker | Zilver | 15.99 | 17.59 | 14.95 | 15% | 6.5% |
| Besjaar Sigarettendoosje met Aansteker | Goud | 15.99 | 17.59 | 14.95 | 15% | 6.5% |
| Besjaar Airstyler 5-in-1 Wit/Goud |  | 49.99 | 54.99 | 46.74 | 15% | 6.5% |
| Rynex Muizenval 6 st. |  | 15.99 | 17.59 | 14.95 | 15% | 6.5% |
| Rynex Keukenweegschaal | Zwart | 19.99 | 21.99 | 18.69 | 15% | 6.5% |
| Rynex Keukenweegschaal | Wit | 19.99 | 21.99 | 18.69 | 15% | 6.5% |
| Rynex Telefoonhouder Fiets |  | 15.20 | 16.72 | 14.21 | 15% | 6.5% |
| Rynex Telefoonhouder Auto |  | 15.99 | 17.59 | 14.95 | 15% | 6.5% |
| Rynex SD Kaartlezer |  | 8.99 | 9.89 | 8.40 | 15% | 6.6% |
| Rynex Wereldstekker USB-C |  | 15.99 | 17.59 | 14.95 | 15% | 6.5% |
| Rynex Laptopstandaard | Zwart | 12.99 | 14.29 | 12.14 | 15% | 6.5% |
| Rynex Laptopstandaard | Zilver | 12.99 | 14.29 | 12.14 | 15% | 6.5% |
| Rynex Mini Massage Gun |  | 19.99 | 21.99 | 18.69 | 15% | 6.5% |
| Rynex Twinmarkers | 80 stuks | 19.49 | 21.44 | 18.22 | 15% | 6.5% |
| Rynex Twinmarkers | 168 stuks | 24.38 | 26.82 | 22.79 | 15% | 6.5% |
| SlimHome Waterkoker Temperatuur | Glas | 34.99 | 38.49 | 32.71 | 15% | 6.5% |
| SlimHome Waterkoker Temperatuur | RVS | 34.99 | 38.49 | 32.71 | 15% | 6.5% |
| SlimHome Glazen Waterkoker Retro |  | 29.99 | 32.99 | 28.04 | 15% | 6.5% |
| Lynex Thermal Brush |  | 49.95 | 54.95 | 46.70 | 15% | 6.5% |
| Besjaar LED Kweeklamp |  | 29.99 | 32.99 | 28.04 | 15% | 6.5% |
| Rynex USB-C naar USB-A Adapter 3 st. |  | 7.99 | 8.79 | 7.47 | 15% | 6.5% |
| Rynex Wereldstekker Geaard |  | 29.99 | 32.99 | 28.04 | 15% | 6.5% |
