(() => {
  const initialized = new WeakSet();

  function initGallery(root) {
    if (!root || initialized.has(root)) return;
    const stage = root.querySelector('.besjaar-ui-product-v16__media-stage');
    const slides = [...root.querySelectorAll('[data-product-media]')];
    const thumbs = [...root.querySelectorAll('[data-product-media-thumb]')];
    if (!stage || slides.length < 2 || !thumbs.length) return;
    initialized.add(root);

    const counter = root.querySelector('[data-media-current]');
    const prev = root.querySelector('[data-gallery-prev]');
    const next = root.querySelector('[data-gallery-next]');
    const mobileMq = window.matchMedia('(max-width: 700px)');
    let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active') || !slide.hidden));
    let scrollRaf = 0;
    const measuredMethods = new Set();
    const measure = (method, index = activeIndex) => {
      if (measuredMethods.has(method)) return;
      measuredMethods.add(method);
      document.dispatchEvent(new CustomEvent('besjaar_ui:measurement', { detail: { name: 'product_gallery_interacted', detail: { method, mediaIndex: index + 1, mediaCount: slides.length } } }));
    };

    const setActive = (index, options = {}) => {
      const mobile = mobileMq.matches;
      stage.classList.add('is-gallery-switching');
      window.setTimeout(() => stage.classList.remove('is-gallery-switching'), 130);
      activeIndex = (index % slides.length + slides.length) % slides.length;
      const activeSlide = slides[activeIndex];
      const activeId = String(activeSlide.dataset.productMedia || '');

      slides.forEach((slide, i) => {
        const active = i === activeIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        slide.style.opacity = active ? '1' : '';
        if (mobile) {
          slide.hidden = false;
          slide.style.removeProperty('display');
        } else {
          slide.hidden = !active;
          slide.style.display = active ? 'grid' : 'none';
        }
        if (!active) slide.querySelectorAll('video').forEach((video) => video.pause?.());
      });

      thumbs.forEach((thumb, i) => {
        const active = i === activeIndex || String(thumb.dataset.productMediaThumb || '') === activeId;
        thumb.classList.toggle('is-active', active);
        thumb.setAttribute('aria-pressed', active ? 'true' : 'false');
        if (active && options.centerThumb !== false) {
          thumb.scrollIntoView?.({ behavior: (options.instant || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
        }
      });

      if (counter) counter.textContent = String(activeIndex + 1);

      if (mobile && options.scrollStage !== false) {
        stage.scrollTo({ left: activeIndex * stage.clientWidth, behavior: (options.instant || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) ? 'auto' : 'smooth' });
      }
    };

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', (event) => {
        event.preventDefault();
        measure('thumbnail', index);
        setActive(index, { scrollStage: true });
      });
    });

    prev?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      measure('arrow', activeIndex - 1);
      setActive(activeIndex - 1, { scrollStage: true });
    });
    next?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      measure('arrow', activeIndex + 1);
      setActive(activeIndex + 1, { scrollStage: true });
    });

    stage.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      measure('keyboard', activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
      setActive(activeIndex + (event.key === 'ArrowRight' ? 1 : -1), { scrollStage: true });
    });

    stage.addEventListener('scroll', () => {
      if (!mobileMq.matches) return;
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const width = stage.clientWidth || 1;
        const index = Math.max(0, Math.min(slides.length - 1, Math.round(stage.scrollLeft / width)));
        if (index !== activeIndex) { measure('swipe', index); setActive(index, { scrollStage: false, centerThumb: true }); }
      });
    }, { passive: true });

    const onBreakpoint = () => setActive(activeIndex, { instant: true, scrollStage: mobileMq.matches, centerThumb: false });
    mobileMq.addEventListener?.('change', onBreakpoint);

    // Force a known-good initial state even if another gallery script left hidden/display values behind.
    setActive(activeIndex, { instant: true, scrollStage: mobileMq.matches, centerThumb: false });
  }

  function initAll(scope = document) {
    scope.querySelectorAll?.('[data-product-root]').forEach(initGallery);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAll());
  else initAll();
  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();
