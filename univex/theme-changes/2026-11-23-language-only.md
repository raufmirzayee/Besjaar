# Univex: language selector only, no country/currency (23 Nov 2026)

**Theme:** "Univex B.V – Black Friday (alleen taal)" (209604772188), a copy of the live "Univex B.V – Black Friday" (209602183516).

**Change:** `show_country` set from `true` to `false` in:
- `sections/header-group.json` (section `header`);
- `sections/footer-group.json` (section `footer`).

`show_language` stays `true`. Nothing else was changed.

**Result:**
- The header button reads "DE" instead of "DE · EUR / NL". Its menu has only the language list (Nederlands, Deutsch, Français, Español, English).
- The footer shows only the language select.
- Shoppers' country and currency follow Shopify's automatic market detection.

Checked in preview on /de, on desktop and iPhone 13: no country select, and no Liquid errors.

To make it live: Online Store → Themes → "Univex B.V – Black Friday (alleen taal)" → ⋯ → Publish.
To undo: set both settings back to `true` (Theme editor → Header / Footer → "Show country/region").
