/* Besjaar Welcome Drop v1.2 — compact no-scroll popup + 7-day claim suppression */
(() => {
  const dialog = document.querySelector('[data-besjaar-welcome-offer]');
  const configEl = document.querySelector('[data-besjaar-welcome-config]');
  if (!dialog || !configEl) return;

  let config = {};
  try { config = JSON.parse(configEl.textContent || '{}'); } catch { return; }
  const rewards = Array.isArray(config.rewards) ? config.rewards.filter(r => r && r.code && Number(r.weight) > 0) : [];
  if (!rewards.length) return;

  const keys = {
    seen: 'besjaar_welcome_offer_seen_session_v3',
    closed: 'besjaar_welcome_offer_closed_session_v3',
    reward: 'besjaar_welcome_offer_reward_session_v3',
    pending: 'besjaar_welcome_offer_pending_session_v3',
    claimed: 'besjaar_welcome_offer_claimed_v3'
  };
  const delay = Math.max(1, Number(dialog.dataset.delay || 3)) * 1000;
  const scrollTarget = Math.max(10, Math.min(90, Number(dialog.dataset.scroll || 35)));
  const exitIntent = dialog.dataset.exitIntent !== 'false';
  const rootUrl = dialog.dataset.rootUrl || '/';
  const shopUrl = dialog.dataset.shopUrl || `${rootUrl}collections/all`;
  const locale = String(dialog.dataset.locale || document.documentElement.lang || 'nl').toLowerCase().split('-')[0];
  const preview = new URLSearchParams(location.search).get('besjaar_offer') === 'preview';

  const $ = (sel, root = dialog) => root.querySelector(sel);
  const $$ = (sel, root = dialog) => Array.from(root.querySelectorAll(sel));
  // Visit suppression is session-based, while a successfully claimed welcome
  // discount is stored persistently so the welcome popup does not reappear while
  // that customer is already shopping with their welcome benefit.
  const getStored = key => { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; } };
  const setStored = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const removeStored = key => { try { sessionStorage.removeItem(key); } catch {} };
  const getPersistent = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const setPersistent = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const removePersistent = key => { try { localStorage.removeItem(key); } catch {} };
  const CLAIM_ACTIVE_MS = 7 * 24 * 60 * 60 * 1000;
  const CLAIM_PENDING_MS = 10 * 60 * 1000;

  let referrerIsInternal = false;
  if (document.referrer) {
    try { referrerIsInternal = new URL(document.referrer).origin === location.origin; } catch {}
  }
  // A direct/external entry starts a fresh visit only for people who have not
  // claimed the offer. Never clear the persistent claimed state here.
  if (!referrerIsInternal) {
    removeStored(keys.seen);
    removeStored(keys.closed);
    removeStored(keys.reward);
    const pendingEntry = getStored(keys.pending);
    if (!pendingEntry?.at || (Date.now() - Number(pendingEntry.at)) > CLAIM_PENDING_MS) removeStored(keys.pending);
  }

  const getValidClaim = () => {
    const claim = getPersistent(keys.claimed);
    if (!claim?.at) return null;
    const age = Date.now() - Number(claim.at);
    const ttl = claim.status === 'pending' ? CLAIM_PENDING_MS : CLAIM_ACTIVE_MS;
    if (!Number.isFinite(age) || age < 0 || age > ttl) {
      removePersistent(keys.claimed);
      return null;
    }
    return claim;
  };
  const dispatch = (name, detail = {}) => document.dispatchEvent(new CustomEvent(`besjaar_ui:${name}`, { detail }));
  const buildCollectionTarget = reward => {
    const target = new URL(shopUrl, location.origin);
    target.searchParams.set('besjaar_offer_claimed', reward?.id || '1');
    return `${target.pathname}${target.search}${target.hash}`;
  };
  const buildDiscountUrl = reward => {
    const root = rootUrl.endsWith('/') ? rootUrl : `${rootUrl}/`;
    return `${root}discount/${encodeURIComponent(reward.code)}?redirect=${encodeURIComponent(buildCollectionTarget(reward))}`;
  };
  const setFormReturnTo = reward => {
    const returnInput = $('#BesjaarWelcomeOfferForm input[name="return_to"]');
    if (returnInput && reward?.code) returnInput.value = buildDiscountUrl(reward);
  };

  let activeReward = null;
  let opened = false;
  let openingTimer = null;
  let previousFocus = null;

  const setStage = name => {
    $$('[data-offer-stage]').forEach(stage => stage.classList.toggle('is-active', stage.dataset.offerStage === name));
    dialog.dataset.stage = name;
  };

  const chooseReward = () => {
    const saved = getStored(keys.reward);
    if (saved?.id && saved?.code && rewards.some(r => r.id === saved.id)) return rewards.find(r => r.id === saved.id);
    const total = rewards.reduce((sum, reward) => sum + Math.max(0, Number(reward.weight) || 0), 0);
    let random = (window.crypto?.getRandomValues ? window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 : Math.random()) * total;
    let chosen = rewards[rewards.length - 1];
    for (const reward of rewards) { random -= Math.max(0, Number(reward.weight) || 0); if (random <= 0) { chosen = reward; break; } }
    setStored(keys.reward, { id: chosen.id, code: chosen.code, at: Date.now() });
    return chosen;
  };

  const canOpen = () => {
    if (preview) return true;
    if (getValidClaim()) return false;
    if (getStored(keys.seen) || getStored(keys.closed)) return false;
    if (document.body.classList.contains('besjaar-offer-open')) return false;
    return true;
  };

  const open = (source = 'timer') => {
    if (opened || !canOpen()) return;
    const otherOpenDialog = Array.from(document.querySelectorAll('dialog[open]')).find(el => el !== dialog);
    if (otherOpenDialog) { window.setTimeout(() => open(source), 3500); return; }
    opened = true;
    if (!preview) setStored(keys.seen, { at: Date.now(), source });
    previousFocus = document.activeElement;
    document.body.classList.add('besjaar-offer-open');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    setStage('intro');
    window.setTimeout(() => $('[data-offer-drop]')?.focus(), 80);
    dispatch('welcome_offer_opened', { source });
  };

  const close = (reason = 'close') => {
    if (!dialog.open && !dialog.hasAttribute('open')) return;
    if (!preview && !getValidClaim()) setStored(keys.closed, { at: Date.now(), reason });
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    document.body.classList.remove('besjaar-offer-open');
    opened = false;
    previousFocus?.focus?.();
    dispatch('welcome_offer_closed', { reason });
  };

  const rewardText = reward => reward?.value || '';
  const prepareEmailStage = reward => {
    activeReward = reward;
    $('[data-offer-found-badge]').textContent = rewardText(reward);
    const copy = $('[data-offer-found-copy]');
    if (copy) copy.textContent = reward.label || copy.textContent;
    const tags = $('[data-offer-tags]');
    if (tags) {
      const cleanCode = String(reward.code || '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '');
      tags.value = [
        'newsletter',
        'besjaar-welcome-offer',
        'besjaar-welcome-email-v1',
        `besjaar-welcome-${reward.id}`,
        `besjaar-welcome-code-${cleanCode}`,
        `besjaar-locale-${locale}`
      ].join(',');
    }
    setFormReturnTo(reward);
    setStage('email');
    window.setTimeout(() => $('#BesjaarWelcomeEmail')?.focus(), 120);
    dispatch('welcome_offer_reward_revealed', { reward: reward.id });
  };

  const showResult = reward => {
    activeReward = reward || activeReward || chooseReward();
    $('[data-offer-result-value]').textContent = rewardText(activeReward);
    $('[data-offer-result-title]').textContent = activeReward.label || '';
    $('[data-offer-code]').textContent = activeReward.code;
    const apply = $('[data-offer-apply]');
    if (apply) apply.href = buildDiscountUrl(activeReward);
    setStage('result');
    setPersistent(keys.claimed, { at: Date.now(), reward: activeReward.id, code: activeReward.code, status: 'active' });
    removeStored(keys.pending);
    removeStored(keys.closed);
    dispatch('welcome_offer_claimed', { reward: activeReward.id });
    window.setTimeout(() => $('[data-offer-apply]')?.focus(), 100);
  };

  const handleDropReveal = () => {
    const button = $('[data-offer-drop]');
    if (!button) return;
    button.classList.add('is-splashing');
    activeReward = chooseReward();
    window.setTimeout(() => { button.classList.remove('is-splashing'); prepareEmailStage(activeReward); }, 560);
  };

  $('[data-offer-drop]')?.addEventListener('click', handleDropReveal);
  $$('[data-offer-drop-trigger]').forEach(button => button.addEventListener('click', handleDropReveal));

  const form = $('#BesjaarWelcomeOfferForm');
  // Use Shopify's native customer-form POST. This is deliberately not AJAX:
  // Shopify's native newsletter form is the reliable path that creates/updates
  // the Customer record and sets email marketing consent.
  form?.addEventListener('submit', event => {
    const email = $('#BesjaarWelcomeEmail');
    const consent = $('[data-offer-consent]');
    const status = $('[data-offer-status]');
    const submit = $('[data-offer-submit]');
    if (!email?.validity.valid) {
      event.preventDefault();
      if (status) status.textContent = config.emailError || '';
      email?.focus();
      return;
    }
    if (!consent?.checked) {
      event.preventDefault();
      if (status) status.textContent = config.consentError || '';
      consent?.focus();
      return;
    }
    activeReward = activeReward || chooseReward();
    setFormReturnTo(activeReward);
    if (status) status.textContent = '';
    setStored(keys.pending, { at: Date.now(), reward: activeReward.id, code: activeReward.code });
    // Persist immediately before Shopify takes over the native form submission.
    // This prevents the popup from reopening on the redirected collection page,
    // even when Shopify strips our query marker during the discount redirect.
    setPersistent(keys.claimed, { at: Date.now(), reward: activeReward.id, code: activeReward.code, status: 'pending' });
    if (submit) {
      submit.disabled = true;
      const span = submit.querySelector('span');
      if (span) span.textContent = config.submitting || '…';
    }
    // No preventDefault here: allow the native Shopify customer form to submit.
  });

  $('[data-offer-copy]')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const code = activeReward?.code || $('[data-offer-code]')?.textContent || '';
    try { await navigator.clipboard.writeText(code); button.textContent = config.copied || 'Copied'; }
    catch {
      const temp = document.createElement('textarea'); temp.value = code; temp.setAttribute('readonly',''); temp.style.position='fixed'; temp.style.opacity='0'; document.body.appendChild(temp); temp.select(); document.execCommand('copy'); temp.remove(); button.textContent = config.copied || 'Copied';
    }
    window.setTimeout(() => { button.textContent = config.copy || 'Copy'; }, 1600);
    dispatch('welcome_offer_code_copied', { reward: activeReward?.id || '' });
  });

  $$('[data-besjaar-offer-close]').forEach(button => button.addEventListener('click', () => close('button')));
  dialog.addEventListener('click', event => { if (event.target === dialog) close('backdrop'); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close('escape'); });
  $('[data-offer-apply]')?.addEventListener('click', () => dispatch('welcome_offer_shop_clicked', { reward: activeReward?.id || '' }));

  // Successful native form submissions go straight through Shopify's
  // /discount/CODE route and then land on the collection. The marker below is
  // removed immediately, but it lets us safely record that the offer was claimed
  // without showing a second success screen.
  const pageParams = new URLSearchParams(location.search);
  const claimedMarker = pageParams.get('besjaar_offer_claimed');
  if (claimedMarker) {
    const claimedReward = rewards.find(r => r.id === claimedMarker) || getStored(keys.pending);
    setPersistent(keys.claimed, {
      at: Date.now(),
      reward: claimedReward?.id || claimedMarker,
      code: claimedReward?.code || getStored(keys.pending)?.code || '',
      status: 'active'
    });
    removeStored(keys.pending);
    removeStored(keys.closed);
    pageParams.delete('besjaar_offer_claimed');
    const cleanQuery = pageParams.toString();
    history.replaceState(null, '', `${location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${location.hash}`);
  }

  const pending = getStored(keys.pending);
  const serverSuccess = $('[data-offer-server-success]')?.value === 'true' || new URLSearchParams(location.search).get('customer_posted') === 'true';
  const serverError = $('[data-offer-server-error]')?.value === 'true';
  if (pending?.reward && (Date.now() - Number(pending.at || 0)) < CLAIM_PENDING_MS && serverSuccess) {
    activeReward = rewards.find(r => r.id === pending.reward) || rewards.find(r => r.code === pending.code) || chooseReward();
    setPersistent(keys.claimed, { at: Date.now(), reward: activeReward.id, code: activeReward.code, status: 'active' });
    location.replace(buildDiscountUrl(activeReward));
    return;
  } else if (pending?.reward && (Date.now() - Number(pending.at || 0)) < CLAIM_PENDING_MS && serverError) {
    activeReward = rewards.find(r => r.id === pending.reward) || rewards.find(r => r.code === pending.code) || chooseReward();
    removePersistent(keys.claimed);
    opened = true;
    document.body.classList.add('besjaar-offer-open');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
    prepareEmailStage(activeReward);
    const status = $('[data-offer-status]');
    if (status && !status.textContent.trim()) status.textContent = config.submitError || '';
    removeStored(keys.pending);
  } else if (preview) {
    window.setTimeout(() => open('preview'), 250);
  } else if (canOpen()) {
    openingTimer = window.setTimeout(() => open('timer'), delay);
    const onScroll = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - innerHeight);
      if ((scrollY / max) * 100 >= scrollTarget) { window.removeEventListener('scroll', onScroll); clearTimeout(openingTimer); open('scroll'); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (exitIntent && matchMedia('(min-width: 761px)').matches) {
      let armed = false;
      window.setTimeout(() => { armed = true; }, 3500);
      document.addEventListener('mouseout', event => { if (armed && event.clientY <= 4 && !event.relatedTarget) { clearTimeout(openingTimer); open('exit'); armed = false; } }, { passive: true });
    }
  }

  window.BesjaarWelcomeOffer = {
    open: () => { removeStored(keys.seen); removeStored(keys.closed); removePersistent(keys.claimed); open('manual'); },
    reset: () => {
      [keys.seen, keys.closed, keys.reward, keys.pending].forEach(removeStored);
      removePersistent(keys.claimed);
      location.reload();
    }
  };
})();
