/* Besjaar — reveals the write-a-review disclosure when the form has something
   to say. Shopify renders the success message after redirecting back with
   ?contact_posted=true, and re-renders validation errors in place; in both
   cases the message sits inside a collapsed <details>, so open it and bring
   it into view. Progressive enhancement only — the form works without this. */
(function () {
  var ready = function () {
    document.querySelectorAll('[data-review-disclosure]').forEach(function (disclosure) {
      var message = disclosure.querySelector('.besjaar-ui-form-message');
      if (!message) return;
      disclosure.open = true;
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      try {
        message.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      } catch (e) {
        message.scrollIntoView();
      }
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
