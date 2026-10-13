import os, re, json, sys
root = sys.argv[1]
def rd(p): return open(os.path.join(root, p)).read()
def jload(p): return json.loads(re.sub(r'^\s*/\*.*?\*/', '', rd(p), flags=re.S))
def nocomment(s): return re.sub(r'\{%-?\s*comment\s*-?%\}.*?\{%-?\s*endcomment\s*-?%\}', '', s, flags=re.S)
reach, queue = set(), []
def add(p):
    if p not in reach and os.path.exists(os.path.join(root, p)): reach.add(p); queue.append(p)
for t in os.listdir(os.path.join(root, "templates")):
    if re.search(r'\.(gem|gp)-', t) or t.startswith("customers"): continue
    add("templates/" + t)
for t in os.listdir(os.path.join(root, "templates/customers")): add("templates/customers/" + t)
for l in ("layout/theme.liquid", "layout/password.liquid"): add(l)
dyn = []
while queue:
    p = queue.pop()
    if p.endswith(".json") and p.startswith(("templates/", "sections/")):
        d = jload(p)
        for k, v in d.get("sections", {}).items():
            add(f"sections/{v['type']}.liquid")  # disabled sections stay reachable: they can be re-enabled in the editor
        continue
    if not p.endswith(".liquid"): continue
    s = nocomment(rd(p))
    for g in re.findall(r"\{%-?\s*sections\s+'([^']+)'", s): add(f"sections/{g}.json")
    for g in re.findall(r"\{%-?\s*section\s+'([^']+)'", s): add(f"sections/{g}.liquid")
    for g in re.findall(r"(?:render|include)\s+'([^']+)'", s): add(f"snippets/{g}.liquid")
    for g in re.findall(r"(?:render|include)\s+([a-z_][\w.]*)\b(?!')", s): dyn.append((p, g))
    for g in re.findall(r"'([A-Za-z0-9_.-]+\.js)'\s*\|\s*asset_url", s): add(f"assets/{g}")
    # liquid tag form:  render 'x'  inside {% liquid %} blocks
    for g in re.findall(r"^\s*render\s+'([^']+)'", s, flags=re.M): add(f"snippets/{g}.liquid")
for extra in ("config/settings_data.json", "config/settings_schema.json"): add(extra)
for f in os.listdir(os.path.join(root, "locales")): add("locales/" + f)
allf = [os.path.relpath(os.path.join(dp, f), root) for dp, _, fs in os.walk(root) for f in fs if re.search(r'\.(liquid|js|json)$', f)]
unreached = sorted(set(allf) - reach)
json.dump(sorted(reach), open("reachable.json", "w"), indent=0)
print("reachable:", len(reach), "| unreachable code files:", len(unreached))
print("dynamic render targets (need manual check):", dyn[:10])
print("unreachable sample:", [u for u in unreached if u.startswith("sections/")][:40])
