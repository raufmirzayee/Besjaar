"""Univex SEO fixes of 23 Nov 2026: every before/after value, and the payloads.

Run `python3 changes.py` to write payloads.json (the GraphQL variables that
were sent) and rollback.json (the old values). Translation digests are the
SHA-256 of the Dutch source text, which is how Shopify computes them.
"""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).parent
SHOP = "gid://shopify/Shop/105781231964"


def digest(text):
    return hashlib.sha256(text.encode()).hexdigest()


# 1. Homepage title. The Dutch source ("Univex BV") is not writable through the
#    API, so it is changed by hand in Online Store > Preferences; the other
#    four languages are registered as translations of it.
HOME_SOURCE_NOW = "Univex BV"
HOME_TITLE = {
    "nl": "Univex Shop | Douchekoppen, zaklampen & handige gadgets",
    "de": "Univex Shop | Duschköpfe, Taschenlampen & praktische Gadgets",
    "en": "Univex Shop | Shower heads, flashlights & handy gadgets",
    "fr": "Univex Shop | Pommeaux de douche, lampes torches & gadgets",
    "es": "Univex Shop | Alcachofas de ducha, linternas y gadgets",
}

# 3. Meta descriptions for pages and blogs (none existed before).
DESCRIPTIONS = {
    "gid://shopify/Page/715935252828": {  # Contact
        "nl": "Vragen over een product of je bestelling? Mail info@univexbv.com, bel +31 6 87616931 of gebruik het formulier. We reageren meestal binnen één werkdag.",
        "de": "Fragen zu Produkt oder Bestellung? Schreib an info@univexbv.com, ruf +31 6 87616931 an oder nutze das Formular. Wir antworten meist innerhalb eines Werktags.",
        "en": "Questions about a product or your order? Email info@univexbv.com, call +31 6 87616931 or use the form. We usually reply within one working day.",
        "fr": "Une question sur un produit ou votre commande ? Écrivez à info@univexbv.com, appelez le +31 6 87616931 ou utilisez le formulaire. Réponse sous un jour ouvré.",
        "es": "¿Preguntas sobre un producto o tu pedido? Escribe a info@univexbv.com, llama al +31 6 87616931 o usa el formulario. Respondemos en un día laborable.",
    },
    "gid://shopify/Page/715936596316": {  # Veelgestelde vragen
        "nl": "Antwoorden over bestellen, bezorgen, retourneren en betalen: gratis verzending in Nederland, vóór 16:00 besteld is dezelfde dag verzonden, 30 dagen bedenktijd.",
        "de": "Bestellung, Versand, Rückgabe und Zahlung: Versand nach Deutschland ab 30 € gratis, bis 16 Uhr bestellt am selben Tag verschickt, 30 Tage Rückgabe.",
        "en": "Answers on ordering, delivery, returns and payment: free delivery in the Netherlands, free to BE, DE, FR and ES from €30, same-day dispatch before 16:00.",
        "fr": "Commande, livraison, retours et paiement : livraison gratuite en France dès 30 €, expédition le jour même avant 16h00 et 30 jours pour changer d'avis.",
        "es": "Pedidos, envíos, devoluciones y pagos: envío gratis a España desde 30 €, envío el mismo día si pides antes de las 16:00 y 30 días para devolver.",
    },
    "gid://shopify/Blog/130790523228": {  # Tips & advies (handle news)
        "nl": "Praktische tips en keuzegidsen: zo kies je de juiste zaklamp, hoofdlamp, douchekop, waterkoker of reisstekker, plus uitleg over onderhoud en gebruik.",
        "de": "Praktische Tipps und Kaufberater rund um Taschenlampen, Stirnlampen, Duschköpfe, Wasserkocher und Reisestecker, plus Hinweise zu Pflege und Anwendung.",
        "en": "Practical tips and buying guides for flashlights, head torches, shower heads, kettles and travel adapters, plus advice on care and use.",
        "fr": "Conseils pratiques et guides d'achat pour lampes torches, lampes frontales, pommeaux de douche, bouilloires et adaptateurs de voyage.",
        "es": "Consejos prácticos y guías de compra de linternas, linternas frontales, alcachofas de ducha, hervidores y adaptadores de viaje.",
    },
    "gid://shopify/Blog/131154772316": {  # Nieuws
        "nl": "Nieuws van Univex: nieuwe producten van onze merken Besjaar, Rynex, Lynex en SlimHome, en updates over verzending en retourneren.",
        "de": "Neuigkeiten von Univex: neue Produkte unserer Marken Besjaar, Rynex, Lynex und SlimHome sowie Updates zu Versand und Rückgabe.",
        "en": "News from Univex: new products from our brands Besjaar, Rynex, Lynex and SlimHome, plus updates on shipping and returns.",
        "fr": "Actualités d'Univex : nouveaux produits de nos marques Besjaar, Rynex, Lynex et SlimHome, et infos sur la livraison et les retours.",
        "es": "Noticias de Univex: nuevos productos de nuestras marcas Besjaar, Rynex, Lynex y SlimHome, y novedades sobre envíos y devoluciones.",
    },
}

# 4. The "Producten" page (/collections/all) had no SEO title or description.
PRODUCTEN = "gid://shopify/Collection/708027777372"
PRODUCTEN_SEO = {
    "nl": ("Alle producten | Douchekoppen, zaklampen & meer",
           "Alle producten van Univex: douchekoppen met filter, oplaadbare zaklampen, waterkokers, haarstyling en handige gadgets. Gratis verzending in Nederland."),
    "de": ("Alle Produkte | Duschköpfe, Taschenlampen & mehr",
           "Alle Produkte von Univex: Duschköpfe mit Filter, aufladbare Taschenlampen, Wasserkocher, Haarstyling und Gadgets. Versand nach Deutschland ab 30 € gratis."),
    "en": ("All products | Shower heads, flashlights & more",
           "All Univex products: filtered shower heads, rechargeable flashlights, kettles, hair styling and handy gadgets. Free delivery in the Netherlands."),
    "fr": ("Tous les produits | Pommeaux de douche, lampes & plus",
           "Tous les produits Univex : pommeaux de douche filtrants, lampes torches rechargeables, bouilloires, coiffure et gadgets pratiques. Livraison offerte dès 30 €."),
    "es": ("Todos los productos | Alcachofas, linternas y más",
           "Todos los productos de Univex: alcachofas con filtro, linternas recargables, hervidores, peinado y gadgets prácticos. Envío gratis a España desde 30 €."),
}

# 5. "Aanbiedingen": drop the sentence that says the crossed-out price is the
#    lowest price of the last 30 days.
AANBIEDINGEN = "gid://shopify/Collection/700629320028"
AANBIEDINGEN_BODY = {
    "nl": ("<p>Producten met een tijdelijk verlaagde prijs. De doorgestreepte prijs is de laagste prijs van de afgelopen 30 dagen.</p>",
           "<p>Producten met een tijdelijk verlaagde prijs.</p>"),
    "de": ("<p>Produkte mit einem vorübergehend reduzierten Preis. Der durchgestrichene Preis ist der niedrigste Preis der letzten 30 Tage.</p>",
           "<p>Produkte mit einem vorübergehend reduzierten Preis.</p>"),
    "en": ("<p>Products with a temporarily reduced price. The crossed-out price is the lowest price of the past 30 days.</p>",
           "<p>Products with a temporarily reduced price.</p>"),
    "fr": ("<p>Produits à prix temporairement réduit. Le prix barré est le prix le plus bas des 30 derniers jours.</p>",
           "<p>Produits à prix temporairement réduit.</p>"),
    "es": ("<p>Productos con un precio rebajado temporalmente. El precio tachado es el precio más bajo de los últimos 30 días.</p>",
           "<p>Productos con un precio rebajado temporalmente.</p>"),
}

# 6. Product SEO titles: drop " | Univex" (the theme already adds "– Univex Shop").
PRODUCTS = {
    "gid://shopify/Product/15846949814620": {
        "nl": "Besjaar Douchekop met Filter en Slang (10 standen)",
        "de": "Besjaar Duschkopf mit Filter und Schlauch (10 Strahlarten)",
        "en": "Besjaar Filtered Shower Head with Hose (10 modes)",
        "fr": "Besjaar pommeau de douche filtrant avec flexible (10 jets)",
        "es": "Besjaar alcachofa de ducha con filtro y flexo (10 modos)",
    },
    "gid://shopify/Product/15846952173916": {
        "nl": "Besjaar Douchekop met Filter (10 standen)",
        "de": "Besjaar Duschkopf mit Filter (10 Strahlarten)",
        "en": "Besjaar Filtered Shower Head (10 modes)",
        "fr": "Besjaar pommeau de douche filtrant (10 jets)",
        "es": "Besjaar alcachofa de ducha con filtro (10 modos)",
    },
    "gid://shopify/Product/15846952206684": {
        "nl": "Besjaar Douchekop met Slang (3 standen)",
        "de": "Besjaar Duschkopf mit Schlauch (3 Strahlarten)",
        "en": "Besjaar Shower Head with Hose (3 modes)",
        "fr": "Besjaar pommeau de douche avec flexible (3 jets)",
        "es": "Besjaar alcachofa de ducha con flexo (3 modos)",
    },
    "gid://shopify/Product/15846952239452": {
        "nl": "Besjaar Waterbesparende Douchekop (3 standen)",
        "de": "Besjaar Wassersparender Duschkopf (3 Strahlarten)",
        "en": "Besjaar Water-Saving Shower Head (3 modes)",
        "fr": "Besjaar pommeau de douche économique (3 jets)",
        "es": "Besjaar alcachofa de ducha ahorradora (3 modos)",
    },
    "gid://shopify/Product/15846953255260": {
        "nl": "Besjaar Douchefilter Navulset (2 filters)",
        "de": "Besjaar Duschfilter-Nachfüllset (2 Filter)",
        "en": "Besjaar Shower Filter Refill Set (2 filters)",
        "fr": "Besjaar recharges de filtre de douche (2 filtres)",
        "es": "Besjaar recambio de filtros de ducha (2 filtros)",
    },
}
# Before: each of the five values above with " | Univex" appended.

# 9. Blog SEO titles: Dutch, French and Spanish use sentence case, not English
#    Title Case. German and English are kept as they were.
#    Each entry: (old nl, new nl, de, en, new fr, new es).
ARTICLES = {
    "gid://shopify/Article/1008249176412": ("Hoeveel Lumen Heeft een Zaklamp Nodig? Uitleg & Tips", "Hoeveel lumen heeft een zaklamp nodig? Uitleg & tips",
        "Wie viele Lumen braucht eine Taschenlampe? Erklärung & Tipps", "How Many Lumens Does a Flashlight Need? Guide & Tips",
        "Combien de lumens pour une lampe torche ? Guide & conseils", "¿Cuántos lúmenes necesita una linterna? Guía y consejos"),
    "gid://shopify/Article/1008249209180": ("Douchekop met Filter: Werking & Filter Vervangen", "Douchekop met filter: werking & filter vervangen",
        "Duschkopf mit Filter: Funktion & Filter wechseln", "Filtered Shower Head: How It Works & Replacing the Filter",
        "Pommeau de douche filtrant : fonctionnement & remplacement du filtre", "Alcachofa de ducha con filtro: funcionamiento y cambio de filtro"),
    "gid://shopify/Article/1008249241948": ("Watertemperatuur voor Thee & Koffie: Handig Overzicht", "Watertemperatuur voor thee & koffie: handig overzicht",
        "Wassertemperatur für Tee & Kaffee: Praktische Übersicht", "Water Temperature for Tea & Coffee: Handy Overview",
        "Température de l'eau pour le thé & le café : aperçu pratique", "Temperatura del agua para té y café: guía práctica"),
    "gid://shopify/Article/1008249635164": ("Nieuw: SlimHome Waterkokers | Ons Eigen Keukenmerk", "Nieuw: SlimHome-waterkokers, ons eigen keukenmerk",
        "Neu: SlimHome Wasserkocher | Unsere eigene Küchenmarke", "New: SlimHome Kettles | Our Own Kitchen Brand",
        "Nouveau : bouilloires SlimHome, notre propre marque de cuisine", "Novedad: hervidores SlimHome, nuestra propia marca de cocina"),
    "gid://shopify/Article/1008249733468": ("Hoofdlamp Kopen: Waar Let Je Op? Tips & Vergelijking", "Hoofdlamp kopen: waar let je op? Tips & vergelijking",
        "Stirnlampe kaufen: Worauf achten? Tipps & Vergleich", "Buying a Headlamp: What to Look For? Tips & Comparison",
        "Choisir une lampe frontale : critères, conseils & comparatif", "Comprar linterna frontal: ¿qué tener en cuenta? Consejos y comparativa"),
    "gid://shopify/Article/1008249766236": ("Welke Reisstekker Heb Je Nodig? Stekkertypes per Land", "Welke reisstekker heb je nodig? Stekkertypes per land",
        "Welchen Reiseadapter brauchst du? Steckertypen nach Land", "Which Travel Adapter Do You Need? Plug Types by Country",
        "Quel adaptateur de voyage ? Types de prises par pays", "¿Qué adaptador de viaje necesitas? Enchufes por país"),
    "gid://shopify/Article/1008249799004": ("Laptopstandaard Instellen: Prettiger Werken in 5 Stappen", "Laptopstandaard instellen: prettiger werken in 5 stappen",
        "Laptopständer einrichten: Angenehmer arbeiten in 5 Schritten", "Setting Up a Laptop Stand: Work More Comfortably in 5 Steps",
        "Régler un support pour PC portable : plus de confort en 5 étapes", "Ajustar un soporte para portátil: trabaja más cómodo en 5 pasos"),
    "gid://shopify/Article/1008277782876": ("Draadloze Deurbel Kopen & Installeren: Tips en Uitleg", "Draadloze deurbel kopen & installeren: tips en uitleg",
        "Funk-Türklingel kaufen & installieren: Tipps und Anleitung", "Buying & Installing a Wireless Doorbell: Tips and Guide",
        "Sonnette sans fil : bien la choisir et l'installer", "Comprar e instalar un timbre inalámbrico: consejos y guía"),
    "gid://shopify/Article/1008277815644": ("Muizen in Huis? Zo Raak Je Ze Kwijt Zonder Gif", "Muizen in huis? Zo raak je ze kwijt zonder gif",
        "Mäuse im Haus? So wirst du sie ohne Gift los", "Mice in the House? Get Rid of Them Without Poison",
        "Souris à la maison ? Chassez-les sans poison", "¿Ratones en casa? Así te libras de ellos sin veneno"),
    "gid://shopify/Article/1008277848412": ("Telefoonhouder op de Fiets: Regels, Keuze & Montage", "Telefoonhouder op de fiets: regels, keuze & montage",
        "Handyhalterung am Fahrrad: Regeln, Auswahl & Montage", "Bike Phone Holder: Rules, Choosing & Fitting",
        "Support téléphone vélo : règles, choix et montage", "Soporte de móvil para bici: normas, elección y montaje"),
    "gid://shopify/Article/1008277881180": ("Solar Buitenlamp met Bewegingssensor: Tips voor Herfst & Winter", "Solar buitenlamp met bewegingssensor: tips voor herfst & winter",
        "Solarleuchte mit Bewegungsmelder: Tipps für Herbst & Winter", "Solar Outdoor Light with Motion Sensor: Autumn & Winter Tips",
        "Lampe solaire à détecteur : nos conseils automne-hiver", "Lámpara solar con sensor: consejos para otoño e invierno"),
    "gid://shopify/Article/1008277913948": ("Krullen Maken met een Airstyler: Stap-voor-Stap Uitleg", "Krullen maken met een airstyler: stap-voor-stap uitleg",
        "Locken mit dem Airstyler: Schritt-für-Schritt-Anleitung", "How to Curl Hair with an Airstyler: Step-by-Step Guide",
        "Boucles avec un Airstyler : le guide étape par étape", "Cómo hacer rizos con un Airstyler: guía paso a paso"),
    "gid://shopify/Article/1008278798684": ("Digitale Keukenweegschaal: Tips voor Nauwkeurig Wegen", "Digitale keukenweegschaal: tips voor nauwkeurig wegen",
        "Digitale Küchenwaage: Tipps für genaues Wiegen", "Digital Kitchen Scale: Tips for Accurate Weighing",
        "Balance de cuisine numérique : conseils pour bien peser", "Báscula de cocina digital: consejos para pesar con precisión"),
    "gid://shopify/Article/1008278831452": ("Massage Gun Gebruiken: Tips, Opzetstukken & Veiligheid", "Massage gun gebruiken: tips, opzetstukken & veiligheid",
        "Massagepistole anwenden: Tipps, Aufsätze & Sicherheit", "How to Use a Massage Gun: Tips, Attachments & Safety",
        "Pistolet de massage : conseils, embouts et sécurité", "Cómo usar una pistola de masaje: consejos y seguridad"),
    "gid://shopify/Article/1008278864220": ("Alcohol Markers voor Beginners: Papier, Technieken & Tips", "Alcohol markers voor beginners: papier, technieken & tips",
        "Alkoholmarker für Anfänger: Papier, Techniken & Tipps", "Alcohol Markers for Beginners: Paper, Techniques & Tips",
        "Feutres à alcool pour débutants : papier et techniques", "Rotuladores de alcohol para principiantes: papel y técnicas"),
    "gid://shopify/Article/1008278896988": ("UV-Zaklamp: Urinevlekken van Huisdieren Opsporen", "UV-zaklamp: urinevlekken van huisdieren opsporen",
        "UV-Taschenlampe: Urinflecken von Haustieren finden", "UV Torch: How to Find Pet Urine Stains",
        "Lampe UV : détecter les taches d'urine d'animaux", "Linterna UV: detecta manchas de orina de mascotas"),
    "gid://shopify/Article/1008278929756": ("Foto's Overzetten met een SD-Kaartlezer (USB-C)", "Foto's overzetten met een SD-kaartlezer (USB-C)",
        "Fotos mit einem SD-Kartenleser übertragen (USB-C)", "How to Transfer Photos with an SD Card Reader (USB-C)",
        "Transférer des photos avec un lecteur de cartes SD (USB-C)", "Cómo pasar fotos con un lector de tarjetas SD (USB-C)"),
}
# The French and Spanish titles of the first seven articles were in Title Case
# before, e.g. "Combien de Lumens pour une Lampe Torche ? Guide & Conseils".

# 10. The "Home page" collection (/collections/frontpage) is hidden from search
#     engines and the sitemap with the seo.hidden metafield.
FRONTPAGE = "gid://shopify/Collection/699759100252"

LOCALES = ("de", "en", "fr", "es")


def build():
    p = {}
    p["shop_title_translations"] = {
        "resourceId": SHOP,
        "translations": [{"locale": l, "key": "meta_title", "value": HOME_TITLE[l],
                          "translatableContentDigest": digest(HOME_SOURCE_NOW)} for l in LOCALES],
    }
    mf = []
    for gid, (_, nl, *_rest) in ARTICLES.items():
        mf.append({"ownerId": gid, "namespace": "global", "key": "title_tag",
                   "type": "single_line_text_field", "value": nl})
    for gid, d in DESCRIPTIONS.items():
        mf.append({"ownerId": gid, "namespace": "global", "key": "description_tag",
                   "type": "multi_line_text_field", "value": d["nl"]})
    mf.append({"ownerId": FRONTPAGE, "namespace": "seo", "key": "hidden",
               "type": "number_integer", "value": "1"})
    p["metafields"] = mf
    tr = {}
    for gid, langs in PRODUCTS.items():
        tr[gid] = [{"locale": l, "key": "meta_title", "value": langs[l],
                    "translatableContentDigest": digest(langs["nl"])} for l in LOCALES]
    for gid, (_, nl, de, en, fr, es) in ARTICLES.items():
        vals = {"de": de, "en": en, "fr": fr, "es": es}
        tr[gid] = [{"locale": l, "key": "meta_title", "value": vals[l],
                    "translatableContentDigest": digest(nl)} for l in LOCALES]
    for gid, d in DESCRIPTIONS.items():
        tr[gid] = [{"locale": l, "key": "meta_description", "value": d[l],
                    "translatableContentDigest": digest(d["nl"])} for l in LOCALES]
    tr[PRODUCTEN] = [t for l in LOCALES for t in (
        {"locale": l, "key": "meta_title", "value": PRODUCTEN_SEO[l][0],
         "translatableContentDigest": digest(PRODUCTEN_SEO["nl"][0])},
        {"locale": l, "key": "meta_description", "value": PRODUCTEN_SEO[l][1],
         "translatableContentDigest": digest(PRODUCTEN_SEO["nl"][1])})]
    tr[AANBIEDINGEN] = [{"locale": l, "key": "body_html", "value": AANBIEDINGEN_BODY[l][1],
                         "translatableContentDigest": digest(AANBIEDINGEN_BODY["nl"][1])} for l in LOCALES]
    p["translations"] = tr
    return p


def rollback():
    return {
        "products_seo_title_nl": {g: v["nl"] + " | Univex" for g, v in PRODUCTS.items()},
        "products_seo_title_translations": {g: {l: v[l] + " | Univex" for l in LOCALES} for g, v in PRODUCTS.items()},
        "articles_seo_title_nl": {g: v[0] for g, v in ARTICLES.items()},
        "descriptions": "none existed: delete metafield global.description_tag on each resource",
        "producten_seo": "none existed: set seo title/description to empty",
        "aanbiedingen_body": {l: v[0] for l, v in AANBIEDINGEN_BODY.items()},
        "frontpage": "delete metafield seo.hidden",
        "home_title": "translations of meta_title were 'Univex BV' in all languages",
    }


if __name__ == "__main__":
    payloads = build()
    (HERE / "payloads.json").write_text(json.dumps(payloads, ensure_ascii=False, indent=1))
    (HERE / "rollback.json").write_text(json.dumps(rollback(), ensure_ascii=False, indent=1))
    too_long = [(t["value"], len(t["value"])) for g in payloads["translations"].values() for t in g
                if t["key"] == "meta_description" and len(t["value"]) > 160]
    too_long += [(d[l], len(d[l])) for d in DESCRIPTIONS.values() for l in d if len(d[l]) > 160]
    print("descriptions over 160 chars:", too_long or "none")
    print("metafields:", len(payloads["metafields"]), "translation resources:", len(payloads["translations"]))
