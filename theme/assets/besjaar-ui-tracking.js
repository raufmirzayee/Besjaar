/* Besjaar UI 5.0 Phase 1 — ParcelPanel tracking-page skin */
// BesjaarUI 4.6.4 — Retail skin for the ParcelPanel/CWILL app-proxy tracking page.
(() => {
  if (!/\/apps\/parcelpanel(?:\/|$)/i.test(window.location.pathname)) return;
  const body=document.body;
  const main=document.querySelector('#MainContent');
  if(!body||!main)return;
  body.classList.add('besjaar-ui-parcelpanel-page');
  const copy=window.BesjaarUIConfig?.trackingCopy||{
    kicker:'BESJAAR / ORDER TRACKING',
    title:'Where is your order?',
    body:'Use your order number and email/phone, or enter your tracking number directly. The carrier remains the source for the latest shipment status.',
    order:'Order details',tracking:'Tracking number',support:'Need help?',supportBody:'If tracking is unclear, Besjaar can help with your order.',supportCta:'Contact us',
    chip1:'Order or tracking number',chip2:'Carrier updates',chip3:'Besjaar support'
  };
  const esc=v=>String(v).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const getContact=()=>{const configured=window.BesjaarUIConfig?.routes?.contact;if(configured)return configured;const found=document.querySelector('a[href*="/pages/contact"],a[href*="/contact"]')?.href;if(found)return found;const root=window.Shopify?.routes?.root||'/';return `${root}pages/contact`};
  const enhance=()=>{
    if(!main.querySelector('.besjaar-ui-parcelpanel-hero')){
      const hero=document.createElement('section');
      hero.className='besjaar-ui-parcelpanel-hero';
      hero.innerHTML=`<div class="besjaar-ui-parcelpanel-hero__copy"><p class="besjaar-ui-kicker">${esc(copy.kicker)}</p><h1>${esc(copy.title)}</h1><p>${esc(copy.body)}</p><div class="besjaar-ui-parcelpanel-chips"><span>${esc(copy.chip1)}</span><span>${esc(copy.chip2)}</span><span>${esc(copy.chip3)}</span></div></div><div class="besjaar-ui-parcelpanel-hero__mark" aria-hidden="true"><span>01</span><strong>B</strong></div>`;
      main.prepend(hero);
    }
    [...main.children].forEach(el=>{
      if(el.nodeType===1&&!el.classList.contains('besjaar-ui-parcelpanel-hero')&&!el.classList.contains('besjaar-ui-parcelpanel-support')&&el.tagName!=='SCRIPT'&&el.tagName!=='STYLE')el.classList.add('besjaar-ui-parcelpanel-app-frame');
    });
    const appHeading=[...main.querySelectorAll('.besjaar-ui-parcelpanel-app-frame h1,.besjaar-ui-parcelpanel-app-frame h2')].find(el=>/volg|track/i.test(el.textContent||''));
    if(appHeading)appHeading.classList.add('besjaar-ui-parcelpanel-original-heading');
    main.querySelectorAll('.besjaar-ui-parcelpanel-app-frame input').forEach(input=>input.classList.add('besjaar-ui-parcelpanel-input'));
    main.querySelectorAll('.besjaar-ui-parcelpanel-app-frame button,.besjaar-ui-parcelpanel-app-frame input[type="submit"],.besjaar-ui-parcelpanel-app-frame input[type="button"]').forEach(btn=>btn.classList.add('besjaar-ui-parcelpanel-button'));
    if(!main.querySelector('.besjaar-ui-parcelpanel-support')){
      const support=document.createElement('aside');
      support.className='besjaar-ui-parcelpanel-support';
      support.innerHTML=`<div><p class="besjaar-ui-kicker">${esc(copy.support)}</p><strong>${esc(copy.supportBody)}</strong></div><a class="besjaar-ui-button besjaar-ui-button--ghost" href="${esc(getContact())}">${esc(copy.supportCta)} →</a>`;
      main.append(support);
    }
  };
  enhance();
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}).observe(main,{childList:true,subtree:true});
})();
