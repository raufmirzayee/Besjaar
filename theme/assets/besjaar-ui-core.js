/* Besjaar 9.3 — preview-prepared global storefront runtime */
/* Besjaar UI 3.0 — Product Q&A + Back-in-Stock + Retail Intelligence */
(() => {
  document.documentElement.classList.remove('no-js');
  const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const setInert=(node,value)=>{if(!node)return;try{node.inert=Boolean(value)}catch{node.toggleAttribute('inert',Boolean(value))}};
  const listenMedia=(query,handler)=>{if(!query||!handler)return;if(typeof query.addEventListener==='function')query.addEventListener('change',handler);else if(typeof query.addListener==='function')query.addListener(handler)};
  const scrollElementToX=(node,left,behavior='auto')=>{if(!node)return;try{if(typeof node.scrollTo==='function')node.scrollTo({left,behavior});else node.scrollLeft=left}catch{node.scrollLeft=left}};
  const config=window.BesjaarUIConfig||{}, routes=config.routes||{}, i18n=config.i18n||{}, commerce=config.commerce||{}, searchDiscovery=config.searchDiscovery||{}, catalog=config.catalog||{};
  const currency=config.currency||'EUR';
  const rootPath=String(routes.root||window.Shopify?.routes?.root||'/');
  const localizeInternalUrl=(value='')=>{
    const raw=String(value||'').trim();
    if(!raw)return rootPath;
    if(/^(?:mailto:|tel:|javascript:|#|\?)/i.test(raw))return raw;
    try{
      if(/^https?:\/\//i.test(raw)){
        const parsed=new URL(raw,window.location.origin);
        if(parsed.origin!==window.location.origin)return raw;
        return localizeInternalUrl(`${parsed.pathname}${parsed.search}${parsed.hash}`);
      }
    }catch{}
    if(rootPath==='/'||raw.startsWith(rootPath))return raw.startsWith('/')?raw:`/${raw}`;
    const clean=raw.startsWith('/')?raw.slice(1):raw;
    return `${rootPath}${clean}`;
  };
  const searchUrlForTerm=(term)=>`${localizeInternalUrl(routes.search||'/search')}?type=product&options%5Bprefix%5D=last&q=${encodeURIComponent(String(term||'').trim())}`;
  const focusLocked=catalog.focusLocked===true;
  const focusProductIds=new Set((Array.isArray(catalog.focusProductIds)?catalog.focusProductIds:[]).map(value=>String(value)));
  const searchProductIds=new Set((Array.isArray(catalog.searchProductIds)?catalog.searchProductIds:[]).map(value=>String(value)));
  const focusHandles=new Set((Array.isArray(catalog.focusHandles)?catalog.focusHandles:[]).map(value=>String(value||'').trim()).filter(Boolean));
  const locale=(document.documentElement.lang||config.markets?.language||'en').toLowerCase();
  const isNl=locale.startsWith('nl');
  const isDe=locale.startsWith('de');
  const isFr=locale.startsWith('fr');
  /* Besjaar 11.6: de/fr shoppers previously fell into the Dutch→English table and
     saw English titles in cart upsells / quick-add; mirror the word maps that
     snippets/localized-product-title.liquid applies server-side. */
  const translateCatalogTitle=(value='')=>{
    let text=String(value||'');
    let pairs;
    if(isNl){
      pairs=[
        ['Shower Head','Douchekop'],['shower head','douchekop'],['Showerhead','Douchekop'],['showerhead','douchekop'],
        ['High Pressure','Hoge Druk'],['high pressure','hoge druk'],['Water-Saving','Waterbesparende'],['water-saving','waterbesparende'],
        ['Spray Modes','Sproeistanden'],['spray modes','sproeistanden'],['With Hose','Met Slang'],['with hose','met slang'],
        ['With Filter','Met Filter'],['with filter','met filter'],['Chrome','Chroom'],['chrome','chroom'],['Silver','Zilver'],['silver','zilver'],
        ['Black','Zwart'],['black','zwart'],['White','Wit'],['white','wit']
      ];
    }else if(isDe){
      pairs=[
        ['Douchekop','Duschkopf'],['douchekop','Duschkopf'],['Shower Head','Duschkopf'],['shower head','Duschkopf'],['Showerhead','Duschkopf'],['showerhead','Duschkopf'],
        ['Handdouche','Handbrause'],['handdouche','Handbrause'],['Hand Shower','Handbrause'],
        ['Hoge Druk','Hoher Druck'],['hoge druk','hoher Druck'],['High Pressure','Hoher Druck'],['high pressure','hoher Druck'],
        ['Waterbesparende','Wassersparender'],['waterbesparende','wassersparender'],['Water-Saving','Wassersparender'],['water-saving','wassersparender'],
        ['Sproeistanden','Strahlarten'],['sproeistanden','Strahlarten'],['Spray Modes','Strahlarten'],['spray modes','Strahlarten'],
        ['Met Slang','Mit Schlauch'],['met slang','mit Schlauch'],['With Hose','Mit Schlauch'],['with hose','mit Schlauch'],
        ['Met Filter','Mit Filter'],['met filter','mit Filter'],['With Filter','Mit Filter'],['with filter','mit Filter'],
        ['Chroom','Chrom'],['chroom','Chrom'],['Chrome','Chrom'],['chrome','Chrom'],
        ['Zilver','Silber'],['zilver','Silber'],['Silver','Silber'],['silver','Silber'],
        ['Zwart','Schwarz'],['zwart','Schwarz'],['Black','Schwarz'],['black','Schwarz'],
        ['Wit','Weiß'],['wit','Weiß'],['White','Weiß'],['white','Weiß']
      ];
    }else if(isFr){
      pairs=[
        ['Douchekop','Pommeau de douche'],['douchekop','pommeau de douche'],['Shower Head','Pommeau de douche'],['shower head','pommeau de douche'],['Showerhead','Pommeau de douche'],['showerhead','pommeau de douche'],
        ['Handdouche','Douchette'],['handdouche','douchette'],['Hand Shower','Douchette'],
        ['Hoge Druk','Haute Pression'],['hoge druk','haute pression'],['High Pressure','Haute Pression'],['high pressure','haute pression'],
        ['Waterbesparende','Économe en eau'],['waterbesparende','économe en eau'],['Water-Saving','Économe en eau'],['water-saving','économe en eau'],
        ['Sproeistanden','Types de jet'],['sproeistanden','types de jet'],['Spray Modes','Types de jet'],['spray modes','types de jet'],
        ['Met Slang','Avec flexible'],['met slang','avec flexible'],['With Hose','Avec flexible'],['with hose','avec flexible'],
        ['Met Filter','Avec filtre'],['met filter','avec filtre'],['With Filter','Avec filtre'],['with filter','avec filtre'],
        ['Chroom','Chromé'],['chroom','chromé'],['Chrome','Chromé'],['chrome','chromé'],
        ['Zilver','Argent'],['zilver','argent'],['Silver','Argent'],['silver','argent'],
        ['Zwart','Noir'],['zwart','noir'],['Black','Noir'],['black','noir'],
        ['Wit','Blanc'],['wit','blanc'],['White','Blanc'],['white','blanc']
      ];
    }else{
      pairs=[
        ['Douchekop','Shower Head'],['douchekop','shower head'],['Handdouche','Hand Shower'],['handdouche','hand shower'],
        ['Hoge Druk','High Pressure'],['hoge druk','high pressure'],['Waterbesparende','Water-Saving'],['waterbesparende','water-saving'],
        ['Sproeistanden','Spray Modes'],['sproeistanden','spray modes'],['Met Slang','With Hose'],['met slang','with hose'],
        ['Met Filter','With Filter'],['met filter','with filter'],['Chroom','Chrome'],['chroom','chrome'],['Zilver','Silver'],['zilver','silver'],
        ['Zwart','Black'],['zwart','black'],['Wit','White'],['wit','white']
      ];
    }
    /* Besjaar 11.6: word-boundary matching — plain substring replacement corrupted
       words containing shorter terms (e.g. 'wit' inside 'with' turned
       'With Hose' into 'Whiteh hose', and the new de/fr color pairs would have
       mangled any 'with …' title the phrase pairs did not catch first). */
    pairs.forEach(([from,to])=>{
      const pattern=new RegExp('\\b'+from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','g');
      text=text.replace(pattern,to);
    });
    return text;
  };
  const translateCollectionTitle=(value='',url='')=>{
    const path=String(url||'').toLowerCase();
    if(path.includes('/collections/badkamer-douche')||path.includes('/collections/douche')||path.includes('/collections/shower')){
      if(isNl)return 'Besjaar douchekoppen';
      if(isDe)return 'Besjaar Duschköpfe';
      if(isFr)return 'Pommeaux de douche Besjaar';
      return 'Besjaar showerheads';
    }
    return translateCatalogTitle(value);
  };
  window.BesjaarUICatalogTitle=translateCatalogTitle;
  window.BesjaarUICollectionTitle=translateCollectionTitle;
  const escapeHtml=(v='')=>String(v).replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const formatMoney=(cents,curr=currency)=>{try{return new Intl.NumberFormat(document.documentElement.lang||(isNl?'nl-NL':'en-NL'),{style:'currency',currency:curr}).format(Number(cents||0)/100)}catch{return `€${(Number(cents||0)/100).toFixed(2)}`}};
  const toast=(message)=>{let el=qs('.besjaar-ui-toast');if(!el){el=document.createElement('div');el.className='besjaar-ui-toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=message;el.classList.add('is-visible');clearTimeout(window.__besjaarUiToast);window.__besjaarUiToast=setTimeout(()=>el.classList.remove('is-visible'),2200)};
  const measure=(name,detail={})=>document.dispatchEvent(new CustomEvent('besjaar_ui:measurement',{detail:{name,detail}}));

  // Accessible drawers
  const backdrop=qs('[data-drawer-backdrop]'); let activeDrawer=null, returnFocus=null;
  const focusable=(root)=>qsa('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',root).filter(el=>!el.hidden&&el.offsetParent!==null);
  const closeDrawers=()=>{if(!activeDrawer)return;qsa('.besjaar-ui-drawer.is-open').forEach(el=>{el.classList.remove('is-open');el.setAttribute('aria-hidden','true');setInert(el,true)});backdrop?.classList.remove('is-open');document.body.style.overflow='';const focus=returnFocus;activeDrawer=null;returnFocus=null;focus?.focus?.()};
  const trapDrawer=(event)=>{if(!activeDrawer||event.key!=='Tab')return;const items=focusable(activeDrawer);if(!items.length){event.preventDefault();activeDrawer.focus();return}const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}};
  const openDrawer=(name,trigger=document.activeElement)=>{closeDrawers();const drawer=qs(`[data-drawer="${name}"]`);if(!drawer)return;returnFocus=trigger;activeDrawer=drawer;drawer.classList.add('is-open');drawer.setAttribute('aria-hidden','false');setInert(drawer,false);backdrop?.classList.add('is-open');document.body.style.overflow='hidden';setTimeout(()=>focusable(drawer)[0]?.focus()||drawer.focus(),20);if(name==='cart'){refreshCart();measure('cart_drawer_opened',{source:trigger?.dataset?.openDrawer?'header_or_nav':'commerce_action'})}};
  backdrop?.addEventListener('click',closeDrawers);qsa('[data-close-drawer]').forEach(b=>b.addEventListener('click',closeDrawers));qsa('[data-open-drawer]').forEach(b=>b.addEventListener('click',()=>openDrawer(b.dataset.openDrawer,b)));
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'){if(activeDrawer){closeDrawers();return}closeSearch()}trapDrawer(event)});

  // Mobile navigation
  const menuButton=qs('[data-menu-toggle]'), mobileMenu=qs('[data-mobile-menu]');
  const setMobileMenu=open=>{if(!mobileMenu||!menuButton)return;mobileMenu.classList.toggle('is-open',open);mobileMenu.setAttribute('aria-hidden',open?'false':'true');setInert(mobileMenu,!open);menuButton.setAttribute('aria-expanded',open?'true':'false');document.body.classList.toggle('besjaar-mobile-menu-open',Boolean(open))};
  menuButton?.addEventListener('click',()=>setMobileMenu(!mobileMenu?.classList.contains('is-open')));
  mobileMenu?.addEventListener('click',event=>{if(event.target.closest('a'))setMobileMenu(false)});
  mobileMenu?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();setMobileMenu(false);menuButton?.focus()}});

  // Account popover follows the same escape/outside-click expectations as the other disclosure surfaces.
  qsa('.besjaar-ui-account-menu').forEach(details=>{
    document.addEventListener('click',event=>{if(details.open&&!details.contains(event.target))details.removeAttribute('open')});
    details.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();details.removeAttribute('open');details.querySelector('summary')?.focus()}});
  });

  // Search overlay + Search & Discovery Pro
  const searchPanel=qs('[data-search-panel]'), searchToggles=qsa('[data-search-toggle]');
  const recentSearchKey='besjaar_besjaar_ui_recent_searches';
  const recentLimit=Math.max(3,Math.min(8,Number(searchDiscovery.recentLimit||5)));
  const getRecentSearches=()=>{try{const value=JSON.parse(localStorage.getItem(recentSearchKey)||'[]');return Array.isArray(value)?value:[]}catch{return[]}};
  const saveRecentSearches=list=>{try{localStorage.setItem(recentSearchKey,JSON.stringify(list.slice(0,recentLimit)))}catch{}};
  const rememberSearch=(term)=>{const clean=String(term||'').trim().replace(/\s+/g,' ');if(clean.length<2)return;const next=[clean,...getRecentSearches().filter(x=>String(x).toLowerCase()!==clean.toLowerCase())];saveRecentSearches(next);renderRecentSearches()};
  const renderRecentSearches=()=>{
    const list=searchDiscovery.showRecent===false?[]:getRecentSearches();
    qsa('[data-recent-searches]').forEach(container=>{
      const wrap=container.closest('[data-recent-searches-wrap]');
      if(!list.length){container.innerHTML='';if(wrap)wrap.hidden=true;return}
      container.innerHTML=list.map(term=>`<a href="${escapeHtml(searchUrlForTerm(term))}" data-recent-search-link="${escapeHtml(term)}">${escapeHtml(term)}</a>`).join('');
      if(wrap)wrap.hidden=false;
    });
  };
  qsa('[data-clear-recent-searches]').forEach(button=>button.addEventListener('click',()=>{saveRecentSearches([]);renderRecentSearches()}));
  renderRecentSearches();
  const performedTerm=qs('[data-search-performed-term]')?.dataset.searchPerformedTerm;
  if(performedTerm)rememberSearch(performedTerm);
  document.addEventListener('submit',event=>{const form=event.target.closest('form[role="search"],[data-search-capture]');if(!form)return;const input=qs('input[name="q"]',form);if(input)rememberSearch(input.value)});
  document.addEventListener('click',event=>{const link=event.target.closest('[data-recent-search-link],.besjaar-ui-search-shortcuts a,.besjaar-ui-search-brands a');if(!link)return;try{const url=new URL(link.href,window.location.origin),term=url.searchParams.get('q');if(term)rememberSearch(term)}catch{}});

  const openSearch=(trigger)=>{if(!searchPanel)return;returnFocus=trigger||document.activeElement;searchPanel.classList.add('is-open');searchPanel.setAttribute('aria-hidden','false');setInert(searchPanel,false);searchToggles.forEach(b=>b.setAttribute('aria-expanded','true'));document.body.classList.add('besjaar-ui-search-open');renderRecentSearches();setTimeout(()=>qs('[data-predictive-input]',searchPanel)?.focus(),20)};
  function closeSearch(){if(!searchPanel?.classList.contains('is-open'))return;searchPanel.classList.remove('is-open');searchPanel.setAttribute('aria-hidden','true');setInert(searchPanel,true);searchToggles.forEach(b=>b.setAttribute('aria-expanded','false'));document.body.classList.remove('besjaar-ui-search-open');const f=returnFocus;returnFocus=null;f?.focus?.()}
  const trapSearch=event=>{if(!searchPanel?.classList.contains('is-open')||event.key!=='Tab')return;const items=focusable(searchPanel);if(!items.length){event.preventDefault();searchPanel.focus();return}const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}};
  searchToggles.forEach(btn=>btn.addEventListener('click',()=>searchPanel?.classList.contains('is-open')?closeSearch():openSearch(btn)));qs('[data-search-close]')?.addEventListener('click',closeSearch);
  document.addEventListener('keydown',trapSearch);

  // BesjaarUI 6.1 — native Shopify predictive search. Uses the JSON endpoint already exposed by Shopify,
  // then keeps results inside the focused Besjaar shower range when range locking is enabled.
  let predictiveTimer=0, predictiveController=null, predictiveRequestId=0;
  const predictivePrice=product=>{
    const raw=product?.price;
    if(raw===undefined||raw===null||raw==='')return '';
    const n=Number(raw);
    if(!Number.isFinite(n))return String(raw);
    const cents=String(raw).includes('.')?Math.round(n*100):Math.round(n);
    return formatMoney(cents);
  };
  const hidePredictive=input=>{
    const box=input?.closest('form')?.nextElementSibling;
    if(box?.matches?.('[data-predictive-results]')){
      box.hidden=true;box.innerHTML='';
      if(box.id)input?.setAttribute('aria-controls',box.id);
    }
    input?.setAttribute('aria-expanded','false');
  };
  const renderPredictive=(input,products,term)=>{
    const box=input?.closest('form')?.nextElementSibling;
    if(!box?.matches?.('[data-predictive-results]'))return;
    let list=Array.isArray(products)?products:[];
    if(searchProductIds.size)list=list.filter(product=>searchProductIds.has(String(product.id)));else if(focusLocked&&focusProductIds.size)list=list.filter(product=>focusProductIds.has(String(product.id)));
    list=list.slice(0,6);
    if(!list.length){
      box.innerHTML=`<div class="besjaar-ui-predictive__empty">${escapeHtml(i18n.searchNoResults||'No matches yet')}</div><a class="besjaar-ui-predictive__all" href="${escapeHtml(searchUrlForTerm(term))}">${escapeHtml(i18n.searchAll||'View all results')} →</a>`;
      if(box.id)input.setAttribute('aria-controls',box.id);
      box.hidden=false;input.setAttribute('aria-expanded','true');return;
    }
    /* Besjaar 11.6: the listbox role sits on the element that directly wraps the
       option links (heading hidden from AT), so the ARIA content model is valid. */
    const listboxId=`${box.id||'BesjaarUIPredictive'}-listbox`;
    input.setAttribute('aria-controls',listboxId);
    box.innerHTML=`<div class="besjaar-ui-predictive__grid"><div class="besjaar-ui-predictive__group besjaar-ui-predictive__group--products" role="listbox" id="${escapeHtml(listboxId)}" aria-label="${escapeHtml(i18n.searchProducts||'Products')}"><h3 aria-hidden="true">${escapeHtml(i18n.searchProducts||'Products')}</h3>${list.map(product=>{
      const image=product?.featured_image?.url||product?.featured_image||'';
      const title=translateCatalogTitle(product?.title||'');
      const price=predictivePrice(product);
      const availability=product?.available===true?`<b>${escapeHtml(i18n.searchAvailable||'Available')}</b>`:'';
      return `<a class="besjaar-ui-predictive__product" role="option" href="${escapeHtml(localizeInternalUrl(product?.url||'#'))}">${image?`<img src="${escapeHtml(image)}${String(image).includes('?')?'&':'?'}width=112" alt="" width="56" height="56" loading="lazy" decoding="async">`:'<span></span>'}<span class="besjaar-ui-predictive__product-copy"><em>BESJAAR</em><strong>${escapeHtml(title)}</strong><span class="besjaar-ui-predictive__meta">${price?`<small>${escapeHtml(price)}</small>`:''}${availability}</span></span><span aria-hidden="true">→</span></a>`;
    }).join('')}</div></div><a class="besjaar-ui-predictive__all" href="${escapeHtml(searchUrlForTerm(term))}">${escapeHtml(i18n.searchAll||'View all results')} →</a>`;
    box.hidden=false;input.setAttribute('aria-expanded','true');
  };
  qsa('[data-predictive-input]').forEach(input=>{
    input.addEventListener('input',()=>{
      clearTimeout(predictiveTimer);
      predictiveController?.abort?.();
      const term=String(input.value||'').trim();
      const requestId=++predictiveRequestId;
      if(term.length<2){hidePredictive(input);return}
      predictiveTimer=window.setTimeout(async()=>{
        try{
          predictiveController=typeof AbortController==='function'?new AbortController():null;
          const base=localizeInternalUrl(String(routes.predictiveSearch||'/search/suggest')).replace(/\.json$/,'');
          const params=new URLSearchParams({q:term,'resources[type]':'product','resources[limit]':'10','resources[options][unavailable_products]':'last','resources[options][fields]':'title,product_type,variants.title,vendor'});
          const requestOptions={headers:{Accept:'application/json'}};if(predictiveController?.signal)requestOptions.signal=predictiveController.signal;
          const response=await fetch(`${base}.json?${params.toString()}`,requestOptions);
          if(!response.ok)throw new Error('predictive_search');
          const payload=await response.json();
          if(requestId!==predictiveRequestId)return;
          renderPredictive(input,payload?.resources?.results?.products||[],term);
        }catch(error){if(requestId===predictiveRequestId&&error?.name!=='AbortError')hidePredictive(input)}
      },160);
    });
    input.addEventListener('keydown',event=>{
      if(event.key==='Escape'){hidePredictive(input);return}
      if(event.key==='ArrowDown'){
        const box=input.closest('form')?.nextElementSibling,first=box?.querySelector('[role="option"]');
        if(first&&!box.hidden){event.preventDefault();first.focus()}
      }
    });
    const box=input.closest('form')?.nextElementSibling;
    box?.addEventListener('keydown',event=>{
      const options=qsa('[role="option"]',box),index=options.indexOf(document.activeElement);
      if(event.key==='Escape'){event.preventDefault();input.focus();hidePredictive(input);return}
      if(event.key==='ArrowDown'&&options.length){event.preventDefault();options[(index+1+options.length)%options.length].focus()}
      if(event.key==='ArrowUp'&&options.length){event.preventDefault();if(index<=0){input.focus()}else{options[index-1].focus()}}
    });
  });
  document.addEventListener('click',event=>{qsa('[data-predictive-input]').forEach(input=>{const form=input.closest('form'),box=form?.nextElementSibling;if(box?.matches?.('[data-predictive-results]')&&!form?.contains(event.target)&&!box.contains(event.target))hidePredictive(input)})});

  const updateCartCount=count=>qsa('[data-cart-count]').forEach(el=>el.textContent=count);
  const changeCartLine=async(id,quantity)=>{const response=await fetch(routes.cartChange||'/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({id,quantity})});if(!response.ok)throw new Error('cart_change');return response.json()};
  const addVariant=async(variantId,quantity=1)=>{const body=new URLSearchParams({id:String(variantId),quantity:String(quantity)});const response=await fetch(routes.cartAdd||'/cart/add.js',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body});if(!response.ok)throw new Error('cart_add');return response.json()};
  const cartRangeProducts=()=>{try{const node=qs('[data-besjaar-ui-cart-range]');if(!node)return[];const parsed=JSON.parse(node.textContent||'[]');return Array.isArray(parsed)?parsed:[]}catch{return[]}};
  const cartAddonProducts=()=>{try{const node=qs('[data-besjaar-ui-cart-addons]');if(!node)return[];const parsed=JSON.parse(node.textContent||'[]');return Array.isArray(parsed)?parsed:[]}catch{return[]}};
  const renderCartRange=cart=>{
    const target=qs('[data-cart-drawer-upsell]');
    if(!target)return;
    target.innerHTML='';
    target.hidden=true;
    target.classList.remove('is-collapsed');
    const inCart=new Set((cart?.items||[]).map(item=>String(item.product_id)));
    const configuredAddons=commerce.showCartAddons===true?cartAddonProducts():[];
    const addonPool=configuredAddons.filter(item=>item?.variantId&&!inCart.has(String(item.id)));
    const useAddons=addonPool.length>0;
    const picks=(useAddons?addonPool:cartRangeProducts().filter(item=>item?.variantId&&!inCart.has(String(item.id)))).slice(0,3);
    if(!picks.length)return;
    target.hidden=false;
    const heading=useAddons?(i18n.cartAddonHeading||(isNl?'Maak je set compleet':'Complete your setup')):(i18n.cartRecommendationHeading||(isNl?'Misschien ook interessant':'You may also like'));
    const copy=useAddons?(i18n.cartAddonCopy||(isNl?'Handige accessoires voor je Besjaar douchekop.':'Useful accessories for your Besjaar showerhead.')):(i18n.cartRecommendationCopy||(isNl?'Andere producten uit het Besjaar douche-assortiment.':'Other products from the Besjaar shower range.'));
    const isOpen=true;
    const collapseText=isNl?'Verbergen':'Hide';
    const expandText=isNl?'Openen':'Show';
    const collapseLabel=isNl?'Aanbevelingen verbergen':'Hide recommendations';
    const expandLabel=isNl?'Aanbevelingen openen':'Show recommendations';
    target.innerHTML=`<div class="besjaar-ui-cart-upsell">
      <div class="besjaar-ui-cart-upsell__header">
        <div class="besjaar-ui-cart-upsell__label"><span>${escapeHtml(heading)}</span><small>${escapeHtml(copy)}</small></div>
        <button class="besjaar-ui-cart-upsell__toggle" type="button" data-cart-upsell-toggle aria-controls="BesjaarUICartUpsellBody" aria-expanded="${isOpen?'true':'false'}" aria-label="${escapeHtml(isOpen?collapseLabel:expandLabel)}">
          <span data-upsell-toggle-text>${escapeHtml(isOpen?collapseText:expandText)}</span>
          <i aria-hidden="true">${isOpen?'−':'+'}</i>
        </button>
      </div>
      <div class="besjaar-ui-cart-upsell__body" id="BesjaarUICartUpsellBody">
        <div class="besjaar-ui-cart-upsell__rail">${picks.map(item=>`<div class="besjaar-ui-cart-upsell__product"${useAddons?' data-addon="true"':''}>${item.image?`<a class="besjaar-ui-cart-upsell__media" href="${escapeHtml(item.url)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(translateCatalogTitle(item.title))}" loading="lazy"></a>`:''}<div class="besjaar-ui-cart-upsell__copy"><a href="${escapeHtml(item.url)}"><strong>${escapeHtml(translateCatalogTitle(item.title))}</strong></a><span>${formatMoney(item.price,cart?.currency||currency)}</span></div><button class="besjaar-ui-cart-upsell__add" type="button" data-cart-range-add="${escapeHtml(item.variantId)}">+ ${escapeHtml(i18n.quickAdd||'Add to cart')}</button></div>`).join('')}</div>
      </div>
      <button class="besjaar-ui-cart-upsell__tab" type="button" data-cart-upsell-toggle aria-controls="BesjaarUICartUpsellBody" aria-expanded="${isOpen?'true':'false'}" aria-label="${escapeHtml(isOpen?collapseLabel:expandLabel)}">
        <span>${escapeHtml(isOpen?collapseText:expandText)}</span>
      </button>
    </div>`;
    const syncUpsellState=open=>{
      target.classList.toggle('is-collapsed',!open);
      target.dataset.open=open?'true':'false';
      qsa('[data-cart-upsell-toggle]',target).forEach(toggle=>{
        toggle.setAttribute('aria-expanded',open?'true':'false');
        toggle.setAttribute('aria-label',open?collapseLabel:expandLabel);
        if(toggle.classList.contains('besjaar-ui-cart-upsell__toggle'))toggle.tabIndex=open?0:-1;
        const textNode=qs('[data-upsell-toggle-text]',toggle);
        if(textNode)textNode.textContent=open?collapseText:expandText;
        const icon=qs('i',toggle);
        if(icon)icon.textContent=open?'−':'+';
        const tabText=qs('span',toggle);
        if(toggle.classList.contains('besjaar-ui-cart-upsell__tab')&&tabText)tabText.textContent=open?collapseText:expandText;
      });
      const upsellBody=qs('.besjaar-ui-cart-upsell__body',target);
      if(upsellBody)upsellBody.setAttribute('aria-hidden',open?'false':'true');
    };
    qsa('[data-cart-upsell-toggle]',target).forEach(button=>button.addEventListener('click',()=>syncUpsellState(target.classList.contains('is-collapsed'))));
    syncUpsellState(isOpen);
    qsa('[data-cart-range-add]',target).forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;button.setAttribute('aria-busy','true');try{await addVariant(button.dataset.cartRangeAdd,1);measure('cart_upsell_add_succeeded',{variantId:String(button.dataset.cartRangeAdd),quantity:1});await refreshCart();toast(i18n.added||'Added to cart')}catch{button.disabled=false;toast(i18n.cartUpdateError||'Cart could not be updated. Please try again.')}finally{button.removeAttribute('aria-busy')}}));
  };
  const sanitizeCart=async cart=>{
    if(!focusLocked||!focusProductIds.size||!cart?.items?.length)return{cart,changed:false};
    const blocked=cart.items.filter(item=>!focusProductIds.has(String(item.product_id)));
    if(!blocked.length)return{cart,changed:false};
    let cleanCart=cart;
    for(const item of blocked)cleanCart=await changeCartLine(item.key,0);
    return{cart:cleanCart,changed:true};
  };

  // Product-card quick add: only rendered for simple, available products.
  document.addEventListener('click',async event=>{const button=event.target.closest('[data-card-quick-add]');if(!button)return;event.preventDefault();if(button.disabled)return;const variantId=button.dataset.cardQuickAdd;if(!variantId)return;const original=button.innerHTML;button.disabled=true;button.classList.add('is-loading');button.textContent=i18n.adding||'Adding…';let added=false;try{await addVariant(variantId,1);added=true}catch{const fallbackForm=button.closest('form.besjaar-ui-card-quick-form');if(fallbackForm){HTMLFormElement.prototype.submit.call(fallbackForm);return}const card=button.closest('.besjaar-ui-product-card,.besjaar-ui-shower-card,.besjaar-collection-product-card,.besjaar-shop-card');window.location.href=card?.querySelector('h3 a,h2 a,.besjaar-ui-product-card__title a')?.href||routes.allProducts||'/collections/all';return}try{measure('quick_add_succeeded',{variantId:String(variantId),quantity:1,placement:'product_card'});toast(i18n.added||'Added to cart');openDrawer('cart',button)}catch{if(added){toast(i18n.added||'Added to cart');try{openDrawer('cart',button)}catch{}}}finally{button.disabled=false;button.classList.remove('is-loading');button.innerHTML=original}});

  // Preserve the selected country on customer address edit forms without loading an extra library.
  qsa('select[data-default]').forEach(select=>{const wanted=(select.dataset.default||'').trim();if(!wanted)return;const option=[...select.options].find(opt=>opt.value===wanted||opt.text===wanted);if(option)select.value=option.value});
  const updateShippingProgress=(cart)=>{
    const wrap=qs('[data-free-shipping]'),text=qs('[data-free-shipping-text]'),bar=qs('[data-free-shipping-progress]'),track=qs('[data-free-shipping-track]');
    if(!wrap||!commerce.showFreeShippingBar)return;
    const threshold=Number(commerce.freeShippingThresholdCents||0);
    if(!threshold){wrap.hidden=true;return}
    wrap.hidden=false;
    const qualifyingTotal=Number(cart?.total_price||0),remaining=Math.max(0,threshold-qualifyingTotal),pct=Math.min(100,Math.max(0,(qualifyingTotal/threshold)*100));
    if(bar)bar.style.width=`${pct}%`;
    if(track)track.setAttribute('aria-valuenow',String(Math.round(pct)));
    wrap.dataset.shippingState=remaining>0?'progress':'unlocked';
    if(text)text.textContent=remaining>0?(i18n.freeShippingRemaining||'Add %amount% for free shipping').replace('%amount%',formatMoney(remaining,cart.currency||currency)):(i18n.freeShippingUnlocked||'Free shipping unlocked ✓');
  };
  const setCartLineBusy=(button,busy)=>{
    const line=button?.closest?.('.besjaar-ui-cart-drawer__line');
    if(!line)return;
    line.classList.toggle('is-updating',busy);
    line.setAttribute('aria-busy',busy?'true':'false');
    qsa('[data-line-minus],[data-line-plus],[data-remove-line]',line).forEach(control=>{control.disabled=busy});
  };
  const mutateCartLine=async(button,key,quantity)=>{
    if(!button||!key)return;
    setCartLineBusy(button,true);
    try{
      await changeCartLine(key,Math.max(0,Number(quantity||0)));
      measure('cart_line_updated',{quantity:Math.max(0,Number(quantity||0))});
      await refreshCart();
    }catch(error){
      setCartLineBusy(button,false);
      toast(i18n.cartUpdateError||'Cart could not be updated. Please try again.');
    }
  };
  /* Besjaar 11.6: rapid updates from several drawer lines used to race — two
     /cart.js reads could resolve out of order and paint a stale snapshot. Each
     refresh takes a token; stale responses (token mismatch) are discarded. */
  let cartRefreshToken=0;
  const refreshCart=async()=>{
    const body=qs('[data-cart-drawer-body]'),total=qs('[data-cart-drawer-total]'),discount=qs('[data-cart-drawer-discount]'),foot=qs('[data-cart-drawer-foot]'),checkout=qs('[data-cart-drawer-checkout]');
    if(!body)return;
    let refreshId=++cartRefreshToken;
    body.setAttribute('aria-busy','true');
    if(checkout){checkout.disabled=true;checkout.setAttribute('aria-busy','true')}
    body.innerHTML=`<div class="besjaar-ui-empty besjaar-ui-cart-loading"><span class="besjaar-ui-cart-loading__dot" aria-hidden="true"></span>${escapeHtml(i18n.cartLoading||'Loading…')}</div>`;
    try{
      let cart=await fetch(routes.cartJson||'/cart.js',{headers:{Accept:'application/json'}}).then(r=>{if(!r.ok)throw new Error('cart_json');return r.json()});
      if(refreshId!==cartRefreshToken)return;
      const sanitized=await sanitizeCart(cart);cart=sanitized.cart;
      if(sanitized.changed){
        /* sanitizeCart mutated the server cart, so this response is now the
           freshest state — re-claim the token so it cannot be discarded in
           favor of an older pre-sanitization snapshot. */
        refreshId=++cartRefreshToken;
      }
      if(refreshId!==cartRefreshToken)return;
      updateCartCount(cart.item_count);
      if(total)total.textContent=formatMoney(cart.total_price,cart.currency||currency);
      updateShippingProgress(cart);
      if(discount){discount.hidden=!(cart.total_discount>0);discount.textContent=cart.total_discount>0?(i18n.cartSavings||'You save %amount%').replace('%amount%',formatMoney(cart.total_discount,cart.currency||currency)):''}
      if(!cart.items.length){
        if(foot)foot.hidden=true;
        if(checkout){checkout.disabled=true;checkout.removeAttribute('aria-busy')}
        body.innerHTML=`<div class="besjaar-ui-empty besjaar-ui-cart-empty-state"><p>${escapeHtml(i18n.cartEmpty||'Your cart is empty.')}</p><a class="besjaar-ui-button besjaar-ui-button--primary" href="${escapeHtml(routes.allProducts||'/collections/all')}">${escapeHtml(i18n.shopProducts||'Shop products')}</a></div>`;
        renderCartRange(cart);return;
      }
      if(foot)foot.hidden=false;
      if(checkout){checkout.disabled=false;checkout.removeAttribute('aria-busy')}
      body.innerHTML=cart.items.map(item=>{
        const itemTitle=translateCatalogTitle(item.product_title),currencyCode=cart.currency||currency;
        const options=Array.isArray(item.options_with_values)?item.options_with_values.filter(option=>option?.value&&String(option.value).toLowerCase()!=='default title'):[];
        const variantMeta=options.length?options.map(option=>`<span><b>${escapeHtml(option.name||'')}</b>${option.name?': ':''}${escapeHtml(option.value||'')}</span>`).join(''):(item.variant_title&&String(item.variant_title).toLowerCase()!=='default title'?`<span>${escapeHtml(item.variant_title)}</span>`:'');
        const properties=Object.entries(item.properties||{}).filter(([key,value])=>value&&key&&key.charAt(0)!=='_').map(([key,value])=>`<span><b>${escapeHtml(key)}</b>: ${escapeHtml(String(value))}</span>`).join('');
        const original=Number(item.original_line_price||0),finalPrice=Number(item.final_line_price||0),hasDiscount=original>finalPrice&&original>0,savingPct=hasDiscount?Math.max(1,Math.round((1-finalPrice/original)*100)):0;
        const priceHtml=`<div class="besjaar-ui-cart-drawer__prices">${hasDiscount?`<del><span class="besjaar-ui-visually-hidden">${escapeHtml(i18n.regularPrice||'Regular price')} </span>${formatMoney(original,currencyCode)}</del>`:''}${hasDiscount?`<span class="besjaar-ui-visually-hidden">${escapeHtml(i18n.salePrice||'Sale price')} </span>`:''}<strong>${formatMoney(finalPrice,currencyCode)}</strong>${hasDiscount?`<em>${escapeHtml((i18n.savePercent||'Save %percent%').replace('%percent%',savingPct+'%'))}</em>`:''}</div>`;
        return `<div class="besjaar-ui-drawer__item besjaar-ui-cart-drawer__line" aria-busy="false">${item.image?`<a class="besjaar-ui-cart-drawer__media" href="${escapeHtml(localizeInternalUrl(item.url))}" aria-label="${escapeHtml(itemTitle)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(itemTitle)}" width="124" height="124" loading="lazy" decoding="async"></a>`:'<div class="besjaar-ui-cart-drawer__media besjaar-ui-cart-drawer__media--empty" aria-hidden="true"></div>'}<div class="besjaar-ui-cart-drawer__line-main"><a href="${escapeHtml(localizeInternalUrl(item.url))}"><h3>${escapeHtml(itemTitle)}</h3></a>${variantMeta?`<small class="besjaar-ui-cart-drawer__variant">${variantMeta}</small>`:''}${item.selling_plan_allocation?.selling_plan?.name?`<small class="besjaar-ui-selling-plan-line">${escapeHtml(item.selling_plan_allocation.selling_plan.name)}</small>`:''}${properties?`<small class="besjaar-ui-cart-drawer__properties">${properties}</small>`:''}</div><div class="besjaar-ui-cart-drawer__line-side">${priceHtml}<div class="besjaar-ui-line-quantity"><button type="button" data-line-minus="${escapeHtml(item.key)}" aria-label="${escapeHtml((i18n.decrease||'Decrease')+' '+itemTitle)}">−</button><span>${item.quantity}</span><button type="button" data-line-plus="${escapeHtml(item.key)}" aria-label="${escapeHtml((i18n.increase||'Increase')+' '+itemTitle)}">+</button></div></div><button class="besjaar-ui-cart-drawer__remove" type="button" data-remove-line="${escapeHtml(item.key)}" aria-label="${escapeHtml((i18n.remove||'Remove')+' '+itemTitle)}">×</button></div>`
      }).join('');
      qsa('[data-remove-line]',body).forEach(button=>button.addEventListener('click',()=>mutateCartLine(button,button.dataset.removeLine,0)));
      qsa('[data-line-minus]',body).forEach(button=>button.addEventListener('click',()=>{const line=cart.items.find(x=>x.key===button.dataset.lineMinus);if(line)mutateCartLine(button,line.key,line.quantity-1)}));
      qsa('[data-line-plus]',body).forEach(button=>button.addEventListener('click',()=>{const line=cart.items.find(x=>x.key===button.dataset.linePlus);if(line)mutateCartLine(button,line.key,line.quantity+1)}));
      renderCartRange(cart);
    }catch(error){
      if(refreshId!==cartRefreshToken)return;
      if(foot)foot.hidden=true;
      if(checkout){checkout.disabled=true;checkout.removeAttribute('aria-busy')}
      body.innerHTML=`<div class="besjaar-ui-empty besjaar-ui-cart-error-state"><p>${escapeHtml(i18n.cartError||'Cart could not be loaded.')}</p><div class="besjaar-ui-cart-error-state__actions"><button class="besjaar-ui-button besjaar-ui-button--primary" type="button" data-cart-retry>${escapeHtml(i18n.retry||'Retry')}</button><a class="besjaar-ui-button besjaar-ui-button--ghost" href="${escapeHtml(routes.cart||'/cart')}">${escapeHtml(i18n.openCart||'Open cart')}</a></div></div>`;
      qs('[data-cart-retry]',body)?.addEventListener('click',refreshCart,{once:true});
    }finally{
      if(refreshId===cartRefreshToken){
        body.setAttribute('aria-busy','false');
        if(checkout?.getAttribute('aria-busy')==='true')checkout.removeAttribute('aria-busy');
      }
    }
  };

  // AJAX product forms
  qsa('[data-ajax-product-form]').forEach(form=>form.addEventListener('submit',async event=>{if(event.submitter&&event.submitter.name==='checkout')return;event.preventDefault();const button=qs('[type="submit"]',form),old=button?.innerHTML,productRoot=form.closest('[data-product-root]'),status=productRoot?.querySelector('[data-product-form-status]'),stickyButton=productRoot?.querySelector('[data-sticky-submit]'),stickyOld=stickyButton?.innerHTML,quantityInput=qs('[data-product-quantity]',form),variantInput=qs('[data-variant-id]',form);const quantity=Math.floor(Number(quantityInput?.value||1));if(!Number.isFinite(quantity)||quantity<1){const message=i18n.invalidQuantity||'Enter a quantity of 1 or more.';if(quantityInput){quantityInput.value='1';quantityInput.setAttribute('aria-invalid','true');quantityInput.focus()}if(status){status.textContent=message;status.classList.add('is-error');status.classList.remove('is-success')}toast(message);return}quantityInput?.removeAttribute('aria-invalid');if(!variantInput?.value||button?.disabled){const message=i18n.variantUnavailable||productRoot?.dataset.soldOutLabel||'This option is currently unavailable.';if(status){status.textContent=message;status.classList.add('is-error');status.classList.remove('is-success')}toast(message);return}if(button){button.disabled=true;button.classList.add('is-loading');button.setAttribute('aria-busy','true');button.textContent=i18n.adding||'Adding…'}if(stickyButton){stickyButton.disabled=true;stickyButton.classList.add('is-loading');stickyButton.setAttribute('aria-busy','true');stickyButton.textContent=i18n.adding||'Adding…'}if(status){status.textContent='';status.classList.remove('is-error','is-success')}let response;try{response=await fetch(routes.cartAdd||'/cart/add.js',{method:'POST',headers:{Accept:'application/json'},body:new FormData(form)})}catch{const message=productRoot?.dataset.addError||i18n.addError||'This product could not be added to the cart. Please check your connection and try again.';if(status){status.textContent=message;status.classList.add('is-error');status.classList.remove('is-success')}toast(message);if(button){button.disabled=false;button.classList.remove('is-loading');button.removeAttribute('aria-busy');button.innerHTML=old}if(stickyButton){stickyButton.disabled=button?.disabled||false;stickyButton.classList.remove('is-loading');stickyButton.removeAttribute('aria-busy');stickyButton.innerHTML=stickyOld}return}try{if(!response.ok){let detail='';try{const payload=await response.json();detail=payload?.description||payload?.message||''}catch{}const message=detail||productRoot?.dataset.addError||'This product could not be added to the cart.';if(status){status.textContent=message;status.classList.add('is-error')}toast(message);return}let addedItem={};try{addedItem=await response.json()}catch{}measure('product_form_add_succeeded',{productId:addedItem.product_id||config.analytics?.context?.productId||null,variantId:addedItem.variant_id||addedItem.id||null,quantity:Number(addedItem.quantity||qs('[data-product-quantity]',form)?.value||1),sellingPlan:Boolean(addedItem.selling_plan_allocation)});const success=productRoot?.dataset.addedStatus||i18n.added||'Added to cart';if(status){status.textContent=success;status.classList.add('is-success')}toast(i18n.added||'Added to cart');openDrawer('cart',button)}catch{const success=productRoot?.dataset.addedStatus||i18n.added||'Added to cart';if(status){status.textContent=success;status.classList.add('is-success')}toast(i18n.added||'Added to cart');try{openDrawer('cart',button)}catch{}}finally{if(button){button.classList.remove('is-loading');button.removeAttribute('aria-busy');button.innerHTML=old;button.disabled=productRoot?.querySelector('[data-variant-id]')?.value?button.dataset.variantAvailable==='false':false}if(stickyButton){stickyButton.classList.remove('is-loading');stickyButton.removeAttribute('aria-busy');stickyButton.innerHTML=stickyOld;stickyButton.disabled=button?.disabled||false}}}));


  // Remove legacy/non-range products only when an explicit legacy range lock is enabled. On the cart page, reload once so totals and lines
  // are rendered from the sanitized Shopify cart.
  const sanitizeExistingCart=async()=>{
    if(!focusLocked||!focusProductIds.size||Number(config.analytics?.context?.cartItemCount||0)<1)return;
    try{
      const current=await fetch(routes.cartJson||'/cart.js',{headers:{Accept:'application/json'}}).then(r=>r.json());
      const result=await sanitizeCart(current);
      if(!result.changed)return;
      updateCartCount(result.cart.item_count);
      if(qs('[data-cart-page-form]'))window.location.reload();
    }catch{}
  };
  sanitizeExistingCart();

  // Cart page — smooth quantity/remove updates with a no-JS form fallback.
  const cartPageForm=qs('[data-cart-page-form]');
  if(cartPageForm){
    const cartPageStatus=qs('[data-cart-page-status]',cartPageForm);
    const cartPageCheckout=qs('[data-cart-page-checkout]',cartPageForm);
    const setCartPageStatus=(message,state='')=>{if(!cartPageStatus)return;cartPageStatus.textContent=message||'';cartPageStatus.dataset.state=state};
    const setCartPageLineBusy=(line,busy)=>{if(!line)return;line.classList.toggle('is-updating',busy);line.setAttribute('aria-busy',busy?'true':'false');qsa('button,input,a[data-cart-page-remove]',line).forEach(control=>{if(control instanceof HTMLAnchorElement)control.toggleAttribute('aria-disabled',busy);else control.disabled=busy});if(cartPageCheckout)cartPageCheckout.disabled=busy};
    const updateCartPageSummary=(cart)=>{
      updateCartCount(cart.item_count);
      const itemCountNode=qs('[data-cart-page-item-count]',cartPageForm);if(itemCountNode){const singularTemplate=itemCountNode.dataset.countTemplateOne;const template=(cart.item_count===1&&singularTemplate)?singularTemplate:(itemCountNode.dataset.countTemplate||'%count%');itemCountNode.textContent=template.replace('__COUNT__',String(cart.item_count)).replace('%count%',String(cart.item_count))}
      const totalNode=qs('[data-cart-page-total]',cartPageForm);if(totalNode)totalNode.textContent=formatMoney(cart.total_price,cart.currency||currency);
      const savings=qs('[data-cart-page-savings]',cartPageForm),savingsAmount=qs('[data-cart-page-savings-amount]',cartPageForm);if(savings){savings.hidden=!(cart.total_discount>0);if(savingsAmount)savingsAmount.textContent=cart.total_discount>0?`−${formatMoney(cart.total_discount,cart.currency||currency)}`:''}
      const shipping=qs('[data-cart-page-free-shipping]',cartPageForm);if(shipping){const threshold=Number(commerce.freeShippingThresholdCents||0);if(threshold>0){const remaining=Math.max(0,threshold-cart.total_price),pct=Math.max(0,Math.min(100,(cart.total_price/threshold)*100)),text=qs('[data-cart-page-free-shipping-text]',shipping),bar=qs('[data-cart-page-free-shipping-progress]',shipping),track=qs('[data-cart-page-free-shipping-track]',shipping);if(text)text.textContent=remaining>0?(i18n.freeShippingRemaining||'Add %amount% for free shipping').replace('%amount%',formatMoney(remaining,cart.currency||currency)):(i18n.freeShippingUnlocked||'Free shipping unlocked ✓');if(bar)bar.style.width=`${pct}%`;if(track)track.setAttribute('aria-valuenow',String(Math.round(pct)));shipping.dataset.shippingState=remaining>0?'progress':'unlocked'}}
      if(cartPageCheckout)cartPageCheckout.disabled=cart.item_count<1;
    };
    let cartPageQueue=Promise.resolve();
    const mutateCartPageLine=(line,quantity)=>{
      if(!line||line.classList.contains('is-updating'))return;
      const key=line.dataset.cartLineKey;if(!key)return;
      const next=Math.max(0,Math.floor(Number(quantity||0)));
      cartPageQueue=cartPageQueue.then(async()=>{
        if(!line.isConnected)return;
        setCartPageLineBusy(line,true);setCartPageStatus(i18n.cartUpdating||'Updating cart…','busy');
        try{
          const cart=await changeCartLine(key,next);
          const item=cart.items.find(entry=>entry.key===key);
          if(!item){line.remove()}else{const input=qs('[data-cart-page-quantity]',line);if(input)input.value=item.quantity;const price=qs('[data-cart-page-line-price]',line);if(price)price.textContent=formatMoney(item.final_line_price,cart.currency||currency)}
          updateCartPageSummary(cart);setCartPageStatus(i18n.cartUpdated||'Cart updated.','success');
          if(!cart.items.length){window.location.reload();return}
        }catch(error){setCartPageStatus(i18n.cartUpdateError||'Cart could not be updated. Please try again.','error');toast(i18n.cartUpdateError||'Cart could not be updated. Please try again.')}finally{if(line.isConnected)setCartPageLineBusy(line,false);if(cartPageCheckout&&document.querySelectorAll('[data-cart-page-line]').length)cartPageCheckout.disabled=false}
      });
    };
    qsa('[data-cart-page-line]',cartPageForm).forEach(line=>{
      const input=qs('[data-cart-page-quantity]',line);let timer=0;const schedule=(value,delay=170)=>{clearTimeout(timer);timer=window.setTimeout(()=>mutateCartPageLine(line,value),delay)};
      qs('[data-cart-page-minus]',line)?.addEventListener('click',()=>{const next=Math.max(0,Number(input?.value||0)-1);if(input)input.value=next;schedule(next)});
      qs('[data-cart-page-plus]',line)?.addEventListener('click',()=>{const next=Number(input?.value||0)+1;if(input)input.value=next;schedule(next)});
      input?.addEventListener('change',()=>{const next=Math.max(0,Math.floor(Number(input.value||0)));input.value=next;schedule(next,80)});
      qs('[data-cart-page-remove]',line)?.addEventListener('click',event=>{event.preventDefault();schedule(0,0)});
    });
    cartPageForm.addEventListener('submit',event=>{if(event.submitter?.name==='checkout'&&cartPageCheckout){cartPageCheckout.dataset.idleLabel=cartPageCheckout.dataset.idleLabel||cartPageCheckout.textContent;cartPageCheckout.setAttribute('aria-busy','true');cartPageCheckout.textContent=i18n.checkoutLoading||'Opening checkout…';window.setTimeout(()=>{cartPageCheckout.disabled=true},0)}});
  }

  qsa('[data-cart-checkout-form]').forEach(form=>form.addEventListener('submit',()=>{const button=qs('[data-cart-drawer-checkout]',form);if(!button||button.disabled)return;button.dataset.idleLabel=button.dataset.idleLabel||button.textContent;button.setAttribute('aria-busy','true');button.textContent=i18n.checkoutLoading||'Opening checkout…';window.setTimeout(()=>{button.disabled=true},0)}));

  // Browsers can restore a submitted page from the back/forward cache with disabled controls still present.
  // Reset transient loading state on pageshow so returning shoppers can interact immediately.
  window.addEventListener('pageshow',()=>{
    qsa('[data-cart-drawer-checkout],[data-cart-page-checkout]').forEach(button=>{
      button.disabled=false;
      button.removeAttribute('aria-busy');
      if(button.dataset.idleLabel)button.textContent=button.dataset.idleLabel;
    });
    qsa('.is-loading').forEach(node=>node.classList.remove('is-loading'));
  });
  window.addEventListener('pagehide',()=>{clearTimeout(predictiveTimer);predictiveController?.abort?.()});

  // Reveal
  const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{rootMargin:'0px 0px -8% 0px'}):null;qsa('[data-reveal]').forEach(el=>observer?observer.observe(el):el.classList.add('is-visible'));
})();

/* Besjaar UI 3.3 — Mobile Commerce & Shopify Markets OS */
(() => {
  const config = window.BesjaarUIConfig || {};
  const mobile = config.mobile || {};
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const mobileQuery = window.matchMedia('(max-width: 700px)');
  // These helpers are scoped to the first IIFE and were referenced here without a
  // local definition, so this whole module (and everything after it) crashed with
  // a ReferenceError before the compact header, swipe gallery or polish flags ran.
  const listenMedia=(query,handler)=>{if(!query||!handler)return;if(typeof query.addEventListener==='function')query.addEventListener('change',handler);else if(typeof query.addListener==='function')query.addListener(handler)};
  const scrollElementToX=(node,left,behavior='auto')=>{if(!node)return;try{if(typeof node.scrollTo==='function')node.scrollTo({left,behavior});else node.scrollLeft=left}catch{node.scrollLeft=left}};

  // Native Shopify localization form submission.
  qsa('[data-besjaar-ui-localization-select]').forEach(select => {
    select.addEventListener('change', () => select.form?.requestSubmit ? select.form.requestSubmit() : select.form?.submit());
  });
  qsa('[data-besjaar-ui-localization]').forEach(details => {
    document.addEventListener('click', event => { if (details.open && !details.contains(event.target)) details.removeAttribute('open'); });
    details.addEventListener('keydown', event => { if (event.key === 'Escape') { details.removeAttribute('open'); details.querySelector('summary')?.focus(); } });
  });

  // Mobile compact header: retains sticky navigation but gives more content space after scroll.
  const header = qs('[data-site-header]');
  if (header && mobile.compactHeader !== false) {
    let ticking = false;
    const update = () => { header.classList.toggle('is-mobile-compact', mobileQuery.matches && window.scrollY > 54); ticking = false; };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    listenMedia(mobileQuery,update); update();
  }

  // Swipeable product media on phones. Desktop retains thumbnail-controlled gallery behavior.
  const productRoot = qs('[data-product-root]');
  const stage = productRoot?.querySelector('.besjaar-ui-product-v16__media-stage');
  if (productRoot && stage && mobile.swipeGallery !== false) {
    const media = qsa('[data-product-media]', stage);
    const thumbs = qsa('[data-product-media-thumb]', productRoot);
    const counter = qs('[data-media-current]', stage);
    let scrollTimer = 0;
    const syncActive = index => {
      const safe = Math.max(0, Math.min(media.length - 1, index));
      media.forEach((item, i) => item.classList.toggle('is-active', i === safe));
      thumbs.forEach((thumb, i) => { thumb.classList.toggle('is-active', i === safe); thumb.setAttribute('aria-pressed', i === safe ? 'true' : 'false'); });
      if (counter) counter.textContent = safe + 1;
    };
    const enableMobile = () => {
      if (!mobileQuery.matches) {
        const active = media.find(item => item.classList.contains('is-active')) || media[0];
        media.forEach(item => { item.hidden = item !== active; });
        return;
      }
      media.forEach(item => { item.hidden = false; });
    };
    const scrollToMedia = id => {
      if (!mobileQuery.matches) return;
      enableMobile();
      const target = media.find(item => String(item.dataset.productMedia) === String(id));
      if (!target) return;
      scrollElementToX(stage,target.offsetLeft,(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)?'auto':'smooth');
    };
    thumbs.forEach(thumb => thumb.addEventListener('click', () => window.setTimeout(() => scrollToMedia(thumb.dataset.productMediaThumb), 0)));
    productRoot.querySelectorAll('[data-product-option]').forEach(select => select.addEventListener('change', () => window.setTimeout(() => {
      enableMobile();
      const active = media.find(item => item.classList.contains('is-active'));
      if (active) scrollElementToX(stage,active.offsetLeft,(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)?'auto':'smooth');
    }, 20)));
    stage.addEventListener('scroll', () => {
      if (!mobileQuery.matches) return;
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const center = stage.scrollLeft + stage.clientWidth / 2;
        let best = 0, distance = Infinity;
        media.forEach((item, i) => { const d = Math.abs((item.offsetLeft + item.offsetWidth / 2) - center); if (d < distance) { distance = d; best = i; } });
        syncActive(best);
        media.forEach((item, i) => { if (i !== best) item.querySelectorAll('video').forEach(video => video.pause?.()); });
      }, 70);
    }, { passive: true });
    listenMedia(mobileQuery,enableMobile); enableMobile();
  }

  // Ensure full-screen search does not leave background scrollable on mobile.
  const searchPanel = qs('[data-search-panel]');
  if (searchPanel && mobile.fullscreenSearch !== false) {
    const observer = new MutationObserver(() => {
      const open = mobileQuery.matches && searchPanel.classList.contains('is-open');
      document.documentElement.classList.toggle('besjaar-ui-mobile-search-open', open);
    });
    observer.observe(searchPanel, { attributes: true, attributeFilter: ['class'] });
  }
})();

/* ===== BesjaarUI 3.4.1 consolidated polish helpers ===== */
/* Besjaar UI 3.4 — restrained motion and polish helpers */
(() => {
  const body = document.body;
  if (!body?.classList.contains('besjaar-ui-polish-v34')) return;
  const design = window.BesjaarUIConfig?.design || {};
  const designMode = window.BesjaarUIConfig?.editor?.designMode === true || window.Shopify?.designMode === true;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (designMode) body.classList.add('besjaar-ui-design-mode');

  if (design.cardLift !== false) body.classList.add('besjaar-ui-card-lift');
  if (design.stickyDesktopBuybox !== false) body.classList.add('besjaar-ui-sticky-buybox');

  if (design.polishedMotion !== false && !reduced) {
    body.classList.add('besjaar-ui-motion-enabled');
  }

  if (designMode || design.sectionReveal === false || design.polishedMotion === false || reduced || !('IntersectionObserver' in window)) return;

  const targets = [
    ...document.querySelectorAll('.shopify-section > .besjaar-ui-section, .shopify-section > section'),
    ...document.querySelectorAll('.besjaar-ui-card, .besjaar-ui-product-card, .besjaar-ui-promo-card, .besjaar-ui-trust-item')
  ].filter((node, index, arr) => arr.indexOf(node) === index);

  targets.forEach((node, index) => {
    node.setAttribute('data-besjaar-ui-polish-reveal','');
    node.setAttribute('data-besjaar-ui-polish-reveal-delay', String(index % 4));
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-besjaar-ui-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

  targets.forEach(node => observer.observe(node));
})();

/* Besjaar 11.6 — delivery-date estimator (moved from besjaar-ui-product.js so the cart
   drawer, cart page and home delivery section show computed dates on every page,
   not only on shower product pages). */
(() => {
  const config=window.BesjaarUIConfig||{}, delivery=config.delivery||{}, i18n=config.i18n||{};
  if(!delivery.enabled)return;
  if(!document.querySelector('[data-delivery-estimate]'))return;
  const lang=(document.documentElement.lang||'nl').toLowerCase();
  const locale=document.documentElement.lang||(lang.indexOf('nl')===0?'nl-NL':'en-NL');
  const isWeekend=(date)=>date.getDay()===0||date.getDay()===6;
  const nextBusinessDay=(date)=>{const d=new Date(date);d.setHours(12,0,0,0);do{d.setDate(d.getDate()+1)}while(delivery.skipWeekends&&isWeekend(d));return d};
  const addBusinessDays=(date,count)=>{let d=new Date(date);d.setHours(12,0,0,0);let added=0;while(added<count){d.setDate(d.getDate()+1);if(!delivery.skipWeekends||!isWeekend(d))added++}return d};
  const formatDate=(date)=>{try{return new Intl.DateTimeFormat(locale,{weekday:'short',day:'numeric',month:'short'}).format(date)}catch{return date.toLocaleDateString()}};
  const now=new Date();let start=new Date(now);start.setHours(12,0,0,0);
  if(delivery.skipWeekends&&isWeekend(start))start=nextBusinessDay(start);
  if(now.getHours()>=Number(delivery.cutoffHour||24))start=nextBusinessDay(start);
  const dispatch=addBusinessDays(start,Number(delivery.processingDays||0));
  const from=addBusinessDays(dispatch,Number(delivery.transitMinDays||1));
  const to=addBusinessDays(dispatch,Math.max(Number(delivery.transitMinDays||1),Number(delivery.transitMaxDays||1)));
  const sameDay=from.getFullYear()===to.getFullYear()&&from.getMonth()===to.getMonth()&&from.getDate()===to.getDate();
  const rangeTemplate=i18n.deliveryEstimateRange||'%from% – %to%';
  const text=sameDay?formatDate(from):rangeTemplate
    .replace(/%from%|\{\{\s*from\s*\}\}/gi,formatDate(from))
    .replace(/%to%|\{\{\s*to\s*\}\}/gi,formatDate(to));
  document.querySelectorAll('[data-delivery-estimate]').forEach(el=>el.textContent=text);
})();
