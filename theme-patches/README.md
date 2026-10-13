# Theme patches for besjaar.eu

`snippets/structured-data.liquid` is the live theme's snippet (theme "Besjaar – materiaal schema 9 okt (preview)", pulled 13 Oct 2026) with three fixes. `structured-data.diff` shows the exact change.

1. **Primary-domain URLs in JSON-LD.** Every `@id`, `url` and BreadcrumbList `item` now uses `sd_canonical` instead of `canonical_url`. This is the same rule `layout/theme.liquid` applies to `<link rel="canonical">`, so requests served on www.slimhome.nl, www.bestezaklampen.nl or the myshopify domain no longer emit entity ids on those hosts.
2. **Return policy covers every shipping country.** `hasMerchantReturnPolicy.applicableCountry` was the home zone only (NL). It is now zone 1 + zone 2 (NL, BE, DE, FR, ES).
3. **`returnFees: ReturnFeesCustomerResponsibility`**, matching the refund policy (the customer pays return shipping unless the product is defective or wrong).

## Apply

1. *Online Store → Themes → … → Duplicate* the live theme.
2. In the duplicate: *Edit code → snippets/structured-data.liquid*. Replace the contents with this file and save.
3. Preview a product. Run the product URL through https://search.google.com/test/rich-results (Product snippet + Merchant listing should both be valid).
4. Publish the duplicate.

If the live snippet changed after 13 Oct 2026, apply `structured-data.diff` by hand instead of replacing the whole file.

## Settings change that goes with it (no code)

*Theme settings → Delivery & trust → zone 2 transit time*: set **min 1, max 3** business days. It is empty today, so the schema falls back to 1–1 days for BE/DE/FR/ES, while the shipping policy says 1–3.
