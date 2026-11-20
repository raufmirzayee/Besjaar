"""Build the Black Friday 2026 campaign e-mails (nl, en) as standalone HTML.

Paste the output into Shopify Email (Custom Liquid / HTML section) or another
e-mail tool. Shopify Email adds the legally required footer (company address,
unsubscribe link) itself; other tools need their own unsubscribe tag.
"""
from pathlib import Path

CDN = "https://www.besjaar.eu/cdn/shop/files/"
UTM = "utm_source=shopify_email&utm_medium=email&utm_campaign=black-friday-2026"
SITE = "https://www.besjaar.eu"

PRODUCTS = [
    # handle, image, nl name, en name, price, pct
    ("besjaar-douchekop-met-slang-hoge-druk-met-filter-10-sproeistanden-regendouche-waterbesparende-handdouche-zilver",
     "besjaar-hoge-druk-douchekop-met-slang-en-filter-zilver.jpg?v=1792235895",
     "Douchekop met filter en slang, 10 standen", "Shower head with filter and hose, 10 modes", "24,49", "24.49", 30),
    ("besjaar-hoge-druk-douchekop-met-filter-model-1002025-10-sproeistanden-waterbesparende-zilver",
     "besjaar-hoge-druk-douchekop-met-filter-10-standen-zilver.jpg?v=1792235895",
     "Douchekop met filter, 10 standen", "Shower head with filter, 10 modes", "20,99", "20.99", 30),
    ("besjaar-complete-doucheset",
     "Polished_Chrome_Shower_System.png?v=1794322860",
     "Complete Doucheset, chroom", "Complete shower set, chrome", "162,49", "162.49", 35),
    ("besjaar-design-doucheset-mat-zwart",
     "Matte-Black_Premium_Shower_System.png?v=1794322732",
     "Design Doucheset, mat zwart", "Design shower set, matte black", "162,49", "162.49", 35),
]

T = {
    "nl": dict(
        lang="nl", prefix="", subject="Black Friday: 30% korting op alles, 35% op douchesets",
        preview="Geen code nodig. Alleen t/m maandag 30 november.",
        eyebrow="Black Friday · t/m maandag 30 november",
        title='<span style="color:#D4F25A;">30%</span> korting op alles',
        title_plain="30% korting op alles",
        sub="En <strong style=\"color:#ffffff;\">35% korting op onze douchesets</strong>. De korting zit al in de prijs: je hoeft geen code in te vullen.",
        cta="Shop de Black Friday-deals", off="korting", view="Bekijk",
        more="Ook 30% korting op de douchekop met slang (€24,49), de douchekop met 3 standen (€18,19), vervangfilters (€9,09) en de doucheslang (€8,39).",
        all_link="Bekijk alle deals",
        usp=["Gratis verzending in Nederland vanaf €25", "Vóór 16:00 besteld, morgen in huis", "30 dagen retour"],
        sint_title="Op tijd voor Sinterklaas",
        sint="Bestel je nu, dan heb je je pakket ruim voor pakjesavond op 5 december in huis. Een douchekop is een cadeau dat elke dag gebruikt wordt.",
        ends="De actie loopt tot en met maandag 30 november, 23:59 uur. Kortingscodes zijn tijdens Black Friday niet geldig.",
        sign="Besjaar · Douchekoppen en filters uit Assen",
        incl="incl. btw",
    ),
    "en": dict(
        lang="en", prefix="/en", subject="Black Friday: 30% off everything, 35% off shower sets",
        preview="No code needed. Until Monday 30 November only.",
        eyebrow="Black Friday · until Monday 30 November",
        title='<span style="color:#D4F25A;">30%</span> off everything',
        title_plain="30% off everything",
        sub="And <strong style=\"color:#ffffff;\">35% off our shower sets</strong>. The discount is already in the price, so you do not need a code.",
        cta="Shop the Black Friday deals", off="off", view="View",
        more="Also 30% off the shower head with hose (€24.49), the 3-mode shower head (€18.19), replacement filters (€9.09) and the shower hose (€8.39).",
        all_link="See all deals",
        usp=["Free shipping in the Netherlands from €25", "Order before 4 pm, delivered tomorrow (NL)", "30-day returns"],
        sint_title="In time for the holidays",
        sint="Order now and your parcel arrives well before Sinterklaas on 5 December and Christmas. A shower head is a gift that gets used every day.",
        ends="The sale runs until Monday 30 November, 11:59 pm (Amsterdam time). Discount codes cannot be used during Black Friday.",
        sign="Besjaar · Shower heads and filters from Assen, the Netherlands",
        incl="incl. VAT",
    ),
}


def url(t, path, anchor=""):
    return f"{SITE}{t['prefix']}{path}?{UTM}{anchor}"


def card(t, p):
    handle, img, nl, en, price_nl, price_en, pct = p
    name = nl if t["lang"] == "nl" else en
    price = price_nl if t["lang"] == "nl" else price_en
    href = url(t, f"/products/{handle}")
    return f"""<!--[if mso]><td valign="top" width="270"><![endif]-->
<div style="display:inline-block;vertical-align:top;width:100%;max-width:270px;margin:0 0 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:14px;border:1px solid #e6ebee;">
      <tr><td style="padding:14px 14px 0;position:relative;">
        <a href="{href}" style="text-decoration:none;"><img src="{CDN}{img}&width=480&height=480&pad_color=ffffff" width="228" height="228" alt="{name}" style="display:block;width:100%;max-width:228px;height:auto;margin:0 auto;border:0;border-radius:10px;"></a>
      </td></tr>
      <tr><td style="padding:12px 16px 0;">
        <span style="display:inline-block;padding:4px 8px;border-radius:8px;background:#0B0B0B;color:#D4F25A;font:800 10px/1.2 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;">Black Friday · <span style="color:#ffffff;">{pct}% {t['off']}</span></span>
      </td></tr>
      <tr><td style="padding:8px 16px 0;font:600 15px/1.35 Arial,Helvetica,sans-serif;color:#1C2326;">
        <a href="{href}" style="color:#1C2326;text-decoration:none;">{name}</a>
      </td></tr>
      <tr><td style="padding:6px 16px 16px;font:800 20px/1.2 Arial,Helvetica,sans-serif;color:#0B0B0B;">
        €{price} <span style="font:400 12px Arial,Helvetica,sans-serif;color:#5B6668;">{t['incl']}</span>
      </td></tr>
    </table>
  </td></tr></table>
</div>
<!--[if mso]></td><![endif]-->"""


def build(t):
    cards_top = "\n".join(card(t, p) for p in PRODUCTS[:2])
    cards_bottom = "\n".join(card(t, p) for p in PRODUCTS[2:])
    usp = "".join(
        f'<tr><td style="padding:4px 0;font:400 14px/1.5 Arial,Helvetica,sans-serif;color:#1C2326;">'
        f'<span style="color:#1F5F52;font-weight:700;">✓</span>&nbsp; {u}</td></tr>' for u in t["usp"])
    cta_href = url(t, "/collections/all", "#Collection-showerhead")
    return f"""<!doctype html>
<html lang="{t['lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>{t['subject']}</title>
</head>
<body style="margin:0;padding:0;background:#F2F4F5;">
<!-- Preview text -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{t['preview']}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F2F4F5;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

  <!-- Logo -->
  <tr><td align="center" style="padding:0 0 18px;font:700 20px/1 Arial,Helvetica,sans-serif;letter-spacing:.28em;color:#1C2326;">
    <a href="{url(t, '/')}" style="color:#1C2326;text-decoration:none;">BESJAAR</a>
  </td></tr>

  <!-- Hero -->
  <tr><td style="background:#0B0B0B;border-radius:18px;padding:36px 28px 34px;text-align:center;">
    <p style="margin:0 0 14px;font:800 12px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#D4F25A;">{t['eyebrow']}</p>
    <h1 style="margin:0 0 14px;font:700 38px/1.08 Arial,Helvetica,sans-serif;color:#ffffff;">{t['title']}</h1>
    <p style="margin:0 auto 26px;max-width:440px;font:400 16px/1.55 Arial,Helvetica,sans-serif;color:#C9CDCF;">{t['sub']}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
      <td style="border-radius:999px;background:#D4F25A;">
        <a href="{cta_href}" style="display:inline-block;padding:15px 28px;font:800 16px/1 Arial,Helvetica,sans-serif;color:#0B0B0B;text-decoration:none;border-radius:999px;">{t['cta']} →</a>
      </td>
    </tr></table>
  </td></tr>

  <!-- Products -->
  <tr><td style="padding:22px 0 0;text-align:center;font-size:0;">
    <!--[if mso]><table role="presentation" width="100%"><tr><![endif]-->
    {cards_top}
    <!--[if mso]></tr><tr><![endif]-->
    {cards_bottom}
    <!--[if mso]></tr></table><![endif]-->
  </td></tr>

  <tr><td style="padding:2px 12px 0;text-align:center;font:400 14px/1.55 Arial,Helvetica,sans-serif;color:#3C4A52;">
    {t['more']} <a href="{cta_href}" style="color:#1F5F52;font-weight:700;">{t['all_link']} →</a>
  </td></tr>

  <!-- USPs + Sinterklaas -->
  <tr><td style="padding:24px 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;border:1px solid #e6ebee;">
      <tr><td style="padding:22px 24px 6px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">{usp}</table>
      </td></tr>
      <tr><td style="padding:12px 24px 22px;">
        <p style="margin:0 0 6px;font:700 16px/1.35 Arial,Helvetica,sans-serif;color:#1C2326;">{t['sint_title']}</p>
        <p style="margin:0;font:400 14px/1.55 Arial,Helvetica,sans-serif;color:#3C4A52;">{t['sint']}</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Second CTA -->
  <tr><td align="center" style="padding:26px 0 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
      <td style="border-radius:999px;background:#0B0B0B;">
        <a href="{cta_href}" style="display:inline-block;padding:14px 26px;font:800 15px/1 Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none;border-radius:999px;">{t['cta']} →</a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:14px 18px 0;text-align:center;font:400 12px/1.55 Arial,Helvetica,sans-serif;color:#5B6668;">{t['ends']}</td></tr>
  <tr><td style="padding:10px 18px 0;text-align:center;font:400 12px/1.55 Arial,Helvetica,sans-serif;color:#5B6668;">
    <a href="{url(t, '/')}" style="color:#5B6668;">{t['sign']}</a>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
"""


def snippet(html):
    """Only the 600 px content table, for a Shopify Email "Custom Liquid" section
    (Shopify Email adds its own page, preview text and legal footer)."""
    start = html.index('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">')
    end = html.rindex("</table>\n</td></tr>\n</table>")
    return html[start:end] + "</table>\n"


if __name__ == "__main__":
    here = Path(__file__).parent
    for code, t in T.items():
        html = build(t)
        (here / f"black-friday-2026.{code}.html").write_text(html, encoding="utf-8")
        (here / f"black-friday-2026.{code}.shopify-email.html").write_text(snippet(html), encoding="utf-8")
        print(code, "subject:", t["subject"], "| preview:", t["preview"])
