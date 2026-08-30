/* Besjaar Nova 7.4.1 — dedicated FAQ search */
(() => {
  const normalize = (value) => String(value || '')
    .toLocaleLowerCase(document.documentElement.lang || undefined)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const init = (root) => {
    if (!root || root.dataset.faqReady === 'true') return;
    root.dataset.faqReady = 'true';

    const input = root.querySelector('[data-faq-search]');
    const clear = root.querySelector('[data-faq-clear]');
    const status = root.querySelector('[data-faq-status]');
    const noResults = root.querySelector('[data-faq-no-results]');
    const items = Array.from(root.querySelectorAll('[data-faq-item]'));
    const groups = Array.from(root.querySelectorAll('[data-faq-group]'));
    if (!input || !items.length) return;

    items.forEach((item, index) => {
      item.dataset.faqDefaultOpen = item.open ? 'true' : 'false';
      item.dataset.faqSearchText = normalize(item.textContent);
      if (!item.id) item.id = `NovaFaqAnswer-${index + 1}`;
    });

    const announce = (count, searching) => {
      if (!status) return;
      if (!searching) {
        status.textContent = '';
        return;
      }
      const label = count === 1 ? root.dataset.resultSingular : root.dataset.resultPlural;
      status.textContent = `${count} ${label}`;
    };

    const filter = () => {
      const query = normalize(input.value);
      const searching = query.length > 0;
      let visible = 0;

      items.forEach((item) => {
        const match = !searching || item.dataset.faqSearchText.includes(query);
        item.hidden = !match;
        if (match) {
          visible += 1;
          if (searching) item.open = true;
          else item.open = item.dataset.faqDefaultOpen === 'true';
        } else {
          item.open = false;
        }
      });

      groups.forEach((group) => {
        const hasVisible = Array.from(group.querySelectorAll('[data-faq-item]')).some((item) => !item.hidden);
        group.hidden = !hasVisible;
      });

      if (clear) clear.hidden = !searching;
      if (noResults) noResults.hidden = visible !== 0;
      root.classList.toggle('is-searching', searching);
      root.classList.toggle('has-no-results', visible === 0);
      announce(visible, searching);
    };

    input.addEventListener('input', filter);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && input.value) {
        input.value = '';
        filter();
      }
    });
    clear?.addEventListener('click', () => {
      input.value = '';
      filter();
      input.focus();
    });
  };

  const boot = () => document.querySelectorAll('[data-nova-faq-page]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  document.addEventListener('shopify:section:load', boot);
})();
