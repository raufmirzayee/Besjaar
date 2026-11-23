"""Univex Shop (uztncp-vt.myshopify.com) Black Friday 2026 prices.

User's choice (23 Nov 2026): compare-at = current price + 10%, sale price =
that compare-at minus 15%. Active products only, until 30 Nov 23:59 Amsterdam.
Restore on 1 Dec: price back to "before", compare-at back to null.
"""
import json
from decimal import Decimal, ROUND_HALF_UP, ROUND_FLOOR

# product id, variant id, product short name, variant title, price before (compare-at before: none)
DATA = [
 (15846949814620, 59264569409884, "Besjaar Douchekop met Filter en Slang", "Default Title", "28.49"),
 (15846952173916, 59264582648156, "Besjaar Douchekop met Filter", "Default Title", "26.00"),
 (15846952206684, 59264582680924, "Besjaar Douchekop met Slang 3 Standen", "Default Title", "28.49"),
 (15846952239452, 59264582713692, "Besjaar Douchekop 3 Sproeistanden", "Default Title", "15.19"),
 (15846953255260, 59264592249180, "Besjaar Douchefilter Navulset 2 st.", "Default Title", "10.19"),
 (15846953288028, 59264592281948, "Besjaar Militaire Zaklamp 2000 lm", "1 stuk", "12.34"),
 (15846953288028, 59350068527452, "Besjaar Militaire Zaklamp 2000 lm", "1 stuk + batterijen", "17.99"),
 (15846953288028, 59264592314716, "Besjaar Militaire Zaklamp 2000 lm", "2 stuks + batterijen", "15.19"),
 (15846953320796, 59264592347484, "Besjaar Zaklamp 5000 lm", "Default Title", "25.00"),
 (15846957973852, 59264600932700, "Besjaar Zaklamp 7800 lm", "Default Title", "39.99"),
 (15846958039388, 59264601129308, "Besjaar Zaklamp 9000 lm", "Default Title", "44.99"),
 (15846958465372, 59264601620828, "Besjaar UV Zaklamp", "Default Title", "19.99"),
 (15846958498140, 59264601653596, "Besjaar Hoofdlamp 1000 lm", "Default Title", "15.59"),
 (15846958530908, 59264601686364, "Besjaar Hoofdlamp Bewegingssensor", "400 lumen", "9.99"),
 (15846958530908, 59264601719132, "Besjaar Hoofdlamp Bewegingssensor", "500 lumen", "9.99"),
 (15846962528604, 59264617578844, "Besjaar Solar Buitenlamp", "Default Title", "19.99"),
 (15846962594140, 59264617742684, "Besjaar Draadloze Deurbel", "1 ontvanger", "15.99"),
 (15846962594140, 59264617775452, "Besjaar Draadloze Deurbel", "2 ontvangers", "22.50"),
 (15846962626908, 59264617808220, "Besjaar Sigarettendoosje", "Zwart", "9.99"),
 (15846962626908, 59264617840988, "Besjaar Sigarettendoosje", "Zilver", "9.99"),
 (15846962626908, 59264617873756, "Besjaar Sigarettendoosje", "Goud", "9.99"),
 (15846962659676, 59264617906524, "Besjaar Sigarettendoosje met Aansteker", "Zwart", "15.99"),
 (15846962659676, 59264617939292, "Besjaar Sigarettendoosje met Aansteker", "Zilver", "15.99"),
 (15846962659676, 59264617972060, "Besjaar Sigarettendoosje met Aansteker", "Goud", "15.99"),
 (15846962725212, 59264618103132, "Besjaar Airstyler 5-in-1 Wit/Goud", "Default Title", "49.99"),
 (15846966559068, 59264628293980, "Rynex Muizenval 6 st.", "Default Title", "15.99"),
 (15846966591836, 59264628425052, "Rynex Keukenweegschaal", "Zwart", "19.99"),
 (15846966591836, 59350048997724, "Rynex Keukenweegschaal", "Wit", "19.99"),
 (15846966624604, 59264628457820, "Rynex Telefoonhouder Fiets", "Default Title", "15.20"),
 (15846966657372, 59264628490588, "Rynex Telefoonhouder Auto", "Default Title", "15.99"),
 (15846966722908, 59264628556124, "Rynex SD Kaartlezer", "Default Title", "8.99"),
 (15846976815452, 59264697205084, "Rynex Wereldstekker USB-C", "Default Title", "15.99"),
 (15846976848220, 59264697237852, "Rynex Laptopstandaard", "Zwart", "12.99"),
 (15846976848220, 59264697270620, "Rynex Laptopstandaard", "Zilver", "12.99"),
 (15846976880988, 59264697303388, "Rynex Mini Massage Gun", "Default Title", "19.99"),
 (15846976979292, 59264697401692, "Rynex Twinmarkers", "80 stuks", "19.49"),
 (15846976979292, 59264697434460, "Rynex Twinmarkers", "168 stuks", "24.38"),
 (15848857272668, 59273410871644, "SlimHome Waterkoker Temperatuur", "Glas", "34.99"),
 (15848857272668, 59273410904412, "SlimHome Waterkoker Temperatuur", "RVS", "34.99"),
 (15848857305436, 59273410937180, "SlimHome Glazen Waterkoker Retro", "Default Title", "29.99"),
 (15865321193820, 59350294823260, "Lynex Thermal Brush", "Default Title", "49.95"),
 (15865652150620, 59351660298588, "Besjaar LED Kweeklamp", "Default Title", "29.99"),
 (15865653854556, 59351667474780, "Rynex USB-C naar USB-A Adapter 3 st.", "Default Title", "7.99"),
 (15865666109788, 59351689101660, "Rynex Wereldstekker Geaard", "Default Title", "29.99"),
]

CENT = Decimal("0.01")


def bf(price):
    p = Decimal(price)
    compare = (p * Decimal("1.10")).quantize(CENT, ROUND_HALF_UP)
    sale = (compare * Decimal("0.85")).quantize(CENT, ROUND_FLOOR)
    return compare, sale


rows = []
for pid, vid, name, vt, before in DATA:
    compare, sale = bf(before)
    rows.append(dict(product=pid, variant=vid, name=name, variant_title=vt, price_before=before,
                     compare_at_before=None, compare_at_bf=str(compare), price_bf=str(sale),
                     shown_pct=float(round((1 - sale / compare) * 100, 2)),
                     real_pct_vs_before=float(round((1 - sale / Decimal(before)) * 100, 2))))

if __name__ == "__main__":
    json.dump(rows, open("prices.json", "w"), indent=1, ensure_ascii=False)
    # one mutation document, one productVariantsBulkUpdate per product
    by_product = {}
    for r in rows:
        by_product.setdefault(r["product"], []).append(r)
    parts = []
    for i, (pid, rs) in enumerate(by_product.items(), 1):
        vs = ", ".join(f'{{id: "gid://shopify/ProductVariant/{r["variant"]}", price: "{r["price_bf"]}", compareAtPrice: "{r["compare_at_bf"]}"}}' for r in rs)
        parts.append(f'  p{i}: productVariantsBulkUpdate(productId: "gid://shopify/Product/{pid}", variants: [{vs}]) {{ productVariants {{ id price compareAtPrice }} userErrors {{ field message }} }}')
    open("apply.graphql", "w").write("mutation {\n" + "\n".join(parts) + "\n}\n")
    parts = []
    for i, (pid, rs) in enumerate(by_product.items(), 1):
        vs = ", ".join(f'{{id: "gid://shopify/ProductVariant/{r["variant"]}", price: "{r["price_before"]}", compareAtPrice: null}}' for r in rs)
        parts.append(f'  p{i}: productVariantsBulkUpdate(productId: "gid://shopify/Product/{pid}", variants: [{vs}]) {{ productVariants {{ id price compareAtPrice }} userErrors {{ field message }} }}')
    open("restore.graphql", "w").write("mutation {\n" + "\n".join(parts) + "\n}\n")
    print(len(rows), "variants,", len(by_product), "products")
    print("shown %:", min(r["shown_pct"] for r in rows), "-", max(r["shown_pct"] for r in rows))
    print("real % vs before:", min(r["real_pct_vs_before"] for r in rows), "-", max(r["real_pct_vs_before"] for r in rows))
    for r in rows[:6]:
        print(f'  {r["name"][:34]:34} {r["variant_title"][:18]:18} {r["price_before"]:>6} -> compare {r["compare_at_bf"]:>6}, price {r["price_bf"]:>6}')
