(() => {
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const qs = (selector, root = document) => root.querySelector(selector);

  const focusable = (root) => qsa('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])', root)
    .filter((el) => !el.hidden && el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null);

  // aria-hidden alone does not remove off-canvas controls from the tab order. Keep inert synchronized.
  const syncSurface = (surface) => {
    const hidden = surface.getAttribute('aria-hidden') === 'true';
    try { surface.inert = hidden; } catch (_) {
      if (hidden) surface.setAttribute('inert', ''); else surface.removeAttribute('inert');
    }
  };
  const surfaces = qsa('[data-drawer],[data-search-panel],[data-mobile-menu]');
  surfaces.forEach((surface) => {
    syncSurface(surface);
    new MutationObserver(() => syncSurface(surface)).observe(surface, { attributes: true, attributeFilter: ['aria-hidden'] });
  });

  // Treat the mobile menu as a contained disclosure when it visually covers the viewport.
  const mobileMenu = qs('[data-mobile-menu]');
  const menuToggle = qs('[data-menu-toggle]');
  document.addEventListener('keydown', (event) => {
    if (!mobileMenu?.classList.contains('is-open') || event.key !== 'Tab') return;
    const items = focusable(mobileMenu);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); menuToggle?.focus();
    }
  });

  // Announce state of wishlist toggle controls in addition to their visual heart state.
  const syncWishButtons = () => qsa('[data-wish-product]').forEach((button) => {
    button.setAttribute('aria-pressed', button.classList.contains('is-saved') ? 'true' : 'false');
  });
  syncWishButtons();
  const wishObserver = new MutationObserver(syncWishButtons);
  qsa('[data-wish-product]').forEach((button) => wishObserver.observe(button, { attributes: true, attributeFilter: ['class'] }));

  // Search dialog buttons expose the relation to the dialog even when sections are re-rendered in the editor.
  const searchPanel = qs('[data-search-panel]');
  if (searchPanel?.id) qsa('[data-search-toggle]').forEach((button) => {
    button.setAttribute('aria-controls', searchPanel.id);
    button.setAttribute('aria-haspopup', 'dialog');
  });

  // The main landmark is intentionally programmatically focusable for the skip link, not a normal tab stop.
  const main = document.getElementById('MainContent');
  main?.addEventListener('blur', () => main.removeAttribute('data-skip-focused'));
})();
