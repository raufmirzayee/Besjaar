/* Besjaar 11.76 (2026-11-04) mobile cart optimisation: free-shipping nudge,
   express checkout placement and refresh, pinned cart-page checkout bar.
   Loaded by sections/besjaar-cart-mobile-1176.liquid, which documents it. */
(function () {
  'use strict';
  var start = function () {
    var node = document.querySelector('[data-bj-ship-nudge]');
    var data = null;
    try { data = JSON.parse((node && node.textContent) || 'null'); } catch (e) { data = null; }
    var cfg = (window.BesjaarUIConfig && window.BesjaarUIConfig.commerce) || {};
    var threshold = cfg.showFreeShippingBar === false ? 0 : Number(cfg.freeShippingThresholdCents || 0);
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    var lang = (document.documentElement.lang || 'nl').slice(0, 2).toLowerCase();
    var T = {
      nl: { refill: 'Extra filterset (2 stuks)', hose: 'Doucheslang', free: 'Hiermee is je verzending gratis', refillFit: 'Past in je douchekop met filter', hoseFit: 'Past op elke douchekop', add: '%t toevoegen aan je winkelwagen', adding: 'Bezig…', err: 'Toevoegen lukte niet. Probeer het opnieuw.' },
      en: { refill: 'Spare filter set (2 pcs)', hose: 'Shower hose', free: 'This makes your shipping free', refillFit: 'Fits your filter showerhead', hoseFit: 'Fits any showerhead', add: 'Add %t to your cart', adding: 'Adding…', err: 'Could not add it. Please try again.' },
      de: { refill: 'Ersatzfilter-Set (2 Stück)', hose: 'Duschschlauch', free: 'Damit ist dein Versand gratis', refillFit: 'Passt in deinen Filter-Duschkopf', hoseFit: 'Passt an jeden Duschkopf', add: '%t in den Warenkorb legen', adding: 'Moment…', err: 'Hinzufügen fehlgeschlagen. Bitte versuche es erneut.' },
      fr: { refill: 'Filtres de rechange (lot de 2)', hose: 'Flexible de douche', free: 'Avec cet article, la livraison est offerte', refillFit: 'Pour votre pommeau à filtre', hoseFit: 'Compatible avec tous les pommeaux', add: 'Ajouter %t au panier', adding: 'Ajout…', err: 'Ajout impossible. Veuillez réessayer.' },
      es: { refill: 'Filtros de recambio (2 uds.)', hose: 'Flexo de ducha', free: 'Con esto, tu envío es gratis', refillFit: 'Para tu alcachofa con filtro', hoseFit: 'Compatible con cualquier alcachofa', add: 'Añadir %t al carrito', adding: 'Añadiendo…', err: 'No se pudo añadir. Inténtalo de nuevo.' }
    }[lang];
    if (!T) T = { refill: 'Spare filter set (2 pcs)', hose: 'Shower hose', free: 'This makes your shipping free', refillFit: 'Fits your filter showerhead', hoseFit: 'Fits any showerhead', add: 'Add %t to your cart', adding: 'Adding…', err: 'Could not add it. Please try again.' };
    var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var money = function (cents, cur) {
      try { var s = new Intl.NumberFormat(document.documentElement.lang || 'nl-NL', { style: 'currency', currency: cur || 'EUR' }).format((Number(cents) || 0) / 100); return /^\D/.test(s) ? s.replace(/\s/g, '') : s; }
      catch (e) { return '€' + ((Number(cents) || 0) / 100).toFixed(2); }
    };
    var setOf = function (list) { var s = {}; (list || []).forEach(function (id) { s[String(id)] = true; }); return s; };
    var filterHeads = setOf(data && data.filterHeads), bareHeads = setOf(data && data.bareHeads);
    var items = (data && data.items) || [];

    /* One matching accessory, or null. */
    var pick = function (cart) {
      if (!threshold || !items.length || !cart || !cart.items || !cart.items.length) return null;
      var remaining = threshold - Number(cart.total_price || 0);
      if (remaining <= 0) return null;
      var inCart = {}, needRefill = false, needHose = false;
      cart.items.forEach(function (line) {
        var id = String(line.product_id);
        inCart[id] = true;
        if (filterHeads[id]) needRefill = true;
        if (bareHeads[id]) needHose = true;
      });
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (inCart[String(it.id)]) continue;
        if ((it.kind === 'refill' && needRefill) || (it.kind === 'hose' && needHose)) return { item: it, remaining: remaining, currency: cart.currency || 'EUR' };
      }
      return null;
    };
    var render = function (cart) {
      var choice = pick(cart);
      Array.prototype.forEach.call(document.querySelectorAll('#BesjaarUICartDrawer [data-free-shipping], [data-cart-page-free-shipping]'), function (box) {
        var el = box.querySelector('[data-bj-ship-add]');
        if (!choice) { if (el) el.remove(); return; }
        var it = choice.item, free = Number(it.price) >= choice.remaining;
        var title = it.kind === 'refill' ? T.refill : T.hose;
        var hint = free ? T.free : (it.kind === 'refill' ? T.refillFit : T.hoseFit);
        var key = it.variantId + ':' + (free ? 'free' : 'fit') + ':' + choice.currency;
        if (el && el.getAttribute('data-key') === key) return;
        if (!el) { el = document.createElement('div'); el.className = 'bj-ship-add'; el.setAttribute('data-bj-ship-add', ''); box.appendChild(el); }
        el.setAttribute('data-key', key);
        el.innerHTML = '<span class="bj-ship-add__media">' + (it.image ? '<img src="' + esc(it.image) + '" alt="" width="44" height="44" loading="lazy">' : '') + '</span>' +
          '<span class="bj-ship-add__copy"><span class="bj-ship-add__title">' + esc(title) + '</span><span class="bj-ship-add__hint">' + esc(hint) + '</span></span>' +
          '<button type="button" class="bj-ship-add__btn" data-bj-ship-add-btn="' + esc(it.variantId) + '" aria-label="' + esc(T.add.replace('%t', title) + ' (' + money(it.price, choice.currency) + ')') + '">+ ' + esc(money(it.price, choice.currency)) + '</button>' +
          '<p class="bj-ship-add__err" role="alert" hidden></p>';
      });
    };
    document.addEventListener('click', function (event) {
      var btn = event.target && event.target.closest ? event.target.closest('[data-bj-ship-add-btn]') : null;
      if (!btn || btn.disabled) return;
      event.preventDefault();
      var box = btn.closest('[data-bj-ship-add]');
      var err = box && box.querySelector('.bj-ship-add__err');
      var onPage = !!btn.closest('[data-cart-page-free-shipping]');
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = T.adding;
      if (err) err.hidden = true;
      fetch(root + 'cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items: [{ id: Number(btn.getAttribute('data-bj-ship-add-btn')), quantity: 1 }] }) })
        .then(function (r) { if (!r.ok) throw new Error('cart_add'); return r.json(); })
        .then(function () {
          try { (window.dataLayer = window.dataLayer || []).push({ event: 'besjaar_free_shipping_addon', variant_id: String(btn.getAttribute('data-bj-ship-add-btn')) }); } catch (e) {}
          if (onPage) { window.location.reload(); return; }
          /* Same repaint the drawer's discount code uses: reopening re-reads the cart. */
          var opener = document.querySelector('[data-open-drawer="cart"]');
          if (opener) opener.click(); else window.location.reload();
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = label;
          if (err) { err.textContent = T.err; err.hidden = false; }
        });
    });

    /* Express checkout buttons: under the drawer's checkout button, or under
       the cart page's. The pinned cart-page checkout bar goes to the end of
       <body>, so no positioned ancestor in the header group can trap it. */
    var placeAfter = function (selector, anchorSelector) {
      var el = document.querySelector(selector), anchor = document.querySelector(anchorSelector);
      if (!el || !anchor || !anchor.parentNode) return;
      anchor.parentNode.insertBefore(el, anchor.nextSibling);
      el.classList.add('is-placed');
    };
    placeAfter('[data-bj-cd-express]', '#BesjaarUICartDrawer .besjaar-ui-cart-drawer__actions');
    placeAfter('[data-bj-cp-express]', '#besjaar-store-cart-form [data-cart-page-checkout]');

    /* Express checkout buttons in the drawer: re-render when the cart changes. */
    var express = document.querySelector('[data-bj-cd-express]');
    var sig = express ? express.getAttribute('data-sig') : '';
    var expressTimer = null;
    var refreshExpress = function (cart) {
      if (!express || !cart || !cart.items) return;
      var next = cart.item_count + ':' + cart.total_price;
      if (next === sig) return;
      sig = next;
      clearTimeout(expressTimer);
      expressTimer = setTimeout(function () {
        fetch(root + '?sections=besjaar-express-checkout', { headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error('sections'); return r.json(); })
          .then(function (json) { var html = json && json['besjaar-express-checkout']; if (typeof html === 'string') express.innerHTML = html; })
          .catch(function () {});
      }, 350);
    };

    /* Cart page on phones: show the pinned checkout bar while the summary's
       own checkout button is off screen. */
    var sticky = document.querySelector('[data-bj-cp-sticky]');
    var cartForm = document.getElementById('besjaar-store-cart-form');
    var mainCheckout = cartForm && cartForm.querySelector('[data-cart-page-checkout]');
    if (sticky && mainCheckout && 'IntersectionObserver' in window) {
      document.body.appendChild(sticky);
      var stickyBtn = sticky.querySelector('button');
      var stickyTotal = sticky.querySelector('[data-bj-cp-sticky-total]');
      var mq = window.matchMedia('(max-width: 749px)');
      var mainVisible = true, hasItems = true;
      var sync = function () {
        var show = mq.matches && hasItems && !mainVisible;
        sticky.classList.toggle('is-visible', show);
        sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
        if (stickyBtn) stickyBtn.tabIndex = show ? 0 : -1;
      };
      new IntersectionObserver(function (entries) { mainVisible = entries[entries.length - 1].isIntersecting; sync(); }).observe(mainCheckout);
      if (mq.addEventListener) mq.addEventListener('change', sync);
      document.addEventListener('bj:cart', function (event) {
        var cart = event.detail;
        if (!cart || !cart.items) return;
        hasItems = cart.item_count > 0;
        if (stickyTotal) stickyTotal.textContent = money(cart.total_price, cart.currency || 'EUR');
        sync();
      });
    }
    document.addEventListener('bj:cart', function (event) { render(event.detail); refreshExpress(event.detail); });
    render(window.__bjCart || (data && data.cart));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
