# Besjaar.eu — Conversie-audit en actieplan (29 september 2026)

Bron van waarheid: de live Shopify-winkel (thema "Besjaar – welkomstmelding (preview)", rol MAIN), producten, instellingen, orders en Shopify-analytics, uitgelezen via de Shopify Admin API. De storefront zelf kon vanuit deze omgeving niet worden geopend (netwerkblokkade op besjaar.eu); alles wat hieronder over de pagina's staat is afgeleid uit de thema-bestanden, templates en locale-strings van het gepubliceerde thema.

Legenda per aanbeveling: **Prio** HIGH/MEDIUM/LOW · **Code?** ja/nee · **Admin?** direct in Shopify admin uitvoerbaar ja/nee.

---

## 0. Wat er in deze sessie al is gedaan

| # | Wijziging | Status |
|---|-----------|--------|
| 1 | Pagina "Klantbeoordelingen" (/pages/reviews): de zin dat alle reviews van kopers via deze website komen is vervangen door een eerlijke bronvermelding (Bol.com-reviews overgenomen + reviews van webshopklanten). Origineel: `docs/backups/page-reviews.original.html`. | **Live** |
| 2 | Onafhankelijk thema-duplicaat gemaakt: **"Besjaar – CRO fixes 29 sep (preview, niet gepubliceerd)"** (id 201588146503). Daarin: nieuwe Nederlandse hero-kop/subkop/CTA en de claim "20.000+ tevreden klanten" vervangen door de echte Judge.me-score (4,7 / 5, 395 reviews, automatisch bijgewerkt). Bestanden: `theme-staged/`. | **Staged – preview en publiceer zelf** |
| 3 | Nieuwe teksten voor Contactgegevens, Verzendbeleid en Retourbeleid geschreven (`docs/policies/`). De connector heeft geen schrijfrecht op beleidsteksten (`write_legal_policies`), dus **plakken in Settings › Policies**. | **Klaar om te plakken** |

Niets anders is aan de live winkel veranderd. Prijzen, kortingen, apps en het live thema zijn ongemoeid gelaten.

---

## 1. Diagnose: waarom koopt een geïnteresseerde bezoeker niet?

### 1.1 De cijfers (Shopify-analytics)

**Het verkeer is voor 93% bot-verkeer.** Van 10.353 sessies in 90 dagen kwamen er 9.631 uit de Verenigde Staten, "direct", vrijwel allemaal op "/" en met 0 conversies. Dat verkeer vertekent elk rapport. Kijk alleen naar NL/BE/DE.

Echte funnel, NL + BE + DE, laatste 60 dagen:

| Stap | Mobiel | Desktop | Totaal |
|------|--------|---------|--------|
| Sessies | 436 | 194 | 646 |
| Toegevoegd aan winkelwagen | 48 (11%) | 29 (15%) | 77 (12%) |
| Checkout bereikt | 36 | 11 | 47 (7%) |
| Bestelling afgerond | 1 | 1 | 2 (0,3%) |

Ter controle: online-store-orders sinds augustus zijn 5 stuks, waarvan 3 eigen testbestellingen (24 sep, terugbetaald). Er zijn dus **2 echte webshop-orders** (16 sep NL €29,99; 23 sep BE €25,50). De 17 overige orders zijn Amazon-orders (zaklampen) via Marketplace Connect.

**Conclusie volgens het funnel-model uit de opdracht:** de toevoegen-aan-winkelwagen-ratio (12%) is uitstekend en het aantal dat de checkout bereikt (7% van alle sessies, 61% van de winkelwagens) is hoog. Het lek zit **tussen "checkout bereikt" en "betaald": 47 → 2**. Dat is een checkout-/betaal-/vertrouwens- of technisch probleem, niet een productpagina-probleem. Pas daarna komt het tweede probleem: er is simpelweg te weinig gekwalificeerd verkeer (gemiddeld 10–25 NL-sessies per dag).

Er zijn slechts 13 "abandoned checkouts" geregistreerd (Shopify maakt die pas aan zodra een e-mailadres is ingevuld). Ruim 30 sessies haakten dus af **vóór** het e-mailveld: op de eerste checkout-stap. Dat wijst op: onverwachte verzendkosten, een checkout die niet in het Nederlands laadt, een kortingscode die niet (meer) geldig is, of een technische fout op mobiel.

### 1.2 Wat ik in de winkel zelf heb gevonden dat kopers afschrikt

1. **Verkeerd bedrijf in de checkout-contactgegevens.** Settings › Policies › Contactgegevens toont "SelectStore B.V., selectstorebv@gmail.com, KVK 95218475" – een ander bedrijf dan Univex B.V. dat in de footer, Legal notice en het privacybeleid staat. Dit is de link "Contact" onderaan de checkout. Voor een oplettende koper is dit een rode vlag.
2. **Verzendkosten kloppen niet met het beleid.** Shopify rekent NL €3,99 onder €25; het verzendbeleid zegt €4,99. BE/DE/FR (€4,95, gratis vanaf €30) staan nergens in het beleid; de Algemene Voorwaarden zeggen zelfs "alleen verzending binnen Nederland".
3. **Retourbeleid is twee beleidsteksten door elkaar**, met een afgebroken zin ("ere noodzakelijke oplossing…"), tegenstrijdigheden (klant betaalt retour vs. "wij sturen een retourlabel"), en de clausule "artikelen in de uitverkoop kunnen niet worden geretourneerd" – bij verkoop op afstand aan consumenten in de EU niet toegestaan. Alle douchekoppen staan nu "in de uitverkoop" (doorgestreepte prijs).
4. **Drie verschillende telefoonnummers**: Legal notice 0687616931, Shopify-adres/privacybeleid +31 6 44341881, thema-instelling +31 6 16745062.
5. **Garantie tegenstrijdig**: het thema toont overal "12 maanden garantie" (productpagina, FAQ, footer); de Algemene Voorwaarden zeggen "wij bieden geen garanties". Daarnaast geldt in NL altijd de wettelijke conformiteitsgarantie.
6. **Prijspresentatie**: alle producten tonen een doorgestreepte "van"-prijs (€39,99 → €25,99 = "35% KORTING", €19,99 → €17,99, €29,99 → €25,99, €9,99 → €8,99). Op 16 september is hetzelfde filtermodel nog voor €29,99 verkocht; de doorgestreepte €39,99 is dus zeer waarschijnlijk niet de laagste prijs van de afgelopen 30 dagen die de Omnibus-richtlijn als referentie eist. Permanent 35% korting maakt de "van"-prijs ongeloofwaardig.
7. **Welkomstpop-up geeft iedereen 20%** (weging: 10% = 0, 15% = 0, 20% = 100, gratis verzending = 0), bovenop de doorgestreepte prijs. Het thema toont dan badges als "35% + 20% KORTING". Dat oogt goedkoop, holt de marge uit (€39,99 → €20,79) en de codes gelden voor alle klanten (niet alleen nieuwe).
8. **Onbewezen claim in de hero**: "20.000+ tevreden klanten". Nergens onderbouwd; de eigen data toont 395 reviews. (In het staged thema vervangen door de echte score.)
9. **Reviews-herkomst was onjuist beschreven.** De 395 Judge.me-reviews zijn overgenomen van Bol.com (gebruikersnamen als "Jordy81", "Prullie71"; één review meldt zelfs "er staat RVS maar het is kunststof"). De reviewpagina zei dat ze van webshopklanten kwamen. Nu gecorrigeerd.
10. **Geen productvergelijking op de live pagina's.** Het thema bevat een model-finder en een uitgebreide vergelijkings-collectiepagina, maar geen enkel product gebruikt het `product.shower`-template en de collectie gebruikt de "gegroepeerde" variant zonder vergelijking/filters. Kopers moeten 4 bijna identieke titels ("Hoge Druk Douchekop met Filter – 10 Standen…" vs "… met Slang & Filter …") zelf ontcijferen.
11. **28 apps geïnstalleerd**, waarvan minstens 12 niets doen voor deze winkel: 5 dropshipping-apps (Zendrop, Spocket, AliExpress Dropshipping Center, CJdropshipping, DSers), 2 extra review-apps naast Judge.me (Trustoo, Ryviu; ook oude Loox- en Vitals-metavelden staan nog in de shop), 2 vertaalapps (GTranslate én Translate & Adapt), 2 levertijd-apps (Delivery & Pickup, C‑EDD) naast de levertijd-functie van het thema zelf, Section Store, GemPages, FreeStoreBuild, Altera, BUCKS-valuta-omzetter, Conversion Bear Trust Badges. Elk daarvan kan scripts in de storefront laden.
12. **Markten en valuta**: markt "Worldwide" is actief voor 20 EU-landen terwijl alleen NL/BE/DE/FR worden verzonden, en 100+ presentatievaluta staan aan. Een Oostenrijkse of Italiaanse bezoeker kan winkelen maar niet afrekenen. Spaans staat als taal gepubliceerd zonder markt.
13. **9 thema's in de bibliotheek**, het live thema heet "welkomstmelding (preview)" en er staat een thema "VERWIJDEREN – verkeerde kopie". Grote kans op per ongeluk verkeerd publiceren.
14. **Wachtwoordpagina**: 545 sessies landden op /password in de afgelopen 60 dagen (winkel stond in augustus dicht terwijl Google/ads al verkeer stuurden).
15. **Engelse URL's krijgen NL-verkeer**: 73+ sessies landden op /en. Controleer de kwaliteit van de Engelse pagina's of stuur NL-bezoekers naar /.
16. **Klaviyo is geïnstalleerd maar niet in het thema ingebed** (`inject_via_app_embed: false`, geen script in theme.liquid). Onsite-tracking (viewed product, started checkout) werkt dan niet; e-mailflows kunnen alleen op Shopify-events draaien.
17. **Cookiebanner**: de eigen Besjaar-banner staat uit (`show_cookie_preferences: false`), dus alles hangt af van Shopify's standaardbanner in Settings › Customer privacy. Als die op "consent vereist" staat en de banner niet zichtbaar is, vuren Meta/Google-pixels in de EU niet.
18. **Thema-gewicht**: het live thema laadt ~1,3 MB aan CSS-bronnen (o.a. besjaar-seo-base.css 269 kB, besjaar-seo-design.css 204 kB, besjaar-ui-core.css 190 kB, besjaar-polish-layer.css 113 kB, besjaar-ui-product-page.css 107 kB) plus 21 "sectie-lagen" in de header-group die alleen CSS injecteren. Dat is traag op mobiel (waar 70% van het echte verkeer zit).
19. **Productgewicht staat op 0 kg** bij alle producten. Nu geen probleem (vaste tarieven), wel zodra je carrier-tarieven of Sendcloud/MyParcel gaat gebruiken, en Google Merchant Center kan om gewicht vragen.
20. **Theme-instelling "standard_shipping_rate"** staat niet expliciet ingevuld en valt terug op 4,99 in de structured data (Google), terwijl je €3,99 rekent. Zet in Theme settings › Delivery & trust › "Standard shipping rate (EUR)" op `3.99`.

---

## A. Top 10 problemen die nu verkoop kosten

| # | Probleem | Bewijs | Prio |
|---|----------|--------|------|
| 1 | 47 bezoekers bereiken de checkout, 2 kopen | analytics NL/BE/DE 60 dagen | HIGH |
| 2 | Verkeerd bedrijf (SelectStore B.V.) in checkout-contactgegevens | Settings › Policies | HIGH |
| 3 | Verzend- en retourbeleid kloppen niet / spreken zichzelf tegen | beleidsteksten vs. verzendtarieven | HIGH |
| 4 | Permanente 35% "van/voor"-korting + 20% pop-up bovenop = ongeloofwaardig en Omnibus-risico | producten, kortingen, thema-instellingen | HIGH |
| 5 | Te weinig gekwalificeerd verkeer (10–25 NL-sessies/dag), 93% bots | analytics | HIGH |
| 6 | Geen vergelijking/keuzehulp; 4 bijna identieke producttitels | live templates | MEDIUM |
| 7 | Onbewezen claims (20.000+ klanten) en onjuiste reviewherkomst | thema-locale, reviewpagina | HIGH (deels opgelost) |
| 8 | Garantie: "12 maanden" in thema vs "geen garantie" in voorwaarden | thema vs. Algemene Voorwaarden | MEDIUM |
| 9 | App-overload (28 apps) en 1,3 MB CSS → trage mobiele site | app-lijst, thema-assets | MEDIUM |
| 10 | Markten/valuta/talen breder dan verzendgebied; 9 thema's; live thema is een "preview" | Markets, Themes | MEDIUM |

## B. Top 10 veranderingen met de grootste conversie-impact

| # | Verandering | Doel in de funnel | Prio | Code? | Admin? |
|---|-------------|-------------------|------|-------|--------|
| 1 | **Doe vandaag een echte mobiele testbestelling** (iDEAL via Mollie én via Shopify Payments, met en zonder WELKOM-code, NL-adres) en noteer elk scherm. Controleer: taal van de checkout (Settings › Checkout › taal = Nederlands), of beide gateways tegelijk aanstaan (dubbele iDEAL-knop verwart), of de kortingscode wordt geweigerd, en of de verzendkosten pas in de checkout verschijnen. | Checkout → Purchase | HIGH | nee | ja |
| 2 | Plak de nieuwe **contactgegevens, verzend- en retourbeleid** (`docs/policies/`). | Trust | HIGH | nee | ja |
| 3 | **Eén heldere prijsstructuur** zonder permanente doorstreping (zie E). | Trust / Purchase | HIGH | nee | ja |
| 4 | **Welkomstaanbod terug naar 10% óf gratis verzending**, alleen nieuwe klanten (Discounts › Customer eligibility) en niet stapelen met een doorgestreepte prijs. Theme settings › Welcome offer: weging 10% = 100, rest 0. | AOV / marge / Trust | HIGH | nee | ja |
| 5 | **Publiceer het staged thema** na preview: concrete Dutch hero + echte reviewscore. | Interest / Trust | HIGH | gedaan | ja (Themes › Publish) |
| 6 | **Bot-verkeer uitsluiten** in rapportages (filter op land NL/BE/DE) zodat beslissingen op echte data rusten; overweeg Cloudflare-botbescherming op het domein. | Meetbaarheid | HIGH | nee | ja |
| 7 | **Keuzehulp + vergelijkingstabel** op collectie- en productpagina (thema heeft de secties al; zie D/15). | Interest → ATC | MEDIUM | ja (thema-editor) | deels |
| 8 | **Producttitels verkorten en onderscheidend maken** (zie D). | Interest | MEDIUM | nee | ja |
| 9 | **Apps opruimen** (12 verwijderen) en thema-CSS samenvoegen. | Snelheid mobiel | MEDIUM | deels | ja |
| 10 | **Markten beperken tot NL/BE/DE/FR, EUR only, Spaans uit**; thema-bibliotheek opschonen tot 2 thema's. | Trust / minder fouten | MEDIUM | nee | ja |

## C. Homepage

Huidige NL-hero: "Besjaar douchekoppen. Elke dag beter." + "Premium Besjaar douchekoppen voor een krachtige, comfortabele straal en flexibele sproeistanden — een eenvoudige upgrade voor elke dag." + knop "Shop douchekoppen" + "20.000+ tevreden klanten".

Staged (in het duplicaat-thema, zichtbaar op /nl):
- Eyebrow: BESJAAR® OFFICIËLE WEBSHOP (ongewijzigd)
- H1: **Een betere douche. Elke dag.**
- Subkop: **Douchekoppen met een krachtige straal en minder waterverbruik, 3 of 10 sproeistanden en optioneel een ingebouwd filter tegen kalk en chloor. Voor 16:00 besteld, morgen in huis.** (elke claim staat in de productdata of het verzendbeleid)
- Primaire CTA: **Bekijk alle douchekoppen** · secundair: Waarom Besjaar
- Bewijsregel: **4,7 / 5 · Gebaseerd op 395 reviews** (live uit Judge.me; verdwijnt vanzelf als er geen reviews zijn)

Verdere homepage-aanbevelingen:
- De "spec strip" onder de hero zegt "PREMIUM CHROOMAFWERKING · KRACHTIG AANVOELENDE STRAAL · …". Vervang door de drie dingen die kopers écht willen weten: **Gratis verzending vanaf €25 · Morgen in huis · 30 dagen retour** (Prio HIGH, thema-editor: sectie "spec strip" → vinkje "vertaalde teksten" uit en 3 blokken invullen).
- De sectie "Publiek marketplace-bewijs" toont 4.7/5 en 391 reviews handmatig ingevuld; hetzelfde staat nu in de hero. Houd één van beide (Prio LOW).
- De feature-tekst "Mineraalfilter … zeven filterlagen" spreekt de productpagina tegen ("8-traps filtratie"). Maak het 8 (Prio MEDIUM, thema-editor).
- Homepage SEO-title staat goed ("Besjaar | Douchekoppen & Douchefilters").

## D. Productpagina's

Wat er al goed staat (uit `sections/besjaar-store-product.liquid`): titel, prijs + doorgestreepte prijs, badge, Judge.me-sterren bij de prijs, sticky "In winkelwagen" op mobiel, dynamische checkout-knoppen, "Gratis verzending vanaf €25 / 30 dagen retour / 12 maanden garantie", levertijd, product-FAQ (pasvorm, standen, water, filter, slang, retour, garantie, verzending), gerelateerde producten, "In de doos" en specificaties in de beschrijving.

Verbeteringen:

| # | Verandering | Prio | Code? | Admin? |
|---|-------------|------|-------|--------|
| 1 | **Titels**: "Douchekop met Filter – 10 standen" / "Douchekop met Filter + Slang – 10 standen" / "Douchekop – 3 standen" / "Douchekop + Slang – 3 standen" / "Navulfilters (2 stuks)". Nu: 60–70 tekens die in cards en Google Shopping afkappen. | MEDIUM | nee | ja (Products) |
| 2 | **Garantie-claim** "12 maanden" alleen laten staan als je dat als verkoper daadwerkelijk toezegt én in de voorwaarden zet; anders Theme settings › Warranty op 0 en de wettelijke garantie benoemen. | MEDIUM | nee | ja |
| 3 | **Vergelijkingsblok** ("Welk model past bij mij?") boven de FAQ: gebruik de bestaande sectie `besjaar-ui-shower-model-finder` of de tabel uit sectie O hieronder. | MEDIUM | thema-editor | deels |
| 4 | **Waterbesparing consistent**: 3-standen-modellen claimen "tot 50% minder water", filtermodellen "tot 30% met pauzeknop". Beide met "max. 8 l/min" onderbouwen en dezelfde formulering gebruiken. | MEDIUM | nee | ja |
| 5 | **Eerste review-invoer**: Judge.me "review request"-mail na 14 dagen aanzetten (Judge.me › Settings › Review requests) zodat er échte webshopreviews bijkomen. | HIGH | nee | ja |
| 6 | Productgewicht invullen (schatting 0,25–0,45 kg) voor Merchant Center en toekomstige carrier-tarieven. | LOW | nee | ja |
| 7 | Judge.me-widgetblok in `templates/product.json` staat op `review_data: "sample_data"`; controleer in de thema-editor dat de widget op echte productdata staat. | MEDIUM | nee | ja |

Productcopy-structuur (probleem → oplossing → voordelen → features → bewijs → inhoud → installatie → FAQ) staat feitelijk al in de beschrijvingen; de FAQ komt uit het thema. Geen herschrijving nodig, wel de consistentie-punten hierboven.

## E. Prijs en korting

Kosten, marges en advertentiekosten zijn niet uit Shopify af te leiden; onderstaande structuur is een voorstel op basis van de huidige verkoopprijzen en de prijs waarvoor het filtermodel op 16 september daadwerkelijk verkocht (€29,99).

| Rol | Product | Nu (van → voor) | Voorstel |
|-----|---------|-----------------|----------|
| Instap | Douchekop 3 standen | €19,99 → €17,99 | **€17,99**, geen doorstreping |
| Instap + slang | Douchekop 3 standen + slang | €29,99 → €25,99 | **€24,99**, geen doorstreping |
| Hoofdproduct | Douchekop met filter, 10 standen | €39,99 → €25,99 | **€29,99** vaste prijs (dit is de prijs die al verkocht) |
| Premium / set | Douchekop met filter + slang, 10 standen | €39,99 → €25,99 | **€34,99** ("Complete set") |
| Herhaalaankoop | Navulfilters 2 stuks | €9,99 → €8,99 | **€8,99**; bundelkorting bij 2 sets |

Waarom: de set met slang is nu even duur als zonder slang (€25,99), dus de slang heeft geen waarde en "premium" bestaat niet. Met €29,99/€34,99 ontstaat een logische ladder, de gratis-verzenddrempel (€25) wordt vanzelf gehaald, en er is ruimte voor een échte, tijdelijke actie.

Kortingsbeleid (Prio HIGH, Admin):
- Verwijder de permanente compare-at-prijzen, of zet ze op de werkelijk eerder gehanteerde prijs en gebruik ze maximaal 2–3 weken per campagne (Omnibus: laagste prijs in de 30 dagen ervoor tonen). **Laat dit door een NL-jurist bevestigen.**
- Welkomstaanbod: één variant, 10% (WELKOM10) óf gratis verzending (WELKOMSHIP), alleen nieuwe klanten, één keer per klant, niet combineerbaar met een actieprijs. WELKOM15/WELKOM20 deactiveren.
- Bundel: "Douchekop met filter + 2 navulsets" als automatische korting (bijv. €5) in plaats van procentuele kortingen.
- Test daarna één ding tegelijk: gratis-verzenddrempel €25 vs €30, of 10% vs gratis verzending.

## F. Vertrouwen

| # | Actie | Prio | Admin? |
|---|-------|------|--------|
| 1 | Contactgegevens-beleid plakken (`docs/policies/contact-information.html`). Bevestig het juiste telefoonnummer (ik heb +31 6 44341881 gebruikt, uit je Shopify-adres en privacybeleid) en zet hetzelfde nummer in Theme settings › Support phone en Legal notice. | HIGH | ja |
| 2 | Verzendbeleid plakken (`docs/policies/shipping-policy.html`). | HIGH | ja |
| 3 | Retourbeleid plakken (`docs/policies/refund-policy.html`); laat een jurist de herroepings- en terugbetalingsbepalingen bevestigen. | HIGH | ja |
| 4 | Algemene Voorwaarden: verwijder "geen garanties", vermeld de wettelijke garantie, verzending naar NL/BE/DE/FR, en het bedrijf (Univex B.V., KVK, btw). Laat opstellen/controleren door jurist of gebruik de Thuiswinkel/Webwinkelkeur-modelvoorwaarden. | HIGH | ja |
| 5 | Contactpagina: vul de pagina-body met adres, KVK, btw, e-mail, telefoon en reactietijd (nu staat er alleen "gebruik het formulier"). | MEDIUM | ja |
| 6 | Overweeg een keurmerk (WebwinkelKeur/Thuiswinkel) zodra voorwaarden kloppen. | LOW | n.v.t. |
| 7 | Reviews: alleen echte; Judge.me-verzoekmails aan; nooit sample-data. | HIGH | ja |

## G. Checkout

Kan vanuit deze sessie niet worden getest (geen browsertoegang, en `shopifyPaymentsAccount` is niet leesbaar via de connector). Controlelijst voor jou, in deze volgorde:
1. Settings › Checkout: checkout-taal Nederlands; klantaccounts optioneel; telefoonnummer niet verplicht; e-mail als eerste veld.
2. Settings › Payments: staat iDEAL via **Mollie én** Shopify Payments aan? Kies één iDEAL-aanbieder (orders tonen beide gateways). Zorg dat iDEAL, Apple Pay, Google Pay, PayPal en creditcard zichtbaar zijn; Klarna/Bancontact voor BE.
3. Doe de testbestelling op een telefoon: met WELKOM-code, met verzendadres BE, met een mislukte betaling (afbreken bij iDEAL) en controleer de "abandoned checkout"-mail.
4. Settings › Notifications: abandoned-checkout-mail aan, na 1 uur, in het Nederlands, met de winkelwagen en de verzendbelofte.
5. Controleer dat Shopify's cookiebanner zichtbaar is (Settings › Customer privacy) — anders vuren Meta/Google-pixels niet in NL.
6. Controleer of het bedankpagina-/aankoop-event in Google Ads en Meta binnenkomt (één testorder).

## H. SEO

Goed: Nederlandse SEO-titels en meta-omschrijvingen per product/collectie, canonical, hreflang door Shopify, alt-teksten op alle productfoto's, structured data met Judge.me-rating, 4 blogartikelen ("gids").

| # | Actie | Prio | Code? | Admin? |
|---|-------|------|-------|--------|
| 1 | Google Search Console: controleer dat /password-URL's uit de index zijn en dat de site sinds september weer volledig geïndexeerd is. | HIGH | nee | ja |
| 2 | Spaans (es) uitschakelen (geen markt); EN/DE/FR alleen houden als de vertalingen goed zijn. Controleer /en handmatig – 10% van de NL-bezoekers landt daar. | MEDIUM | nee | ja |
| 3 | Producthandles zijn 90+ tekens (bijv. `besjaar-douchekop-met-slang-hoge-druk-met-filter-10-sproeistanden-regendouche-waterbesparende-handdouche-zilver`). Inkorten naar bijv. `douchekop-met-filter-en-slang` mét automatische redirect. Alleen doen als je de Merchant-Center-feed tegelijk laat herindexeren. | LOW | nee | ja |
| 4 | Collectie "Douchekoppen" heeft een goede H1/omschrijving; voeg intern-linkende blokken toe naar blogartikelen ("Douchekop vervangen in 5 minuten"). | LOW | thema | deels |
| 5 | Zoekwoorden per pagina: home = "douchekop"/"douchekop kopen"; collectie = "waterbesparende douchekop"/"douchekop met filter"; product = "douchekop met filter 10 standen"; blog = "goede douchekop", "krachtige douchekop", "douchekop met slang". Geen extra werk nodig aan techniek. | MEDIUM | nee | ja |

## I. Google Shopping / Merchant Center

Feed-basis is in orde: alle 5 producten hebben een EAN, merk Besjaar, Google-productcategorie (581 / 5048), zijn gepubliceerd op het Google & YouTube-kanaal, en de prijs/sale-prijs komt uit Shopify.

Controleer/repareer:
1. Verzendinstellingen in Merchant Center moeten NL €3,99 (<€25, gratis ≥€25) en BE/DE/FR €4,95 (<€30) zijn – niet €4,99 (Prio HIGH).
2. Retourbeleid in Merchant Center: 30 dagen, klant betaalt retour (of gratis, wat je kiest) – gelijk aan de website (HIGH).
3. Bedrijfsgegevens: Univex B.V., Assen, zelfde telefoonnummer als de site (HIGH).
4. Sale-prijs: alleen met compare-at als het een echte, tijdelijke actie is; permanente "sale" leidt tot afkeuring "misleading pricing" (HIGH).
5. Titels: korte, beschrijvende titels (zie D1); Google kapt bij ~70 tekens (MEDIUM).
6. Gewicht invullen (LOW).

## J. Advertentie-landingspagina's

| Zoekintentie / advertentie | Landingspagina |
|----------------------------|----------------|
| "douchekop met filter", "douchefilter kalk" | product Douchekop met filter (10 standen) |
| "douchekop met slang", "doucheset" | product Douchekop met filter + slang |
| "waterbesparende douchekop", "hoge druk douchekop" | collectie Douchekoppen (met vergelijking bovenaan) |
| "goedkope douchekop", "handdouche" | product Douchekop 3 standen |
| merknaam "Besjaar" | homepage |
| Meta/TikTok koud verkeer | product Douchekop met filter (best beoordeeld: 4,85 / 52 reviews) |

Regels: nooit koud verkeer naar de homepage; advertentiebelofte = eerste schermvulling van de pagina; UTM's op elke link; conversie = purchase (niet klik of ATC); wekelijks CPA en ROAS per landingspagina. Start pas met budget nadat B1–B4 zijn afgerond, anders betaal je voor een lekkende checkout.

## K. E-mail (Klaviyo of Shopify Email)

1. Klaviyo eerst correct inbedden (Online Store › Themes › App embeds › Klaviyo onsite) of overstappen op Shopify Email + Shopify Flow om apps te besparen.
2. Welkomstmail (direct): code + "welke douchekop past bij mij".
3. Verlaten checkout: 1 uur (herinnering + verzendbelofte), 24 uur (FAQ: past hij op mijn aansluiting?), 72 uur (laatste herinnering, geen extra korting).
4. Orderbevestiging en verzendbevestiging: Shopify-standaard, in het Nederlands, met track & trace (Parcel Panel).
5. Na levering (dag 3): installatietip "in 5 minuten gemonteerd" + link naar FAQ.
6. Reviewverzoek (dag 14): Judge.me.
7. Filtervervanging (maand 4 en maand 9 na aankoop van een filtermodel): navulset-herinnering – dit is je enige natuurlijke herhaalaankoop.
8. Campagnes: maximaal 2 per maand, alleen met een echte reden (nieuw model, seizoensactie).

## L. Social (Meta / TikTok / Instagram)

Content die de productclaims laat zien in plaats van vertelt: waterstraal bij lage druk (voor/na), 10 standen doorklikken, filter openen na 3 maanden (kalk/vuil), installatie in 5 minuten zonder gereedschap, 3 vs 10 standen vergelijking, "welke past bij mij" in 30 seconden, echte Bol.com-review voorgelezen, FAQ "past hij op mijn aansluiting?" (½" universeel). Verhouding: 3 informatieve posts op 1 verkooppost. Elke video eindigt met de productpagina-link, niet de homepage.

## M. Analytics / KPI-dashboard

Rapporteer altijd met filter **land = NL, BE, DE** (of via Shopify's "sessions by country"-segment) totdat het botverkeer is geblokkeerd.

Wekelijks:

| KPI | Nu (60 dagen NL/BE/DE) | Doel 30 dagen |
|-----|------------------------|---------------|
| Sessies/dag | 10–25 | 50+ (na ads) |
| ATC-ratio | 12% | ≥ 10% |
| Checkout-ratio (van ATC) | 61% | ≥ 60% |
| Checkout → betaald | 4% | ≥ 35% |
| Conversie totaal | 0,3% | 1,5–2,5% |
| AOV webshop | ~€27 | €32+ |
| Reviews via webshop | 1 | 10+ |

Plus: omzet, orders per product, mobiel vs desktop, bron (Google Ads / Meta / organisch / direct), CAC en ROAS per kanaal, verlaten checkouts (aantal + top-reden uit test), klantvragen (onderwerpen).

## N. 30-dagenplan

**Week 1 – lek dichten (alles HIGH, geen code)**
1. Testbestelling mobiel (G1–G3) en de gevonden checkout-fout(en) oplossen.
2. Beleidsteksten plakken (F1–F3), telefoonnummer overal gelijk, contactpagina vullen.
3. Kortingen: compare-at-prijzen weg of naar echte referentieprijs; WELKOM15/20 uit; welkomstweging 10% = 100.
4. Prijsladder invoeren (E).
5. Staged thema previewen en publiceren; spec-strip aanpassen (C).
6. Judge.me-reviewverzoeken aan; abandoned-checkout-mail aan en in het Nederlands.
7. Markten beperken tot NL/BE/DE/FR, EUR, Spaans uit; thema's opruimen (2 houden: live + staging).

**Week 2 – meten en vertrouwen**
8. Cookiebanner/pixels controleren; Google Ads- en Meta-conversie testen met één order.
9. Merchant Center: verzend-, retour- en bedrijfsgegevens gelijk aan site (I1–I4).
10. Search Console: indexering, /password-URL's, /en-verkeer beoordelen.
11. Algemene Voorwaarden laten controleren (F4).
12. Apps verwijderen (12 stuks), daarna Lighthouse mobiel meten als nulmeting.

**Week 3 – kiezen makkelijker maken**
13. Producttitels inkorten (D1), waterbesparingsclaims gelijktrekken (D4), garantie consistent (D2).
14. Vergelijkingsblok op collectie en productpagina (sectie O).
15. E-mailflows 2, 3, 5, 6, 7 live.

**Week 4 – verkeer**
16. Google Shopping + zoekcampagne op "douchekop met filter" en "waterbesparende douchekop" naar de juiste productpagina's (J); klein budget, purchase als conversie.
17. 4 demo-video's (L) als organische posts en als Meta-advertentie naar de filter-productpagina.
18. Eerste A/B-test: welkomstaanbod 10% vs gratis verzending (één variabele, 4 weken, minimaal 100 checkouts per variant voordat je een winnaar kiest).
19. Wekelijkse KPI-check (M); één groot conversieprobleem per week oplossen.

---

## O. Vergelijkingstabel (bron: productbeschrijvingen en metavelden, alleen geverifieerde kenmerken)

| | Douchekop 3 standen | Douchekop 3 standen + slang | Douchekop met filter, 10 standen | Douchekop met filter + slang, 10 standen |
|---|---|---|---|---|
| Sproeistanden | 3 | 3 | 10 (8 + 2 PowerWash) | 10 (8 + 2 PowerWash) |
| Ingebouwd 8-traps filter | — | — | ✓ | ✓ |
| Slang 1,5 m meegeleverd | — | ✓ | — | ✓ |
| Pauzeknop | — | — | ✓ | ✓ |
| Max. 8 l/min / luchtverrijkte straal | ✓ | ✓ | ✓ (air-injectie) | ✓ (air-injectie) |
| Anti-kalk siliconen sproeiers | ✓ | ✓ | ✓ | ✓ |
| Universele ½" aansluiting, zonder gereedschap | ✓ | ✓ | ✓ | ✓ |
| Diameter | 13 cm | 13 cm | 13 cm | 13 cm |
| Navulfilters passend | — | — | set van 2 | set van 2 |
| Beoordeling (Judge.me) | 4,68 (133) | 4,67 (140) | 4,85 (52) | 4,69 (68) |

"Meest gekozen"/"Best beoordeeld" alleen gebruiken voor het filtermodel (hoogste score) zolang de webshop-verkoopdata nog te klein is voor een "populairst"-label.

## P. Juridische punten om te laten bevestigen (NL-jurist/boekhouder)

- Omnibus-prijsregels (referentieprijs = laagste prijs in 30 dagen) bij elke doorgestreepte prijs.
- Herroepingsrecht (14 dagen), terugbetaling inclusief standaardverzendkosten, waardevermindering.
- Garantie: wat je als verkoper toezegt (12 maanden?) naast de wettelijke conformiteit.
- Duitsland: Impressum-eisen, Verpackungsgesetz/LUCID-registratie en btw (OSS) zodra je actief in DE adverteert.
- Welke rechtspersoon verkoopt: overal Univex B.V. (SelectStore B.V. verwijderd uit de contactgegevens).

## Q. Bijlagen in deze repo

- `docs/policies/contact-information.html`, `shipping-policy.html`, `refund-policy.html` – plakken in Settings › Policies (HTML-modus).
- `docs/policies/page-reviews.html` – de nu gepubliceerde reviewpagina.
- `docs/backups/` – originele teksten (voor terugdraaien).
- `theme-staged/sections/besjaar-store-hero.liquid`, `theme-staged/templates/index.json` – geüpload naar het duplicaat-thema "Besjaar – CRO fixes 29 sep".

---

## R. Aanvulling 29 september (homepage in één oogopslag)

Het thema "Besjaar – CRO fixes 29 sep" is inmiddels door de eigenaar gepubliceerd (nieuwe hero met echte reviewscore staat live). De volgende ronde staat klaar in het **onafhankelijke thema "Besjaar – homepage 29 sep (preview)"** (id 201589817671, niet gepubliceerd):

| Wat | Waarom | Bestand |
|-----|--------|---------|
| Trust-strip onder de hero toont nu: Gratis verzending in NL vanaf €25 · Voor 16:00 besteld, morgen in huis · 30 dagen bedenktijd · Veilig betalen met iDEAL | De koper ziet verzendkosten, levertijd, retour en betaalmethode zonder te scrollen | `theme-staged/sections/besjaar-store-strip.liquid`, `templates/index.json` |
| Sectie "quote over een lifestyle-foto" verwijderd | Vage tekst zonder doel, extra scroll op mobiel | `templates/index.json` |
| Drie "Waarom Besjaar"-kaarten herschreven en feitelijk gemaakt (kalk wegvegen · 3 of 10 sproeistanden · 8-traps filter in de greep) met NL-kop "Drie dingen die je meteen merkt." | Vervangt vage teksten en de foute "zeven filterlagen"-claim | `theme-staged/sections/besjaar-store-features.liquid`, `templates/index.json` |
| Volgorde: hero → trust-strip → 4 douchekoppen → waarom → Judge.me-reviews → Bol.com-bewijs → CTA | Eerst wat het is en wat het kost, dan waarom, dan bewijs | `templates/index.json` |
| Welkomstpop-up opent niet meer vanzelf (geen timer, scroll of exit-intent); de knop "Bekijk je welkomstaanbod" rechtsonder blijft | Een pop-up na 3 seconden maakt "in één oogopslag begrijpen" onmogelijk | `theme-staged/snippets/besjaar-welcome-offer.liquid`, `assets/besjaar-welcome-offer.js` |

Direct live gezet (productdata, geen thema-wijziging):
- Korte Nederlandse producttitels via metaveld `custom.short_title_nl` (het thema gebruikte dit veld al): "Douchekop met filter – 10 standen", "Douchekop met filter + slang – 10 standen", "Douchekop – 3 standen", "Douchekop + slang – 3 standen", "Navulfilters – set van 2". De officiële producttitel (Google Shopping, admin) is ongewijzigd.
- Regel "Geschikt voor: …" op elke productkaart via metaveld `custom.best_for` (bijv. "kalk, hard water en een droge huid").

Publiceren: Online Store › Themes › "Besjaar – homepage 29 sep (preview)" › Preview (controleer op je telefoon) › Publish. Terugdraaien: publiceer het vorige thema opnieuw.
