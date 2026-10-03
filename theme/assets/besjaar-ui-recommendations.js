(() => {
  const selector='[data-besjaar-ui-recommendations][data-recommendations-loaded="false"]';

  const loadSection=async section=>{
    if(!section || section.dataset.recommendationsLoading==='true' || section.dataset.recommendationsLoaded==='true')return;
    const url=section.dataset.url;
    const key=section.dataset.sectionKey;
    if(!url || !key){section.dataset.recommendationsLoaded='true';return;}

    section.dataset.recommendationsLoading='true';
    section.setAttribute('aria-busy','true');

    try{
      const response=await fetch(url,{headers:{Accept:'text/html'},credentials:'same-origin'});
      if(!response.ok)throw new Error(`recommendations-${response.status}`);
      const html=await response.text();
      const holder=document.createElement('div');
      holder.innerHTML=html;
      const safeKey=window.CSS&&CSS.escape?CSS.escape(key):key;
      const fresh=holder.querySelector(`[data-besjaar-ui-recommendations][data-section-key="${safeKey}"]`) || holder.querySelector('[data-besjaar-ui-recommendations]');

      // Keep the already-rendered fallback instead of creating an empty section.
      if(!fresh || fresh.dataset.hasResults!=='true'){
        section.dataset.recommendationsLoaded='true';
        section.dataset.recommendationsLoading='false';
        section.removeAttribute('aria-busy');
        return;
      }

      fresh.dataset.recommendationsLoaded='true';
      fresh.removeAttribute('aria-busy');
      // Recommendation HTML is injected after BesjaarUI's page-level reveal observer has run.
      // Make newly inserted cards visible immediately so a successful Shopify response
      // can never replace the fallback with an apparently empty panel.
      fresh.querySelectorAll('[data-reveal]').forEach(node=>node.classList.add('is-visible'));
      section.replaceWith(fresh);
      document.dispatchEvent(new CustomEvent('besjaar_ui:recommendations:loaded',{detail:{section:fresh,intent:fresh.dataset.recommendationIntent||''}}));
    }catch(error){
      // Network/Search & Discovery failures must never erase the fallback range.
      section.removeAttribute('aria-busy');
      section.dataset.recommendationsLoading='false';
      section.dataset.recommendationsLoaded='true';
    }
  };

  const observe=section=>{
    if(!section || section.dataset.recommendationsLoaded==='true')return;
    if(!('IntersectionObserver' in window)){
      loadSection(section);
      return;
    }
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        observer.unobserve(entry.target);
        loadSection(entry.target);
      });
    },{rootMargin:'600px 0px',threshold:0.01});
    observer.observe(section);
  };

  document.querySelectorAll(selector).forEach(observe);
  document.addEventListener('shopify:section:load',event=>{
    event.target?.querySelectorAll?.(selector).forEach(observe);
    if(event.target?.matches?.(selector))observe(event.target);
  });
})();
