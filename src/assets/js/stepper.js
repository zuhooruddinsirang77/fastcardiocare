/* Home care-journey stepper: one step at a time, with tabs, Previous/Next and arrow keys. */
(function () {
  'use strict';
  var root = document.querySelector('[data-stepper]');
  if (!root) return;
  var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
  var panels = [].slice.call(root.querySelectorAll('[role="tabpanel"]'));
  var prev = root.querySelector('[data-step-prev]');
  var next = root.querySelector('[data-step-next]');
  var count = root.querySelector('[data-step-count]');
  if (!tabs.length || tabs.length !== panels.length) return;
  var current = 0;

  var show = function (index, focusTab, userAction) {
    index = Math.max(0, Math.min(tabs.length - 1, index));
    current = index;
    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      tab.classList.toggle('is-done', i < index);
    });
    panels.forEach(function (panel, i) {
      var on = i === index;
      panel.hidden = !on;
      panel.classList.toggle('is-entering', on && !!userAction);
    });
    if (count) count.textContent = 'Step ' + (index + 1) + ' of ' + tabs.length;
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === tabs.length - 1;
    if (focusTab) tabs[index].focus();
  };

  // Scroll mode: the section pins while the page scrolls, and scroll position picks the step.
  var scrollMode = false, stepPx = 0, rootTop = 0;
  var goTo = function (i, focusTab) {
    i = Math.max(0, Math.min(tabs.length - 1, i));
    if (scrollMode) {
      window.scrollTo({ top: rootTop + i * stepPx + stepPx * 0.2, behavior: 'instant' });
      show(i, focusTab, true);
    } else show(i, focusTab, true);
  };

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { goTo(i, false); });
    tab.addEventListener('keydown', function (e) {
      var k = e.key, to = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') to = (current + 1) % tabs.length;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (current - 1 + tabs.length) % tabs.length;
      else if (k === 'Home') to = 0;
      else if (k === 'End') to = tabs.length - 1;
      if (to < 0) return;
      e.preventDefault();
      goTo(to, true);
    });
  });
  if (prev) prev.addEventListener('click', function () { goTo(current - 1, false); });
  if (next) next.addEventListener('click', function () { goTo(current + 1, false); });


  var box = root.querySelector('.container');
  var header = document.querySelector('.site-header');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ticking = false;

  var measure = function () {
    // Tallest step decides the pinned height, so the card never jumps while scrolling.
    var keep = current, tallest = 0, tallPanel = 0;
    box.style.minHeight = '';
    root.style.removeProperty('--panel-h');
    panels.forEach(function (panel, i) {
      panel.hidden = false;
      for (var k = 0; k < panels.length; k++) if (k !== i) panels[k].hidden = true;
      tallest = Math.max(tallest, box.offsetHeight);
      tallPanel = Math.max(tallPanel, panel.offsetHeight);
    });
    panels.forEach(function (panel, i) { panel.hidden = i !== keep; });
    root.style.setProperty('--panel-h', tallPanel + 'px');
    return tallest;
  };

  var layout = function () {
    var top = (header ? header.offsetHeight : 70) + 14;
    var boxH = measure();
    var fits = boxH + top + 14 <= window.innerHeight && !reduce.matches && window.innerWidth >= 900;
    if (!fits) {
      if (scrollMode) { scrollMode = false; root.classList.remove('is-scroll'); root.style.height = ''; box.style.minHeight = ''; box.style.top = ''; }
      return;
    }
    scrollMode = true;
    root.classList.add('is-scroll');
    stepPx = Math.round(window.innerHeight * 0.5);
    box.style.minHeight = boxH + 'px';
    box.style.top = top + 'px';
    root.style.height = (boxH + (tabs.length - 1) * stepPx + Math.round(stepPx * 0.6)) + 'px';
    rootTop = root.getBoundingClientRect().top + window.pageYOffset;
    onScroll();
  };

  var onScroll = function () {
    ticking = false;
    if (!scrollMode) return;
    var y = window.pageYOffset - rootTop;
    var idx = Math.max(0, Math.min(tabs.length - 1, Math.floor(y / stepPx)));
    if (idx !== current) show(idx, false, true);
  };
  window.addEventListener('scroll', function () { if (scrollMode && !ticking) { ticking = true; window.requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', function () { layout(); });
  window.addEventListener('load', layout);
  if (reduce.addEventListener) reduce.addEventListener('change', layout);

  // Open the step named in the URL (#step-3), otherwise start at step 1.
  var hash = /^#step-(\d)$/.exec(location.hash);
  show(hash ? parseInt(hash[1], 10) - 1 : 0, false, false);
  root.classList.add('is-enhanced');
  layout();
  if (hash && scrollMode) goTo(parseInt(hash[1], 10) - 1, false);
})();
