# Deploying Besjaar

This is the checklist for taking the shop from a local checkout to a store that
can accept real orders. Nothing here is optional theatre — every step exists
because the shop deliberately refuses to fake the thing it covers.

The short version:

1. [Build it and prove it builds](#1-prove-it-builds)
2. [Provision Supabase](#2-supabase)
3. [Set the environment](#3-environment-variables)
4. [Deploy](#4-deploy)
5. [Turn on payments](#5-payments)
6. [Turn on email](#6-transactional-email)
7. [Go-live checks](#7-go-live-checks)

---

## 1. Prove it builds

```bash
bun install
bun run verify
```

`verify` runs lint, typecheck, the test suite and a production build — the same
four things CI runs. If it passes locally it will pass in the pipeline.

Use **bun**, not npm: the lockfile is a bun lockfile and `npm install` fails on
it.

---

## 2. Supabase

The shop renders its catalogue from a bundled copy when Supabase is absent, so
every page works without it — but **orders, accounts and the admin area need a
database**. Checkout will tell the customer it cannot load delivery options
rather than pretending.

1. Create a project at [supabase.com](https://supabase.com).
2. Apply everything in `supabase/migrations/` **in filename order**. Either
   push with the Supabase CLI (`supabase db push`) or paste each file into the
   SQL editor in order. They create the schema, the RLS policies, the roles, the
   catalogue seed and the fulfilment tables.
3. Confirm the seed landed:

   ```sql
   select count(*) from public.products;         -- 51
   select count(*) from public.product_images;   -- 51
   ```

   The seed is idempotent: running it twice does not duplicate products or
   images.

4. Give yourself an admin role (after signing up through the site once).

   The staff pool comes first — the database refuses a staff role to an
   account that is not in it, so a bare `user_roles` insert fails with
   *"Account … is geen medewerkersaccount"*:

   ```sql
   -- 1. Put the account in the staff pool.
   insert into public.staff_accounts (user_id, email)
   select id, email from auth.users where email = 'you@example.com';

   -- 2. Then grant the role.
   insert into public.user_roles (user_id, role)
   select id, 'super_admin' from auth.users where email = 'you@example.com';
   ```

   Alternatively set `ADMIN_BOOTSTRAP_EMAIL` to your address and use the
   "Eerste beheerder worden" button in the admin. That claim is refused for any
   other address, and refused entirely when the variable is unset — a deployed
   shop must never let whoever signs up first take it over.

   **Staff accounts are a separate pool from customers.** The database enforces
   it: a non-customer role cannot exist for an account outside
   `staff_accounts`, and an order cannot belong to one inside it. So a shopper
   can never be promoted to admin, and an admin can never place an order —
   whatever the application code does. After bootstrapping yourself, add
   colleagues under **Beheer → Medewerkers**; public sign-up has no path into
   the staff pool at all.

   Sign in to the admin at `/beheer`. It has its own bare sign-in screen with
   none of the shop's chrome, and the customer login at `/inloggen` turns staff
   accounts away. To anyone who is not staff — signed out or a signed-in
   customer — `/beheer` and every page under it returns the site's ordinary
   404, so the backoffice is not discoverable by browsing.

5. Check the storage buckets.

   `20260912170000_storage_buckets.sql` creates `product-images`,
   `review-images` and `return-images` with the settings their row-level
   policies were written to assume. It runs with the other migrations, so
   there is nothing to click — but the settings live in a table the
   application never writes to, and a later change in the dashboard would not
   be noticed. This reports the state:

   ```sql
   select * from public.audit_storage_buckets();   -- no rows = correct
   ```

   What it is checking, and why each one matters:

   | Bucket           | Public | Limit | Types           |
   | ---------------- | ------ | ----- | --------------- |
   | `product-images` | yes    | 10 MB | images, no SVG  |
   | `review-images`  | **no** | 5 MB  | images, no SVG  |
   | `return-images`  | **no** | 5 MB  | images, no SVG  |

   A public bucket is served over a CDN path that does not consult the
   row-level policies at all, so the `public` flag — not the policy — is what
   decides who can read the files. Product photography is meant to be public.
   The other two hold photographs customers took in their own homes, and a URL
   is not an authorisation, so those stay private. SVG is excluded everywhere:
   it is a document format that can carry script, served from a domain
   belonging to this shop's project.

   Nothing in the application uploads files yet — the admin sets image URLs
   rather than transferring files — so these are groundwork. Getting the
   limits right before the first upload is cheaper than after.


6. **Two-factor authentication is mandatory for staff.** On first sign-in each
   staff member scans a QR code with an authenticator app (Google
   Authenticator, 1Password, Bitwarden — any TOTP app). Until they do, they can
   reach the enrolment screen and nothing else.

   This is enforced in two places, not one. Every admin server function refuses
   a password-only session, and the row-level policies do too: the four helpers
   that gate all 36 policies require the session to have proved a second
   factor. A staff member who skipped the app and called the database API
   directly with their token would still get nothing. Customers are unaffected
   — shoppers have no second factor and need none.

   Nothing to switch on in Supabase: TOTP is part of Auth. If a colleague loses
   their phone, a super admin clears their authenticator under **Beheer →
   Medewerkers** and they enrol again next time they sign in. There is
   deliberately no self-service reset — whoever holds the password could
   otherwise remove the second factor themselves.

7. In **Authentication → URL configuration**, set the site URL to your domain so
   confirmation and password-reset links point at the right place.

Authorisation is enforced by RLS in the database and re-checked server-side in
every admin server function. Hiding a link is never the control.

---

## 3. Environment variables

Copy `.env.example` and fill it in. The rules that matter:

- `SUPABASE_SERVICE_ROLE_KEY` is **server-only**. It must never appear in a
  `VITE_*` variable — Vite inlines those into the browser bundle.
- Only mirror public values into `VITE_*`.
- `VITE_SITE_URL` must be the real origin. Canonical URLs, the sitemap, the
  product feed and the payment webhook all derive from it.

Set them in your host's dashboard, not in a committed file. `.env` is
gitignored; keep it that way.

`DEEPL_API_KEY` is the same kind of secret: server-only, never a `VITE_*`.
Without it the shop runs exactly as before — products are created and edited
normally, and the translations screen lists what is waiting rather than
inventing text.

---

## 4. Deploy

The build targets [Nitro](https://nitro.build), so the same source deploys to
several hosts.

The Node path below was run end to end here: build, serve, and every page and
feed fetched back. The Cloudflare, Vercel and Netlify commands are the standard
Nitro ones and the Cloudflare build does emit `.output/server/wrangler.json`,
but no deploy to those platforms was performed — treat the first deploy as
something to watch rather than assume.

### Cloudflare Workers (the default)

```bash
bun run build         # writes .output/ plus .output/server/wrangler.json
bunx wrangler deploy
```

Set the environment variables as Worker secrets:

```bash
bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
bunx wrangler secret put MOLLIE_API_KEY
bunx wrangler secret put RESEND_API_KEY
```

`VITE_*` values are build-time, so they must be present in the environment when
`bun run build` runs, not only at deploy time.

### Node (any VPS, Fly, Render, Railway)

```bash
bun run build:node    # NITRO_PRESET=node-server
bun run start         # serves .output/server/index.mjs, PORT respected
```

Put it behind a TLS-terminating reverse proxy and keep it alive with your
process manager of choice.

### Vercel or Netlify

Set `NITRO_PRESET=vercel` or `NITRO_PRESET=netlify` and run `bun run build`.
The build command is `bun run build` and the output directory is `.output`.

### Tell the app what is in front of it

Whichever host you pick, set `TRUSTED_PROXY` to match it:

| Host                        | `TRUSTED_PROXY`            | Header read                 |
| --------------------------- | -------------------------- | --------------------------- |
| Cloudflare Workers          | `cloudflare` (the default) | `cf-connecting-ip`          |
| Vercel                      | `vercel`                   | `x-vercel-forwarded-for`    |
| Netlify                     | `netlify`                  | `x-nf-client-connection-ip` |
| Node behind your own proxy  | the number of proxies, e.g. `1` | `x-forwarded-for`, counted from the right |
| Node reachable directly     | `none`                     | none                        |

Rate limiting is the only thing that reads this, and it is the reason the
setting is not optional in practice. `x-forwarded-for` is a list each hop
*appends* to, so its leftmost entry is whatever the caller typed; a limiter
that reads it gives an attacker a fresh counter on every request. Naming the
host means only the header that host overwrites is read, and a forged copy of
it never survives the edge.

Set it wrong and nothing is trusted: every anonymous caller shares one
(widened) bucket and the server logs a line naming the variable. That
over-limits rather than under-limits, so the shop stays protected, but it is
not the state to run in.

Signed-in callers are keyed on their account regardless of this setting, so
checkout, review and bootstrap limits hold even when it is misconfigured.

### Security headers

Set on every response by `src/server.ts`, so they apply on all three hosts —
a `_headers` file would only be read by Cloudflare Pages and Netlify, and a
security header present on one deployment target out of three is worse than
none because it reads as covered.

`Content-Security-Policy`, `Strict-Transport-Security` (TLS only, two years,
not preloaded), `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` and
`Cross-Origin-Resource-Policy`. Verified in Chromium against the built app:
twelve pages, hydration working, no violation reported.

The CSP names your Supabase project in `connect-src`, taken from
`VITE_SUPABASE_URL`, so a script that does manage to run cannot post what it
reads anywhere else. It allows `'unsafe-inline'` for scripts and this is
deliberate rather than overlooked: the page carries two inline scripts that
cannot be hashed or moved — the theme and language bootstrap, which must run
before first paint or the page flashes the wrong language, and TanStack's
streaming barrier, whose contents differ on every render. A nonce is the
right answer and the framework has plumbing for one, but React emits the
bootstrap script itself and a nonce that does not reach it produces a blank
page, so it waits until that path is verified in a browser rather than
assumed.

`'unsafe-eval'` is absent and stays absent. So does any third-party script
origin. If you add analytics or a chat widget, add its origin to `script-src`
and `connect-src` in `src/lib/security-headers.ts` — deliberately, in code,
where a reviewer sees it.

One gap to know about: files served straight off disk — `/assets/*.js`,
`/robots.txt`, the favicons — are answered by Nitro's asset handler *before*
the SSR entry runs, so they never reach that code. `public/_headers` covers
them with `nosniff` and friends on Cloudflare and Netlify, which read that
file. On Node they are served by Nitro directly, so set the same headers on
the reverse proxy you put in front of it. This is a small gap either way: all
of those are static files with correct content types, none are uploaded by
anyone, and the CSP on the document already decides what the page may load.

---

## 5. Payments

Without `MOLLIE_API_KEY` the storefront keeps live payments off: a customer can
place an order, the order is stored as awaiting payment, the checkout says so,
and **nothing is ever reported as paid**. That is the intended safe state, not a
bug.

To go live:

1. Create a Mollie account and enable the methods you want. Only advertise
   methods your account actually supports — `storeConfig.payment.methods`
   controls what the storefront shows.
2. Set `MOLLIE_API_KEY` (start with a `test_` key).
3. Set `MOLLIE_WEBHOOK_URL` to `https://<your-domain>/api/public/mollie-webhook`.
   It must be reachable from the internet; localhost will not work.
4. Set `VITE_PAYMENTS_ENABLED` to any value so the storefront advertises the
   methods.
5. Place a test order end to end and confirm the order moves to paid **after**
   the webhook fires, not before.

The webhook takes only a payment id from the request and reads the status back
from the Mollie API with the server-side key, so a forged POST cannot mark an
order paid. A failed or cancelled payment releases the reserved stock.

---

## 6. Transactional email

Without `RESEND_API_KEY` and `EMAIL_FROM` nothing is sent. Every attempt is
recorded in `email_log` with status `skipped`, and the admin shows a warning so
you can see at a glance that customers are not being mailed.

EU consumer law requires the customer to receive confirmation of the contract on
a durable medium, so **set this before taking real orders**.

1. Create a [Resend](https://resend.com) account and verify your sending domain.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (a sender on the verified domain).
3. Optionally set `EMAIL_REPLY_TO`; it defaults to `VITE_STORE_EMAIL`.

The templates are `order_confirmation`, `payment_received`, `order_shipped` and
`order_cancelled`. Staff can re-send any of the first three from the order
detail panel in **Beheer → Bestellingen**.

Using a different provider means editing one `fetch` in
`src/lib/email.server.ts`; everything else is provider-agnostic.

---

## 7. Go-live checks

**Beheer → Dashboard** shows a readiness panel listing exactly what is still
switched off. It is the authoritative version of this list, because it reads the
running configuration rather than a document. Work it until nothing blocking
remains.

Beyond configuration:

- [ ] **Company details published.** `VITE_COMPANY_LEGAL_NAME`,
      `VITE_COMPANY_KVK`, `VITE_COMPANY_VAT` and the address. Dutch and EU law
      require these. Until they are set the shop leaves them out and says so —
      it never invents a registration number.
- [ ] **Delivery promise matches reality.** `VITE_DISPATCH_NOTE` is empty by
      design. Only fill it in once a carrier has actually committed to it.
- [ ] **Shipping methods checked.** The seed deactivates next-day delivery and
      warehouse pickup because no carrier or address backs them. Activate them
      in `public.shipping_methods` only when they are real.
- [ ] **Stock counted.** The seed sets a placeholder 25 per product. Set real
      quantities in **Beheer → Voorraad** before opening.
- [ ] **Images hosted by you.** Product images currently point at the
      marketplace CDN the catalogue came from. Hotlinking a third party's CDN is
      fragile and not yours to rely on — move them to your own storage.
- [ ] **A test order all the way through**: place it, pay it, see the
      confirmation and payment emails arrive, ship it from the admin with a
      tracking code, and check the customer gets the shipping email and stock
      went down by the right amount.

### Growth wiring

- **Product feed.** `https://<your-domain>/feeds/google-shopping.xml` is a
  Merchant Center–compatible RSS feed of the whole catalogue. Add it in Merchant
  Center as a scheduled daily fetch. Meta and most comparison-shopping engines
  accept the same format.

  It sends `identifier_exists: no` because the catalogue has no barcodes; a
  wrong GTIN gets an account suspended, so none is invented. Configure shipping
  rates in Merchant Center rather than the feed, because the free-delivery
  threshold cannot be expressed per item.

- **Sitemap and robots.** `/sitemap.xml` lists every indexable page; noindex
  pages are deliberately absent. Submit it in Search Console.

- **Newsletter.** Sign-ups land in `newsletter_subscribers` with `confirmed`
  false — the RLS policy forces it, so a public sign-up can never mark itself
  confirmed. Nothing sends to that list: this codebase has no marketing mail.
  Before you send anything, run a double opt-in (set `confirmed` only after the
  subscriber clicks a confirmation link) and put an unsubscribe link in every
  message that writes `unsubscribed_at`. Both are legal requirements, and the
  columns are already there for them.

- **Analytics.** The cookie banner already gates non-essential scripts through
  `src/components/consent-scripts.tsx`. Add your tag there so it stays behind
  consent — do not paste it into the document head.

### Languages and search engines

The visitor's language is chosen **on the server**, before anything is
rendered, from the CDN's country header and the browser's `Accept-Language` —
no geolocation prompt, no GPS. The order is: a language the visitor chose
themselves, then `?lang=` in the URL, then the country, then the browser, then
English. A visitor the shop cannot place gets English rather than Dutch.

Because the choice happens server-side, `<html lang>`, the page title, the
meta description and the OpenGraph tags are already correct in the served
HTML, and there is no flash of Dutch before the page settles.

Each page emits a language-free canonical plus `hreflang` alternates on
`?lang=` URLs, with `x-default` on the clean URL. That gives each language an
address a crawler can index without setting the four versions competing for
the same content.

If the country header is missing — a host that does not set one — detection
falls back to the browser language, which is still correct for most visitors.
Cloudflare (`cf-ipcountry`), Vercel, Netlify and a generic `x-country-code`
are all read.

---

## Rolling back

Deployments are stateless; the database is not. Migrations are additive, so
redeploying an older build against the current database is safe.

Re-running a migration is not: only the catalogue seed and the fulfilment
migration are safe to apply twice (verified — a second run leaves the product
and image counts unchanged). The earlier schema migrations will fail on a second
run because the types and tables already exist, which is expected. Apply each
one once, in filename order.

Rolling a migration back is not automatic — take a Supabase backup before
applying new ones to production.

---

## Verifying a deployment's database

The behaviour that matters most — inventory arithmetic, row locking, RLS —
lives in the database, so it is tested there rather than against a mock:

```bash
bun run test:db
```

That builds a throwaway PostgreSQL database from `supabase/tests/harness.sql`
plus every migration, runs the inventory, RLS and concurrency suites, and drops
it again. It needs a local PostgreSQL server and touches nothing you already
have. Pass a database name to run the suites against an existing one instead —
they all roll back, so a copy of production data is safe.
