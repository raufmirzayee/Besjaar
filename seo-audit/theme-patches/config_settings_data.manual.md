# Manual change: Bol.com brand page URL (theme setting)

File: `config/settings_data.json` → key `bol_brand_url` (Theme editor › Theme settings › "Bol.com brand page URL").

- Current value (verified 2026-11-07): `https://www.bol.com/nl/nl/p/besjaar-douchekop-met-slang-douchekop-regendouche-wellness-3-sproeistanden-hoge-druk-betere-huid-handdouche-luxe-moderne-handdouche-chrome/9300000187428486/` (a single **product listing**)
- Replace with: `https://www.bol.com/nl/nl/b/besjaar/603580876/` (the Besjaar **brand page**, already linked on /pages/reviews)

Why: the setting feeds `Organization.sameAs` and `Brand.sameAs` in the JSON-LD on every page. `sameAs` should identify the organization (profiles/brand pages), not one product offer. The product URL also contains "betere-huid", a skin claim the store does not make elsewhere.

Not applied by API because rewriting the auto-generated `settings_data.json` by hand risks overwriting other settings; it is a 10-second change in the theme editor of the preview theme (or the live theme).
