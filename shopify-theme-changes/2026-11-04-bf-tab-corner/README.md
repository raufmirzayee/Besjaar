# Black Friday tab back in the corner (4 Nov 2026, later)

The Google "store quality" badge (Google & YouTube app embed, bottom-left)
no longer shows on besjaar.eu. The welcome/Black Friday tab still stood at the
height that kept it clear of that badge (112px from the bottom on phones,
108px on desktop), so on the home page it floated over the hero headline
"Een betere douche elke dag.".

Changed
- `snippets/besjaar-welcome-offer.liquid` (copy of the live theme file with the
  fix applied):
  - the tab now rests in the badge's own corner: 16px / 46px on phones,
    36px / 36px on desktop (the app embed's margins);
  - the existing lift script still checks the corner, so if the Google badge,
    the cookie banner or a sticky bar is there, the tab moves up to sit 10px
    above it. Two later checks (15 s and 20 s) catch a badge that loads late.

Applied to the unpublished theme copy
"Besjaar – Black Friday-knop in hoek (preview)" (a duplicate of the live theme
"Besjaar – mobiele winkelwagen + Black Friday"). The live theme is unchanged
until that copy is published.
