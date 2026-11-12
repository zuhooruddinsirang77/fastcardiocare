/* Packages page: filter the "at a glance" cards by cost category. */
(function () {
  var root = document.querySelector('[data-pkg-filter]');
  if (!root) return;
  var tabs = root.querySelectorAll('.pkg-tab');
  var cards = root.querySelectorAll('[data-cat]');
  var treatment = document.getElementById('pkg-treatment');
  var destination = document.getElementById('pkg-destination');
  var activeFilter = 'all';
  var activeCard = null;

  function apply(filter) {
    activeFilter = filter;
    var count = 0;
    tabs.forEach(function (tab) {
      tab.setAttribute('aria-pressed', String(tab.dataset.filter === filter));
    });
    cards.forEach(function (card) {
      var cat = card.dataset.cat;
      // "All Packages" shows the treatment packages; every other filter shows its own category.
      var matchesCategory = filter === 'all' ? cat === 'procedures' : cat === filter;
      var matchesTreatment = cat !== 'procedures' || treatment.value === 'all' || card.dataset.treatment === treatment.value;
      card.hidden = !(matchesCategory && matchesTreatment);
      if (!card.hidden) count++;
    });
    root.querySelector('.pkg-finder-status').textContent = count + (count === 1 ? ' option to explore' : ' options to explore') + (destination.value ? ' · Preferred destination: ' + destination.value : ' · Choose a destination when you are ready') + '. Availability and pricing require provider confirmation.';
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { apply(tab.dataset.filter); });
  });
  treatment.addEventListener('change', function () { apply('procedures'); });
  destination.addEventListener('change', function () { apply(activeFilter); });
  root.querySelector('.pkg-finder-reset').addEventListener('click', function () {
    treatment.value = 'all'; destination.value = ''; apply('all');
  });
  apply('all');

  var dialog = document.querySelector('.pkg-dialog');
  if (!dialog) return;
  root.querySelectorAll('[data-pkg-details]').forEach(function (button) {
    button.addEventListener('click', function () {
      var card = button.closest('.pkg-card');
      activeCard = card;
      dialog.querySelector('#pkg-dialog-title').textContent = card.querySelector('h3').textContent;
      var content = dialog.querySelector('.pkg-dialog__content');
      content.replaceChildren(card.querySelector('.pkg-checks').cloneNode(true), card.querySelector('[data-pkg-description]').content.cloneNode(true));
      dialog.showModal();
    });
  });
  dialog.querySelector('.pkg-dialog-choose').addEventListener('click', function () {
    if (!activeCard) return;
    treatment.value = activeCard.dataset.treatment;
    apply('procedures');
    dialog.close();
    treatment.focus();
  });
  dialog.querySelector('.pkg-dialog__close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    var rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
})();

/* Explore practical costs and move through the estimate guide. */
(function () {
  var guide = document.querySelector('.pkg-step-guide');
  if (!guide) return;
  var buttons = Array.from(document.querySelectorAll('.pkg-step-select'));
  var panels = Array.from(guide.querySelectorAll('.pkg-step-panel'));
  var back = guide.querySelector('.pkg-guide-back');
  var next = guide.querySelector('.pkg-guide-next');
  var enquiry = guide.querySelector('.pkg-guide-enquire');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var panelAnimation;
  var current = 0;
  function select(index) {
    var changed = current !== index;
    current = index;
    buttons.forEach(function (button, i) {
      button.setAttribute('aria-expanded', String(i === index));
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.closest('li').classList.toggle('is-selected', i === index);
    });
    if (panelAnimation) panelAnimation.cancel();
    panels.forEach(function (panel, i) { panel.hidden = i !== index; });
    guide.querySelector('.pkg-step-progress').textContent = 'Step ' + (index + 1) + ' of ' + panels.length;
    guide.style.setProperty('--guide-progress', ((index + 1) / panels.length * 100) + '%');
    guide.querySelector('.pkg-guide-upnext').textContent = index < panels.length - 1
      ? 'Up next: ' + buttons[index + 1].textContent : 'Ready when you are';
    if (changed && !reduceMotion.matches && panels[index].animate) {
      panelAnimation = panels[index].animate([
        { opacity: 0, transform: 'translateY(7px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 230, easing: 'ease-out' });
    }
    back.disabled = index === 0;
    next.hidden = index === panels.length - 1;
    enquiry.hidden = index !== panels.length - 1;
  }
  buttons.forEach(function (button, index) {
    button.addEventListener('click', function () { select(index); });
    button.addEventListener('keydown', function (event) {
      var target = index;
      if (event.key === 'ArrowRight') target = (index + 1) % buttons.length;
      else if (event.key === 'ArrowLeft') target = (index + buttons.length - 1) % buttons.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = buttons.length - 1;
      else return;
      event.preventDefault(); select(target); buttons[target].focus();
    });
  });
  back.addEventListener('click', function () {
    select(Math.max(0, current - 1));
    if (back.disabled) buttons[current].focus();
  });
  next.addEventListener('click', function () {
    select(Math.min(panels.length - 1, current + 1));
    if (next.hidden) enquiry.focus();
  });
  select(0);
})();

/* Native disclosure controls retain keyboard and no-JavaScript support. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.pkg-faq details, .pkg-travel-detail').forEach(function (detail) {
    detail.addEventListener('toggle', function () {
      var answer = detail.querySelector('p');
      if (!detail.open || !answer || reduced.matches || !answer.animate) return;
      answer.animate([{ opacity: 0, transform: 'translateY(-4px)' },
        { opacity: 1, transform: 'translateY(0)' }], { duration: 200, easing: 'ease-out' });
    });
  });
})();

/* A local review checklist and a downloadable enquiry preparation note. */
(function () {
  var checks = Array.from(document.querySelectorAll('.pkg-review-check'));
  if (!checks.length) return;
  var progress = document.querySelector('.pkg-review-progress');
  var status = document.getElementById('pkg-review-status');
  function update() {
    var count = checks.filter(function (input) { return input.checked; }).length;
    progress.value = count;
    status.textContent = count + ' of ' + checks.length + ' estimate items reviewed' + (count === checks.length ? ' - checklist complete' : '');
  }
  checks.forEach(function (input) { input.addEventListener('change', update); });
  document.querySelector('.pkg-review-reset').addEventListener('click', function () {
    checks.forEach(function (input) { input.checked = false; });
    update();
  });
  document.querySelector('.pkg-plan-download').addEventListener('click', function () {
    var treatment = document.getElementById('pkg-treatment');
    var destination = document.getElementById('pkg-destination');
    var lines = [
      'FastCardioCare - Enquiry preparation checklist',
      '',
      'Treatment interest: ' + treatment.options[treatment.selectedIndex].text,
      'Preferred destination: ' + (destination.value || 'Still exploring'),
      '',
      'Review your written quotation:'
    ];
    checks.forEach(function (input) {
      var label = input.closest('label');
      lines.push((input.checked ? '[Reviewed] ' : '[To review] ') + label.querySelector('strong').textContent + ': ' + label.querySelector('div > span').textContent);
    });
    lines.push('', 'Practical costs to confirm separately:', 'Flights and visa requirements; transfers; accommodation; companion arrangements; coordination fees.', '', 'This is a preparation checklist, not a medical assessment or a price quotation. Confirm treatment suitability, scope, availability, exclusions and final pricing with the treating provider.', '', 'No form has been submitted. This file was prepared locally in your browser.');
    var blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url; link.download = 'fastcardiocare-enquiry-checklist.txt';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    document.querySelector('.pkg-download-status').textContent = 'Your checklist download has started. No enquiry has been submitted.';
  });
  update();
})();
