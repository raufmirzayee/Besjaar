/* Besjaar cart UX (2026-11-05). Loaded on every page from sections/besjaar-cart-1168.liquid.
   1. Drawer names: the drawer lines and suggestions are drawn by besjaar-ui-core.js
      with the full product title (often six or more lines). The cart page already
      shows the short, localized title (snippets/localized-product-title.liquid);
      the drawer gets the same names, read from the JSON that
      sections/besjaar-cart-1168.liquid renders (handle -> title).
   2. Cart page quick add: on /cart (full or empty) the suggestion cards' "+ add" button used to
      open the drawer on top of a cart page that did not change. Here it adds the
      product, reloads the page (as the cart page's discount code and
      free-shipping accessory already do) and highlights the new line. */
(function () {
  'use strict';
  var node = document.querySelector('[data-bj-cart-titles]');
  var drawer = document.getElementById('BesjaarUICartDrawer');
  if (!node || !drawer) return;
  var titles = {};
  try { titles = JSON.parse(node.textContent || '{}') || {}; } catch (e) { return; }
  var handleOf = function (href) {
    var m = /\/products\/([^/?#]+)/.exec(href || '');
    return m ? decodeURIComponent(m[1]) : '';
  };
  var apply = function () {
    var links = drawer.querySelectorAll('.besjaar-ui-cart-drawer__line-main > a[href*="/products/"], .besjaar-ui-cart-upsell__copy > a[href*="/products/"]');
    for (var i = 0; i < links.length; i += 1) {
      var link = links[i];
      var name = titles[handleOf(link.getAttribute('href'))];
      var label = link.querySelector('h3, strong');
      if (!name || !label) continue;
      if (!label.hasAttribute('title')) label.setAttribute('title', label.textContent.trim());
      if (label.textContent !== name) label.textContent = name;
    }
  };
  var queued = false;
  var schedule = function () {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () { queued = false; apply(); });
  };
  apply();
  if ('MutationObserver' in window) new MutationObserver(schedule).observe(drawer, { childList: true, subtree: true });
})();

(function () {
  'use strict';
  var page = document.querySelector('section.bj-cp');
  if (!page) return;
  var KEY = 'bj-cp-added';
  var store = function (value) {
    try { if (value) window.sessionStorage.setItem(KEY, value); else window.sessionStorage.removeItem(KEY); } catch (e) {}
  };
  var added = null;
  try { added = window.sessionStorage.getItem(KEY); } catch (e) {}
  if (added) {
    store('');
    var line = page.querySelector('[data-cart-line-key^="' + String(added).replace(/[^0-9]/g, '') + ':"]');
    /* The reload was started with scroll restoration off; switch it back on
       only after the load event, when the browser would have restored. */
    var show = function () {
      window.setTimeout(function () {
        if (line) {
          line.scrollIntoView({ block: 'center' });
          line.classList.add('bj-cp-item--added');
          window.setTimeout(function () { line.classList.remove('bj-cp-item--added'); }, 2400);
        }
        try { window.history.scrollRestoration = 'auto'; } catch (e) {}
      }, 0);
    };
    if (document.readyState === 'complete') show(); else window.addEventListener('load', show);
  }
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest && event.target.closest('[data-card-quick-add]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    if (button.disabled) return;
    var id = Number(button.getAttribute('data-card-quick-add'));
    var fallback = button.closest('form');
    if (!id) return;
    button.disabled = true;
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: [{ id: id, quantity: 1 }] })
    }).then(function (response) {
      if (!response.ok) throw new Error('cart_add');
      store(String(id));
      try { window.history.scrollRestoration = 'manual'; } catch (e) {}
      window.location.reload();
    }).catch(function () {
      if (fallback) { HTMLFormElement.prototype.submit.call(fallback); return; }
      button.disabled = false;
      button.classList.remove('is-loading');
      button.removeAttribute('aria-busy');
    });
  }, true);
})();
