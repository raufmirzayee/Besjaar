/* Besjaar — code prices after the welcome offer / Black Friday sign-up.
   Config and server-side prices: sections/besjaar-welcome-applied.liquid.
   2026-11-06: knows the Black Friday sign-up code (reward "bf", every product,
   valid until the code ends), strikes through the price the code applies to,
   and puts the code's percentage in the product page's price-row badge. */
(() => {
  let config = {};
  try { config = JSON.parse(document.getElementById('BesjaarWelcomeAppliedConfig')?.textContent || '{}'); } catch { return; }
  const rewards = Array.isArray(config.rewards) ? config.rewards : [];
  const prices = config.prices || {};
  const PENDING = 'besjaar_welcome_offer_pending_session_v3';
  const CLAIMED = 'besjaar_welcome_offer_claimed_v3';
  const PENDING_MS = 10 * 60 * 1000;
  const ACTIVE_MS = 2 * 24 * 60 * 60 * 1000;
  const read = (store, key) => { try { return JSON.parse(store.getItem(key) || 'null'); } catch { return null; } };
  const remember = reward => {
    try { localStorage.setItem(CLAIMED, JSON.stringify({ at: Date.now(), reward: reward.id, code: reward.code, status: 'active' })); return true; } catch { return false; }
  };
  const upper = value => String(value || '').toUpperCase();

  const params = new URLSearchParams(location.search);
  const marker = params.get('besjaar_offer_claimed');
  const pending = read(sessionStorage, PENDING);
  const pendingFresh = !!pending?.at && Date.now() - Number(pending.at) < PENDING_MS;
  const bfReward = rewards.find(r => r.id === 'bf' && r.pct && r.code) || null;
  const flag = name => document.querySelector(`[data-offer-server-${name}]`)?.value === 'true';
  const blocked = () => flag('success') || flag('error') || params.get('customer_posted') === 'true' || location.pathname.includes('/challenge');

  /* Back from the Black Friday sign-up: Shopify has put the code on the cart
     and the popup is about to say so. Read the marker now: this script runs
     before the popup's, which removes it from the address bar. */
  const bfLanding = !!(bfReward && params.get('besjaar_bf_signup') && !blocked());
  if (bfLanding) remember(bfReward);

  const byProductId = {};
  const byVariantId = {};
  Object.keys(prices).forEach(handle => {
    const entry = prices[handle];
    byProductId[entry.id] = entry;
    Object.keys(entry.v || {}).forEach(id => { byVariantId[id] = entry; });
  });

  /* A code counts only while it can still be on the cart: when the cart holds
     a product the code covers, the code must be among the applied codes. */
  const inPlay = reward => {
    const covered = reward.all ? config.cartAny : config.cartCovered;
    return !covered || upper(config.cartCodes).includes(`|${upper(reward.code)}|`);
  };
  const claimedReward = () => {
    const found = [];
    const claim = read(localStorage, CLAIMED);
    if (claim?.at && claim.status === 'active') {
      const reward = rewards.find(r => r.id === claim.reward) || rewards.find(r => r.code === claim.code);
      const age = Date.now() - Number(claim.at);
      /* Welcome claims last 2 days; the Black Friday code as long as the shop
         still lists it (the section drops it when the code ends). */
      const fresh = reward?.id === 'bf' || (Number.isFinite(age) && age >= 0 && age <= ACTIVE_MS);
      if (reward && fresh && !(claim.code && claim.code !== reward.code)) found.push(reward);
    }
    if (bfReward && read(localStorage, config.bfKey || 'besjaar_bf_early_access_2026_v1')) found.push(bfReward);
    return found.find(reward => reward.pct && inPlay(reward)) || null;
  };

  const badgeText = reward => `${reward.pct}% KORTING`;
  const covers = (entry, reward) => !!entry && (reward.all || entry.ws !== false);
  const variantOf = (entry, id) => (entry?.v || {})[id] || (entry?.v || {})[entry?.first] || null;
  const codePrice = (entry, variant, reward) => {
    if (!covers(entry, reward)) return null;
    const p = variant?.p?.[reward.pct];
    return p && p.w !== false ? p : null;
  };
  const wasNode = variant => {
    const s = document.createElement('s');
    s.className = 'bj-price__was';
    const label = document.createElement('span');
    label.className = 'besjaar-ui-visually-hidden';
    label.textContent = `${config.regularLabel || ''} `;
    s.append(label, variant.wm);
    return s;
  };

  /* Price lists other sections print for their own scripts (recently viewed,
     the cart drawer's suggestions). */
  const rewriteLists = reward => {
    document.querySelectorAll('script[data-besjaar-recent-prices]').forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '{}');
        Object.keys(data).forEach(handle => {
          const entry = prices[handle];
          const variant = variantOf(entry, entry?.first);
          const p = codePrice(entry, variant, reward);
          if (!p) return;
          data[handle].p = variant.was;
          data[handle].s = p.c;
          data[handle].b = badgeText(reward);
        });
        script.textContent = JSON.stringify(data);
      } catch {}
    });
    document.querySelectorAll('script[data-besjaar-ui-cart-range]').forEach(script => {
      try {
        const list = JSON.parse(script.textContent || '[]');
        list.forEach(item => {
          const entry = byProductId[item.id];
          const variant = variantOf(entry, item.variantId);
          const p = codePrice(entry, variant, reward);
          if (!p) return;
          item.price = variant.was;
          item.priceNow = p.c;
          item.badge = badgeText(reward);
        });
        script.textContent = JSON.stringify(list);
      } catch {}
    });
  };

  /* Product cards: any element whose class ends in __price, outside the cart
     and the product page's own buy box. */
  const rewriteCards = reward => {
    document.querySelectorAll('[class*="__price"]').forEach(el => {
      const cls = Array.from(el.classList).find(c => /__price$/.test(c));
      if (!cls || el.closest('[data-product-root]')) return;
      if (el.closest('[class*="cart"], [id*="cart"], [id*="Cart"], form[action*="/cart"]')) return;
      const card = el.closest('article') || el.parentElement?.parentElement;
      const link = card?.querySelector('a[href*="/products/"]');
      if (!link) return;
      let handle = '';
      try { handle = decodeURIComponent(new URL(link.href, location.origin).pathname.split('/products/')[1].split('/')[0]); } catch { return; }
      const entry = prices[handle];
      const variant = variantOf(entry, entry?.first);
      const p = codePrice(entry, variant, reward);
      if (!p || el.dataset.bjWelcome === reward.id) return;
      el.dataset.bjWelcome = reward.id;
      const now = document.createElement('span');
      now.className = 'bj-price__now';
      now.textContent = p.m;
      el.replaceChildren(now, ' ', wasNode(variant));
      const base = cls.replace(/__price$/, '');
      let badge = card.querySelector('.bj-discount-badge') || card.querySelector(`.${base}__badge`);
      if (!badge) {
        const holder = card.querySelector(`.${base}__badges`) || card.querySelector(`.${base}__media`);
        if (holder) {
          badge = document.createElement('span');
          badge.className = `${base}__badge`;
          if (base === 'besjaar-collection-product-card') badge.classList.add('besjaar-collection-badge');
          holder.appendChild(badge);
        }
      }
      if (badge) {
        Array.from(badge.classList).forEach(c => { if (/--(dark|muted|sale)$/.test(c)) badge.classList.remove(c); });
        badge.classList.add('bj-discount-badge');
        badge.textContent = badgeText(reward);
      }
    });
  };

  /* Product page buy box (sections/besjaar-store-product.liquid): price,
     struck price, sticky bar, savings label on the photo, the sale badge in
     the price row, and a one-line note under the price. */
  const rewriteProductPage = reward => {
    document.querySelectorAll('[data-product-root]').forEach(root => {
      const id = root.querySelector('[data-variant-id]')?.value;
      const entry = byVariantId[id];
      const variant = variantOf(entry, id);
      const p = codePrice(entry, variant, reward);
      if (!p) return;
      const price = root.querySelector('.besjaar-store-premium-pd__price');
      if (price) { price.textContent = p.m; price.classList.add('is-bj-discounted'); }
      const sticky = root.querySelector('[id^="BesjaarStickyPrice-"]');
      if (sticky) sticky.textContent = p.m;
      const was = root.querySelector('[data-bj-price-was]');
      if (was) {
        was.hidden = false;
        const value = was.querySelector('[data-bj-was-value]');
        if (value) value.textContent = variant.wm;
      }
      root.querySelectorAll('[data-sale-price-prefix]').forEach(el => { el.hidden = false; });
      const sale = root.querySelector('.besjaar-store-premium-pd__sale');
      if (sale) { sale.textContent = `${config.save} ${p.s}`; sale.hidden = false; }
      const row = root.querySelector('.besjaar-store-premium-pd__price-row');
      if (!row) return;
      /* The dark badge carries the compare-at sale ("23% KORTING"); with a
         code it names the code's percentage instead, or is added. */
      let badge = row.querySelector('[data-bj-welcome-badge]') || row.querySelector('.bj-pd-badge--dark');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'bj-pd-badge bj-pd-badge--dark';
        const lead = row.firstElementChild;
        if (lead) lead.after(badge); else row.prepend(badge);
      }
      badge.dataset.bjWelcomeBadge = '';
      badge.classList.add('bj-discount-badge');
      badge.textContent = badgeText(reward);
      let note = root.querySelector('[data-bj-welcome-note]');
      if (!note) {
        note = document.createElement('p');
        note.className = 'bj-discount-note';
        note.dataset.bjWelcomeNote = '';
        row.after(note);
      }
      note.textContent = String(reward.note || config.note || '').replace('{pct}', reward.pct).replace('{code}', reward.code);
    });
  };

  let applied = null;
  const applyCodePrices = () => {
    const reward = claimedReward();
    if (!reward) return;
    if (!applied || applied.id !== reward.id) rewriteLists(reward);
    applied = reward;
    rewriteCards(reward);
    rewriteProductPage(reward);
  };
  applyCodePrices();
  document.addEventListener('besjaar_ui:variant-change', () => window.setTimeout(applyCodePrices, 0));

  const notice = document.getElementById('BesjaarWelcomeApplied');
  const show = reward => {
    if (!notice) return;
    const fill = text => String(text || '').replace('{code}', reward.code).replace('{value}', reward.value || '');
    notice.querySelector('[data-applied-title]').textContent = fill(reward.title || config.title);
    notice.querySelector('[data-applied-body]').textContent = fill(reward.body || config.body);
    notice.hidden = false;
    requestAnimationFrame(() => notice.classList.add('is-visible'));
    let timer = null;
    const hide = () => {
      clearTimeout(timer);
      notice.classList.remove('is-visible');
      window.setTimeout(() => { notice.hidden = true; }, 300);
    };
    notice.querySelector('[data-applied-close]')?.addEventListener('click', hide, { once: true });
    timer = window.setTimeout(hide, 10000);
    document.dispatchEvent(new CustomEvent('besjaar_ui:welcome_offer_applied_notice', { detail: { reward: reward.id } }));
  };

  document.addEventListener('DOMContentLoaded', () => {
    const isBlocked = blocked();
    let reward = null;
    if (!isBlocked && !bfLanding) {
      if (marker) {
        reward = rewards.find(r => r.id === marker) || (pending && rewards.find(r => r.code === pending.code)) || null;
        if (reward) remember(reward);
      } else if (pendingFresh) {
        reward = rewards.find(r => r.id === pending.reward) || rewards.find(r => r.code === pending.code) || null;
        if (reward) {
          try { sessionStorage.removeItem(PENDING); } catch {}
          remember(reward);
        }
      }
      if (reward?.code) show(reward);
    }
    applyCodePrices();
    /* Arrived through a shareable link (/discount/CODE?redirect=…) instead of
       the popup: read the codes Shopify put on the cart. Skipped on the Black
       Friday landing, where the popup itself confirms the code. */
    if (isBlocked || bfLanding || reward) return;
    const url = window.BesjaarUIConfig?.routes?.cartJson || '/cart.js';
    fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(response => (response.ok ? response.json() : null))
      .then(cart => {
        const codes = (cart?.discount_codes || []).map(d => upper(d?.code));
        if (!codes.length) return;
        const match = rewards.find(r => r.pct && codes.includes(upper(r.code)));
        if (!match) return;
        const current = claimedReward();
        if (current && current.id === match.id) return;
        if (!remember(match)) return;
        show(match);
        applyCodePrices();
      })
      .catch(() => {});
  });
})();
