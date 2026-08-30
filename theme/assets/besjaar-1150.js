/* Besjaar 11.5.3 — small progressive enhancements only. */
(() => {
  'use strict';

  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const headerMenuSelector = '[data-shop-mega],[data-more-menu]';
  const setDisclosureState = (wrap, expanded) => {
    if (!(wrap instanceof Element)) return;
    const trigger = wrap.querySelector('[data-shop-mega-trigger],[data-more-menu-trigger]');
    const panel = wrap.querySelector('[data-shop-mega-panel],[data-more-menu-panel]');
    wrap.classList.toggle('is-open', expanded);
    trigger?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (panel) {
      panel.setAttribute('aria-hidden', expanded ? 'false' : 'true');
      try { panel.inert = !expanded; } catch (_) {
        if (expanded) panel.removeAttribute('inert');
        else panel.setAttribute('inert', '');
      }
    }
  };

  const closeHeaderMenus = (except = null) => {
    qsa(headerMenuSelector).forEach((wrap) => {
      if (wrap !== except) setDisclosureState(wrap, false);
    });
  };

  const initHeaderMenu = (wrap) => {
    if (!(wrap instanceof Element) || wrap.dataset.headerMenuReady === 'true') return;
    const trigger = wrap.querySelector('[data-shop-mega-trigger],[data-more-menu-trigger]');
    const panel = wrap.querySelector('[data-shop-mega-panel],[data-more-menu-panel]');
    if (!trigger || !panel) return;
    wrap.dataset.headerMenuReady = 'true';

    const isShopMenu = wrap.matches('[data-shop-mega]');
    const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)');
    let closeTimer = 0;
    const cancelClose = () => window.clearTimeout(closeTimer);
    const open = () => {
      cancelClose();
      closeHeaderMenus(wrap);
      setDisclosureState(wrap, true);
    };
    const close = () => {
      cancelClose();
      setDisclosureState(wrap, false);
    };
    const scheduleClose = () => {
      cancelClose();
      closeTimer = window.setTimeout(close, 90);
    };

    setDisclosureState(wrap, false);
    trigger.addEventListener('focus', open);
    trigger.addEventListener('click', (event) => {
      if (isShopMenu) {
        if (!finePointer?.matches && !wrap.classList.contains('is-open')) {
          event.preventDefault();
          open();
        }
        return;
      }
      event.preventDefault();
      if (wrap.classList.contains('is-open')) close();
      else open();
    });
    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown') return;
      event.preventDefault();
      open();
      panel.querySelector('a[href],button:not([disabled])')?.focus();
    });
    wrap.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close();
      trigger.focus();
    });
    wrap.addEventListener('focusout', (event) => {
      if (!wrap.contains(event.relatedTarget)) close();
    });
    wrap.addEventListener('mouseenter', () => { if (!finePointer || finePointer.matches) open(); });
    wrap.addEventListener('mouseleave', () => { if (!finePointer || finePointer.matches) scheduleClose(); });
    panel.addEventListener('mouseenter', cancelClose);
  };

  const initLightbox = (root) => {
    if (!(root instanceof Element) || root.dataset.lightboxReady === 'true') return;
    const trigger = root.querySelector('[data-product-zoom]');
    const mainImage = root.querySelector('[id^="BesjaarMainImage-"]');
    if (!trigger || !mainImage) return;
    root.dataset.lightboxReady = 'true';

    const thumbs = qsa('.ind-bj-pd__thumb', root);
    const owner = root.dataset.besjaarProductSection || 'product';
    qsa('.besjaar-lightbox[data-owner="' + owner + '"]').forEach((existing) => existing.remove());
    const dialog = document.createElement('dialog');
    dialog.className = 'besjaar-lightbox';
    dialog.dataset.owner = owner;
    dialog.setAttribute('aria-label', root.dataset.zoomLabel || 'Zoom product image');

    const figure = document.createElement('figure');
    figure.className = 'besjaar-lightbox__figure';
    const image = document.createElement('img');
    image.className = 'besjaar-lightbox__image';
    figure.appendChild(image);

    const close = document.createElement('button');
    close.className = 'besjaar-lightbox__close';
    close.type = 'button';
    close.setAttribute('aria-label', root.dataset.closeZoomLabel || 'Close enlarged image');
    close.textContent = '×';

    const previous = document.createElement('button');
    previous.className = 'besjaar-lightbox__nav besjaar-lightbox__nav--prev';
    previous.type = 'button';
    previous.setAttribute('aria-label', root.dataset.previousImageLabel || 'Previous product image');
    previous.textContent = '‹';

    const next = document.createElement('button');
    next.className = 'besjaar-lightbox__nav besjaar-lightbox__nav--next';
    next.type = 'button';
    next.setAttribute('aria-label', root.dataset.nextImageLabel || 'Next product image');
    next.textContent = '›';

    const count = document.createElement('span');
    count.className = 'besjaar-lightbox__count';
    count.setAttribute('aria-live', 'polite');

    dialog.append(figure, close, previous, next, count);
    document.body.appendChild(dialog);

    const activeIndex = () => {
      const current = thumbs.findIndex((thumb) => thumb.getAttribute('aria-current') === 'true');
      return current < 0 ? 0 : current;
    };
    const sync = () => {
      /* Besjaar 11.6: after a programmatic thumb click, mainImage.currentSrc still
         holds the PREVIOUS image until the async image update settles — read the
         target URL from the active thumb instead so prev/next never lags a step. */
      const activeThumb = thumbs[activeIndex()];
      image.src = activeThumb?.dataset.src || mainImage.currentSrc || mainImage.src;
      image.alt = mainImage.alt || '';
      const total = Math.max(thumbs.length, 1);
      count.textContent = `${activeIndex() + 1} / ${total}`;
      previous.hidden = total < 2;
      next.hidden = total < 2;
    };
    const move = (direction) => {
      if (thumbs.length < 2) return;
      const target = thumbs[(activeIndex() + direction + thumbs.length) % thumbs.length];
      target.click();
      sync();
    };
    const closeDialog = () => {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
    };

    trigger.addEventListener('click', () => {
      sync();
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      close.focus();
    });
    close.addEventListener('click', closeDialog);
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      if (event.key === 'Escape' && !dialog.open) trigger.focus();
    });
    dialog.addEventListener('close', () => trigger.focus());
  };

  const initReviewForm = (form) => {
    if (!(form instanceof HTMLFormElement) || form.dataset.reviewReady === 'true') return;
    form.dataset.reviewReady = 'true';
    const body = form.querySelector('[data-review-body]');
    const counter = form.querySelector('[data-review-counter]');
    const submit = form.querySelector('[data-review-submit]');
    const updateCounter = () => {
      if (!body || !counter) return;
      counter.textContent = `${body.value.length} / ${body.maxLength > 0 ? body.maxLength : 1200}`;
    };
    body?.addEventListener('input', updateCounter);
    updateCounter();
    form.addEventListener('submit', () => {
      if (!submit || !form.checkValidity()) return;
      submit.dataset.idleLabel = submit.textContent;
      submit.setAttribute('aria-busy', 'true');
    });
  };

  const initCollectionSort = (form) => {
    if (!(form instanceof HTMLFormElement) || form.dataset.sortReady === 'true') return;
    form.dataset.sortReady = 'true';
    form.querySelector('[data-collection-sort-select]')?.addEventListener('change', () => {
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.submit();
    });
  };

  const initProductAccordions = (group) => {
    if (!(group instanceof Element) || group.dataset.accordionReady === 'true') return;
    group.dataset.accordionReady = 'true';
    qsa('details', group).forEach((details) => {
      details.addEventListener('toggle', () => {
        if (!details.open) return;
        qsa('details', group).forEach((other) => { if (other !== details) other.open = false; });
      });
    });
  };

  const init = (scope = document) => {
    qsa(headerMenuSelector, scope).forEach(initHeaderMenu);
    qsa('[data-product-root]', scope).forEach(initLightbox);
    qsa('.besjaar-review-form__form', scope).forEach(initReviewForm);
    qsa('[data-collection-sort]', scope).forEach(initCollectionSort);
    qsa('.ind-bj-pd__details', scope).forEach(initProductAccordions);
    document.documentElement.classList.add('besjaar-v115-ready');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();

  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('pointerdown', (event) => {
    const activeMenu = event.target instanceof Element ? event.target.closest(headerMenuSelector) : null;
    closeHeaderMenus(activeMenu);
  }, { passive: true });
  window.addEventListener('pageshow', () => {
    qsa('[data-review-submit][aria-busy="true"]').forEach((button) => {
      button.removeAttribute('aria-busy');
      if (button.dataset.idleLabel) button.textContent = button.dataset.idleLabel;
    });
  });
})();

/* Besjaar 11.6 — recently viewed products. Records the visited product on
   product pages (localStorage, this browser only) and renders a small strip
   wherever the "Recently viewed" section is placed. */
(() => {
  'use strict';
  const KEY = 'besjaar_recently_viewed';
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } };
  const write = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 8))); } catch (_) {} };
  const context = (window.NovaConfig && window.NovaConfig.analytics && window.NovaConfig.analytics.context) || {};

  const record = () => {
    if (document.body.dataset.pageType !== 'product') return;
    const handle = context.productHandle;
    if (!handle) return;
    const image = (document.querySelector('meta[property="og:image"]')?.content || '').replace(/([?&])width=\d+/, '$1width=480');
    const entry = {
      h: handle,
      t: context.productTitle || document.title,
      u: window.location.pathname,
      i: image,
      p: document.querySelector('meta[property="product:price:amount"]')?.content || '',
      c: document.querySelector('meta[property="product:price:currency"]')?.content || ''
    };
    write([entry, ...read().filter((x) => x && x.h !== handle)]);
  };

  const money = (amount, currency) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return '';
    try { return new Intl.NumberFormat(document.documentElement.lang || 'nl-NL', { style: 'currency', currency: currency || 'EUR' }).format(n); }
    catch (_) { return '€' + n.toFixed(2); }
  };

  const renderInto = (section) => {
    if (!(section instanceof Element) || section.dataset.recentReady === 'true') return;
    section.dataset.recentReady = 'true';
    const grid = section.querySelector('[data-besjaar-recent-grid]');
    if (!grid) return;
    const items = read().filter((x) => x && x.h && x.t && x.u && x.h !== context.productHandle).slice(0, 4);
    if (!items.length) {
      /* In the theme editor, show the section with its empty-state copy so the
         merchant can see and style it; storefront visitors never see this. */
      if (window.Shopify && window.Shopify.designMode) {
        const note = document.createElement('p');
        note.className = 'nova-copy';
        note.textContent = section.dataset.emptyLabel || '';
        grid.appendChild(note);
        section.hidden = false;
      }
      return;
    }
    items.forEach((item) => {
      const card = document.createElement('a');
      card.className = 'b116-recent__card';
      card.href = item.u;
      if (item.i) {
        const img = document.createElement('img');
        img.loading = 'lazy'; img.decoding = 'async'; img.width = 240; img.height = 240; img.alt = '';
        img.src = item.i;
        card.appendChild(img);
      }
      const copy = document.createElement('span');
      copy.className = 'b116-recent__copy';
      const title = document.createElement('strong');
      title.textContent = window.NovaCatalogTitle ? window.NovaCatalogTitle(item.t) : item.t;
      copy.appendChild(title);
      const priceText = money(item.p, item.c);
      if (priceText) { const price = document.createElement('small'); price.textContent = priceText; copy.appendChild(price); }
      card.appendChild(copy);
      grid.appendChild(card);
    });
    section.hidden = false;
  };

  const initAll = (scope = document) => { if (scope.querySelectorAll) scope.querySelectorAll('[data-besjaar-recent-section]').forEach(renderInto); };
  const run = () => { initAll(); record(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();
