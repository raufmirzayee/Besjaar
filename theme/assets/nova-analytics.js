/* Besjaar Nova 7.3.6 — Analytics, Consent & Conversion Measurement OS
 * This file does not load or send data to third-party analytics vendors.
 * Production analytics should be installed through Shopify Customer events / Web Pixels.
 */
(() => {
  const rootConfig = window.NovaConfig || {};
  const config = rootConfig.analytics || {};
  if (config.enabled === false) return;

  const state = {
    ready: false,
    privacy: { analytics: false, marketing: false, preferences: false, raw: null },
    attribution: {},
    lastEvent: '',
    shopifyBridge: false,
    context: config.context || {}
  };
  const dialog = document.querySelector('[data-nova-privacy-dialog]');
  const debugRoot = document.querySelector('[data-nova-measurement-debug]');
  const i18n = config.i18n || {};
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const boolLabel = value => value === true ? (i18n.yes || 'Yes') : value === false ? (i18n.no || 'No') : (i18n.unknown || 'Unknown');

  const updateDebug = () => {
    if (!debugRoot) return;
    const set = (key, value) => { const el = qs(`[data-nova-debug="${key}"]`, debugRoot); if (el) el.textContent = value; };
    set('page', state.context.pageType || document.body?.dataset.pageType || '');
    set('analytics', boolLabel(state.privacy.analytics));
    set('marketing', boolLabel(state.privacy.marketing));
    set('preferences', boolLabel(state.privacy.preferences));
    const source = state.attribution.utm_source || state.attribution.source || '';
    const campaign = state.attribution.utm_campaign || state.attribution.campaign || '';
    set('attribution', source || campaign ? [source, campaign].filter(Boolean).join(' · ') : (i18n.noCampaign || 'Direct / none'));
    set('event', state.lastEvent || (i18n.waiting || 'Waiting'));
    set('bridge', state.shopifyBridge ? (i18n.ready || 'Ready') : (i18n.unavailableShort || 'Unavailable'));
  };

  const sanitize = (value, depth = 0) => {
    if (depth > 4 || value == null) return value == null ? null : String(value).slice(0, 300);
    if (['string','number','boolean'].includes(typeof value)) return typeof value === 'string' ? value.slice(0, 300) : value;
    if (Array.isArray(value)) return value.slice(0, 20).map(item => sanitize(item, depth + 1));
    if (typeof value === 'object') {
      const out = {};
      Object.entries(value).slice(0, 30).forEach(([key, item]) => { out[String(key).slice(0, 80)] = sanitize(item, depth + 1); });
      return out;
    }
    return String(value).slice(0, 300);
  };

  const refreshBridge = () => {
    state.shopifyBridge = typeof window.Shopify?.analytics?.publish === 'function';
    updateDebug();
    return state.shopifyBridge;
  };

  const publishShopify = (name, detail = {}) => {
    if (!state.privacy.analytics || !refreshBridge()) return;
    // Standard commerce events belong to Shopify Customer Events/Web Pixels.
    // Nova publishes only Besjaar-prefixed UI/custom events to avoid duplicate GA4 purchases or add_to_cart events.
    try {
      const result = window.Shopify.analytics.publish(`besjaar:${name}`, sanitize({ ...detail, page: state.context.pageType || '', locale: state.context.locale || '', attribution: state.attribution }));
      result?.catch?.(() => {});
    } catch {}
  };

  const dispatch = (name, detail = {}) => {
    state.lastEvent = name;
    updateDebug();
    const payload = { ...sanitize(detail), context: state.context, attribution: state.attribution };
    document.dispatchEvent(new CustomEvent(`nova:${name}`, { detail: payload }));
    publishShopify(name, detail);
    if (config.debug) console.info('[Nova 7.3.6]', name, detail);
  };

  const captureAttribution = () => {
    if (!config.attribution || !state.privacy.analytics) { state.attribution = {}; updateDebug(); return; }
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const next = {};
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(key => { const v = params.get(key); if (v) next[key] = v.slice(0,180); });
    if (state.privacy.marketing) ['gclid','fbclid','msclkid','ttclid'].forEach(key => { const v = params.get(key); if (v) next[key] = v.slice(0,220); });
    try {
      const stored = JSON.parse(sessionStorage.getItem('nova_attribution_v32') || '{}');
      state.attribution = Object.keys(next).length ? { ...stored, ...next, landing_path: `${location.pathname}${location.search}`, captured_at: new Date().toISOString() } : stored;
      if (Object.keys(next).length) sessionStorage.setItem('nova_attribution_v32', JSON.stringify(state.attribution));
    } catch { state.attribution = next; }
    updateDebug();
  };

  const readPrivacy = () => {
    const cp = window.Shopify?.customerPrivacy;
    if (!cp) { state.privacy = { analytics: false, marketing: false, preferences: false, raw: null }; updateDebug(); return state.privacy; }
    let raw = null;
    try { raw = cp.currentVisitorConsent?.() || null; } catch {}
    const safe = (fn) => { try { return Boolean(fn?.call(cp)); } catch { return false; } };
    state.privacy = {
      analytics: safe(cp.analyticsProcessingAllowed),
      marketing: safe(cp.marketingAllowed),
      preferences: safe(cp.preferencesProcessingAllowed),
      raw
    };
    captureAttribution();
    updateDebug();
    document.dispatchEvent(new CustomEvent('nova:privacy-state', { detail: { ...state.privacy } }));
    return state.privacy;
  };

  const syncDialog = () => {
    if (!dialog) return;
    const raw = state.privacy.raw || {};
    const map = { analytics: state.privacy.analytics, marketing: state.privacy.marketing, preferences: state.privacy.preferences };
    Object.keys(map).forEach(key => {
      const input = qs(`[data-nova-consent="${key}"]`, dialog);
      if (!input) return;
      const explicit = raw[key];
      input.checked = explicit === 'yes' ? true : explicit === 'no' ? false : Boolean(map[key]);
    });
  };

  const loadPrivacy = () => new Promise(resolve => {
    if (!window.Shopify?.loadFeatures) { readPrivacy(); resolve(); return; }
    if (window.Shopify.customerPrivacy) { readPrivacy(); resolve(); return; }
    try {
      window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], () => { readPrivacy(); resolve(); });
    } catch { readPrivacy(); resolve(); }
  });

  const openPrivacy = async () => {
    if (!dialog) return;
    await loadPrivacy();
    syncDialog();
    const status = qs('[data-nova-privacy-status]', dialog); if (status) status.textContent = '';
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
    qs('[data-nova-consent="preferences"]', dialog)?.focus();
  };
  const closePrivacy = () => { if (!dialog) return; if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open'); };

  qsa('[data-nova-privacy-open]').forEach(button => button.addEventListener('click', openPrivacy));
  qsa('[data-nova-privacy-close]').forEach(button => button.addEventListener('click', closePrivacy));
  dialog?.addEventListener('click', event => { if (event.target === dialog) closePrivacy(); });
  dialog?.addEventListener('keydown', event => { if (event.key === 'Escape') closePrivacy(); });
  qs('[data-nova-privacy-save]', dialog || document)?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const status = qs('[data-nova-privacy-status]', dialog);
    const cp = window.Shopify?.customerPrivacy;
    if (!cp?.setTrackingConsent) { if (status) status.textContent = i18n.unavailable || 'Privacy settings are temporarily unavailable.'; return; }
    const consent = {
      preferences: Boolean(qs('[data-nova-consent="preferences"]', dialog)?.checked),
      analytics: Boolean(qs('[data-nova-consent="analytics"]', dialog)?.checked),
      marketing: Boolean(qs('[data-nova-consent="marketing"]', dialog)?.checked)
    };
    button.disabled = true; button.textContent = i18n.saving || 'Saving…';
    try {
      await new Promise(resolve => cp.setTrackingConsent(consent, resolve));
      readPrivacy(); syncDialog();
      if (status) status.textContent = i18n.saved || 'Preferences saved';
      dispatch('consent_updated', { analytics: state.privacy.analytics, marketing: state.privacy.marketing, preferences: state.privacy.preferences });
      window.setTimeout(closePrivacy, 550);
    } catch { if (status) status.textContent = i18n.unavailable || 'Privacy settings are temporarily unavailable.'; }
    finally { button.disabled = false; button.textContent = i18n.save || 'Save preferences'; }
  });

  document.addEventListener('visitorConsentCollected', () => { readPrivacy(); syncDialog(); });

  // Consent-gated storefront intent bridge. Nothing is transmitted by Nova.
  document.addEventListener('click', event => {
    if (!state.privacy.analytics) return;
    const target = event.target.closest('a,button,summary'); if (!target) return;
    if (target.matches('[data-open-drawer="cart"],[href$="/cart"]')) dispatch('cart_open_intent');
    if (target.matches('[name="checkout"],[href*="/checkout"]')) dispatch('checkout_intent');
    const campaign = target.closest('[data-nova-campaign]');
    if (campaign) dispatch('campaign_click', { campaign: campaign.dataset.novaCampaign || '', placement: campaign.dataset.novaPlacement || '' });
  });
  document.addEventListener('submit', event => {
    if (!state.privacy.analytics) return;
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if ((form.action || '').includes('/cart/add')) dispatch('add_to_cart_intent');
    if ((form.action || '').includes('/search') || form.matches('[role="search"]')) dispatch('search_intent');
  });

  // Components publish custom UX outcomes here. These are not replacements for Shopify standard ecommerce events.
  document.addEventListener('nova:measurement', event => {
    if (!state.privacy.analytics) return;
    const name = String(event.detail?.name || '').trim().toLowerCase().replace(/[^a-z0-9_:-]+/g, '_').slice(0, 80);
    if (!name) return;
    dispatch(name, event.detail?.detail || {});
  });

  loadPrivacy().then(() => {
    state.ready = true;
    refreshBridge();
    captureAttribution();
    if (state.privacy.analytics) dispatch('measurement_ready', { pageType: state.context.pageType || '' });
    updateDebug();
  });

  window.NovaMeasurement = {
    getState: () => JSON.parse(JSON.stringify(state)),
    emit: (name, detail = {}) => { if (state.privacy.analytics) dispatch(name, detail); },
    refreshPrivacy: readPrivacy,
    openPrivacyPreferences: openPrivacy
  };
})();
