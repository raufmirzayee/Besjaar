/* Besjaar UI — cookie consent (banner + preference centre).
 * Consent is recorded through Shopify's Customer Privacy API, so the region
 * rules, the storage and the `visitorConsentCollected` event all stay
 * Shopify's responsibility. This file only owns the interface.
 */
(() => {
  const banner = document.querySelector('[data-besjaar-consent-banner]');
  const sheet = document.querySelector('[data-besjaar-ui-privacy-dialog]');

  // The storefront keeps Shopify's own banner as the compliance fallback, so
  // it only stays suppressed while this layer is proven to work.
  const releaseNative = () => document.getElementById('besjaar-consent-native-suppress')?.remove();

  if (!banner && !sheet) {
    releaseNative();
    return;
  }

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const i18n = (window.BesjaarUIConfig || {}).analytics?.i18n || {};
  const measure = (name, detail = {}) =>
    document.dispatchEvent(new CustomEvent('besjaar_ui:measurement', { detail: { name, detail } }));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CATEGORIES = ['preferences', 'analytics', 'marketing'];

  const watchdog = window.setTimeout(releaseNative, 6000);

  const loadPrivacy = () =>
    new Promise((resolve, reject) => {
      const api = () =>
        typeof window.Shopify?.customerPrivacy?.setTrackingConsent === 'function'
          ? window.Shopify.customerPrivacy
          : null;
      const existing = api();
      if (existing) {
        resolve(existing);
        return;
      }
      if (typeof window.Shopify?.loadFeatures !== 'function') {
        reject(new Error('customer-privacy-unavailable'));
        return;
      }
      window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], error => {
        const loaded = api();
        if (error || !loaded) reject(error || new Error('customer-privacy-unavailable'));
        else resolve(loaded);
      });
    });

  /* ------------------------------------------------------------- banner */

  let bannerDismissed = false;

  const showBanner = () => {
    if (!banner || bannerDismissed || !banner.hidden) return;
    banner.hidden = false;
    void banner.offsetWidth; // flush layout so the entry transition actually runs
    banner.classList.add('is-visible');
    window.setTimeout(() => {
      if (!banner.hidden) banner.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 420);
  };

  const hideBanner = () => {
    bannerDismissed = true;
    if (!banner || banner.hidden) return;
    banner.classList.remove('is-visible');
    banner.classList.add('is-leaving');
    const finish = () => {
      banner.hidden = true;
      banner.classList.remove('is-leaving');
    };
    if (reduceMotion) finish();
    else window.setTimeout(finish, 380);
  };

  const setBannerBusy = busy => {
    if (!banner) return;
    qsa('button', banner).forEach(button => {
      button.disabled = busy;
    });
  };

  /* ------------------------------------------------------ writing consent */

  const writeConsent = (api, consent) =>
    new Promise((resolve, reject) => {
      let settled = false;
      const done = (ok, error) => {
        if (settled) return;
        settled = true;
        if (ok) resolve();
        else reject(error || new Error('consent-not-stored'));
      };
      try {
        api.setTrackingConsent(
          {
            preferences: consent.preferences,
            analytics: consent.analytics,
            marketing: consent.marketing
          },
          response => (response && response.error ? done(false, response.error) : done(true))
        );
      } catch (error) {
        done(false, error);
      }
      // Older builds of the API resolve without ever calling back.
      window.setTimeout(() => done(true), 2500);
    });

  const allOf = value => ({ preferences: value, analytics: value, marketing: value });

  /* ------------------------------------------------- preference centre    */

  const sheetInputs = () =>
    sheet ? CATEGORIES.map(key => qs(`[data-besjaar-ui-consent="${key}"]`, sheet)).filter(Boolean) : [];

  const readSheet = () =>
    CATEGORIES.reduce((consent, key) => {
      consent[key] = Boolean(sheet && qs(`[data-besjaar-ui-consent="${key}"]`, sheet)?.checked);
      return consent;
    }, {});

  const fillSheet = (api = null) => {
    if (!sheet) return;
    let stored = null;
    try {
      stored = api?.currentVisitorConsent?.() || null;
    } catch {
      stored = null;
    }
    sheetInputs().forEach(input => {
      const key = input.dataset.besjaarUiConsent;
      const explicit = stored ? stored[key] : undefined;
      if (explicit === 'yes') input.checked = true;
      else if (explicit === 'no') input.checked = false;
    });
  };

  const setSheetStatus = (message, isError = false) => {
    const status = sheet && qs('[data-besjaar-ui-privacy-status]', sheet);
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('is-error', Boolean(isError));
  };

  const closeSheet = () => {
    if (!sheet) return;
    if (typeof sheet.close === 'function') sheet.close();
    else sheet.removeAttribute('open');
  };

  // besjaar-ui-analytics.js owns the dialog whenever the measurement layer is
  // on. Opening through it keeps one source of truth; the guard stops a double
  // showModal(), which throws.
  let opening = false;
  const openSheet = () => {
    if (!sheet || sheet.open || opening) return;
    opening = true;
    window.setTimeout(() => {
      opening = false;
    }, 700);
    const delegate = window.BesjaarUIMeasurement?.openPrivacyPreferences;
    if (typeof delegate === 'function') {
      delegate();
      return;
    }
    setSheetStatus('');
    loadPrivacy()
      .then(api => fillSheet(api))
      .catch(() => {})
      .finally(() => {
        if (sheet.open) return;
        if (typeof sheet.showModal === 'function') sheet.showModal();
        else sheet.setAttribute('open', '');
        qs('[data-besjaar-ui-consent="preferences"]', sheet)?.focus();
      });
  };

  const ownsSheet = typeof window.BesjaarUIMeasurement?.openPrivacyPreferences !== 'function';

  /* --------------------------------------------------------------- wiring */

  loadPrivacy()
    .then(api => {
      window.clearTimeout(watchdog);
      fillSheet(api);

      const submit = (consent, source) => {
        setBannerBusy(true);
        setSheetStatus('');
        writeConsent(api, consent)
          .then(() => {
            measure('consent_updated', { ...consent, source });
            hideBanner();
          })
          .catch(() => {
            setBannerBusy(false);
            setSheetStatus(i18n.unavailable || 'Privacy settings are temporarily unavailable.', true);
          });
      };

      qsa('[data-besjaar-consent-accept]').forEach(button =>
        button.addEventListener('click', () => submit(allOf(true), 'banner'))
      );
      qsa('[data-besjaar-consent-reject]').forEach(button =>
        button.addEventListener('click', () => submit(allOf(false), 'banner'))
      );
      qsa('[data-besjaar-consent-customize]').forEach(button =>
        button.addEventListener('click', openSheet)
      );

      // The sheet's quick actions drive the checkboxes and reuse the existing
      // save button, so there is only ever one save implementation in play.
      const quickAction = value => {
        sheetInputs().forEach(input => {
          input.checked = value;
        });
        const save = sheet && qs('[data-besjaar-ui-privacy-save]', sheet);
        if (save) save.click();
        else submit(allOf(value), 'preference-centre');
      };
      qsa('[data-besjaar-consent-sheet-accept]').forEach(button =>
        button.addEventListener('click', () => quickAction(true))
      );
      qsa('[data-besjaar-consent-sheet-reject]').forEach(button =>
        button.addEventListener('click', () => quickAction(false))
      );

      if (ownsSheet && sheet) {
        qsa('[data-besjaar-ui-privacy-open]').forEach(button => button.addEventListener('click', openSheet));
        qsa('[data-besjaar-ui-privacy-close]', sheet).forEach(button =>
          button.addEventListener('click', closeSheet)
        );
        sheet.addEventListener('click', event => {
          if (event.target === sheet) closeSheet();
        });
        qs('[data-besjaar-ui-privacy-save]', sheet)?.addEventListener('click', event => {
          const button = event.currentTarget;
          const label = button.textContent;
          const consent = readSheet();
          button.disabled = true;
          button.textContent = i18n.saving || 'Saving…';
          writeConsent(api, consent)
            .then(() => {
              setSheetStatus(i18n.saved || 'Preferences saved');
              measure('consent_updated', { ...consent, source: 'preference-centre' });
              hideBanner();
              window.setTimeout(closeSheet, 550);
            })
            .catch(() =>
              setSheetStatus(i18n.unavailable || 'Privacy settings are temporarily unavailable.', true)
            )
            .finally(() => {
              button.disabled = false;
              button.textContent = i18n.save || label;
            });
        });
      }

      const shouldShow =
        typeof api.shouldShowBanner === 'function'
          ? api.shouldShowBanner()
          : !CATEGORIES.some(key => {
              try {
                return api.currentVisitorConsent?.()?.[key];
              } catch {
                return false;
              }
            });

      if (shouldShow) showBanner();
    })
    .catch(() => {
      window.clearTimeout(watchdog);
      releaseNative();
    });

  // Fires for every successful setTrackingConsent, including saves made from
  // the preference centre by besjaar-ui-analytics.js.
  document.addEventListener('visitorConsentCollected', () => {
    hideBanner();
    fillSheet(window.Shopify?.customerPrivacy || null);
  });

  window.BesjaarConsent = {
    open: openSheet,
    close: closeSheet,
    acceptAll: () => qs('[data-besjaar-consent-accept]')?.click(),
    rejectAll: () => qs('[data-besjaar-consent-reject]')?.click()
  };
})();
