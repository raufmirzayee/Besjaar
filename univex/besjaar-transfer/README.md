# Univex → Besjaar: shower products (25 Nov 2026)

The owner asked to add the shower products to the Besjaar store (www.besjaar.eu, bc8d9f-69.myshopify.com) and to move the Shopify connection from Univex to Besjaar.

## Step 1: export from Univex (done)

`shower-products.json` holds the 16 products of Univex's "Douche & badkamer" collection (14 active, 2 drafts), exported before the switch:

- title, description, URL handle, product type, vendor, tags, SEO title and description, product category
- options and variants: SKU, barcode, weight, stock policy, the Black Friday price shown now (`price`, `compareAtPrice`) and the normal price (`regular_price`, from `univex/black-friday-2026/prices.json`)
- images (Univex CDN URLs) with Dutch alt text and its de/en/fr/es translations
- metafields `custom.specificaties`, `custom.faq`, `custom.kleur`, `custom.uitvoering` (with de/en/fr/es translations) and `custom.kleuropties` (colour links between products)
- translations of title, description, handle, type and SEO in de/en/fr/es
- the collection itself, and the 4-spray head's option values "Met slang" / "Zonder slang" with translations

`category-metaobjects.json` lists the category values used (colour Zwart/Zilver, hose material, hardware material, shape).

`raw-products.json` is the unprocessed API answer.

## Step 2: connect Besjaar (done)

The Shopify connector is signed in to Besjaar (bc8d9f-69.myshopify.com, www.besjaar.eu). Nothing was written to Univex.

## Step 3: create in Besjaar (plan)

1. Check Besjaar's languages, existing products (the original Besjaar shower heads are probably there already), collections, metafield definitions and theme, so nothing is created twice.
2. Create the missing products with images, variants, normal prices (no crossed-out price), specs, FAQ and colour links, in the right collection, with translations for the languages Besjaar has.
3. The two slide rails stay drafts (no price yet), as in Univex.

Prices: Besjaar runs its own Black Friday sale (30%/35% off a fixed list of 8 variants; the scheduled task "End Black Friday sale (Besjaar + Univex Shop)" restores them on 1 Dec). New products get their normal price and are not added to that sale, so the 1 Dec task needs no change.

## Step 4: result in Besjaar (25 Nov 2026)

### Created (9)

| Univex ID | Besjaar ID | Handle | Price | Status | Collections |
|---|---|---|---|---|---|
| 16013754532188 | 11608095129927 | besjaar-douchekop-4-sproeistanden | 25.99 met slang / 19.99 zonder slang | ACTIVE | Douchekoppen |
| 16013887930716 | 11608096506183 | besjaar-douchekop-met-filter-zwart | 26.00 | ACTIVE | Douchekoppen, Douchekop met filter |
| 16013887897948 | 11608098537799 | besjaar-douchekop-met-filter-en-slang-zwart | 28.49 | ACTIVE | Douchekoppen, Douchekop met filter |
| 16013727301980 | 11608100307271 | besjaar-regendoucheset-chroom | 300.00 | ACTIVE | Douchesets |
| 16013899759964 | 11608102961479 | besjaar-regendouchekop-xl-30-cm-chroom | 99.99 | ACTIVE | Douchekoppen |
| 16013930856796 | 11608107221319 | besjaar-regendouchekop-xl-30-cm-zwart | 99.99 | ACTIVE | Douchekoppen |
| 16013947699548 | 11608252449095 | besjaar-doucheslang-150-cm-zwart | 9.99 | ACTIVE | Douchekoppen, Accessoires |
| 16013942817116 | 11608255103303 | besjaar-glijstang-60-cm-chroom | 0.00 | DRAFT | Accessoires |
| 16013955662172 | 11608256217415 | besjaar-glijstang-hoofd-handdouche-chroom | 0.00 | DRAFT | Accessoires |

- Prices are the normal `regular_price`, with no compare-at price. The products are not in the Black Friday sale, and the 1 Dec restore task was not changed.
- Vendor is Besjaar. Title, description, handle, type, tags, SEO, category, SKU, barcode, weight and stock policy were copied. Stock is 1000 per variant at "Shop location" (Besjaar tracks stock there).
- Images use the Univex CDN URLs, in the same order and with the same Dutch alt text. The 4-spray head's two variants each have their own image.
- Metafields `custom.specificaties`, `custom.faq`, `custom.kleur` and `custom.uitvoering` were copied.
- `custom.kleuropties` was rebuilt with Besjaar IDs. It is also set on the existing chrome twins so the links go both ways:
  - filter heads: 10998054912327 (chrome, met slang), 10998051602759 (chrome, zonder slang), 11608098537799, 11608096506183
  - XL rain heads: 11608102961479, 11608107221319
  - hoses: 11374965653831 (chrome, existing), 11608252449095
- Category values were set where Besjaar has the same value: colour Zwart → 725763227975, Zilver → 514288812359, shape Rond → 514288845127. Skipped: Rechthoekig, Metaal and the hose material, because Besjaar has no such values yet.
- The 7 active products are published to the same 6 channels as the existing shower products: Online Store, POS, Shop, Facebook, Google and TikTok.
- Translations de/en/fr/es (all of Besjaar's published languages) are registered for title, description, handle, type, SEO title and description, the 4 metafields, image alt texts, and the 4-spray head's option "Uitvoering" with its values Met/Zonder slang.
- Univex scan: no product text, SEO, FAQ, alt text or translation mentions Univex or links to univexbv.com.

### Not created (already in Besjaar)

| Univex product | Existing Besjaar product |
|---|---|
| besjaar-douchekop-3-standen | besjaar-douchekop-3-sproeistanden-hoge-druk-luxe-moderne-handdouche-chrome (same 3-mode head, 8 L/min, 13 cm) |
| besjaar-douchekop-met-slang-3-standen | besjaar-douchekop-met-slang-handdouche-met-3-sproeistanden-regendouche-hoge-druk-chromen-douchekop |
| besjaar-douchekop-met-filter (chroom) | besjaar-hoge-druk-douchekop-met-filter-model-1002025-...-zilver (same model 1002025) |
| besjaar-douchekop-met-filter-en-slang (chroom) | besjaar-douchekop-met-slang-hoge-druk-met-filter-...-zilver |
| besjaar-douchefilter-navulset-2-stuks | besjaar-douchefilter (model 1002026) |
| besjaar-doucheslang-150-cm-chroom | besjaar-doucheslang-150-cm-chroom (same handle) |

### Waiting for the owner

- **besjaar-thermostatische-regendoucheset-mat-zwart** (Univex 16013739196764, normal price 198.00) is not created. Besjaar already has "Design Doucheset – Mat Zwart" (besjaar-design-doucheset-mat-zwart), which is similar (black, push buttons, extra hand sprayer) but not clearly the same: the Univex set has a digital display and a bidet sprayer, while the Besjaar set has a shelf. The owner should decide whether it is the same product.

### Found during the check on www.besjaar.eu

- All 7 active pages load in Dutch, German and English. Prices show with no strike-through, the images are there, and the drafts return 404. The products appear on the Douchekoppen and Douchesets collection pages.
- The Besjaar theme does **not** show `custom.specificaties`, `custom.faq`, `custom.kleur` or `custom.kleuropties`. Its product page uses other fields (`custom.highlights`, `custom.package_contents`, etc.). Specs and FAQ are still in the description text, but the colour buttons and the separate spec/FAQ blocks only appear after a theme change, which needs the owner's OK to publish.
- The theme's "Zonder slang / Met slang" switch ignores colour. On the new **black** filter heads it links to the **chrome** filter head with hose. The chrome pages are unaffected. This needs the same theme change (match colour as well).
- The chrome rain set (besjaar-regendoucheset-chroom) has the same 7th image as in Univex (`besjaar-complete-doucheset-chroom-regendouche-badkamer.webp`). That photo looks like the existing thermostat set, so the owner may want to remove it.
- The Besjaar footer (existing theme, not part of this transfer) shows info@univexbv.com.
- Risk: the 1 Dec task "End Black Friday sale (Besjaar + Univex Shop)" switches the Shopify connector between Besjaar and Univex, which asks for a manual sign-in. The task may stop at that point, so the owner should check prices in both stores on 1 Dec.
