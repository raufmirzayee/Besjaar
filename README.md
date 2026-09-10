# Besjaar

The Besjaar storefront: a Dutch online shop for a curated range of practical
products across home, bathroom, garden, outdoor, personal care and travel,
carrying the Besjaar, RYNEX and LYNEX brands.

Built with TanStack Start (React 19), Tailwind CSS v4 and Supabase.

---

## Quick start

```sh
bun install
cp .env.example .env    # optional — see "Running without services" below
bun run dev
```

The store runs at `http://localhost:8080`.

| Command              | What it does                                         |
| -------------------- | ---------------------------------------------------- |
| `bun run dev`        | Development server with HMR                          |
| `bun run verify`     | Lint, typecheck, tests and build — everything CI run |
| `bun run build`      | Production build (Cloudflare Workers by default)     |
| `bun run build:node` | Production build for a Node server                   |
| `bun run start`      | Serve a Node build from `.output`                    |
| `bun run lint`       | ESLint + Prettier                                    |
| `bun run test`       | Vitest suite                                         |
| `bunx tsc --noEmit`  | Type check                                           |

Use bun, not npm — the lockfile is a bun lockfile and `npm install` fails on it.

### Running without services

The store deliberately works with nothing configured:

- **No Supabase** — the storefront serves the catalogue bundled from the
  product workbook, so every page renders real products instead of an error.
  Accounts, orders and the admin area need Supabase.
- **No payment provider** — orders can be placed but are stored as _awaiting
  payment_, and checkout says so. Nothing is ever reported as paid without the
  provider confirming it.
- **No email provider** — nothing is sent, every attempt is logged as skipped,
  and the admin says so. An order is never lost because mail is down.
- **No bol.com credentials** — the integration reports as not connected; the
  independent store is unaffected.

**Beheer → Dashboard** lists exactly what is still switched off, read from the
running configuration. See [DEPLOYMENT.md](DEPLOYMENT.md) to turn it all on.

---

## The product catalogue

`data/EenTop_Besjaar_Sorted_Product_Catalogue.xlsx` is the single source of
truth. The **Sorted Products** worksheet holds 51 unique products; the _All 53
Entries_ sheet is the raw source and is deliberately not imported.

`scripts/build_catalogue.py` reads that worksheet and generates three artefacts:

| Output                                        | Used for                              |
| --------------------------------------------- | ------------------------------------- |
| `src/data/catalogue.generated.ts`             | The typed catalogue used at runtime   |
| `supabase/migrations/…_besjaar_catalogue.sql` | Idempotent Supabase seed              |
| `data/besjaar-catalogue.csv`                  | Import via `/beheer/catalogus-import` |

Regenerate after editing the workbook:

```sh
pip install openpyxl
python3 scripts/build_catalogue.py
```

**Product ID is the canonical key.** Products are deduplicated on it, the seed
upserts on `bol_product_id`, and the admin importer matches on it — so
importing the same file twice updates the catalogue rather than duplicating it.

### What the pipeline does and does not do

Prices, review counts, availability, image URLs and source URLs are copied
verbatim. Specifications are extracted literally from each manufacturer's own
product title. Display names are shortened from those titles using the details
that genuinely separate sibling listings (lumen, capacity, colour, quantity).

Nothing is invented. In particular:

- A discount is shown only where the workbook gives a regular price genuinely
  higher than the selling price (16 of 51 products).
- Two workbook rows have no current price and a 100% discount — a scrape
  artefact. Their regular price becomes the selling price and no discount is
  shown.
- The catalogue carries review **counts** but no rating value, so the store
  shows counts and never a star score. `AggregateRating` is deliberately absent
  from the Product structured data for the same reason.
- The popularity badge says _Populair_, not _Bestseller_: review volume is not
  sales data.

---

## Supabase setup

1. Create a project and put its URL and keys in `.env` (see `.env.example`).
2. Apply the migrations in `supabase/migrations/` in filename order — they
   create the schema, RLS policies, roles and the catalogue seed.
3. Grant yourself an admin role:

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'super_admin' from auth.users where email = 'you@example.com';
   ```

Authorisation is enforced in the database (RLS) and re-checked server-side in
every admin server function. Hiding a link is never the control.

**Staff and customers are separate pools.** A non-customer role cannot exist
for an account outside `staff_accounts`, and an order cannot belong to one
inside it — both enforced by database triggers, not by application code. A
customer therefore cannot be promoted to admin, and staff cannot shop. Staff
accounts are created by a super admin under **Beheer → Medewerkers**; public
sign-up has no path into the pool.

The admin is also invisible from the shop: nothing links to it, and `/beheer`
returns the ordinary 404 for anyone who is not staff. Staff sign in on a bare
screen at `/beheer` with none of the storefront chrome.

The backoffice is available in **Dutch and English**, switchable from the
language menu in its top bar. Dutch is the source language and the fallback:
a staff member whose browser is set to German or French sees Dutch in the
admin rather than half-translated copy, and the admin's switcher deliberately
offers only the two languages it actually has. Adding a third means adding one
block to `src/lib/translations/admin.ts`.

**Staff need two factors.** Every admin server function refuses a password-only
session, and so do the row-level policies — the four helpers gating all 36 of
them require a verified second factor, so bypassing the app and calling the
database API directly gets nothing either. Customers are unaffected. A super
admin can clear a colleague's authenticator after a lost phone; there is no
self-service reset, because whoever holds the password could then remove the
second factor themselves.

---

## Payments (Mollie)

Set `MOLLIE_API_KEY` and `MOLLIE_WEBHOOK_URL`, then enable the methods you want
in the Mollie dashboard — the storefront should only advertise methods your
account actually supports (`storeConfig.payment.methods`).

The flow: checkout creates a payment, the customer completes it on Mollie's
page, and the order stays open until `/api/public/mollie-webhook` confirms it.
The webhook takes only a payment id from the request and reads the status back
from the Mollie API, so a forged POST cannot mark an order paid. A failed or
cancelled payment releases the reserved stock.

---

## bol.com

The catalogue originated from bol.com listings, and each product keeps its
Product ID and source URL for mapping. Set `BOL_CLIENT_ID` and
`BOL_CLIENT_SECRET` to enable syncing; `SYNC_TRIGGER_SECRET` protects the
scheduled endpoint at `/api/public/bol-sync`. Everything else works without
them.

---

## Project layout

```
data/            Source workbook and the generated import CSV
scripts/         build_catalogue.py — the catalogue build step
src/data/        Generated catalogue + typed helpers
src/lib/         Domain logic; *.server.ts is server-only, *.functions.ts are RPC
src/routes/      File-based routes; /beheer/* is the admin area
supabase/        Migrations, including the catalogue seed
```

Conventions worth knowing:

- **Design tokens only.** Colours, spacing, radii, shadows and type live in
  `src/styles.css`. Components use semantic tokens (`bg-primary`,
  `text-muted-foreground`) and never hardcode a colour.
- **Store policy is configuration.** Delivery, returns, warranty and payment
  messaging come from `src/lib/store-config.ts`, so the shop never hardcodes a
  fulfilment promise it cannot keep.
- **Filtering is shared.** `src/lib/product-filters.ts` is used by both the
  Supabase and bundled catalogue paths, so listings behave identically either
  way.

---

## Going live

[DEPLOYMENT.md](DEPLOYMENT.md) is the full checklist: Supabase, environment,
hosting, payments, email, the Merchant Center product feed and the go-live
checks.

Four things must come from the business, and are deliberately absent rather
than invented:

- **Company registration details** — KvK number, VAT number and registered
  address. Set them via `VITE_COMPANY_*`; until then the shop leaves them out
  and says on the page that it is not yet fully registered.
- **Real fulfilment terms** — carrier, cut-off time and delivery estimates.
  Until then the store says only that orders are dispatched on working days.
- **Product photography rights** — images currently point at the marketplace
  CDN the catalogue came from. Host them yourself before launch: hotlinking a
  third-party CDN is fragile and not yours to rely on.
- **Inventory** — the seed sets a placeholder stock of 25 per product. Real
  quantities come from Supabase inventory once counted.
