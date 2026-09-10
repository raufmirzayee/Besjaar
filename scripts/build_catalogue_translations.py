# -*- coding: utf-8 -*-
"""Emits src/data/catalogue-translations.ts from hand-written translations."""
import json

CATEGORIES = {
 "kamperen-outdoor": {
   "en": ("Camping & Outdoor", "Torches, head torches and lighting for the road, the campsite and the emergency kit."),
   "de": ("Camping & Outdoor", "Taschenlampen, Stirnlampen und Beleuchtung für unterwegs, den Campingplatz und das Notfallset."),
   "fr": ("Camping et plein air", "Lampes de poche, lampes frontales et éclairage pour la route, le camping et le kit d'urgence."),
 },
 "badkamer": {
   "en": ("Bathroom", "Shower heads, hoses and filters for more comfort in the shower."),
   "de": ("Bad", "Duschköpfe, Duschschläuche und Filter für mehr Komfort unter der Dusche."),
   "fr": ("Salle de bains", "Pommeaux de douche, flexibles et filtres pour plus de confort sous la douche."),
 },
 "persoonlijke-verzorging": {
   "en": ("Personal care", "Airstylers, hot brushes and grooming products for everyday use."),
   "de": ("Körperpflege", "Airstyler, Warmluftbürsten und Pflegeprodukte für den täglichen Gebrauch."),
   "fr": ("Soins personnels", "Brosses soufflantes, brosses chauffantes et produits de soin pour un usage quotidien."),
 },
 "lifestyle-accessoires": {
   "en": ("Lifestyle & Accessories", "Aluminium cigarette cases and accessories with a sturdy, weather-resistant finish."),
   "de": ("Lifestyle & Accessoires", "Zigarettenetuis aus Aluminium und Accessoires mit robuster, wetterfester Verarbeitung."),
   "fr": ("Lifestyle et accessoires", "Étuis à cigarettes en aluminium et accessoires à la finition robuste et résistante aux intempéries."),
 },
 "klussen-huis": {
   "en": ("DIY & Home", "Wireless doorbells and household solutions that install in minutes."),
   "de": ("Heimwerken & Haushalt", "Funktürklingeln und Haushaltslösungen, die im Handumdrehen installiert sind."),
   "fr": ("Bricolage et maison", "Sonnettes sans fil et solutions domestiques qui s'installent en quelques minutes."),
 },
 "elektronica-accessoires": {
   "en": ("Electronics & Accessories", "Adapters, card readers and laptop stands for home and the office."),
   "de": ("Elektronik & Zubehör", "Adapter, Kartenleser und Laptopständer für zu Hause und fürs Büro."),
   "fr": ("Électronique et accessoires", "Adaptateurs, lecteurs de cartes et supports pour ordinateur portable, à la maison comme au bureau."),
 },
 "auto-fiets-reizen": {
   "en": ("Car, Bike & Travel", "Phone mounts and travel adaptors for the car, the bike and the trip."),
   "de": ("Auto, Fahrrad & Reise", "Handyhalterungen und Reisestecker für Auto, Fahrrad und unterwegs."),
   "fr": ("Voiture, vélo et voyage", "Supports de téléphone et adaptateurs de voyage pour la voiture, le vélo et les déplacements."),
 },
 "tuin": {
   "en": ("Garden", "Solar outdoor lighting and grow lights for the garden, the balcony and houseplants."),
   "de": ("Garten", "Solar-Außenbeleuchtung und Pflanzenlampen für Garten, Balkon und Zimmerpflanzen."),
   "fr": ("Jardin", "Éclairage extérieur solaire et lampes de croissance pour le jardin, le balcon et les plantes d'intérieur."),
 },
 "koken-tafelen": {
   "en": ("Cooking & Dining", "Digital kitchen scales for weighing accurately while cooking and baking."),
   "de": ("Kochen & Tafeln", "Digitale Küchenwaagen zum genauen Abwiegen beim Kochen und Backen."),
   "fr": ("Cuisine et table", "Balances de cuisine numériques pour peser avec précision en cuisinant et en pâtissant."),
 },
 "creatief-hobby": {
   "en": ("Creative & Hobby", "Double-ended alcohol markers for drawing, illustration and hand lettering."),
   "de": ("Kreativ & Hobby", "Doppelseitige Alkoholmarker zum Zeichnen, Illustrieren und Handlettering."),
   "fr": ("Loisirs créatifs", "Marqueurs à alcool double pointe pour le dessin, l'illustration et le lettrage."),
 },
}

BRANDS = {
 "besjaar": {
   "en": "The shop's own brand. Besjaar stands for practical products for the home, bathroom, garden and the road — lighting, shower comfort and useful household items.",
   "de": "Die Eigenmarke des Shops. Besjaar steht für praktische Produkte für Haus, Bad, Garten und unterwegs — Beleuchtung, Duschkomfort und nützliche Haushaltsartikel.",
   "fr": "La marque propre de la boutique. Besjaar, ce sont des produits pratiques pour la maison, la salle de bains, le jardin et les déplacements : éclairage, confort sous la douche et articles ménagers utiles.",
 },
 "rynex": {
   "en": "RYNEX supplies accessories for the desk, the kitchen, the car and the bike: phone mounts, adapters, card readers, scales and hobby materials.",
   "de": "RYNEX liefert Zubehör für Arbeitsplatz, Küche, Auto und Fahrrad: Handyhalterungen, Adapter, Kartenleser, Waagen und Hobbymaterial.",
   "fr": "RYNEX propose des accessoires pour le bureau, la cuisine, la voiture et le vélo : supports de téléphone, adaptateurs, lecteurs de cartes, balances et matériel de loisirs créatifs.",
 },
 "lynex": {
   "en": "LYNEX focuses on personal care, with airstylers and hot brushes for styling hair.",
   "de": "LYNEX konzentriert sich auf die Körperpflege, mit Airstylern und Warmluftbürsten zum Stylen der Haare.",
   "fr": "LYNEX se consacre aux soins personnels, avec des brosses soufflantes et chauffantes pour coiffer les cheveux.",
 },
}

# slug -> {locale: (name, short_description)}
PRODUCTS = {
"besjaar-hoofdlamp-led-oplaadbaar-1000-lumen": {
 "en": ("LED Head Torch, Rechargeable – 1000 Lumen", "Rechargeable LED head torch with 8 LED lamps, 1000 lumens and a 100-metre beam, in black."),
 "de": ("LED-Stirnlampe, wiederaufladbar – 1000 Lumen", "Wiederaufladbare LED-Stirnlampe mit 8 LED-Leuchten, 1000 Lumen und 100 Metern Reichweite, in Schwarz."),
 "fr": ("Lampe frontale LED rechargeable – 1000 lumens", "Lampe frontale LED rechargeable à 8 LED, 1000 lumens et 100 mètres de portée, en noir."),
},
"besjaar-hoofdlamp-led-oplaadbaar-400-lumen": {
 "en": ("LED Head Torch, Rechargeable – 400 Lumen", "Rechargeable head torch with a motion sensor, six light modes, 400 lumens and USB-C charging."),
 "de": ("LED-Stirnlampe, wiederaufladbar – 400 Lumen", "Wiederaufladbare Stirnlampe mit Bewegungssensor, sechs Lichtstufen, 400 Lumen und USB-C-Ladung."),
 "fr": ("Lampe frontale LED rechargeable – 400 lumens", "Lampe frontale rechargeable avec détecteur de mouvement, six modes d'éclairage, 400 lumens et charge USB-C."),
},
"besjaar-krachtige-militaire-zaklamp": {
 "en": ("Powerful Tactical Torch", "Powerful tactical torch, IP65 water-resistant and battery-powered."),
 "de": ("Kraftvolle Taktik-Taschenlampe", "Kraftvolle taktische Taschenlampe, nach IP65 wasserdicht und batteriebetrieben."),
 "fr": ("Lampe torche tactique puissante", "Lampe torche tactique puissante, étanche IP65 et alimentée par piles."),
},
"besjaar-lichtgewicht-hoofdlamp-led-oplaadbaar": {
 "en": ("Lightweight LED Head Torch, Rechargeable", "Lightweight rechargeable LED head torch, comfortable enough to wear all evening."),
 "de": ("Leichte LED-Stirnlampe, wiederaufladbar", "Leichte wiederaufladbare LED-Stirnlampe, bequem genug für den ganzen Abend."),
 "fr": ("Lampe frontale LED légère, rechargeable", "Lampe frontale LED rechargeable et légère, assez confortable pour toute une soirée."),
},
"besjaar-militaire-zaklamp-2000-lumen": {
 "en": ("Tactical Torch – 2000 Lumen", "Tactical torch delivering 2000 lumens for outdoor use and emergencies."),
 "de": ("Taktik-Taschenlampe – 2000 Lumen", "Taktische Taschenlampe mit 2000 Lumen für draußen und für den Notfall."),
 "fr": ("Lampe torche tactique – 2000 lumens", "Lampe torche tactique de 2000 lumens pour l'extérieur et les urgences."),
},
"besjaar-militaire-zaklamp-incl-batterijen": {
 "en": ("Tactical Torch – Batteries Included", "Tactical torch supplied with batteries, ready to use out of the box."),
 "de": ("Taktik-Taschenlampe – inkl. Batterien", "Taktische Taschenlampe inklusive Batterien, sofort einsatzbereit."),
 "fr": ("Lampe torche tactique – piles incluses", "Lampe torche tactique livrée avec ses piles, prête à l'emploi."),
},
"besjaar-militaire-zaklamp-op-batterijen": {
 "en": ("Tactical Torch – Battery Powered", "Battery-powered tactical torch, with no charging to remember."),
 "de": ("Taktik-Taschenlampe – Batteriebetrieb", "Batteriebetriebene taktische Taschenlampe, ganz ohne Aufladen."),
 "fr": ("Lampe torche tactique – à piles", "Lampe torche tactique à piles, sans recharge à prévoir."),
},
"besjaar-opwindbare-zaklamp": {
 "en": ("Wind-Up Torch", "Wind-up torch that needs no batteries — useful in the emergency kit and on the road."),
 "de": ("Kurbel-Taschenlampe", "Kurbel-Taschenlampe ganz ohne Batterien — praktisch im Notfallset und unterwegs."),
 "fr": ("Lampe torche à dynamo", "Lampe torche à manivelle qui ne nécessite aucune pile : idéale dans le kit d'urgence et en déplacement."),
},
"besjaar-uv-zaklamp-blacklight": {
 "en": ("UV Blacklight Torch", "UV blacklight torch for spotting stains, leaks and counterfeit notes."),
 "de": ("UV-Schwarzlicht-Taschenlampe", "UV-Schwarzlichtlampe zum Aufspüren von Flecken, Lecks und Falschgeld."),
 "fr": ("Lampe UV à lumière noire", "Lampe torche UV à lumière noire pour repérer taches, fuites et faux billets."),
},
"besjaar-zaklamp-led-oplaadbaar-10000-lumen": {
 "en": ("LED Torch, Rechargeable – 10000 Lumen", "Rechargeable LED torch delivering 10000 lumens, the brightest in the range."),
 "de": ("LED-Taschenlampe, wiederaufladbar – 10000 Lumen", "Wiederaufladbare LED-Taschenlampe mit 10000 Lumen — die hellste im Sortiment."),
 "fr": ("Lampe torche LED rechargeable – 10000 lumens", "Lampe torche LED rechargeable de 10000 lumens, la plus puissante de la gamme."),
},
"besjaar-zaklamp-led-oplaadbaar-1200-lumen": {
 "en": ("LED Torch, Rechargeable – 1200 Lumen", "Rechargeable LED torch with 1200 lumens for everyday use around the house."),
 "de": ("LED-Taschenlampe, wiederaufladbar – 1200 Lumen", "Wiederaufladbare LED-Taschenlampe mit 1200 Lumen für den Alltag rund ums Haus."),
 "fr": ("Lampe torche LED rechargeable – 1200 lumens", "Lampe torche LED rechargeable de 1200 lumens pour un usage quotidien à la maison."),
},
"besjaar-zaklamp-led-oplaadbaar-5000-lumen": {
 "en": ("LED Torch, Rechargeable – 5000 Lumen", "Rechargeable LED torch with 5000 lumens and a long beam."),
 "de": ("LED-Taschenlampe, wiederaufladbar – 5000 Lumen", "Wiederaufladbare LED-Taschenlampe mit 5000 Lumen und großer Reichweite."),
 "fr": ("Lampe torche LED rechargeable – 5000 lumens", "Lampe torche LED rechargeable de 5000 lumens à longue portée."),
},
"besjaar-zaklamp-led-oplaadbaar-7400-lumen": {
 "en": ("LED Torch, Rechargeable – 7400 Lumen", "Rechargeable LED torch with 7400 lumens for outdoor work after dark."),
 "de": ("LED-Taschenlampe, wiederaufladbar – 7400 Lumen", "Wiederaufladbare LED-Taschenlampe mit 7400 Lumen für Arbeiten im Dunkeln."),
 "fr": ("Lampe torche LED rechargeable – 7400 lumens", "Lampe torche LED rechargeable de 7400 lumens pour travailler dehors une fois la nuit tombée."),
},
"besjaar-zaklamp-led-oplaadbaar-7800-lumen": {
 "en": ("LED Torch, Rechargeable – 7800 Lumen", "Rechargeable LED torch with 7800 lumens and several light modes."),
 "de": ("LED-Taschenlampe, wiederaufladbar – 7800 Lumen", "Wiederaufladbare LED-Taschenlampe mit 7800 Lumen und mehreren Lichtstufen."),
 "fr": ("Lampe torche LED rechargeable – 7800 lumens", "Lampe torche LED rechargeable de 7800 lumens et plusieurs modes d'éclairage."),
},
"besjaar-zaklamp-led-oplaadbaar-9000-lumen": {
 "en": ("LED Torch, Rechargeable – 9000 Lumen", "Rechargeable LED torch with 9000 lumens for the darkest jobs."),
 "de": ("LED-Taschenlampe, wiederaufladbar – 9000 Lumen", "Wiederaufladbare LED-Taschenlampe mit 9000 Lumen für die dunkelsten Aufgaben."),
 "fr": ("Lampe torche LED rechargeable – 9000 lumens", "Lampe torche LED rechargeable de 9000 lumens pour les travaux les plus sombres."),
},
"besjaar-zaklamp-met-ingebouwde-accu": {
 "en": ("Torch with Built-In Battery", "Torch with a built-in rechargeable battery — nothing loose to lose."),
 "de": ("Taschenlampe mit fest eingebautem Akku", "Taschenlampe mit fest eingebautem Akku — nichts Loses, das verloren gehen kann."),
 "fr": ("Lampe torche à batterie intégrée", "Lampe torche à batterie rechargeable intégrée : rien qui puisse se perdre."),
},
}

PRODUCTS.update({
"besjaar-douchefilter": {
 "en": ("Shower Filter", "Water filter for a shower head, model 1002026, two filters in white."),
 "de": ("Duschfilter", "Wasserfilter für den Duschkopf, Modell 1002026, zwei Filter in Weiß."),
 "fr": ("Filtre de douche", "Filtre à eau pour pommeau de douche, modèle 1002026, deux filtres, en blanc."),
},
"besjaar-douchekop": {
 "en": ("Shower Head", "High-pressure rain shower head with three spray modes, for a wellness shower that is kinder to the skin."),
 "de": ("Duschkopf", "Hochdruck-Regenduschkopf mit drei Strahlarten, für eine Wellness-Dusche, die die Haut schont."),
 "fr": ("Pommeau de douche", "Pommeau de douche pluie haute pression à trois jets, pour une douche bien-être plus douce pour la peau."),
},
"besjaar-douchekop-met-slang-10-sproeistanden": {
 "en": ("Shower Head with Hose – 10 Spray Modes", "High-pressure rain shower head with a filter, ten spray modes and a water-saving hand shower."),
 "de": ("Duschkopf mit Schlauch – 10 Strahlarten", "Hochdruck-Regenduschkopf mit Filter, zehn Strahlarten und wassersparender Handbrause."),
 "fr": ("Pommeau de douche avec flexible – 10 jets", "Pommeau de douche pluie haute pression avec filtre, dix jets et douchette économe en eau."),
},
"besjaar-douchekop-met-slang-3-sproeistanden": {
 "en": ("Shower Head with Hose – 3 Spray Modes", "High-pressure rain shower head with hose and three spray modes, for a wellness shower."),
 "de": ("Duschkopf mit Schlauch – 3 Strahlarten", "Hochdruck-Regenduschkopf mit Schlauch und drei Strahlarten, für eine Wellness-Dusche."),
 "fr": ("Pommeau de douche avec flexible – 3 jets", "Pommeau de douche pluie haute pression avec flexible et trois jets, pour une douche bien-être."),
},
"besjaar-hoge-druk-douchekop-met-filter": {
 "en": ("High-Pressure Shower Head with Filter", "Model 1002025: ten spray modes, water-saving, in silver."),
 "de": ("Hochdruck-Duschkopf mit Filter", "Modell 1002025: zehn Strahlarten, wassersparend, in Silber."),
 "fr": ("Pommeau de douche haute pression avec filtre", "Modèle 1002025 : dix jets, économe en eau, coloris argent."),
},
"lynex-airstyler": {
 "en": ("Airstyler", "Seven-in-one multi styler: curling wand, hot air brush and airstyler in a single tool."),
 "de": ("Airstyler", "Sieben-in-eins-Multistyler: Lockenstab, Warmluftbürste und Airstyler in einem Gerät."),
 "fr": ("Brosse soufflante", "Multi-styler sept-en-un : fer à boucler, brosse soufflante et brosse chauffante en un seul appareil."),
},
"besjaar-airstyler-krultang-5-in-1": {
 "en": ("Airstyler Curling Wand 5 in 1", "Five-in-one multi styler with hot air brush, straightener and hair wrap — the 2026 model."),
 "de": ("Airstyler Lockenstab 5 in 1", "Fünf-in-eins-Multistyler mit Warmluftbürste, Glätteisen und Hair Wrap — Modelljahr 2026."),
 "fr": ("Brosse soufflante boucleur 5 en 1", "Multi-styler cinq-en-un avec brosse soufflante, lisseur et enrouleur — modèle 2026."),
},
"rynex-massage-gun": {
 "en": ("Massage Gun", "Massage gun with six speeds and four heads, supplied in a carry case."),
 "de": ("Massagepistole", "Massagepistole mit sechs Geschwindigkeiten und vier Aufsätzen, im Transportkoffer."),
 "fr": ("Pistolet de massage", "Pistolet de massage à six vitesses et quatre embouts, livré dans sa mallette."),
},
"besjaar-multistyler": {
 "en": ("Multistyler", "Five-in-one styler combining an airstyler, hot air brush, curling brush, curling wand and straightener."),
 "de": ("Multistyler", "Fünf-in-eins-Styler aus Airstyler, Warmluftbürste, Lockenbürste, Lockenstab und Glätteisen."),
 "fr": ("Multi-styler", "Styler cinq-en-un réunissant brosse soufflante, brosse chauffante, brosse boucleuse, fer à boucler et lisseur."),
},
"rynex-neusstrips": {
 "en": ("Nasal Strips", "Thirty anti-snoring nasal strips that widen the nostrils for easier breathing and better sleep."),
 "de": ("Nasenstrips", "Dreißig Anti-Schnarch-Nasenstrips, die die Nasenflügel weiten — leichter atmen, besser schlafen."),
 "fr": ("Bandelettes nasales", "Trente bandelettes nasales anti-ronflement qui élargissent les narines pour mieux respirer et mieux dormir."),
},
"rynex-pimple-patch": {
 "en": ("Pimple Patches", "144 hydrocolloid patches that draw out a spot overnight."),
 "de": ("Pickelpflaster", "144 Hydrokolloid-Pflaster, die einen Pickel über Nacht abklingen lassen."),
 "fr": ("Patchs anti-boutons", "144 patchs hydrocolloïdes qui font disparaître un bouton pendant la nuit."),
},
"lynex-thermal-brush": {
 "en": ("Thermal Brush", "Ceramic hot brush that dries and styles in one pass — an alternative to a hairdryer and airstyler."),
 "de": ("Thermobürste", "Keramik-Warmluftbürste, die in einem Durchgang trocknet und stylt — eine Alternative zu Föhn und Airstyler."),
 "fr": ("Brosse chauffante", "Brosse chauffante céramique qui sèche et coiffe en un seul passage — une alternative au sèche-cheveux et à la brosse soufflante."),
},
"besjaar-sigarettendoosje-zilver": {
 "en": ("Cigarette Case – Silver", "Sturdy aluminium cigarette case with a weather-resistant finish, in silver."),
 "de": ("Zigarettenetui – Silber", "Robustes Zigarettenetui aus Aluminium mit wetterfester Verarbeitung, in Silber."),
 "fr": ("Étui à cigarettes – argent", "Étui à cigarettes robuste en aluminium à la finition résistante aux intempéries, coloris argent."),
},
"besjaar-sigarettendoosjes-met-aansteker": {
 "en": ("Cigarette Cases with Lighter", "Sturdy aluminium cigarette case with a built-in lighter and a weather-resistant finish."),
 "de": ("Zigarettenetuis mit Feuerzeug", "Robustes Zigarettenetui aus Aluminium mit integriertem Feuerzeug und wetterfester Verarbeitung."),
 "fr": ("Étuis à cigarettes avec briquet", "Étui à cigarettes robuste en aluminium avec briquet intégré et finition résistante aux intempéries."),
},
"besjaar-sigarettendoosjes-met-aansteker-goud": {
 "en": ("Cigarette Cases with Lighter – Gold", "Sturdy aluminium cigarette case with a built-in lighter, in gold."),
 "de": ("Zigarettenetuis mit Feuerzeug – Gold", "Robustes Zigarettenetui aus Aluminium mit integriertem Feuerzeug, in Gold."),
 "fr": ("Étuis à cigarettes avec briquet – or", "Étui à cigarettes robuste en aluminium avec briquet intégré, coloris or."),
},
"besjaar-sigarettendoosjes-met-aansteker-zilver": {
 "en": ("Cigarette Cases with Lighter – Silver", "Sturdy aluminium cigarette case with a built-in lighter, in silver."),
 "de": ("Zigarettenetuis mit Feuerzeug – Silber", "Robustes Zigarettenetui aus Aluminium mit integriertem Feuerzeug, in Silber."),
 "fr": ("Étuis à cigarettes avec briquet – argent", "Étui à cigarettes robuste en aluminium avec briquet intégré, coloris argent."),
},
"besjaar-sigarettendoosjes-goud": {
 "en": ("Cigarette Cases – Gold", "Sturdy aluminium cigarette case with a weather-resistant finish, in gold."),
 "de": ("Zigarettenetuis – Gold", "Robustes Zigarettenetui aus Aluminium mit wetterfester Verarbeitung, in Gold."),
 "fr": ("Étuis à cigarettes – or", "Étui à cigarettes robuste en aluminium à la finition résistante aux intempéries, coloris or."),
},
"besjaar-sigarettendoosjes-zwart": {
 "en": ("Cigarette Cases – Black", "Sturdy aluminium cigarette case with a weather-resistant finish, in black."),
 "de": ("Zigarettenetuis – Schwarz", "Robustes Zigarettenetui aus Aluminium mit wetterfester Verarbeitung, in Schwarz."),
 "fr": ("Étuis à cigarettes – noir", "Étui à cigarettes robuste en aluminium à la finition résistante aux intempéries, coloris noir."),
},
"besjaar-sigarettendoosjes-zwart-art-7946": {
 "en": ("Cigarette Cases – Black (item 7946)", "Sturdy aluminium cigarette case with a weather-resistant finish, in black."),
 "de": ("Zigarettenetuis – Schwarz (Art. 7946)", "Robustes Zigarettenetui aus Aluminium mit wetterfester Verarbeitung, in Schwarz."),
 "fr": ("Étuis à cigarettes – noir (réf. 7946)", "Étui à cigarettes robuste en aluminium à la finition résistante aux intempéries, coloris noir."),
},
"besjaar-deurbel-draadloos-2-ontvangers": {
 "en": ("Wireless Doorbell – 2 Receivers", "Wireless doorbell with two battery-powered receivers, so you hear it upstairs as well."),
 "de": ("Funktürklingel – 2 Empfänger", "Funktürklingel mit zwei batteriebetriebenen Empfängern, damit man sie auch oben hört."),
 "fr": ("Sonnette sans fil – 2 récepteurs", "Sonnette sans fil avec deux récepteurs à piles, pour l'entendre aussi à l'étage."),
},
"besjaar-deurbel-draadloos-zwart": {
 "en": ("Wireless Doorbell – Black", "Wireless doorbell, IP44 rated and supplied with batteries, in black."),
 "de": ("Funktürklingel – Schwarz", "Funktürklingel nach IP44, inklusive Batterien, in Schwarz."),
 "fr": ("Sonnette sans fil – noir", "Sonnette sans fil certifiée IP44, piles incluses, coloris noir."),
},
"rynex-muizenval-6-stuks": {
 "en": ("Mouse Traps – 6 Pack", "Six mouse traps for indoors and outdoors — an alternative to poison."),
 "de": ("Mausefallen – 6 Stück", "Sechs Mausefallen für drinnen und draußen — eine Alternative zu Gift."),
 "fr": ("Pièges à souris – lot de 6", "Six pièges à souris pour l'intérieur et l'extérieur — une alternative au poison."),
},
"rynex-muizenval-6-stuks-muizenklem": {
 "en": ("Mouse Traps – 6 Pack, Snap Trap", "Six snap traps for indoors and outdoors — an alternative to poison."),
 "de": ("Mausefallen – 6 Stück, Schlagfalle", "Sechs Schlagfallen für drinnen und draußen — eine Alternative zu Gift."),
 "fr": ("Pièges à souris – lot de 6, tapette", "Six tapettes à souris pour l'intérieur et l'extérieur — une alternative au poison."),
},
"rynex-3x-usb-c-naar-usb-a-adapter-otg-3-0": {
 "en": ("3x USB-C to USB-A OTG 3.0 Adapter", "Three USB-C to USB-A female converters with OTG 3.0 support, in black."),
 "de": ("3x USB-C-auf-USB-A-Adapter OTG 3.0", "Drei Adapter von USB-C auf USB-A (Buchse) mit OTG-3.0-Unterstützung, in Schwarz."),
 "fr": ("3x adaptateur USB-C vers USB-A OTG 3.0", "Trois convertisseurs USB-C vers USB-A femelle compatibles OTG 3.0, coloris noir."),
},
"rynex-aluminium-laptop-standaard": {
 "en": ("Aluminium Laptop Stand", "Adjustable ergonomic aluminium laptop stand for home and the office, in silver."),
 "de": ("Aluminium-Laptopständer", "Verstellbarer ergonomischer Laptopständer aus Aluminium für zu Hause und fürs Büro, in Silber."),
 "fr": ("Support d'ordinateur portable en aluminium", "Support ergonomique réglable en aluminium pour ordinateur portable, à la maison comme au bureau, coloris argent."),
},
"rynex-sd-kaart-lezer": {
 "en": ("SD Card Reader", "Three-in-one SD, TF and USB 3.0 card reader with USB-C, converter included."),
 "de": ("SD-Kartenleser", "Drei-in-eins-Kartenleser für SD, TF und USB 3.0 mit USB-C, Adapter inklusive."),
 "fr": ("Lecteur de carte SD", "Lecteur de cartes trois-en-un SD, TF et USB 3.0 avec USB-C, convertisseur inclus."),
},
"rynex-telefoonhouder-fiets": {
 "en": ("Bike Phone Mount", "Phone mount for bike, scooter and motorbike, rotating 360° with anti-shock damping."),
 "de": ("Fahrrad-Handyhalterung", "Handyhalterung für Fahrrad, Roller und Motorrad, um 360° drehbar und stoßgedämpft."),
 "fr": ("Support téléphone vélo", "Support de téléphone pour vélo, scooter et moto, rotatif à 360° et anti-vibrations."),
},
"rynex-telefoonhouders-auto-ventilatie": {
 "en": ("Car Vent Phone Mounts", "Universal phone mount for the car's air vent, rotating 360° and holding firm."),
 "de": ("Auto-Lüftungs-Handyhalterungen", "Universelle Handyhalterung für die Lüftung im Auto, um 360° drehbar und fest sitzend."),
 "fr": ("Supports téléphone pour grille d'aération", "Support de téléphone universel pour grille d'aération, rotatif à 360° et bien maintenu."),
},
"rynex-universele-wereldstekker": {
 "en": ("Universal Travel Adaptor", "Universal travel adaptor for more than 150 countries, with USB-C and USB ports."),
 "de": ("Universal-Reisestecker", "Universeller Reisestecker für über 150 Länder, mit USB-C- und USB-Anschluss."),
 "fr": ("Adaptateur de voyage universel", "Adaptateur de voyage universel pour plus de 150 pays, avec ports USB-C et USB."),
},
"besjaar-kweeklamp-led-voor-planten": {
 "en": ("LED Grow Light for Plants", "Four 40 W grow lights with 80 LEDs each, for houseplants and seedlings."),
 "de": ("LED-Pflanzenlampe", "Vier Pflanzenlampen mit je 80 LEDs und 40 W, für Zimmerpflanzen und Anzuchten."),
 "fr": ("Lampe de croissance LED pour plantes", "Quatre lampes de croissance de 40 W à 80 LED chacune, pour plantes d'intérieur et semis."),
},
"besjaar-solar-buitenverlichting": {
 "en": ("Solar Outdoor Lighting", "Solar wall light with a motion sensor, IP65 rated, for the garden and the drive."),
 "de": ("Solar-Außenbeleuchtung", "Solar-Wandleuchte mit Bewegungssensor, nach IP65, für Garten und Einfahrt."),
 "fr": ("Éclairage extérieur solaire", "Applique solaire à détecteur de mouvement, certifiée IP65, pour le jardin et l'allée."),
},
"rynex-keukenweegschaal-digitaal-incl-batterijen": {
 "en": ("Digital Kitchen Scale – Batteries Included", "Precision kitchen scale up to 10 kg with an LCD display and tare function, batteries included."),
 "de": ("Digitale Küchenwaage – inkl. Batterien", "Präzisions-Küchenwaage bis 10 kg mit LCD-Display und Tara-Funktion, Batterien inklusive."),
 "fr": ("Balance de cuisine numérique – piles incluses", "Balance de cuisine de précision jusqu'à 10 kg, écran LCD et fonction tare, piles incluses."),
},
"rynex-keukenweegschaal-digitaal-tot-10-kg": {
 "en": ("Digital Kitchen Scale – up to 10 kg", "Kitchen scale weighing up to 10 kg, with a tare function and batteries included."),
 "de": ("Digitale Küchenwaage – bis 10 kg", "Küchenwaage bis 10 kg, mit Tara-Funktion und Batterien."),
 "fr": ("Balance de cuisine numérique – jusqu'à 10 kg", "Balance de cuisine jusqu'à 10 kg, avec fonction tare et piles incluses."),
},
"rynex-twinmarkers-168-stuks": {
 "en": ("Twin Markers, 168 Pack", "168 double-ended alcohol markers for drawing, illustration and hand lettering."),
 "de": ("Twinmarker, 168 Stück", "168 doppelseitige Alkoholmarker zum Zeichnen, Illustrieren und Handlettering."),
 "fr": ("Marqueurs double pointe, lot de 168", "168 marqueurs à alcool double pointe pour le dessin, l'illustration et le lettrage."),
},
"rynex-twinmarkers-80-stuks": {
 "en": ("Twin Markers, 80 Pack", "80 double-ended alcohol markers for drawing, illustration and hand lettering."),
 "de": ("Twinmarker, 80 Stück", "80 doppelseitige Alkoholmarker zum Zeichnen, Illustrieren und Handlettering."),
 "fr": ("Marqueurs double pointe, lot de 80", "80 marqueurs à alcool double pointe pour le dessin, l'illustration et le lettrage."),
},
})

import json, io

def js(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)

out = io.StringIO()
out.write('''/**
 * NL/EN/DE/FR content for the catalogue bundled with the application.
 *
 * Supabase is the production catalogue and carries its own `translations`
 * column. This file is the same thing for the fallback catalogue the shop
 * serves when Supabase is not configured — a fresh checkout, CI, a preview
 * build or an outage. Without it, switching to English, German or French left
 * every product name, every category and every brand description in Dutch,
 * so the interface translated around content that did not.
 *
 * Dutch is not repeated here. It lives in catalogue.generated.ts as the base
 * text, and `localize()` falls back to it for any field a language is missing
 * — so a gap shows the Dutch original, never an empty string or a key.
 *
 * Generated by scripts/build_catalogue_translations.py from translations
 * written by hand. They are written, not machine-produced: a mistranslated
 * product name is a description of something the customer is not buying.
 */

import type { Translations } from "@/lib/content-i18n";

''')

out.write("/** Keyed by category slug. */\nexport const CATALOGUE_CATEGORY_TRANSLATIONS: Record<string, Translations> = {\n")
for slug, langs in CATEGORIES.items():
    out.write(f"  {js(slug)}: {{\n")
    for loc in ("en", "de", "fr"):
        name, desc = langs[loc]
        out.write(f"    {loc}: {{ name: {js(name)}, description: {js(desc)} }},\n")
    out.write("  },\n")
out.write("};\n\n")

out.write("/** Keyed by brand slug. Brand names are proper nouns and are not translated. */\nexport const CATALOGUE_BRAND_TRANSLATIONS: Record<string, Translations> = {\n")
for slug, langs in BRANDS.items():
    out.write(f"  {js(slug)}: {{\n")
    for loc in ("en", "de", "fr"):
        out.write(f"    {loc}: {{ description: {js(langs[loc])} }},\n")
    out.write("  },\n")
out.write("};\n\n")

out.write("/** Keyed by product slug. */\nexport const CATALOGUE_PRODUCT_TRANSLATIONS: Record<string, Translations> = {\n")
for slug, langs in PRODUCTS.items():
    out.write(f"  {js(slug)}: {{\n")
    for loc in ("en", "de", "fr"):
        name, desc = langs[loc]
        out.write(
            f"    {loc}: {{\n"
            f"      name: {js(name)},\n"
            f"      short_description: {js(desc)},\n"
            f"      full_description: {js(desc)},\n"
            f"    }},\n"
        )
    out.write("  },\n")
out.write("};\n")

open("src/data/catalogue-translations.ts", "w").write(out.getvalue())
print("wrote src/data/catalogue-translations.ts")
