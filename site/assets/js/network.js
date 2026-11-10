(function () {
  'use strict';
  document.querySelectorAll('[data-network-directory]').forEach(function (directory) {
    var controls = directory.querySelector('[data-network-controls]');
    var country = directory.querySelector('[data-network-country]');
    var search = directory.querySelector('[data-network-search]');
    var role = directory.querySelector('[data-network-role]');
    var cards = Array.from(directory.querySelectorAll('[data-network-card]'));
    var countLabel = directory.querySelector('[data-network-count]');
    var emptyState = directory.querySelector('[data-network-empty]');
    var coordinator = !!directory.querySelector('.coordinator-grid');
    var pageSize = Number(directory.dataset.pageSize) || 9;
    var visibleLimit = pageSize;
    var matching = [];
    var countries = document.createElement('div');
    countries.className = 'directory-countries';
    countries.setAttribute('role', 'group');
    countries.setAttribute('aria-label', 'Choose a destination');
    ['all', 'Pakistan', 'Thailand', 'Malaysia'].forEach(function (name) {
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.destination = name;
      var count = name === 'all' ? cards.length : cards.filter(function (card) { return card.dataset.country === name; }).length;
      var label = document.createElement('span');
      label.textContent = (name === 'all' ? 'All destinations' : name) + ' (' + count + ')';
      if (!coordinator) {
        var flag = document.createElement('span');
        flag.className = 'destination-flag destination-flag--' + name.toLowerCase();
        flag.setAttribute('aria-hidden', 'true');
        button.appendChild(flag);
      }
      button.appendChild(label);
      button.addEventListener('click', function () { country.value = name; visibleLimit = pageSize; update(); });
      countries.appendChild(button);
    });
    controls.parentNode.insertBefore(countries, controls);
    country.parentElement.classList.add('directory-country-select');
    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'directory-more';
    more.textContent = 'Show more profiles';
    if (coordinator) directory.querySelector('.coordinator-grid').after(more);
    more.addEventListener('click', function () {
      var next = matching[visibleLimit];
      visibleLimit += pageSize;
      update();
      if (next) next.querySelector('.directory-profile-button').focus({ preventScroll: true });
    });
    // One accessible native dialog handles coordinator profiles and hospital details.
    var dialog = document.createElement('dialog');
    dialog.className = 'directory-dialog';
    dialog.setAttribute('aria-labelledby', 'directory-dialog-title');
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'directory-dialog-close';
    close.textContent = 'Close ×';
    close.addEventListener('click', function () { dialog.close(); });
    var dialogBody = document.createElement('div');
    dialog.append(close, dialogBody);
    document.body.appendChild(dialog);
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    function element(tag, text, className) {
      var node = document.createElement(tag);
      if (text) node.textContent = text;
      if (className) node.className = className;
      return node;
    }
    function title(text) {
      var heading = element('h2', text);
      heading.id = 'directory-dialog-title';
      dialogBody.appendChild(heading);
    }
    function openProfile(card) {
      dialog.classList.remove('directory-dialog--hospital');
      dialog.classList.add('directory-dialog--profile');
      dialogBody.replaceChildren();
      var portrait = card.querySelector('.coordinator-portrait').cloneNode(true);
      portrait.classList.add('directory-dialog-portrait');
      var focus = card.querySelectorAll('.coordinator-card__body > p')[1].textContent;
      var languages = (card.dataset.languages || card.querySelector('.coordinator-languages').textContent).split('\u00b7').map(function (l) { return l.trim(); }).filter(Boolean);
      var roles = {
        'Appointment coordination': {
          about: 'Keeps appointment details clear and in one place, so you and your family always know what is happening next.',
          helps: ['Prepare practical questions for the provider', 'Organize appointment dates, times and requirements', 'Pass scheduling updates between you and the provider']
        },
        'Travel & stay planning': {
          about: 'Helps plan the practical side of travelling for care, once the provider has confirmed what is needed.',
          helps: ['Plan travel dates around confirmed appointments', 'Organize accommodation close to the provider', 'Make arrangements for a companion who travels with you']
        },
        'Patient communication': {
          about: 'Explains the process in plain language and keeps patients and families informed at each step.',
          helps: ['Explain how provider review and estimates work', 'Keep you and your family updated', 'Help you write down questions for your clinician']
        },
        'Records coordination': {
          about: 'Helps gather and organize the documents a provider asks for, and explains how they are shared with your consent.',
          helps: ['Check which records the provider requests', 'Organize documents for sharing with your consent', 'Prepare a handover pack for your doctor at home']
        },
        'Family support': {
          about: 'Supports family members with the practical arrangements around appointments, the visit and the journey home.',
          helps: ['Explain arrangements to family members', 'Plan logistics for a companion during the stay', 'Support practical planning for the return home']
        }
      };
      var info = roles[focus] || { about: 'Practical, nonclinical support around the care journey.', helps: [] };
      var header = element('div', '', 'directory-profile-header');
      var identity = element('div', '', 'directory-profile-identity');
      title(card.querySelector('h3').textContent);
      var heading = dialogBody.querySelector('h2');
      identity.append(
        heading,
        element('p', focus, 'directory-profile-role'),
        element('p', card.querySelector('.network-location').textContent, 'directory-profile-place')
      );
      header.append(portrait, identity);
      dialogBody.appendChild(header);

      var about = element('section', '', 'directory-profile-section');
      about.append(element('h3', 'About this role'), element('p', info.about));
      dialogBody.appendChild(about);

      if (info.helps.length) {
        var helps = element('section', '', 'directory-profile-section');
        helps.appendChild(element('h3', 'How they can help'));
        var list = element('ul', '', 'directory-profile-list');
        info.helps.forEach(function (item) { list.appendChild(element('li', item)); });
        helps.appendChild(list);
        dialogBody.appendChild(helps);
      }

      var langs = element('section', '', 'directory-profile-section');
      langs.appendChild(element('h3', 'Languages'));
      var chips = element('div', '', 'directory-profile-chips');
      languages.forEach(function (l) { chips.appendChild(element('span', l)); });
      langs.appendChild(chips);
      dialogBody.appendChild(langs);

      var actions = element('div', '', 'directory-profile-actions');
      var ask = element('a', 'Ask about coordination', 'btn btn--primary');
      ask.href = 'contact.html';
      var how = element('a', 'How it works', 'directory-profile-link');
      how.href = 'how-it-works.html';
      actions.append(ask, how);
      dialogBody.appendChild(actions);
      dialog.showModal();
    }
    var savedHospitals = [];
    try {
      var saved = JSON.parse(localStorage.getItem('fcc-saved-hospitals') || '[]');
      if (Array.isArray(saved)) savedHospitals = saved.filter(function (name) { return typeof name === 'string'; });
    } catch (_) {}
    cards.forEach(function (card) {
      // Keep the search index independent of button labels.
      card.dataset.searchText = card.textContent.toLocaleLowerCase();
      if (coordinator) {
        var personName = card.querySelector('h3').textContent;
        // Tone per role (red or blue swoosh) and one chip per language, as in the card design.
        var roleText = (card.querySelector('.coordinator-role') || {}).textContent || '';
        card.dataset.role = /travel|records|family/i.test(roleText) ? 'blue' : 'red';
        var languageLine = card.querySelector('.coordinator-languages');
        if (languageLine && !card.dataset.languages) {
          card.dataset.languages = languageLine.textContent.trim();
          languageLine.querySelectorAll('.language-chip').forEach(function (chip) { chip.remove(); });
          card.dataset.languages.split('\u00b7').forEach(function (language) {
            if (language.trim()) languageLine.appendChild(element('span', language.trim(), 'language-chip'));
          });
        }
        var button = element('button', 'View profile \u2192', 'directory-profile-button');
        button.type = 'button';
        button.setAttribute('aria-label', 'View profile: ' + personName);
        button.addEventListener('click', function () { openProfile(card); });
        var cardActions = element('div', '', 'coordinator-card__actions');
        cardActions.append(button);
        card.querySelector('.coordinator-card__body').appendChild(cardActions);
      } else {
        var photoFrame = card.querySelector('.reference-hospital-photo');
        if (photoFrame) {
          var hospitalName = card.querySelector('h3').textContent;
          var saveButton = element('button', '', 'hospital-save');
          saveButton.type = 'button';
          saveButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
          function syncSaved() {
            var isSaved = savedHospitals.includes(hospitalName);
            saveButton.setAttribute('aria-pressed', String(isSaved));
            saveButton.setAttribute('aria-label', (isSaved ? 'Unsave ' : 'Save ') + hospitalName);
            saveButton.title = isSaved ? 'Remove from saved hospitals' : 'Save hospital on this browser';
          }
          saveButton.addEventListener('click', function () {
            if (savedHospitals.includes(hospitalName)) savedHospitals = savedHospitals.filter(function (name) { return name !== hospitalName; });
            else savedHospitals.push(hospitalName);
            try { localStorage.setItem('fcc-saved-hospitals', JSON.stringify(savedHospitals)); } catch (_) {}
            syncSaved();
          });
          photoFrame.appendChild(saveButton);
          syncSaved();
        }
        var detailsButton = element('button', 'View details →', 'reference-details-button');
        detailsButton.type = 'button';
        detailsButton.setAttribute('aria-label', 'View details: ' + card.querySelector('h3').textContent);
        detailsButton.addEventListener('click', function () {
          dialog.classList.remove('directory-dialog--profile');
          dialog.classList.add('directory-dialog--hospital');
          dialogBody.replaceChildren();
          var hospitalTitle = card.querySelector('h3').textContent;
          var city = card.querySelector('.network-location').textContent.trim();
          var banner = element('div', '', 'hospital-modal__banner');
          var photo = card.querySelector('.reference-hospital-photo img');
          if (photo) {
            var photoCopy = photo.cloneNode(true);
            photoCopy.className = 'hospital-modal__photo';
            photoCopy.alt = '';
            banner.appendChild(photoCopy);
          }
          var wave = card.querySelector('.hospital-photo-wave');
          if (wave) banner.appendChild(wave.cloneNode(true));
          banner.appendChild(element('span', hospitalTitle, 'hospital-modal__badge'));
          var tools = element('div', '', 'hospital-modal__tools');
          var shareButton = element('button', '', 'hospital-modal__tool hospital-modal__tool--share');
          shareButton.type = 'button';
          shareButton.setAttribute('aria-label', 'Share ' + hospitalTitle);
          shareButton.title = 'Share';
          shareButton.addEventListener('click', function () {
            var shareData = { title: hospitalTitle, text: hospitalTitle + ' on FastCardioCare', url: window.location.href };
            if (navigator.share) { navigator.share(shareData).catch(function () {}); }
            else if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href).then(function () { shareButton.title = 'Link copied'; shareButton.classList.add('is-done'); }).catch(function () {});
            }
          });
          var saveCopy = element('button', '', 'hospital-modal__tool hospital-modal__tool--save');
          saveCopy.type = 'button';
          function syncModalSave() {
            var on = savedHospitals.includes(hospitalTitle);
            saveCopy.setAttribute('aria-pressed', String(on));
            saveCopy.setAttribute('aria-label', (on ? 'Unsave ' : 'Save ') + hospitalTitle);
            saveCopy.title = on ? 'Remove from saved hospitals' : 'Save hospital on this browser';
          }
          saveCopy.addEventListener('click', function () { if (saveButton) saveButton.click(); syncModalSave(); });
          syncModalSave();
          tools.append(shareButton, saveCopy);
          banner.appendChild(tools);
          dialogBody.appendChild(banner);

          var head = element('div', '', 'hospital-modal__head');
          var headMain = element('div', '', 'hospital-modal__main');
          var place = element('p', '', 'hospital-modal__place');
          place.append(element('span', card.dataset.country), element('span', city));
          headMain.appendChild(place);
          var heading = element('h2', hospitalTitle);
          heading.id = 'directory-dialog-title';
          headMain.appendChild(heading);
          headMain.appendChild(element('p', card.querySelector('h3 + p').textContent, 'hospital-modal__lead'));
          var tags = card.querySelector('.reference-service-tags');
          if (tags) {
            var tagList = tags.cloneNode(true);
            tagList.classList.add('hospital-modal__tags');
            headMain.appendChild(tagList);
          }
          var facts = element('dl', '', 'hospital-modal__facts');
          var serviceNames = tags ? Array.prototype.map.call(tags.querySelectorAll('span'), function (n) { return n.textContent; }) : [];
          [['Location', city + ', ' + card.dataset.country], ['Cardiac services', serviceNames.length ? serviceNames.length + ' listed' : 'See hospital site']].forEach(function (pair) {
            var row = element('div');
            row.append(element('dt', pair[0]), element('dd', pair[1]));
            facts.appendChild(row);
          });
          head.append(headMain, facts);
          dialogBody.appendChild(head);

          var accreditation = card.querySelector('[data-hospital-accreditation]');
          var accredBox = element('section', '', 'hospital-modal__accred');
          var accredIcon = element('span', '', 'hospital-modal__accred-icon');
          accredIcon.setAttribute('aria-hidden', 'true');
          var accredText = element('div', '', 'hospital-modal__accred-text');
          accredText.append(element('h3', 'Accreditation information'), element('p', accreditation.content.textContent.trim()));
          accredBox.append(accredIcon, accredText, element('span', 'Reported', 'hospital-modal__reported'));
          dialogBody.appendChild(accredBox);

          var links = card.querySelector('.hospital-card__links').cloneNode(true);
          links.classList.add('hospital-modal__links');
          dialogBody.appendChild(links);
          dialog.showModal();
        });
        var actions = element('div', '', 'reference-card-actions');
        actions.appendChild(detailsButton);
        var body = card.querySelector('.reference-hospital-body');
        (body || card).appendChild(actions);
      }
    });
    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'network-reset';
    reset.textContent = 'Clear filters';
    controls.appendChild(reset);
    var roleTabs = coordinator && document.querySelector('[data-coordinator-tabs]');
    if (roleTabs && role) {
      Array.from(role.options).forEach(function (option) {
        var tab = element('button', option.value === 'all' ? 'All coordinators' : option.textContent);
        tab.type = 'button';
        tab.dataset.roleTab = option.value;
        tab.addEventListener('click', function () { role.value = option.value; filterChanged(); });
        roleTabs.appendChild(tab);
      });
      roleTabs.hidden = false;
    }
    if (!coordinator && directory.closest('.reference-network, .hospital-theme')) {
      var searchButton = element('button', 'Search', 'reference-search-button');
      searchButton.type = 'button';
      searchButton.addEventListener('click', function () { filterChanged(); });
      search.parentElement.after(searchButton);
      search.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') { event.preventDefault(); filterChanged(); }
      });
      search.placeholder = 'Search hospitals by name, city or service…';
    }
    function update() {
      var terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      matching = [];
      cards.forEach(function (card) {
        var match = (country.value === 'all' || card.dataset.country === country.value) && (!role || role.value === 'all' || card.textContent.includes(role.value)) && terms.every(function (term) { return card.dataset.searchText.includes(term); });
        if (match) matching.push(card);
        card.hidden = !match || (coordinator && matching.length > visibleLimit);
      });
      countLabel.textContent = matching.length + (coordinator ? ' coordinators' : ' hospitals') + (coordinator && matching.length > visibleLimit ? ' · showing ' + visibleLimit : '');
      emptyState.hidden = matching.length !== 0;
      more.hidden = !coordinator || matching.length <= visibleLimit;
      more.textContent = 'Show more profiles (' + Math.max(0, matching.length - visibleLimit) + ' remaining)';
      countries.querySelectorAll('button').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.destination === country.value)); });
      if (roleTabs) roleTabs.querySelectorAll('button').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.roleTab === role.value)); });
      reset.hidden = country.value === 'all' && !terms.length && (!role || role.value === 'all');
    }
    controls.hidden = false;
    function filterChanged() { visibleLimit = pageSize; update(); }
    country.addEventListener('change', filterChanged);
    search.addEventListener('input', filterChanged);
    if (role) role.addEventListener('change', filterChanged);
    reset.addEventListener('click', function () {
      country.value = 'all';
      search.value = '';
      if (role) role.value = 'all';
      visibleLimit = pageSize;
      update();
      search.focus();
    });
    update();
    if (directory.dataset.filters === 'off') {
      controls.remove();
      countries.remove();
      emptyState.remove();
    }
  });
  var form = document.getElementById('enquiry-form');
  if (!form) return;
  var application = form.querySelector('[data-network-application]');
  function updateApplication() {
    var choice = form.elements.enquirer.value;
    application.hidden = choice !== 'hospital' && choice !== 'medical_coordinator';
    application.querySelectorAll('input, select, textarea').forEach(function (field) { field.disabled = application.hidden; });
  }
  var requested = new URLSearchParams(window.location.search).get('enquirer');
  if (requested === 'hospital' || requested === 'medical_coordinator') {
    form.querySelector('input[name="enquirer"][value="' + requested + '"]').checked = true;
  }
  form.addEventListener('change', updateApplication);
  updateApplication();
})();
