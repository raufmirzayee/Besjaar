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

## Step 2: connect Besjaar (waiting for sign-in)

Univex was disconnected. The Shopify connector then needed a new sign-in, which only the owner can do.

## Step 3: create in Besjaar (to do after sign-in)

1. Check Besjaar's languages, existing products (the original Besjaar shower heads are probably there already), collections, metafield definitions and theme, so nothing is created twice.
2. Create the missing products with images, variants, normal prices (no crossed-out price), specs, FAQ and colour links, in the right collection, with translations for the languages Besjaar has.
3. The two slide rails stay drafts (no price yet), as in Univex.

Prices: Besjaar runs its own Black Friday sale (30%/35% off a fixed list of 8 variants; the scheduled task "End Black Friday sale (Besjaar + Univex Shop)" restores them on 1 Dec). New products get their normal price and are not added to that sale, so the 1 Dec task needs no change.
