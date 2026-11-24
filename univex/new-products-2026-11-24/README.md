# Univex: check of the newly listed products, 24 Nov 2026

Univex had 48 products. The 23 Nov audit covered 32 of them. These 16 were checked here:

- **11 created on 24 Nov:**
  - 9 active Besjaar shower products: 2 black filter shower heads, 4-standen shower head, 2 XL rain shower heads, 2 shower hoses, the thermostatic set (mat zwart) and the rain shower set (chroom).
  - 2 drafts: glijstangen.
- **5 activated recently:** Rynex RC Stuntauto, Pimple Patches, Neusstrips, Lynex Airstyler 7-in-1, Besjaar Airstyler 5-in-1 Blauw.

## Fixed

| What | Details |
|---|---|
| **My own mistake from 23 Nov, repaired** | Removing " \| Univex" with `productUpdate(seo: {title})` also cleared the SEO description of the 5 chrome shower products. Shopify replaces the whole SEO object. The descriptions were restored with the exact original text, and their 20 translations were registered again so none show as outdated. |
| Translations | The 9 new active shower products existed only in Dutch, so /de, /en, /fr and /es showed Dutch text. They now have title, URL handle, product type, SEO title, SEO description and full description in de/en/fr/es (216 texts, `translations.json`). The 4-standen option "Uitvoering: Met slang / Zonder slang" is translated too. The black filter shower heads reuse the existing chrome translations with the colour changed. |
| Wrong line in the black "Douchekop met Filter" | It told customers to choose the option "Met slang", which that product doesn't have. It now points to the black "Douchekop met Filter en Slang". |
| Empty SEO descriptions | Both black filter shower heads now have one (nl + 4 languages). |
| Image alt texts | 35 images had none: RC car 7, pimple patches 7, neusstrips 7, Lynex Airstyler 7-in-1 13, massage gun 1 (`image-alts.json`). |
| Black filter shower heads priced at the Black Friday price without a crossed-out price | Given the same compare-at as their chrome twins: €28,60 and €31,34. |
| Black Friday prices | The user chose "Only the 10 new ones". The same deal as the rest (+10% crossed out, 15% off) was applied to the 10 new products (11 variants): see `../black-friday-2026/prices.json`. The RC car (44.99/49.99), massage gun (25.99/29.99) and Lynex 7-in-1 (83.37/99.99) keep the prices the user set. The banner therefore reads "10% korting op alles", which is now true for every active product. |
| 1 Dec restore | `prices.json` and `restore.graphql` now hold 57 variants (44 + 13: these 11 plus the 2 black heads, whose normal prices are 26.00 and 28.49 like the chrome ones). The scheduled task's prompt was updated. It also reports the 3 products with user-set crossed-out prices, which stay crossed out after Black Friday unless the user removes them. |
| Category order | New products had been added at the bottom of every category. New order (`collections-reorder.graphql`): |
| | **Douche & badkamer:** filter heads (chrome, then black), 4-standen, 3-standen pair, the two sets, XL rain heads, accessories, drafts last. |
| | **Besjaar:** the same shower block first, then the lamps etc. as before. Airstyler blauw sits next to the white one. |
| | **Producten (/collections/all):** each new product placed next to its twin or category. |
| | **Verzorging & wellness:** airstylers together, then brush, massage gun, neusstrips, patches. |

## Not changed (user's decision)

- **Chrome rain shower set at €300** (Black Friday €280,50). The user confirmed €300 is right, even though the thermostatic set with tap costs €198.
- **Pimple patches.** The photos show "Acne Patch – Salicylic Acid" with tea tree oil and calendula. The text describes plain hydrocolloid, and the user confirmed the text is right, so **the photos need replacing** (user).
- **Glijstangen (2 drafts).** Price €0.00, no photos, no description. They stay drafts until the user completes them; they are not visible in the shop.
- **RC Stuntauto has no category.** It is only in "Rynex" and "Producten". "Hobby & creatief" is written entirely about the markers, so the car doesn't fit there. A "Speelgoed" or "Cadeaus" category would be needed.
- **Possible claim to check:** the rain shower texts say "doorstroomklasse Z (4,2–6,9 L/min)". Please check that this class matches the product's certificate; it was translated as written.
