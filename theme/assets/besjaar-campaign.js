/* Besjaar — BESJAAR WATER WEEK countdown (Nationale Kraanwaterdag 2026).

   Fills every [data-bj-countdown] with the time left until the campaign's end
   instant, which Liquid renders as a Unix timestamp. The element ships hidden
   and is only revealed once there is a real, positive amount of time to show,
   so a visitor with JavaScript off never sees an empty box and the countdown
   can never render a negative value.

   When the deadline passes while the page is open, the countdown stops, hides
   itself, and removes the campaign bar — the same thing the server does on the
   next request. */
(() => {
  'use strict';

  const SECOND = 1000;
  const MINUTE = 60;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  /* Dutch: "dag" is the only word here that inflects. */
  const parts = (secondsLeft) => {
    const days = Math.floor(secondsLeft / DAY);
    const hours = Math.floor((secondsLeft % DAY) / HOUR);
    const minutes = Math.floor((secondsLeft % HOUR) / MINUTE);
    const out = [];
    if (days > 0) out.push(`${days} ${days === 1 ? 'dag' : 'dagen'}`);
    if (days > 0 || hours > 0) out.push(`${hours} uur`);
    out.push(`${minutes} min`);
    return out.join(' ');
  };

  const nodes = Array.from(document.querySelectorAll('[data-bj-countdown]'));
  if (!nodes.length) return;

  const clocks = nodes
    .map((node) => ({ node, endsAt: Number(node.dataset.bjCountdown) * SECOND }))
    .filter((clock) => Number.isFinite(clock.endsAt) && clock.endsAt > 0);
  if (!clocks.length) return;

  let timer = 0;

  const expire = () => {
    window.clearInterval(timer);
    clocks.forEach((clock) => {
      clock.node.hidden = true;
      /* The campaign is over: take the whole bar down rather than leave a
         promotion on screen that the server would no longer render. */
      const banner = clock.node.closest('[data-bj-campaign-banner]');
      if (banner) banner.remove();
    });
  };

  const tick = () => {
    const now = Date.now();
    let anyRunning = false;

    clocks.forEach((clock) => {
      const secondsLeft = Math.floor((clock.endsAt - now) / SECOND);
      if (secondsLeft <= 0) {
        clock.node.hidden = true;
        const banner = clock.node.closest('[data-bj-campaign-banner]');
        if (banner) banner.remove();
        return;
      }
      anyRunning = true;
      const label = clock.node.dataset.bjCountdownLabel || '';
      const value = secondsLeft < MINUTE ? 'minder dan 1 min' : parts(secondsLeft);
      clock.node.textContent = label ? `${label} ${value}` : value;
      clock.node.hidden = false;
    });

    if (!anyRunning) expire();
  };

  tick();
  /* Once a second keeps the minute rollover honest without being wasteful;
     the readout itself only changes once a minute. */
  timer = window.setInterval(tick, SECOND);

  /* A tab restored from the back/forward cache can be hours stale. */
  window.addEventListener('pageshow', tick);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tick();
  });
})();
