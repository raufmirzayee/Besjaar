/**
 * Page titles and meta descriptions, in the four languages the shop speaks.
 *
 * Every route's `head()` used to carry hard-coded Dutch. The interface around
 * it translated, so a German visitor got a German shop inside a Dutch browser
 * tab — and the description a search engine or a shared link showed was Dutch
 * too, which is the first thing anyone sees and the last thing that was
 * translated.
 *
 * These are written, not generated. A machine-translated meta description is
 * worse than an untranslated one: it reads as spam to the people it is meant
 * to attract, and search engines treat it accordingly.
 *
 * `head()` runs outside React, so it cannot use the `t()` hook. It reads the
 * locale the server put in the route context and looks it up here directly.
 */

import type { Locale } from "./locale-detect";

export type PageSeoKey =
  | "home"
  | "shop"
  | "categories"
  | "brands"
  | "deals"
  | "search"
  | "contact"
  | "faq"
  | "shipping"
  | "returns"
  | "about"
  | "terms"
  | "privacy"
  | "cookies"
  | "withdrawal"
  | "cart"
  | "wishlist"
  | "account"
  | "checkout"
  | "login"
  | "passwordReset"
  | "orderConfirmed";

type Copy = { title: string; description: string };

const nl: Record<PageSeoKey, Copy> = {
  home: {
    title: "Besjaar — Praktische producten. Slim gekozen.",
    description:
      "Zaklampen, hoofdlampen, douchekoppen, keukenweegschalen en accessoires van Besjaar, RYNEX en LYNEX. Een compact assortiment praktische producten voor huis, tuin en onderweg.",
  },
  shop: {
    title: "Alle producten",
    description:
      "Het volledige Besjaar assortiment: verlichting, badkamer, keuken, elektronica en meer van Besjaar, RYNEX en LYNEX. Filter op categorie, merk en prijs.",
  },
  categories: {
    title: "Categorieën",
    description:
      "Alle categorieën van Besjaar: kamperen en outdoor, badkamer, persoonlijke verzorging, tuin, keuken, elektronica en meer.",
  },
  brands: {
    title: "Merken",
    description:
      "De merken van Besjaar: Besjaar zelf voor huis, badkamer en outdoor, RYNEX voor accessoires en LYNEX voor persoonlijke verzorging.",
  },
  deals: {
    title: "Aanbiedingen",
    description:
      "Producten met een actuele actieprijs bij Besjaar. Elke korting is berekend uit de reguliere prijs van het product zelf.",
  },
  search: {
    title: "Zoeken",
    description: "Zoek in het Besjaar assortiment op product, merk, categorie of artikelnummer.",
  },
  contact: {
    title: "Contact & klantenservice",
    description:
      "Neem contact op met de klantenservice van Besjaar: e-mail, telefoon, openingstijden en bedrijfsgegevens.",
  },
  faq: {
    title: "Veelgestelde vragen",
    description:
      "Antwoorden over levertijden, verzendkosten, retourneren, garantie en betalen bij Besjaar.",
  },
  shipping: {
    title: "Verzending & levering",
    description:
      "Levertijden en verzendkosten van Besjaar voor Nederland, België en Duitsland, inclusief track & trace.",
  },
  returns: {
    title: "Retouren aanmelden",
    description:
      "Meld eenvoudig een retour aan voor je Besjaar bestelling en volg de status van je terugbetaling.",
  },
  about: {
    title: "Over Besjaar",
    description:
      "Besjaar is een Nederlandse webwinkel met een compact, zorgvuldig samengesteld assortiment praktische producten voor huis, badkamer, tuin en onderweg.",
  },
  terms: {
    title: "Algemene voorwaarden",
    description:
      "De algemene voorwaarden van Besjaar: bestellen, prijzen, levering, herroepingsrecht, garantie en klachten.",
  },
  privacy: {
    title: "Privacyverklaring",
    description:
      "Hoe Besjaar persoonsgegevens verwerkt: welke data we bewaren, waarom, hoe lang en welke rechten je hebt.",
  },
  cookies: {
    title: "Cookiebeleid",
    description:
      "Welke cookies Besjaar gebruikt, waarvoor ze dienen en hoe je je keuze op elk moment aanpast.",
  },
  withdrawal: {
    title: "Modelformulier voor herroeping",
    description:
      "Gebruik dit modelformulier om je aankoop bij Besjaar binnen de bedenktijd te herroepen. Invullen en terugsturen.",
  },
  cart: {
    title: "Winkelwagen",
    description: "Bekijk en bewerk de producten in je Besjaar winkelwagen.",
  },
  wishlist: {
    title: "Verlanglijst",
    description: "Bewaar je favoriete Besjaar producten om ze later terug te vinden.",
  },
  account: {
    title: "Mijn account",
    description: "Beheer je Besjaar account, bestellingen en retouren.",
  },
  checkout: {
    title: "Afrekenen",
    description: "Rond je bestelling bij Besjaar veilig af: adres, verzending en betaling.",
  },
  login: {
    title: "Inloggen of registreren",
    description:
      "Log in op je Besjaar account of maak een nieuw account aan om je bestellingen te volgen.",
  },
  passwordReset: {
    title: "Nieuw wachtwoord instellen",
    description: "Stel een nieuw wachtwoord in voor je Besjaar account.",
  },
  orderConfirmed: {
    title: "Bestelling bevestigd",
    description: "Overzicht en status van je Besjaar bestelling.",
  },
};

const en: Record<PageSeoKey, Copy> = {
  home: {
    title: "Besjaar — Practical products, carefully chosen",
    description:
      "Torches, head torches, shower heads, kitchen scales and accessories from Besjaar, RYNEX and LYNEX. A compact range of practical products for the home, the garden and the road.",
  },
  shop: {
    title: "All products",
    description:
      "The full Besjaar range: lighting, bathroom, kitchen, electronics and more from Besjaar, RYNEX and LYNEX. Filter by category, brand and price.",
  },
  categories: {
    title: "Categories",
    description:
      "Every Besjaar category: camping and outdoor, bathroom, personal care, garden, kitchen, electronics and more.",
  },
  brands: {
    title: "Brands",
    description:
      "The Besjaar brands: Besjaar itself for the home, bathroom and outdoors, RYNEX for accessories and LYNEX for personal care.",
  },
  deals: {
    title: "Offers",
    description:
      "Products currently on offer at Besjaar. Every discount is calculated from the product's own regular price.",
  },
  search: {
    title: "Search",
    description: "Search the Besjaar range by product, brand, category or item number.",
  },
  contact: {
    title: "Contact & customer service",
    description:
      "Get in touch with Besjaar customer service: email, telephone, opening hours and company details.",
  },
  faq: {
    title: "Frequently asked questions",
    description:
      "Answers about delivery times, shipping costs, returns, warranty and payment at Besjaar.",
  },
  shipping: {
    title: "Shipping & delivery",
    description:
      "Besjaar delivery times and shipping costs for the Netherlands, Belgium and Germany, including track & trace.",
  },
  returns: {
    title: "Register a return",
    description:
      "Register a return for your Besjaar order in a few steps and follow the status of your refund.",
  },
  about: {
    title: "About Besjaar",
    description:
      "Besjaar is a Dutch online shop with a compact, carefully chosen range of practical products for the home, bathroom, garden and travel.",
  },
  terms: {
    title: "Terms and conditions",
    description:
      "The Besjaar terms and conditions: ordering, prices, delivery, right of withdrawal, warranty and complaints.",
  },
  privacy: {
    title: "Privacy statement",
    description:
      "How Besjaar handles personal data: what we keep, why, for how long and what rights you have.",
  },
  cookies: {
    title: "Cookie policy",
    description:
      "Which cookies Besjaar uses, what they are for and how to change your choice at any time.",
  },
  withdrawal: {
    title: "Model withdrawal form",
    description:
      "Use this model form to withdraw from your Besjaar purchase within the cooling-off period. Fill it in and send it back.",
  },
  cart: { title: "Basket", description: "Review and edit the products in your Besjaar basket." },
  wishlist: {
    title: "Wishlist",
    description: "Save your favourite Besjaar products so you can find them again later.",
  },
  account: {
    title: "My account",
    description: "Manage your Besjaar account, orders and returns.",
  },
  checkout: {
    title: "Checkout",
    description: "Complete your Besjaar order securely: address, delivery and payment.",
  },
  login: {
    title: "Sign in or register",
    description: "Sign in to your Besjaar account, or create one to keep track of your orders.",
  },
  passwordReset: {
    title: "Set a new password",
    description: "Set a new password for your Besjaar account.",
  },
  orderConfirmed: {
    title: "Order confirmed",
    description: "The summary and status of your Besjaar order.",
  },
};

const de: Record<PageSeoKey, Copy> = {
  home: {
    title: "Besjaar — Praktische Produkte, klug gewählt",
    description:
      "Taschenlampen, Stirnlampen, Duschköpfe, Küchenwaagen und Zubehör von Besjaar, RYNEX und LYNEX. Ein übersichtliches Sortiment praktischer Produkte für Haus, Garten und unterwegs.",
  },
  shop: {
    title: "Alle Produkte",
    description:
      "Das gesamte Besjaar-Sortiment: Beleuchtung, Bad, Küche, Elektronik und mehr von Besjaar, RYNEX und LYNEX. Nach Kategorie, Marke und Preis filtern.",
  },
  categories: {
    title: "Kategorien",
    description:
      "Alle Kategorien von Besjaar: Camping und Outdoor, Bad, Körperpflege, Garten, Küche, Elektronik und mehr.",
  },
  brands: {
    title: "Marken",
    description:
      "Die Marken von Besjaar: Besjaar selbst für Haus, Bad und Outdoor, RYNEX für Zubehör und LYNEX für die Körperpflege.",
  },
  deals: {
    title: "Angebote",
    description:
      "Produkte, die bei Besjaar gerade im Angebot sind. Jeder Rabatt wird aus dem regulären Preis des Produkts selbst berechnet.",
  },
  search: {
    title: "Suchen",
    description:
      "Durchsuchen Sie das Besjaar-Sortiment nach Produkt, Marke, Kategorie oder Artikelnummer.",
  },
  contact: {
    title: "Kontakt & Kundenservice",
    description:
      "So erreichen Sie den Besjaar-Kundenservice: E-Mail, Telefon, Öffnungszeiten und Firmenangaben.",
  },
  faq: {
    title: "Häufige Fragen",
    description:
      "Antworten zu Lieferzeiten, Versandkosten, Rückgabe, Garantie und Bezahlung bei Besjaar.",
  },
  shipping: {
    title: "Versand & Lieferung",
    description:
      "Lieferzeiten und Versandkosten von Besjaar für die Niederlande, Belgien und Deutschland, inklusive Sendungsverfolgung.",
  },
  returns: {
    title: "Rücksendung anmelden",
    description:
      "Melden Sie eine Rücksendung für Ihre Besjaar-Bestellung an und verfolgen Sie den Stand Ihrer Rückerstattung.",
  },
  about: {
    title: "Über Besjaar",
    description:
      "Besjaar ist ein niederländischer Onlineshop mit einem kompakten, sorgfältig zusammengestellten Sortiment praktischer Produkte für Haus, Bad, Garten und unterwegs.",
  },
  terms: {
    title: "Allgemeine Geschäftsbedingungen",
    description:
      "Die AGB von Besjaar: Bestellung, Preise, Lieferung, Widerrufsrecht, Gewährleistung und Beschwerden.",
  },
  privacy: {
    title: "Datenschutzerklärung",
    description:
      "Wie Besjaar personenbezogene Daten verarbeitet: was wir speichern, warum, wie lange und welche Rechte Sie haben.",
  },
  cookies: {
    title: "Cookie-Richtlinie",
    description:
      "Welche Cookies Besjaar verwendet, wozu sie dienen und wie Sie Ihre Auswahl jederzeit ändern.",
  },
  withdrawal: {
    title: "Muster-Widerrufsformular",
    description:
      "Mit diesem Musterformular widerrufen Sie Ihren Kauf bei Besjaar innerhalb der Widerrufsfrist. Ausfüllen und zurücksenden.",
  },
  cart: {
    title: "Warenkorb",
    description: "Sehen und bearbeiten Sie die Produkte in Ihrem Besjaar-Warenkorb.",
  },
  wishlist: {
    title: "Wunschliste",
    description: "Merken Sie sich Ihre liebsten Besjaar-Produkte, um sie später wiederzufinden.",
  },
  account: {
    title: "Mein Konto",
    description: "Verwalten Sie Ihr Besjaar-Konto, Ihre Bestellungen und Rücksendungen.",
  },
  checkout: {
    title: "Kasse",
    description: "Schließen Sie Ihre Besjaar-Bestellung sicher ab: Adresse, Versand und Zahlung.",
  },
  login: {
    title: "Anmelden oder registrieren",
    description:
      "Melden Sie sich bei Ihrem Besjaar-Konto an oder legen Sie ein Konto an, um Ihre Bestellungen zu verfolgen.",
  },
  passwordReset: {
    title: "Neues Passwort festlegen",
    description: "Legen Sie ein neues Passwort für Ihr Besjaar-Konto fest.",
  },
  orderConfirmed: {
    title: "Bestellung bestätigt",
    description: "Übersicht und Status Ihrer Besjaar-Bestellung.",
  },
};

const fr: Record<PageSeoKey, Copy> = {
  home: {
    title: "Besjaar — Des produits pratiques, bien choisis",
    description:
      "Lampes de poche, lampes frontales, pommeaux de douche, balances de cuisine et accessoires Besjaar, RYNEX et LYNEX. Une gamme compacte de produits pratiques pour la maison, le jardin et les déplacements.",
  },
  shop: {
    title: "Tous les produits",
    description:
      "Toute la gamme Besjaar : éclairage, salle de bains, cuisine, électronique et plus encore, de Besjaar, RYNEX et LYNEX. Filtrez par catégorie, marque et prix.",
  },
  categories: {
    title: "Catégories",
    description:
      "Toutes les catégories Besjaar : camping et plein air, salle de bains, soins personnels, jardin, cuisine, électronique et plus encore.",
  },
  brands: {
    title: "Marques",
    description:
      "Les marques Besjaar : Besjaar pour la maison, la salle de bains et le plein air, RYNEX pour les accessoires et LYNEX pour les soins personnels.",
  },
  deals: {
    title: "Promotions",
    description:
      "Les produits actuellement en promotion chez Besjaar. Chaque remise est calculée à partir du prix normal du produit lui-même.",
  },
  search: {
    title: "Rechercher",
    description:
      "Recherchez dans la gamme Besjaar par produit, marque, catégorie ou référence article.",
  },
  contact: {
    title: "Contact et service client",
    description:
      "Contactez le service client Besjaar : e-mail, téléphone, horaires d'ouverture et coordonnées de la société.",
  },
  faq: {
    title: "Questions fréquentes",
    description:
      "Réponses sur les délais de livraison, les frais de port, les retours, la garantie et le paiement chez Besjaar.",
  },
  shipping: {
    title: "Expédition et livraison",
    description:
      "Délais de livraison et frais de port Besjaar pour les Pays-Bas, la Belgique et l'Allemagne, suivi de colis inclus.",
  },
  returns: {
    title: "Déclarer un retour",
    description:
      "Déclarez un retour pour votre commande Besjaar et suivez l'état de votre remboursement.",
  },
  about: {
    title: "À propos de Besjaar",
    description:
      "Besjaar est une boutique en ligne néerlandaise proposant une gamme compacte et soigneusement choisie de produits pratiques pour la maison, la salle de bains, le jardin et les déplacements.",
  },
  terms: {
    title: "Conditions générales",
    description:
      "Les conditions générales de Besjaar : commande, prix, livraison, droit de rétractation, garantie et réclamations.",
  },
  privacy: {
    title: "Déclaration de confidentialité",
    description:
      "Comment Besjaar traite les données personnelles : ce que nous conservons, pourquoi, combien de temps et quels sont vos droits.",
  },
  cookies: {
    title: "Politique en matière de cookies",
    description:
      "Quels cookies Besjaar utilise, à quoi ils servent et comment modifier votre choix à tout moment.",
  },
  withdrawal: {
    title: "Formulaire type de rétractation",
    description:
      "Utilisez ce formulaire type pour vous rétracter de votre achat chez Besjaar pendant le délai de réflexion. À remplir et à renvoyer.",
  },
  cart: {
    title: "Panier",
    description: "Consultez et modifiez les produits de votre panier Besjaar.",
  },
  wishlist: {
    title: "Liste d'envies",
    description: "Enregistrez vos produits Besjaar préférés pour les retrouver plus tard.",
  },
  account: {
    title: "Mon compte",
    description: "Gérez votre compte Besjaar, vos commandes et vos retours.",
  },
  checkout: {
    title: "Commander",
    description:
      "Finalisez votre commande Besjaar en toute sécurité : adresse, livraison et paiement.",
  },
  login: {
    title: "Se connecter ou s'inscrire",
    description: "Connectez-vous à votre compte Besjaar ou créez-en un pour suivre vos commandes.",
  },
  passwordReset: {
    title: "Définir un nouveau mot de passe",
    description: "Définissez un nouveau mot de passe pour votre compte Besjaar.",
  },
  orderConfirmed: {
    title: "Commande confirmée",
    description: "Le récapitulatif et le statut de votre commande Besjaar.",
  },
};

export const PAGE_SEO: Record<Locale, Record<PageSeoKey, Copy>> = { nl, en, de, fr };

/** The copy for one page, falling back to Dutch — the language it is written in. */
export function pageSeo(key: PageSeoKey, locale: Locale | undefined): Copy {
  return PAGE_SEO[locale ?? "nl"]?.[key] ?? nl[key];
}
