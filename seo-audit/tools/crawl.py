"""SEO crawler for besjaar.eu: fetches raw HTML (no JS) and extracts SEO elements.
Usage: python3 -I crawl.py <urls_file> <out_json> [workers]
"""
import json, re, sys, time, concurrent.futures as cf
import requests
from bs4 import BeautifulSoup

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 (SEO audit)"
S = requests.Session()
S.headers.update({"User-Agent": UA, "Accept-Language": "nl-NL,nl;q=0.9"})
S.verify = "/root/.ccr/ca-bundle.crt"


def txt(el):
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip() if el else None


def parse(url):
    t0 = time.time()
    for attempt in range(6):
        try:
            r = S.get(url, timeout=40, allow_redirects=True)
        except Exception as e:
            return {"url": url, "error": str(e)}
        if r.status_code != 429:
            break
        time.sleep(float(r.headers.get("Retry-After", 0) or 0) or (5 * (attempt + 1)))
    time.sleep(0.4)
    hist = [(h.status_code, h.headers.get("Location")) for h in r.history]
    out = {"url": url, "final_url": r.url, "status": r.status_code, "redirects": hist,
           "elapsed": round(time.time() - t0, 2), "bytes": len(r.content),
           "x_robots": r.headers.get("X-Robots-Tag")}
    if "text/html" not in r.headers.get("Content-Type", ""):
        out["content_type"] = r.headers.get("Content-Type")
        return out
    html = r.text
    soup = BeautifulSoup(html, "lxml")
    out["html_lang"] = soup.html.get("lang") if soup.html else None
    titles = soup.find_all("title")
    out["titles"] = [txt(t) for t in titles if not t.find_parent("svg")]
    def meta(name=None, prop=None):
        if name:
            els = soup.find_all("meta", attrs={"name": re.compile("^" + re.escape(name) + "$", re.I)})
        else:
            els = soup.find_all("meta", attrs={"property": prop})
        return [e.get("content") for e in els]
    out["meta_description"] = meta("description")
    out["meta_robots"] = meta("robots") + meta("googlebot")
    out["canonical"] = [l.get("href") for l in soup.find_all("link", rel="canonical")]
    out["hreflang"] = [(l.get("hreflang"), l.get("href")) for l in soup.find_all("link", rel="alternate") if l.get("hreflang")]
    out["og"] = {p: meta(prop=p) for p in ["og:title", "og:description", "og:image", "og:url", "og:type", "og:site_name", "og:locale"]}
    out["twitter"] = {n: meta(n) for n in ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]}
    # JSON-LD
    lds = []
    for s in soup.find_all("script", type="application/ld+json"):
        raw = s.string or s.get_text()
        try:
            data = json.loads(raw)
            lds.append(data)
        except Exception as e:
            lds.append({"__parse_error__": str(e), "raw": raw[:500]})
    out["jsonld"] = lds
    # microdata itemtypes
    out["microdata"] = sorted({e.get("itemtype") for e in soup.find_all(attrs={"itemtype": True})})
    # main content: strip header/footer/nav/scripts
    body = soup.body
    main = soup.find("main") or body
    headings = []
    for h in (main.find_all(re.compile("^h[1-6]$")) if main else []):
        headings.append((h.name, txt(h)))
    out["h1_all_page"] = [txt(h) for h in soup.find_all("h1")]
    out["headings_main"] = headings
    m2 = BeautifulSoup(str(main), "lxml") if main else None
    if m2:
        for t in m2(["script", "style", "noscript", "svg", "template"]):
            t.decompose()
        main_text = txt(m2)
    else:
        main_text = ""
    out["main_text"] = main_text
    out["word_count_main"] = len(main_text.split())
    # images
    imgs = []
    for i in soup.find_all("img"):
        imgs.append({"src": i.get("src") or i.get("data-src"), "alt": i.get("alt"), "loading": i.get("loading"),
                     "fetchpriority": i.get("fetchpriority"), "width": i.get("width"), "height": i.get("height"),
                     "in_main": bool(main and i in main.find_all("img"))})
    out["images"] = imgs
    # links
    links = []
    for a in soup.find_all("a", href=True):
        zone = "main" if (main and a.find_parent("main")) else ("header" if a.find_parent("header") else ("footer" if a.find_parent("footer") else "other"))
        links.append({"href": a["href"], "text": txt(a)[:120] if txt(a) else "", "zone": zone,
                      "rel": a.get("rel"), "aria": a.get("aria-label")})
    out["links"] = links
    # resources
    out["scripts_ext"] = [s.get("src") for s in soup.find_all("script", src=True)]
    out["scripts_inline_count"] = len([s for s in soup.find_all("script", src=False)])
    out["stylesheets"] = [l.get("href") for l in soup.find_all("link", rel="stylesheet")]
    out["preloads"] = [(l.get("href"), l.get("as")) for l in soup.find_all("link", rel="preload")]
    out["html_bytes"] = len(html.encode())
    # breadcrumbs (visible)
    bc = soup.find(attrs={"aria-label": re.compile("breadcrumb", re.I)}) or soup.find(class_=re.compile("breadcrumb", re.I))
    out["breadcrumb_visible"] = txt(bc) if bc else None
    return out


if __name__ == "__main__":
    urls = [u.strip() for u in open(sys.argv[1]) if u.strip()]
    workers = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    res = []
    with cf.ThreadPoolExecutor(workers) as ex:
        for r in ex.map(parse, urls):
            res.append(r)
            print(r.get("status"), r["url"], file=sys.stderr)
    json.dump(res, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
