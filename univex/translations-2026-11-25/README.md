# Univex: translation check and fixes (25 Nov 2026)

**Store:** Univex Shop (univexbv.com). Primary language Dutch; published translations: German, English, French, Spanish.

**Scope checked:** everything Shopify can translate: 48 products, 15 collections, 58 blog articles, 2 blogs, 3 pages, 6 policies, shop SEO, 26 menu links, 5 menus, 48 product options, 61 option values, 29 metaobjects, 2 filters, 2 delivery methods, 458 product images, 56 article images, 11 collection images, and the live theme "Univex B.V – Black Friday (kleurkeuze)" (11 templates, header/footer, settings, 4,679 interface strings).

**How:** every Dutch text was compared with its 4 translations for missing ones, outdated ones (Dutch changed after translating), ones identical to Dutch, wrong-language text, leftover Dutch words, HTML structure, numbers, and internal links (all 284 links in translated texts were opened on the live site: none are broken).

## Fixed: 789 translations (756 new, 33 replaced)

Every change, with the Dutch source, the old value and the new value, is in `changes.json`.

| What | Problem | Fix |
|---|---|---|
| **Contact policy** | Dutch had the new address (Philipsweg **37 B**); all 4 translations still said **39 A** | Address corrected in de/en/fr/es |
| **SlimHome glass kettle** description | Dutch text was doubled (specs, FAQ, safety); translations had half and were outdated | Fully re-translated in 4 languages; the link to the temperature kettle points to each language's URL |
| **Besjaar Airstyler 5-in-1 blue** description | Outdated: missing the new "ceramic heating element" point, the temperatures (35/65/95 °C) and "with hanging loop" | Those parts added; the rest kept as it was |
| **2 slide rails** (Glijstang 60 cm; Glijstang hoofd- en handdouche), drafts | Not translated at all | Title, URL, type, SEO title, SEO description and description in 4 languages (48 texts) |
| **Shop SEO title** | Outdated in 4 languages | Re-registered; fr/es now include "pratiques/prácticos" like the Dutch |
| **Article "Altijd gratis verzending in Nederland…"** | SEO titles were broken ("Gratisversand in die NL, … = heute", "avant 16 h = expédié"); de/en titles ungrammatical | SEO title in 4 languages and de/en title rewritten |
| **136 images** (97 product, 39 article) | Alt text only in Dutch: SlimHome kettle, massage gun, both Airstylers, RC car, nasal strips, acne patches, 4-spray shower head, rain shower sets, hoses, XL rain heads, black filter heads, blog images | Alt text in 4 languages (544 texts) |
| **21 metaobject labels** (colour, material, hair type, heat level, shape, etc.) | No translations at all | Translated in 4 languages |
| **10 new products' option names** ("Title"/"Default Title") | Missing | Same values as the other products |
| Collection "Accessoires" | German title was "Accessoires" while its German URL is `zubehoer` | German title "Zubehör" |
| White Airstyler 5-in-1, French title | "5-en-1" | "5 en 1", as on its blue twin |
| Option "Kleur" on one product | English "Color"; the site uses British English everywhere else ("colour" 92×) | "Colour" |
| Footer and FAQ contact links | Marked outdated | Re-registered (they already pointed to the right localized contact pages) |

## Checked and fine

- Article texts: complete and up to date. Dutch titles that appear inside them are cited Dutch sources, marked "(in Dutch)".
- Product titles, menus, collections, pages, theme texts and the 4,679 theme interface strings: complete and correct.
- Left untranslated on purpose: brand names, discount codes, `/collections/all`, theme links (Shopify localizes them), image references and the `#reviews` anchor.
- Links in translated texts that use the Dutch URL (e.g. `/de/collections/douche-badkamer`) redirect (301) to the translated URL, so they work.

## Dutch source texts (owner approved, 25 Nov)

1. **Colour label "Silver" → "Zilver"**: done (`metaobjectUpdate`); its de/en/fr/es translations re-registered, not outdated.
2. **Legal notice: Philipsweg 39 A → 37 B**: to do by hand. The Shopify connection may not edit policies (missing `write_legal_policies` scope). New text: `legal-notice.nl.html`.
3. **Terms of service in Dutch**: to do by hand, same reason. Dutch translation of the current English text: `terms-of-service.nl.html` (same structure, same `[LINK]` placeholders and contact block as the de/fr/es versions; "je" form like the rest of the shop).

How: Settings → Policies → open the policy → click the `<>` (Show HTML) button → replace everything with the file's content → Save.

After saving, Shopify marks that policy's translations as outdated. They keep showing (English visitors still see the English terms), but they should be re-registered against the new Dutch text so they are no longer flagged.

### Notes on the terms of service (not changed, worth a look)

The terms are Shopify's US template, in every language: customers see the `[LINK]` placeholders and the "[NOTE TO MERCHANT …]" line; it says prices exclude taxes (Dutch consumer prices must include VAT); it refers to US federal and state law and courts; and its phone number (+31 6 16745062) differs from the contact page (+31 6 87616931).

## Rollback

`changes.json` has `before` for each entry. For entries with `before: null` (new translations), remove them with `translationsRemove` (resourceId, key, locale). For the others, register `before` again with `translationsRegister` against the current digest of the Dutch text.
