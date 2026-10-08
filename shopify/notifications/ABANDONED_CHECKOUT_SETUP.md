# Abandoned checkout recovery email with WELKOM20

Templates:
- `abandoned-checkout.nl.liquid` – Dutch (default store language)
- `abandoned-checkout.en.liquid` – English

The button opens the customer's own saved checkout with `&discount=WELKOM20`
added to the link, so the 20% discount is already applied when they arrive.

## 1. Install the template
1. Shopify admin → **Settings → Notifications → Customer notifications → Abandoned checkout**.
2. Click **Edit code**, paste the contents of `abandoned-checkout.nl.liquid` into the email body.
3. Subject: `{{ shop.name }} – je winkelwagen wacht op je (nu 20% korting)`
4. If the store has English enabled, switch the language selector to English and paste
   `abandoned-checkout.en.liquid` with subject `{{ shop.name }} – your cart is waiting (now 20% off)`.
5. **Send test email** to yourself and click the button. The checkout should show WELKOM20 applied.

## 2. Turn on automatic sending
Shopify admin → **Marketing → Automations → Abandoned checkout** → make sure the automation is
**Turned on** (not draft/paused). Recommended delay: 1 hour (optionally a 2nd email after 24 hours).

If the automation uses the Shopify Email editor instead of the template above, copy the same
text in and add the WELKOM20 discount to the checkout button (button → link → add discount).

Note: Shopify's automation only emails customers who **accepted email marketing**. Non-subscribers
can be emailed one by one from **Orders → Abandoned checkouts → (checkout) → Send a cart recovery email**,
which uses the template from step 1.

## 3. Existing abandoned checkouts
Send them now from **Orders → Abandoned checkouts**, open each one, then click
**Send a cart recovery email**.

## WELKOM20 rules (current settings)
- 20% off products in the collections *Douchekoppen* and *Douchefilters*
- One use per customer, no end date
- Combines with product discounts only (not other order or shipping discounts)
