# Cyber Security Bildungsgutschein — landing page

A static, dependency-free landing page for a state-funded (Bildungsgutschein)
cyber security retraining programme in Germany.

```
index.html                    the whole page
assets/css/styles.css         design tokens + all component styles
assets/js/main.js             nav, accordions, tabs, scroll spy, form validation
assets/img/                   favicon + logo (SVG)
tools/build-single-file.mjs   inlines CSS/JS into one portable HTML file
```

No build step is required. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000    # then visit http://localhost:8000
node tools/build-single-file.mjs   # optional: dist/index.html, one file
```

## Design system

The page commits to a single visual world — a **public-records dossier** for the
funding and administrative half, a **security console** for the curriculum half —
rather than a light/dark theme pair. Every colour is painted explicitly from a
token, so the page holds up on any host background.

All tokens live in one `:root` block at the top of `styles.css`:

| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `#E9EAE4` | document stock, page ground |
| `--paper-2` | `#F4F5F0` | raised cards, form stock |
| `--paper-3` | `#DFE1D9` | tinted section bands |
| `--ink` | `#16202A` | slate ink, body text |
| `--signal` | `#0F6C64` | actions, links, rails |
| `--stamp` | `#B4402C` | the voucher stamp and error states only |
| `--console` | `#0B1A1C` | dark section ground |
| `--mint` | `#4FD1B5` | accent inside dark sections |

**To rebrand**, change those eight values and nothing else. Type is three roles:
Archivo (display), Public Sans (body), IBM Plex Mono (measure numbers, field
labels, codes). Radius is a deliberate 4px — crisp and administrative, not soft.

## Section order

1. Utility bar — cohort date, phone, DE/EN switch
2. Sticky nav with scroll-spy underline
3. Hero — the Bildungsgutschein rendered as a form document
4. Accreditation strip
5. `§ 01` Funding — the three-appointment voucher process, plus alternative routes
6. `§ 02` Programme spec table
7. `§ 03` Curriculum — 9-module accordion, track tabs, tool stack (console ground)
8. `§ 04` Certificates
9. `§ 05` Career support
10. `§ 06` Participant quotes
11. `§ 07` Admission timeline
12. `§ 08` FAQ accordion
13. Eligibility form (console ground)
14. Footer with German legal links
15. Sticky mobile CTA

Numbered markers are used only where the content is genuinely sequential (the
voucher process, the admission timeline). The `§ 0n` rail labels encode document
structure, not decoration.

## Accessibility

Skip link; `aria-expanded` on every accordion and the menu; full `role="tablist"`
keyboard handling with arrow keys; visible `:focus-visible` on all controls;
inline form errors wired with `aria-invalid` and `data-err-for`; `prefers-reduced-motion`
honoured. JavaScript is enhancement only — with it disabled every panel stays open
and all content is readable.

## Placeholder content — replace before going live

| Where | Placeholder |
| --- | --- |
| Hero voucher, spec table, footer | Measure number `955/1284/2026` |
| Utility bar | Cohort start date `6 October 2026` |
| Utility bar, apply section | Phone `+49 89 1234 5678` |
| Footer | Address, `Träger-ID`, `USt-IdNr.` |
| `§ 06` Participant quotes | **Sample copy.** Replace with approved, attributable participant quotes. |
| Footer legal links | `#impressum`, `#datenschutz`, `#agb`, `#widerruf` are anchors only — point them at real pages. Impressum and Datenschutzerklärung are legally required in Germany. |
| DE/EN switch | Both options are `href="#"` — wire to the German page. |
| Form | `main.js` prevents default and shows a success state. Post to your CRM or form endpoint where the comment says so. |

Exam facts (Security+ `SY0-701`, 90 min / 90 items, 750/900, 3 years) and the legal
references (`§ 81 SGB III`, `§ 83 SGB III`, AZAV) are accurate as written, but
verify them against your own accreditation record before publishing. No outcome
or placement statistics are claimed anywhere on the page — add them only with
figures you can substantiate.
