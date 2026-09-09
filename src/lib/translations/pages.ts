import type { Locale } from "@/lib/i18n";

// Contact, FAQ, shipping info, legal pages and category page copy.
const nl = {
  "category.home": "Home",
  "category.shop": "Winkel",
  "category.empty": "Er zijn nog geen producten in deze categorie.",

  "contact.eyebrow": "Contact",
  "contact.title": "We helpen je graag",
  "contact.introPrefix":
    "Houd je ordernummer bij de hand, dan kunnen we je het snelst helpen. Voor retouren gebruik je het ",
  "contact.introLink": "retourportaal",
  "contact.labelEmail": "E-mail",
  "contact.labelPhone": "Telefoon",
  "contact.labelHours": "Openingstijden",
  "contact.labelWarehouse": "Magazijn",
  "contact.valueHours": "Ma t/m vr 09:00 – 17:00",
  "contact.valueWarehouse": "Besjaar B.V., Nederland",
  "contact.formTitle": "Stuur ons een bericht",
  "contact.sentNotice": "Je bericht is ontvangen. Je krijgt antwoord op het opgegeven e-mailadres.",
  "contact.name": "Naam *",
  "contact.email": "E-mailadres *",
  "contact.phone": "Telefoonnummer",
  "contact.orderNumber": "Ordernummer",
  "contact.subject": "Onderwerp *",
  "contact.message": "Bericht *",
  "contact.company": "Bedrijf",
  "contact.sending": "Versturen…",
  "contact.submit": "Verstuur bericht",
  "contact.privacyPrefix": "We gebruiken je gegevens alleen om je vraag te beantwoorden. Zie onze ",
  "contact.privacyLink": "privacyverklaring",
  "contact.success": "Bedankt! We reageren binnen 1 werkdag.",
  "contact.companyTitle": "Bedrijfsgegevens",
  "contact.companyLine1": "Besjaar B.V. · KvK 00000000 · BTW NL000000000B01",
  "contact.companyLine2": "Eigen merken: Besjaar, RYNEX en LYNEX",
  "contact.companyNote":
    "Let op: KvK- en btw-nummer zijn nog placeholders — geef de definitieve bedrijfsgegevens door zodat we ze hier en op de bestelbevestiging invullen.",

  "faq.eyebrow": "Klantenservice",
  "faq.title": "Veelgestelde vragen",
  "faq.introPrefix": "Staat je vraag er niet bij? Mail ons via ",
  "faq.introLink": "contact",
  "faq.introSuffix": " — we reageren op werkdagen binnen 1 dag.",
  "faq.q1": "Hoe snel wordt mijn bestelling geleverd?",
  "faq.a1":
    "Bestel je op werkdagen voor 22:00 uur? Dan verzenden we dezelfde dag vanuit ons eigen magazijn in Nederland. Levering in Nederland en België duurt doorgaans 1 werkdag, in Duitsland 2 werkdagen.",
  "faq.q2": "Wat kost de verzending?",
  "faq.a2":
    "Verzending binnen Nederland is gratis vanaf € 50. Onder dat bedrag rekenen we een vaste bijdrage. Voor België en Duitsland gelden aparte tarieven die je in de laatste stap van het afrekenen ziet.",
  "faq.q3": "Kan ik mijn bestelling retourneren?",
  "faq.a3":
    "Ja, je hebt 30 dagen bedenktijd. Meld je retour aan via Retouren; je ontvangt daarna een retournummer en instructies. Zodra we het pakket hebben ontvangen en gecontroleerd, betalen we binnen 5 werkdagen terug.",
  "faq.q4": "Welke betaalmethoden accepteren jullie?",
  "faq.a4":
    "iDEAL, Bancontact, creditcard en PayPal via onze betaalpartner. Zakelijke klanten kunnen op verzoek op factuur betalen.",
  "faq.q5": "Hoeveel garantie krijg ik?",
  "faq.a5":
    "Op het volledige assortiment geldt minimaal 2 jaar garantie. Op onze eigen merken Besjaar, RYNEX en LYNEX bieden we bovendien gratis vervanging bij fabricagefouten.",
  "faq.q6": "Kan ik mijn bestelling nog wijzigen?",
  "faq.a6":
    "Zolang de bestelling nog niet is ingepakt kunnen we adres of artikelen aanpassen. Neem daarvoor zo snel mogelijk contact op met de klantenservice met je ordernummer.",
  "faq.q7": "Verkopen jullie ook via bol.com?",
  "faq.a7":
    "Ja, een deel van het assortiment is ook via bol.com te koop. Bestellingen daar lopen via dezelfde voorraad en hetzelfde magazijn, zodat de levertijd gelijk blijft.",

  "shipping.eyebrow": "Bezorging",
  "shipping.title": "Verzending & levering",
  "shipping.intro":
    "Alles wat je bij ons bestelt ligt op voorraad in ons eigen magazijn. Bestel je op een werkdag voor 22:00 uur, dan gaat je pakket dezelfde dag de deur uit.",
  "shipping.thCountry": "Land",
  "shipping.thTime": "Levertijd",
  "shipping.thCost": "Verzendkosten",
  "shipping.nl": "Nederland",
  "shipping.nlTime": "1 werkdag",
  "shipping.nlCost": "Gratis vanaf € 50, anders € 4,95",
  "shipping.be": "België",
  "shipping.beTime": "1 – 2 werkdagen",
  "shipping.de": "Duitsland",
  "shipping.deTime": "2 – 3 werkdagen",
  "shipping.trackLabel": "Track & trace:",
  "shipping.trackTextPrefix":
    " zodra je pakket is ingepakt ontvang je een e-mail met de tracklink. De actuele status vind je ook terug in ",
  "shipping.trackLink": "je account",
  "shipping.notHomeLabel": "Niet thuis?",
  "shipping.notHomeText":
    " De vervoerder biedt het pakket opnieuw aan of levert bij een servicepunt in de buurt.",
  "shipping.returnLabel": "Retour sturen?",
  "shipping.returnTextPrefix": " Meld je retour aan via het ",
  "shipping.returnLink": "retourportaal",
  "shipping.returnTextSuffix": " binnen 30 dagen na ontvangst.",

  "privacy.eyebrow": "Privacy",
  "privacy.title": "Privacyverklaring",
  "privacy.introPrefix": "Vragen over je gegevens? Neem contact op via ",
  "privacy.introLink": "onze klantenservice",
  "privacy.s1t": "Welke gegevens we verwerken",
  "privacy.s1b":
    "Voor een bestelling verwerken we je naam, e-mailadres, telefoonnummer, bezorg- en factuuradres en de inhoud van je order. Maak je een account aan, dan bewaren we daarnaast je aanmeldgegevens, verlanglijst en bestelgeschiedenis.",
  "privacy.s2t": "Waarom we ze verwerken",
  "privacy.s2b":
    "Wij gebruiken je gegevens om de overeenkomst uit te voeren (bestelling, levering, retour en garantie), om te voldoen aan onze wettelijke administratieplicht en — met jouw toestemming — om je de nieuwsbrief te sturen.",
  "privacy.s3t": "Delen met derden",
  "privacy.s3b":
    "We delen alleen wat nodig is: de vervoerder ontvangt je bezorggegevens, de betaaldienstverlener de betaalgegevens en onze hostingpartner slaat de gegevens versleuteld op. Verkoop aan derden vindt nooit plaats.",
  "privacy.s4t": "Bewaartermijnen",
  "privacy.s4b":
    "Ordergegevens bewaren we zeven jaar in verband met de fiscale bewaarplicht. Accountgegevens bewaren we zolang je account bestaat. Nieuwsbriefinschrijvingen verwijderen we direct na afmelding.",
  "privacy.s5t": "Cookies",
  "privacy.s5b":
    "We plaatsen functionele cookies die nodig zijn voor de winkelwagen en het inloggen. Analytische en marketingcookies plaatsen we alleen na jouw toestemming; je keuze kun je altijd wijzigen via de cookiebanner.",
  "privacy.s6t": "Jouw rechten",
  "privacy.s6b":
    "Je hebt recht op inzage, correctie, verwijdering, beperking en overdracht van je gegevens en je kunt bezwaar maken tegen verwerking. Stuur daarvoor een bericht aan de klantenservice; we reageren binnen een maand. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.",

  "terms.eyebrow": "Juridisch",
  "terms.title": "Algemene voorwaarden",
  "terms.introPrefix": "Lees ook onze ",
  "terms.introLink": "privacyverklaring",
  "terms.s1t": "1. Toepasselijkheid",
  "terms.s1b":
    "Deze voorwaarden gelden voor elk aanbod van Besjaar B.V. en voor elke overeenkomst die op afstand tot stand komt tussen Besjaar en de klant. Afwijkingen gelden alleen als die schriftelijk zijn overeengekomen.",
  "terms.s2t": "2. Aanbod en overeenkomst",
  "terms.s2b":
    "Aanbiedingen zijn geldig zolang de voorraad strekt en zolang ze op de website staan. Kennelijke vergissingen in prijs of omschrijving binden Besjaar niet. De overeenkomst komt tot stand op het moment dat de klant de bestelling bevestigt en de betaling is geaccepteerd.",
  "terms.s3t": "3. Prijzen en betaling",
  "terms.s3b":
    "Alle prijzen zijn in euro's, inclusief btw en exclusief eventuele verzendkosten. Betaling verloopt via onze betaalpartner met iDEAL, Bancontact, creditcard of PayPal. Bestellingen worden pas verzonden na ontvangst van de betaling.",
  "terms.s4t": "4. Levering",
  "terms.s4b":
    "Besjaar verzendt vanuit het eigen magazijn in Nederland naar Nederland, België en Duitsland. Genoemde levertijden zijn indicatief. Het risico van beschadiging of vermissing gaat over op de klant op het moment van bezorging.",
  "terms.s5t": "5. Herroepingsrecht",
  "terms.s5b":
    "De klant heeft 30 dagen na ontvangst het recht de overeenkomst zonder opgave van redenen te ontbinden. Producten dienen compleet en in redelijke staat te worden teruggestuurd. Terugbetaling volgt binnen 14 dagen na ontvangst van het retour.",
  "terms.s6t": "6. Garantie en conformiteit",
  "terms.s6b":
    "Op alle producten geldt de wettelijke garantie van minimaal 2 jaar. Op de eigen merken Besjaar, RYNEX en LYNEX bieden wij aanvullend gratis vervanging bij fabricagefouten. Normale slijtage en schade door onjuist gebruik vallen buiten de garantie.",
  "terms.s7t": "7. Klachten",
  "terms.s7b":
    "Klachten kunnen binnen bekwame tijd worden gemeld bij de klantenservice. Besjaar reageert binnen 14 dagen met een inhoudelijk antwoord of een indicatie van de behandeltermijn.",
  "terms.s8t": "8. Toepasselijk recht",
  "terms.s8b":
    "Op overeenkomsten met Besjaar is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde Nederlandse rechter, tenzij de wet dwingend anders bepaalt.",
} as const;

type Key = keyof typeof nl;

export const pageMessages: Record<Locale, Record<Key, string>> = {
  nl,
  en: {
    "category.home": "Home",
    "category.shop": "Shop",
    "category.empty": "There are no products in this category yet.",

    "contact.eyebrow": "Contact",
    "contact.title": "We're happy to help",
    "contact.introPrefix":
      "Keep your order number to hand so we can help you fastest. For returns, use the ",
    "contact.introLink": "returns portal",
    "contact.labelEmail": "Email",
    "contact.labelPhone": "Phone",
    "contact.labelHours": "Opening hours",
    "contact.labelWarehouse": "Warehouse",
    "contact.valueHours": "Mon–Fri 09:00 – 17:00",
    "contact.valueWarehouse": "Besjaar B.V., Netherlands",
    "contact.formTitle": "Send us a message",
    "contact.sentNotice":
      "We received your message. You'll get a reply at the email address given.",
    "contact.name": "Name *",
    "contact.email": "Email address *",
    "contact.phone": "Phone number",
    "contact.orderNumber": "Order number",
    "contact.subject": "Subject *",
    "contact.message": "Message *",
    "contact.company": "Company",
    "contact.sending": "Sending…",
    "contact.submit": "Send message",
    "contact.privacyPrefix": "We only use your details to answer your question. See our ",
    "contact.privacyLink": "privacy statement",
    "contact.success": "Thanks! We'll reply within 1 working day.",
    "contact.companyTitle": "Company details",
    "contact.companyLine1": "Besjaar B.V. · CoC 00000000 · VAT NL000000000B01",
    "contact.companyLine2": "Own brands: Besjaar, RYNEX and LYNEX",
    "contact.companyNote":
      "Note: the CoC and VAT numbers are still placeholders — share the final company details so we can fill them in here and on the order confirmation.",

    "faq.eyebrow": "Customer service",
    "faq.title": "Frequently asked questions",
    "faq.introPrefix": "Can't find your question? Email us via ",
    "faq.introLink": "contact",
    "faq.introSuffix": " — we reply within 1 working day.",
    "faq.q1": "How quickly is my order delivered?",
    "faq.a1":
      "Order on a working day before 10 pm and we ship the same day from our own warehouse in the Netherlands. Delivery usually takes 1 working day in the Netherlands and Belgium, and 2 working days in Germany.",
    "faq.q2": "What does shipping cost?",
    "faq.a2":
      "Shipping within the Netherlands is free from €50. Below that amount we charge a fixed contribution. Separate rates apply to Belgium and Germany, which you'll see in the final checkout step.",
    "faq.q3": "Can I return my order?",
    "faq.a3":
      "Yes, you have 30 days to change your mind. Register your return via Returns; you'll then receive a return number and instructions. Once we've received and checked the parcel, we refund within 5 working days.",
    "faq.q4": "Which payment methods do you accept?",
    "faq.a4":
      "iDEAL, Bancontact, credit card and PayPal via our payment partner. Business customers can pay by invoice on request.",
    "faq.q5": "How much warranty do I get?",
    "faq.a5":
      "The entire range comes with at least 2 years of warranty. On our own brands Besjaar, RYNEX and LYNEX we also offer free replacement in case of manufacturing faults.",
    "faq.q6": "Can I still change my order?",
    "faq.a6":
      "As long as the order hasn't been packed, we can change the address or items. Contact customer service as soon as possible with your order number.",
    "faq.q7": "Do you also sell via bol.com?",
    "faq.a7":
      "Yes, part of the range is also available on bol.com. Those orders run through the same stock and the same warehouse, so delivery times are identical.",

    "shipping.eyebrow": "Delivery",
    "shipping.title": "Shipping & delivery",
    "shipping.intro":
      "Everything you order from us is in stock in our own warehouse. Order on a working day before 10 pm and your parcel leaves the same day.",
    "shipping.thCountry": "Country",
    "shipping.thTime": "Delivery time",
    "shipping.thCost": "Shipping cost",
    "shipping.nl": "Netherlands",
    "shipping.nlTime": "1 working day",
    "shipping.nlCost": "Free from €50, otherwise €4.95",
    "shipping.be": "Belgium",
    "shipping.beTime": "1 – 2 working days",
    "shipping.de": "Germany",
    "shipping.deTime": "2 – 3 working days",
    "shipping.trackLabel": "Track & trace:",
    "shipping.trackTextPrefix":
      " as soon as your parcel is packed you'll receive an email with the tracking link. You can also find the current status in ",
    "shipping.trackLink": "your account",
    "shipping.notHomeLabel": "Not at home?",
    "shipping.notHomeText": " The carrier will try again or deliver to a service point nearby.",
    "shipping.returnLabel": "Sending something back?",
    "shipping.returnTextPrefix": " Register your return via the ",
    "shipping.returnLink": "returns portal",
    "shipping.returnTextSuffix": " within 30 days of receipt.",

    "privacy.eyebrow": "Privacy",
    "privacy.title": "Privacy statement",
    "privacy.introPrefix": "Questions about your data? Get in touch via ",
    "privacy.introLink": "our customer service",
    "privacy.s1t": "Which data we process",
    "privacy.s1b":
      "For an order we process your name, email address, phone number, delivery and billing address and the contents of your order. If you create an account, we also store your sign-up details, wishlist and order history.",
    "privacy.s2t": "Why we process it",
    "privacy.s2b":
      "We use your data to perform the agreement (order, delivery, returns and warranty), to meet our statutory record-keeping obligations and — with your consent — to send you the newsletter.",
    "privacy.s3t": "Sharing with third parties",
    "privacy.s3b":
      "We only share what is necessary: the carrier receives your delivery details, the payment provider the payment details, and our hosting partner stores the data encrypted. We never sell data to third parties.",
    "privacy.s4t": "Retention periods",
    "privacy.s4b":
      "We keep order data for seven years due to fiscal retention obligations. Account data is kept for as long as your account exists. Newsletter subscriptions are deleted immediately after unsubscribing.",
    "privacy.s5t": "Cookies",
    "privacy.s5b":
      "We place functional cookies that are necessary for the cart and signing in. Analytical and marketing cookies are only placed with your consent; you can change your choice at any time via the cookie banner.",
    "privacy.s6t": "Your rights",
    "privacy.s6b":
      "You have the right to access, correct, delete, restrict and transfer your data, and you may object to processing. Send a message to customer service; we respond within one month. You can also file a complaint with the Dutch Data Protection Authority.",

    "terms.eyebrow": "Legal",
    "terms.title": "Terms and conditions",
    "terms.introPrefix": "Also read our ",
    "terms.introLink": "privacy statement",
    "terms.s1t": "1. Applicability",
    "terms.s1b":
      "These terms apply to every offer by Besjaar B.V. and to every distance contract concluded between Besjaar and the customer. Deviations only apply if agreed in writing.",
    "terms.s2t": "2. Offer and agreement",
    "terms.s2b":
      "Offers are valid while stocks last and while they appear on the website. Obvious errors in price or description are not binding on Besjaar. The agreement is concluded the moment the customer confirms the order and payment has been accepted.",
    "terms.s3t": "3. Prices and payment",
    "terms.s3b":
      "All prices are in euros, including VAT and excluding any shipping costs. Payment runs through our payment partner with iDEAL, Bancontact, credit card or PayPal. Orders are only shipped after payment has been received.",
    "terms.s4t": "4. Delivery",
    "terms.s4b":
      "Besjaar ships from its own warehouse in the Netherlands to the Netherlands, Belgium and Germany. Stated delivery times are indicative. The risk of damage or loss passes to the customer at the moment of delivery.",
    "terms.s5t": "5. Right of withdrawal",
    "terms.s5b":
      "The customer has 30 days after receipt to dissolve the agreement without giving reasons. Products must be returned complete and in reasonable condition. Refunds follow within 14 days of receiving the return.",
    "terms.s6t": "6. Warranty and conformity",
    "terms.s6b":
      "All products carry the statutory warranty of at least 2 years. On our own brands Besjaar, RYNEX and LYNEX we additionally offer free replacement in case of manufacturing faults. Normal wear and damage from improper use are excluded.",
    "terms.s7t": "7. Complaints",
    "terms.s7b":
      "Complaints can be reported to customer service within a reasonable period. Besjaar responds within 14 days with a substantive answer or an indication of the handling time.",
    "terms.s8t": "8. Applicable law",
    "terms.s8b":
      "Dutch law applies to agreements with Besjaar. Disputes are submitted to the competent Dutch court, unless the law mandatorily provides otherwise.",
  },
  de: {
    "category.home": "Start",
    "category.shop": "Shop",
    "category.empty": "In dieser Kategorie gibt es noch keine Produkte.",

    "contact.eyebrow": "Kontakt",
    "contact.title": "Wir helfen dir gerne",
    "contact.introPrefix":
      "Halte deine Bestellnummer bereit, dann können wir dir am schnellsten helfen. Für Rücksendungen nutzt du das ",
    "contact.introLink": "Rücksendeportal",
    "contact.labelEmail": "E-Mail",
    "contact.labelPhone": "Telefon",
    "contact.labelHours": "Öffnungszeiten",
    "contact.labelWarehouse": "Lager",
    "contact.valueHours": "Mo–Fr 09:00 – 17:00 Uhr",
    "contact.valueWarehouse": "Besjaar B.V., Niederlande",
    "contact.formTitle": "Schreib uns eine Nachricht",
    "contact.sentNotice":
      "Deine Nachricht ist eingegangen. Du erhältst eine Antwort an die angegebene E-Mail-Adresse.",
    "contact.name": "Name *",
    "contact.email": "E-Mail-Adresse *",
    "contact.phone": "Telefonnummer",
    "contact.orderNumber": "Bestellnummer",
    "contact.subject": "Betreff *",
    "contact.message": "Nachricht *",
    "contact.company": "Firma",
    "contact.sending": "Wird gesendet…",
    "contact.submit": "Nachricht senden",
    "contact.privacyPrefix":
      "Wir verwenden deine Daten ausschließlich zur Beantwortung deiner Frage. Siehe unsere ",
    "contact.privacyLink": "Datenschutzerklärung",
    "contact.success": "Danke! Wir antworten innerhalb eines Werktags.",
    "contact.companyTitle": "Firmendaten",
    "contact.companyLine1": "Besjaar B.V. · HR 00000000 · USt-IdNr. NL000000000B01",
    "contact.companyLine2": "Eigene Marken: Besjaar, RYNEX und LYNEX",
    "contact.companyNote":
      "Hinweis: Handelsregister- und Umsatzsteuernummer sind noch Platzhalter — teile uns die endgültigen Firmendaten mit, damit wir sie hier und in der Bestellbestätigung eintragen.",

    "faq.eyebrow": "Kundenservice",
    "faq.title": "Häufig gestellte Fragen",
    "faq.introPrefix": "Ist deine Frage nicht dabei? Schreib uns über ",
    "faq.introLink": "Kontakt",
    "faq.introSuffix": " — wir antworten an Werktagen innerhalb eines Tages.",
    "faq.q1": "Wie schnell wird meine Bestellung geliefert?",
    "faq.a1":
      "Bestellst du an Werktagen bis 22:00 Uhr? Dann versenden wir noch am selben Tag aus unserem eigenen Lager in den Niederlanden. Die Lieferung dauert in den Niederlanden und Belgien in der Regel 1 Werktag, in Deutschland 2 Werktage.",
    "faq.q2": "Was kostet der Versand?",
    "faq.a2":
      "Der Versand innerhalb der Niederlande ist ab 50 € gratis. Darunter berechnen wir einen festen Beitrag. Für Belgien und Deutschland gelten eigene Tarife, die du im letzten Schritt der Kasse siehst.",
    "faq.q3": "Kann ich meine Bestellung zurücksenden?",
    "faq.a3":
      "Ja, du hast 30 Tage Widerrufsrecht. Melde deine Rücksendung über Rücksendungen an; du erhältst danach eine Retourennummer und Anweisungen. Sobald wir das Paket erhalten und geprüft haben, erstatten wir innerhalb von 5 Werktagen.",
    "faq.q4": "Welche Zahlungsmethoden akzeptiert ihr?",
    "faq.a4":
      "iDEAL, Bancontact, Kreditkarte und PayPal über unseren Zahlungspartner. Geschäftskunden können auf Anfrage per Rechnung zahlen.",
    "faq.q5": "Wie viel Garantie bekomme ich?",
    "faq.a5":
      "Auf das gesamte Sortiment gilt mindestens 2 Jahre Garantie. Auf unsere eigenen Marken Besjaar, RYNEX und LYNEX bieten wir zusätzlich kostenlosen Ersatz bei Fabrikationsfehlern.",
    "faq.q6": "Kann ich meine Bestellung noch ändern?",
    "faq.a6":
      "Solange die Bestellung noch nicht verpackt ist, können wir Adresse oder Artikel anpassen. Kontaktiere dafür so schnell wie möglich den Kundenservice mit deiner Bestellnummer.",
    "faq.q7": "Verkauft ihr auch über bol.com?",
    "faq.a7":
      "Ja, ein Teil des Sortiments ist auch über bol.com erhältlich. Diese Bestellungen laufen über denselben Bestand und dasselbe Lager, sodass die Lieferzeit gleich bleibt.",

    "shipping.eyebrow": "Zustellung",
    "shipping.title": "Versand & Lieferung",
    "shipping.intro":
      "Alles, was du bei uns bestellst, liegt in unserem eigenen Lager auf Vorrat. Bestellst du an einem Werktag bis 22:00 Uhr, geht dein Paket noch am selben Tag raus.",
    "shipping.thCountry": "Land",
    "shipping.thTime": "Lieferzeit",
    "shipping.thCost": "Versandkosten",
    "shipping.nl": "Niederlande",
    "shipping.nlTime": "1 Werktag",
    "shipping.nlCost": "Gratis ab 50 €, sonst 4,95 €",
    "shipping.be": "Belgien",
    "shipping.beTime": "1 – 2 Werktage",
    "shipping.de": "Deutschland",
    "shipping.deTime": "2 – 3 Werktage",
    "shipping.trackLabel": "Sendungsverfolgung:",
    "shipping.trackTextPrefix":
      " sobald dein Paket verpackt ist, erhältst du eine E-Mail mit dem Tracking-Link. Den aktuellen Status findest du auch in ",
    "shipping.trackLink": "deinem Konto",
    "shipping.notHomeLabel": "Nicht zu Hause?",
    "shipping.notHomeText":
      " Der Zusteller versucht es erneut oder liefert an einen Servicepunkt in der Nähe.",
    "shipping.returnLabel": "Etwas zurücksenden?",
    "shipping.returnTextPrefix": " Melde deine Rücksendung über das ",
    "shipping.returnLink": "Rücksendeportal",
    "shipping.returnTextSuffix": " innerhalb von 30 Tagen nach Erhalt an.",

    "privacy.eyebrow": "Datenschutz",
    "privacy.title": "Datenschutzerklärung",
    "privacy.introPrefix": "Fragen zu deinen Daten? Kontaktiere ",
    "privacy.introLink": "unseren Kundenservice",
    "privacy.s1t": "Welche Daten wir verarbeiten",
    "privacy.s1b":
      "Für eine Bestellung verarbeiten wir deinen Namen, deine E-Mail-Adresse, Telefonnummer, Liefer- und Rechnungsadresse sowie den Inhalt deiner Bestellung. Legst du ein Konto an, speichern wir zusätzlich deine Anmeldedaten, Wunschliste und Bestellhistorie.",
    "privacy.s2t": "Warum wir sie verarbeiten",
    "privacy.s2b":
      "Wir nutzen deine Daten zur Erfüllung des Vertrags (Bestellung, Lieferung, Rücksendung und Garantie), zur Erfüllung gesetzlicher Aufbewahrungspflichten und — mit deiner Einwilligung — für den Newsletter.",
    "privacy.s3t": "Weitergabe an Dritte",
    "privacy.s3b":
      "Wir geben nur das Nötigste weiter: Der Zusteller erhält deine Lieferdaten, der Zahlungsdienstleister die Zahlungsdaten und unser Hosting-Partner speichert die Daten verschlüsselt. Ein Verkauf an Dritte findet niemals statt.",
    "privacy.s4t": "Aufbewahrungsfristen",
    "privacy.s4b":
      "Bestelldaten bewahren wir sieben Jahre aufgrund der steuerlichen Aufbewahrungspflicht auf. Kontodaten speichern wir, solange dein Konto besteht. Newsletter-Anmeldungen löschen wir sofort nach der Abmeldung.",
    "privacy.s5t": "Cookies",
    "privacy.s5b":
      "Wir setzen funktionale Cookies, die für den Warenkorb und die Anmeldung erforderlich sind. Analyse- und Marketing-Cookies setzen wir nur mit deiner Einwilligung; deine Auswahl kannst du jederzeit über das Cookie-Banner ändern.",
    "privacy.s6t": "Deine Rechte",
    "privacy.s6b":
      "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung und Übertragung deiner Daten und kannst der Verarbeitung widersprechen. Sende dafür eine Nachricht an den Kundenservice; wir antworten innerhalb eines Monats. Du kannst auch eine Beschwerde bei der Datenschutzbehörde einreichen.",

    "terms.eyebrow": "Rechtliches",
    "terms.title": "Allgemeine Geschäftsbedingungen",
    "terms.introPrefix": "Lies auch unsere ",
    "terms.introLink": "Datenschutzerklärung",
    "terms.s1t": "1. Geltungsbereich",
    "terms.s1b":
      "Diese Bedingungen gelten für jedes Angebot von Besjaar B.V. und für jeden Fernabsatzvertrag zwischen Besjaar und dem Kunden. Abweichungen gelten nur, wenn sie schriftlich vereinbart wurden.",
    "terms.s2t": "2. Angebot und Vertrag",
    "terms.s2b":
      "Angebote gelten solange der Vorrat reicht und solange sie auf der Website stehen. Offensichtliche Irrtümer bei Preis oder Beschreibung binden Besjaar nicht. Der Vertrag kommt zustande, sobald der Kunde die Bestellung bestätigt und die Zahlung akzeptiert wurde.",
    "terms.s3t": "3. Preise und Zahlung",
    "terms.s3b":
      "Alle Preise verstehen sich in Euro, inklusive MwSt. und zzgl. eventueller Versandkosten. Die Zahlung erfolgt über unseren Zahlungspartner mit iDEAL, Bancontact, Kreditkarte oder PayPal. Bestellungen werden erst nach Zahlungseingang versandt.",
    "terms.s4t": "4. Lieferung",
    "terms.s4b":
      "Besjaar versendet aus dem eigenen Lager in den Niederlanden nach den Niederlanden, Belgien und Deutschland. Genannte Lieferzeiten sind unverbindlich. Das Risiko von Beschädigung oder Verlust geht mit der Zustellung auf den Kunden über.",
    "terms.s5t": "5. Widerrufsrecht",
    "terms.s5b":
      "Der Kunde hat 30 Tage nach Erhalt das Recht, den Vertrag ohne Angabe von Gründen zu widerrufen. Produkte müssen vollständig und in angemessenem Zustand zurückgesendet werden. Die Rückerstattung erfolgt innerhalb von 14 Tagen nach Erhalt der Rücksendung.",
    "terms.s6t": "6. Garantie und Konformität",
    "terms.s6b":
      "Für alle Produkte gilt die gesetzliche Garantie von mindestens 2 Jahren. Auf die eigenen Marken Besjaar, RYNEX und LYNEX bieten wir zusätzlich kostenlosen Ersatz bei Fabrikationsfehlern. Normaler Verschleiß und Schäden durch unsachgemäßen Gebrauch sind ausgeschlossen.",
    "terms.s7t": "7. Beschwerden",
    "terms.s7b":
      "Beschwerden können innerhalb angemessener Frist beim Kundenservice gemeldet werden. Besjaar antwortet innerhalb von 14 Tagen inhaltlich oder nennt eine Bearbeitungsfrist.",
    "terms.s8t": "8. Anwendbares Recht",
    "terms.s8b":
      "Auf Verträge mit Besjaar ist niederländisches Recht anwendbar. Streitigkeiten werden dem zuständigen niederländischen Gericht vorgelegt, sofern das Gesetz nicht zwingend etwas anderes vorschreibt.",
  },
  fr: {
    "category.home": "Accueil",
    "category.shop": "Boutique",
    "category.empty": "Il n'y a encore aucun produit dans cette catégorie.",

    "contact.eyebrow": "Contact",
    "contact.title": "Nous sommes là pour vous aider",
    "contact.introPrefix":
      "Gardez votre numéro de commande à portée de main pour un traitement plus rapide. Pour les retours, utilisez le ",
    "contact.introLink": "portail de retours",
    "contact.labelEmail": "E-mail",
    "contact.labelPhone": "Téléphone",
    "contact.labelHours": "Heures d'ouverture",
    "contact.labelWarehouse": "Entrepôt",
    "contact.valueHours": "Du lundi au vendredi, 09h00 – 17h00",
    "contact.valueWarehouse": "Besjaar B.V., Pays-Bas",
    "contact.formTitle": "Envoyez-nous un message",
    "contact.sentNotice":
      "Votre message a bien été reçu. Vous recevrez une réponse à l'adresse e-mail indiquée.",
    "contact.name": "Nom *",
    "contact.email": "Adresse e-mail *",
    "contact.phone": "Numéro de téléphone",
    "contact.orderNumber": "Numéro de commande",
    "contact.subject": "Objet *",
    "contact.message": "Message *",
    "contact.company": "Entreprise",
    "contact.sending": "Envoi…",
    "contact.submit": "Envoyer le message",
    "contact.privacyPrefix":
      "Nous utilisons vos données uniquement pour répondre à votre question. Consultez notre ",
    "contact.privacyLink": "déclaration de confidentialité",
    "contact.success": "Merci ! Nous répondons sous 1 jour ouvré.",
    "contact.companyTitle": "Informations sur l'entreprise",
    "contact.companyLine1": "Besjaar B.V. · RC 00000000 · TVA NL000000000B01",
    "contact.companyLine2": "Marques propres : Besjaar, RYNEX et LYNEX",
    "contact.companyNote":
      "Remarque : les numéros de registre du commerce et de TVA sont encore des espaces réservés — communiquez-nous les données définitives afin que nous les indiquions ici et sur la confirmation de commande.",

    "faq.eyebrow": "Service client",
    "faq.title": "Questions fréquentes",
    "faq.introPrefix": "Votre question ne figure pas ici ? Écrivez-nous via ",
    "faq.introLink": "contact",
    "faq.introSuffix": " — nous répondons sous 1 jour ouvré.",
    "faq.q1": "Sous quel délai ma commande est-elle livrée ?",
    "faq.a1":
      "Vous commandez un jour ouvré avant 22h ? Nous expédions le jour même depuis notre propre entrepôt aux Pays-Bas. La livraison prend généralement 1 jour ouvré aux Pays-Bas et en Belgique, et 2 jours ouvrés en Allemagne.",
    "faq.q2": "Combien coûte la livraison ?",
    "faq.a2":
      "La livraison aux Pays-Bas est gratuite dès 50 €. En dessous de ce montant, nous facturons une participation fixe. Des tarifs distincts s'appliquent à la Belgique et à l'Allemagne ; ils s'affichent à la dernière étape du paiement.",
    "faq.q3": "Puis-je retourner ma commande ?",
    "faq.a3":
      "Oui, vous disposez de 30 jours pour changer d'avis. Déclarez votre retour via Retours ; vous recevrez ensuite un numéro de retour et des instructions. Dès réception et contrôle du colis, nous remboursons sous 5 jours ouvrés.",
    "faq.q4": "Quels moyens de paiement acceptez-vous ?",
    "faq.a4":
      "iDEAL, Bancontact, carte de crédit et PayPal via notre partenaire de paiement. Les clients professionnels peuvent payer sur facture sur demande.",
    "faq.q5": "Quelle garantie ai-je ?",
    "faq.a5":
      "L'ensemble de la gamme bénéficie d'au moins 2 ans de garantie. Sur nos marques propres Besjaar, RYNEX et LYNEX, nous offrons en plus un remplacement gratuit en cas de défaut de fabrication.",
    "faq.q6": "Puis-je encore modifier ma commande ?",
    "faq.a6":
      "Tant que la commande n'est pas emballée, nous pouvons modifier l'adresse ou les articles. Contactez le service client au plus vite avec votre numéro de commande.",
    "faq.q7": "Vendez-vous aussi via bol.com ?",
    "faq.a7":
      "Oui, une partie de la gamme est aussi disponible sur bol.com. Ces commandes passent par le même stock et le même entrepôt, le délai de livraison reste donc identique.",

    "shipping.eyebrow": "Livraison",
    "shipping.title": "Expédition & livraison",
    "shipping.intro":
      "Tout ce que vous commandez chez nous est en stock dans notre propre entrepôt. Commandez un jour ouvré avant 22h et votre colis part le jour même.",
    "shipping.thCountry": "Pays",
    "shipping.thTime": "Délai de livraison",
    "shipping.thCost": "Frais de livraison",
    "shipping.nl": "Pays-Bas",
    "shipping.nlTime": "1 jour ouvré",
    "shipping.nlCost": "Gratuit dès 50 €, sinon 4,95 €",
    "shipping.be": "Belgique",
    "shipping.beTime": "1 – 2 jours ouvrés",
    "shipping.de": "Allemagne",
    "shipping.deTime": "2 – 3 jours ouvrés",
    "shipping.trackLabel": "Suivi de colis :",
    "shipping.trackTextPrefix":
      " dès que votre colis est emballé, vous recevez un e-mail avec le lien de suivi. Le statut actuel se trouve aussi dans ",
    "shipping.trackLink": "votre compte",
    "shipping.notHomeLabel": "Absent ?",
    "shipping.notHomeText":
      " Le transporteur représente le colis ou le dépose dans un point service à proximité.",
    "shipping.returnLabel": "Un retour à envoyer ?",
    "shipping.returnTextPrefix": " Déclarez votre retour via le ",
    "shipping.returnLink": "portail de retours",
    "shipping.returnTextSuffix": " dans les 30 jours suivant la réception.",

    "privacy.eyebrow": "Confidentialité",
    "privacy.title": "Déclaration de confidentialité",
    "privacy.introPrefix": "Des questions sur vos données ? Contactez ",
    "privacy.introLink": "notre service client",
    "privacy.s1t": "Quelles données nous traitons",
    "privacy.s1b":
      "Pour une commande, nous traitons votre nom, votre adresse e-mail, votre numéro de téléphone, vos adresses de livraison et de facturation ainsi que le contenu de votre commande. Si vous créez un compte, nous conservons également vos identifiants, votre liste d'envies et votre historique de commandes.",
    "privacy.s2t": "Pourquoi nous les traitons",
    "privacy.s2b":
      "Nous utilisons vos données pour exécuter le contrat (commande, livraison, retour et garantie), pour respecter nos obligations légales de conservation et — avec votre consentement — pour vous envoyer la newsletter.",
    "privacy.s3t": "Partage avec des tiers",
    "privacy.s3b":
      "Nous ne partageons que le nécessaire : le transporteur reçoit vos données de livraison, le prestataire de paiement les données de paiement et notre hébergeur stocke les données de manière chiffrée. Aucune vente à des tiers n'a jamais lieu.",
    "privacy.s4t": "Durées de conservation",
    "privacy.s4b":
      "Les données de commande sont conservées sept ans en raison de l'obligation fiscale de conservation. Les données de compte sont conservées tant que votre compte existe. Les inscriptions à la newsletter sont supprimées dès le désabonnement.",
    "privacy.s5t": "Cookies",
    "privacy.s5b":
      "Nous plaçons des cookies fonctionnels nécessaires au panier et à la connexion. Les cookies analytiques et marketing ne sont placés qu'avec votre consentement ; vous pouvez modifier votre choix à tout moment via la bannière de cookies.",
    "privacy.s6t": "Vos droits",
    "privacy.s6b":
      "Vous avez le droit d'accéder à vos données, de les rectifier, de les supprimer, d'en limiter le traitement et de les transférer, et vous pouvez vous opposer au traitement. Envoyez un message au service client ; nous répondons dans un délai d'un mois. Vous pouvez également déposer une plainte auprès de l'autorité de protection des données.",

    "terms.eyebrow": "Mentions légales",
    "terms.title": "Conditions générales",
    "terms.introPrefix": "Lisez également notre ",
    "terms.introLink": "déclaration de confidentialité",
    "terms.s1t": "1. Champ d'application",
    "terms.s1b":
      "Ces conditions s'appliquent à toute offre de Besjaar B.V. et à tout contrat à distance conclu entre Besjaar et le client. Les dérogations ne s'appliquent que si elles ont été convenues par écrit.",
    "terms.s2t": "2. Offre et contrat",
    "terms.s2b":
      "Les offres sont valables dans la limite des stocks disponibles et tant qu'elles figurent sur le site. Les erreurs manifestes de prix ou de description n'engagent pas Besjaar. Le contrat est conclu au moment où le client confirme la commande et où le paiement est accepté.",
    "terms.s3t": "3. Prix et paiement",
    "terms.s3b":
      "Tous les prix sont en euros, TVA incluse et hors éventuels frais de livraison. Le paiement s'effectue via notre partenaire de paiement avec iDEAL, Bancontact, carte de crédit ou PayPal. Les commandes ne sont expédiées qu'après réception du paiement.",
    "terms.s4t": "4. Livraison",
    "terms.s4b":
      "Besjaar expédie depuis son propre entrepôt aux Pays-Bas vers les Pays-Bas, la Belgique et l'Allemagne. Les délais indiqués sont indicatifs. Le risque de dommage ou de perte est transféré au client au moment de la livraison.",
    "terms.s5t": "5. Droit de rétractation",
    "terms.s5b":
      "Le client dispose de 30 jours après réception pour résilier le contrat sans indiquer de motif. Les produits doivent être renvoyés complets et en bon état. Le remboursement intervient dans les 14 jours suivant la réception du retour.",
    "terms.s6t": "6. Garantie et conformité",
    "terms.s6b":
      "Tous les produits bénéficient de la garantie légale d'au moins 2 ans. Sur les marques propres Besjaar, RYNEX et LYNEX, nous offrons en complément un remplacement gratuit en cas de défaut de fabrication. L'usure normale et les dommages dus à un usage inapproprié sont exclus.",
    "terms.s7t": "7. Réclamations",
    "terms.s7b":
      "Les réclamations peuvent être signalées au service client dans un délai raisonnable. Besjaar répond sous 14 jours par une réponse de fond ou une indication du délai de traitement.",
    "terms.s8t": "8. Droit applicable",
    "terms.s8b":
      "Le droit néerlandais s'applique aux contrats conclus avec Besjaar. Les litiges sont soumis au tribunal néerlandais compétent, sauf disposition légale impérative contraire.",
  },
};
