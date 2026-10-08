# Klaviyo – Abandoned Checkout flow with WELKOM20

Templates (Klaviyo syntax, one per language):
`abandoned-checkout.nl.html`, `.en.html`, `.de.html`, `.fr.html`, `.es.html`

The button links to `{{ event.extra.checkout_url }}&discount=WELKOM20`, so the customer's own
checkout opens with 20% off applied. Without a checkout URL (e.g. previews) it falls back to
`https://www.besjaar.eu/discount/WELKOM20`.

## 1. Add the templates
Klaviyo → **Content → Templates → Create template → Import / Code (HTML)** → paste a file → save as
"Abandoned checkout – NL" (repeat for each language).

## 2. Build the flow
Klaviyo → **Flows → Create flow → Abandoned Checkout** (prebuilt, trigger **Started Checkout**,
flow filter *Placed Order zero times since starting this flow*).

1. Time delay: **1 hour**
2. **Conditional split** on language/country, e.g. *Properties about someone → Location → Country*:
   - Netherlands / Belgium → email with the NL template
   - Germany / Austria → DE template
   - France → FR template
   - Spain → ES template
   - everyone else → EN template
3. In each email: **Use template** → pick the matching template. Subjects:
   - NL: `Besjaar – je winkelwagen wacht op je (nu 20% korting)`
   - EN: `Besjaar – your cart is waiting (now 20% off)`
   - DE: `Besjaar – dein Warenkorb wartet auf dich (jetzt 20 % Rabatt)`
   - FR: `Besjaar – votre panier vous attend (-20 % maintenant)`
   - ES: `Besjaar – tu carrito te espera (ahora con un 20 % de descuento)`
4. **Preview** each email with a real Started Checkout event and click the button – WELKOM20 should
   be applied at checkout.
5. Set every email to **Live** (not Draft/Manual) → flow status **Live**.

## Notes
- Turn off Shopify's own abandoned checkout automation to avoid duplicate emails.
- Klaviyo only emails profiles that can receive email marketing; keep consent in mind (GDPR).
- WELKOM20: 20% on Douchekoppen + Douchefilters, one use per customer.
