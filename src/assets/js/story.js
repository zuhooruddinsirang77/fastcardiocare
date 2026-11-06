/* FastCardioCare — homepage story.
   Chapters become active as they cross the middle of the screen. On wide
   screens each chapter's scene is copied into a pinned stage beside the text;
   on smaller screens (and without JavaScript) scenes stay inline. */
(function () {
  'use strict';
  var story = document.querySelector('[data-story]');
  if (!story) return;

  var chapters = Array.prototype.slice.call(story.querySelectorAll('.chapter'));
  var stageWrap = story.querySelector('.story__stage');
  var stage = stageWrap ? stageWrap.querySelector('.stage') : null;
  var countEl = story.querySelector('[data-stage-count]');
  var titleEl = story.querySelector('[data-stage-title]');
  var barsEl = story.querySelector('[data-stage-bars]');
  var scenes = [];
  var bars = [];

  // Build the stage: one copy of each chapter's scene, plus a progress bar per chapter.
  if (stage) {
    chapters.forEach(function (chapter, i) {
      var source = chapter.querySelector('.scene');
      if (source) {
        var copy = source.cloneNode(true);
        copy.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
        stage.appendChild(copy);
        scenes[i] = copy;
      }
    });
    // Progress as a small ECG trace: one heartbeat per chapter ("beat").
    if (barsEl) {
      var NS = 'http://www.w3.org/2000/svg';
      chapters.forEach(function (chapter, i) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'stage__beat';
        button.setAttribute('aria-label', 'Beat ' + (i + 1) + ': ' + chapter.dataset.title);
        button.setAttribute('aria-controls', chapter.id);
        button.title = chapter.dataset.title;
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'stage__ecg');
        svg.setAttribute('viewBox', '0 0 40 24');
        svg.setAttribute('aria-hidden', 'true');
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', 'M0 14h11l3-5 4 9 5-16 4 18 3-6h10');
        path.setAttribute('pathLength', '1');
        svg.appendChild(path);
        button.appendChild(svg);
        button.addEventListener('click', function () {
          var paused = document.body.classList.contains('motion-paused') || matchMedia('(prefers-reduced-motion: reduce)').matches;
          chapter.scrollIntoView({ behavior: paused ? 'instant' : 'smooth', block: 'center' });
        });
        barsEl.appendChild(button);
        bars.push(path);
      });
    }
  }

  story.classList.add('is-enhanced');

  // Split headings into words so they can be revealed one after another.
  var splitWords = function (el) {
    if (!el || el.getAttribute('data-split')) return;
    var text = el.textContent;
    el.setAttribute('data-split', '1');
    el.setAttribute('aria-label', text.replace(/\s+/g, ' ').trim());
    // Preserve semantic spans, line breaks and spaces when animating words.
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [], node, index = 0;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(function (source) {
      if (!source.textContent.trim()) return;
      var fragment = document.createDocumentFragment();
      source.textContent.match(/\s+|\S+/g).forEach(function (word) {
        if (/^\s+$/.test(word)) { fragment.appendChild(document.createTextNode(word)); return; }
        var outer = document.createElement('span');
        outer.className = 'w';
        outer.setAttribute('aria-hidden', 'true');
        var inner = document.createElement('span');
        inner.textContent = word;
        inner.style.setProperty('--wi', index++);
        outer.appendChild(inner);
        fragment.appendChild(outer);
      });
      source.replaceWith(fragment);
    });
  };
  chapters.forEach(function (c) { splitWords(c.querySelector('h3')); });
  var intro = document.querySelector('.story-intro');
  if (intro) splitWords(intro.querySelector('h2'));

  // Closing sections (procedures preview and the final call to action).
  var finale = Array.prototype.slice.call(document.querySelectorAll('.procedures-section, .conversation-section'));
  finale.forEach(function (section) {
    splitWords(section.querySelector('h2'));
    section.classList.add('is-finale');
    section.querySelectorAll('.proc-mini').forEach(function (card, i) { card.style.setProperty('--ci', i); });
    var band = section.querySelector('.cta-band');
    if (band && !band.querySelector('.band-ecg')) {
      var NSB = 'http://www.w3.org/2000/svg';
      var line = document.createElementNS(NSB, 'svg');
      line.setAttribute('class', 'band-ecg');
      line.setAttribute('viewBox', '0 0 600 120');
      line.setAttribute('preserveAspectRatio', 'none');
      line.setAttribute('aria-hidden', 'true');
      ['band-ecg__line', 'band-ecg__spark'].forEach(function (cls) {
        var path = document.createElementNS(NSB, 'path');
        path.setAttribute('class', cls);
        path.setAttribute('pathLength', '1');
        path.setAttribute('d', 'M0 70h170l18-24 22 50 26-88 26 102 20-54 14 14h304');
        line.appendChild(path);
      });
      band.insertBefore(line, band.firstChild);
    }
  });
  if ('IntersectionObserver' in window) {
    var endSeen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-seen');
        endSeen.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    finale.forEach(function (section) { endSeen.observe(section); });
    // Each procedure card reveals itself as it reaches the screen.
    document.querySelectorAll('.procedures-section .proc-mini').forEach(function (card) { endSeen.observe(card); });
  } else {
    finale.forEach(function (section) { section.classList.add('is-seen'); });
    document.querySelectorAll('.procedures-section .proc-mini').forEach(function (card) { card.classList.add('is-seen'); });
  }

  // Procedures: a faint ECG behind the heading, and a gentle tilt towards the pointer.
  var procSection = document.querySelector('.procedures-section');
  if (procSection) {
    var head = procSection.querySelector('.section-head');
    if (head && !head.querySelector('.proc-ecg')) {
      var NSP = 'http://www.w3.org/2000/svg';
      var ecg = document.createElementNS(NSP, 'svg');
      ecg.setAttribute('class', 'proc-ecg');
      ecg.setAttribute('viewBox', '0 0 600 120');
      ecg.setAttribute('preserveAspectRatio', 'none');
      ecg.setAttribute('aria-hidden', 'true');
      var ep = document.createElementNS(NSP, 'path');
      ep.setAttribute('pathLength', '1');
      ep.setAttribute('d', 'M0 64h190l16-20 18 42 22-76 22 88 18-46 12 12h302');
      ecg.appendChild(ep);
      head.insertBefore(ecg, head.firstChild);
    }
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (fine && !calm) {
      procSection.querySelectorAll('.proc-mini').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
          if (document.body.classList.contains('motion-paused')) return;
          var r = card.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
          card.style.setProperty('--rx', (y * -8).toFixed(2) + 'deg');
          card.classList.add('is-tilting');
        });
        card.addEventListener('pointerleave', function () {
          card.style.removeProperty('--rx');
          card.style.removeProperty('--ry');
          card.classList.remove('is-tilting');
        });
      });
    }
  }

  // A glowing pulse that travels down the reading line (desktop).
  var gridEl = story.querySelector('.story__grid');
  if (gridEl) {
    var pulse = document.createElement('span');
    pulse.className = 'story-pulse';
    pulse.setAttribute('aria-hidden', 'true');
    gridEl.appendChild(pulse);
  }
  // A large, faint beat number behind each scene.
  var beatNum = null;
  if (stage) {
    beatNum = document.createElement('span');
    beatNum.className = 'stage__num';
    beatNum.setAttribute('aria-hidden', 'true');
    stage.insertBefore(beatNum, stage.firstChild);
  }
  story.querySelectorAll('.scene__ecg path').forEach(function (p) { p.setAttribute('pathLength', '1'); });

  var wide = window.matchMedia('(min-width: 960px)');
  // ---------- Mobile / tablet: the story becomes a swipeable slider ----------
  var sliderGrid = story.querySelector('.story__grid');
  var controls = document.createElement('div');
  controls.className = 'story-controls';
  controls.innerHTML =
    '<div class="story-dots" role="group" aria-label="Choose a beat"></div>' +
    '<div class="story-controls__row">' +
      '<p class="story-status" aria-live="polite"><span class="story-status__count"></span><span class="story-status__title"></span></p>' +
      '<div class="story-controls__btns">' +
        '<button type="button" class="story-nav" data-dir="-1" aria-label="Previous beat"><svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></button>' +
        '<button type="button" class="story-nav" data-dir="1" aria-label="Next beat"><svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></button>' +
      '</div>' +
    '</div>';
  var dotsEl = controls.querySelector('.story-dots');
  var statusEl = controls.querySelector('.story-status');
  var statusCount = controls.querySelector('.story-status__count');
  var statusTitle = controls.querySelector('.story-status__title');
  var navPrev = controls.querySelector('[data-dir="-1"]');
  var navNext = controls.querySelector('[data-dir="1"]');
  var dots = chapters.map(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'story-dot';
    b.setAttribute('aria-label', 'Beat ' + (i + 1) + ': ' + (c.getAttribute('data-title') || ''));
    b.addEventListener('click', function () { slideTo(i); });
    dotsEl.appendChild(b);
    return b;
  });
  if (sliderGrid) sliderGrid.parentNode.insertBefore(controls, sliderGrid); // controls sit above the cards
  var smooth = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var activeSlideIndex = 0;
  var measureSlide = function () {
    if (!sliderGrid || !story.classList.contains('is-slider')) return;
    var card = chapters[activeSlideIndex];
    if (!card) return;
    var spacing = getComputedStyle(sliderGrid);
    var height = Math.ceil(card.offsetHeight + parseFloat(spacing.paddingTop) + parseFloat(spacing.paddingBottom));
    if (sliderGrid.style.height !== height + 'px') sliderGrid.style.height = height + 'px';
  };
  var slideTo = function (i) {
    i = Math.max(0, Math.min(chapters.length - 1, i));
    var c = chapters[i];
    var animate = smooth && !document.body.classList.contains('motion-paused') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sliderGrid.scrollTo({ left: c.offsetLeft - (sliderGrid.clientWidth - c.offsetWidth) / 2, behavior: animate ? 'smooth' : 'instant' });
  };
  var markSlide = function (i) {
    activeSlideIndex = i;
    dots.forEach(function (d, j) {
      d.classList.toggle('is-active', j === i);
      d.classList.toggle('is-done', j < i);
      if (j === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
    statusCount.textContent = 'Beat ' + String(i + 1).padStart(2, '0') + ' / ' + String(chapters.length).padStart(2, '0');
    statusTitle.textContent = chapters[i].getAttribute('data-title') || '';
    navPrev.disabled = i === 0;
    navNext.disabled = i === chapters.length - 1;
    measureSlide();
  };
  navPrev.addEventListener('click', function () { slideTo(current - 1); });
  navNext.addEventListener('click', function () { slideTo(current + 1); });
  var slideFrame = 0;
  var onSlide = function () {
    slideFrame = 0;
    if (story.classList.contains('is-staged')) return;
    var mid = sliderGrid.scrollLeft + sliderGrid.clientWidth / 2, nearest = 0, best = Infinity;
    chapters.forEach(function (c, idx) {
      var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < best) { best = d; nearest = idx; }
    });
    activate(nearest);
    markSlide(nearest);
  };
  if (sliderGrid) {
    sliderGrid.addEventListener('scroll', function () { if (!slideFrame) slideFrame = window.requestAnimationFrame(onSlide); }, { passive: true });
    sliderGrid.addEventListener('keydown', function (e) {
      if (story.classList.contains('is-staged')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); slideTo(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); slideTo(current - 1); }
    });
  }
  chapters.forEach(function (c, i) { c.setAttribute('aria-roledescription', 'slide'); c.setAttribute('aria-label', 'Beat ' + (i + 1) + ' of ' + chapters.length); });

  var setStaged = function () {
    story.classList.toggle('is-staged', !!stage && wide.matches);
    var slider = !story.classList.contains('is-staged');
    story.classList.toggle('is-slider', slider);
    if (sliderGrid) {
      if (slider) {
        sliderGrid.setAttribute('tabindex', '0');
        sliderGrid.setAttribute('role', 'region');
        sliderGrid.setAttribute('aria-label', 'Your care journey in seven beats. Swipe, or use the arrow keys.');
        sliderGrid.setAttribute('aria-roledescription', 'carousel');
        window.requestAnimationFrame(onSlide);
      } else {
        sliderGrid.style.removeProperty('height');
        ['tabindex', 'role', 'aria-label', 'aria-roledescription'].forEach(function (a) { sliderGrid.removeAttribute(a); });
      }
    }
  };
  setStaged();
  if (window.ResizeObserver) {
    var slideSize = new ResizeObserver(measureSlide);
    chapters.forEach(function (chapter) { slideSize.observe(chapter); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureSlide);
  if (wide.addEventListener) wide.addEventListener('change', setStaged); else if (wide.addListener) wide.addListener(setStaged);

  var current = -1;
  var activate = function (i) {
    if (i === current || i < 0) return;
    if (stage) {
      stage.setAttribute('data-dir', i >= current ? 'down' : 'up');
      stage.setAttribute('data-beat', String(i + 1));
    }
    current = i;
    chapters.forEach(function (c, j) { c.classList.toggle('is-active', j === i); if (j === i) c.classList.add('was-active'); });
    scenes.forEach(function (s, j) { if (s) s.classList.toggle('is-active', j === i); });
    bars.forEach(function (b, j) {
      b.classList.toggle('is-done', j < i);
      b.classList.toggle('is-current', j === i);
      if (j === i) b.closest('button').setAttribute('aria-current', 'step');
      else b.closest('button').removeAttribute('aria-current');
    });
    if (countEl) {
      countEl.textContent = 'Beat ' + (i + 1) + ' of ' + chapters.length;
      countEl.classList.remove('is-changing');
      void countEl.offsetWidth; // restart the flip animation
      countEl.classList.add('is-changing');
    }
    if (beatNum) {
      beatNum.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      beatNum.classList.remove('is-changing');
      void beatNum.offsetWidth;
      beatNum.classList.add('is-changing');
    }
    if (titleEl) titleEl.textContent = chapters[i].getAttribute('data-title') || '';
    document.dispatchEvent(new Event('fcc-scene-change'));
  };

  if (!('IntersectionObserver' in window)) {
    chapters.forEach(function (c) { c.classList.add('is-seen'); });
    activate(0);
    return;
  }

  // The chapter crossing the middle of the viewport is the active one.
  var focus = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && story.classList.contains('is-staged')) activate(chapters.indexOf(entry.target));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  // Inline scenes animate once, when a good part of the chapter is visible.
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-seen');
      seen.unobserve(entry.target);
    });
  }, { threshold: 0.25 });

  chapters.forEach(function (c) { focus.observe(c); seen.observe(c); });
  if (intro) seen.observe(intro);
  activate(0);

  var grid = story.querySelector('.story__grid');
  var frame = 0;
  var clamp = function (n) { return Math.min(1, Math.max(0, n)); };
  var onScroll = function () {
    frame = 0;
    var vh = window.innerHeight;
    if (grid) {
      var g = grid.getBoundingClientRect();
      story.style.setProperty('--story-progress', clamp((vh * 0.5 - g.top) / Math.max(1, g.height)).toFixed(4));
    }
    // Keep the right beat active even after a big jump (links, keyboard, fast scrolling).
    if (story.classList.contains('is-staged')) {
      var line = vh * 0.5, nearest = 0, best = Infinity;
      chapters.forEach(function (c, idx) {
        var b = c.getBoundingClientRect();
        var d = line < b.top ? b.top - line : (line > b.bottom ? line - b.bottom : 0);
        if (d < best) { best = d; nearest = idx; }
      });
      activate(nearest);
    }
    if (stage && current >= 0) {
      var r = chapters[current].getBoundingClientRect();
      stage.style.setProperty('--scene-p', clamp((vh * 0.5 - r.top) / Math.max(1, r.height)).toFixed(4));
    }
  };
  var schedule = function () { if (!frame) frame = window.requestAnimationFrame(onScroll); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  onScroll();
})();
