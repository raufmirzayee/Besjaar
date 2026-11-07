import json,re,csv,collections,sys
d=json.load(open(sys.argv[1])); out=sys.argv[2]
B='https://www.besjaar.eu'
sm=set(l.strip() for l in open(sys.argv[3]) if l.strip())
def loc(u):
    m=re.match(r'https://www\.besjaar\.eu/(de|fr|en|es)(/|$)',u); return m.group(1) if m else 'nl'
def typ(u):
    p=re.sub(r'https?://(www\.)?besjaar\.eu(/(de|fr|en|es))?','',u) or '/'
    for k in ['products','collections','pages','policies','search']:
        if p.startswith('/'+k): return {'products':'product','collections':'collection','pages':'page','policies':'policy','search':'search'}[k]
    if p.startswith('/blogs/'): return 'article' if p.count('/')>=3 and '/tagged/' not in p else 'blog'
    return 'home' if p in ('/','') else 'other'
def types(o,acc):
    if isinstance(o,dict):
        t=o.get('@type')
        if t: acc.add(t if isinstance(t,str) else '/'.join(t))
        for v in o.values(): types(v,acc)
    elif isinstance(o,list):
        for v in o: types(v,acc)
    return acc
inb=collections.defaultdict(set)
for r in d:
    if r.get('status')!=200: continue
    for l in r['links']:
        h=l['href']
        if h.startswith('//'): h='https:'+h
        if h.startswith('/'): h=B+h
        if not h.startswith(B): continue
        h=h.split('#')[0].split('?')[0].rstrip('/')
        if h==B: h=B+'/'
        if h!=r['url']: inb[h].add(r['url'])
cols=['url','locale','type','http_status','final_url','in_sitemap','html_lang','title','title_len','meta_description','description_len','h1','h2_h3','canonical','meta_robots','x_robots_tag','hreflang_count','hreflang_langs','jsonld_types','og_title','og_description','og_image','word_count_main','images_total','images_no_alt_attr','main_images_empty_alt','inbound_internal_links','visible_breadcrumb','html_kb','external_scripts','stylesheets']
rows=[]
for r in d:
    u=r['url']; st=r.get('status')
    row={'url':u,'locale':loc(u),'type':typ(u),'http_status':st,'final_url':r.get('final_url',''),'in_sitemap':'yes' if u in sm else 'no'}
    if st==200 and 'titles' in r:
        t=(r['titles'] or [''])[0]; md=(r['meta_description'] or [None])[0]
        row.update({'html_lang':r.get('html_lang'),'title':t,'title_len':len(t),'meta_description':md if md is not None else '(missing)','description_len':len(md or ''),
         'h1':' || '.join(r['h1_all_page']),'h2_h3':' | '.join(f"{h[0]}:{h[1]}" for h in r['headings_main'] if h[0] in('h2','h3'))[:1500],
         'canonical':' '.join(r['canonical']),'meta_robots':' '.join(r['meta_robots']),'x_robots_tag':r.get('x_robots') or '',
         'hreflang_count':len(r['hreflang']),'hreflang_langs':','.join(h[0] for h in r['hreflang']),'jsonld_types':','.join(sorted(types(r['jsonld'],set()))),
         'og_title':(r['og'].get('og:title') or [''])[0],'og_description':(r['og'].get('og:description') or [''])[0],'og_image':(r['og'].get('og:image') or [''])[0],
         'word_count_main':r['word_count_main'],'images_total':len(r['images']),'images_no_alt_attr':sum(1 for i in r['images'] if i['alt'] is None),
         'main_images_empty_alt':sum(1 for i in r['images'] if i['alt']=='' and i['in_main']),'inbound_internal_links':len(inb.get(u.rstrip('/') if u!=B+'/' else u,())),
         'visible_breadcrumb':r.get('breadcrumb_visible') or '','html_kb':r['html_bytes']//1024,'external_scripts':len(r['scripts_ext']),'stylesheets':len(r['stylesheets'])})
    rows.append(row)
rows.sort(key=lambda x:(x['locale']!='nl',x['locale'],['home','collection','product','page','blog','article','policy','search','other'].index(x['type']),x['url']))
with open(out,'w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader(); [w.writerow(r) for r in rows]
print(len(rows),'rows ->',out)
