/*
 * Collection filtering / sorting / pagination without a full page reload.
 *
 * Progressive enhancement over Shopify's Section Rendering API. Every control
 * this script drives is a real <form method="get"> or a real <a href>, so with
 * JavaScript off the collection keeps working exactly as it did before.
 *
 * Markup contract, all opt-in:
 *
 *   [data-collection-root][data-section-id]  the section wrapper
 *     [data-collection-form]                 GET form; change or submit refreshes
 *     [data-collection-link]                 anchor; click refreshes
 *     [data-collection-part="<name>"]        region swapped from the response
 *
 * Regions are matched by name, and only their innerHTML is replaced, so the
 * containers themselves survive. That is what keeps the mobile filter drawer
 * open (and its focus trap alive) while the results underneath it change.
 *
 * A region must render unconditionally - an empty container is fine, a missing
 * one silently stops updating.
 *
 * After every successful swap the root fires `nova:collection:updated`, so
 * section scripts can re-bind anything that is not delegated.
 */
(() => {
  const ROOT = '[data-collection-root]';
  const PART = '[data-collection-part]';

  /* Reads the browser's current URL rather than a stored one, so back/forward
     and any other script that pushes state stay authoritative. */
  const currentUrl = () => new URL(window.location.href);

  const sectionUrl = (url, sectionId) => {
    const target = new URL(url, window.location.origin);
    target.searchParams.set('section_id', sectionId);
    return target.toString();
  };

  /* The address bar must never show section_id - it would be bookmarked and
     shared, and Shopify would serve the bare section fragment as a whole page. */
  const publicUrl = (url) => {
    const target = new URL(url, window.location.origin);
    target.searchParams.delete('section_id');
    return target.pathname + target.search;
  };

  class CollectionResults {
    constructor(root) {
      this.root = root;
      this.sectionId = root.dataset.sectionId;
      this.controller = null;
      /* Cache keyed by public URL. Filter panels get toggled back and forth a
         lot; re-fetching a combination the visitor already saw is pure latency. */
      this.cache = new Map();

      this.onFormChange = this.onFormChange.bind(this);
      this.onFormSubmit = this.onFormSubmit.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onPopState = this.onPopState.bind(this);

      /* Delegated, so swapped-in controls are live immediately. */
      root.addEventListener('change', this.onFormChange);
      root.addEventListener('submit', this.onFormSubmit);
      root.addEventListener('click', this.onClick);
      window.addEventListener('popstate', this.onPopState);
    }

    onFormChange(event) {
      const form = event.target.closest('[data-collection-form]');
      if (!form || !this.root.contains(form)) return;
      this.render(this.urlFromForm(form));
    }

    onFormSubmit(event) {
      const form = event.target.closest('[data-collection-form]');
      if (!form || !this.root.contains(form)) return;
      event.preventDefault();
      this.render(this.urlFromForm(form));
    }

    onClick(event) {
      /* Let the browser keep its native "open in new tab / window" behaviour. */
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.button !== 0) return;

      const link = event.target.closest('[data-collection-link]');
      if (!link || !this.root.contains(link) || !link.href) return;
      if (link.target && link.target !== '_self') return;

      event.preventDefault();
      this.render(link.href, { scrollToResults: link.hasAttribute('data-collection-scroll') });
    }

    onPopState() {
      /* history:false - the entry we are moving to already exists. */
      this.render(window.location.href, { history: false });
    }

    /* Serialising the form is what merges the visitor's new choice with
       everything already applied: the hidden sort_by / active-filter inputs the
       section renders are part of the same form. */
    urlFromForm(form) {
      const target = currentUrl();
      const params = new URLSearchParams(new FormData(form));

      /* Drop only the keys this form owns, then re-add its current values.
         Anything it does not own (a tag path, a vendor param set elsewhere)
         survives untouched. */
      const owned = new Set(
        [...form.elements]
          .map((element) => element.name)
          .filter(Boolean)
      );
      owned.forEach((name) => target.searchParams.delete(name));

      for (const [name, value] of params.entries()) {
        if (value !== '') target.searchParams.append(name, value);
      }

      /* Any change to the result set invalidates the current page number. */
      target.searchParams.delete('page');
      return target.toString();
    }

    async render(url, { history = true, scrollToResults = false } = {}) {
      const publicHref = publicUrl(url);

      /* A filter click while a previous fetch is still open must win. */
      this.controller?.abort();
      this.controller = new AbortController();

      this.setBusy(true);

      try {
        let html = this.cache.get(publicHref);

        if (html === undefined) {
          const response = await fetch(sectionUrl(url, this.sectionId), {
            signal: this.controller.signal,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          });
          if (!response.ok) throw new Error(`Section render failed: ${response.status}`);
          html = await response.text();
          this.cache.set(publicHref, html);
        }

        this.swap(html);

        if (history) window.history.pushState({ novaCollection: true }, '', publicHref);
        if (scrollToResults) this.scrollToResults();

        this.root.dispatchEvent(
          new CustomEvent('nova:collection:updated', { bubbles: true, detail: { url: publicHref } })
        );
      } catch (error) {
        if (error.name === 'AbortError') return; // superseded, not a failure
        /* Never leave the visitor stranded on a stale grid - hand the
           navigation back to the browser and let it do a normal page load. */
        console.error('[nova-collection]', error);
        window.location.assign(publicHref);
        return;
      } finally {
        /* An aborted request has already been replaced by a newer one that owns
           the busy state, so only the winning request clears it. */
        if (!this.controller.signal.aborted) this.setBusy(false);
      }
    }

    swap(html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const source = parsed.querySelector(ROOT) || parsed.body;
      const focus = this.captureFocus();

      source.querySelectorAll(PART).forEach((incoming) => {
        const name = incoming.dataset.collectionPart;
        const target = this.root.querySelector(`[data-collection-part="${name}"]`);
        if (target) target.innerHTML = incoming.innerHTML;
      });

      this.restoreFocus(focus);
    }

    /* Ticking a filter checkbox replaces the control the visitor is standing on.
       Identify it by name+value so the equivalent control in the new markup can
       take the focus back - otherwise focus falls to <body> and keyboard users
       lose their place in the filter list on every single choice. */
    captureFocus() {
      const active = document.activeElement;
      if (!active || !this.root.contains(active) || !active.name) return null;
      return { name: active.name, value: active.value, selectionEnd: active.selectionEnd };
    }

    restoreFocus(focus) {
      if (!focus) return;

      const escaped = window.CSS?.escape ? window.CSS.escape(focus.name) : focus.name;
      const candidates = [...this.root.querySelectorAll(`[name="${escaped}"]`)];
      const match =
        candidates.find((element) => element.value === focus.value) || candidates[0];
      if (!match) return;

      match.focus();
      /* Price inputs: put the caret back where it was instead of at position 0. */
      if (focus.selectionEnd != null && match.setSelectionRange) {
        try {
          match.setSelectionRange(focus.selectionEnd, focus.selectionEnd);
        } catch {
          /* Not a text-like input - focus alone is enough. */
        }
      }
    }

    setBusy(busy) {
      this.root.classList.toggle('is-collection-loading', busy);
      this.root.querySelectorAll(PART).forEach((part) => {
        part.setAttribute('aria-busy', busy ? 'true' : 'false');
      });
    }

    scrollToResults() {
      const anchor =
        this.root.querySelector('[data-collection-anchor]') ||
        this.root.querySelector('[data-collection-part="results"]');
      if (!anchor) return;

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      anchor.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  }

  const init = (scope = document) => {
    scope.querySelectorAll(ROOT).forEach((root) => {
      if (root.dataset.collectionBound === 'true') return;
      root.dataset.collectionBound = 'true';
      new CollectionResults(root);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  /* Theme editor: a section the merchant re-renders arrives unbound. */
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
