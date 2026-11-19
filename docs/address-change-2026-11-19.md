# Public address: Philipsweg 39 A → 37 B (19 Nov 2026)

New public address: **Doctor A.F. Philipsweg 37 B, 9403 AD Assen**.
Postcode and city are unchanged.

The return / store address (Elbestraat 113, 9406 SV Assen) is separate and was not touched.
It appears in Settings → Store details, the Legal notice policy and the refund policy.

| Where | Before | After | Status |
|---|---|---|---|
| Contact information policy: translations en, de, fr, es | `… Philipsweg 39 A …` | `… Philipsweg 37 B …` | Done (translationsRegister) |
| Contact information policy: Dutch source text (Settings → Policies → Contact) | `Adres: Doctor A.F. Philipsweg 39 A, 9403 AD Assen, Nederland` | `Adres: Doctor A.F. Philipsweg 37 B, 9403 AD Assen, Nederland` | **Manual**: the connector lacks `write_legal_policies` |
| Live theme "Besjaar – Douchesets (specs fix)" (204425953607): Theme settings → Brand & layout → Public address → Street and number. Feeds the footer, the contact page and the Organization JSON-LD | `Dr. A.F. Philipsweg 39 A` | `Dr. A.F. Philipsweg 37 B` | **Manual**: the connector cannot write to the live theme |

Found nowhere else: no pages or articles contain "Philipsweg".

## Rollback

- Policy translations: register the old bodies again. They are the "after" text with `37 B` replaced by `39 A`.
- Theme setting: set Street and number back to `Dr. A.F. Philipsweg 39 A`.
