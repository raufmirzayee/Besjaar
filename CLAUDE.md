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
- A follow-up to a change that is still unpublished continues on that change's
  copy, but only after checking that none of the live theme's files changed
  since the copy was made (compare file `updatedAt` through the Admin API). If
  live files did change, take a fresh copy of the live theme and reapply.

Why: the live theme's saved working version had fallen behind the live store
(older settings_data.json and templates, e.g. collection handles `showerhead`
instead of `douchekoppen`), so publishing from it was refused and could have
overwritten live settings. A fresh copy of the live theme avoids that.
