/* MSIT landing page — progressive enhancement only.
   Everything readable works with JS disabled; panels simply stay open. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- nav */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var links = document.getElementById('navlinks');

  function setNavTop() {
    if (nav) links.style.setProperty('--navtop', nav.getBoundingClientRect().bottom + 'px');
  }

  function closeMenu() {
    if (!burger) return;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    links.classList.remove('is-open');
  }

  if (burger) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      if (open) { closeMenu(); return; }
      setNavTop();
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close menu');
      links.classList.add('is-open');
    });

    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        burger.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) closeMenu();
      else setNavTop();
    });
  }

  /* shadow on the sticky bar once the page has moved */
  var stickycta = document.getElementById('stickycta');
  var hero = document.querySelector('.hero');

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('nav--scrolled', y > 8);
    if (stickycta && hero) {
      var past = y > hero.offsetHeight * 0.7;
      var atForm = isFormInView();
      stickycta.hidden = !past || atForm;
    }
  }

  function isFormInView() {
    var apply = document.getElementById('apply');
    if (!apply) return false;
    var r = apply.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------- accordions */
  function panelOf(btn) {
    return document.getElementById(btn.getAttribute('aria-controls'));
  }

  function openPanel(btn, animate) {
    var panel = panelOf(btn);
    if (!panel) return;
    btn.setAttribute('aria-expanded', 'true');
    var target = panel.firstElementChild.offsetHeight;
    if (!animate || reduced) { panel.style.height = 'auto'; return; }
    panel.style.height = target + 'px';
    panel.addEventListener('transitionend', function done(e) {
      if (e.propertyName !== 'height') return;
      panel.removeEventListener('transitionend', done);
      if (btn.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
    });
  }

  function closePanel(btn, animate) {
    var panel = panelOf(btn);
    if (!panel) return;
    btn.setAttribute('aria-expanded', 'false');
    if (!animate || reduced) { panel.style.height = '0px'; return; }
    panel.style.height = panel.firstElementChild.offsetHeight + 'px';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { panel.style.height = '0px'; });
    });
  }

  document.querySelectorAll('[data-accordion]').forEach(function (group) {
    var btns = group.querySelectorAll('button[aria-controls]');

    btns.forEach(function (btn) {
      if (btn.getAttribute('aria-expanded') === 'true') openPanel(btn, false);
      else closePanel(btn, false);

      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        if (isOpen) { closePanel(btn, true); return; }
        /* one panel at a time keeps long lists scannable */
        btns.forEach(function (other) {
          if (other !== btn && other.getAttribute('aria-expanded') === 'true') closePanel(other, true);
        });
        openPanel(btn, true);
      });
    });
  });

  /* --------------------------------------------------------- tabs */
  var tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
        if (next < 0 || next >= tabs.length) return;
        e.preventDefault();
        tabs[next].focus();
        select(tabs[next]);
      });
    });
  }

  /* ---------------------------------------------------- scroll spy */
  var navAnchors = Array.prototype.slice.call(
    document.querySelectorAll('.nav__links a[href^="#"]:not(.nav__cta)')
  );
  var watched = navAnchors
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && watched.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navAnchors.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    watched.forEach(function (s) { spy.observe(s); });
  }

  /* --------------------------------------------------------- form */
  var form = document.getElementById('applyform');
  if (!form) return;

  var done = document.getElementById('formdone');

  function fieldOf(el) { return el.closest('.field'); }
  function errBox(el) { return form.querySelector('[data-err-for="' + el.id + '"]'); }

  function setError(el, msg) {
    var f = fieldOf(el);
    var box = errBox(el);
    if (f) f.classList.toggle('is-bad', !!msg);
    if (box) box.textContent = msg || '';
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function validate(el) {
    var v = (el.value || '').trim();

    if (el.type === 'checkbox') {
      if (!el.checked) return 'Please agree before sending your enquiry.';
      return '';
    }
    if (!v && el.required) {
      if (el.tagName === 'SELECT') return 'Choose the option that fits you best.';
      return 'This field is required.';
    }
    if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      return 'Check the email address — we could not read it.';
    }
    if (el.type === 'tel' && v && !/^[+()\-\s0-9]{6,}$/.test(v)) {
      return 'Use digits, spaces and + only.';
    }
    return '';
  }

  var fields = Array.prototype.slice.call(
    form.querySelectorAll('input[required], select[required], input[type="tel"]')
  );

  fields.forEach(function (el) {
    var ev = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(ev, function () { setError(el, validate(el)); });
    el.addEventListener('input', function () {
      if (fieldOf(el) && fieldOf(el).classList.contains('is-bad')) setError(el, validate(el));
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;

    fields.forEach(function (el) {
      var msg = validate(el);
      setError(el, msg);
      if (msg && !firstBad) firstBad = el;
    });

    if (firstBad) { firstBad.focus(); return; }

    /* No back end wired up yet — post to your CRM or form endpoint here. */
    form.querySelectorAll('.field').forEach(function (f) { f.hidden = true; });
    if (done) {
      done.hidden = false;
      done.focus && done.focus();
    }
  });
})();
