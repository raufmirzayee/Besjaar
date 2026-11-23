"""Univex Shop collection order, 23 Nov 2026.

Rule: products tagged "Bestseller" first, then the main / most complete
products, then refills and small accessories. Drafts (not on the storefront)
end up after the listed products automatically.
Before: every collection sortOrder MOST_RELEVANT, except "aanbiedingen" BEST_SELLING.
Rollback: collectionUpdate sortOrder back to those values.
"""
P = {
 "dk_fs": 15846949814620, "dk_f": 15846952173916, "dk_s3": 15846952206684, "dk_3": 15846952239452, "navul": 15846953255260,
 "z5000": 15846953320796, "z2000": 15846953288028, "h1000": 15846958498140, "z9000": 15846958039388, "z7800": 15846957973852,
 "hsens": 15846958530908, "uv": 15846958465372, "solar": 15846962528604, "kweek": 15865652150620,
 "deurbel": 15846962594140, "muis": 15846966559068, "weeg": 15846966591836, "wk_temp": 15848857272668, "wk_retro": 15848857305436,
 "ws_geaard": 15865666109788, "ws_usbc": 15846976815452, "th_fiets": 15846966624604, "th_auto": 15846966657372,
 "laptop": 15846976848220, "sd": 15846966722908, "usbc": 15865653854556,
 "airstyler": 15846962725212, "thermal": 15865321193820, "massage": 15846976880988,
 "sig_aanst": 15846962659676, "sig": 15846962626908, "markers": 15846976979292,
}
C = {
 "douche-badkamer":        (699763982684, "MOST_RELEVANT", ["dk_fs", "dk_f", "dk_s3", "dk_3", "navul"]),
 "zaklampen-verlichting":  (699764015452, "MOST_RELEVANT", ["z5000", "z2000", "h1000", "z9000", "z7800", "hsens", "uv", "solar", "kweek"]),
 "huis-keuken":            (699764048220, "MOST_RELEVANT", ["wk_temp", "wk_retro", "weeg", "kweek", "deurbel", "muis"]),  # user-specified order, 23 Nov
 "elektronica-onderweg":   (699764080988, "MOST_RELEVANT", ["ws_geaard", "ws_usbc", "th_fiets", "th_auto", "laptop", "sd", "usbc"]),
 "verzorging-wellness":    (699764113756, "MOST_RELEVANT", ["airstyler", "thermal", "massage"]),
 "accessoires":            (699764179292, "MOST_RELEVANT", ["sig_aanst", "sig"]),
 "bestsellers":            (699764212060, "MOST_RELEVANT", ["dk_fs", "z5000", "z2000", "h1000", "deurbel", "muis", "weeg", "markers"]),
 "besjaar":                (699764244828, "MOST_RELEVANT", ["dk_fs", "dk_f", "dk_s3", "dk_3", "navul", "z5000", "z2000", "h1000", "z9000", "z7800", "hsens", "uv", "solar", "deurbel", "airstyler", "kweek", "sig_aanst", "sig"]),
 "rynex":                  (699764277596, "MOST_RELEVANT", ["muis", "weeg", "markers", "ws_geaard", "ws_usbc", "th_fiets", "th_auto", "massage", "laptop", "sd", "usbc"]),
 "slimhome":               (699883618652, "MOST_RELEVANT", ["wk_temp", "wk_retro"]),
 "aanbiedingen":           (700629320028, "BEST_SELLING", ["dk_fs", "z5000", "z2000", "h1000", "deurbel", "muis", "weeg", "markers",
                                                           "dk_f", "dk_s3", "dk_3", "z9000", "z7800", "airstyler", "thermal", "wk_temp", "wk_retro",
                                                           "ws_geaard", "ws_usbc", "massage", "hsens", "uv", "solar", "kweek", "th_fiets", "th_auto",
                                                           "laptop", "sig_aanst", "sig", "sd", "usbc", "navul"]),
}
assert len(C["aanbiedingen"][2]) == 32 and len(set(C["aanbiedingen"][2])) == 32
for k, (_, _, lst) in C.items():
    assert len(lst) == len(set(lst)), k

if __name__ == "__main__":
    upd = "\n".join(f'  {k.replace("-", "_")}: collectionUpdate(collection: {{id: "gid://shopify/Collection/{cid}", sortOrder: MANUAL}}) {{ collection {{ handle sortOrder }} userErrors {{ field message }} }}' for k, (cid, _, _) in C.items())
    open("set-manual.graphql", "w").write("mutation {\n" + upd + "\n}\n")
    mv = []
    for k, (cid, _, lst) in C.items():
        moves = ", ".join(f'{{id: "gid://shopify/Product/{P[x]}", newPosition: "{i}"}}' for i, x in enumerate(lst))
        mv.append(f'  {k.replace("-", "_")}: collectionReorderProducts(id: "gid://shopify/Collection/{cid}", moves: [{moves}]) {{ job {{ id done }} userErrors {{ field message }} }}')
    open("reorder.graphql", "w").write("mutation {\n" + "\n".join(mv) + "\n}\n")
    rb = "\n".join(f'  {k.replace("-", "_")}: collectionUpdate(collection: {{id: "gid://shopify/Collection/{cid}", sortOrder: {before}}}) {{ collection {{ handle sortOrder }} userErrors {{ field message }} }}' for k, (cid, before, _) in C.items())
    open("rollback.graphql", "w").write("mutation {\n" + rb + "\n}\n")
    print("ok")
