/* Besjaar Nova 5.0 Phase 1 — ParcelPanel tracking-page skin */
// Nova 4.6.4 — Retail skin for the ParcelPanel/CWILL app-proxy tracking page.
(() => {
  if (!/\/apps\/parcelpanel(?:\/|$)/i.test(window.location.pathname)) return;
  const body=document.body;
  const main=document.querySelector('#MainContent');
  if(!body||!main)return;
  body.classList.add('nova-parcelpanel-page');
  const copy=window.NovaConfig?.trackingCopy||{
    kicker:'BESJAAR / ORDER TRACKING',
    title:'Where is your order?',
    body:'Use your order number and email/phone, or enter your tracking number directly. The carrier remains the source for the latest shipment status.',
    order:'Order details',tracking:'Tracking number',support:'Need help?',supportBody:'If tracking is unclear, Besjaar can help with your order.',supportCta:'Contact us',
    chip1:'Order or tracking number',chip2:'Carrier updates',chip3:'Besjaar support'
  };
  const esc=v=>String(v).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const getContact=()=>{const configured=window.NovaConfig?.routes?.contact;if(configured)return configured;const found=document.querySelector('a[href*="/pages/contact"],a[href*="/contact"]')?.href;if(found)return found;const root=window.Shopify?.routes?.root||'/';return `${root}pages/contact`};
  const enhance=()=>{
    if(!main.querySelector('.nova-parcelpanel-hero')){
      const hero=document.createElement('section');
      hero.className='nova-parcelpanel-hero';
      hero.innerHTML=`<div class="nova-parcelpanel-hero__copy"><p class="nova-kicker">${esc(copy.kicker)}</p><h1>${esc(copy.title)}</h1><p>${esc(copy.body)}</p><div class="nova-parcelpanel-chips"><span>${esc(copy.chip1)}</span><span>${esc(copy.chip2)}</span><span>${esc(copy.chip3)}</span></div></div><div class="nova-parcelpanel-hero__mark" aria-hidden="true"><span>01</span><strong>B</strong></div>`;
      main.prepend(hero);
    }
    [...main.children].forEach(el=>{
      if(el.nodeType===1&&!el.classList.contains('nova-parcelpanel-hero')&&!el.classList.contains('nova-parcelpanel-support')&&el.tagName!=='SCRIPT'&&el.tagName!=='STYLE')el.classList.add('nova-parcelpanel-app-frame');
    });
    const appHeading=[...main.querySelectorAll('.nova-parcelpanel-app-frame h1,.nova-parcelpanel-app-frame h2')].find(el=>/volg|track/i.test(el.textContent||''));
    if(appHeading)appHeading.classList.add('nova-parcelpanel-original-heading');
    main.querySelectorAll('.nova-parcelpanel-app-frame input').forEach(input=>input.classList.add('nova-parcelpanel-input'));
    main.querySelectorAll('.nova-parcelpanel-app-frame button,.nova-parcelpanel-app-frame input[type="submit"],.nova-parcelpanel-app-frame input[type="button"]').forEach(btn=>btn.classList.add('nova-parcelpanel-button'));
    if(!main.querySelector('.nova-parcelpanel-support')){
      const support=document.createElement('aside');
      support.className='nova-parcelpanel-support';
      support.innerHTML=`<div><p class="nova-kicker">${esc(copy.support)}</p><strong>${esc(copy.supportBody)}</strong></div><a class="nova-button nova-button--ghost" href="${esc(getContact())}">${esc(copy.supportCta)} →</a>`;
      main.append(support);
    }
  };
  enhance();
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}).observe(main,{childList:true,subtree:true});
})();
