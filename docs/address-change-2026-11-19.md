# Public address: Philipsweg 39 A → 37 B (19 Nov 2026)

New public address: **Doctor A.F. Philipsweg 37 B, 9403 AD Assen**.
Postcode and city are unchanged.

The return / store address (Elbestraat 113, 9406 SV Assen) is separate and was not touched.
It appears in Settings → Store details, the Legal notice policy and the refund policy.

| Where | Before | After | Status |
|---|---|---|---|
| Contact information policy: translations en, de, fr, es | `… Philipsweg 39 A …` | `… Philipsweg 37 B …` | Done (translationsRegister) |
| Contact information policy: Dutch source text (Settings → Policies → Contact) | `Adres: Doctor A.F. Philipsweg 39 A, 9403 AD Assen, Nederland` | `Adres: Doctor A.F. Philipsweg 37 B, 9403 AD Assen, Nederland` | Done by hand; confirmed live on besjaar.eu on 24 Nov 2026 |
| Theme setting Brand & layout → Public address → Street and number. Feeds the footer, the contact page and the Organization JSON-LD | `Dr. A.F. Philipsweg 39 A` (live theme "Besjaar – Douchesets (specs fix)", 204425953607) | `Dr. A.F. Philipsweg 37 B` in the new copy "Besjaar – adres 37 B" (205100581191) | Copy built and verified. **Waiting to be published**: the connector cannot publish themes |

### The copy "Besjaar – adres 37 B"

- Made with `themeDuplicate` from the live theme. Only `config/settings_data.json` was changed: `company_street` only.
- Checked against the live site on `/`, `/en`, `/collections/showerhead`, `/pages/contact-us` and `/de/pages/contact-us`:
  - "Philipsweg 37 B" appears where "39 A" was (footer, contact page, JSON-LD), and "39 A" no longer appears.
  - The only other differences are Shopify preview-mode scripts, request IDs and section IDs.
- Preview: https://www.besjaar.eu/?preview_theme_id=205100581191
- To make it live: Online Store → Themes → "Besjaar – adres 37 B" → ⋯ → Publish. The old theme stays as a fallback.

Found nowhere else: no pages or articles contain "Philipsweg".

## Rollback

- Policy translations: register the old bodies again. They are the "after" text with `37 B` replaced by `39 A`.
- Theme: publish "Besjaar – Douchesets (specs fix)" (204425953607) again; it still has 39 A.
