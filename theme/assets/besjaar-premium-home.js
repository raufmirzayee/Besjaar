(()=>{
  const prefersReducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const language=(document.documentElement.lang||'nl').toLowerCase();
  const locale=language.startsWith('de')?'de-DE':language.startsWith('fr')?'fr-FR':language.startsWith('en')?'en-GB':'nl-NL';
  const fmt=(v,d)=>new Intl.NumberFormat(locale,{minimumFractionDigits:d,maximumFractionDigits:d}).format(d?Number(v):Math.round(v));
  const animate=(el)=>{
    if(el.dataset.bpAnimated==='1')return;
    el.dataset.bpAnimated='1';
    const target=parseFloat(el.dataset.target||'0');
    const decimals=parseInt(el.dataset.decimals||'0',10);
    const suffix=el.dataset.suffix||'';
    if(prefersReducedMotion){el.textContent=fmt(target,decimals)+suffix;return;}
    const start=performance.now(),duration=1250;
    const tick=(now)=>{
      const p=Math.min((now-start)/duration,1),e=1-Math.pow(1-p,3);
      el.textContent=fmt(target*e,decimals)+suffix;
      if(p<1)requestAnimationFrame(tick);else el.textContent=fmt(target,decimals)+suffix;
    };
    requestAnimationFrame(tick);
  };

  const counters=document.querySelectorAll('[data-bp-count]');
  if('IntersectionObserver'in window){
    const io=new IntersectionObserver((entries,obs)=>entries.forEach(entry=>{
      if(entry.isIntersecting){animate(entry.target);obs.unobserve(entry.target);}
    }),{threshold:.25});
    counters.forEach(el=>io.observe(el));
  }else counters.forEach(animate);

  const videos=[...document.querySelectorAll('.bp-video video')];
  videos.forEach(v=>{v.muted=true;v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');});
  if(!prefersReducedMotion&&'IntersectionObserver'in window){
    const videoObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting,intersectionRatio})=>{
      if(isIntersecting&&intersectionRatio>.2)target.play().catch(()=>{});else target.pause();
    }),{threshold:[0,.2,.5]});
    videos.forEach(v=>videoObserver.observe(v));
  }else if(!prefersReducedMotion){
    videos.forEach(v=>v.play().catch(()=>{}));
  }else{
    videos.forEach(v=>v.pause());
  }

  /* Keep the homepage FAQ tidy: opening one answer closes the previous one. */
  document.querySelectorAll('.bp-faq__item').forEach(item=>item.addEventListener('toggle',()=>{
    if(!item.open)return;
    document.querySelectorAll('.bp-faq__item[open]').forEach(other=>{if(other!==item)other.open=false;});
  }));
})();
