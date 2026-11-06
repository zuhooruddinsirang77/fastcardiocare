/* FastCardioCare — site behaviour (no dependencies) */
(function () {
  'use strict';

  /* ---------- Privacy-safe event tracking stub ----------
     Sends ONLY event names (page views, CTA clicks, form completion).
     Never send form values, message text or procedure/interest selections. */
  window.fccTrack = function (eventName) {
    if (window.dataLayer && typeof window.dataLayer.push === 'function') {
      window.dataLayer.push({ event: String(eventName) });
    }
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-track]') : null;
    if (el) window.fccTrack(el.getAttribute('data-track'));
  });

  /* ---------- Mobile navigation ---------- */
  var dropdowns = document.querySelectorAll('.nav-dropdown');
  document.addEventListener('click', function (e) {
    dropdowns.forEach(function (menu) { if (!menu.contains(e.target)) menu.open = false; });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    dropdowns.forEach(function (menu) {
      if (menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
    });
  });
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var label = toggle.querySelector('.nav-toggle__label');
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      // The drawer fills the screen below the header, wherever the header currently ends.
      if (open) {
        var header = document.querySelector('.site-header');
        var bottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 68;
        nav.style.setProperty('--nav-top', Math.round(bottom) + 'px');
      }
      // Lock background scrolling while the mobile menu is open.
      document.documentElement.classList.toggle('nav-open', open);
      if (label) label.textContent = open ? 'Close' : 'Menu';
    };
    // Close the menu when a link inside it is followed (including same-page anchors).
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a[href]')) setOpen(false);
    });
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !toggle.contains(e.target)) {
        setOpen(false);
      }
    });
    var mq = window.matchMedia('(min-width: 1280px)'); // matches where the menu collapses
    var onMq = function (e) { if (e.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  /* ---------- Pinned consultation bar steps aside when it would duplicate ----------
     On small screens it hides while a closing call-to-action band or the footer is
     on screen, so the same button never appears twice or covers footer links. */
  var sticky = document.querySelector('.sticky-cta');
  if (sticky && 'IntersectionObserver' in window) {
    var covering = new Set();
    var stickyWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) covering.add(e.target); else covering.delete(e.target); });
      document.documentElement.classList.toggle('sticky-cta-off', covering.size > 0);
    }, { threshold: 0.15 });
    document.querySelectorAll('.cta-band, .site-footer').forEach(function (el) { stickyWatch.observe(el); });
  }

  /* ---------- Open a procedure card from the URL hash ---------- */
  var openFromHash = function () {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS') {
      el.open = true;
      var summary = el.querySelector('summary');
      if (summary) summary.focus({ preventScroll: true });
    }
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);

  /* ---------- Enquiry form ---------- */
  var form = document.getElementById('enquiry-form');
  if (!form) return;

  var summaryBox = document.getElementById('error-summary');
  var summaryList = summaryBox.querySelector('ul');
  var submitError = document.getElementById('submit-error');
  var success = document.getElementById('form-success');
  var formArea = document.getElementById('form-area');
  var submitBtn = form.querySelector('[type="submit"]');
  var submitLabel = submitBtn.querySelector('.btn-label');
  var submitted = false;

  // Character counter
  var msg = document.getElementById('message');
  var counter = document.getElementById('message-count');
  var max = parseInt(msg.getAttribute('maxlength'), 10) || 600;
  var updateCount = function () {
    var left = max - msg.value.length;
    counter.textContent = left + (left === 1 ? ' character' : ' characters') + ' remaining';
  };
  msg.addEventListener('input', updateCount);
  updateCount();

  var focusTarget = {
    name: 'name', email: 'email', phone: 'phone', country: 'country',
    contact_method: 'method-email', enquirer: 'enquirer-patient', consent: 'consent'
  };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // International format: a leading + and country code, then 8–15 digits in total (E.164).
  // Spaces, dots, dashes and brackets are allowed for readability.
  var PHONE_CHARS_RE = /^\+[0-9\s().-]+$/;
  var isPhone = function (raw) {
    if (!PHONE_CHARS_RE.test(raw)) return false;
    var digits = raw.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15 && digits.charAt(0) !== '0';
  };

  var value = function (name) {
    var el = form.elements[name];
    if (!el) return '';
    return String(el.value || '').trim();
  };

  var validate = function () {
    var errors = {};
    var add = function (field, text) { if (!errors[field]) errors[field] = text; };
    var name = value('name'), email = value('email'), phone = value('phone'), method = value('contact_method');

    if (!name) add('name', 'Enter your name.');

    if (email && !EMAIL_RE.test(email)) add('email', 'Enter a valid email address, like name@example.com.');
    if (phone && !isPhone(phone)) add('phone', 'Enter a phone number starting with + and your country code, like +44 20 7946 0000.');

    if (method === 'email' && !email) add('email', 'Enter an email address, or choose a different contact method.');
    if ((method === 'phone' || method === 'whatsapp') && !phone) add('phone', 'Enter a phone number with country code, or choose email as your contact method.');
    if (!email && !phone) add('email', 'Enter an email address or a phone number so we can reach you.');

    if (!value('country')) add('country', 'Enter your country of residence.');
    if (!method) add('contact_method', 'Choose how you would like us to contact you.');
    if (!value('enquirer')) add('enquirer', 'Tell us whether you are the patient, a family member or a referral partner.');
    if (!form.elements.consent.checked) add('consent', 'Confirm that you have read the Privacy Notice and give permission for us to respond.');
    return errors;
  };

  var fieldsFor = function (field) {
    var el = form.elements[field];
    if (!el) return [];
    return el.length !== undefined && !el.tagName ? Array.prototype.slice.call(el) : [el];
  };

  var render = function (errors, withSummary) {
    Object.keys(focusTarget).forEach(function (field) {
      var msgEl = document.getElementById('err-' + field);
      var text = errors[field] || '';
      if (msgEl) msgEl.textContent = text;
      fieldsFor(field).forEach(function (input) {
        if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      });
    });
    if (!withSummary) return;
    summaryList.innerHTML = '';
    var keys = Object.keys(focusTarget).filter(function (k) { return errors[k]; });
    if (!keys.length) { summaryBox.hidden = true; return; }
    keys.forEach(function (k) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + focusTarget[k];
      a.textContent = errors[k];
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.getElementById(focusTarget[k]);
        if (t) { t.focus(); t.scrollIntoView({ block: 'center' }); }
      });
      li.appendChild(a);
      summaryList.appendChild(li);
    });
    summaryBox.hidden = false;
    summaryBox.focus();
  };

  // After the first submit attempt, update messages as people fix fields.
  var revalidate = function () {
    if (!submitted) return;
    var errors = validate();
    render(errors, false);
    if (!Object.keys(errors).length) summaryBox.hidden = true;
  };
  form.addEventListener('input', revalidate);
  form.addEventListener('change', revalidate);

  // `delivered` is true only when the server has acknowledged the enquiry.
  var showSuccess = function (delivered) {
    formArea.hidden = true;
    success.hidden = false;
    success.focus();
    if (delivered) window.fccTrack('form_complete');
  };

  var busy = false;
  var setBusy = function (state) {
    busy = state;
    submitBtn.disabled = state;
    submitBtn.setAttribute('aria-busy', String(state));
    submitLabel.textContent = state ? 'Sending…' : 'Request a confidential consultation';
  };

  var showFailure = function () {
    // Keep everything the visitor typed so they can simply try again.
    setBusy(false);
    submitError.hidden = false;
    submitError.focus && submitError.focus();
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return; // prevent duplicate submissions
    submitted = true;
    submitError.hidden = true;

    // Honeypot: bots fill hidden fields. Show the same screen without sending.
    if (value('website')) { showSuccess(false); return; }

    var errors = validate();
    render(errors, true);
    if (Object.keys(errors).length) return;

    setBusy(true);
    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) {
      // Preview mode (no backend configured): nothing is sent anywhere, and the
      // success panel is relabelled "Preview complete" by services.js.
      setTimeout(function () { showSuccess(false); }, 400);
      return;
    }

    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 20000) : null;
    fetch(endpoint, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error('Request failed');
      // Accept an empty 2xx, but treat an explicit {"ok": false} as a failure.
      return res.text().then(function (body) {
        var data = null;
        try { data = body ? JSON.parse(body) : null; } catch (err) { data = null; }
        if (data && data.ok === false) throw new Error('Rejected');
      });
    }).then(function () {
      if (timer) clearTimeout(timer);
      showSuccess(true);
    }).catch(function () {
      if (timer) clearTimeout(timer);
      showFailure();
    });
  });
})();
