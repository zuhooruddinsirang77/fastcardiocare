/* Homepage animation enhancement, with static and reduced-motion fallbacks. */
(function () {
  'use strict';
  var body = document.body;
  if (!body.classList.contains('home-page')) return;
  var hero = document.querySelector('.hero');
  if (!hero || !window.IntersectionObserver) return;
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pausedByUser = false;
  try { pausedByUser = localStorage.getItem('fcc-motion-paused') === 'true'; } catch (_) {}
  var heroVisible = true;
  var art = hero.querySelector('.hero__art');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var pointerFrame = 0;
  var pointerX = 0;
  var pointerY = 0;
  var resetPointer = function () {
    window.cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    art.style.removeProperty('--art-x');
    art.style.removeProperty('--art-y');
  };
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'motion-toggle';
  button.innerHTML = '<span class="motion-toggle__icon" aria-hidden="true"></span><span class="motion-toggle__label"></span>';
  (hero.querySelector('.hero__strip-inner') || hero.querySelector('.container')).appendChild(button);
  var targets = [];
  var revealObserver;
  var update = function () {
    var paused = pausedByUser || preference.matches;
    body.classList.toggle('motion-paused', paused);
    if (paused) body.classList.add('motion-intro-complete');
    body.classList.toggle('hero-motion-active', !paused && heroVisible && !document.hidden);
    if (paused || !heroVisible || document.hidden) resetPointer();
    button.setAttribute('aria-pressed', String(paused));
    button.querySelector('.motion-toggle__label').textContent = preference.matches ? 'Reduced motion' : (paused ? 'Resume motion' : 'Pause motion');
    button.disabled = preference.matches;
    button.title = preference.matches ? 'Following your device’s reduced-motion preference' : 'Pause or resume decorative animations';
    if (paused) targets.forEach(function (el) { el.classList.add('is-visible'); });
  };
  try {
    var ecg = hero.querySelector('.hero-ecg');
    var signal = ecg && ecg.querySelector('path');
    if (signal) {
      signal.setAttribute('pathLength', '1');
      signal.classList.add('hero-ecg__signal');
      var baseline = signal.cloneNode(false);
      baseline.classList.remove('hero-ecg__signal');
      baseline.classList.add('hero-ecg__baseline');
      ecg.insertBefore(baseline, signal);
    }
    hero.querySelector('.hero__art').addEventListener('animationend', function (event) {
      if (event.target === this && event.animationName === 'home-enter-art') body.classList.add('motion-intro-complete');
    });
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -20px 0px' });
    var groups = [
      '.reassurance li', '.focus-portrait', '.focus-layout .section-head', '.focus-item',
      '.procedures-section .section-head', '.procedures-section .proc-mini',
      '.process-section .section-head', '.mini-step', '.conversation-section .cta-band'
    ];
    groups.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el, index) {
        el.classList.add('motion-reveal');
        el.style.setProperty('--reveal-delay', Math.min(index * 65, 195) + 'ms');
        // Anything already above the fold is never held waiting for an observer.
        if (el.getBoundingClientRect().top < window.innerHeight - 30) el.classList.add('is-visible');
        else revealObserver.observe(el);
        targets.push(el);
      });
    });
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      update();
    }, { threshold: .02 }).observe(hero);
    // Move only the decorative artwork; copy and controls keep their positions.
    art.addEventListener('pointermove', function (event) {
      if (!finePointer.matches || event.pointerType === 'touch' || preference.matches ||
          pausedByUser || !heroVisible || document.hidden) return;
      var bounds = art.getBoundingClientRect();
      pointerX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)) * 5;
      pointerY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)) * 4;
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(function () {
        pointerFrame = 0;
        art.style.setProperty('--art-x', pointerX.toFixed(2) + 'px');
        art.style.setProperty('--art-y', pointerY.toFixed(2) + 'px');
      });
    });
    art.addEventListener('pointerleave', resetPointer);
    if (finePointer.addEventListener) finePointer.addEventListener('change', resetPointer);
    button.addEventListener('click', function () {
      pausedByUser = !pausedByUser;
      try { localStorage.setItem('fcc-motion-paused', String(pausedByUser)); } catch (_) {}
      update();
    });
    if (preference.addEventListener) preference.addEventListener('change', update);
    else preference.addListener(update);
    document.addEventListener('visibilitychange', update);
    // Keyboard navigation must never focus a concealed card or link.
    body.addEventListener('focusin', function (event) {
      var target = event.target.closest('.motion-reveal');
      if (target) target.classList.add('is-visible');
    });
    window.addEventListener('beforeprint', function () { targets.forEach(function (el) { el.classList.add('is-visible'); }); });
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) targets.forEach(function (el) { el.classList.add('is-visible'); });
    });
    update();
    body.classList.add('motion-ready');
  } catch (_) {
    body.classList.remove('motion-ready');
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    button.remove();
  }
})();
