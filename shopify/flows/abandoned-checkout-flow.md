# Shopify Flow – Abandoned checkout recovery (WELKOM20)

Build in: Shopify admin → **Apps → Flow** (install the free "Shopify Flow" app if missing)
→ **Create workflow** (or Marketing → Automations → Create automation → Recover abandoned checkout,
which opens the same editor).

```
Trigger: Customer abandons checkout
   │
Wait 1 hour
   │
Condition A: customer has NO order since abandonment
   │            AND checkout total > 0
   ├─ No → (end)
   │
Condition B: customer email marketing state = SUBSCRIBED
   ├─ Yes → Send marketing email  (Shopify Email: abandoned checkout template, button with WELKOM20)
   │          │
   │        Add customer tag: abandoned-email-1
   │          │
   │        Wait 24 hours
   │          │
   │        Condition A again (still no order?)
   │          └─ Yes → Send marketing email (reminder) → Add customer tag: abandoned-email-2
   │
   └─ No  → Send internal email to info@univexbv.com
              (ready-to-forward text + recovery link with WELKOM20, see below)
```

## Conditions (pick fields with the variable picker)
- A: `abandonment.customerHasNoOrderSinceAbandonment` **is true**
- A: `abandonment.abandonedCheckoutPayload.totalPriceSet.shopMoney.amount` **greater than** `0`
- B: `abandonment.customer.emailMarketingConsent.marketingState` **equal to** `SUBSCRIBED`
- Optional, to skip your own tests: `abandonment.customer.email` **does not contain** `rauf`

## Internal email (for customers who are not subscribed)
To: `info@univexbv.com`
Subject: `Verlaten checkout: {{ abandonment.customer.email }}`

Body:
```
Verlaten checkout – stuur deze klant handmatig een e-mail.

Klant: {{ abandonment.customer.firstName }} {{ abandonment.customer.lastName }}
E-mail: {{ abandonment.customer.email }}
Bedrag: €{{ abandonment.abandonedCheckoutPayload.totalPriceSet.shopMoney.amount }}

Producten:
{% for li in abandonment.abandonedCheckoutPayload.lineItems %}- {{ li.title }} × {{ li.quantity }}
{% endfor %}
Herstellink met WELKOM20 (20% korting automatisch toegepast):
{{ abandonment.abandonedCheckoutPayload.abandonedCheckoutUrl }}&discount=WELKOM20

---- Tekst om door te sturen ----
Hoi {{ abandonment.customer.firstName }},

We zagen dat je je bestelling nog niet hebt afgerond. We hebben je winkelwagen voor je bewaard.
Als bedankje krijg je 20% korting met de code WELKOM20. De korting wordt automatisch toegepast via deze link:
{{ abandonment.abandonedCheckoutPayload.abandonedCheckoutUrl }}&discount=WELKOM20

Vragen? Antwoord gewoon op deze e-mail.

Groetjes,
Besjaar
```

## Notes
- "Send marketing email" only reaches customers subscribed to email marketing (Shopify rule).
- WELKOM20 is one use per customer and only covers Douchekoppen + Douchefilters (all current products).
- After saving, click **Turn on workflow**. Check runs under Flow → the workflow → **Recent runs**.
