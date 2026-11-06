/* Local topic filters; no queries or form values leave the browser. */
(function () {
  'use strict';
  var enquiry = document.getElementById('enquiry-form');
  if (enquiry && !enquiry.getAttribute('data-endpoint')) {
    var preview = document.getElementById('form-preview-note');
    if (preview) preview.hidden = false;
    var success = document.getElementById('form-success');
    if (success) {
      success.querySelector('h2').textContent = 'Preview complete.';
      success.querySelector('p').textContent = 'Your example enquiry passed the form checks. This preview has not sent or stored your details.';
    }
  }
  document.querySelectorAll('[data-filter-controls]').forEach(function (controls) {
    var type = controls.getAttribute('data-filter-controls');
    var list = document.querySelector('[data-filter-list="' + type + '"]');
    if (!list) return;
    var items = Array.from(list.children);
    var buttons = controls.querySelectorAll('[data-filter]');
    var search = type === 'faqs' ? document.getElementById('faq-search') : null;
    var count = document.getElementById(type === 'faqs' ? 'faq-count' : 'procedure-count');
    var empty = document.getElementById('faq-empty');
    var clear = document.getElementById('faq-clear');
    var selected = 'all';
    var update = function () {
      var query = search ? search.value.trim().toLocaleLowerCase() : '';
      var visible = 0;
      items.forEach(function (item) {
        var matches = (selected === 'all' || item.dataset.category === selected) && (!query || item.textContent.toLocaleLowerCase().includes(query));
        item.hidden = !matches;
        if (matches) visible++;
      });
      buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.filter === selected)); });
      if (count) count.textContent = visible + ' ' + (type === 'faqs' ? (visible === 1 ? 'question' : 'questions') : (visible === 1 ? 'procedure guide' : 'procedure guides')) + (query ? ' found' : ' to explore');
      if (empty && type === 'faqs') empty.hidden = visible !== 0;
      if (clear) clear.hidden = !query;
    };
    buttons.forEach(function (button) { button.addEventListener('click', function () { selected = button.dataset.filter; update(); }); });
    if (search) search.addEventListener('input', update);
    if (clear) clear.addEventListener('click', function () { search.value = ''; update(); search.focus(); });
    var reset = document.getElementById('faq-reset');
    if (reset && type === 'faqs') reset.addEventListener('click', function () { selected = 'all'; search.value = ''; update(); search.focus(); });
    update();
  });

  /* ---------- Procedure library ----------
     Topic, type and text filters run locally. "Read more" opens the guide in a dialog;
     without JavaScript (or <dialog> support) each card expands in place instead.
     Nothing about which guide is opened is tracked: it could reveal a health interest. */
  var grid = document.querySelector('[data-proc-list]');
  if (!grid) return;
  var cards = Array.from(grid.querySelectorAll('details.proc'));
  var topicButtons = Array.from(document.querySelectorAll('[data-proc-filters] [data-filter]'));
  var search = document.getElementById('procedure-search');
  var typeSelect = document.getElementById('procedure-type');
  var status = document.getElementById('procedure-count');
  var empty = document.getElementById('procedure-empty');
  var dialog = document.getElementById('guide-dialog');
  var canDialog = !!(dialog && typeof dialog.showModal === 'function');
  var topic = 'all';
  var current = null;

  var hasValue = function (el, attr, value) { return value === 'all' || (el.getAttribute(attr) || '').split(' ').indexOf(value) !== -1; };
  var shownCards = function () { return cards.filter(function (card) { return !card.hidden; }); };

  // When the last row would hold a single card, that card spans the row as a wide card.
  var layout = function () {
    var shown = shownCards();
    var columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
    cards.forEach(function (card) { card.classList.remove('is-wide'); });
    if (columns > 1 && shown.length % columns === 1) shown[shown.length - 1].classList.add('is-wide');
  };

  var update = function () {
    var query = search ? search.value.trim().toLocaleLowerCase() : '';
    var type = typeSelect ? typeSelect.value : 'all';
    var shown = 0;
    cards.forEach(function (card) {
      var match = hasValue(card, 'data-category', topic) && hasValue(card, 'data-type', type) &&
        (!query || card.textContent.toLocaleLowerCase().indexOf(query) !== -1);
      card.hidden = !match;
      if (match) shown++;
    });
    topicButtons.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.filter === topic)); });
    var filtered = topic !== 'all' || type !== 'all' || query;
    if (status) status.textContent = filtered ? 'Showing ' + shown + ' of ' + cards.length + ' procedure guides' : '';
    if (empty) empty.hidden = shown !== 0;
    layout();
  };

  var resetFilters = function () {
    topic = 'all';
    if (search) search.value = '';
    if (typeSelect) typeSelect.value = 'all';
    update();
  };

  topicButtons.forEach(function (button) { button.addEventListener('click', function () { topic = button.dataset.filter; update(); }); });
  if (search) search.addEventListener('input', update);
  if (typeSelect) typeSelect.addEventListener('change', update);
  document.querySelectorAll('[data-proc-reset]').forEach(function (button) {
    button.addEventListener('click', function () { resetFilters(); if (search) search.focus(); });
  });
  var resizeFrame = 0;
  window.addEventListener('resize', function () { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(layout); });

  var setStep = function (button, card, label) {
    button.hidden = !card;
    if (card) button.setAttribute('aria-label', label + ' guide: ' + card.querySelector('.proc__title').textContent.trim());
    button.onclick = card ? function () { openGuide(card); } : null;
  };

  var openGuide = function (card) {
    if (!canDialog) return;
    card.open = false;
    if (dialog.open && current === card) return;
    if (card.hidden) resetFilters();
    current = card;
    var media = dialog.querySelector('.guide-dialog__media img');
    media.src = card.querySelector('.proc__media img').getAttribute('src');
    dialog.querySelector('[data-guide-tag]').textContent = card.querySelector('.proc__tag').textContent;
    var type = card.querySelector('.proc__type');
    dialog.querySelector('[data-guide-type]').textContent = type ? type.textContent : '';
    dialog.querySelector('[data-guide-title]').innerHTML = card.querySelector('.proc__title').innerHTML;
    dialog.querySelector('[data-guide-summary]').textContent = card.querySelector('.proc__summary').textContent;
    var body = card.querySelector('.proc__body').cloneNode(true);
    var bodyType = body.querySelector('.proc__type');
    if (bodyType) bodyType.remove();
    var slot = dialog.querySelector('[data-guide-body]');
    slot.innerHTML = '';
    while (body.firstChild) slot.appendChild(body.firstChild);
    var shown = shownCards();
    var index = shown.indexOf(card);
    setStep(dialog.querySelector('[data-guide-step="-1"]'), shown[index - 1], 'Previous');
    setStep(dialog.querySelector('[data-guide-step="1"]'), shown[index + 1], 'Next');
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    if (location.hash !== '#' + card.id) history.replaceState(null, '', '#' + card.id);
  };

  if (canDialog) {
    cards.forEach(function (card) {
      var summary = card.querySelector('summary');
      summary.setAttribute('aria-haspopup', 'dialog');
      summary.addEventListener('click', function (event) { event.preventDefault(); openGuide(card); });
      // Anything else that opens a card (such as a deep link handled in main.js) opens the dialog.
      card.addEventListener('toggle', function () { if (card.open) openGuide(card); });
    });
    dialog.querySelectorAll('[data-guide-close]').forEach(function (button) { button.addEventListener('click', function () { dialog.close(); }); });
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var box = dialog.getBoundingClientRect();
      var outside = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
      if (outside) dialog.close();
    });
    dialog.addEventListener('close', function () {
      if (current && location.hash === '#' + current.id) history.replaceState(null, '', location.pathname + location.search);
      if (current) current.querySelector('summary').focus({ preventScroll: true });
    });
    var fromHash = function () {
      var card = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (card && cards.indexOf(card) !== -1) openGuide(card);
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }
  update();
})();
