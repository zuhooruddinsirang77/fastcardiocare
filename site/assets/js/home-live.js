/* Home live layer: scroll reveals, word-by-word headings and the interactive pieces of the homepage
   (hero links and heart, journey progress and swipe, procedure filters and tilt, destination panels, CTA light).
   Additive and decorative: without JavaScript, with reduced motion, or with "Pause motion" on,
   every element is visible and every control still works. Styles live in home-live.css. */
(function () {
  'use strict';
  var body = document.body;
  if (!body.classList.contains('home-page')) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var paused = function () { return reduce.matches || body.classList.contains('motion-paused'); };
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); };
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  var EASE = 'cubic-bezier(.22, 1, .36, 1)';
  var NS = 'http://www.w3.org/2000/svg';
  var guard = function (fn) { try { fn(); } catch (_) { /* each feature fails on its own */ } };

  /* ------------------------------------------------------------------ */
  /* 1. Reveals                                                          */
  /* ------------------------------------------------------------------ */
  var revealed = [];
  var revealAll = function () {
    revealed.forEach(function (el) { el.classList.add('live-in'); });
  };

  // Wrap each word so a heading can rise line by line from behind a mask. Child elements are kept.
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
        // Anything already scrolled past (reload mid-page, #anchor) is shown straight away.
        if (!entry.isIntersecting && entry.boundingClientRect.bottom >= 0) return;
        io.unobserve(entry.target);
        // A clipped element reports no visible area of its own, so those are triggered by their parent.
        var el = proxies.get(entry.target) || entry.target;
        el.classList.add('live-in');
        if (el.getAttribute('data-live') === 'words') return;
        // Hand the element back to its own hover transitions once the entrance has played.
        var delay = parseFloat(el.style.getPropertyValue('--ld')) || 0;
        setTimeout(function () { el.removeAttribute('data-live'); el.style.removeProperty('--ld'); }, delay + 1100);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -8% 0px' });

    var proxies = new WeakMap();
    var mark = function (target, kind, delay) {
      var list = typeof target === 'string' ? $$(target) : [].concat(target || []);
      list.forEach(function (el, i) {
        if (!el || el.hasAttribute('data-live')) return;
        if (kind === 'words') splitWords(el);
        el.setAttribute('data-live', kind);
        el.style.setProperty('--ld', ((delay || 0) + i * 90) + 'ms');
        revealed.push(el);
        if (kind === 'wipe' && el.parentElement) { proxies.set(el.parentElement, el); io.observe(el.parentElement); }
        else io.observe(el);
      });
    };

    // Journey intro
    mark('.story-intro__heading .eyebrow', 'up');
    mark('.story-intro__heading h2', 'words', 80);
    mark('.story-intro__copy', 'rule');
    mark('.story-intro__copy > p:not(.story-intro__note)', 'left', 150);
    mark('.story-intro__note', 'pop', 320);
    // Journey stepper
    mark('.stepper__nav > li', 'pop');
    mark('.stepper__panel:not([hidden]), .stepper__controls', 'up', 200);
    // Procedures
    mark('.procedures-section .section-head .eyebrow', 'up');
    mark('.procedures-section .section-head h2', 'words', 60);
    mark('.procedures-section .section-head > p:not(.eyebrow)', 'up', 180);
    mark('.procedure-filters', 'up', 100);
    mark('.procedures-section .proc-mini', 'card');
    mark('.procedures-section__all', 'up');
    // Network
    mark('.home-network__copy .eyebrow', 'up');
    mark('.home-network__copy h2', 'words', 60);
    mark('.home-network__copy > p:not(.eyebrow)', 'up', 200);
    mark('.home-network__places', 'wipe', 120);
    mark('.home-net-card', 'card');

    body.classList.add('live-ready');

    body.addEventListener('focusin', function (e) {
      var host = e.target.closest && e.target.closest('[data-live]');
      if (host) host.classList.add('live-in');
    });
    window.addEventListener('beforeprint', revealAll);
    window.addEventListener('pageshow', function (e) { if (e.persisted) revealAll(); });
  });

  /* Sections know when they are on screen, so endless loops only run while visible. */
  guard(function () {
    var sections = $$('main > section');
    if (!('IntersectionObserver' in window)) { sections.forEach(function (s) { s.classList.add('live-onscreen'); }); return; }
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle('live-onscreen', entry.isIntersecting); });
    }, { threshold: 0.05 });
    sections.forEach(function (s) { seen.observe(s); });
  });

  /* ------------------------------------------------------------------ */
  /* 2. Hero: links from the heart to the three cards, pointer light,    */
  /*    and a heart that answers a click                                 */
  /* ------------------------------------------------------------------ */
  guard(function () {
    var hero = $('.hero');
    var art = hero && $('.hero__art', hero);
    var heart = art && art.querySelector(':scope > img');
    if (!art || !heart) return;
    var chips = $$('.hero__chip', art);

    // Curved links, drawn under the heart and the cards.
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'hero-links');
    svg.setAttribute('aria-hidden', 'true');
    var links = chips.map(function (chip, i) {
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'hero-link hero-link--' + (i + 1));
      ['hero-link__base', 'hero-link__pulse'].forEach(function (cls) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('class', cls);
        p.setAttribute('pathLength', '1');
        g.appendChild(p);
      });
      svg.appendChild(g);
      chip.addEventListener('pointerenter', function () { g.classList.add('is-hot'); art.classList.add('has-hot-chip'); });
      chip.addEventListener('pointerleave', function () { g.classList.remove('is-hot'); art.classList.remove('has-hot-chip'); });
      return g;
    });
    art.insertBefore(svg, art.firstChild);

    var drawLinks = function () {
      var w = art.clientWidth, h = art.clientHeight;
      if (!w || !h || !heart.offsetWidth) return;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      var cx = heart.offsetLeft + heart.offsetWidth * 0.56;
      var cy = heart.offsetTop + heart.offsetHeight * 0.5;
      chips.forEach(function (chip, i) {
        var ex = chip.offsetLeft + 14;
        var ey = chip.offsetTop + chip.offsetHeight / 2;
        var sy = cy + (ey - cy) * 0.3;
        var dx = Math.max(40, ex - cx);
        var d = 'M' + cx.toFixed(1) + ' ' + sy.toFixed(1) +
          ' C' + (cx + dx * 0.55).toFixed(1) + ' ' + sy.toFixed(1) + ' ' +
          (ex - dx * 0.45).toFixed(1) + ' ' + ey.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
        $$('path', links[i]).forEach(function (p) { p.setAttribute('d', d); });
      });
    };
    drawLinks();
    if (!heart.complete) heart.addEventListener('load', drawLinks);
    window.addEventListener('load', drawLinks);
    window.addEventListener('resize', drawLinks);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawLinks);

    // A click or tap on the heart: one stronger beat and a ring.
    heart.addEventListener('pointerdown', function () {
      if (paused() || !heart.animate) return;
      heart.animate(
        [{ scale: '1' }, { scale: '1.07' }, { scale: '.975' }, { scale: '1.03' }, { scale: '1' }],
        { duration: 620, easing: 'ease-out' }
      );
      var ring = document.createElement('span');
      ring.className = 'heart-burst';
      art.appendChild(ring);
      var anim = ring.animate(
        [{ opacity: .7, scale: '.45' }, { opacity: 0, scale: '1.35' }],
        { duration: 900, easing: 'cubic-bezier(.2, .6, .3, 1)' }
      );
      anim.onfinish = anim.oncancel = function () { ring.remove(); };
    });

    // Soft light that follows the pointer across the hero.
    var spot = document.createElement('div');
    spot.className = 'hero-spot';
    spot.setAttribute('aria-hidden', 'true');
    hero.insertBefore(spot, hero.firstChild);
    var frame = 0, px = 0, py = 0;
    hero.addEventListener('pointermove', function (e) {
      if (!fine.matches || e.pointerType === 'touch' || paused()) return;
      px = e.clientX; py = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = 0;
        var r = hero.getBoundingClientRect();
        spot.style.setProperty('--sx', (px - r.left).toFixed(0) + 'px');
        spot.style.setProperty('--sy', (py - r.top).toFixed(0) + 'px');
        spot.classList.add('is-on');
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { spot.classList.remove('is-on'); });
  });

  /* ------------------------------------------------------------------ */
  /* 3. Journey stepper: progress line, direction, swipe, live trace     */
  /* ------------------------------------------------------------------ */
  guard(function () {
    var root = $('[data-stepper]');
    if (!root) return;
    var tabs = $$('[role="tab"]', root);
    var nav = $('.stepper__nav', root);
    if (tabs.length < 2 || !nav) return;
    var last = tabs.length - 1;
    var current = 0;
    var indexNow = function () {
      for (var i = 0; i < tabs.length; i++) if (tabs[i].getAttribute('aria-selected') === 'true') return i;
      return 0;
    };
    var setFill = function (p) { nav.style.setProperty('--step-p', clamp(p, 0, 1).toFixed(4)); };

    var ticking = false;
    var onScroll = function () {
      ticking = false;
      if (!root.classList.contains('is-scroll')) return;
      // Same geometry as stepper.js: half a screen of scroll per step.
      var stepPx = Math.round(window.innerHeight * 0.5);
      var y = -root.getBoundingClientRect().top;
      setFill(y / stepPx / last);
    };
    var sync = function () {
      var next = indexNow();
      if (next !== current) root.setAttribute('data-dir', next > current ? 'next' : 'prev');
      current = next;
      nav.classList.toggle('is-scrolling', root.classList.contains('is-scroll'));
      if (root.classList.contains('is-scroll')) onScroll(); else setFill(current / last);
    };
    var watcher = new MutationObserver(sync);
    tabs.forEach(function (tab) { watcher.observe(tab, { attributes: true, attributeFilter: ['aria-selected'] }); });
    watcher.observe(root, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', sync);
    current = indexNow();
    nav.classList.add('has-fill');
    sync();

    // Swipe left / right on touch screens.
    var startX = 0, startY = 0, tracking = false;
    root.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || !e.target.closest('.stepper__panel')) { tracking = false; return; }
      tracking = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX, dy = t.clientY - startY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      var btn = $('.stepper__panel:not([hidden]) ' + (dx < 0 ? '[data-step-next]' : '[data-step-prev]'), root);
      if (btn && !btn.disabled) btn.click();
    }, { passive: true });

    // Step 1: the ECG behind the heart gets a travelling signal over a faint baseline.
    $$('.step-ecg path', root).forEach(function (signal) {
      signal.setAttribute('pathLength', '1');
      var base = signal.cloneNode(false);
      base.setAttribute('class', 'step-ecg__base');
      signal.setAttribute('class', 'step-ecg__signal');
      signal.parentNode.insertBefore(base, signal);
    });
  });

  /* ------------------------------------------------------------------ */
  /* 4. Procedures: sliding filter pill, animated results, pointer tilt  */
  /* ------------------------------------------------------------------ */
  guard(function () {
    var filters = $('[data-home-filters]');
    var cards = $$('.procedures-section .proc-mini');
    if (filters) {
      var buttons = $$('button', filters);
      var pill = document.createElement('span');
      pill.className = 'filter-pill';
      pill.setAttribute('aria-hidden', 'true');
      filters.insertBefore(pill, filters.firstChild);
      var placePill = function () {
        var active = $('button[aria-pressed="true"]', filters);
        if (!active || !active.offsetWidth) return;
        pill.style.width = active.offsetWidth + 'px';
        pill.style.height = active.offsetHeight + 'px';
        pill.style.translate = active.offsetLeft + 'px ' + active.offsetTop + 'px';
        filters.classList.add('has-pill');
      };
      buttons.forEach(function (button) {
        // Runs after home-interactive.js has shown / hidden the cards.
        button.addEventListener('click', function () {
          placePill();
          if (paused()) return;
          var n = 0;
          cards.forEach(function (card) {
            if (card.hidden || !card.animate) return;
            card.classList.add('live-in');
            card.animate(
              [{ opacity: 0, scale: '.94', translate: '0 16px' }, { opacity: 1, scale: '1', translate: '0 0' }],
              { duration: 480, delay: n++ * 70, easing: EASE, fill: 'backwards' }
            );
          });
        });
      });
      placePill();
      window.addEventListener('resize', placePill);
      window.addEventListener('load', placePill);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePill);
    }

    cards.forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        if (!fine.matches || e.pointerType === 'touch' || paused()) return;
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (y * -7).toFixed(2) + 'deg');
        card.classList.add('is-tilting');
      }, { passive: true });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-tilting');
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* 5. Network: destination panels open on hover / tap and take turns   */
  /* ------------------------------------------------------------------ */
  guard(function () {
    var wrap = $('.home-network__places');
    var section = $('.home-network');
    if (!wrap || !section) return;
    var places = $$('.home-place', wrap);
    if (places.length < 2) return;
    var active = 0, held = false, timer = 0;
    var show = function (i) {
      active = (i + places.length) % places.length;
      places.forEach(function (p, k) { p.classList.toggle('is-active', k === active); });
    };
    var tick = function () {
      if (held || paused() || document.hidden || !section.classList.contains('live-onscreen')) return;
      show(active + 1);
    };
    places.forEach(function (place, i) {
      place.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') { held = true; show(i); } });
      place.addEventListener('click', function () { show(i); held = true; setTimeout(function () { held = false; }, 6000); });
    });
    wrap.addEventListener('pointerleave', function () { held = false; });
    wrap.classList.add('is-live');
    show(0);
    timer = window.setInterval(tick, 3400);
    if (reduce.matches) window.clearInterval(timer);
  });

  /* ------------------------------------------------------------------ */
  /* 6. Pointer light on the network cards and the closing band          */
  /* ------------------------------------------------------------------ */
  guard(function () {
    var band = $('.conversation-section .cta-band');
    var section = band && band.closest('.conversation-section');
    if (band) {
      var spot = document.createElement('span');
      spot.className = 'live-spot';
      spot.setAttribute('aria-hidden', 'true');
      band.insertBefore(spot, band.firstChild);
      // The band's rise, ECG trace and travelling spark are styled in story.css; switch them on here.
      if (!$('.band-ecg', band)) {
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
      section.classList.add('is-finale');
      if ('IntersectionObserver' in window) {
        var once = new IntersectionObserver(function (entries) {
          if (!entries[0].isIntersecting && entries[0].boundingClientRect.bottom >= 0) return;
          section.classList.add('is-seen');
          once.disconnect();
        }, { threshold: 0.25 });
        once.observe(section);
      } else section.classList.add('is-seen');
    }

    var lit = null, frame = 0, x = 0, y = 0;
    document.addEventListener('pointermove', function (e) {
      if (!fine.matches || e.pointerType === 'touch' || paused()) return;
      var host = e.target.closest && e.target.closest('.home-net-card, .cta-band, .stepper__panel');
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
  });

  /* Pausing motion (or the OS setting changing) shows everything at once. */
  guard(function () {
    new MutationObserver(function () { if (paused()) revealAll(); })
      .observe(body, { attributes: true, attributeFilter: ['class'] });
    if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) revealAll(); });
  });
})();
