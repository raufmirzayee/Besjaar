/* Besjaar 9.2 — Shopify Theme Editor preview resilience. Production storefront is unaffected. */
(() => {
  if (!window.Shopify || !window.Shopify.designMode) return;
  const reveal = root => {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-reveal]').forEach(node => node.classList.add('is-visible'));
    scope.querySelectorAll('img[loading=\"lazy\"]').forEach(img => { if (img.complete) img.classList.add('is-loaded'); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => reveal(document), { once: true });
  else reveal(document);
  document.addEventListener('shopify:section:load', event => requestAnimationFrame(() => reveal(event.target)));
  document.addEventListener('shopify:section:select', event => requestAnimationFrame(() => reveal(event.target)));
})();
