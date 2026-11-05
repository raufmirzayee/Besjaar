/* Besjaar UI 5.0 Phase 1 — product page runtime */
/* Besjaar 11.6: honor prefers-reduced-motion for programmatic scrolling. */
const besjaarUiScrollBehavior = () => (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'auto' : 'smooth';
/* Besjaar UI 1.8 — Product Page Luxury Polish */
(() => {
  const root = document.querySelector('[data-product-root]');
  if (!root) return;

  const qs = (s, r = root) => r.querySelector(s);
  const qsa = (s, r = root) => [...r.querySelectorAll(s)];
  const variantsNode = qs('[data-product-variants-json]');
  let variants = [];
  try { variants = JSON.parse(variantsNode?.textContent || '[]'); } catch { variants = []; }

  const optionSelects = qsa('[data-product-option]');
  const variantIdInput = qs('[data-variant-id]');
  const form = qs('[data-product-form]');
  const submitButton = qs('[data-product-submit]');
  const stock = qs('[data-product-stock]');
  const priceNodes = qsa('[data-product-price], [data-product-price-secondary]');
  const comparePrice = qs('[data-product-compare-price]');
  const unitPrice = qs('[data-product-unit-price]');
  const sellingPlanSelect = qs('[data-selling-plan-select]');
  const sellingPlanPrice = qs('[data-selling-plan-price]');
  const summarySale = qs('[data-product-summary-sale]');
  const skuRow = qs('[data-product-sku-row]');
  const sku = qs('[data-product-sku]');
  const dynamicCheckout = qs('.besjaar-ui-product-v16__dynamic');
  const sticky = qs('[data-sticky-atc]');
  const stickyPrice = qs('[data-sticky-price]');
  const stickySubmit = qs('[data-sticky-submit]');
  const restockFallback = qs('[data-restock-fallback]');
  const restockSections = [...document.querySelectorAll('[data-restock-section]')];
  const restockVariantInputs = [...document.querySelectorAll('[data-restock-variant], [data-qa-variant]')];
  const wishButton = qs('[data-wish-product]');
  const formStatus = qs('[data-product-form-status]');
  const mediaStage = qs('.besjaar-ui-product-v16__media-stage');
  const mediaSlides = qsa('[data-product-media]');
  const mediaThumbs = qsa('[data-product-media-thumb]');
  const swipeGalleryEnabled = root.classList.contains('besjaar-ui-mobile-gallery-enabled');
  const mobileGalleryQuery = window.matchMedia('(max-width: 700px)');
  const desktopGalleryQuery = window.matchMedia('(min-width: 701px)');
  const isMobileSwipeGallery = () => swipeGalleryEnabled && mobileGalleryQuery.matches && mediaStage && mediaSlides.length > 1;
  const isDesktopDragGallery = () => swipeGalleryEnabled && desktopGalleryQuery.matches && mediaStage && mediaSlides.length > 1;
  let suppressNextZoomClick = false;

  const addLabel = root.dataset.addLabel || 'Add to cart';
  const soldOutLabel = root.dataset.soldOutLabel || 'Sold out';
  const inStockLabel = root.dataset.inStockLabel || 'In stock';
  const outOfStockLabel = root.dataset.outOfStockLabel || 'Out of stock';
  const purchaseOptionPriceLabel = root.dataset.purchaseOptionPriceLabel || 'Purchase option price';
  const oneTimePurchaseLabel = root.dataset.oneTimePurchaseLabel || 'One-time purchase';
  const requiresSellingPlan = root.dataset.requiresSellingPlan === 'true';

  const updateMediaState = (mediaId) => {
    if (!mediaId) return;
    let currentIndex = 1;
    mediaSlides.forEach((media) => {
      const active = String(media.dataset.productMedia) === String(mediaId);
      media.hidden = isMobileSwipeGallery() ? false : !active;
      media.classList.toggle('is-active', active);
      if (!active) media.querySelectorAll('video').forEach((video) => video.pause?.());
    });
    mediaThumbs.forEach((thumb) => {
      const active = String(thumb.dataset.productMediaThumb) === String(mediaId);
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) {
        currentIndex = Number(thumb.dataset.mediaIndex || 1);
        if (isMobileSwipeGallery()) thumb.scrollIntoView({ behavior: besjaarUiScrollBehavior(), block: 'nearest', inline: 'center' });
      }
    });
    const counter = qs('[data-media-current]');
    if (counter) counter.textContent = currentIndex;
  };

  const switchMedia = (mediaId, { scroll = true } = {}) => {
    if (!mediaId) return;
    updateMediaState(mediaId);
    if (scroll && isMobileSwipeGallery()) {
      const index = mediaSlides.findIndex((media) => String(media.dataset.productMedia) === String(mediaId));
      if (index >= 0) mediaStage.scrollTo({ left: index * mediaStage.clientWidth, behavior: besjaarUiScrollBehavior() });
    }
  };

  mediaThumbs.forEach((thumb) => thumb.addEventListener('click', () => switchMedia(thumb.dataset.productMediaThumb)));

  if (swipeGalleryEnabled && mediaStage && mediaSlides.length > 1) {
    let galleryRaf = 0;
    const syncGalleryFromScroll = () => {
      galleryRaf = 0;
      if (!isMobileSwipeGallery()) return;
      const width = mediaStage.clientWidth || 1;
      const index = Math.max(0, Math.min(mediaSlides.length - 1, Math.round(mediaStage.scrollLeft / width)));
      const mediaId = mediaSlides[index]?.dataset.productMedia;
      if (mediaId) updateMediaState(mediaId);
    };
    mediaStage.addEventListener('scroll', () => {
      if (galleryRaf) cancelAnimationFrame(galleryRaf);
      galleryRaf = requestAnimationFrame(syncGalleryFromScroll);
    }, { passive: true });
    mobileGalleryQuery.addEventListener?.('change', () => {
      const active = mediaSlides.find((media) => media.classList.contains('is-active')) || mediaSlides[0];
      if (active) {
        mediaSlides.forEach((media) => { media.hidden = isMobileSwipeGallery() ? false : media !== active; });
        if (isMobileSwipeGallery()) {
          const index = mediaSlides.indexOf(active);
          requestAnimationFrame(() => mediaStage.scrollTo({ left: Math.max(0, index) * mediaStage.clientWidth, behavior: 'auto' }));
        }
      }
    });
    if (isMobileSwipeGallery()) {
      mediaSlides.forEach((media) => { media.hidden = false; });
      requestAnimationFrame(() => {
        const activeIndex = Math.max(0, mediaSlides.findIndex((media) => media.classList.contains('is-active')));
        mediaStage.scrollTo({ left: activeIndex * mediaStage.clientWidth, behavior: 'auto' });
      });
    }

    // Desktop gallery: mouse/pen drag, horizontal trackpad gesture and arrow keys.
    const activeMediaIndex = () => Math.max(0, mediaSlides.findIndex((media) => media.classList.contains('is-active')));
    const moveDesktopGallery = (direction) => {
      if (!isDesktopDragGallery()) return;
      const current = activeMediaIndex();
      const next = Math.max(0, Math.min(mediaSlides.length - 1, current + direction));
      if (next === current) return;
      const mediaId = mediaSlides[next]?.dataset.productMedia;
      if (!mediaId) return;
      switchMedia(mediaId, { scroll: false });
      mediaThumbs[next]?.scrollIntoView?.({ behavior: besjaarUiScrollBehavior(), block: 'nearest', inline: 'center' });
    };

    let dragPointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let desktopDragging = false;
    let desktopDragMoved = false;

    mediaStage.addEventListener('pointerdown', (event) => {
      if (!isDesktopDragGallery() || event.pointerType === 'touch' || event.button !== 0) return;
      if (event.target.closest('video, iframe, model-viewer, button, a')) return;
      dragPointerId = event.pointerId;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      desktopDragging = true;
      desktopDragMoved = false;
      mediaStage.setPointerCapture?.(event.pointerId);
      mediaStage.classList.add('is-desktop-dragging');
    });

    mediaStage.addEventListener('pointermove', (event) => {
      if (!desktopDragging || event.pointerId !== dragPointerId || !isDesktopDragGallery()) return;
      const dx = event.clientX - dragStartX;
      const dy = event.clientY - dragStartY;
      if (Math.abs(dx) < 7 || Math.abs(dx) <= Math.abs(dy)) return;
      desktopDragMoved = true;
      event.preventDefault();
      const active = mediaSlides[activeMediaIndex()];
      if (active) active.style.transform = `translateX(${Math.max(-52, Math.min(52, dx * 0.22))}px)`;
    });

    const finishDesktopDrag = (event) => {
      if (!desktopDragging || (event?.pointerId != null && event.pointerId !== dragPointerId)) return;
      const dx = event ? event.clientX - dragStartX : 0;
      const active = mediaSlides[activeMediaIndex()];
      if (active) active.style.transform = '';
      mediaStage.classList.remove('is-desktop-dragging');
      if (desktopDragMoved) {
        suppressNextZoomClick = true;
        if (Math.abs(dx) >= 52) moveDesktopGallery(dx < 0 ? 1 : -1);
        window.setTimeout(() => { suppressNextZoomClick = false; }, 120);
      }
      if (dragPointerId != null) {
        try { mediaStage.releasePointerCapture?.(dragPointerId); } catch {}
      }
      dragPointerId = null;
      desktopDragging = false;
      desktopDragMoved = false;
    };

    mediaStage.addEventListener('pointerup', finishDesktopDrag);
    mediaStage.addEventListener('pointercancel', finishDesktopDrag);
    mediaStage.addEventListener('lostpointercapture', () => {
      if (desktopDragging) finishDesktopDrag();
    });
    mediaStage.addEventListener('dragstart', (event) => {
      if (isDesktopDragGallery() && event.target.closest('[data-product-image]')) event.preventDefault();
    });

    let wheelAccumulator = 0;
    let wheelLocked = false;
    let wheelResetTimer = 0;
    mediaStage.addEventListener('wheel', (event) => {
      if (!isDesktopDragGallery()) return;
      const horizontalDelta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) * 0.8 ? event.deltaX : (event.shiftKey ? event.deltaY : 0);
      if (!horizontalDelta) return;
      event.preventDefault();
      clearTimeout(wheelResetTimer);
      wheelAccumulator += horizontalDelta;
      if (!wheelLocked && Math.abs(wheelAccumulator) >= 48) {
        moveDesktopGallery(wheelAccumulator > 0 ? 1 : -1);
        wheelAccumulator = 0;
        wheelLocked = true;
        window.setTimeout(() => { wheelLocked = false; }, 340);
      }
      wheelResetTimer = window.setTimeout(() => { wheelAccumulator = 0; }, 180);
    }, { passive: false });

    mediaStage.addEventListener('keydown', (event) => {
      if (!isDesktopDragGallery()) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); moveDesktopGallery(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveDesktopGallery(-1); }
    });
  }

  const selectedOptions = () => optionSelects.map((select) => ({
    position: Number(select.dataset.optionPosition || 1) - 1,
    value: select.value
  }));
  const findVariant = () => {
    if (!variants.length) return null;
    if (!optionSelects.length) return variants.find((variant) => String(variant.id) === String(variantIdInput?.value)) || variants[0];
    const options = selectedOptions();
    return variants.find((variant) => options.every((option) => variant.options[option.position] === option.value));
  };

  const renderSellingPlans = (variant) => {
    if (!sellingPlanSelect) return;
    const previous = sellingPlanSelect.value;
    const plans = Array.isArray(variant?.sellingPlans) ? variant.sellingPlans : [];
    sellingPlanSelect.innerHTML = '';
    if (!requiresSellingPlan) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = `${oneTimePurchaseLabel} — ${variant.priceFormatted}`;
      sellingPlanSelect.appendChild(option);
    }
    plans.forEach((plan) => {
      const option = document.createElement('option');
      option.value = String(plan.id);
      option.textContent = `${plan.name} — ${plan.priceFormatted}`;
      option.dataset.price = plan.priceFormatted || '';
      option.dataset.checkoutCharge = plan.checkoutChargeFormatted || '';
      option.dataset.selected = plan.selected ? 'true' : 'false';
      sellingPlanSelect.appendChild(option);
    });
    const preferred = [...sellingPlanSelect.options].find((o) => o.value === previous)
      || [...sellingPlanSelect.options].find((o) => o.dataset.selected === 'true')
      || sellingPlanSelect.options[0];
    if (preferred) sellingPlanSelect.value = preferred.value;
    sellingPlanSelect.disabled = sellingPlanSelect.options.length === 0;
    const selected = sellingPlanSelect.selectedOptions[0];
    if (sellingPlanPrice) {
      const price = selected?.dataset.price || '';
      sellingPlanPrice.textContent = price ? `${purchaseOptionPriceLabel}: ${price}` : '';
      sellingPlanPrice.hidden = !price;
    }
  };


  const renderVariant = (variant, updateUrl = true) => {
    if (!variant) return;
    if (variantIdInput) variantIdInput.value = variant.id;
    priceNodes.forEach((node) => { node.textContent = variant.priceFormatted; });
    if (stickyPrice) stickyPrice.textContent = variant.priceFormatted;
    if (unitPrice) { unitPrice.hidden = !variant.unitPriceFormatted; unitPrice.textContent = variant.unitPriceFormatted || ''; }
    renderSellingPlans(variant);

    const onSale = Number(variant.compareAtPrice || 0) > Number(variant.price || 0);
    if (comparePrice) {
      comparePrice.hidden = !onSale;
      comparePrice.textContent = onSale ? variant.compareAtPriceFormatted : '';
    }
    const percent = onSale ? Math.round(((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100) : 0;
    if (summarySale) {
      summarySale.hidden = !onSale;
      if (onSale) summarySale.textContent = `-${percent}%`;
    }

    if (stock) {
      stock.classList.toggle('is-available', Boolean(variant.available));
      const label = stock.querySelector('span');
      if (label) label.textContent = variant.available ? inStockLabel : outOfStockLabel;
    }
    if (submitButton) {
      const purchasable = Boolean(variant.available) && !(requiresSellingPlan && !(variant.sellingPlans || []).length);
      submitButton.disabled = !purchasable;
      submitButton.dataset.variantAvailable = purchasable ? 'true' : 'false';
      submitButton.textContent = variant.available ? `${addLabel} — ${variant.priceFormatted}` : soldOutLabel;
    }
    if (stickySubmit) { stickySubmit.disabled = !variant.available || (requiresSellingPlan && !(variant.sellingPlans || []).length); stickySubmit.textContent = variant.available ? `${addLabel} · ${variant.priceFormatted}` : soldOutLabel; }
    if (formStatus) {
      formStatus.textContent = variant.available ? '' : outOfStockLabel;
      formStatus.classList.toggle('is-error', !variant.available);
      formStatus.classList.remove('is-success');
    }
    if (dynamicCheckout) dynamicCheckout.hidden = !variant.available;
    if (restockFallback) restockFallback.hidden = Boolean(variant.available);
    restockSections.forEach(section => { section.hidden = Boolean(variant.available); });
    restockVariantInputs.forEach(input => { input.value = variant.id; });
    if (wishButton) wishButton.dataset.variantId = variant.id;

    if (skuRow && sku) {
      sku.textContent = variant.sku || '';
      skuRow.hidden = !variant.sku;
    }
    if (variant.featuredMediaId) switchMedia(variant.featuredMediaId);

    if (updateUrl && window.history?.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }
    document.dispatchEvent(new CustomEvent('besjaar_ui:variant-change', { detail: variant }));
  };

  sellingPlanSelect?.addEventListener('change', () => {
    const selected = sellingPlanSelect.selectedOptions[0];
    if (sellingPlanPrice) {
      const price = selected?.dataset.price || '';
      sellingPlanPrice.textContent = price ? `${purchaseOptionPriceLabel}: ${price}` : '';
      sellingPlanPrice.hidden = !price;
    }
  });

  optionSelects.forEach((select) => select.addEventListener('change', () => {
    let variant = findVariant();
    if (!variant) {
      const position = Number(select.dataset.optionPosition || 1) - 1;
      variant = variants.find((item) => item.options[position] === select.value && item.available)
        || variants.find((item) => item.options[position] === select.value);
      if (variant) optionSelects.forEach((item) => {
        const optionPosition = Number(item.dataset.optionPosition || 1) - 1;
        item.value = variant.options[optionPosition];
      });
    }
    renderVariant(variant);
  }));

  qsa('[data-quantity-minus]').forEach((button) => button.addEventListener('click', () => {
    const input = qs('[data-product-quantity]');
    if (!input) return;
    input.value = Math.max(Number(input.min || 1), Number(input.value || 1) - 1);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }));
  qsa('[data-quantity-plus]').forEach((button) => button.addEventListener('click', () => {
    const input = qs('[data-product-quantity]');
    if (!input) return;
    input.value = Math.max(Number(input.min || 1), Number(input.value || 1) + 1);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }));
  qs('[data-product-quantity]')?.addEventListener('change', event => {
    const input = event.currentTarget;
    const min = Number(input.min || 1);
    const value = Math.max(min, Math.floor(Number(input.value || min)));
    input.value = Number.isFinite(value) ? value : min;
  });

  stickySubmit?.addEventListener('click', () => {
    if (!form || stickySubmit.disabled) return;
    if (typeof form.requestSubmit === 'function') form.requestSubmit(submitButton || undefined);
    else if (submitButton) submitButton.click();
    else form.submit();
  });

  if (sticky && form && 'IntersectionObserver' in window) {
    let formPassed = false, footerVisible = false;
    const renderSticky = () => {
      const shouldShow = formPassed && !footerVisible;
      sticky.classList.toggle('is-visible', shouldShow);
      sticky.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
      sticky.toggleAttribute('inert', !shouldShow);
    };
    const stickyObserver = new IntersectionObserver(([entry]) => {
      formPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      renderSticky();
    }, { threshold: 0.05 });
    stickyObserver.observe(form);
    const footer = document.querySelector('footer');
    if (footer) { const footerObserver = new IntersectionObserver(([entry]) => { footerVisible = entry.isIntersecting; renderSticky(); }, { threshold: 0.01 }); footerObserver.observe(footer); }
  }

  const dialog = qs('[data-product-zoom-dialog]');
  const zoomImage = qs('[data-product-zoom-image]');
  qsa('[data-product-image]').forEach((image) => image.addEventListener('click', () => {
    if (suppressNextZoomClick) return;
    const src = image.dataset.zoomSrc || image.currentSrc || image.src;
    if (!dialog || !zoomImage || !src) return;
    zoomImage.src = src;
    if (typeof dialog.showModal === 'function') dialog.showModal();
  }));
  qs('[data-product-zoom-close]')?.addEventListener('click', () => dialog?.close?.());
  document.querySelectorAll('[data-scroll-alternatives]').forEach(button => button.addEventListener('click', () => document.querySelector('[data-product-alternatives], [data-besjaar-ui-recommendations][data-recommendation-intent="related"], [data-besjaar-ui-recommendations]')?.scrollIntoView({ behavior: besjaarUiScrollBehavior(), block: 'start' })));
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close?.();
  });

  renderVariant(findVariant(), false);
})();


// BesjaarUI 2.3 — account menu interaction
(() => {
  const accountMenu = document.querySelector('.besjaar-ui-account-menu');
  if (!accountMenu) return;
  document.addEventListener('click', (event) => {
    if (accountMenu.open && !accountMenu.contains(event.target)) accountMenu.removeAttribute('open');
  });
  accountMenu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      accountMenu.removeAttribute('open');
      accountMenu.querySelector('summary')?.focus();
    }
  });
})();


// BesjaarUI 2.5 delivery-date estimator: moved to besjaar-ui-core.js in Besjaar 11.6 so the
// concrete dates render on every page (cart drawer, cart page, home section),
// not only on shower product pages. This also removed an undefined `isNl`
// reference that could throw when <html lang> was empty.


// BesjaarUI 3.1 — Promotions & Campaign Merchandising OS
(() => {
  const config=window.BesjaarUIConfig||{},i18n=config.i18n||{};
  const parseDate=value=>{if(!value)return null;const ms=Date.parse(value);return Number.isFinite(ms)?ms:null};
  const setWindowState=el=>{
    const now=Date.now(),start=parseDate(el.dataset.campaignStart),end=parseDate(el.dataset.campaignEnd);
    const active=(!start||now>=start)&&(!end||now<end);
    el.hidden=!active;
    el.dataset.campaignActive=active?'true':'false';
    return active;
  };
  document.querySelectorAll('[data-campaign-window]').forEach(setWindowState);

  const updateCountdown=node=>{
    const end=parseDate(node.dataset.end); if(!end){node.hidden=true;return}
    const remaining=end-Date.now(); if(remaining<=0){node.hidden=true;const host=node.closest('[data-campaign-window]');if(host)setWindowState(host);return}
    const totalMinutes=Math.max(1,Math.ceil(remaining/60000));
    const days=Math.floor(totalMinutes/1440),hours=Math.floor((totalMinutes%1440)/60),minutes=totalMinutes%60;
    const parts=[];
    if(days)parts.push(`${days}${i18n.campaignDays||'d'}`);
    if(days||hours)parts.push(`${hours}${i18n.campaignHours||'h'}`);
    parts.push(`${minutes}${i18n.campaignMinutes||'m'}`);
    const target=node.querySelector('[data-campaign-countdown-value]');if(target)target.textContent=parts.join(' ');
    node.hidden=false;
  };
  const countdowns=[...document.querySelectorAll('[data-campaign-countdown]')];
  countdowns.forEach(updateCountdown);
  if(countdowns.length)setInterval(()=>countdowns.forEach(updateCountdown),30000);

  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-promo-copy]');if(!button)return;
    event.preventDefault();const code=button.dataset.promoCopy||'';if(!code)return;
    try{
      await navigator.clipboard.writeText(code);
      const old=button.textContent;button.textContent=i18n.campaignCopied||'Copied';button.classList.add('is-copied');
      setTimeout(()=>{button.textContent=old;button.classList.remove('is-copied')},1500);
    }catch{}
  });

  document.querySelectorAll('[data-merchandising-tabs]').forEach(root=>{
    const buttons=[...root.querySelectorAll('[data-merch-tab]')].filter(b=>!b.hidden);
    const panels=[...root.querySelectorAll('[data-merch-panel]')].filter(p=>!p.hidden);
    if(!buttons.length||!panels.length){root.hidden=true;return}
    const activate=id=>{
      buttons.forEach(button=>{const active=button.dataset.merchTab===id;button.classList.toggle('is-active',active);button.setAttribute('aria-selected',active?'true':'false')});
      panels.forEach(panel=>panel.classList.toggle('is-active',panel.dataset.merchPanel===id));
    };
    const initial=buttons.find(b=>b.classList.contains('is-active'))||buttons[0];activate(initial.dataset.merchTab);
    buttons.forEach(button=>button.addEventListener('click',()=>activate(button.dataset.merchTab)));
  });
})();



// BesjaarUI 5.6.9 — prevent duplicate oversized payment-badge widgets inside the buy box.
(() => {
  const root = document.querySelector('[data-product-root]');
  const buybox = root?.querySelector('[data-product-buybox]');
  if (!buybox) return;

  const nativePayments = buybox.querySelector('.besjaar-ui-product-v16__payments');
  const duplicateLabel = /(?:secure\s+checkout\s+with|secure\s+payment\s+with|veilig\s+betalen\s+met)/i;

  const removeDuplicatePaymentBadges = () => {
    const candidates = [...buybox.querySelectorAll('div, section')];
    candidates.forEach((candidate) => {
      if (candidate === buybox || candidate === nativePayments || candidate.closest('.besjaar-ui-product-v16__payments')) return;
      if (nativePayments && candidate.contains(nativePayments)) return;
      const text = (candidate.textContent || '').replace(/\s+/g, ' ').trim();
      if (!duplicateLabel.test(text)) return;
      const logoCount = candidate.querySelectorAll('img, svg').length;
      if (logoCount < 3) return;

      // Prefer the smallest matching wrapper so unrelated buy-box content is never removed.
      const nestedMatch = [...candidate.children].some((child) => {
        const childText = (child.textContent || '').replace(/\s+/g, ' ').trim();
        return duplicateLabel.test(childText) && child.querySelectorAll('img, svg').length >= 3;
      });
      if (nestedMatch) return;

      candidate.remove();
    });
  };

  removeDuplicatePaymentBadges();
  const observer = new MutationObserver(removeDuplicatePaymentBadges);
  observer.observe(buybox, { childList: true, subtree: true });
  window.setTimeout(() => observer.disconnect(), 6000);
})();
