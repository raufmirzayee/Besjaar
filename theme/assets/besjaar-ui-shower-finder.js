/* Besjaar UI 5.7 — product-page shower model finder */
(() => {
  const roots = [...document.querySelectorAll('[data-shower-finder]')];
  const finderLinks = [...document.querySelectorAll('a[href="#besjaar-model-finder"]')];
  if (!roots.length) {
    finderLinks.forEach((link) => { link.hidden = true; });
    return;
  }

  finderLinks.forEach((link) => { link.hidden = false; });
  roots.forEach((root) => {
    if (root.dataset.finderReady === 'true') return;
    root.dataset.finderReady = 'true';
    const questions = [...root.querySelectorAll('[data-finder-question]')];
    const cards = [...root.querySelectorAll('[data-finder-model]')];
    const status = root.querySelector('[data-finder-status]');
    const reset = root.querySelector('[data-finder-reset]');
    const resultCard = root.querySelector('[data-finder-result-card]');
    const resultMedia = root.querySelector('[data-finder-result-media]');
    const resultImage = root.querySelector('[data-finder-result-image]');
    const resultTitle = root.querySelector('[data-finder-result-title]');
    const resultBestFor = root.querySelector('[data-finder-result-best-for]');
    const resultFacts = root.querySelector('[data-finder-result-facts]');
    const resultPrice = root.querySelector('[data-finder-result-price]');
    const resultLink = root.querySelector('[data-finder-result-link]');
    if (!cards.length) return;

    const labels = {
      default: status?.textContent || '',
      match: root.dataset.matchLabel || '',
    };
    const state = { hose: 'any', filter: 'any', priority: 'any' };

    const boolScore = (wanted, actual, weight) => {
      if (wanted === 'any') return 0;
      return String(actual) === String(wanted === 'yes') ? weight : -weight * 1.35;
    };

    const rank = () => {
      let best = null;
      let bestScore = -Infinity;
      cards.forEach((card, index) => {
        const spray = Number(card.dataset.modelSpray || 0);
        let score = 0;
        score += boolScore(state.hose, card.dataset.modelHose, 5);
        score += boolScore(state.filter, card.dataset.modelFilter, 6);
        if (state.priority === 'versatile') score += Math.min(6, spray || 0);
        if (state.priority === 'simple') score += spray > 0 ? Math.max(0, 6 - Math.min(6, spray)) : 1;
        if (card.classList.contains('is-current')) score += 0.15;
        score -= index * 0.001;
        card.dataset.finderScore = score.toFixed(3);
        card.classList.remove('is-best-match');
        const badge = card.querySelector('[data-finder-match]');
        if (badge) badge.hidden = true;
        if (score > bestScore) { bestScore = score; best = card; }
      });

      const hasChoice = Object.values(state).some(value => value !== 'any');
      if (hasChoice && best) {
        best.classList.add('is-best-match');
        const badge = best.querySelector('[data-finder-match]');
        if (badge) badge.hidden = false;
        const title = best.dataset.modelTitle || best.querySelector('h3')?.textContent?.trim() || '';
        if (status) status.textContent = `${status.dataset.matchPrefix || ''}${title}`.trim() || title;

        if (resultCard) {
          resultCard.hidden = false;
          if (resultTitle) resultTitle.textContent = title;
          if (resultPrice) resultPrice.textContent = best.dataset.modelPrice || '';
          if (resultLink) resultLink.href = best.dataset.modelUrl || '#';
          const bestFor = best.dataset.modelBestFor || '';
          if (resultBestFor) {
            resultBestFor.textContent = bestFor;
            resultBestFor.hidden = !bestFor;
          }
          const facts = [...best.querySelectorAll('.besjaar-ui-shower-model-card__facts span')].map(item => item.textContent.trim()).filter(Boolean);
          if (resultFacts) {
            resultFacts.replaceChildren(...facts.map(text => {
              const span = document.createElement('span');
              span.textContent = text;
              return span;
            }));
          }
          const image = best.dataset.modelImage || '';
          if (resultImage && resultMedia) {
            resultImage.src = image;
            resultImage.alt = title;
            resultMedia.hidden = !image;
          }
        }

        root.dispatchEvent(new CustomEvent('besjaar_ui:finder-result', { bubbles: true, detail: { modelId: best.dataset.modelId || '', title, ...state } }));
      } else {
        if (status) status.textContent = labels.default;
        if (resultCard) resultCard.hidden = true;
      }
    };

    questions.forEach((question) => {
      question.querySelectorAll('[data-finder-choice]').forEach((button) => {
        button.addEventListener('click', () => {
          const key = question.dataset.finderQuestion;
          const value = button.dataset.finderChoice || 'any';
          state[key] = value;
          question.querySelectorAll('[data-finder-choice]').forEach((choice) => {
            const active = choice === button;
            choice.classList.toggle('is-active', active);
            choice.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
          rank();
          window.BesjaarUIMeasurement?.emit?.('product_finder_choice', { question: key, value });
        });
      });
    });

    reset?.addEventListener('click', () => {
      Object.keys(state).forEach(key => { state[key] = 'any'; });
      questions.forEach((question) => {
        question.querySelectorAll('[data-finder-choice]').forEach((choice) => {
          const active = choice.dataset.finderChoice === 'any';
          choice.classList.toggle('is-active', active);
          choice.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      });
      rank();
      window.BesjaarUIMeasurement?.emit?.('product_finder_reset');
    });

    root.addEventListener('click', (event) => {
      const link = event.target.closest('.besjaar-ui-shower-model-card__footer a');
      if (!link) return;
      const card = link.closest('[data-finder-model]');
      window.BesjaarUIMeasurement?.emit?.('product_finder_model_click', {
        modelId: card?.dataset.modelId || '',
        bestMatch: Boolean(card?.classList.contains('is-best-match'))
      });
    });

    rank();
  });
})();

/* Story engagement measurement: consent-gated through BesjaarUIMeasurement. */
(() => {
  const story = document.querySelector('[data-story-section]');
  if (!story || story.dataset.storyMeasurementReady === 'true' || !('IntersectionObserver' in window)) return;
  story.dataset.storyMeasurementReady = 'true';
  let seen = false;
  const observer = new IntersectionObserver((entries) => {
    if (seen) return;
    const entry = entries.find((item) => item.isIntersecting && item.intersectionRatio >= 0.35);
    if (!entry) return;
    seen = true;
    window.BesjaarUIMeasurement?.emit?.('product_story_view');
    observer.disconnect();
  }, { threshold: [0.35] });
  observer.observe(story);

  const video = story.querySelector('[data-story-video] video');
  video?.addEventListener('play', () => window.BesjaarUIMeasurement?.emit?.('product_story_video_play'), { once: true });
})();
