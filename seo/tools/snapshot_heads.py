#!/usr/bin/env python3
"""SEO head snapshot for besjaar.eu (before/after comparison of live changes).

Records, per URL: HTTP status, <title>, meta description, meta robots,
canonical, <html lang>, hreflang set, H1 text(s), H2 count and JSON-LD types.

Two modes
---------
1) Fetch mode (default) – reads the live sitemap and fetches every URL politely
   (one request at a time, --delay seconds apart, retries on HTTP 429):

       python3 seo/tools/snapshot_heads.py --out seo/baseline/<date>/url-inventory.csv

   Limit to some URLs with --only (substring match, may be repeated), e.g.
       --only /collections/ --only /products/

2) Parse mode – parse pages that were already downloaded:

       python3 seo/tools/snapshot_heads.py --index index.tsv --pages-dir pages --out out.csv

   index.tsv lines: <file-id>\t<http-status>\t<url>, page files are <file-id>.html

Compare two snapshots with:
       python3 seo/tools/snapshot_heads.py --diff old.csv new.csv

Standard library only. No data is sent anywhere except GET requests to the
store's own public URLs.
"""
import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.request
from html.parser import HTMLParser

SITE = "https://www.besjaar.eu"
UA = "Mozilla/5.0 (compatible; besjaar-seo-snapshot)"
FIELDS = ["url", "status", "title", "title_len", "meta_description", "meta_description_len",
          "robots", "canonical", "html_lang", "hreflang", "h1", "h1_count", "h2_count", "jsonld_types"]


class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = None
        self._in_title = False
        self._title_done = False
        self.meta = {}
        self.canonical = ""
        self.hreflang = []
        self.html_lang = ""
        self.h1 = []
        self.h2_count = 0
        self._h1_buf = None
        self._ld_buf = None
        self.ld = []
        self._svg_depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html" and not self.html_lang:
            self.html_lang = a.get("lang", "")
        if tag == "svg":
            self._svg_depth += 1
        if tag == "title" and not self._title_done and self._svg_depth == 0:
            self._in_title = True
            self.title = ""
        if tag == "meta":
            key = (a.get("name") or a.get("property") or "").lower()
            if key in ("description", "robots") and key not in self.meta:
                self.meta[key] = a.get("content", "")
        if tag == "link":
            rel = (a.get("rel") or "").lower()
            if rel == "canonical" and not self.canonical:
                self.canonical = a.get("href", "")
            if rel == "alternate" and a.get("hreflang"):
                self.hreflang.append(f"{a.get('hreflang')}={a.get('href', '')}")
        if tag == "h1":
            self._h1_buf = ""
        if tag == "h2":
            self.h2_count += 1
        if tag == "script" and (a.get("type") or "").lower() == "application/ld+json":
            self._ld_buf = ""

    def handle_endtag(self, tag):
        if tag == "svg":
            self._svg_depth = max(0, self._svg_depth - 1)
        if tag == "title" and self._in_title:
            self._in_title = False
            self._title_done = True
        if tag == "h1" and self._h1_buf is not None:
            self.h1.append(" ".join(self._h1_buf.split()))
            self._h1_buf = None
        if tag == "script" and self._ld_buf is not None:
            self.ld.append(self._ld_buf)
            self._ld_buf = None

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._h1_buf is not None:
            self._h1_buf += data
        if self._ld_buf is not None:
            self._ld_buf += data


def jsonld_types(blocks):
    types = []
    for b in blocks:
        try:
            j = json.loads(b)
        except ValueError:
            types.append("INVALID_JSON")
            continue
        items = j if isinstance(j, list) else [j]
        for it in items:
            if isinstance(it, dict) and "@graph" in it:
                types += [str(g.get("@type")) for g in it["@graph"] if isinstance(g, dict)]
            elif isinstance(it, dict):
                types.append(str(it.get("@type")))
    return "|".join(types)


def parse(url, status, html):
    p = HeadParser()
    try:
        p.feed(html)
    except Exception as exc:  # malformed markup should not stop the snapshot
        print(f"parse warning {url}: {exc}", file=sys.stderr)
    title = " ".join((p.title or "").split())
    desc = p.meta.get("description", "")
    return {
        "url": url, "status": status, "title": title, "title_len": len(title),
        "meta_description": desc, "meta_description_len": len(desc),
        "robots": p.meta.get("robots", ""), "canonical": p.canonical, "html_lang": p.html_lang,
        "hreflang": " ".join(sorted(p.hreflang)), "h1": " || ".join(p.h1), "h1_count": len(p.h1),
        "h2_count": p.h2_count, "jsonld_types": jsonld_types(p.ld),
    }


def get(url, retries=6, delay=1.5):
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "nl-NL,nl;q=0.9"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                time.sleep(delay * (2 ** attempt) * 5)
                continue
            return e.code, e.read().decode("utf-8", "replace")
    return 0, ""


def sitemap_urls():
    _, idx = get(SITE + "/sitemap.xml")
    urls = []
    for sm in re.findall(r"<loc>([^<]+)</loc>", idx):
        sm = sm.replace("&amp;", "&")
        if "agentic" in sm:
            continue
        _, body = get(sm)
        urls += [u.replace("&amp;", "&") for u in re.findall(r"<loc>([^<]+)</loc>", body)
                 if not re.search(r"\.(jpe?g|png|webp|gif)(\?|$)", u)]
    return sorted(set(urls))


def write(rows, out):
    rows.sort(key=lambda r: r["url"])
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)
    print(f"wrote {len(rows)} rows to {out}")


def diff(old_path, new_path):
    def load(p):
        with open(p, encoding="utf-8") as fh:
            return {r["url"]: r for r in csv.DictReader(fh)}
    old, new = load(old_path), load(new_path)
    watch = ["status", "title", "meta_description", "robots", "canonical", "html_lang", "hreflang", "h1"]
    for url in sorted(set(old) | set(new)):
        if url not in new:
            print(f"REMOVED  {url}")
            continue
        if url not in old:
            print(f"ADDED    {url}")
            continue
        for f in watch:
            if old[url][f] != new[url][f]:
                print(f"CHANGED  {url}\n   {f}:\n     - {old[url][f]}\n     + {new[url][f]}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", help="CSV output path")
    ap.add_argument("--only", action="append", default=[], help="only URLs containing this substring")
    ap.add_argument("--delay", type=float, default=1.5, help="seconds between requests (fetch mode)")
    ap.add_argument("--index", help="parse mode: index.tsv of already downloaded pages")
    ap.add_argument("--pages-dir", help="parse mode: directory with <file-id>.html")
    ap.add_argument("--diff", nargs=2, metavar=("OLD_CSV", "NEW_CSV"))
    a = ap.parse_args()

    if a.diff:
        diff(*a.diff)
        return
    if not a.out:
        ap.error("--out is required")

    rows = []
    if a.index:
        with open(a.index, encoding="utf-8") as fh:
            for line in fh:
                fid, status, url = line.rstrip("\n").split("\t")
                if a.only and not any(s in url for s in a.only):
                    continue
                with open(f"{a.pages_dir}/{fid}.html", encoding="utf-8", errors="replace") as ph:
                    rows.append(parse(url, int(status), ph.read()))
    else:
        urls = [u for u in sitemap_urls() if not a.only or any(s in u for s in a.only)]
        for i, url in enumerate(urls, 1):
            status, html = get(url, delay=a.delay)
            rows.append(parse(url, status, html))
            print(f"[{i}/{len(urls)}] {status} {url}", file=sys.stderr)
            time.sleep(a.delay)
    write(rows, a.out)


if __name__ == "__main__":
    main()
