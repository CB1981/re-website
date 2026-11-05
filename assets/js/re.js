/* Re. website behaviour (November 2026 redesign).
   Header, mobile menu, tabs, accordions and the two enquiry forms.
   No dependencies. */
(function () {
  'use strict';

  var ENDPOINT = 'https://formspree.io/f/xppwayoj';
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------------ header */
  var hdr = $('.hdr');
  function onScroll() {
    if (!hdr) return;
    hdr.classList.toggle('is-compact', (window.scrollY || document.documentElement.scrollTop || 0) > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var menuBtn = $('.re-menu-btn');
  var mnav = $('#mnav');
  function setMenu(open) {
    if (!menuBtn || !mnav) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mnav.hidden = !open;
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(mnav.hidden); });
  if (mnav) mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* -------------------------------------------------------------- tabs
     <div data-tabs="name"> buttons with data-key ... </div>
     panels: [data-panel="name"][data-key]
     attribute used for the selected state: aria-selected (tabs) or aria-checked (radios) */
  function selectTab(name, key) {
    var group = $('[data-tabs="' + name + '"]');
    if (!group) return;
    var attr = group.getAttribute('data-attr') || 'aria-selected';
    $$('[data-key]', group).forEach(function (b) { b.setAttribute(attr, String(b.getAttribute('data-key') === key)); });
    $$('[data-panel="' + name + '"]').forEach(function (p) { p.hidden = p.getAttribute('data-key') !== key; });
    group.setAttribute('data-current', key);
    document.dispatchEvent(new CustomEvent('re:tab', { detail: { name: name, key: key } }));
  }
  $$('[data-tabs]').forEach(function (group) {
    var name = group.getAttribute('data-tabs');
    group.addEventListener('click', function (e) {
      var b = e.target.closest('[data-key]');
      if (b && group.contains(b)) selectTab(name, b.getAttribute('data-key'));
    });
  });
  // "Next: Measure →" buttons
  $$('[data-next]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var name = btn.getAttribute('data-next');
      var keys = $$('[data-tabs="' + name + '"] [data-key]').map(function (b) { return b.getAttribute('data-key'); });
      var cur = $('[data-tabs="' + name + '"]').getAttribute('data-current') || keys[0];
      selectTab(name, keys[(keys.indexOf(cur) + 1) % keys.length]);
    });
  });

  /* ------------------------------------------------------ disclosures
     <button aria-expanded data-toggle="id"> shows/hides #id.
     data-single="group" closes others in the same group. */
  $$('[data-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      var single = btn.getAttribute('data-single');
      if (single && open) {
        $$('[data-single="' + single + '"]').forEach(function (o) {
          if (o === btn) return;
          o.setAttribute('aria-expanded', 'false');
          $$(o.getAttribute('data-toggle').split(' ').map(function (id) { return '#' + id; }).join(',')).forEach(function (t) { t.hidden = true; });
        });
      }
      btn.setAttribute('aria-expanded', String(open));
      btn.getAttribute('data-toggle').split(' ').forEach(function (id) { var t = document.getElementById(id); if (t) t.hidden = !open; });
      var grp = btn.closest('[data-openclass]');
      if (grp) grp.classList.toggle(grp.getAttribute('data-openclass'), !!$('[aria-expanded="true"]', grp));
      var lbl = btn.getAttribute(open ? 'data-label-open' : 'data-label-closed');
      if (lbl) btn.textContent = lbl;
    });
  });

  /* ------------------------------------------------------------- forms */
  async function post(payload) {
    var r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('bad status ' + r.status);
  }
  function val(form, name) {
    var el = form.elements[name];
    return el ? String(el.value || '').trim() : '';
  }

  $$('form[data-enquiry]').forEach(function (form) {
    var err = $('.form-err', form);
    var btn = $('button[type="submit"]', form);
    var busy = false;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (busy) return;
      var name = val(form, 'name'), email = val(form, 'email');
      if (!name || !EMAIL_RE.test(email)) {
        err.textContent = 'Please add your name and a valid work email.';
        err.hidden = false;
        (name ? form.elements.email : form.elements.name).focus();
        return;
      }
      if (val(form, '_gotcha')) return; // bot
      err.hidden = true;
      busy = true;
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending…';

      var kind = form.getAttribute('data-enquiry');
      var payload = { name: name, email: email, phone: val(form, 'phone'), company: val(form, 'company') };
      if (kind === 'contact') {
        var type = form.getAttribute('data-type') || 'demo';
        payload.enquiry = { consultation: 'Consultation', demo: 'Demo', partnership: 'Partnership' }[type];
        if (type === 'consultation') { payload.business_type = val(form, 'business_type'); payload.venues = val(form, 'venues'); payload.main_challenge = val(form, 'challenge'); }
        if (type === 'demo') { payload.product = form.getAttribute('data-tool') || 'Both'; }
        if (type === 'partnership') { payload.venues = val(form, 'p_venues'); payload.support = val(form, 'p_support'); payload.engagement = val(form, 'p_engagement'); }
      } else {
        payload.enquiry = 'Consultation';
        payload.topic = val(form, 'topic');
      }
      payload.message = val(form, 'message');
      payload.source = form.getAttribute('data-source') || location.pathname;
      payload.page = location.href;
      payload._subject = 'Re. website · ' + payload.enquiry + (payload.product ? ' (' + payload.product + ')' : '') + ' · ' + name;
      payload._replyto = email;

      try {
        await post(payload);
        var done = document.getElementById(form.getAttribute('data-done'));
        form.hidden = true;
        if (done) { done.hidden = false; var lab = $('[data-type-label]', done); if (lab) lab.textContent = payload.enquiry; done.focus && done.focus(); }
      } catch (ex) {
        err.innerHTML = 'Could not send. Please email us at <a href="mailto:hello@re-consultancy.me">hello@re-consultancy.me</a>.';
        err.hidden = false;
        btn.disabled = false; btn.textContent = label; busy = false;
      }
    });
  });

  /* ------------------------------------------------- contact page set-up */
  var cform = $('form[data-enquiry="contact"]');
  if (cform) {
    var LABELS = { demo: 'Request a demo', consultation: 'Request a consultation', partnership: 'Enquire about partnership' };
    var NEXT = {
      consultation: ['Initial business conversation.', 'Agreed follow-up or a scoped proposal.'],
      demo: ['Guided product walkthrough.', 'Tool recommendation and next steps.'],
      partnership: ['Discussion of group needs and advisory scope.', 'Proposed arrangement, scope and terms.']
    };
    document.addEventListener('re:tab', function (e) {
      if (e.detail.name === 'ctype') {
        var t = e.detail.key;
        cform.setAttribute('data-type', t);
        $('button[type="submit"]', cform).textContent = LABELS[t];
        $('#step2').textContent = NEXT[t][0];
        $('#step3').textContent = NEXT[t][1];
        $('.form-err', cform).hidden = true;
      }
      if (e.detail.name === 'ctool') {
        cform.setAttribute('data-tool', { both: 'Both', planner: 'Re. Planner', academy: 'Re. Academy' }[e.detail.key]);
      }
    });
    // Preselect from the link: /contact/#demo-planner, or the old /contact/?topic=demo
    var h = (location.hash || '').replace('#', '');
    var q = (location.search.match(/[?&]topic=([^&]+)/) || [])[1];
    var map = { demo: ['demo'], 'demo-planner': ['demo', 'planner'], 'demo-academy': ['demo', 'academy'], consultation: ['consultation'], partnership: ['partnership'] };
    var pick = map[h] || map[q] || null;
    if (pick) {
      selectTab('ctype', pick[0]);
      if (pick[1]) selectTab('ctool', pick[1]);
      cform.setAttribute('data-source', location.pathname + '#' + (h || q));
    }
  }
})();
