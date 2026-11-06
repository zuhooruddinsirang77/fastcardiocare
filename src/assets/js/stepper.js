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

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { show(i, false, true); });
    tab.addEventListener('keydown', function (e) {
      var k = e.key, to = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') to = (current + 1) % tabs.length;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (current - 1 + tabs.length) % tabs.length;
      else if (k === 'Home') to = 0;
      else if (k === 'End') to = tabs.length - 1;
      if (to < 0) return;
      e.preventDefault();
      show(to, true, true);
    });
  });
  if (prev) prev.addEventListener('click', function () { show(current - 1, false, true); });
  if (next) next.addEventListener('click', function () { show(current + 1, false, true); });

  // Open the step named in the URL (#step-3), otherwise start at step 1.
  var hash = /^#step-(\d)$/.exec(location.hash);
  show(hash ? parseInt(hash[1], 10) - 1 : 0, false, false);
  root.classList.add('is-enhanced');
})();
