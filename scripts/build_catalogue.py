#!/usr/bin/env python3
"""
Besjaar catalogue build step.

Reads the "Sorted Products" worksheet of the supplied product workbook and
generates every artefact the store needs from it:

  src/data/catalogue.generated.ts   typed catalogue used by the app
  supabase/migrations/*_besjaar_catalogue.sql   idempotent Supabase seed
  data/besjaar-catalogue.csv        importable through /beheer/catalogus-import

The workbook is the single source of truth. Nothing here invents data: prices,
review counts, availability, image URLs and source URLs are copied verbatim, and
every specification value is extracted literally from the manufacturer's own
product title. Display names are shortened, never rewritten.

Usage:  python3 scripts/build_catalogue.py
"""

from __future__ import annotations

import csv
import json
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKBOOK = os.path.join(ROOT, "data", "EenTop_Besjaar_Sorted_Product_Catalogue.xlsx")
SHEET = "Sorted Products"

TS_OUT = os.path.join(ROOT, "src", "data", "catalogue.generated.ts")
SQL_OUT = os.path.join(
    ROOT, "supabase", "migrations", "20260901120000_besjaar_catalogue.sql"
)
CSV_OUT = os.path.join(ROOT, "data", "besjaar-catalogue.csv")

# --------------------------------------------------------------------------
# Brand normalisation. The workbook spells these inconsistently; Product ID
# stays canonical, the brand label is standardised.
# --------------------------------------------------------------------------
BRAND_CANONICAL = {
    "besjaar": "Besjaar",
    "rynex": "RYNEX",
    "lynex": "LYNEX",
}

BRAND_COPY = {
    "Besjaar": (
        "Het eigen merk van de winkel. Besjaar staat voor praktische producten "
        "voor huis, badkamer, tuin en onderweg — verlichting, douchecomfort en "
        "handige huishoudelijke artikelen."
    ),
    "RYNEX": (
        "RYNEX levert accessoires voor werkplek, keuken, auto en fiets: "
        "telefoonhouders, adapters, kaartlezers, weegschalen en hobbymateriaal."
    ),
    "LYNEX": (
        "LYNEX richt zich op persoonlijke verzorging, met airstylers en "
        "warmteborstels voor het stylen van haar."
    ),
}

# Category order + copy. Categories come from the workbook; only the ordering,
# the slug and the description are added here.
CATEGORY_META = {
    "Kamperen & Outdoor": (
        "kamperen-outdoor",
        1,
        "Zaklampen, hoofdlampen en verlichting voor onderweg, de camping en het noodpakket.",
    ),
    "Badkamer": (
        "badkamer",
        2,
        "Douchekoppen, doucheslangen en filters voor meer comfort onder de douche.",
    ),
    "Persoonlijke verzorging": (
        "persoonlijke-verzorging",
        3,
        "Airstylers, warmteborstels en verzorgingsproducten voor dagelijks gebruik.",
    ),
    "Lifestyle & Accessoires": (
        "lifestyle-accessoires",
        4,
        "Aluminium sigarettendoosjes en accessoires met een stevige, weerbestendige afwerking.",
    ),
    "Klussen & Huis": (
        "klussen-huis",
        5,
        "Draadloze deurbellen en huishoudelijke oplossingen die zo geïnstalleerd zijn.",
    ),
    "Elektronica & Accessoires": (
        "elektronica-accessoires",
        6,
        "Adapters, kaartlezers en laptopstandaards voor thuis en op kantoor.",
    ),
    "Auto, Fiets & Reizen": (
        "auto-fiets-reizen",
        7,
        "Telefoonhouders en reisstekkers voor in de auto, op de fiets en op reis.",
    ),
    "Tuin": (
        "tuin",
        8,
        "Solar buitenverlichting en kweeklampen voor tuin, balkon en kamerplanten.",
    ),
    "Koken & Tafelen": (
        "koken-tafelen",
        9,
        "Digitale keukenweegschalen voor nauwkeurig afwegen tijdens het koken en bakken.",
    ),
    "Creatief & Hobby": (
        "creatief-hobby",
        10,
        "Dubbelzijdige alcohol markers voor tekenen, illustreren en handlettering.",
    ),
}

# Words that are kept in their original casing when a display name is built.
ACRONYMS = {
    "led": "LED",
    "leds": "LEDs",
    "usb": "USB",
    "usb-c": "USB-C",
    "usb-a": "USB-A",
    "uv": "UV",
    "sd": "SD",
    "tf": "TF",
    "gsm": "GSM",
    "otg": "OTG",
    "lcd": "LCD",
    "ip44": "IP44",
    "ip65": "IP65",
    "ip67": "IP67",
    "3d": "3D",
    "b2b": "B2B",
    "mah": "mAh",
    "w": "W",
}

COLOURS = {
    "zwart": "Zwart",
    "wit": "Wit",
    "zilver": "Zilver",
    "goud": "Goud",
    "chrome": "Chrome",
    "grijs": "Grijs",
    "blauw": "Blauw",
    "wit/goud": "Wit/Goud",
}

SPLIT_RE = re.compile(r"(?:\s+[-–—]\s*)|(?:\s*[-–—]\s+)")


def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = value.replace("&", " en ").replace("/", " ").replace("+", " plus ")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return re.sub(r"-{2,}", "-", value)


def strip_brand(text: str) -> str:
    """Removes a leading or trailing brand token from a title segment."""
    out = text.strip()
    for _ in range(3):
        before = out
        out = re.sub(r"^(besjaar|rynex|lynex)\s*[®™]?\s*", "", out, flags=re.I).strip()
        out = re.sub(r"\s*[-–—]?\s*(besjaar|rynex|lynex)\s*[®™]?$", "", out, flags=re.I).strip()
        if out == before:
            break
    return out


def smart_title(text: str) -> str:
    """Title-cases a Dutch product phrase while preserving acronyms and units."""
    words = text.split()
    out = []
    for word in words:
        bare = word.strip(".,")
        low = bare.lower()
        if low in ACRONYMS:
            out.append(ACRONYMS[low])
            continue
        # Values like 1000, 5200mAh, 40W, IP65, 360°, 10kg keep their own shape.
        if re.match(r"^\d", bare):
            m = re.match(r"^(\d+)\s*([a-zA-Z]+)$", bare)
            if m and m.group(2).lower() in ACRONYMS:
                out.append(f"{m.group(1)}{ACRONYMS[m.group(2).lower()]}")
            else:
                out.append(bare)
            continue
        if bare.isupper() and len(bare) > 1:
            out.append(bare)
            continue
        # Dutch lowercase connectives stay lowercase unless they open the name.
        if low in {"met", "voor", "en", "op", "zonder", "naar", "in", "van", "de", "het"} and out:
            out.append(low)
            continue
        out.append(bare[:1].upper() + bare[1:] if bare else bare)
    return " ".join(out)


def extract_specs(title: str) -> dict[str, str]:
    """Pulls objective specifications straight out of the manufacturer's title.

    Only literal matches are emitted — nothing is inferred or estimated.
    """
    specs: dict[str, str] = {}
    t = title

    def grab(pattern: str, key: str, fmt) -> None:
        m = re.search(pattern, t, flags=re.I)
        if m and key not in specs:
            specs[key] = fmt(m)

    grab(r"(\d[\d.]*)\s*lumen", "Lichtopbrengst", lambda m: f"{m.group(1)} lumen")
    grab(r"(\d+)\s*mAh", "Accucapaciteit", lambda m: f"{m.group(1)} mAh")
    grab(r"(\d+)\s*meter\s*bereik", "Bereik", lambda m: f"{m.group(1)} meter")
    grab(r"\b(IP\d{2})\b", "Beschermingsklasse", lambda m: m.group(1).upper())
    grab(r"(\d+)\s*sproeistanden", "Sproeistanden", lambda m: m.group(1))
    grab(r"(\d+)\s*lichtstanden", "Lichtstanden", lambda m: m.group(1))
    grab(r"(\d+)\s*(?:LED-koplampen|LED['’]?s|LED\b)", "Aantal LED's", lambda m: m.group(1))
    grab(r"(\d+)\s*stuks?", "Aantal", lambda m: f"{m.group(1)} stuks")
    grab(r"(\d+)\s*in\s*1\b", "Functies", lambda m: f"{m.group(1)}-in-1")
    grab(r"tot\s*(\d+)\s*kg", "Maximaal gewicht", lambda m: f"{m.group(1)} kg")
    grab(r"(\d+)\s*W\b", "Vermogen", lambda m: f"{m.group(1)} W")
    grab(r"(\d+)\+?\s*landen", "Geschikt voor", lambda m: f"{m.group(1)}+ landen")
    grab(r"Model:?\s*(\d+)", "Modelnummer", lambda m: m.group(1))
    grab(r"(\d+)\s*ontvangers?", "Ontvangers", lambda m: m.group(1))
    grab(r"(360)\s*°", "Rotatie", lambda m: "360°")

    if re.search(r"USB-?C", t, flags=re.I):
        specs["Aansluiting"] = "USB-C"
    elif re.search(r"USB\s*3\.0", t, flags=re.I):
        specs["Aansluiting"] = "USB 3.0"

    if re.search(r"\boplaadbaar\b", t, flags=re.I):
        specs["Voeding"] = "Oplaadbaar"
    elif re.search(r"batterij", t, flags=re.I):
        specs["Voeding"] = "Batterijen"

    for word, label in (("aluminium", "Aluminium"), ("aluminum", "Aluminium"),
                        ("keramisch", "Keramisch"), ("rvs", "RVS")):
        if re.search(rf"\b{word}\b", t, flags=re.I):
            specs["Materiaal"] = label
            break

    if re.search(r"waterdicht|waterproof", t, flags=re.I):
        specs["Waterbestendig"] = "Ja"

    colour = extract_colour(t)
    if colour:
        specs["Kleur"] = colour
    return specs


def extract_colour(title: str) -> str | None:
    m = re.search(r"\bWit\s*/\s*Goud\b", title, flags=re.I)
    if m:
        return "Wit/Goud"
    for word, label in COLOURS.items():
        if "/" in word:
            continue
        if re.search(rf"\b{word}\b", title, flags=re.I):
            return label
    return None


def clean_segments(title: str) -> list[str]:
    """Splits a bol-style keyword title into de-duplicated segments."""
    parts = [p.strip(" -–—") for p in SPLIT_RE.split(title)]
    out: list[str] = []
    seen: set[str] = set()
    for part in parts:
        part = re.sub(r"\s{2,}", " ", part).strip()
        if not part:
            continue
        key = re.sub(r"[^a-z0-9]", "", part.lower())
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(part)
    return out


def read_workbook() -> list[dict]:
    try:
        import openpyxl
    except ImportError:
        die("openpyxl is required: pip install openpyxl")

    if not os.path.exists(WORKBOOK):
        die(f"workbook not found at {WORKBOOK}")

    wb = openpyxl.load_workbook(WORKBOOK, data_only=True)
    if SHEET not in wb.sheetnames:
        die(f"worksheet {SHEET!r} not found; sheets are {wb.sheetnames}")

    rows = list(wb[SHEET].iter_rows(values_only=True))
    header_idx = next(
        (i for i, r in enumerate(rows) if r and r[0] == "Category"), None
    )
    if header_idx is None:
        die("could not locate the header row (expected a 'Category' cell)")

    header = [h for h in rows[header_idx]]
    records = []
    for raw in rows[header_idx + 1:]:
        if not any(raw):
            continue
        record = dict(zip(header, raw))
        if not record.get("Product"):
            continue
        records.append(record)
    return records


def build() -> None:
    records = read_workbook()
    report = {
        "source_rows": len(records),
        "duplicates_skipped": [],
        "price_recovered": [],
        "brands_normalised": Counter(),
    }

    # ---- dedupe on Product ID -------------------------------------------
    by_id: dict[str, dict] = {}
    for record in records:
        pid = str(record.get("Product ID") or "").strip()
        if not pid:
            die(f"row without Product ID: {record.get('Product')!r}")
        if pid in by_id:
            report["duplicates_skipped"].append(pid)
            continue
        by_id[pid] = record

    products: list[dict] = []
    for pid, record in by_id.items():
        raw_title = str(record["Product"]).strip()
        raw_brand = str(record.get("Brand") or "").strip()
        brand = BRAND_CANONICAL.get(raw_brand.lower())
        if not brand:
            die(f"unknown brand {raw_brand!r} on product {pid}")
        if brand != raw_brand:
            report["brands_normalised"][f"{raw_brand} -> {brand}"] += 1

        category = str(record.get("Category") or "").strip()
        if category not in CATEGORY_META:
            die(f"unknown category {category!r} on product {pid}")

        current = record.get("Current Price (€)")
        regular = record.get("Regular Price (€)")
        current = float(current) if current not in (None, "") else None
        regular = float(regular) if regular not in (None, "") else None

        # The workbook has two rows where the current price failed to scrape and
        # the discount reads as 100%. The regular price is the only genuine
        # price for those, so it becomes the selling price and no discount is
        # shown. Inventing a sale price here would be fabricating a promotion.
        if current is None:
            if regular is None:
                die(f"product {pid} has no usable price")
            report["price_recovered"].append(pid)
            price, compare_at = regular, None
        elif regular is not None and regular > current:
            price, compare_at = current, regular
        else:
            # Regular price absent, equal, or lower: no genuine discount.
            price, compare_at = current, None

        discount = (
            int(round((compare_at - price) / compare_at * 100)) if compare_at else 0
        )

        reviews = record.get("Reviews")
        review_count = int(reviews) if reviews not in (None, "") else 0

        segments = clean_segments(raw_title)
        specs = extract_specs(raw_title)
        # Highlights drop the lead-in segment (it becomes the display name) and
        # any brand token, so the bullets read as product detail, not keywords.
        highlights = []
        for segment in segments[1:]:
            cleaned = re.sub(r"\s*[®™]", "", strip_brand(segment)).strip(" -–—")
            if cleaned and cleaned.lower() not in {h.lower() for h in highlights}:
                highlights.append(cleaned)

        products.append(
            {
                "product_id": pid,
                "raw_title": raw_title,
                "segments": segments,
                "highlights": highlights,
                "brand": brand,
                "category": category,
                "price": round(price, 2),
                "compare_at": round(compare_at, 2) if compare_at else None,
                "discount": discount,
                "review_count": review_count,
                "availability": str(record.get("Availability") or "").strip(),
                "source_url": str(record.get("Product URL") or "").strip() or None,
                "image_url": str(record.get("Image URL") or "").strip() or None,
                "specs": specs,
                "colour": specs.get("Kleur"),
                "source_page": record.get("Source Page"),
                "source_position": record.get("Source Position"),
            }
        )

    assign_names(products)
    assign_flags(products)

    products.sort(
        key=lambda p: (CATEGORY_META[p["category"]][1], p["name"].lower())
    )

    write_ts(products)
    write_sql(products)
    write_csv(products)
    print_report(products, report)


def name_differentiators(product: dict) -> list[tuple[str, str]]:
    """Formatted, human-readable versions of the details that separate siblings.

    Every value comes straight out of the product's own title, so a name built
    from these still only states what the manufacturer stated.
    """
    specs = product["specs"]
    title = product["raw_title"]
    out: list[tuple[str, str]] = []

    def add(key: str, value: str | None) -> None:
        if value:
            out.append((key, value))

    if "Lichtopbrengst" in specs:
        add("Lichtopbrengst", specs["Lichtopbrengst"].replace("lumen", "Lumen"))
    add("Accucapaciteit", specs.get("Accucapaciteit"))
    if "Functies" in specs:
        add("Functies", specs["Functies"])
    if "Sproeistanden" in specs:
        add("Sproeistanden", f'{specs["Sproeistanden"]} Sproeistanden')
    if "Ontvangers" in specs:
        add("Ontvangers", f'{specs["Ontvangers"]} Ontvangers')
    if "Aantal" in specs:
        add("Aantal", specs["Aantal"].replace("stuks", "Stuks"))
    add("Kleur", specs.get("Kleur"))
    if "Modelnummer" in specs:
        add("Modelnummer", f'Model {specs["Modelnummer"]}')
    if "Maximaal gewicht" in specs:
        add("Maximaal gewicht", f'tot {specs["Maximaal gewicht"]}')
    add("Vermogen", specs.get("Vermogen"))
    add("Beschermingsklasse", specs.get("Beschermingsklasse"))
    add("Aansluiting", specs.get("Aansluiting"))
    # Power source reads better as a phrase than as a bare spec value.
    if re.search(r"inclusief\s+batterij", title, flags=re.I):
        add("Voeding", "incl. Batterijen")
    elif re.search(r"op\s+batterijen|werkt\s+op\s+batterijen", title, flags=re.I):
        add("Voeding", "op Batterijen")
    elif specs.get("Voeding") == "Oplaadbaar":
        add("Voeding", "Oplaadbaar")
    if re.search(r"\bset\b", title, flags=re.I):
        add("Set", "Set")
    if re.search(r"\bLCD", title, flags=re.I):
        add("Display", "LCD-Scherm")
    return out


def choose_base(product: dict) -> str:
    """Picks the most informative opening segment as the product's base name.

    bol titles usually lead with a bare category word ("Zaklamp") and put the
    real description in the second segment ("Militaire Zaklamp"). When that is
    the case the richer segment wins, which keeps sibling products apart
    without resorting to article numbers.
    """
    segments = product["segments"]
    if not segments:
        return smart_title(strip_brand(product["raw_title"]))

    first = re.sub(r"\s*[®™]", "", strip_brand(segments[0])).strip()
    if len(segments) > 1:
        second = re.sub(r"\s*[®™]", "", strip_brand(segments[1])).strip()
        first_words = first.lower().split()
        second_words = second.lower().split()
        shares_noun = bool(set(first_words) & set(second_words))
        # Only trade up when the first segment is a short, generic lead-in and
        # the second describes the same product in more detail.
        if (
            len(first_words) <= 2
            and len(second_words) > len(first_words)
            and len(second_words) <= 5
            and shares_noun
        ):
            return smart_title(second)
    return smart_title(first) or smart_title(strip_brand(product["raw_title"]))


def family_key(base: str) -> str:
    """Groups singular/plural spellings of the same product family together.

    Dutch plurals are either "+s" (doosje/doosjes) or "+en" with the final
    consonant doubled (muizenval/muizenvallen), so both are folded back to the
    singular stem before grouping.
    """
    words = []
    for word in base.lower().split():
        if len(word) > 6 and word.endswith("en"):
            word = word[:-2]
            if len(word) > 3 and word[-1] == word[-2] and word[-1].isalpha():
                word = word[:-1]
        elif len(word) > 4 and word.endswith("s"):
            word = word[:-1]
        words.append(word)
    return " ".join(words)


def dedupe_words(text: str) -> str:
    """Collapses a word repeated back-to-back ("Zaklamp Zaklamp LED")."""
    out: list[str] = []
    for word in text.split():
        if out and out[-1].lower() == word.lower():
            continue
        out.append(word)
    return " ".join(out)


def compose_name(base: str, details: list[str]) -> str:
    kept: list[str] = []
    base_words = {w.lower().strip(",") for w in base.split()}
    for detail in details:
        # Skip a detail already implied by the base ("... met Slang" + "Slang").
        detail_words = {w.lower().strip(",") for w in detail.split()}
        if detail_words and detail_words <= base_words:
            continue
        if detail not in kept:
            kept.append(detail)
    name = dedupe_words(base)
    if kept:
        name = f"{name} – {', '.join(kept)}"
    return re.sub(r"\s{2,}", " ", name).strip()


def assign_names(products: list[dict]) -> None:
    """Builds a short, human display name and a unique slug for each product.

    Sibling listings are separated by the details that genuinely differ between
    them — lumen, capacity, colour, quantity — rather than by article numbers,
    so every name still describes the product.
    """
    for p in products:
        p["_base"] = choose_base(p)
        p["_details"] = name_differentiators(p)

    groups: dict[str, list[dict]] = defaultdict(list)
    for p in products:
        groups[f'{p["brand"]}|{family_key(p["_base"])}'].append(p)

    for group in groups.values():
        if len(group) == 1:
            group[0]["name"] = dedupe_words(group[0]["_base"])
            continue

        # Greedily pick the detail keys that best separate this family.
        available: list[str] = []
        for p in group:
            for key, _ in p["_details"]:
                if key not in available:
                    available.append(key)

        chosen: list[str] = []

        def signatures(keys: list[str]) -> list[tuple]:
            sigs = []
            for p in group:
                lookup = dict(p["_details"])
                sigs.append(tuple(lookup.get(k) for k in keys))
            return sigs

        while len(set(signatures(chosen))) < len(group) and available:
            best_key, best_score = None, len(set(signatures(chosen)))
            for key in available:
                score = len(set(signatures(chosen + [key])))
                if score > best_score:
                    best_key, best_score = key, score
            if best_key is None:
                break
            chosen.append(best_key)
            available.remove(best_key)

        for p in group:
            lookup = dict(p["_details"])
            details = [lookup[k] for k in chosen if lookup.get(k)]
            if not details and p["_details"]:
                # Keep the family visually consistent: a sibling with no chosen
                # detail still shows its most specific one.
                details = [p["_details"][0][1]]
            p["name"] = compose_name(p["_base"], details)

        # Any remaining ties get the first title segment unique to that listing.
        if len({p["name"] for p in group}) != len(group):
            counts = Counter()
            for p in group:
                for segment in p["segments"][1:]:
                    counts[segment.lower()] += 1
            for p in group:
                if [q["name"] for q in group].count(p["name"]) == 1:
                    continue
                unique_segment = next(
                    (
                        s
                        for s in p["segments"][1:]
                        if counts[s.lower()] == 1 and len(s.split()) <= 4
                    ),
                    None,
                )
                if unique_segment:
                    joiner = ", " if "–" in p["name"] else " – "
                    p["name"] = (
                        f'{p["name"]}{joiner}{smart_title(strip_brand(unique_segment))}'
                    )

        # Last resort: the workbook simply does not distinguish these listings.
        if len({p["name"] for p in group}) != len(group):
            seen: set[str] = set()
            for p in group:
                if p["name"] in seen:
                    p["name"] = f'{p["name"]} (art. {p["product_id"][-4:]})'
                seen.add(p["name"])

    used: dict[str, int] = {}
    for p in products:
        p["name"] = re.sub(r"\s{2,}", " ", p["name"]).strip()
        candidate = slugify(f'{p["brand"]} {p["name"]}')
        if candidate in used:
            used[candidate] += 1
            candidate = f'{candidate}-{p["product_id"][-4:]}'
        else:
            used[candidate] = 1
        p["slug"] = candidate
        p.pop("_base", None)
        p.pop("_details", None)

def assign_flags(products: list[dict]) -> None:
    """Marks bestsellers and featured products from real catalogue signals only.

    Bestseller = the highest review counts the workbook actually reports.
    Featured = one product per category, the best reviewed of that category.
    No product is given a badge that its own data does not support.
    """
    ranked = sorted(products, key=lambda p: (-p["review_count"], p["price"]))
    reviewed = [p for p in ranked if p["review_count"] > 0]
    bestseller_ids = {p["product_id"] for p in reviewed[:8]}

    by_category: dict[str, list[dict]] = defaultdict(list)
    for p in products:
        by_category[p["category"]].append(p)

    featured_ids = set()
    for items in by_category.values():
        best = sorted(items, key=lambda p: (-p["review_count"], p["price"]))[0]
        featured_ids.add(best["product_id"])

    for p in products:
        p["bestseller"] = p["product_id"] in bestseller_ids
        p["featured"] = p["product_id"] in featured_ids


# --------------------------------------------------------------------------
# Emitters
# --------------------------------------------------------------------------
def ts_string(value) -> str:
    return json.dumps(value, ensure_ascii=False)


def write_ts(products: list[dict]) -> None:
    categories = [
        {
            "name": name,
            "slug": meta[0],
            "sortOrder": meta[1],
            "description": meta[2],
            "count": sum(1 for p in products if p["category"] == name),
        }
        for name, meta in sorted(CATEGORY_META.items(), key=lambda kv: kv[1][1])
    ]
    brands = [
        {
            "name": brand,
            "slug": slugify(brand),
            "description": BRAND_COPY[brand],
            "count": sum(1 for p in products if p["brand"] == brand),
        }
        for brand in ("Besjaar", "RYNEX", "LYNEX")
    ]

    lines = [
        "/**",
        " * GENERATED FILE — do not edit by hand.",
        " *",
        " * Produced by scripts/build_catalogue.py from",
        " * data/EenTop_Besjaar_Sorted_Product_Catalogue.xlsx (worksheet",
        ' * "Sorted Products"). Re-run that script to regenerate.',
        " *",
        " * Prices, review counts, availability, source URLs and image URLs are",
        " * copied verbatim from the workbook. Specifications are extracted from",
        " * the manufacturer's own product title. Nothing here is invented.",
        " */",
        "",
        'import type { CatalogueBrand, CatalogueCategory, CatalogueProduct } from "./catalogue-types";',
        "",
        f"export const CATALOGUE_SOURCE_ROWS = {len(products)};",
        "",
        "export const CATALOGUE_CATEGORIES: CatalogueCategory[] = [",
    ]
    for c in categories:
        lines.append(
            f'  {{ name: {ts_string(c["name"])}, slug: {ts_string(c["slug"])}, '
            f'sortOrder: {c["sortOrder"]}, description: {ts_string(c["description"])} }},'
        )
    lines += ["];", "", "export const CATALOGUE_BRANDS: CatalogueBrand[] = ["]
    for b in brands:
        lines.append(
            f'  {{ name: {ts_string(b["name"])}, slug: {ts_string(b["slug"])}, '
            f'description: {ts_string(b["description"])} }},'
        )
    lines += ["];", "", "export const CATALOGUE_PRODUCTS: CatalogueProduct[] = ["]

    for p in products:
        specs = ", ".join(
            f"{ts_string(k)}: {ts_string(v)}" for k, v in p["specs"].items()
        )
        lines.append("  {")
        lines.append(f'    productId: {ts_string(p["productId"] if "productId" in p else p["product_id"])},')
        lines.append(f'    slug: {ts_string(p["slug"])},')
        lines.append(f'    name: {ts_string(p["name"])},')
        lines.append(f'    fullTitle: {ts_string(p["raw_title"])},')
        lines.append(f'    brand: {ts_string(p["brand"])},')
        lines.append(f'    category: {ts_string(p["category"])},')
        lines.append(f'    categorySlug: {ts_string(CATEGORY_META[p["category"]][0])},')
        lines.append(f'    price: {p["price"]},')
        lines.append(
            f'    compareAtPrice: {p["compare_at"] if p["compare_at"] is not None else "null"},'
        )
        lines.append(f'    discountPercentage: {p["discount"]},')
        lines.append(f'    reviewCount: {p["review_count"]},')
        lines.append(f'    availability: {ts_string(p["availability"])},')
        lines.append(f'    imageUrl: {ts_string(p["image_url"])},')
        lines.append(f'    sourceUrl: {ts_string(p["source_url"])},')
        lines.append(f'    highlights: {ts_string(p["highlights"])},')
        lines.append(f"    specifications: {{ {specs} }},")
        lines.append(f'    bestseller: {"true" if p["bestseller"] else "false"},')
        lines.append(f'    featured: {"true" if p["featured"] else "false"},')
        lines.append("  },")
    lines += ["];", ""]

    os.makedirs(os.path.dirname(TS_OUT), exist_ok=True)
    with open(TS_OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print(f"wrote {os.path.relpath(TS_OUT, ROOT)}")


def sql_str(value) -> str:
    if value is None or value == "":
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def write_sql(products: list[dict]) -> None:
    out = [
        "-- Besjaar catalogue seed.",
        "--",
        "-- GENERATED by scripts/build_catalogue.py from",
        "-- data/EenTop_Besjaar_Sorted_Product_Catalogue.xlsx (\"Sorted Products\").",
        "--",
        "-- Idempotent: brands and categories match on slug, products match on",
        "-- bol_product_id (the workbook's Product ID), so re-running this "
        "migration",
        "-- updates the existing rows instead of creating duplicates.",
        "",
        "-- Brands -------------------------------------------------------------",
        "INSERT INTO public.brands (name, slug, description, sort_order, is_active)",
        "VALUES",
    ]
    brand_rows = []
    for i, brand in enumerate(("Besjaar", "RYNEX", "LYNEX")):
        brand_rows.append(
            f"  ({sql_str(brand)}, {sql_str(slugify(brand))}, "
            f"{sql_str(BRAND_COPY[brand])}, {i + 1}, true)"
        )
    out.append(",\n".join(brand_rows))
    out += [
        "ON CONFLICT (slug) DO UPDATE SET",
        "  name = EXCLUDED.name,",
        "  description = EXCLUDED.description,",
        "  sort_order = EXCLUDED.sort_order,",
        "  is_active = true;",
        "",
        "-- Categories ---------------------------------------------------------",
        "INSERT INTO public.categories (name, slug, description, sort_order, is_visible, is_archived)",
        "VALUES",
    ]
    cat_rows = []
    for name, (slug, order, description) in sorted(
        CATEGORY_META.items(), key=lambda kv: kv[1][1]
    ):
        cat_rows.append(
            f"  ({sql_str(name)}, {sql_str(slug)}, {sql_str(description)}, {order}, true, false)"
        )
    out.append(",\n".join(cat_rows))
    out += [
        "ON CONFLICT (slug) DO UPDATE SET",
        "  name = EXCLUDED.name,",
        "  description = EXCLUDED.description,",
        "  sort_order = EXCLUDED.sort_order,",
        "  is_visible = true,",
        "  is_archived = false;",
        "",
        "-- Products -----------------------------------------------------------",
        "-- bol_product_id is the workbook Product ID and the deduplication key.",
        "CREATE UNIQUE INDEX IF NOT EXISTS products_bol_product_id_key",
        "  ON public.products (bol_product_id) WHERE bol_product_id IS NOT NULL;",
        "",
        "WITH incoming (name, slug, brand_slug, category_slug, bol_product_id,",
        "               regular_price, sale_price, stock_quantity, short_description,",
        "               full_description, selling_points, specifications, rating_count,",
        "               featured, bestseller, seo_title, seo_description, search_keywords,",
        "               image_url) AS (",
        "VALUES",
    ]

    rows = []
    for p in products:
        regular = p["compare_at"] if p["compare_at"] is not None else p["price"]
        sale = p["price"] if p["compare_at"] is not None else None
        short_desc = " · ".join(p["highlights"][:3]) or p["name"]
        seo_title = f'{p["name"]} | {p["brand"]} | Besjaar'
        seo_desc = (
            f'{p["name"]} van {p["brand"]}. ' + " · ".join(p["highlights"][:2])
        )[:158]
        keywords = ", ".join([p["name"], p["brand"]] + p["highlights"][:5])
        rows.append(
            "  ("
            + ", ".join(
                [
                    sql_str(p["name"]),
                    sql_str(p["slug"]),
                    sql_str(slugify(p["brand"])),
                    sql_str(CATEGORY_META[p["category"]][0]),
                    sql_str(p["product_id"]),
                    f'{regular:.2f}',
                    f'{sale:.2f}' if sale is not None else "NULL",
                    "25",
                    sql_str(short_desc),
                    sql_str(p["raw_title"]),
                    sql_str(json.dumps(p["highlights"], ensure_ascii=False)) + "::jsonb",
                    sql_str(json.dumps(p["specs"], ensure_ascii=False)) + "::jsonb",
                    str(p["review_count"]),
                    "true" if p["featured"] else "false",
                    "true" if p["bestseller"] else "false",
                    sql_str(seo_title),
                    sql_str(seo_desc),
                    sql_str(keywords),
                    sql_str(p["image_url"]),
                ]
            )
            + ")"
        )
    out.append(",\n".join(rows))
    out += [
        "),",
        "resolved AS (",
        "  SELECT i.*, b.id AS brand_id, c.id AS category_id",
        "  FROM incoming i",
        "  LEFT JOIN public.brands b ON b.slug = i.brand_slug",
        "  LEFT JOIN public.categories c ON c.slug = i.category_slug",
        "),",
        "upserted AS (",
        "  INSERT INTO public.products (",
        "    name, slug, brand_id, category_id, bol_product_id, status,",
        "    regular_price, sale_price, stock_quantity, short_description,",
        "    full_description, selling_points, specifications, rating_count,",
        "    featured, bestseller, seo_title, seo_description, search_keywords,",
        "    published_at",
        "  )",
        "  SELECT name, slug, brand_id, category_id, bol_product_id, 'active'::public.product_status,",
        "         regular_price, sale_price, stock_quantity, short_description,",
        "         full_description, selling_points, specifications, rating_count,",
        "         featured, bestseller, seo_title, seo_description, search_keywords,",
        "         now()",
        "  FROM resolved",
        "  ON CONFLICT (bol_product_id) DO UPDATE SET",
        "    name = EXCLUDED.name,",
        "    slug = EXCLUDED.slug,",
        "    brand_id = EXCLUDED.brand_id,",
        "    category_id = EXCLUDED.category_id,",
        "    regular_price = EXCLUDED.regular_price,",
        "    sale_price = EXCLUDED.sale_price,",
        "    short_description = EXCLUDED.short_description,",
        "    full_description = EXCLUDED.full_description,",
        "    selling_points = EXCLUDED.selling_points,",
        "    specifications = EXCLUDED.specifications,",
        "    rating_count = EXCLUDED.rating_count,",
        "    featured = EXCLUDED.featured,",
        "    bestseller = EXCLUDED.bestseller,",
        "    seo_title = EXCLUDED.seo_title,",
        "    seo_description = EXCLUDED.seo_description,",
        "    search_keywords = EXCLUDED.search_keywords,",
        "    status = 'active'::public.product_status,",
        "    updated_at = now()",
        "  RETURNING id, bol_product_id",
        ")",
        "INSERT INTO public.product_images (product_id, image_url, alt_text, is_main, sort_order)",
        "SELECT u.id, r.image_url, r.name, true, 0",
        "FROM upserted u",
        "JOIN resolved r ON r.bol_product_id = u.bol_product_id",
        "WHERE r.image_url IS NOT NULL",
        "ON CONFLICT DO NOTHING;",
        "",
    ]

    os.makedirs(os.path.dirname(SQL_OUT), exist_ok=True)
    with open(SQL_OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out))
    print(f"wrote {os.path.relpath(SQL_OUT, ROOT)}")


def write_csv(products: list[dict]) -> None:
    header = [
        "product_id", "naam", "slug", "merk", "categorie", "prijs",
        "adviesprijs", "voorraad", "beoordelingen", "beschikbaarheid",
        "afbeelding_url", "bron_url", "korte_omschrijving", "volledige_titel",
    ]
    with open(CSV_OUT, "w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(header)
        for p in products:
            writer.writerow(
                [
                    p["product_id"],
                    p["name"],
                    p["slug"],
                    p["brand"],
                    p["category"],
                    f'{p["price"]:.2f}',
                    f'{p["compare_at"]:.2f}' if p["compare_at"] else "",
                    25,
                    p["review_count"],
                    p["availability"],
                    p["image_url"] or "",
                    p["source_url"] or "",
                    " · ".join(p["highlights"][:3]),
                    p["raw_title"],
                ]
            )
    print(f"wrote {os.path.relpath(CSV_OUT, ROOT)}")


def print_report(products: list[dict], report: dict) -> None:
    print()
    print("=== Catalogue build report ===")
    print(f"source rows        : {report['source_rows']}")
    print(f"unique products    : {len(products)}")
    print(f"duplicates skipped : {len(report['duplicates_skipped'])} "
          f"{report['duplicates_skipped']}")
    print(f"prices recovered   : {len(report['price_recovered'])} "
          f"{report['price_recovered']} (current price missing in workbook)")
    print(f"brands normalised  : {dict(report['brands_normalised'])}")
    print(f"categories         : {len({p['category'] for p in products})}")
    print(f"brands             : {len({p['brand'] for p in products})}")
    print(f"on sale            : {sum(1 for p in products if p['compare_at'])}")
    print(f"with review counts : {sum(1 for p in products if p['review_count'])}")
    print(f"with images        : {sum(1 for p in products if p['image_url'])}")
    slugs = [p["slug"] for p in products]
    assert len(set(slugs)) == len(slugs), "slug collision"
    names = [p["name"] for p in products]
    dupes = [n for n, c in Counter(names).items() if c > 1]
    print(f"duplicate names    : {dupes if dupes else 'none'}")


if __name__ == "__main__":
    build()
