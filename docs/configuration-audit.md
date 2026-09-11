# Configuration audit

Every environment variable the project reads, and where it belongs after the
Setup & Connections work.

The question each row answers is not "could this be a setting?" but "who needs
to change it, how often, and what happens if they get it wrong?" A shipping
threshold is changed by the shop owner on a Tuesday afternoon and the worst case
is a wrong price for an hour. A service-role key is changed once, by whoever
owns the deployment, and the worst case is the whole database.

Three destinations:

- **Bootstrap** — read before the database is reachable, or needed to reach it.
  Cannot live in the database without a chicken-and-egg problem. Stays in the
  deployment environment.
- **Secret** — a credential. Never reaches the browser, never appears in an API
  response, never gets logged. Held in the secret store (Supabase Vault when the
  project has it, otherwise the deployment environment).
- **Setting** — ordinary business configuration. Lives in `store_settings`,
  edited graphically, audited on change.

Settings resolve **database → environment → application default**, so an
existing installation keeps working untouched: every environment variable below
that moved to a setting still functions as the default until someone saves a
value over it.

## Bootstrap — stays in `.env`

| Variable | Purpose | Secret | Restart | Validation |
| --- | --- | --- | --- | --- |
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Which Supabase project to talk to | No | Yes | Must be an `https://` origin |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | Anon key. Public by design — it is in the browser bundle already and RLS is what protects the data | No | Yes | `sb_publishable_` prefix |
| `VITE_SUPABASE_PROJECT_ID` | Project reference, used in generated links | No | Yes | Slug |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS. Also the key that unlocks the secret store, so it cannot itself live there | **Yes** | Yes | `sb_secret_` prefix, server-only |
| `TRUSTED_PROXY` | Which forwarded header the rate limiter may believe | No | Yes | Platform name or hop count |
| `ADMIN_BOOTSTRAP_EMAIL` | Who may claim the first admin role on an empty shop | No | Yes | E-mail address |
| `NODE_ENV` | Build/runtime mode | No | Yes | Set by the platform |

`TRUSTED_PROXY` and `ADMIN_BOOTSTRAP_EMAIL` are deliberately *not* settings.
Both are security controls about the deployment itself, and a setting that the
admin can change is a setting an attacker who reaches the admin can change.

## Secrets — secret store, never the browser

| Variable | Purpose | Runtime-writable | Admin location | Validation |
| --- | --- | --- | --- | --- |
| `MOLLIE_API_KEY` | Payment provider credential | Vault: yes · env: no | Payments → Mollie | `test_` or `live_` prefix, must match the selected mode |
| `RESEND_API_KEY` | Transactional e-mail credential | Vault: yes · env: no | E-mail | `re_` prefix |
| `DEEPL_API_KEY` | Translation credential | Vault: yes · env: no | Translations | Non-empty; `:fx` suffix selects the free endpoint |
| `BOL_CLIENT_ID` | Marketplace client id. Paired with the secret, so treated as one | Vault: yes · env: no | bol.com | Non-empty |
| `BOL_CLIENT_SECRET` | Marketplace credential | Vault: yes · env: no | bol.com | Non-empty |
| `SYNC_TRIGGER_SECRET` | Shared secret on the public cron endpoint | Vault: yes · env: no | Integrations | At least 24 characters |

"Runtime-writable" is the honest distinction the admin UI has to make. When the
project has Supabase Vault, saving a credential takes effect on the next
request and the UI says so. When it does not, the value stays in the deployment
environment, the admin cannot write it, and the UI gives the exact command for
the platform instead of pretending to have saved something.

## Settings — database-backed, edited graphically

| Variable | Becomes | Category | Admin location |
| --- | --- | --- | --- |
| `CHECKOUT_MODE` | `payments.mode` | commerce | Payments |
| `MOLLIE_WEBHOOK_URL` | `payments.webhook_url` | commerce | Payments |
| `VITE_PAYMENTS_ENABLED` | *removed* — superseded by `payments.mode` | — | Payments |
| `EMAIL_PROVIDER` | `email.provider` | email | E-mail |
| `EMAIL_FROM` | `email.from` | email | E-mail |
| `EMAIL_REPLY_TO` | `email.reply_to` | email | E-mail |
| `DEEPL_API_URL` | `translations.endpoint` | localization | Translations |
| `VITE_SITE_URL` | `general.site_url` | general | General |
| `VITE_STORE_LEGAL_ENTITY` | `company.legal_entity` | company | Company |
| `VITE_STORE_EMAIL` | `company.support_email` | company | Company |
| `VITE_STORE_PHONE` | `company.support_phone` | company | Company |
| `VITE_COMPANY_LEGAL_NAME` | `company.legal_name` | company | Company |
| `VITE_COMPANY_KVK` | `company.kvk` | company | Company |
| `VITE_COMPANY_VAT` | `company.vat` | company | Company |
| `VITE_COMPANY_STREET` | `company.street` | company | Company |
| `VITE_COMPANY_POSTAL_CODE` | `company.postal_code` | company | Company |
| `VITE_COMPANY_CITY` | `company.city` | company | Company |
| `VITE_COMPANY_COUNTRY` | `company.country` | company | Company |
| `VITE_FREE_SHIPPING_THRESHOLD` | `shipping.free_threshold` | shipping | Shipping |
| `VITE_SHIPPING_RATE` | `shipping.default_rate` | shipping | Shipping |
| `VITE_DISPATCH_NOTE` | `shipping.dispatch_note` | shipping | Shipping |
| `VITE_RETURN_DAYS` | `commerce.return_days` | commerce | Store |
| `VITE_WARRANTY_MONTHS` | `commerce.warranty_months` | commerce | Store |
| `VITE_GA_MEASUREMENT_ID` | `integrations.ga_measurement_id` | integrations | Integrations |
| `VITE_META_PIXEL_ID` | `integrations.meta_pixel_id` | integrations | Integrations |

The two analytics ids are public identifiers — they appear in the page source
by design — so they are ordinary public settings rather than secrets.

## Public settings

A setting marked public is readable by anonymous visitors, because the
storefront needs it before anyone signs in: the store name, the free-shipping
threshold, the company details a webshop must publish. Everything else is
staff-only. The public endpoint returns **only** rows flagged public; it never
returns the whole settings table, and no secret is ever a setting row at all.

## What did not move, and why

- **Shipping methods** already live in the `shipping_methods` table and were
  already editable. They get a graphical editor, not a migration.
- **Payment methods** stay derived from what Mollie actually has enabled.
  Advertising a method the account cannot take is a broken promise at checkout,
  and a free-text setting invites exactly that.
- **Supported languages** stay in code. Adding a language is not a toggle: it
  needs a full dictionary, and a switch that turns on a half-translated language
  ships a broken shop.
