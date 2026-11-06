/* Home flair: drives the decorative motion in home-flair.css.
   Purely additive. If anything here fails, the page is unchanged. */
(function () {
  'use strict';
  var body = document.body;
  if (!body.classList.contains('home-page')) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;
  var hero = document.querySelector('.hero');
  var art = hero && hero.querySelector('.hero__art');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var paused = function () { return body.classList.contains('motion-paused') || reduce.matches; };
  try {
    /* ---- scroll: progress hairline + hero depth ---- */
    var bar = document.createElement('div');
    bar.className = 'page-progress';
    bar.setAttribute('aria-hidden', 'true');
    body.appendChild(bar);
    var heroBottom = 0, ticking = false;
    var measure = function () { heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 0; };
    var frame = function () {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      bar.style.setProperty('--page-p', Math.min(1, Math.max(0, y / max)).toFixed(4));
      bar.classList.toggle('is-on', y > 24);
      if (hero && y < heroBottom + 200) hero.style.setProperty('--hp', Math.min(y, 520).toFixed(1));
    };
    var onScroll = function () { if (!ticking) { ticking = true; window.requestAnimationFrame(frame); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); placeRing(); onScroll(); });
    window.addEventListener('load', function () { measure(); placeRing(); onScroll(); });

    /* ---- sonar ring is centred on the heart image, whatever the breakpoint ---- */
    var placeRing = function () {
      if (!art) return;
      var img = art.querySelector(':scope > img');
      if (!img) return;
      var a = art.getBoundingClientRect(), b = img.getBoundingClientRect();
      if (!a.width || !a.height) return;
      art.style.setProperty('--ring-x', ((b.left + b.width / 2 - a.left) / a.width * 100).toFixed(2) + '%');
      art.style.setProperty('--ring-y', ((b.top + b.height / 2 - a.top) / a.height * 100).toFixed(2) + '%');
    };
    if (art) { var heart = art.querySelector(':scope > img'); if (heart && !heart.complete) heart.addEventListener('load', placeRing); }
    measure(); placeRing(); onScroll();

    if (!finePointer.matches) return;

    /* ---- pointer light on the trust bar and procedure cards ---- */
    var lit = null, litFrame = 0, litX = 0, litY = 0;
    var paintLight = function () {
      litFrame = 0;
      if (!lit) return;
      var r = lit.getBoundingClientRect();
      lit.style.setProperty('--mx', (litX - r.left).toFixed(0) + 'px');
      lit.style.setProperty('--my', (litY - r.top).toFixed(0) + 'px');
    };
    var lightSel = '.reassurance, .procedures-section .proc-mini';
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || paused()) return;
      var host = e.target.closest && e.target.closest(lightSel);
      if (host !== lit) {
        if (lit) lit.classList.remove('is-lit');
        lit = host;
        if (lit) lit.classList.add('is-lit');
      }
      if (!lit) return;
      litX = e.clientX; litY = e.clientY;
      if (!litFrame) litFrame = window.requestAnimationFrame(paintLight);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { if (lit) { lit.classList.remove('is-lit'); lit = null; } });

    /* ---- magnetic buttons (pull of at most 6px, only while the pointer is on the button) ---- */
    var magnets = [].slice.call(document.querySelectorAll('.hero__actions .btn, .cta-band__actions .btn, .procedures-section__all .btn'));
    var settle = function (btn) { btn.style.removeProperty('--mag-x'); btn.style.removeProperty('--mag-y'); };
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || paused()) return;
      magnets.forEach(function (btn) {
        var r = btn.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > window.innerHeight) return;
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        var near = Math.abs(dx) < r.width / 2 && Math.abs(dy) < r.height / 2;
        if (!near) { if (btn.style.getPropertyValue('--mag-x')) settle(btn); return; }
        btn.style.setProperty('--mag-x', Math.max(-6, Math.min(6, dx * .06)).toFixed(2) + 'px');
        btn.style.setProperty('--mag-y', Math.max(-4, Math.min(4, dy * .1)).toFixed(2) + 'px');
      });
    }, { passive: true });
    magnets.forEach(function (btn) { btn.addEventListener('pointerleave', function () { settle(btn); }); });

    /* ---- pinned journey scene: slight depth toward the pointer ---- */
    var stage = document.querySelector('.story .stage');
    if (stage) {
      var stageFrame = 0, sx = 0, sy = 0;
      stage.addEventListener('pointermove', function (e) {
        if (paused()) return;
        var r = stage.getBoundingClientRect();
        sx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1));
        sy = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1));
        if (stageFrame) return;
        stageFrame = window.requestAnimationFrame(function () {
          stageFrame = 0;
          stage.style.setProperty('--sx', sx.toFixed(3));
          stage.style.setProperty('--sy', sy.toFixed(3));
        });
      }, { passive: true });
      stage.addEventListener('pointerleave', function () { stage.style.removeProperty('--sx'); stage.style.removeProperty('--sy'); });
    }
  } catch (_) { /* decorative only */ }
})();
