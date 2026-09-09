## Goal

Turn the current `/beheer` area (dashboard, products, orders, inventory, returns, reviews, messages, reports, bol.com, users, import) into the complete business-management application described: every table, filter, form and action backed by real data and server-side permission checks.

This is far more than one change set, so it is staged. Each stage ends with a working, testable app — no placeholder screens.

## Stage 1 — Foundation: permissions, layout, audit, notifications

- Database: `permissions` model (role x module x action), `audit_logs` (immutable, insert-only, no update/delete policies), `admin_notifications`, `settings` extension of `application_settings`.
- One server-side permission helper used by **every** admin server function (`requirePermission(module, action)`), plus a matching client hook that hides UI. Backend rejection is the source of truth.
- New admin shell: collapsible sidebar (full section list, mobile slide-out), top bar with breadcrumbs, global search, notification centre with live badges (new orders, ready to ship, low stock, pending returns, open tickets, failed payments, sync errors), profile menu, language selector, quick actions, help, logout.
- Audit logging wired into existing mutations (product edits, stock corrections, order status, refunds, role changes).
- Shared table primitives: search + filters + sorting + pagination + loading/empty/error states, consistent status badges (colour + text + icon).

## Stage 2 — Catalog

- Products list: full column set, all listed filters/sorts, row actions (edit, preview, duplicate, archive, variants, images, history, SEO, bol mapping). Archive-only, confirmation dialogs, no delete-all.
- Tabbed product editor covering all listed field groups incl. calculated margin, promo window, draft saving, validation.
- Variant manager: attributes, generated combinations, per-variant price/EAN/SKU/stock/offer-ID/image.
- Categories (tree, reorder, image, SEO, guarded archive) and brands (logo, banner, SEO, product counts).
- Product image upload to the existing private image bucket with signed URLs, alt text and ordering.

## Stage 3 — Inventory & fulfilment

- Inventory dashboard with reserved/available/damaged/incoming columns, filters, sorting, guarded manual corrections that always write a stock movement.
- Immutable stock-movement history with the full movement-type list and filters.
- Supplier receipts module with the full status flow; completing a receipt updates physical/incoming stock and writes movements.
- Low-stock intelligence: 4-month-sales-vs-stock rule, 6-month recommended order quantity, coverage sorting, alert levels, notes, mark-as-ordered, ignore, export.
- Shipments: carrier, tracking, packing slip, status flow, tracking email hook.

## Stage 4 — Orders, customers, service

- Orders list (all columns/filters/search) and full order detail page with payment history, notes, status history, related returns and stock movements, and guarded actions (cancel, refund, tracking, invoice, resend email, create return).
- bol.com orders page: mapping status, import retry, error details, shipment updates, duplicate-import protection.
- Returns workflow with the full status list and restocking decisions, each writing the right stock movement.
- Customers list + detail (orders, returns, reviews, tickets, internal notes, spend metrics) and support inbox with assignment, priority, replies, linking to orders/returns.
- Review moderation extended with flagging and public responses.

## Stage 5 — Growth, content, reporting, settings

- Promotions and coupons (all types/fields, usage tracking, edit guards after use).
- Content management: sections, banners, pages, FAQs, blog/guides, footer, menus, with draft/scheduled/published states, rich text, media, SEO, multilingual and preview.
- Reports section with the full report list, filters and CSV/Excel export (PDF where feasible).
- Sync dashboard (job states, retries, processed records, never logging secrets).
- Users & roles admin (invite, role change, disable, reset, sessions) and the settings pages, with write-only secret handling.
- Audit-log viewer with filters.

## Technical notes

- Roles/permissions stay in dedicated tables; checks run in `createServerFn` handlers via the existing `requireSupabaseAuth` middleware. RLS policies are added per new table with explicit GRANTs.
- Sensitive settings (Mollie key, bol.com secret, webhook secrets) are stored as backend secrets and surfaced only as "configured / not configured".
- Payments/refunds and transactional email still need your Mollie key and a sender domain — refund actions will be permission-gated and audited, but real money movement stays disabled until the key is provided.
- Each stage ends with typecheck + tests + a browser pass over the new screens.

## Suggested order

Stage 1 first (it unblocks everything else), then 2 → 3 → 4 → 5. Tell me if you want a different order or want a stage dropped.
