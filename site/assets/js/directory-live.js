/* Directory live layer for the hospital network and medical coordinator pages.
   Adds scroll reveals, a live hero, pointer light on cards, animated filter results,
   a sliding role-tab indicator and dialog / save feedback. Styles are in directory-live.css.
   Additive only: network.js still owns filtering, dialogs and saved hospitals.
   With reduced motion, or without JavaScript, everything is visible and works as before. */
(function () {
  'use strict';
  var root = document.querySelector('.hospital-theme, .care-reference');
  if (!root) return;

  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var $ = function (sel, el) { return (el || root).querySelector(sel); };
  var $$ = function (sel, el) { return [].slice.call((el || root).querySelectorAll(sel)); };
  var EASE = 'cubic-bezier(.22, 1, .36, 1)';
  var NS = 'http://www.w3.org/2000/svg';
  var guard = function (fn) { try { fn(); } catch (_) { /* each feature fails on its own */ } };

  /* ---------------- 1. Reveals ---------------- */
  var revealed = [];
  var revealAll = function () { revealed.forEach(function (el) { el.classList.add('dl-in'); }); };

  var splitWords = function (el) {
    if (!el || el.querySelector('.lw')) return;
    var index = 0;
    var walk = function (node) {
      [].slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 1) { walk(child); return; }
        if (child.nodeType !== 3 || !child.nodeValue.trim()) return;
        var frag = document.createDocumentFragment();
        child.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var outer = document.createElement('span');
          outer.className = 'lw';
          var inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--wi', index++);
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        node.replaceChild(frag, child);
      });
    };
    walk(el);
  };

  guard(function () {
    if (!('IntersectionObserver' in window) || reduce.matches) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting && entry.boundingClientRect.bottom >= 0) return;
        var el = entry.target;
        io.unobserve(el);
        el.classList.add('dl-in');
        if (el.getAttribute('data-dl') === 'words') return;
        var delay = parseFloat(el.style.getPropertyValue('--ld')) || 0;
        setTimeout(function () { el.removeAttribute('data-dl'); el.style.removeProperty('--ld'); }, delay + 1100);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });

    var mark = function (selector, kind, delay, step) {
      $$(selector).forEach(function (el, i) {
        if (el.hasAttribute('data-dl') || el.hasAttribute('data-reveal')) return;
        if (kind === 'words') splitWords(el);
        el.setAttribute('data-dl', kind);
        el.style.setProperty('--ld', ((delay || 0) + i * (step === undefined ? 90 : step)) + 'ms');
        revealed.push(el);
        io.observe(el);
      });
    };
    $$('.pro-section-head').forEach(function (head) {
      // motion.js may already fade the whole block; the parts below then simply follow it.
      head.removeAttribute('data-reveal');
      head.classList.add('is-visible');
    });
    mark('.pro-section-head .eyebrow', 'up', 0, 0);
    mark('.pro-section-head h2', 'words', 60, 0);
    mark('.pro-section-head > p', 'left', 180, 0);
    mark('.care-role-tabs', 'up', 0, 0);
    mark('.network-filters', 'up', 80, 0);
    mark('.pro-support-grid > article, .care-reference-support article', 'card');
    mark('.hospital-theme-join, .care-reference-join', 'up', 200, 0);
    body.classList.add('dl-ready');

    body.addEventListener('focusin', function (e) {
      var host = e.target.closest && e.target.closest('[data-dl]');
      if (host) host.classList.add('dl-in');
    });
    window.addEventListener('beforeprint', revealAll);
    window.addEventListener('pageshow', function (e) { if (e.persisted) revealAll(); });
    if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) revealAll(); });
  });

  /* ---------------- 2. Reading progress ---------------- */
  guard(function () {
    if (reduce.matches) return;
    var bar = document.createElement('div');
    bar.className = 'page-progress';
    bar.setAttribute('aria-hidden', 'true');
    body.appendChild(bar);
    var ticking = false;
    var frame = function () {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      bar.style.setProperty('--page-p', Math.min(1, Math.max(0, y / max)).toFixed(4));
      bar.classList.toggle('is-on', y > 24);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    frame();
  });

  /* ---------------- 3. Hero ---------------- */
  guard(function () {
    var hero = $('.proc-hero');
    if (!hero) return;
    hero.classList.add('dl-hero');
    $$('.proc-hero__pulse path', hero).forEach(function (p) { p.setAttribute('pathLength', '1'); });

    // Loops only run while the hero is on screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        hero.classList.toggle('dl-onscreen', entries[0].isIntersecting && !document.hidden);
      }, { threshold: 0.05 }).observe(hero);
    } else hero.classList.add('dl-onscreen');

    var media = $('.proc-hero__media', hero);
    var spot = document.createElement('div');
    spot.className = 'dl-hero-spot';
    spot.setAttribute('aria-hidden', 'true');
    hero.insertBefore(spot, hero.firstChild);
    var frame = 0, px = 0, py = 0;
    hero.addEventListener('pointermove', function (e) {
      if (!fine.matches || e.pointerType === 'touch' || reduce.matches) return;
      px = e.clientX; py = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = 0;
        var r = hero.getBoundingClientRect();
        var nx = (px - r.left) / r.width * 2 - 1, ny = (py - r.top) / r.height * 2 - 1;
        spot.style.setProperty('--sx', (px - r.left).toFixed(0) + 'px');
        spot.style.setProperty('--sy', (py - r.top).toFixed(0) + 'px');
        spot.classList.add('is-on');
        // The photograph leans a few pixels away from the pointer; copy stays put.
        if (media) { media.style.setProperty('--px', (nx * -9).toFixed(2) + 'px'); media.style.setProperty('--py', (ny * -6).toFixed(2) + 'px'); }
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', function () {
      spot.classList.remove('is-on');
      if (media) { media.style.removeProperty('--px'); media.style.removeProperty('--py'); }
    });
  });

  /* ---------------- 4. Cards: pointer light, wave trace, save feedback ---------------- */
  guard(function () {
    var cards = $$('.hospital-card, .coordinator-card, .pro-support-grid > article, .care-reference-support article');
    cards.forEach(function (card) {
      var glow = document.createElement('span');
      glow.className = 'dl-glow';
      glow.setAttribute('aria-hidden', 'true');
      card.insertBefore(glow, card.firstChild);
      card.classList.add('dl-card');
    });
    $$('.hospital-photo-wave path:last-child').forEach(function (p) { p.setAttribute('pathLength', '1'); p.classList.add('dl-wave-trace'); });

    var lit = null, frame = 0, x = 0, y = 0;
    root.addEventListener('pointermove', function (e) {
      if (!fine.matches || e.pointerType === 'touch' || reduce.matches) return;
      var host = e.target.closest && e.target.closest('.dl-card');
      if (host !== lit) {
        if (lit) lit.classList.remove('is-lit');
        lit = host;
        if (lit) lit.classList.add('is-lit');
      }
      if (!lit) return;
      x = e.clientX; y = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = 0;
        if (!lit) return;
        var r = lit.getBoundingClientRect();
        lit.style.setProperty('--mx', (x - r.left).toFixed(0) + 'px');
        lit.style.setProperty('--my', (y - r.top).toFixed(0) + 'px');
      });
    }, { passive: true });
    root.addEventListener('pointerleave', function () { if (lit) { lit.classList.remove('is-lit'); lit = null; } });

    // Saving a hospital: the heart pops and sends out a ring.
    document.addEventListener('click', function (e) {
      var save = e.target.closest && e.target.closest('.hospital-save, .hospital-modal__tool--save');
      if (!save || reduce.matches || !save.animate) return;
      if (save.getAttribute('aria-pressed') !== 'true') return;
      save.animate([{ scale: '1' }, { scale: '1.32' }, { scale: '.92' }, { scale: '1' }], { duration: 480, easing: 'ease-out' });
      var ring = document.createElement('span');
      ring.className = 'dl-save-ring';
      save.appendChild(ring);
      var anim = ring.animate([{ opacity: .8, scale: '.6' }, { opacity: 0, scale: '2.3' }], { duration: 620, easing: 'ease-out' });
      anim.onfinish = anim.oncancel = function () { ring.remove(); };
    });
  });

  /* ---------------- 5. Filters: results animate in, tab indicator slides ---------------- */
  guard(function () {
    var directory = $('[data-network-directory]');
    if (!directory) return;
    var cards = $$('[data-network-card]', directory);
    var wasHidden = new WeakMap();
    cards.forEach(function (card) { wasHidden.set(card, card.hidden); });

    var tabs = document.querySelector('[data-coordinator-tabs]');
    var bar = null;
    var placeBar = function () {
      if (!tabs || !bar) return;
      var active = tabs.querySelector('button[aria-pressed="true"]');
      if (!active || !active.offsetWidth) return;
      bar.style.width = active.offsetWidth + 'px';
      bar.style.translate = active.offsetLeft + 'px 0';
      tabs.classList.add('has-bar');
      // Keep the chosen tab in view on narrow screens without moving the page.
      var left = active.offsetLeft - 16, right = active.offsetLeft + active.offsetWidth + 16;
      if (left < tabs.scrollLeft) tabs.scrollTo({ left: left, behavior: reduce.matches ? 'auto' : 'smooth' });
      else if (right > tabs.scrollLeft + tabs.clientWidth) tabs.scrollTo({ left: right - tabs.clientWidth, behavior: reduce.matches ? 'auto' : 'smooth' });
    };
    if (tabs && tabs.children.length) {
      bar = document.createElement('span');
      bar.className = 'dl-tab-bar';
      bar.setAttribute('aria-hidden', 'true');
      tabs.appendChild(bar);
      placeBar();
      window.addEventListener('resize', placeBar);
      window.addEventListener('load', placeBar);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeBar);
    }

    var count = $('[data-network-count]', directory);
    var queued = false;
    var flush = function () {
      queued = false;
      placeBar();
      var n = 0;
      cards.forEach(function (card) {
        var before = wasHidden.get(card);
        wasHidden.set(card, card.hidden);
        if (card.hidden || !before || reduce.matches || !card.animate) return;
        // Newly shown cards skip the generic scroll fade and arrive together, in order.
        card.removeAttribute('data-reveal');
        card.classList.add('is-visible');
        card.style.transitionDelay = '';
        card.animate(
          [{ opacity: 0, scale: '.94', translate: '0 18px' }, { opacity: 1, scale: '1', translate: '0 0' }],
          { duration: 460, delay: Math.min(n++, 11) * 55, easing: EASE, fill: 'backwards' }
        );
      });
      if (count && n && count.animate && !reduce.matches) {
        count.animate([{ opacity: .3, translate: '0 5px' }, { opacity: 1, translate: '0 0' }], { duration: 300, easing: 'ease-out' });
      }
    };
    var watcher = new MutationObserver(function () { if (!queued) { queued = true; requestAnimationFrame(flush); } });
    cards.forEach(function (card) { watcher.observe(card, { attributes: true, attributeFilter: ['hidden'] }); });
    if (tabs) watcher.observe(tabs, { attributes: true, subtree: true, attributeFilter: ['aria-pressed'] });
  });

  /* ---------------- 6. Closing band: ECG trace and pointer light ---------------- */
  guard(function () {
    var band = $('.conversation-section .cta-band');
    var section = band && band.closest('.conversation-section');
    if (!band) return;
    band.removeAttribute('data-reveal');
    band.classList.add('is-visible');
    var spot = document.createElement('span');
    spot.className = 'dl-band-spot';
    spot.setAttribute('aria-hidden', 'true');
    band.insertBefore(spot, band.firstChild);
    if (!band.querySelector('.band-ecg')) {
      var line = document.createElementNS(NS, 'svg');
      line.setAttribute('class', 'band-ecg');
      line.setAttribute('viewBox', '0 0 600 120');
      line.setAttribute('preserveAspectRatio', 'none');
      line.setAttribute('aria-hidden', 'true');
      ['band-ecg__line', 'band-ecg__spark'].forEach(function (cls) {
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('class', cls);
        path.setAttribute('pathLength', '1');
        path.setAttribute('d', 'M0 70h170l18-24 22 50 26-88 26 102 20-54 14 14h304');
        line.appendChild(path);
      });
      band.insertBefore(line, band.firstChild);
    }
    // The rise, trace and spark are styled in story.css under these two classes.
    section.classList.add('is-finale');
    if ('IntersectionObserver' in window) {
      var once = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting && entries[0].boundingClientRect.bottom >= 0) return;
        section.classList.add('is-seen');
        once.disconnect();
      }, { threshold: 0.25 });
      once.observe(section);
    } else section.classList.add('is-seen');

    var frame = 0, x = 0, y = 0;
    band.addEventListener('pointermove', function (e) {
      if (!fine.matches || e.pointerType === 'touch' || reduce.matches) return;
      x = e.clientX; y = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = 0;
        var r = band.getBoundingClientRect();
        spot.style.setProperty('--mx', (x - r.left).toFixed(0) + 'px');
        spot.style.setProperty('--my', (y - r.top).toFixed(0) + 'px');
        spot.classList.add('is-on');
      });
    }, { passive: true });
    band.addEventListener('pointerleave', function () { spot.classList.remove('is-on'); });
  });
})();
