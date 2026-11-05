/* Besjaar cart drawer UX (2026-11-05).
   The drawer lines and suggestions are drawn by besjaar-ui-core.js with the full
   product title (often six or more lines). The cart page already shows the
   short, localized title (snippets/localized-product-title.liquid); this script
   gives the drawer the same names, read from the JSON that
   sections/besjaar-cart-1168.liquid renders (handle -> title). */
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
