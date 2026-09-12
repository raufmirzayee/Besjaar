/**
 * Setup & Connections copy.
 *
 * Split from admin.ts because it is a screen family of its own and adding it
 * inline would have doubled that file. It merges into the same dictionary, so
 * `t()` and the translation parity tests see no difference.
 *
 * Dutch is the source language. Every key here has an English twin below;
 * German and French fall back to Dutch like the rest of the backoffice.
 */

export const settingsNl = {
  "admin.common.noAccessTo": "Geen toegang tot {module}",
  "admin.common.noAccessBody":
    "Je rol geeft geen rechten voor deze pagina. Vraag een super admin om toegang.",

  // --- Modules and navigation ---------------------------------------------
  "admin.module.integrations": "Koppelingen",
  "admin.module.secrets": "Credentials",
  "admin.module.security": "Beveiliging",
  "admin.nav.settings": "Instellingen",

  "admin.set.title": "Instellingen & koppelingen",
  "admin.set.subtitle": "Beheer je winkel zonder ooit een .env-bestand te openen.",
  "admin.set.nav.overview": "Overzicht",
  "admin.set.nav.general": "Algemeen",
  "admin.set.nav.shop": "Winkel",
  "admin.set.nav.payments": "Betalingen",
  "admin.set.nav.shipping": "Verzending",
  "admin.set.nav.email": "E-mail",
  "admin.set.nav.translations": "Vertalingen",
  "admin.set.nav.bol": "bol.com",
  "admin.set.nav.supabase": "Supabase",
  "admin.set.nav.security": "Beveiliging",
  "admin.set.nav.seo": "Vindbaarheid",
  "admin.set.nav.integrations": "Koppelingen",
  "admin.set.nav.system": "Systeem",

  // --- Form chrome ---------------------------------------------------------
  "admin.set.save": "Opslaan",
  "admin.set.saving": "Bezig met opslaan…",
  "admin.set.saved": "Instellingen opgeslagen.",
  "admin.set.discard": "Wijzigingen ongedaan maken",
  "admin.set.unsaved": "{count} niet-opgeslagen wijziging(en)",
  "admin.set.noChanges": "Niets gewijzigd",
  "admin.set.saveFailed": "Opslaan mislukt. Controleer de gemarkeerde velden.",
  "admin.set.readOnly": "Je mag deze instellingen bekijken, maar niet wijzigen.",
  "admin.set.src.database": "Ingesteld in het beheer",
  "admin.set.src.environment": "Komt uit de serveromgeving",
  "admin.set.src.default": "Standaardwaarde",
  "admin.set.srcExplainer":
    "Een waarde uit de serveromgeving blijft gelden tot je hem hier overschrijft.",
  "admin.set.sensitive": "Gevoelige instelling",
  "admin.set.help": "Hoe werkt dit?",
  "admin.set.hideHelp": "Uitleg verbergen",
  "admin.set.optional": "Optioneel",
  "admin.set.yes": "Aan",
  "admin.set.no": "Uit",

  // --- Field labels --------------------------------------------------------
  "admin.set.f.general.site_url": "Adres van de winkel",
  "admin.set.f.general.store_name": "Naam van de winkel",
  "admin.set.f.general.default_language": "Standaardtaal",
  "admin.set.f.general.timezone": "Tijdzone",
  "admin.set.f.company.legal_entity": "Rechtsvorm",
  "admin.set.f.company.legal_name": "Statutaire naam",
  "admin.set.f.company.kvk": "KvK-nummer",
  "admin.set.f.company.vat": "Btw-nummer",
  "admin.set.f.company.street": "Straat en huisnummer",
  "admin.set.f.company.postal_code": "Postcode",
  "admin.set.f.company.city": "Plaats",
  "admin.set.f.company.country": "Land",
  "admin.set.f.company.support_email": "E-mailadres klantenservice",
  "admin.set.f.company.support_phone": "Telefoonnummer klantenservice",
  "admin.set.f.commerce.return_days": "Retourtermijn in dagen",
  "admin.set.f.commerce.warranty_months": "Garantie in maanden",
  "admin.set.f.commerce.low_stock_threshold": "Grens voor lage voorraad",
  "admin.set.f.commerce.guest_checkout": "Bestellen zonder account",
  "admin.set.f.commerce.reviews_enabled": "Beoordelingen",
  "admin.set.f.commerce.wishlist_enabled": "Verlanglijst",
  "admin.set.f.commerce.newsletter_enabled": "Nieuwsbrief",
  "admin.set.f.commerce.returns_enabled": "Retouren aanvragen",
  "admin.set.f.payments.mode": "Status van de kassa",
  "admin.set.f.payments.webhook_url": "Webhook-adres",
  "admin.set.f.payments.live_approved_at": "Live goedgekeurd op",
  "admin.set.f.payments.live_approved_by": "Live goedgekeurd door",
  "admin.set.f.shipping.free_threshold": "Gratis verzending vanaf",
  "admin.set.f.shipping.default_rate": "Standaard verzendkosten",
  "admin.set.f.shipping.dispatch_note": "Levertijd-tekst",
  "admin.set.f.email.provider": "E-mailverzender",
  "admin.set.f.email.from": "Afzenderadres",
  "admin.set.f.email.reply_to": "Antwoordadres",
  "admin.set.f.translations.endpoint": "DeepL-abonnement",
  "admin.set.f.translations.auto_on_create": "Nieuwe producten vertalen",
  "admin.set.f.translations.auto_on_update": "Wijzigingen opnieuw vertalen",
  "admin.set.f.translations.keep_manual": "Handmatige vertalingen behouden",
  "admin.set.f.seo.title_suffix": "Toevoeging aan paginatitels",
  "admin.set.f.seo.default_description": "Standaard omschrijving",
  "admin.set.f.seo.og_image": "Deelafbeelding",
  "admin.set.f.seo.indexing_enabled": "Vindbaar in zoekmachines",
  "admin.set.f.integrations.ga_measurement_id": "Google Analytics meet-ID",
  "admin.set.f.integrations.meta_pixel_id": "Meta Pixel-ID",
  "admin.set.f.integrations.bol_auto_sync": "Automatisch synchroniseren met bol.com",
  "admin.set.f.system.setup_completed_steps": "Afgeronde installatiestappen",
  "admin.set.f.system.setup_dismissed": "Installatie-assistent verborgen",

  // --- Field help ----------------------------------------------------------
  "admin.set.h.general.site_url":
    "Het volledige https-adres waar de winkel draait. Wordt gebruikt in e-mails, in de sitemap en door Mollie om klanten terug te sturen.",
  "admin.set.h.general.store_name":
    "Zoals klanten de winkel zien: in e-mails, op facturen en in de paginatitel.",
  "admin.set.h.general.default_language":
    "De taal voor bezoekers van wie we de voorkeur nog niet kennen.",
  "admin.set.h.general.timezone":
    "Bepaalt hoe tijdstippen van bestellingen en rapporten worden getoond.",
  "admin.set.h.company.legal_entity": "De rechtsvorm zoals die bij de Kamer van Koophandel staat.",
  "admin.set.h.company.legal_name":
    "De naam waaronder de onderneming is ingeschreven. Verschijnt op facturen en op de algemene voorwaarden.",
  "admin.set.h.company.kvk": "Acht cijfers. Verplicht op je facturen en op de website.",
  "admin.set.h.company.vat": "Bijvoorbeeld NL123456789B01. Verplicht bij verkoop binnen de EU.",
  "admin.set.h.company.street": "Het vestigingsadres, zoals het op facturen moet staan.",
  "admin.set.h.company.postal_code": "Bijvoorbeeld 1234 AB.",
  "admin.set.h.company.city": "De plaats van vestiging.",
  "admin.set.h.company.country": "Het land van vestiging.",
  "admin.set.h.company.support_email":
    "Hier komen vragen van klanten binnen. Wordt getoond op de contactpagina en gebruikt als antwoordadres wanneer je er geen apart adres voor instelt.",
  "admin.set.h.company.support_phone":
    "Optioneel. Laat leeg als je liever alleen per e-mail bereikbaar bent.",
  "admin.set.h.commerce.return_days":
    "Binnen de EU is veertien dagen het wettelijk minimum voor online aankopen. Een langere termijn mag, een kortere niet.",
  "admin.set.h.commerce.warranty_months":
    "De garantie die je zelf op producten geeft, bovenop het wettelijke conformiteitsrecht.",
  "admin.set.h.commerce.low_stock_threshold":
    "Zodra de voorraad hieronder komt, verschijnt het product op de lijst met lage voorraad.",
  "admin.set.h.commerce.guest_checkout":
    "Uit betekent dat klanten eerst een account moeten maken. Dat kost bestellingen, dus zet het alleen uit als je er een reden voor hebt.",
  "admin.set.h.commerce.reviews_enabled": "Toont beoordelingen op productpagina's.",
  "admin.set.h.commerce.wishlist_enabled": "Laat klanten producten bewaren voor later.",
  "admin.set.h.commerce.newsletter_enabled":
    "Toont het aanmeldformulier voor de nieuwsbrief in de voettekst.",
  "admin.set.h.commerce.returns_enabled":
    "Laat klanten zelf een retour aanmelden vanuit hun account. Uit betekent niet dat het retourrecht vervalt — ze moeten dan mailen.",
  "admin.set.h.payments.mode":
    "Uitgeschakeld: klanten kunnen niet afrekenen. Test: bestellingen verlopen volledig, maar er wordt geen geld geïnd. Live kun je alleen aanzetten via de goedkeuringsstap.",
  "admin.set.h.payments.webhook_url":
    "Het adres waar Mollie de betaalstatus naartoe stuurt. Zonder dit blijven betaalde bestellingen op 'in afwachting' staan.",
  "admin.set.h.payments.live_approved_at": "Wordt automatisch ingevuld bij de goedkeuring.",
  "admin.set.h.payments.live_approved_by": "Wordt automatisch ingevuld bij de goedkeuring.",
  "admin.set.h.shipping.free_threshold":
    "Het orderbedrag waarboven de klant geen verzendkosten betaalt. Nul betekent altijd gratis.",
  "admin.set.h.shipping.default_rate":
    "Wat verzending kost als een verzendmethode zelf geen tarief heeft.",
  "admin.set.h.shipping.dispatch_note":
    "Korte zin op de productpagina, bijvoorbeeld over voor hoe laat je dezelfde dag verstuurt.",
  "admin.set.h.email.provider":
    "Zet op 'geen' om alle uitgaande e-mail te stoppen — handig op een testomgeving, maar klanten krijgen dan geen bestelbevestiging.",
  "admin.set.h.email.from":
    "Het adres waarvandaan bestelbevestigingen komen. Het domein moet geverifieerd zijn bij Resend, anders weigert de bezorging. Mag de vorm 'Besjaar <orders@domein.nl>' hebben.",
  "admin.set.h.email.reply_to":
    "Waar antwoorden van klanten heen gaan. Leeg laten betekent: naar het adres van de klantenservice.",
  "admin.set.h.translations.endpoint":
    "Gratis of pro. Een sleutel die eindigt op :fx hoort bij het gratis abonnement; die combinatie wordt automatisch herkend.",
  "admin.set.h.translations.auto_on_create":
    "Vertaalt titel en omschrijving zodra je een product opslaat.",
  "admin.set.h.translations.auto_on_update":
    "Vertaalt opnieuw wanneer je de Nederlandse tekst aanpast.",
  "admin.set.h.translations.keep_manual":
    "Aan betekent dat een vertaling die je zelf hebt bijgewerkt niet wordt overschreven door DeepL.",
  "admin.set.h.seo.title_suffix":
    "Komt achter elke paginatitel, bijvoorbeeld ' — Besjaar'. Houd het kort: zoekmachines tonen ongeveer zestig tekens.",
  "admin.set.h.seo.default_description":
    "De omschrijving in zoekresultaten voor pagina's zonder eigen tekst.",
  "admin.set.h.seo.og_image":
    "De afbeelding die verschijnt wanneer iemand een link naar de winkel deelt.",
  "admin.set.h.seo.indexing_enabled":
    "Uit houdt de hele winkel uit Google. Alleen bedoeld voor een omgeving die nog niet af is — vergeet niet het weer aan te zetten.",
  "admin.set.h.integrations.ga_measurement_id":
    "Begint met G-. Laat leeg als je geen Google Analytics gebruikt.",
  "admin.set.h.integrations.meta_pixel_id":
    "Alleen cijfers. Laat leeg als je niet adverteert op Facebook of Instagram.",
  "admin.set.h.integrations.bol_auto_sync":
    "Haalt automatisch bestellingen op en werkt de voorraad bij op bol.com.",
  "admin.set.h.system.setup_completed_steps": "Wordt bijgehouden door de installatie-assistent.",
  "admin.set.h.system.setup_dismissed": "Verbergt de assistent op het overzicht.",

  // --- Option labels -------------------------------------------------------
  "admin.set.opt.mode.disabled": "Uitgeschakeld",
  "admin.set.opt.mode.test": "Testmodus",
  "admin.set.opt.mode.live": "Live",
  "admin.set.opt.provider.none": "Geen e-mail versturen",
  "admin.set.opt.provider.resend": "Resend",
  "admin.set.opt.plan.free": "Gratis abonnement",
  "admin.set.opt.plan.pro": "Pro-abonnement",
  "admin.set.opt.lang.nl": "Nederlands",
  "admin.set.opt.lang.en": "Engels",
  "admin.set.opt.lang.de": "Duits",
  "admin.set.opt.lang.fr": "Frans",

  // --- Secret management ---------------------------------------------------
  "admin.secret.title": "Credentials",
  "admin.secret.configured": "Ingesteld",
  "admin.secret.notConfigured": "Nog niet ingesteld",
  "admin.secret.inVault": "Beveiligd opgeslagen",
  "admin.secret.inEnvironment": "Uit de serveromgeving",
  "admin.secret.replace": "Vervangen",
  "admin.secret.add": "Instellen",
  "admin.secret.remove": "Verwijderen",
  "admin.secret.cancel": "Annuleren",
  "admin.secret.placeholder": "Plak hier de nieuwe waarde",
  "admin.secret.stored": "Credential opgeslagen. De koppeling gebruikt hem meteen.",
  "admin.secret.removed": "Credential verwijderd.",
  "admin.secret.stillInEnvironment":
    "Let op: er staat nog dezelfde variabele in de serveromgeving. Die blijft gelden tot je hem daar ook weghaalt.",
  "admin.secret.neverShown":
    "Een opgeslagen credential wordt nooit meer getoond, ook niet aan jou. Je kunt hem alleen vervangen.",
  "admin.secret.updatedAt": "Laatst vervangen op {date}",
  "admin.secret.noStore": "Deze omgeving kan geen credentials opslaan",
  "admin.secret.noStoreHelp":
    "Er is geen beveiligde opslag beschikbaar. Zet de waarde in de omgevingsvariabelen van je hosting en start de applicatie opnieuw. We doen niet alsof het gelukt is: dat zou erger zijn dan het eerlijk melden.",
  "admin.secret.envVariable": "Omgevingsvariabele",
  "admin.secret.copy": "Naam kopiëren",
  "admin.secret.copied": "Gekopieerd",
  "admin.secret.restartNeeded":
    "Een waarde uit de serveromgeving werkt pas na een herstart van de applicatie.",
  "admin.secret.confirmRemove": "Weet je zeker dat je deze credential wilt verwijderen?",
  "admin.secret.name.MOLLIE_API_KEY": "Mollie API-sleutel",
  "admin.secret.name.RESEND_API_KEY": "Resend API-sleutel",
  "admin.secret.name.DEEPL_API_KEY": "DeepL API-sleutel",
  "admin.secret.name.BOL_CLIENT_ID": "bol.com client ID",
  "admin.secret.name.BOL_CLIENT_SECRET": "bol.com client secret",
  "admin.secret.name.SYNC_TRIGGER_SECRET": "Synchronisatie-sleutel",

  // --- Connection cards ----------------------------------------------------
  "admin.conn.title": "Koppelingen",
  "admin.conn.subtitle": "Wat is aangesloten, wat werkt echt, en wat ontbreekt nog.",
  "admin.conn.test": "Verbinding testen",
  "admin.conn.testing": "Bezig met testen…",
  "admin.conn.tested": "Getest",
  "admin.conn.never": "Nog nooit getest",
  "admin.conn.configure": "Instellen",
  "admin.conn.state.not_configured": "Niet ingesteld",
  "admin.conn.state.configured": "Ingesteld",
  "admin.conn.state.connected": "Verbonden",
  "admin.conn.state.failed": "Werkt niet",
  "admin.conn.state.disabled": "Uitgeschakeld",
  "admin.conn.stateHelp.not_configured": "Er zijn nog geen gegevens ingevuld.",
  "admin.conn.stateHelp.configured":
    "De gegevens staan er, maar er is nog geen geslaagde verbinding geweest. Druk op testen om het zeker te weten.",
  "admin.conn.stateHelp.connected": "Een echte aanroep naar deze dienst is gelukt.",
  "admin.conn.stateHelp.failed": "De dienst antwoordde, maar wees de aanvraag af.",
  "admin.conn.stateHelp.disabled": "Bewust uitgezet.",
  "admin.conn.name.supabase": "Supabase",
  "admin.conn.name.mollie": "Mollie",
  "admin.conn.name.resend": "Resend",
  "admin.conn.name.deepl": "DeepL",
  "admin.conn.name.bol": "bol.com",
  "admin.conn.purpose.supabase": "Database, accounts en bestandsopslag",
  "admin.conn.purpose.mollie": "Betalingen van klanten",
  "admin.conn.purpose.resend": "Bestelbevestigingen en andere e-mail",
  "admin.conn.purpose.deepl": "Automatische vertalingen",
  "admin.conn.purpose.bol": "Verkoop via bol.com",
  "admin.conn.duration": "{ms} ms",

  // --- Connection messages -------------------------------------------------
  "admin.conn.err.auth": "Authenticatie mislukt. Controleer de API-sleutel.",
  "admin.conn.err.denied": "Toegang geweigerd. De sleutel bestaat, maar mag dit niet doen.",
  "admin.conn.err.notFound": "De dienst gaf 'niet gevonden' terug. Controleer de instellingen.",
  "admin.conn.err.limited": "Limiet bereikt bij de dienst. Probeer het later opnieuw.",
  "admin.conn.err.timeout":
    "Geen antwoord binnen de tijdslimiet. De dienst is traag of onbereikbaar.",
  "admin.conn.err.unreachable": "De dienst is niet bereikbaar vanaf deze server.",
  "admin.conn.err.unknown": "De verbinding kon niet worden getest. Bekijk de serverlogboeken.",

  "admin.conn.label.apiKey": "API-sleutel",
  "admin.conn.label.autoSync": "Automatisch synchroniseren",
  "admin.conn.label.changedText": "Gewijzigde teksten",
  "admin.conn.label.clientId": "Client ID",
  "admin.conn.label.clientSecret": "Client secret",
  "admin.conn.label.database": "Database",
  "admin.conn.label.from": "Van",
  "admin.conn.label.languages": "Talen",
  "admin.conn.label.manualTranslations": "Handmatige vertalingen",
  "admin.conn.label.mode": "Modus",
  "admin.conn.label.newProducts": "Nieuwe producten",
  "admin.conn.label.orders": "Bestellingen",
  "admin.conn.label.plan": "Abonnement",
  "admin.conn.label.project": "Project",
  "admin.conn.label.provider": "Aanbieder",
  "admin.conn.label.replyTo": "Antwoordadres",
  "admin.conn.label.secureStorage": "Beveiligde opslag",
  "admin.conn.label.sender": "Afzender",
  "admin.conn.label.sendingDomain": "Verzenddomein",
  "admin.conn.label.serviceRole": "Service role",
  "admin.conn.label.shipments": "Verzendingen",
  "admin.conn.label.stock": "Voorraad",
  "admin.conn.label.to": "Naar",
  "admin.conn.label.tokenValid": "Token geldig",
  "admin.conn.label.usage": "Verbruik",
  "admin.conn.label.warning": "Let op",
  "admin.conn.label.webhook": "Webhook",

  "admin.conn.value.active": "Actief",
  "admin.conn.value.addressSet": "Adres ingesteld",
  "admin.conn.value.connected": "Verbonden",
  "admin.conn.value.disabled": "Uitgeschakeld",
  "admin.conn.value.noAddress": "Nog geen adres",
  "admin.conn.value.notSet": "Niet ingesteld",
  "admin.conn.value.notSetYet": "Nog niet ingesteld",
  "admin.conn.value.off": "Uit",
  "admin.conn.value.on": "Aan",
  "admin.conn.value.set": "Ingesteld",

  "admin.conn.mode.live": "Live",
  "admin.conn.mode.off": "Uitgeschakeld",
  "admin.conn.mode.test": "Test",
  "admin.conn.store.vault": "Beveiligde opslag actief",
  "admin.conn.store.environment": "Serveromgeving",

  "admin.conn.mollie.noKey": "Er is nog geen Mollie API-sleutel ingesteld.",
  "admin.conn.mollie.oddPrefix": "De sleutel begint niet met test_ of live_.",
  "admin.conn.mollie.testKeyLiveMode": "Live modus met een testsleutel: klanten betalen niet echt.",
  "admin.conn.mollie.liveKeyTestMode": "Testmodus met een live sleutel: er wordt echt geld geïnd.",
  "admin.conn.mollie.setLive": "Ingesteld (live sleutel)",
  "admin.conn.mollie.setTest": "Ingesteld (testsleutel)",
  "admin.conn.mollie.setUnknown": "Ingesteld (onbekend type)",
  "admin.conn.mollie.okMethods": "Verbonden met Mollie. {count} betaalmethoden actief.",
  "admin.conn.mollie.okNoMethods":
    "Verbonden met Mollie, maar er zijn nog geen betaalmethoden geactiveerd in je Mollie-account.",

  "admin.conn.resend.noKey": "Er is nog geen Resend API-sleutel ingesteld.",
  "admin.conn.resend.noSender": "Stel eerst een afzenderadres in.",
  "admin.conn.resend.replyFallback": "Valt terug op de klantenservice",
  "admin.conn.resend.domainUnverified": "{domain} — verificatie te controleren via de test",
  "admin.conn.resend.verified": "Geverifieerd",
  "admin.conn.resend.domainMissing":
    "Verbonden met Resend, maar {domain} staat niet in dit account. E-mail vanaf dat adres wordt geweigerd.",
  "admin.conn.resend.domainNotVerified":
    "Verbonden met Resend. {domain} is nog niet geverifieerd, dus verzenden lukt nog niet.",
  "admin.conn.resend.okVerified": "Verbonden met Resend. {domain} is geverifieerd.",
  "admin.conn.resend.okNoSender": "Verbonden met Resend. Stel nog een afzenderadres in.",
  "admin.conn.resend.sent":
    "Testbericht verstuurd naar {address}. Controleer de inbox — en de spammap.",

  "admin.conn.deepl.noKey": "Er is nog geen DeepL API-sleutel ingesteld.",
  "admin.conn.deepl.free": "Gratis",
  "admin.conn.deepl.pro": "Pro",
  "admin.conn.deepl.auto": "Automatisch vertalen",
  "admin.conn.deepl.autoUpdate": "Automatisch bijwerken",
  "admin.conn.deepl.manual": "Handmatig",
  "admin.conn.deepl.kept": "Blijven behouden",
  "admin.conn.deepl.overwritten": "Worden overschreven",
  "admin.conn.deepl.planMismatch":
    "DeepL weigerde de sleutel. Controleer of het abonnement overeenkomt met het type sleutel.",
  "admin.conn.deepl.noTranslation": "DeepL gaf geen vertaling terug.",
  "admin.conn.deepl.usage": "{used} tekens gebruikt.",
  "admin.conn.deepl.usageOf": "{used} van {limit} tekens gebruikt ({percent}%).",

  "admin.conn.bol.neverRun": "Nog niet uitgevoerd",
  "admin.conn.bol.succeeded": "Geslaagd — {when}",
  "admin.conn.bol.partial": "Deels geslaagd — {when}",
  "admin.conn.bol.running": "Bezig",
  "admin.conn.bol.queued": "In wachtrij",
  "admin.conn.bol.failed": "Mislukt — {when}",
  "admin.conn.bol.needBoth": "Vul eerst zowel de client ID als het client secret in.",
  "admin.conn.bol.refused": "bol.com weigerde de combinatie van client ID en secret.",
  "admin.conn.bol.noToken": "bol.com gaf geen token terug.",
  "admin.conn.bol.ok": "Verbonden met bol.com. De inloggegevens zijn geldig.",
  "admin.conn.bol.minutes": "{minutes} minuten",

  "admin.conn.sb.databaseOk": "De database antwoordt.",
  "admin.conn.sb.authOk": "Authenticatie werkt.",
  "admin.conn.sb.storageOk": "Alle opslagbuckets bestaan en staan goed ingesteld.",
  "admin.conn.sb.storageProblems": "{count} bucket(s) hebben aandacht nodig.",
  "admin.conn.sb.rlsOk": "Geen interne weergaven bereikbaar vanuit de browser.",
  "admin.conn.sb.rlsExposed": "{count} interne weergave(n) bereikbaar vanuit de browser.",
  "admin.conn.sb.noSuperAdmin":
    "Er is nog geen super admin. Gebruik de eerste-beheerder-stap of de SQL in DEPLOYMENT.md.",
  "admin.conn.sb.superAdmins": "{count} super admin(s) ingesteld.",
  "admin.conn.sb.noProject": "Geen project ingesteld",
  "admin.conn.sb.serverOnly": "Alleen op de server",

  "admin.conn.ready.liveKey": "Live API-sleutel",
  "admin.conn.ready.stillTestKey": "Nog een testsleutel",
  "admin.conn.ready.siteUrl": "Winkeladres",
  "admin.conn.ready.noHttpsSite": "Geen https-adres ingesteld",
  "admin.conn.ready.noHttpsHook": "Nog geen https-adres",
  "admin.conn.ready.credentialStorage": "Opslag credentials",
  "admin.conn.ready.approval": "Goedkeuring",
  "admin.conn.ready.approvedOn": "Goedgekeurd op {date}",
  "admin.conn.ready.notApproved": "Nog niet goedgekeurd",

  // --- Page headings -------------------------------------------------------
  "admin.page.general.title": "Winkelgegevens",
  "admin.page.general.body": "Hoe de winkel heet, waar hij draait en in welke taal hij begint.",
  "admin.page.company.title": "Bedrijfsgegevens",
  "admin.page.company.body":
    "De gegevens die een Nederlandse webshop wettelijk moet tonen. Ze verschijnen op facturen, in de algemene voorwaarden en op de contactpagina.",
  "admin.page.shop.title": "Winkelinstellingen",
  "admin.page.shop.body": "Wat klanten kunnen doen en onder welke voorwaarden.",
  "admin.page.payments.title": "Betaalinstellingen",
  "admin.page.payments.body": "Het webhook-adres waarmee Mollie de betaalstatus terugmeldt.",
  "admin.page.shipping.title": "Verzendkosten",
  "admin.page.shipping.body":
    "De tarieven. De verzendmethoden zelf blijven bij de catalogus, want daar hoort de keuze van vervoerder en land thuis.",
  "admin.page.email.title": "E-mailinstellingen",
  "admin.page.email.body": "Van welk adres berichten komen en waar antwoorden heen gaan.",
  "admin.page.translations.title": "Vertaalinstellingen",
  "admin.page.translations.body":
    "Wanneer er automatisch vertaald wordt, en wat daarbij blijft staan.",
  "admin.page.seo.title": "Vindbaarheid",
  "admin.page.seo.body": "Wat zoekmachines en sociale media van de winkel te zien krijgen.",
  "admin.page.bol.title": "bol.com-instellingen",
  "admin.page.bol.body": "Hoe vaak er met bol.com wordt uitgewisseld.",
  "admin.page.analytics.title": "Statistieken",
  "admin.page.analytics.body":
    "Meet-ID's voor bezoekersstatistieken. Laat leeg wat je niet gebruikt — een lege waarde laadt geen script.",
  "admin.page.supabase.title": "Controles",
  "admin.page.supabase.body":
    "Elke knop voert een echte aanroep uit en toont wat er terugkwam. Er wordt niets gecontroleerd bij het openen van deze pagina.",

  // --- Payments ------------------------------------------------------------
  "admin.pay.testBanner": "De kassa staat in testmodus",
  "admin.pay.testBannerBody":
    "Bestellingen doorlopen alles wat een echte bestelling doorloopt, maar er wordt geen geld geïnd. Precies wat je wilt voordat je opengaat.",
  "admin.pay.offBanner": "De kassa staat uit",
  "admin.pay.offBannerBody":
    "Klanten kunnen producten bekijken, maar niet afrekenen. Zet de kassa op test zodra je de bestelroute wilt uitproberen.",
  "admin.pay.live.title": "Live gaan",
  "admin.pay.live.body":
    "Wat er moet kloppen voordat er echt geld binnenkomt. Deze lijst is een toelichting; de controle zelf gebeurt opnieuw op de server op het moment dat je bevestigt.",
  "admin.pay.needsSuperAdmin": "Alleen een super admin kan live betalingen inschakelen.",
  "admin.pay.stillBlocked": "Er staat nog iets in de weg. Los dat eerst op.",
  "admin.pay.typeName": "Typ de naam van de winkel om te bevestigen",
  "admin.pay.goLive": "Live betalingen inschakelen",
  "admin.pay.backToTest": "Terug naar testmodus",
  "admin.pay.turnOff": "Kassa uitzetten",
  "admin.pay.nowLive": "Live betalingen staan aan. Er wordt vanaf nu echt geld geïnd.",
  "admin.pay.steppedDown": "De kassa is teruggezet.",
  "admin.pay.blocked": "De goedkeuring is geweigerd.",

  // --- E-mail test ---------------------------------------------------------
  "admin.email.test.title": "Testbericht versturen",
  "admin.email.test.body":
    "Stuurt een echt bericht. Een geldige sleutel bewijst nog niet dat een e-mail aankomt — dit wel.",
  "admin.email.test.label": "Stuur naar",
  "admin.email.test.send": "Versturen",
  "admin.email.test.limit": "Maximaal vijf testberichten per uur.",

  // --- Translation test ----------------------------------------------------
  "admin.trans.test.title": "Vertaling uitproberen",
  "admin.trans.test.body":
    "Vertaal een zin en lees het resultaat. Een sleutel die werkt maar in de verkeerde taal vertaalt, levert een winkel vol verkeerde teksten op.",
  "admin.trans.test.label": "Nederlandse zin",
  "admin.trans.test.target": "Naar",
  "admin.trans.test.run": "Vertalen",

  // --- Supabase checks -----------------------------------------------------
  "admin.sb.run": "Uitvoeren",
  "admin.sb.database": "Database",
  "admin.sb.databaseBody": "Voert één echte query uit om te zien of de database antwoordt.",
  "admin.sb.auth": "Accounts",
  "admin.sb.authBody": "Controleert of het aanmaken en beheren van accounts werkt.",
  "admin.sb.storage": "Bestandsopslag",
  "admin.sb.storageBody": "Kijkt of de opslagmappen bestaan en niet per ongeluk openbaar staan.",
  "admin.sb.rls": "Rijbeveiliging",
  "admin.sb.rlsBody":
    "Zoekt naar tabellen en weergaven die vanuit de browser bereikbaar zijn terwijl dat niet de bedoeling is.",
  "admin.sb.admins": "Beheerders",
  "admin.sb.adminsBody": "Controleert of er ten minste één super admin bestaat.",
  "admin.sb.keys.title": "Sleutels",
  "admin.sb.keys.body": "Waar de Supabase-sleutels staan, en waarom ze daar staan.",
  "admin.sb.keys.detail":
    "De service role-sleutel opent de database volledig en blijft daarom in de omgeving van de server staan. Hij wordt hier niet getoond, niet gedeeltelijk getoond en niet naar de browser gestuurd. Het projectadres en de publieke sleutel zijn nodig om de applicatie te starten en horen om dezelfde reden bij de deploy-omgeving.",

  // --- Security ------------------------------------------------------------
  "admin.sec.posture.title": "Wat de winkel beschermt",
  "admin.sec.posture.body": "Alleen dingen die deze pagina echt kan waarnemen.",
  "admin.sec.mfa": "Tweestapsverificatie voor medewerkers",
  "admin.sec.mfaBody": "Verplicht. Zonder tweede factor weigert de server elke beheeractie.",
  "admin.sec.storage": "Opslag van credentials",
  "admin.sec.storageVault": "Beveiligde opslag is beschikbaar; vervangen kan vanuit het beheer.",
  "admin.sec.storageEnv":
    "Geen beveiligde opslag. Credentials staan in de omgeving van de server en worden daar beheerd.",
  "admin.sec.serverOnly": "Credentials blijven op de server",
  "admin.sec.serverOnlyBody":
    "Geen enkele API in deze applicatie geeft een credential terug. De statustypen hebben er geen veld voor.",
  "admin.sec.mode": "Kassastatus",
  "admin.sec.modeBody": "Staat op: {mode}.",
  "admin.sec.indexing": "Zichtbaar voor zoekmachines",
  "admin.sec.indexingOn": "De winkel mag geïndexeerd worden.",
  "admin.sec.indexingOff":
    "De winkel is afgeschermd van zoekmachines. Bedoeld voor een omgeving die nog niet af is.",
  "admin.sec.openStaff": "Medewerkers",
  "admin.sec.openAudit": "Naar het auditlogboek",
  "admin.sec.credentials.title": "Credentials",
  "admin.sec.credentials.body": "Waar ze staan. Nooit wat ze zijn.",
  "admin.sec.inVault": "In beveiligde opslag",
  "admin.sec.inEnv": "In de serveromgeving",
  "admin.sec.credentialsNote":
    "Wijzigen van een credential wordt vastgelegd in het auditlogboek, zonder de waarde: er staat dat hij vervangen is, niet waardoor.",
  "admin.sec.checks.title": "Controles uitvoeren",
  "admin.sec.checks.body":
    "Dezelfde controles als in de testsuite, maar dan nu en op deze omgeving.",
  "admin.sec.runRls": "Rijbeveiliging",
  "admin.sec.runStorage": "Bestandsopslag",
  "admin.sec.runAdmins": "Beheerders",

  // --- System --------------------------------------------------------------
  "admin.sys.health.title": "Systeemstatus",
  "admin.sys.health.body": "Waar de instellingen vandaan komen en hoe deze omgeving is opgezet.",
  "admin.sys.storeUrl": "Winkeladres",
  "admin.sys.secretBackend": "Opslag credentials",
  "admin.sys.fromDatabase": "Ingesteld in het beheer",
  "admin.sys.fromEnvironment": "Uit de serveromgeving",
  "admin.sys.export.title": "Instellingen exporteren",
  "admin.sys.export.body": "Om een configuratie mee te nemen naar een andere omgeving.",
  "admin.sys.export.run": "Exporteren",
  "admin.sys.export.detail":
    "Het bestand bevat alleen instellingen. Er zit geen credential in — de exportfunctie heeft er geen toegang toe.",
  "admin.sys.environment.title": "Wat in de serveromgeving blijft",
  "admin.sys.environment.body": "En waarom dat geen tekortkoming is.",
  "admin.sys.environment.detail":
    "Het projectadres en de sleutels van Supabase zijn nodig voordat de applicatie een database kan lezen, dus ze kunnen niet uit een database komen. Het vertrouwde proxy-adres en het e-mailadres van de eerste beheerder blijven er bewust ook staan: een instelling die de beheerder kan wijzigen, kan ook gewijzigd worden door iemand die het beheer bereikt, en die twee bepalen juist wie er vertrouwd wordt.",

  // --- bol.com -------------------------------------------------------------
  "admin.bol.openSync": "Naar synchronisatie",
  "admin.bol.help":
    "De client ID en het client secret komen uit het verkopersaccount van bol.com, bij de instellingen voor de API. Beide horen bij elkaar: een geldige ID met een verkeerd secret levert dezelfde foutmelding op als een verkeerde ID.",

  // --- Setup wizard --------------------------------------------------------
  "admin.wizard.title": "Installatie",
  "admin.wizard.body":
    "Elke stap kijkt zelf of hij af is. Er wordt niets afgevinkt wat niet echt klopt.",
  "admin.wizard.progress": "Voortgang",
  "admin.wizard.ready": "Klaar om open te gaan",
  "admin.wizard.blocking":
    "Nog {count} stap(pen) te gaan voordat de winkel echte bestellingen aankan.",
  "admin.wizard.allConnections": "Alle koppelingen",
  "admin.wizard.tick": "Afvinken",
  "admin.wizard.untick": "Vinkje weghalen",
  "admin.wizard.shop.title": "Winkelgegevens invullen",
  "admin.wizard.shop.body": "De naam van de winkel en het https-adres waar hij draait.",
  "admin.wizard.company.title": "Bedrijfsgegevens invullen",
  "admin.wizard.company.body": "KvK, btw-nummer en vestigingsadres. Wettelijk verplicht.",
  "admin.wizard.support.title": "Klantenservice instellen",
  "admin.wizard.support.body": "Een e-mailadres waar klanten terechtkunnen.",
  "admin.wizard.database.title": "Database verbinden",
  "admin.wizard.database.body": "Afgevinkt zodra een echte query is beantwoord.",
  "admin.wizard.admins.title": "Eerste beheerder aanmaken",
  "admin.wizard.admins.body": "Je bent ingelogd, dus dit is al gebeurd.",
  "admin.wizard.email.title": "E-mail instellen",
  "admin.wizard.email.body": "Een sleutel en een afzenderadres, of bewust geen e-mail versturen.",
  "admin.wizard.payments.title": "Betalingen voorbereiden",
  "admin.wizard.payments.body": "Een Mollie-sleutel en een webhook-adres dat Mollie kan bereiken.",
  "admin.wizard.shipping.title": "Verzendkosten controleren",
  "admin.wizard.shipping.body":
    "Nul is een geldig tarief en negen euro ook. Alleen jij weet welke bedoeld is, dus deze stap vink je zelf af.",
  "admin.wizard.returns.title": "Retourtermijn instellen",
  "admin.wizard.returns.body": "Ten minste veertien dagen, zoals de EU voorschrijft.",
  "admin.wizard.seo.title": "Vindbaarheid regelen",
  "admin.wizard.seo.body": "Een titeltoevoeging, een omschrijving, en indexering aan.",
  "admin.wizard.translations.title": "Vertalingen kiezen",
  "admin.wizard.translations.body":
    "Optioneel. Vink af als de winkel alleen in het Nederlands verkoopt.",
  "admin.wizard.live.title": "Live gaan",
  "admin.wizard.live.body": "De laatste stap, met een eigen goedkeuring.",

  "admin.quick.openSettings": "Instellingen openen",
} as const;

type SettingsKey = keyof typeof settingsNl;

export const settingsEn: Record<SettingsKey, string> = {
  "admin.common.noAccessTo": "No access to {module}",
  "admin.common.noAccessBody":
    "Your role does not grant rights for this page. Ask a super admin for access.",

  "admin.module.integrations": "Connections",
  "admin.module.secrets": "Credentials",
  "admin.module.security": "Security",
  "admin.nav.settings": "Settings",

  "admin.set.title": "Settings & connections",
  "admin.set.subtitle": "Run your shop without ever opening a .env file.",
  "admin.set.nav.overview": "Overview",
  "admin.set.nav.general": "General",
  "admin.set.nav.shop": "Shop",
  "admin.set.nav.payments": "Payments",
  "admin.set.nav.shipping": "Shipping",
  "admin.set.nav.email": "E-mail",
  "admin.set.nav.translations": "Translations",
  "admin.set.nav.bol": "bol.com",
  "admin.set.nav.supabase": "Supabase",
  "admin.set.nav.security": "Security",
  "admin.set.nav.seo": "Discoverability",
  "admin.set.nav.integrations": "Connections",
  "admin.set.nav.system": "System",

  "admin.set.save": "Save",
  "admin.set.saving": "Saving…",
  "admin.set.saved": "Settings saved.",
  "admin.set.discard": "Undo changes",
  "admin.set.unsaved": "{count} unsaved change(s)",
  "admin.set.noChanges": "Nothing changed",
  "admin.set.saveFailed": "Could not save. Check the highlighted fields.",
  "admin.set.readOnly": "You can view these settings, but not change them.",
  "admin.set.src.database": "Set in the admin",
  "admin.set.src.environment": "Comes from the server environment",
  "admin.set.src.default": "Default value",
  "admin.set.srcExplainer":
    "A value from the server environment keeps applying until you override it here.",
  "admin.set.sensitive": "Sensitive setting",
  "admin.set.help": "How does this work?",
  "admin.set.hideHelp": "Hide explanation",
  "admin.set.optional": "Optional",
  "admin.set.yes": "On",
  "admin.set.no": "Off",

  "admin.set.f.general.site_url": "Shop address",
  "admin.set.f.general.store_name": "Shop name",
  "admin.set.f.general.default_language": "Default language",
  "admin.set.f.general.timezone": "Time zone",
  "admin.set.f.company.legal_entity": "Legal form",
  "admin.set.f.company.legal_name": "Registered name",
  "admin.set.f.company.kvk": "Chamber of Commerce number",
  "admin.set.f.company.vat": "VAT number",
  "admin.set.f.company.street": "Street and number",
  "admin.set.f.company.postal_code": "Postcode",
  "admin.set.f.company.city": "Town",
  "admin.set.f.company.country": "Country",
  "admin.set.f.company.support_email": "Customer service e-mail",
  "admin.set.f.company.support_phone": "Customer service phone",
  "admin.set.f.commerce.return_days": "Return window in days",
  "admin.set.f.commerce.warranty_months": "Warranty in months",
  "admin.set.f.commerce.low_stock_threshold": "Low stock threshold",
  "admin.set.f.commerce.guest_checkout": "Checkout without an account",
  "admin.set.f.commerce.reviews_enabled": "Reviews",
  "admin.set.f.commerce.wishlist_enabled": "Wishlist",
  "admin.set.f.commerce.newsletter_enabled": "Newsletter",
  "admin.set.f.commerce.returns_enabled": "Self-service returns",
  "admin.set.f.payments.mode": "Checkout status",
  "admin.set.f.payments.webhook_url": "Webhook address",
  "admin.set.f.payments.live_approved_at": "Live approved on",
  "admin.set.f.payments.live_approved_by": "Live approved by",
  "admin.set.f.shipping.free_threshold": "Free shipping from",
  "admin.set.f.shipping.default_rate": "Default shipping cost",
  "admin.set.f.shipping.dispatch_note": "Delivery time note",
  "admin.set.f.email.provider": "E-mail sender",
  "admin.set.f.email.from": "From address",
  "admin.set.f.email.reply_to": "Reply-to address",
  "admin.set.f.translations.endpoint": "DeepL plan",
  "admin.set.f.translations.auto_on_create": "Translate new products",
  "admin.set.f.translations.auto_on_update": "Re-translate on changes",
  "admin.set.f.translations.keep_manual": "Keep manual translations",
  "admin.set.f.seo.title_suffix": "Page title suffix",
  "admin.set.f.seo.default_description": "Default description",
  "admin.set.f.seo.og_image": "Sharing image",
  "admin.set.f.seo.indexing_enabled": "Findable in search engines",
  "admin.set.f.integrations.ga_measurement_id": "Google Analytics measurement ID",
  "admin.set.f.integrations.meta_pixel_id": "Meta Pixel ID",
  "admin.set.f.integrations.bol_auto_sync": "Sync with bol.com automatically",
  "admin.set.f.system.setup_completed_steps": "Completed setup steps",
  "admin.set.f.system.setup_dismissed": "Setup assistant hidden",

  "admin.set.h.general.site_url":
    "The full https address where the shop runs. Used in e-mails, in the sitemap, and by Mollie to send customers back.",
  "admin.set.h.general.store_name":
    "The way customers see the shop: in e-mails, on invoices and in the page title.",
  "admin.set.h.general.default_language":
    "The language for visitors whose preference we do not know yet.",
  "admin.set.h.general.timezone": "Decides how order and report timestamps are shown.",
  "admin.set.h.company.legal_entity": "The legal form as registered with the Chamber of Commerce.",
  "admin.set.h.company.legal_name":
    "The name the business is registered under. Appears on invoices and in the terms.",
  "admin.set.h.company.kvk": "Eight digits. Required on your invoices and on the website.",
  "admin.set.h.company.vat": "For example NL123456789B01. Required when selling inside the EU.",
  "admin.set.h.company.street": "The business address, as it has to appear on invoices.",
  "admin.set.h.company.postal_code": "For example 1234 AB.",
  "admin.set.h.company.city": "The town the business is registered in.",
  "admin.set.h.company.country": "The country the business is registered in.",
  "admin.set.h.company.support_email":
    "Where customer questions arrive. Shown on the contact page and used as the reply address when you do not set a separate one.",
  "admin.set.h.company.support_phone":
    "Optional. Leave empty if you would rather only be reachable by e-mail.",
  "admin.set.h.commerce.return_days":
    "Fourteen days is the EU legal minimum for online purchases. Longer is allowed, shorter is not.",
  "admin.set.h.commerce.warranty_months":
    "The warranty you give yourself, on top of the statutory conformity right.",
  "admin.set.h.commerce.low_stock_threshold":
    "Once stock drops below this, the product appears on the low stock list.",
  "admin.set.h.commerce.guest_checkout":
    "Off means customers have to create an account first. That costs orders, so only turn it off if you have a reason.",
  "admin.set.h.commerce.reviews_enabled": "Shows reviews on product pages.",
  "admin.set.h.commerce.wishlist_enabled": "Lets customers save products for later.",
  "admin.set.h.commerce.newsletter_enabled": "Shows the newsletter sign-up form in the footer.",
  "admin.set.h.commerce.returns_enabled":
    "Lets customers file a return from their account. Off does not remove the legal right to return — they will have to e-mail instead.",
  "admin.set.h.payments.mode":
    "Disabled: customers cannot check out. Test: orders run all the way through, but no money moves. Live can only be switched on through the approval step.",
  "admin.set.h.payments.webhook_url":
    "The address Mollie sends the payment status to. Without it, paid orders stay stuck on 'awaiting payment'.",
  "admin.set.h.payments.live_approved_at": "Filled in automatically during approval.",
  "admin.set.h.payments.live_approved_by": "Filled in automatically during approval.",
  "admin.set.h.shipping.free_threshold":
    "The order value above which the customer pays no shipping. Zero means always free.",
  "admin.set.h.shipping.default_rate":
    "What shipping costs when a shipping method has no rate of its own.",
  "admin.set.h.shipping.dispatch_note":
    "A short line on the product page, for instance about the cut-off time for same-day dispatch.",
  "admin.set.h.email.provider":
    "Set to 'none' to stop all outgoing e-mail — useful on a staging environment, but customers then get no order confirmation.",
  "admin.set.h.email.from":
    "The address order confirmations come from. Its domain has to be verified with Resend or delivery is refused. May take the form 'Besjaar <orders@domain.com>'.",
  "admin.set.h.email.reply_to":
    "Where customer replies go. Leaving it empty means: to the customer service address.",
  "admin.set.h.translations.endpoint":
    "Free or pro. A key ending in :fx belongs to the free plan; that combination is detected automatically.",
  "admin.set.h.translations.auto_on_create":
    "Translates title and description as soon as you save a product.",
  "admin.set.h.translations.auto_on_update":
    "Translates again whenever you edit the Dutch source text.",
  "admin.set.h.translations.keep_manual":
    "On means a translation you edited yourself is not overwritten by DeepL.",
  "admin.set.h.seo.title_suffix":
    "Appended to every page title, for example ' — Besjaar'. Keep it short: search engines show about sixty characters.",
  "admin.set.h.seo.default_description":
    "The description in search results for pages without their own text.",
  "admin.set.h.seo.og_image": "The image shown when somebody shares a link to the shop.",
  "admin.set.h.seo.indexing_enabled":
    "Off keeps the whole shop out of Google. Only meant for an environment that is not finished — remember to switch it back on.",
  "admin.set.h.integrations.ga_measurement_id":
    "Starts with G-. Leave empty if you do not use Google Analytics.",
  "admin.set.h.integrations.meta_pixel_id":
    "Digits only. Leave empty if you do not advertise on Facebook or Instagram.",
  "admin.set.h.integrations.bol_auto_sync":
    "Fetches orders and pushes stock updates to bol.com on a schedule.",
  "admin.set.h.system.setup_completed_steps": "Maintained by the setup assistant.",
  "admin.set.h.system.setup_dismissed": "Hides the assistant on the overview.",

  "admin.set.opt.mode.disabled": "Disabled",
  "admin.set.opt.mode.test": "Test mode",
  "admin.set.opt.mode.live": "Live",
  "admin.set.opt.provider.none": "Send no e-mail",
  "admin.set.opt.provider.resend": "Resend",
  "admin.set.opt.plan.free": "Free plan",
  "admin.set.opt.plan.pro": "Pro plan",
  "admin.set.opt.lang.nl": "Dutch",
  "admin.set.opt.lang.en": "English",
  "admin.set.opt.lang.de": "German",
  "admin.set.opt.lang.fr": "French",

  "admin.secret.title": "Credentials",
  "admin.secret.configured": "Set",
  "admin.secret.notConfigured": "Not set yet",
  "admin.secret.inVault": "Stored securely",
  "admin.secret.inEnvironment": "From the server environment",
  "admin.secret.replace": "Replace",
  "admin.secret.add": "Set up",
  "admin.secret.remove": "Remove",
  "admin.secret.cancel": "Cancel",
  "admin.secret.placeholder": "Paste the new value here",
  "admin.secret.stored": "Credential saved. The connection uses it straight away.",
  "admin.secret.removed": "Credential removed.",
  "admin.secret.stillInEnvironment":
    "Note: the same variable is still set in the server environment. It keeps applying until you remove it there too.",
  "admin.secret.neverShown":
    "A stored credential is never shown again, not even to you. You can only replace it.",
  "admin.secret.updatedAt": "Last replaced on {date}",
  "admin.secret.noStore": "This environment cannot store credentials",
  "admin.secret.noStoreHelp":
    "No secure storage is available. Put the value in your hosting provider's environment variables and restart the application. We do not pretend it worked: that would be worse than saying so.",
  "admin.secret.envVariable": "Environment variable",
  "admin.secret.copy": "Copy name",
  "admin.secret.copied": "Copied",
  "admin.secret.restartNeeded":
    "A value from the server environment only takes effect after the application restarts.",
  "admin.secret.confirmRemove": "Are you sure you want to remove this credential?",
  "admin.secret.name.MOLLIE_API_KEY": "Mollie API key",
  "admin.secret.name.RESEND_API_KEY": "Resend API key",
  "admin.secret.name.DEEPL_API_KEY": "DeepL API key",
  "admin.secret.name.BOL_CLIENT_ID": "bol.com client ID",
  "admin.secret.name.BOL_CLIENT_SECRET": "bol.com client secret",
  "admin.secret.name.SYNC_TRIGGER_SECRET": "Synchronisation key",

  "admin.conn.title": "Connections",
  "admin.conn.subtitle": "What is hooked up, what actually works, and what is still missing.",
  "admin.conn.test": "Test connection",
  "admin.conn.testing": "Testing…",
  "admin.conn.tested": "Tested",
  "admin.conn.never": "Never tested",
  "admin.conn.configure": "Set up",
  "admin.conn.state.not_configured": "Not set up",
  "admin.conn.state.configured": "Set up",
  "admin.conn.state.connected": "Connected",
  "admin.conn.state.failed": "Not working",
  "admin.conn.state.disabled": "Switched off",
  "admin.conn.stateHelp.not_configured": "Nothing has been filled in yet.",
  "admin.conn.stateHelp.configured":
    "The details are there, but no successful call has been made. Press test to find out for certain.",
  "admin.conn.stateHelp.connected": "A real call to this service succeeded.",
  "admin.conn.stateHelp.failed": "The service answered, and rejected the request.",
  "admin.conn.stateHelp.disabled": "Deliberately switched off.",
  "admin.conn.name.supabase": "Supabase",
  "admin.conn.name.mollie": "Mollie",
  "admin.conn.name.resend": "Resend",
  "admin.conn.name.deepl": "DeepL",
  "admin.conn.name.bol": "bol.com",
  "admin.conn.purpose.supabase": "Database, accounts and file storage",
  "admin.conn.purpose.mollie": "Customer payments",
  "admin.conn.purpose.resend": "Order confirmations and other e-mail",
  "admin.conn.purpose.deepl": "Automatic translations",
  "admin.conn.purpose.bol": "Selling through bol.com",
  "admin.conn.duration": "{ms} ms",

  "admin.conn.err.auth": "Authentication failed. Check your API credentials.",
  "admin.conn.err.denied": "Access denied. The key exists, but is not allowed to do this.",
  "admin.conn.err.notFound": "The service returned 'not found'. Check the settings.",
  "admin.conn.err.limited": "The service's rate limit was reached. Try again later.",
  "admin.conn.err.timeout": "No answer within the time limit. The service is slow or unreachable.",
  "admin.conn.err.unreachable": "The service cannot be reached from this server.",
  "admin.conn.err.unknown": "The connection could not be tested. Check the server logs.",

  "admin.conn.label.apiKey": "API key",
  "admin.conn.label.autoSync": "Automatic sync",
  "admin.conn.label.changedText": "Changed text",
  "admin.conn.label.clientId": "Client ID",
  "admin.conn.label.clientSecret": "Client secret",
  "admin.conn.label.database": "Database",
  "admin.conn.label.from": "From",
  "admin.conn.label.languages": "Languages",
  "admin.conn.label.manualTranslations": "Manual translations",
  "admin.conn.label.mode": "Mode",
  "admin.conn.label.newProducts": "New products",
  "admin.conn.label.orders": "Orders",
  "admin.conn.label.plan": "Plan",
  "admin.conn.label.project": "Project",
  "admin.conn.label.provider": "Provider",
  "admin.conn.label.replyTo": "Reply-to",
  "admin.conn.label.secureStorage": "Secure storage",
  "admin.conn.label.sender": "Sender",
  "admin.conn.label.sendingDomain": "Sending domain",
  "admin.conn.label.serviceRole": "Service role",
  "admin.conn.label.shipments": "Shipments",
  "admin.conn.label.stock": "Stock",
  "admin.conn.label.to": "To",
  "admin.conn.label.tokenValid": "Token valid for",
  "admin.conn.label.usage": "Usage",
  "admin.conn.label.warning": "Warning",
  "admin.conn.label.webhook": "Webhook",

  "admin.conn.value.active": "Enabled",
  "admin.conn.value.addressSet": "Address set",
  "admin.conn.value.connected": "Connected",
  "admin.conn.value.disabled": "Switched off",
  "admin.conn.value.noAddress": "No address yet",
  "admin.conn.value.notSet": "Not set",
  "admin.conn.value.notSetYet": "Not set yet",
  "admin.conn.value.off": "Off",
  "admin.conn.value.on": "On",
  "admin.conn.value.set": "Set",

  "admin.conn.mode.live": "Live",
  "admin.conn.mode.off": "Switched off",
  "admin.conn.mode.test": "Test",
  "admin.conn.store.vault": "Secure storage active",
  "admin.conn.store.environment": "Server environment",

  "admin.conn.mollie.noKey": "No Mollie API key has been set yet.",
  "admin.conn.mollie.oddPrefix": "The key does not start with test_ or live_.",
  "admin.conn.mollie.testKeyLiveMode":
    "Live mode with a test key: customers are not really charged.",
  "admin.conn.mollie.liveKeyTestMode": "Test mode with a live key: real money is being taken.",
  "admin.conn.mollie.setLive": "Set (live key)",
  "admin.conn.mollie.setTest": "Set (test key)",
  "admin.conn.mollie.setUnknown": "Set (unrecognised type)",
  "admin.conn.mollie.okMethods": "Connected to Mollie. {count} payment methods enabled.",
  "admin.conn.mollie.okNoMethods":
    "Connected to Mollie, but no payment methods have been enabled in your Mollie account yet.",

  "admin.conn.resend.noKey": "No Resend API key has been set yet.",
  "admin.conn.resend.noSender": "Set a sender address first.",
  "admin.conn.resend.replyFallback": "Falls back to customer service",
  "admin.conn.resend.domainUnverified": "{domain} — run the test to check verification",
  "admin.conn.resend.verified": "Verified",
  "admin.conn.resend.domainMissing":
    "Connected to Resend, but {domain} is not in this account. E-mail from that address will be refused.",
  "admin.conn.resend.domainNotVerified":
    "Connected to Resend. {domain} is not verified yet, so sending will not work.",
  "admin.conn.resend.okVerified": "Connected to Resend. {domain} is verified.",
  "admin.conn.resend.okNoSender": "Connected to Resend. Now set a sender address.",
  "admin.conn.resend.sent":
    "Test message sent to {address}. Check the inbox — and the spam folder.",

  "admin.conn.deepl.noKey": "No DeepL API key has been set yet.",
  "admin.conn.deepl.free": "Free",
  "admin.conn.deepl.pro": "Pro",
  "admin.conn.deepl.auto": "Translate automatically",
  "admin.conn.deepl.autoUpdate": "Update automatically",
  "admin.conn.deepl.manual": "By hand",
  "admin.conn.deepl.kept": "Are preserved",
  "admin.conn.deepl.overwritten": "Get overwritten",
  "admin.conn.deepl.planMismatch":
    "DeepL refused the key. Check that the plan matches the type of key.",
  "admin.conn.deepl.noTranslation": "DeepL returned no translation.",
  "admin.conn.deepl.usage": "{used} characters used.",
  "admin.conn.deepl.usageOf": "{used} of {limit} characters used ({percent}%).",

  "admin.conn.bol.neverRun": "Has not run yet",
  "admin.conn.bol.succeeded": "Succeeded — {when}",
  "admin.conn.bol.partial": "Partly succeeded — {when}",
  "admin.conn.bol.running": "Running",
  "admin.conn.bol.queued": "Queued",
  "admin.conn.bol.failed": "Failed — {when}",
  "admin.conn.bol.needBoth": "Fill in both the client ID and the client secret first.",
  "admin.conn.bol.refused": "bol.com refused this client ID and secret combination.",
  "admin.conn.bol.noToken": "bol.com returned no token.",
  "admin.conn.bol.ok": "Connected to bol.com. The credentials are valid.",
  "admin.conn.bol.minutes": "{minutes} minutes",

  "admin.conn.sb.databaseOk": "The database answers.",
  "admin.conn.sb.authOk": "Authentication works.",
  "admin.conn.sb.storageOk": "All storage buckets exist and are configured correctly.",
  "admin.conn.sb.storageProblems": "{count} bucket(s) need attention.",
  "admin.conn.sb.rlsOk": "No internal views are reachable from the browser.",
  "admin.conn.sb.rlsExposed": "{count} internal view(s) reachable from the browser.",
  "admin.conn.sb.noSuperAdmin":
    "There is no super admin yet. Use the first-administrator step or the SQL in DEPLOYMENT.md.",
  "admin.conn.sb.superAdmins": "{count} super admin(s) configured.",
  "admin.conn.sb.noProject": "No project configured",
  "admin.conn.sb.serverOnly": "Server side only",

  "admin.conn.ready.liveKey": "Live API key",
  "admin.conn.ready.stillTestKey": "Still a test key",
  "admin.conn.ready.siteUrl": "Shop address",
  "admin.conn.ready.noHttpsSite": "No https address configured",
  "admin.conn.ready.noHttpsHook": "No https address yet",
  "admin.conn.ready.credentialStorage": "Credential storage",
  "admin.conn.ready.approval": "Approval",
  "admin.conn.ready.approvedOn": "Approved on {date}",
  "admin.conn.ready.notApproved": "Not approved yet",

  "admin.page.general.title": "Shop details",
  "admin.page.general.body":
    "What the shop is called, where it runs, and which language it opens in.",
  "admin.page.company.title": "Business details",
  "admin.page.company.body":
    "The details a Dutch webshop is legally required to publish. They appear on invoices, in the terms and on the contact page.",
  "admin.page.shop.title": "Shop settings",
  "admin.page.shop.body": "What customers can do, and on what terms.",
  "admin.page.payments.title": "Payment settings",
  "admin.page.payments.body": "The webhook address Mollie reports the payment status back to.",
  "admin.page.shipping.title": "Shipping costs",
  "admin.page.shipping.body":
    "The rates. Shipping methods themselves stay with the catalogue, where the choice of carrier and country belongs.",
  "admin.page.email.title": "E-mail settings",
  "admin.page.email.body": "Which address messages come from, and where replies go.",
  "admin.page.translations.title": "Translation settings",
  "admin.page.translations.body": "When translation happens automatically, and what survives it.",
  "admin.page.seo.title": "Discoverability",
  "admin.page.seo.body": "What search engines and social media see of the shop.",
  "admin.page.bol.title": "bol.com settings",
  "admin.page.bol.body": "How often data is exchanged with bol.com.",
  "admin.page.analytics.title": "Analytics",
  "admin.page.analytics.body":
    "Measurement IDs for visitor statistics. Leave out what you do not use — an empty value loads no script.",
  "admin.page.supabase.title": "Checks",
  "admin.page.supabase.body":
    "Each button makes a real call and shows what came back. Nothing is checked when this page opens.",

  "admin.pay.testBanner": "Checkout is in test mode",
  "admin.pay.testBannerBody":
    "Orders go through everything a real order goes through, but no money moves. Exactly what you want before opening.",
  "admin.pay.offBanner": "Checkout is switched off",
  "admin.pay.offBannerBody":
    "Customers can browse products but cannot check out. Switch to test mode when you want to try the ordering flow.",
  "admin.pay.live.title": "Going live",
  "admin.pay.live.body":
    "What has to be true before real money arrives. This list is an explanation; the check itself runs again on the server the moment you confirm.",
  "admin.pay.needsSuperAdmin": "Only a super admin can switch on live payments.",
  "admin.pay.stillBlocked": "Something is still in the way. Resolve that first.",
  "admin.pay.typeName": "Type the shop name to confirm",
  "admin.pay.goLive": "Switch on live payments",
  "admin.pay.backToTest": "Back to test mode",
  "admin.pay.turnOff": "Switch checkout off",
  "admin.pay.nowLive": "Live payments are on. Real money is being taken from now on.",
  "admin.pay.steppedDown": "Checkout has been stepped back down.",
  "admin.pay.blocked": "The approval was refused.",

  "admin.email.test.title": "Send a test message",
  "admin.email.test.body":
    "Sends a real message. A valid key does not prove an e-mail arrives — this does.",
  "admin.email.test.label": "Send to",
  "admin.email.test.send": "Send",
  "admin.email.test.limit": "At most five test messages an hour.",

  "admin.trans.test.title": "Try a translation",
  "admin.trans.test.body":
    "Translate a sentence and read the result. A key that works but translates into the wrong language gives you a shop full of wrong copy.",
  "admin.trans.test.label": "Dutch sentence",
  "admin.trans.test.target": "Into",
  "admin.trans.test.run": "Translate",

  "admin.sb.run": "Run",
  "admin.sb.database": "Database",
  "admin.sb.databaseBody": "Runs one real query to see whether the database answers.",
  "admin.sb.auth": "Accounts",
  "admin.sb.authBody": "Checks that creating and managing accounts works.",
  "admin.sb.storage": "File storage",
  "admin.sb.storageBody":
    "Looks at whether the storage buckets exist and are not accidentally public.",
  "admin.sb.rls": "Row security",
  "admin.sb.rlsBody":
    "Looks for tables and views reachable from the browser that were never meant to be.",
  "admin.sb.admins": "Administrators",
  "admin.sb.adminsBody": "Checks that at least one super admin exists.",
  "admin.sb.keys.title": "Keys",
  "admin.sb.keys.body": "Where the Supabase keys live, and why they live there.",
  "admin.sb.keys.detail":
    "The service role key opens the database completely, which is why it stays in the server's environment. It is not shown here, not partly shown, and never sent to a browser. The project address and the publishable key are needed before the application can start, and belong with the deployment for the same reason.",

  "admin.sec.posture.title": "What protects the shop",
  "admin.sec.posture.body": "Only things this page can actually observe.",
  "admin.sec.mfa": "Two-factor authentication for staff",
  "admin.sec.mfaBody": "Required. Without a second factor the server refuses every admin action.",
  "admin.sec.storage": "Credential storage",
  "admin.sec.storageVault":
    "Secure storage is available; credentials can be replaced from the admin.",
  "admin.sec.storageEnv":
    "No secure storage. Credentials live in the server environment and are managed there.",
  "admin.sec.serverOnly": "Credentials stay on the server",
  "admin.sec.serverOnlyBody":
    "No API in this application returns a credential. The status types have no field for one.",
  "admin.sec.mode": "Checkout status",
  "admin.sec.modeBody": "Currently: {mode}.",
  "admin.sec.indexing": "Visible to search engines",
  "admin.sec.indexingOn": "The shop may be indexed.",
  "admin.sec.indexingOff":
    "The shop is hidden from search engines. Meant for an environment that is not finished.",
  "admin.sec.openStaff": "Staff",
  "admin.sec.openAudit": "Open the audit log",
  "admin.sec.credentials.title": "Credentials",
  "admin.sec.credentials.body": "Where they live. Never what they are.",
  "admin.sec.inVault": "In secure storage",
  "admin.sec.inEnv": "In the server environment",
  "admin.sec.credentialsNote":
    "Replacing a credential is recorded in the audit log without its value: the entry says it was replaced, not what with.",
  "admin.sec.checks.title": "Run checks",
  "admin.sec.checks.body":
    "The same checks the test suite runs, but now and against this environment.",
  "admin.sec.runRls": "Row security",
  "admin.sec.runStorage": "File storage",
  "admin.sec.runAdmins": "Administrators",

  "admin.sys.health.title": "System status",
  "admin.sys.health.body": "Where the settings come from, and how this environment is set up.",
  "admin.sys.storeUrl": "Shop address",
  "admin.sys.secretBackend": "Credential storage",
  "admin.sys.fromDatabase": "Set in the admin",
  "admin.sys.fromEnvironment": "From the server environment",
  "admin.sys.export.title": "Export settings",
  "admin.sys.export.body": "To carry a configuration over to another environment.",
  "admin.sys.export.run": "Export",
  "admin.sys.export.detail":
    "The file holds settings only. There is no credential in it — the export function has no access to one.",
  "admin.sys.environment.title": "What stays in the server environment",
  "admin.sys.environment.body": "And why that is not a shortcoming.",
  "admin.sys.environment.detail":
    "Supabase's project address and keys are needed before the application can read a database, so they cannot come from one. The trusted proxy address and the first administrator's e-mail stay there deliberately too: a setting the administrator can change is a setting somebody who reaches the admin can change, and those two decide who is trusted in the first place.",

  "admin.bol.openSync": "Open synchronisation",
  "admin.bol.help":
    "The client ID and client secret come from your bol.com seller account, under the API settings. They belong together: a valid ID with the wrong secret produces the same error as a wrong ID.",

  "admin.wizard.title": "Setup",
  "admin.wizard.body":
    "Each step works out for itself whether it is done. Nothing is ticked off that is not actually true.",
  "admin.wizard.progress": "Progress",
  "admin.wizard.ready": "Ready to open",
  "admin.wizard.blocking": "{count} step(s) still to go before the shop can take real orders.",
  "admin.wizard.allConnections": "All connections",
  "admin.wizard.tick": "Mark as done",
  "admin.wizard.untick": "Clear the tick",
  "admin.wizard.shop.title": "Fill in the shop details",
  "admin.wizard.shop.body": "The shop name and the https address it runs on.",
  "admin.wizard.company.title": "Fill in the business details",
  "admin.wizard.company.body":
    "Chamber of Commerce number, VAT number and registered address. Legally required.",
  "admin.wizard.support.title": "Set up customer service",
  "admin.wizard.support.body": "An e-mail address customers can write to.",
  "admin.wizard.database.title": "Connect the database",
  "admin.wizard.database.body": "Ticked once a real query has been answered.",
  "admin.wizard.admins.title": "Create the first administrator",
  "admin.wizard.admins.body": "You are signed in, so this already happened.",
  "admin.wizard.email.title": "Set up e-mail",
  "admin.wizard.email.body": "A key and a sender address, or a deliberate decision to send none.",
  "admin.wizard.payments.title": "Prepare payments",
  "admin.wizard.payments.body": "A Mollie key and a webhook address Mollie can reach.",
  "admin.wizard.shipping.title": "Check the shipping rates",
  "admin.wizard.shipping.body":
    "Zero is a valid rate and so is nine euros. Only you know which is meant, so you tick this one yourself.",
  "admin.wizard.returns.title": "Set the return window",
  "admin.wizard.returns.body": "At least fourteen days, as the EU requires.",
  "admin.wizard.seo.title": "Sort out discoverability",
  "admin.wizard.seo.body": "A title suffix, a description, and indexing switched on.",
  "admin.wizard.translations.title": "Decide on translations",
  "admin.wizard.translations.body": "Optional. Tick it off if the shop sells in Dutch only.",
  "admin.wizard.live.title": "Go live",
  "admin.wizard.live.body": "The last step, with an approval of its own.",

  "admin.quick.openSettings": "Open settings",
};
