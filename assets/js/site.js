/* Re. site behaviour: page routing, contact form, branching intake. */
(function () {
  'use strict';

  // Both forms post to the confirmed contact endpoint. The dedicated intake
  // form (xkjgwqpq) accepted submissions but never delivered them, and its
  // confirmation email never arrived. Intake submissions stay easy to tell
  // apart: every one carries source "Re. landing page (intake)" and a
  // subject line naming the sender. Swap `intake` back to its own endpoint
  // once that form is verified.
  var ENDPOINTS = {
    contact: 'https://formspree.io/f/xppwayoj',
    intake: 'https://formspree.io/f/xppwayoj'
  };
  var FALLBACK = 'Could not send. Email us instead at Hello@re-agency.me.';

  /* ------------------------------------------------------------ routing */

  /* Contact, the intake and the article are real pages now. All that is left
     here is smooth in-page scrolling for the home page's own sections, with
     the sticky header's height taken off the target. */

  function scrollToSection(id, smooth) {
    var el = document.getElementById(id);
    if (!el) return false;
    var header = document.querySelector('.site-header');
    var offset = header ? header.getBoundingClientRect().height : 0;
    var y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
    window.scrollTo({ top: y, behavior: smooth === false ? 'auto' : 'smooth' });
    return true;
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"], a[href^="/#"]');
    if (!link) return;
    var id = link.getAttribute('href').replace(/^\/?#/, '');
    if (!id) return;
    // A /#section link from a sub-page is a real navigation; let it happen.
    if (link.getAttribute('href').charAt(0) === '/' && location.pathname !== '/') return;
    if (scrollToSection(id)) {
      e.preventDefault();
      try { history.replaceState(null, '', '#' + id); } catch (err) { /* ignore */ }
    }
  });

  // Arriving on /#services, the browser jumps before the sticky header is
  // measured, leaving the section tucked underneath it.
  var initial = (location.hash || '').replace('#', '');
  if (initial) {
    window.addEventListener('load', function () { scrollToSection(initial, false); });
  }

  /* ------------------------------------------------------- chip helpers */

  function wireChips(scope) {
    scope.querySelectorAll('[data-chips]').forEach(function (group) {
      group.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        group.querySelectorAll('.chip').forEach(function (c) {
          c.setAttribute('aria-pressed', String(c === chip));
        });
      });
    });
  }

  function chipValue(scope, name) {
    var on = scope.querySelector('[data-chips="' + name + '"] .chip[aria-pressed="true"]');
    return on ? on.textContent.trim() : '';
  }

  async function post(url, payload) {
    var r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('bad status');
  }

  /* ------------------------------------------------------- contact form */

  var form = document.getElementById('contact-form');
  if (form) {
    var note = document.getElementById('contact-note');
    var send = document.getElementById('contact-send');
    var thanks = document.getElementById('contact-thanks');
    var sending = false;
    var error = '';

    wireChips(form);

    function values() {
      var v = {};
      form.querySelectorAll('input[name]').forEach(function (i) { v[i.name] = i.value.trim(); });
      return v;
    }

    function valid(v) { return !!(v.name && v.email && v.email.indexOf('@') > -1); }

    function sync() {
      var ok = valid(values());
      note.textContent = error || (sending ? 'Sending…' : ok
        ? 'We reply within two working days.'
        : 'Name and email are required.');
      send.disabled = !ok || sending;
      send.style.opacity = ok && !sending ? '1' : '0.4';
    }

    form.addEventListener('input', function () { error = ''; sync(); });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var v = values();
      if (!valid(v) || sending) return;
      sending = true; error = ''; sync();
      var payload = Object.assign({}, v, {
        venue: chipValue(form, 'venue'),
        outlets: chipValue(form, 'outlets'),
        method: chipValue(form, 'method'),
        _subject: 'Re. website: contact from ' + v.name,
        source: 'Re. landing page (contact)'
      });
      try {
        await post(ENDPOINTS.contact, payload);
        form.hidden = true;
        thanks.hidden = false;
      } catch (_) {
        error = FALLBACK;
      } finally {
        sending = false;
        sync();
      }
    });

    sync();
  }

  /* -------------------------------------------------------------- intake */

  var intakeRoot = document.getElementById('intake-root');
  if (!intakeRoot) return;

  var PATHS = [
    { id: 'concept', label: 'New concept or opening', desc: "You're building something from scratch: a site, an idea, or both." },
    { id: 'existing', label: 'Improve an existing venue', desc: "It's open. The menu, the kitchen, the team or the numbers need work." },
    { id: 'safety', label: 'Food safety & audits', desc: 'Systems, certification, inspections and the training behind them.' },
    { id: 'general', label: 'Not sure yet', desc: "A general enquiry, so we'll go straight to your details." }
  ];

  var BRANCHES = {
    concept: [
      { id: 'idea', title: "What's the concept?", hint: 'Cuisine, format, the one-line idea. Rough is fine.', kind: 'text', placeholder: 'e.g. 60-seat Levantine grill with a bakery counter, Saadiyat.' },
      { id: 'location', title: 'Is the location secured?', kind: 'choice', options: ['Yes, signed', 'In negotiation', 'Still looking', 'No site yet'] },
      { id: 'opening', title: 'Target opening?', kind: 'choice', options: ['Within 3 months', '3–6 months', '6–12 months', 'Over a year', 'Not set'] },
      { id: 'seats', title: 'How many seats?', kind: 'choice', options: ['Under 40', '40–80', '80–150', '150+', 'Not decided'] },
      { id: 'investment', title: 'Investment range?', hint: 'Total project budget, fit-out included.', kind: 'choice', options: ['Under AED 500k', 'AED 500k – 1.5M', 'AED 1.5M – 5M', 'AED 5M+', 'Not decided'] },
      { id: 'have', title: 'What do you already have?', hint: 'Pick everything that exists today.', kind: 'choice', multi: true, options: ['Brand / name', 'Chef', 'Site', 'Menu', 'Business plan', 'Investors', 'Nothing yet'] },
      { id: 'need', title: 'What do you need from Re.?', hint: 'Pick as many as apply.', kind: 'choice', multi: true, options: ['Concept development', 'Menu & recipe costing', 'Kitchen design & flow', 'Financial model', 'Pre-opening & launch', 'Everything'] }
    ],
    existing: [
      { id: 'type', title: 'What kind of venue is it?', kind: 'choice', options: ['Restaurant', 'Café / bakery', 'Bar / lounge', 'Hotel F&B', 'Catering / production', 'Multi-concept group'] },
      { id: 'outlets', title: 'How many outlets?', kind: 'choice', options: ['1', '2–3', '4–10', '10+'] },
      { id: 'covers', title: 'Covers on a typical day?', hint: 'Across all outlets, roughly.', kind: 'choice', options: ['Under 100', '100–250', '250–500', '500+'] },
      { id: 'stage', title: 'Where is the business today?', kind: 'choice', options: ['Growing', 'Flat', 'Struggling', 'Reopening / repositioning'] },
      { id: 'area', title: 'Where does it need work?', hint: 'Pick as many as apply. We scope properly on the call.', kind: 'choice', multi: true, options: ['Menu & pricing', 'Kitchen & operations', 'Team & training', 'Numbers & P&L', 'Guest experience', 'Full performance review'] }
    ],
    safety: [
      { id: 'cert', title: 'Current food safety certification?', kind: 'choice', options: ['None yet', 'HACCP', 'ISO 22000', 'Municipality-approved system', 'Not sure'] },
      { id: 'audit', title: 'Last audit or municipality grade?', kind: 'choice', options: ['A / passed', 'B / minor issues', 'C or below', 'Never audited', 'Not sure'] },
      { id: 'kitchens', title: 'How many kitchens?', kind: 'choice', options: ['1', '2–3', '4–10', '10+'] },
      { id: 'team', title: 'Is there a food safety lead in-house?', kind: 'choice', options: ['Yes, dedicated', 'Yes, part of another role', 'No'] },
      { id: 'need', title: 'What do you need from Re.?', hint: 'Pick as many as apply.', kind: 'choice', multi: true, options: ['System set-up (HACCP)', 'Audit & gap report', 'Team training', 'Ongoing monitoring', 'Inspection preparation'] }
    ],
    general: []
  };

  var CONTACT_DEFS = [
    { id: 'name', label: 'Name', type: 'text', placeholder: 'Full name', autocomplete: 'name' },
    { id: 'company', label: 'Company / venue', type: 'text', placeholder: 'Venue or group', autocomplete: 'organization' },
    { id: 'role', label: 'Role', type: 'text', placeholder: 'Owner, GM, F&B Director…', autocomplete: 'organization-title' },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com', autocomplete: 'email' },
    { id: 'phone', label: 'Phone / WhatsApp', type: 'tel', placeholder: '+971 …', autocomplete: 'tel' },
    { id: 'city', label: 'City', type: 'text', placeholder: 'Abu Dhabi, Dubai, Riyadh…', autocomplete: 'address-level2' }
  ];

  var state = { step: 0, answers: {}, done: false, sending: false, error: '' };

  function steps() {
    var branch = state.answers.path ? BRANCHES[state.answers.path] : [];
    return [{ id: 'path', title: 'What brings you to Re.?', kind: 'path' }]
      .concat(branch)
      .concat([
        { id: 'contact', title: 'How do we reach you?', kind: 'contact' },
        { id: 'review', title: 'Check and send.', hint: 'Tap any line to change it.', kind: 'review' }
      ]);
  }

  function fmt(v) { return Array.isArray(v) ? v.join(', ') : (v || 'Not answered'); }

  // The mark's full stop is a drawn circle, not typography, so a heading
  // that mentions "Re." renders the wordmark rather than typed text. Titles
  // stay plain strings, since they double as Formspree payload keys.
  function withMark(text) {
    var frag = document.createDocumentFragment();
    text.split('Re.').forEach(function (part, i) {
      if (i > 0) {
        var mark = document.createElement('span');
        mark.className = 'mark';
        mark.appendChild(document.createTextNode('Re'));
        var dot = document.createElement('span');
        dot.className = 'wordmark__dot';
        dot.setAttribute('aria-hidden', 'true');
        mark.appendChild(dot);
        frag.appendChild(mark);
      }
      if (part) frag.appendChild(document.createTextNode(part));
    });
    return frag;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function answered(q) {
    var a = state.answers[q.id];
    if (q.kind === 'path') return !!state.answers.path;
    if (q.kind === 'choice') return q.multi ? (Array.isArray(a) && a.length > 0) : !!a;
    if (q.kind === 'text') return !!(a && a.trim());
    if (q.kind === 'contact') {
      var c = state.answers.contact || {};
      return !!(c.name && c.email && c.email.indexOf('@') > -1);
    }
    return true;
  }

  function render() {
    intakeRoot.textContent = '';

    if (state.done) {
      var done = el('div', 'intake-done');
      done.appendChild(el('span', 'thanks__dot')).setAttribute('aria-hidden', 'true');
      done.appendChild(el('h2', null, "Thank you. We'll be in touch."));
      done.appendChild(el('p', null, 'Charbel reads every intake personally and replies within two working days, usually with a question or two of his own.'));
      var back = el('a', 'btn-underline btn-underline--tight', 'Back to site');
      back.href = '#top';
      back.setAttribute('data-go', 'top');
      back.style.alignSelf = 'flex-start';
      done.appendChild(back);
      intakeRoot.appendChild(done);
      return;
    }

    var all = steps();
    var total = all.length;
    var idx = Math.min(state.step, total - 1);
    var q = all[idx];
    var pathDef = PATHS.filter(function (p) { return p.id === state.answers.path; })[0];

    /* progress */
    var prog = el('div', 'progress');
    var meta = el('p', 'progress__meta');
    meta.appendChild(el('span', null, pathDef ? pathDef.label : 'Project intake'));
    meta.appendChild(el('span', null, 'Step ' + (idx + 1) + ' of ' + total));
    prog.appendChild(meta);
    var track = el('div', 'progress__track');
    var bar = el('div', 'progress__bar');
    bar.style.width = Math.round(((idx + 1) / total) * 100) + '%';
    track.appendChild(bar);
    prog.appendChild(track);
    intakeRoot.appendChild(prog);

    /* question */
    var step = el('div', 'step');
    var stepTitle = el('h2', 'step__title');
    stepTitle.appendChild(withMark(q.title));
    step.appendChild(stepTitle);
    if (q.hint) step.appendChild(el('p', 'step__hint', q.hint));

    if (q.kind === 'path') {
      var grid = el('div', 'path-grid');
      PATHS.forEach(function (p) {
        var btn = el('button', 'path-card');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(state.answers.path === p.id));
        var dot = el('span', 'path-card__dot');
        dot.setAttribute('aria-hidden', 'true');
        btn.appendChild(dot);
        btn.appendChild(el('span', 'path-card__label', p.label));
        btn.appendChild(el('span', 'path-card__desc', p.desc));
        btn.addEventListener('click', function () {
          state.answers = { path: p.id, contact: state.answers.contact };
          state.step = 1;
          render();
        });
        grid.appendChild(btn);
      });
      step.appendChild(grid);
    }

    if (q.kind === 'choice') {
      var og = el('div', 'option-grid');
      var a = state.answers[q.id];
      q.options.forEach(function (label) {
        var on = q.multi ? (Array.isArray(a) && a.indexOf(label) > -1) : a === label;
        var btn = el('button', 'option');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(on));
        var dot = el('span', 'option__dot');
        dot.setAttribute('aria-hidden', 'true');
        btn.appendChild(dot);
        btn.appendChild(el('span', null, label));
        btn.addEventListener('click', function () {
          if (q.multi) {
            var cur = Array.isArray(state.answers[q.id]) ? state.answers[q.id] : [];
            state.answers[q.id] = cur.indexOf(label) > -1
              ? cur.filter(function (x) { return x !== label; })
              : cur.concat([label]);
          } else {
            state.answers[q.id] = label;
          }
          render();
        });
        og.appendChild(btn);
      });
      step.appendChild(og);
    }

    if (q.kind === 'text') {
      var ta = document.createElement('textarea');
      ta.rows = 4;
      ta.placeholder = q.placeholder || '';
      ta.value = state.answers[q.id] || '';
      ta.setAttribute('aria-label', q.title);
      ta.addEventListener('input', function () {
        state.answers[q.id] = ta.value;
        syncNav();
      });
      step.appendChild(ta);
    }

    if (q.kind === 'contact') {
      var fields = el('div', 'intake-fields');
      var c = state.answers.contact || (state.answers.contact = {});
      CONTACT_DEFS.forEach(function (f) {
        var label = el('label', 'field');
        label.appendChild(el('span', null, f.label));
        var input = document.createElement('input');
        input.type = f.type;
        input.placeholder = f.placeholder;
        input.autocomplete = f.autocomplete;
        input.value = c[f.id] || '';
        input.addEventListener('input', function () { c[f.id] = input.value; syncNav(); });
        label.appendChild(input);
        fields.appendChild(label);
      });
      step.appendChild(fields);
    }

    if (q.kind === 'review') {
      var list = el('div', 'review');
      var c2 = state.answers.contact || {};
      all.filter(function (s) { return s.kind !== 'review'; }).forEach(function (s, i) {
        var row = el('button', 'review__row');
        row.type = 'button';
        row.appendChild(el('span', 'review__label',
          s.kind === 'path' ? 'Enquiry' : s.kind === 'contact' ? 'Contact' : s.title.replace(/\?$/, '')));
        row.appendChild(el('span', 'review__value',
          s.kind === 'path' ? (pathDef ? pathDef.label : 'Not answered')
            : s.kind === 'contact' ? [c2.name, c2.company, c2.email, c2.phone, c2.city].filter(Boolean).join(' · ')
              : fmt(state.answers[s.id])));
        row.appendChild(el('span', 'review__edit', 'Edit'));
        row.addEventListener('click', function () { state.step = i; render(); });
        list.appendChild(row);
      });
      step.appendChild(list);
    }

    intakeRoot.appendChild(step);

    if (state.error) intakeRoot.appendChild(el('p', 'form-error', state.error));

    /* nav */
    var nav = el('div', 'step-nav');
    var back2 = el('button', 'step-nav__back', '← Back');
    back2.type = 'button';
    back2.style.visibility = idx === 0 ? 'hidden' : 'visible';
    back2.addEventListener('click', function () {
      state.step = Math.max(0, state.step - 1);
      state.error = '';
      render();
    });
    nav.appendChild(back2);

    var next = el('button', 'btn-solid');
    next.type = 'button';
    next.style.visibility = q.kind === 'path' ? 'hidden' : 'visible';
    next.addEventListener('click', onNext);
    nav.appendChild(next);
    intakeRoot.appendChild(nav);

    function syncNav() {
      var ok = answered(q);
      next.textContent = q.kind === 'review' ? (state.sending ? 'Sending…' : 'Send') : 'Continue';
      next.disabled = !ok || state.sending;
      next.style.opacity = ok && !state.sending ? '1' : '0.4';
    }

    async function onNext() {
      if (!answered(q) || state.sending) return;
      if (q.kind !== 'review') { state.step += 1; state.error = ''; render(); return; }

      state.sending = true; state.error = ''; syncNav();
      var contact = state.answers.contact || {};
      var payload = {
        enquiry: pathDef ? pathDef.label : '',
        _subject: 'Re. website: intake from ' + (contact.name || 'unknown'),
        source: 'Re. landing page (intake)'
      };
      all.forEach(function (s) {
        if (s.kind !== 'path' && s.kind !== 'contact' && s.kind !== 'review') {
          payload[s.title.replace(/\?$/, '')] = fmt(state.answers[s.id]);
        }
      });
      Object.assign(payload, contact);
      try {
        await post(ENDPOINTS.intake, payload);
        state.done = true;
      } catch (_) {
        state.error = FALLBACK;
      } finally {
        state.sending = false;
        render();
      }
    }

    syncNav();
  }

  render();
})();
