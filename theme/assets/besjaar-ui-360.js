(() => {
  const initialized = new WeakSet();

  function init360(root) {
    if (!root || initialized.has(root)) return;
    /* Besjaar 11.6: the WeakSet is per-script-execution — if the file is loaded
       twice (section self-load + theme.liquid), a DOM-level flag must prevent
       double-initialization of the same viewer. */
    if (root.dataset.besjaarUi360Ready === 'true') return;
    root.dataset.besjaarUi360Ready = 'true';

    const viewer = root.querySelector('[data-besjaar-ui-360-viewer]');
    const image = root.querySelector('[data-besjaar-ui-360-image]');
    const data = root.querySelector('[data-besjaar-ui-360-frames]');
    if (!viewer || !image || !data) return;

    let frames;
    try {
      frames = JSON.parse(data.textContent || '[]');
    } catch (_) {
      frames = [];
    }
    if (!Array.isArray(frames) || frames.length < 2) return;

    initialized.add(root);

    const previous = root.querySelector('[data-besjaar-ui-360-prev]');
    const next = root.querySelector('[data-besjaar-ui-360-next]');
    const currentNode = root.querySelector('[data-besjaar-ui-360-current]');
    const progress = root.querySelector('[data-besjaar-ui-360-progress]');
    const playButton = root.querySelector('[data-besjaar-ui-360-play]');
    const playLabel = root.querySelector('[data-besjaar-ui-360-play-label]');
    const loadingNode = root.querySelector('[data-besjaar-ui-360-loading]');

    const sensitivity = Math.max(3, Number(root.dataset.dragSensitivity || 7));
    const autoplaySpeed = Math.max(80, Number(root.dataset.autoplaySpeed || 120));
    const autoStartEnabled = root.dataset.autoplay === 'true';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const conserveData = Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType || '');

    let index = 0;
    let dragging = false;
    let pointerId = null;
    let lastX = 0;
    let accumulator = 0;
    let activeSensitivity = sensitivity;
    let timer = null;
    let resumeTimer = null;
    let inView = false;
    let proximityPrimed = false;
    let backgroundWarmStarted = false;
    let userRequestedPlayback = false;
    let autoPlaybackSuppressed = false;
    let renderToken = 0;
    let rafId = null;
    let queuedIndex = null;

    const preloaded = new Set([0]);
    const loading = new Map();

    const normalize = (value) => (value % frames.length + frames.length) % frames.length;

    const setLoading = (value) => {
      root.classList.toggle('is-loading', value);
      if (loadingNode) loadingNode.hidden = !value;
    };

    const preload = (frameIndex) => {
      const normalized = normalize(frameIndex);
      if (preloaded.has(normalized)) return Promise.resolve(normalized);
      if (loading.has(normalized)) return loading.get(normalized);

      const item = frames[normalized];
      if (!item?.url) return Promise.resolve(normalized);

      const promise = new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          const finish = () => {
            preloaded.add(normalized);
            loading.delete(normalized);
            resolve(normalized);
          };
          if (typeof img.decode === 'function') img.decode().catch(() => {}).finally(finish);
          else finish();
        };
        img.onerror = () => {
          loading.delete(normalized);
          resolve(normalized);
        };
        img.src = item.url;
      });

      loading.set(normalized, promise);
      return promise;
    };

    const neighborhood = (center, radius = 2) => {
      const indexes = [];
      for (let distance = 1; distance <= radius; distance += 1) {
        indexes.push(normalize(center + distance), normalize(center - distance));
      }
      return [...new Set(indexes)];
    };

    const preloadNeighborhood = (center, radius = 2) =>
      Promise.all(neighborhood(center, radius).map(preload));

    const warmRemainingFrames = (center) => {
      if (backgroundWarmStarted || conserveData) return;
      backgroundWarmStarted = true;

      const queue = [];
      for (let distance = 1; distance <= Math.ceil(frames.length / 2); distance += 1) {
        queue.push(normalize(center + distance), normalize(center - distance));
      }
      const uniqueQueue = [...new Set(queue)].filter((frameIndex) => !preloaded.has(frameIndex));

      const runBatch = () => {
        if (!uniqueQueue.length) return;
        const batch = uniqueQueue.splice(0, 3);
        Promise.all(batch.map(preload)).finally(scheduleBatch);
      };

      const scheduleBatch = () => {
        if (!uniqueQueue.length) return;
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(runBatch, { timeout: 1200 });
        } else {
          window.setTimeout(runBatch, 160);
        }
      };

      scheduleBatch();
    };

    const updateUi = (targetIndex) => {
      if (currentNode) currentNode.textContent = String(targetIndex + 1);
      if (progress) progress.style.width = `${((targetIndex + 1) / frames.length) * 100}%`;
      viewer.setAttribute('aria-valuenow', String(targetIndex + 1));
      viewer.setAttribute('aria-valuetext', `${targetIndex + 1} / ${frames.length}`);
    };

    const render = async (nextIndex, { prime = true } = {}) => {
      const targetIndex = normalize(nextIndex);
      index = targetIndex;
      updateUi(targetIndex);

      const frame = frames[targetIndex];
      if (!frame?.url) return;

      const token = ++renderToken;
      const ready = preloaded.has(targetIndex);
      if (!ready) setLoading(true);

      if (!ready) await preload(targetIndex);
      if (token !== renderToken) return;

      image.src = frame.url;
      if (frame.alt) image.alt = frame.alt;
      setLoading(false);

      if (prime) preloadNeighborhood(targetIndex, conserveData ? 1 : 2);
    };

    const queueRender = (nextIndex, options) => {
      index = normalize(nextIndex);
      queuedIndex = index;
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        const target = queuedIndex;
        queuedIndex = null;
        rafId = null;
        render(target, options);
      });
    };

    const setPlaybackUi = (playing) => {
      root.classList.toggle('is-autoplaying', playing);
      if (playButton) playButton.setAttribute('aria-pressed', playing ? 'true' : 'false');
      if (playLabel) {
        playLabel.textContent = playing
          ? (playButton?.dataset.pauseLabel || 'Pause')
          : (playButton?.dataset.playLabel || playLabel.textContent);
      }
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
      setPlaybackUi(false);
    };

    const start = ({ manual = false } = {}) => {
      if (timer || !inView || document.hidden) return;
      if (!manual && (!autoStartEnabled || reducedMotion || autoPlaybackSuppressed)) return;

      preloadNeighborhood(index, conserveData ? 1 : 2).then(() => {
        if (timer || !inView || document.hidden) return;
        if (!manual && (!autoStartEnabled || reducedMotion || autoPlaybackSuppressed)) return;
        timer = window.setInterval(() => queueRender(index + 1), autoplaySpeed);
        setPlaybackUi(true);
      });
    };

    const scheduleResume = () => {
      const shouldResume = userRequestedPlayback || (autoStartEnabled && !reducedMotion && !autoPlaybackSuppressed);
      if (!shouldResume) return;
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => start({ manual: userRequestedPlayback }), 900);
    };

    const markInteracted = () => {
      root.classList.add('is-interacted');
      warmRemainingFrames(index);
    };

    viewer.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      pointerId = event.pointerId;
      lastX = event.clientX;
      accumulator = 0;
      activeSensitivity = event.pointerType === 'touch' ? Math.max(4, sensitivity * 0.78) : sensitivity;
      root.classList.add('is-dragging');
      viewer.setPointerCapture?.(event.pointerId);
      stop();
      markInteracted();
      preloadNeighborhood(index, conserveData ? 1 : 3);
    });

    viewer.addEventListener('pointermove', (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      const delta = event.clientX - lastX;
      lastX = event.clientX;
      accumulator += delta;

      if (Math.abs(accumulator) >= activeSensitivity) {
        const steps = Math.trunc(accumulator / activeSensitivity);
        queueRender(index - steps);
        accumulator -= steps * activeSensitivity;
      }
    });

    const release = (event) => {
      if (!dragging || (event && pointerId !== null && event.pointerId !== pointerId)) return;
      dragging = false;
      root.classList.remove('is-dragging');
      if (pointerId !== null) viewer.releasePointerCapture?.(pointerId);
      pointerId = null;
      accumulator = 0;
      scheduleResume();
    };

    viewer.addEventListener('pointerup', release);
    viewer.addEventListener('pointercancel', release);
    viewer.addEventListener('lostpointercapture', release);

    viewer.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        stop();
        markInteracted();
        queueRender(index + (event.key === 'ArrowRight' ? 1 : -1));
        scheduleResume();
      } else if (event.key === 'Home') {
        event.preventDefault();
        stop();
        markInteracted();
        queueRender(0);
        scheduleResume();
      } else if (event.key === 'End') {
        event.preventDefault();
        stop();
        markInteracted();
        queueRender(frames.length - 1);
        scheduleResume();
      }
    });

    previous?.addEventListener('click', () => {
      stop();
      markInteracted();
      queueRender(index - 1);
      scheduleResume();
    });

    next?.addEventListener('click', () => {
      stop();
      markInteracted();
      queueRender(index + 1);
      scheduleResume();
    });

    playButton?.addEventListener('click', () => {
      markInteracted();
      if (timer) {
        userRequestedPlayback = false;
        autoPlaybackSuppressed = true;
        stop();
      } else {
        userRequestedPlayback = true;
        autoPlaybackSuppressed = false;
        start({ manual: true });
      }
    });

    if (playButton) {
      playButton.dataset.playLabel = playLabel?.textContent || 'Play';
      playButton.dataset.pauseLabel = root.getAttribute('data-pause-label') || 'Pause';
    }

    updateUi(0);
    render(0, { prime: false });

    if ('IntersectionObserver' in window) {
      const proximityObserver = new IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (!proximityPrimed) {
          proximityPrimed = true;
          preloadNeighborhood(index, conserveData ? 1 : 2);
        }
        observer.disconnect();
      }, { threshold: 0, rootMargin: '420px 0px' });
      proximityObserver.observe(root);

      const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting && entry.intersectionRatio >= 0.12;
          if (inView) start({ manual: userRequestedPlayback });
          else stop();
        });
      }, { threshold: [0, 0.12, 0.35] });
      visibilityObserver.observe(root);
    } else {
      inView = true;
      window.setTimeout(() => preloadNeighborhood(index, conserveData ? 1 : 2), 250);
      start({ manual: userRequestedPlayback });
    }

    /* Besjaar 11.6: self-removing handler — a section reload in the theme editor
       replaces the viewer's DOM, and the old closure (frames, preloaded images)
       must not stay reachable through a document-level listener forever. */
    const onVisibilityChange = () => {
      if (!root.isConnected) {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        stop();
        return;
      }
      if (document.hidden) stop();
      else if (inView) start({ manual: userRequestedPlayback });
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function initAll(scope = document) {
    scope.querySelectorAll?.('[data-besjaar-ui-360]').forEach(init360);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', (event) => initAll(event.target));
})();
