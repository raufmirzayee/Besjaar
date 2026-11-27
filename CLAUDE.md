# Besjaar — working rules for Claude

This repository belongs to the Besjaar Shopify store (www.besjaar.eu). Store
work is done through the Shopify connector (theme tools), not in this repo.

## Theme changes: always work on a copy

- Never edit or commit to the live (MAIN) theme directly.
- For every theme change, first duplicate the current live theme
  (`themeDuplicate`) so the copy carries the live settings and templates, then
  make and commit the changes on that copy.
- Name the copy after the live theme plus a short note of the change, e.g.
  `Besjaar – Black Friday 30% (smooth cards)`.
- Do not publish the copy unless the user explicitly says so in the
  conversation.

Why: the live theme's saved working version had fallen behind the live store
(older settings_data.json and templates, e.g. collection handles `showerhead`
instead of `douchekoppen`), so publishing from it was refused and could have
overwritten live settings. A fresh copy of the live theme avoids that.
