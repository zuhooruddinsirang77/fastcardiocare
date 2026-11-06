/* FastCardioCare — motion and small interactions (no dependencies).
   Everything here is progressive: without JavaScript, or with reduced motion,
   all content is visible and every control still works. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var page = doc.getAttribute('data-page') || '';
  var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };

  /* ---------- Back-to-top control ---------- */
  var topBtn = document.createElement('button');
  topBtn.type = 'button';
  topBtn.className = 'back-to-top';
  topBtn.setAttribute('aria-label', 'Back to top');
  topBtn.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg>';
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var skip = document.querySelector('.brand');
    if (skip) skip.focus({ preventScroll: true });
  });
  document.body.appendChild(topBtn);

  /* ---------- How it works: timeline progress ---------- */
  var steps = document.querySelector('.steps');
  var stepItems = steps ? Array.prototype.slice.call(steps.querySelectorAll('.step')) : [];
  // The bar sits beside the list (not inside it), so the list's own
  // :last-child styling and valid <ol> markup are unaffected.
  var track = steps ? steps.parentElement : null;
  var bar = null;
  var placeBar = function () {
    if (!bar || stepItems.length < 2) return;
    var first = stepItems[0].querySelector('.step__marker');
    var last = stepItems[stepItems.length - 1].querySelector('.step__marker');
    if (!first || !last) return;
    var base = track.getBoundingClientRect();
    var a = first.getBoundingClientRect();
    var b = last.getBoundingClientRect();
    bar.style.left = (a.left + a.width / 2 - base.left) + 'px';
    bar.style.top = (a.top + a.height / 2 - base.top) + 'px';
    bar.style.height = Math.max(0, (b.top + b.height / 2) - (a.top + a.height / 2)) + 'px';
  };
  if (steps && stepItems.length > 1) {
    steps.classList.add('has-progress');
    bar = document.createElement('span');
    bar.className = 'steps-progress';
    bar.setAttribute('aria-hidden', 'true');
    if (getComputedStyle(track).position === 'static') track.style.position = 'relative';
    track.insertBefore(bar, steps);
    placeBar();
  }
  var updateTimeline = function () {
    if (!bar) return;
    var anchor = window.innerHeight * 0.62;
    var top = parseFloat(bar.style.top) + track.getBoundingClientRect().top;
    var height = parseFloat(bar.style.height) || 1;
    var p = Math.min(1, Math.max(0, (anchor - top) / height));
    bar.style.setProperty('--progress', p.toFixed(3));
    stepItems.forEach(function (li) {
      var m = li.querySelector('.step__marker');
      if (!m) return;
      var r = m.getBoundingClientRect();
      li.classList.toggle('is-reached', r.top + r.height / 2 <= anchor + 1);
    });
  };

  /* ---------- Scroll-driven state (throttled) ---------- */
  var header = document.querySelector('.site-header');
  var ticking = false;
  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    raf(function () {
      var y = window.pageYOffset || doc.scrollTop;
      if (header) header.classList.toggle('is-scrolled', y > 12);
      topBtn.classList.toggle('is-visible', y > 700);
      updateTimeline();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { placeBar(); onScroll(); });
  window.addEventListener('load', function () { placeBar(); onScroll(); });
  onScroll();

  /* ---------- How it works: personal checklist (nothing stored or sent) ---------- */
  document.querySelectorAll('[data-ask-list]').forEach(function (list) {
    var boxes = list.querySelectorAll('input[type="checkbox"]');
    var count = list.querySelector('[data-ask-count]');
    var reset = list.querySelector('[data-ask-reset]');
    var update = function () {
      var n = 0;
      boxes.forEach(function (b) { if (b.checked) n++; });
      if (count) count.textContent = n + ' of ' + boxes.length + ' asked for';
      if (reset) reset.hidden = n === 0;
    };
    list.addEventListener('change', update);
    if (reset) reset.addEventListener('click', function () {
      boxes.forEach(function (b) { b.checked = false; });
      update();
      if (boxes[0]) boxes[0].focus();
    });
    update();
  });

  /* ---------- FAQ: smooth accordion height ---------- */
  if (!reduce && Element.prototype.animate) {
    document.querySelectorAll('details.faq').forEach(function (d) {
      var summary = d.querySelector('summary');
      var body = d.querySelector('.faq__body');
      if (!summary || !body) return;
      var running = null;
      summary.addEventListener('click', function (e) {
        e.preventDefault();
        if (running) running.cancel();
        var opening = !d.open;
        if (opening) d.open = true;
        var full = body.scrollHeight;
        body.style.overflow = 'hidden';
        running = body.animate(
          opening
            ? [{ height: '0px', opacity: 0 }, { height: full + 'px', opacity: 1 }]
            : [{ height: full + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: opening ? 280 : 220, easing: 'cubic-bezier(.2,.7,.2,1)' }
        );
        var done = function () {
          if (!opening) d.open = false;
          body.style.overflow = '';
          running = null;
        };
        running.onfinish = done;
        running.oncancel = function () { body.style.overflow = ''; };
      });
    });
  }

  if (reduce) return;

  /* ---------- ECG line draw ---------- */
  var ecgPaths = [];
  document.querySelectorAll('.hero-ecg, .why-hero__ecg, .reference-ecg, .footer-waves__ecg').forEach(function (el) {
    if (page === 'home' && el.closest('.hero')) return; // home-motion.js owns its synchronized heartbeat
    var paths = el.tagName.toLowerCase() === 'path' ? [el] : Array.prototype.slice.call(el.querySelectorAll('path, polyline'));
    paths.forEach(function (p) {
      if (!p.getTotalLength) return;
      p.setAttribute('pathLength', '1');
      p.classList.add('ecg-draw');
      ecgPaths.push(p);
    });
  });

  /* ---------- Section and card reveals ---------- */
  if (!('IntersectionObserver' in window)) {
    ecgPaths.forEach(function (p) { p.classList.add('is-drawn'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      observer.unobserve(el);
      if (el.classList.contains('ecg-draw')) { el.classList.add('is-drawn'); return; }
      el.classList.add('is-revealing', 'is-visible');
      var clear = function () {
        el.classList.remove('is-revealing');
        el.style.transitionDelay = '';
        el.removeEventListener('transitionend', clear);
      };
      el.addEventListener('transitionend', clear);
      setTimeout(clear, 1400);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  ecgPaths.forEach(function (p) { observer.observe(p); });

  if (page === 'procedures' || page === 'home') return; // these pages manage their own presentation

  var selector = [
    '.section-head', '.card', '.tile', '.mini-step', '.step', '.focus-item', '.proc-mini',
    '.faq', '.cta-band', '.reassurance li', '.aside-card', '.form-card', '.dl-grid',
    '.note', '.handover-card', '[class*="-card"]'
  ].map(function (s) { return 'main ' + s; }).join(',');

  var viewportBottom = window.innerHeight;
  var groups = new Map();
  document.querySelectorAll(selector).forEach(function (el) {
    // Skip the hero (it has its own entrance), nested matches and anything already on screen.
    if (el.closest('.hero, .about-hero, .why-hero, .service-hero, .page-hero')) return;
    if (el.parentElement && el.parentElement.closest('[data-reveal]')) return;
    if (el.getBoundingClientRect().top < viewportBottom * 0.92) return;
    el.setAttribute('data-reveal', '');
    var parent = el.parentElement;
    var i = groups.get(parent) || 0;
    groups.set(parent, i + 1);
    el.style.transitionDelay = Math.min(i, 5) * 80 + 'ms';
    observer.observe(el);
  });
})();
