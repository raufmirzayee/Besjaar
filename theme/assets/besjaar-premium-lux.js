/* Besjaar 11.3.0 — Premium Lux runtime.
   Two small enhancements only: a desktop header scroll state and a cart-count
   pulse. No reveal observers (besjaar-ui-core.js owns those), no drawer or search
   logic, nothing the page depends on to function. */
(() => {
  const body = document.body;
  if (!body || !body.classList.contains('besjaar-ui-polish-v34')) return;
  if (body.classList.contains('besjaar-ui-editor-safe')) return;

  // Header depth on scroll. Mobile already has is-mobile-compact (besjaar-ui-core.js);
  // is-scrolled is a separate, style-only class and never touches that one.
  const header = document.querySelector('[data-site-header]');
  if (header) {
    let ticking = false;
    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // Pulse cart-count bubbles when their number changes. besjaar-ui-core.js only sets
  // textContent, so a MutationObserver picks the change up without touching
  // any cart logic. Gated on the sanctioned motion class (encodes both the
  // merchant flag and prefers-reduced-motion).
  if (!body.classList.contains('besjaar-ui-motion-enabled')) return;
  document.querySelectorAll('[data-cart-count]').forEach(node => {
    let timer = null;
    let last = node.textContent.trim();
    const observer = new MutationObserver(() => {
      // besjaar-ui-core rewrites textContent on every drawer render; only a real
      // value change should pulse.
      const now = node.textContent.trim();
      if (now === last) return;
      last = now;
      node.classList.remove('lux-pulse');
      void node.offsetWidth;
      node.classList.add('lux-pulse');
      clearTimeout(timer);
      timer = setTimeout(() => node.classList.remove('lux-pulse'), 600);
    });
    observer.observe(node, { childList: true, characterData: true, subtree: true });
  });
})();
