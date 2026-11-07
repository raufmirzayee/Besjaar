import json,re,collections,sys
d=[x for x in json.load(open(sys.argv[1])) if x.get('status')==200]
B='https://www.besjaar.eu'
def loc(u):
    m=re.match(r'https://www\.besjaar\.eu/(de|fr|en|es)(/|$)',u); return m.group(1) if m else 'nl'
sitemap=set(l.strip() for l in open('urls_all.txt') if l.strip() and 'besjaar.eu' in l and not any(s in l for s in ['/policies/','does-not-exist','?','/tagged/','besjaar.eu/collections\n','besjaar.eu/search','http://','https://besjaar']))
sitemap=set(u for u in sitemap if u.startswith(B))
idx=[r for r in d if r['meta_robots'] and 'noindex' not in r['meta_robots'][0] and r['final_url']==r['url'] and '?' not in r['url'] and '/collections/showerhead/products' not in r['url']]
print('indexable crawled pages:',len(idx))
# duplicates
for field in ['titles','meta_description']:
    c=collections.defaultdict(list)
    for r in idx:
        v=(r[field] or [''])[0]; c[(loc(r['url']),v)].append(r['url'])
    dups={k:v for k,v in c.items() if len(v)>1}
    print(f'DUPLICATE {field}:',len(dups))
    for k,v in list(dups.items())[:10]: print('   ',k[0],repr(k[1][:80]),[x.replace(B,'') for x in v][:4])
# missing / multiple
print('missing desc:',[r['url'].replace(B,'') for r in idx if not r['meta_description'] or not r['meta_description'][0].strip()][:20])
print('multiple title/desc tags:',[r['url'].replace(B,'') for r in idx if len(r['titles'])!=1 or len(r['meta_description'])!=1][:10])
print('H1 count !=1:',[(r['url'].replace(B,''),len(r['h1_all_page'])) for r in idx if len(r['h1_all_page'])!=1][:20])
# lengths
tl=[len(r['titles'][0]) for r in idx]; dl=[len(r['meta_description'][0]) for r in idx if r['meta_description']]
print('title len: min',min(tl),'max',max(tl),'>60:',sum(1 for x in tl if x>60),'| desc len: min',min(dl),'max',max(dl),'>160:',sum(1 for x in dl if x>160),'<110:',sum(1 for x in dl if x<110))
print('  long titles:',[(r['url'].replace(B,'')[:60],len(r['titles'][0])) for r in idx if len(r['titles'][0])>65][:12])
print('  short desc:',[(r['url'].replace(B,'')[:60],len(r['meta_description'][0])) for r in idx if r['meta_description'] and len(r['meta_description'][0])<110][:12])
# jsonld errors
print('JSON-LD parse errors:',[r['url'].replace(B,'') for r in d if any('__parse_error__' in (b if isinstance(b,dict) else {}) for b in r['jsonld'])][:10])
# alt
noalt=collections.Counter(); emptyalt=collections.Counter()
for r in idx:
    for i in r['images']:
        if i['alt'] is None: noalt[r['url']]+=1
        elif i['alt']=='' and i['in_main']: emptyalt[r['url']]+=1
print('imgs missing alt attr (pages):',len(noalt),list(noalt.items())[:5])
print('main imgs with empty alt (pages):',len(emptyalt),sum(emptyalt.values()),[ (u.replace(B,''),n) for u,n in list(emptyalt.items())[:6]])
# link graph
inb=collections.defaultdict(set); inb_main=collections.defaultdict(set); internal=set()
for r in d:
    for l in r['links']:
        h=l['href']
        if h.startswith('//'): h='https:'+h
        if h.startswith('/'): h=B+h
        if not h.startswith(B): continue
        h=h.split('#')[0].split('?')[0].rstrip('/') or B
        if h==B: h=B+'/'
        internal.add(h)
        if h!=r['url']:
            inb[h].add(r['url'])
            if l['zone']=='main': inb_main[h].add(r['url'])
nlsm=[u for u in sitemap if loc(u)=='nl']
print('NL sitemap urls:',len(nlsm))
orph=[(u.replace(B,''),len(inb.get(u.rstrip('/') if u!=B+'/' else u,()))) for u in nlsm]
low=sorted([o for o in orph],key=lambda x:x[1])[:15]
print('lowest inbound (NL, any zone):',low)
lowm=sorted([(u.replace(B,''),len(inb_main.get(u,()))) for u in nlsm],key=lambda x:x[1])[:20]
print('lowest inbound from MAIN content (NL):',lowm)
json.dump({'internal_links':sorted(internal)},open('internal_links.json','w'))
