# Channable – Google Shopping quality fixes (Besjaar)

Quality report from Channable dated 2026-10-31, covering 6 items. Each issue below
lists the cause, what was already changed in Shopify, and the step left to do in
Channable.

After the changes in Channable: **Feed → re-import from Shopify**, then
**Quality → Run now**.

---

## Already done in Shopify

| Change | Product | Detail |
|---|---|---|
| Title shortened (156 → 144 chars) | BJ-DK3-SL-CHR (Douchekop met Slang, 3 standen) | Removed the repeated `Douchekop - `. New title: `Besjaar Douchekop met Slang - Regendouche - Wellness - 3 Sproeistanden - Hoge Druk - Betere Huid - Handdouche - Luxe Moderne Handdouche - Chrome` |
| New metafield `custom.google_product_type` | all 6 products | 4-level product type for Google (see table below). The existing Shopify *Product type* field was not changed, so collections and filters that use it keep working. |

`custom.google_product_type` values:

| SKU | Value |
|---|---|
| BJ-DK3-CHR | Badkamer > Douche > Douchekoppen > Handdouches |
| BJ-DK3-SL-CHR | Badkamer > Douche > Douchesets > Douchekop met slang |
| BJ-1002025 | Badkamer > Douche > Douchekoppen > Douchekoppen met filter |
| BJ-1002025-SL | Badkamer > Douche > Douchesets > Douchekop met filter en slang |
| BJ-1002026 | Badkamer > Douche > Douchefilters > Vervangfilters |
| BJ-SL150-CHR | Badkamer > Douche > Doucheslangen > Universele doucheslangen |

---

## 1. Get your items listed (blocking)

### `g:unit_pricing_measure` / `g:unit_pricing_base_measure` – invalid units (6)
**Cause:** the unit-price fields are empty on every variant in Shopify (quantity 0,
no unit), so whatever is mapped sends an invalid value.
**Fix (Mapping):** clear both fields, leaving them unmapped. These products are sold
per piece, so unit pricing isn't required.

### `title` – too long (1)
**Fixed in Shopify** (see above). If you ever want a different feed title, use a
Channable rule rather than making the Shopify title longer: Google's limit is 150
characters.

### `g:gtin` – empty (1)
**Cause:** the shower hose **BJ-SL150-CHR** (Doucheslang 1,5 m) has no barcode in
Shopify.
**Fix (Shopify):** Products → Doucheslang → variant → *Barcode (ISBN, UPC, GTIN…)* →
enter the hose's real EAN-13. Don't reuse another product's EAN or make one up.
Besjaar's other EANs come from your own GS1 range (`8720726284…`), so assign the
hose a code from that range if it doesn't have one yet. Until it has one, the hose
can't be listed with a GTIN.

---

## 2. Discoverability & conversion

| Google field | Map to (Mapping step) | Notes |
|---|---|---|
| `g:product_type` | `custom.google_product_type` (metafield) | Fixes both "too short" and "fewer than 3 nodes". If the metafield isn't in the field list, add it in the Shopify import settings (metafields) and re-import. **Fallback without metafields:** a rule per item, e.g. *IF id = … THEN set product_type to* the value in the table above. |
| `g:short_title` | `custom.short_title_nl` (metafield) | Already filled in for all 6 (17–41 chars). |
| `g:custom_label_0` | Shopify `product_type` | Splits campaigns into `showerhead` / `Shower Filter` / `Shower Hose` (shower heads vs accessories). Other options: price band or margin. |
| `g:sale_price` | see below | |

### `g:sale_price` – check this before mapping it
All 6 products have a *compare-at price* in Shopify (for example 19.99 vs 25.99). The
standard mapping is:

- `g:price` ← **compare_at_price** (fallback to `price` when empty)
- `g:sale_price` ← **price**

**Only do this if the compare-at prices are real earlier selling prices.** Google
shows them as a struck-through "was" price. Under EU price rules (Omnibus,
enforced in NL by the ACM), the "was" price must be the lowest price of the 30
days before the discount. A permanent compare-at price doesn't meet that rule and
can get items disapproved. If the compare-at prices are permanent, leave
`g:sale_price` unmapped and accept this AI readiness warning.

---

## 3. AI readiness (optional, lower priority)

| Google field | Map to | Notes |
|---|---|---|
| `g:product_highlight` | `custom.highlights` (list metafield) | 6 highlights per product, all filled in. |
| `g:product_detail_section_name` | static `Specificaties` | |
| `g:product_detail_attribute_name` / `_value` | see table below | Data comes from existing metafields. If Channable allows only one detail per item, start with *Sproeistanden*. |
| `g:popularity_rank` | rule or additional import | Suggested order by number of reviews (see below). A sales-based rank is better once you have the data. Check Channable's help text for this field to see whether 1 means most popular. |
| `g:related_product.*` | rule per item | identifier_type `gtin`; see suggestions below. Choose the relationship type from the options Channable offers. |
| `g:question_and_answer.*` | rule per item | Only use questions and answers that also appear on the product page. |

### Product details (from metafields)

| SKU | Sproeistanden | Waterverbruik | Diameter | Materiaal | Aansluiting | Slang |
|---|---|---|---|---|---|---|
| BJ-DK3-CHR | 3 | max. 8 l/min | 13 cm | Chroom | Universeel | – |
| BJ-DK3-SL-CHR | 3 | max. 8 l/min | 13 cm | Chroom | Universeel | 1,5 m |
| BJ-1002025 | 10 | tot 30% besparing (pauzeknop) | 13 cm | Chroom (ABS) | G½″ | – |
| BJ-1002025-SL | 10 | tot 30% besparing (pauzeknop) | 13 cm | Chroom (ABS) | G½″ | 1,5 m |
| BJ-1002026 | – | – | – | – | – | – (Filter: 8-traps, 2 stuks) |
| BJ-SL150-CHR | – | – | – | Chroom | ½″ (G½) beide kanten | 1,5 m |

Metafields: `custom.spray_modes`, `custom.water_use`, `custom.diameter_mm`,
`custom.material`, `custom.connection_size`, `custom.hose_length_cm`,
`custom.filter_type`.

### Popularity (Shopify review count, 2026-10-31)

| Rank | SKU | Reviews |
|---|---|---|
| 1 | BJ-DK3-SL-CHR | 153 |
| 2 | BJ-DK3-CHR | 145 |
| 3 | BJ-1002025-SL | 79 |
| 4 | BJ-1002025 | 61 |
| 5 | BJ-1002026 | 1 |
| 6 | BJ-SL150-CHR | 0 |

### Related products

| Product | Related product | GTIN |
|---|---|---|
| BJ-1002025 / BJ-1002025-SL (filter shower head) | Vervangfilters BJ-1002026 | 8720726284752 |
| BJ-1002026 (refill filters) | Douchekop met filter BJ-1002025 | 8720726284516 |
| BJ-DK3-CHR / BJ-1002025 (heads without a hose) | Doucheslang BJ-SL150-CHR | *add once the EAN is known* |

---

## Product reference

| Shopify ID | SKU | EAN | Price / compare-at |
|---|---|---|---|
| 10997729591623 | BJ-DK3-CHR | 8721516741240 | 19.99 / 25.99 |
| 10997944648007 | BJ-DK3-SL-CHR | 8720726284257 | 29.99 / 34.99 |
| 10998051602759 | BJ-1002025 | 8720726284516 | 25.99 / 29.99 |
| 10998054912327 | BJ-1002025-SL | 8720726284509 | 30.99 / 34.99 |
| 10997821243719 | BJ-1002026 | 8720726284752 | 9.99 / 12.99 |
| 11374965653831 | BJ-SL150-CHR | **missing** | 9.99 / 11.99 |
