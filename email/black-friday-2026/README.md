# Black Friday 2026 campaign e-mail

This session cannot send e-mail. No e-mail tool is connected, and the Shopify Admin API cannot send Shopify Email campaigns.
Everything else is ready; the campaign is sent from Shopify admin.

## Who receives it

| Segment (Shopify → Customers → Segments) | Customers | E-mail |
|---|---|---|
| Black Friday 2026 – NL-abonnees | 58 | Dutch |
| Black Friday 2026 – overige abonnees (Engels) | 12 | English |

That is all 70 customers who agreed to receive marketing e-mail, out of 127 customers.

The other 57 must not receive it under the GDPR and Dutch e-mail marketing rules:
- 49 never subscribed;
- 8 are Amazon marketplace relay addresses.

## Files

| File | Use |
|---|---|
| `black-friday-2026.nl.shopify-email.html` | Paste into a Shopify Email **Custom Liquid** section (Dutch) |
| `black-friday-2026.en.shopify-email.html` | Same, English |
| `black-friday-2026.nl.html`, `black-friday-2026.en.html` | Full stand-alone e-mails (preview in a browser, or for another e-mail tool, which must add its own unsubscribe link) |
| `build.py` | Generates all four files: `python3 build.py` |

## Subject and preview text

- **Dutch:** "Black Friday: 30% korting op alles, 35% op douchesets". Preview: "Geen code nodig. Alleen t/m maandag 30 november."
- **English:** "Black Friday: 30% off everything, 35% off shower sets". Preview: "No code needed. Until Monday 30 November only."

## Send in Shopify (about 5 minutes per language)

1. Marketing → Campaigns → **Create campaign** → **Shopify Email**.
2. Pick an empty template and delete the default sections.
3. **Add section → Custom Liquid**, then paste the contents of `black-friday-2026.nl.shopify-email.html`.
4. Fill in the subject and preview text above.
5. Under **To**, choose the segment **Black Friday 2026 – NL-abonnees**.
6. **Send test** to yourself, check it on your phone, then **Send**.
7. Repeat with the English file and the **overige abonnees (Engels)** segment.

Shopify Email adds the required footer itself: company address and unsubscribe link.

## Content

- Prices as of 20 Nov: 30% off everything, 35% off the douchesets.
- Four product cards with square images from `www.besjaar.eu/cdn/shop/files/`.
- Links carry `utm_campaign=black-friday-2026`, so sales show up in Shopify Analytics.
- The main button goes to `/collections/all#Collection-showerhead` (`/en/...` for English).
- Checked: all links return 200 and all images load. The layout is checked at 700 px and on an iPhone 13 (cards stack).
- Prices are hard-coded. If they change before sending, update `PRODUCTS` and `T[...]["more"]` in `build.py` and run it again.
