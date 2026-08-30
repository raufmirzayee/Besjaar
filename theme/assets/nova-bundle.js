/* Besjaar Nova 6.3 — bundle + cart add-ons */
(() => {
  const config=window.NovaConfig||{}, routes=config.routes||{}, currency=config.currency||'EUR';
  const locale=(document.documentElement.lang||'en').toLowerCase();
  const money=(cents)=>{try{return new Intl.NumberFormat(locale,{style:'currency',currency}).format((Number(cents)||0)/100)}catch{return `€${((Number(cents)||0)/100).toFixed(2)}`}};
  /* Besjaar 11.6: a failed follow-up cart read must not turn a successful add into an error message. */
  const getCart=()=>fetch(routes.cartJson||'/cart.js',{headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).catch(()=>null);
  const updateCount=(count)=>document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=count);
  const openCart=()=>document.querySelector('[data-open-drawer="cart"]')?.click();
  const measure=(name,detail={})=>document.dispatchEvent(new CustomEvent('nova:measurement',{detail:{name,detail}}));

  document.querySelectorAll('[data-nova-bundle]').forEach(bundle=>{
    const total=bundle.querySelector('[data-bundle-total]'),basePriceNode=bundle.querySelector('[data-bundle-base-price]'),button=bundle.querySelector('[data-bundle-add]'),status=bundle.querySelector('[data-bundle-status]');
    const accessories=()=>[...bundle.querySelectorAll('[data-bundle-accessory]')];
    const render=()=>{const base=Number(bundle.dataset.basePrice||0);const extras=accessories().filter(x=>x.checked).reduce((sum,x)=>sum+Number(x.dataset.price||0),0);if(total)total.textContent=money(base+extras);if(basePriceNode)basePriceNode.textContent=money(base);if(button)button.disabled=bundle.dataset.baseAvailable!=='true'};
    accessories().forEach(input=>input.addEventListener('change',render));
    document.addEventListener('nova:variant-change',event=>{const detail=event.detail||{};if(!detail.id)return;bundle.dataset.baseVariantId=String(detail.id);bundle.dataset.basePrice=String(detail.price||0);bundle.dataset.baseAvailable=detail.available?'true':'false';render()});
    button?.addEventListener('click',async()=>{
      if(button.disabled)return;
      const items=[{id:Number(bundle.dataset.baseVariantId),quantity:1},...accessories().filter(x=>x.checked).map(x=>({id:Number(x.dataset.variantId),quantity:1}))].filter(x=>Number.isFinite(x.id)&&x.id>0);
      const original=button.dataset.defaultLabel||button.textContent;button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=button.dataset.addingLabel||'Adding…';if(status){status.textContent='';status.className='nova-bundle-status'}
      try{const response=await fetch(routes.cartAdd||'/cart/add.js',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({items})});if(!response.ok)throw new Error('bundle_add');const cart=await getCart();if(cart)updateCount(cart.item_count);measure('bundle_add_succeeded',{items:items.map(item=>({variantId:item.id,quantity:item.quantity})),itemCount:items.length});if(status){status.textContent=bundle.dataset.addedMessage||'Added to cart';status.classList.add('is-success')}openCart()}catch{if(status){status.textContent=bundle.dataset.errorMessage||'Could not add the selected items.';status.classList.add('is-error')}}finally{button.disabled=bundle.dataset.baseAvailable!=='true';button.removeAttribute('aria-busy');button.textContent=original}
    });
    render();
  });

  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-cart-addon-add]');if(!button)return;event.preventDefault();if(button.disabled)return;const original=button.textContent;button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=button.dataset.addingLabel||'Adding…';
    try{const response=await fetch(routes.cartAdd||'/cart/add.js',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({items:[{id:Number(button.dataset.cartAddonAdd),quantity:1}]})});if(!response.ok)throw new Error('addon_add');const cart=await getCart();if(cart)updateCount(cart.item_count);measure('cart_addon_add_succeeded',{variantId:Number(button.dataset.cartAddonAdd),quantity:1});button.textContent=button.dataset.addedLabel||'Added';button.classList.add('is-added');setTimeout(()=>{if(document.body.dataset.pageType==='cart')window.location.reload();else openCart()},250)}catch{button.disabled=false;button.textContent=button.dataset.errorLabel||original;button.classList.add('is-error');window.setTimeout(()=>{button.textContent=original;button.classList.remove('is-error')},1800)}finally{button.removeAttribute('aria-busy')}
  });
})();
