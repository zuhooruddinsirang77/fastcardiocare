(function () {
  'use strict';
  if (!document.body.classList.contains('home-page')) return;
  // Observe both inline and cloned stage scenes; stop decoration outside the viewport.
  var cardiacScenes = Array.from(document.querySelectorAll('.scene--cardiac'));
  var cardiacVisibility = new WeakMap();
  function syncCardiacVisibility() {
    cardiacScenes.forEach(function (scene) {
      scene.classList.toggle('is-in-view', !document.hidden && !!cardiacVisibility.get(scene));
    });
  }
  if ('IntersectionObserver' in window) {
    var cardiacObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { cardiacVisibility.set(entry.target, entry.isIntersecting); });
      syncCardiacVisibility();
    }, { threshold: .1 });
    cardiacScenes.forEach(function (scene) { cardiacObserver.observe(scene); });
    document.addEventListener('visibilitychange', syncCardiacVisibility);
  }
  var filters = document.querySelector('[data-home-filters]');
  if (filters) {
    filters.hidden = false;
    var cards = Array.from(document.querySelectorAll('[data-procedure-category]'));
    filters.querySelectorAll('button').forEach(function (button) {
      button.setAttribute('aria-controls', 'home-procedure-results');
      button.addEventListener('click', function () {
        filters.querySelectorAll('button').forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
        var count = 0;
        cards.forEach(function (card) {
          card.hidden = button.dataset.filter !== 'all' && card.dataset.procedureCategory !== button.dataset.filter;
          if (!card.hidden) { count++; card.classList.add('is-visible'); }
        });
        document.querySelector('[data-filter-status]').textContent = count + (count === 1 ? ' procedure shown.' : ' procedures shown.');
      });
    });
  }
  // GIFs switch to real stills when paused, off screen, hidden or reduced motion is requested.
  var images = Array.from(document.querySelectorAll('[data-motion-src]'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var visible = new WeakMap();
  function syncMotion() {
    var paused = reduced.matches || document.hidden || document.body.classList.contains('motion-paused');
    images.forEach(function (img) {
      var scene = img.closest('.scene');
      var inStage = !!img.closest('.stage');
      var activeScene = !scene || (inStage ? scene.classList.contains('is-active') : !scene.closest('.is-staged') && scene.closest('.chapter').classList.contains('is-active'));
      var animate = !paused && visible.get(img) && activeScene;
      var source = animate ? img.dataset.motionSrc : img.dataset.stillSrc;
      if (img.getAttribute('src') !== source) img.setAttribute('src', source);
    });
  }
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible.set(entry.target, entry.isIntersecting); });
      syncMotion();
    }, { threshold: .1 });
    images.forEach(function (img) { observer.observe(img); });
  }
  new MutationObserver(syncMotion).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', syncMotion);
  document.addEventListener('fcc-scene-change', syncMotion);
  if (reduced.addEventListener) reduced.addEventListener('change', syncMotion);
  else reduced.addListener(syncMotion);
  syncMotion();
})();
