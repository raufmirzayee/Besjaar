/* Besjaar UI 5.0 Phase 1 — customer account runtime */
// BesjaarUI 4.6 — Retail Account OS
(() => {
  const root=document.querySelector('[data-account-retail]');
  if(!root)return;
  const qs=(s,c=root)=>c.querySelector(s),qsa=(s,c=root)=>[...c.querySelectorAll(s)];
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const localeRoot=String(window.BesjaarUIConfig?.routes?.root||window.Shopify?.routes?.root||'/');
  const localeUrl=(value='')=>{const raw=String(value||'').trim();if(!raw)return '#';if(/^(?:https?:)?\/\//i.test(raw)){try{const u=new URL(raw,window.location.origin);if(u.origin!==window.location.origin)return raw;return localeUrl(`${u.pathname}${u.search}${u.hash}`)}catch{return raw}}if(!raw.startsWith('/'))return raw;if(localeRoot==='/'||raw.startsWith(localeRoot))return raw;return `${localeRoot}${raw.slice(1)}`};

  // Local-time greeting, without changing the canonical Besjaar brand name.
  const greeting=qs('[data-account-greeting]');
  if(greeting){
    const hour=new Date().getHours();
    const phrase=hour<12?root.dataset.greetingMorning:(hour<18?root.dataset.greetingAfternoon:root.dataset.greetingEvening);
    const name=root.dataset.greetingName||'';
    if(phrase)greeting.textContent=`${phrase}${name?`, ${name}`:''}`;
  }

  const routes=(window.BesjaarUIConfig&&window.BesjaarUIConfig.routes)||{};
  const addItems=async items=>{
    const response=await fetch(routes.cartAdd||'/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({items})});
    if(!response.ok)throw new Error('cart');
    /* Besjaar 11.6: the add succeeded at this point — a failed follow-up count
       refresh must not surface as a false "could not add" error. */
    try{
      const cartResponse=await fetch(routes.cartJson||'/cart.js',{headers:{Accept:'application/json'}});
      if(cartResponse.ok){
        const cart=await cartResponse.json();
        document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=cart.item_count);
        return cart;
      }
    }catch{}
    return null;
  };

  const reorderStatus=qs('[data-account-reorder-status]');
  qsa('[data-account-reorder]').forEach(button=>button.addEventListener('click',async()=>{
    let items=[];try{items=JSON.parse(button.dataset.items||'[]')}catch{}
    if(!items.length)return;
    const original=button.textContent;
    button.disabled=true;button.textContent=root.dataset.reorderAdding||'Adding…';
    if(reorderStatus)reorderStatus.textContent='';
    try{
      await addItems(items);
      if(reorderStatus)reorderStatus.textContent=root.dataset.reorderAdded||'Added to cart.';
      document.querySelector('[data-open-drawer="cart"]')?.click();
    }catch{
      if(reorderStatus)reorderStatus.textContent=root.dataset.reorderError||'Could not add this order again.';
    }finally{button.disabled=false;button.textContent=original}
  }));

  qsa('[data-account-order-filter]').forEach(button=>button.addEventListener('click',()=>{
    qsa('[data-account-order-filter]').forEach(b=>b.classList.toggle('is-active',b===button));
    const filter=button.dataset.accountOrderFilter;
    qsa('[data-account-order-row]').forEach(row=>{
      const state=row.dataset.orderState||'active';
      row.hidden=!(filter==='all'||state===filter||(filter==='active'&&state==='active'));
    });
  }));
})();


