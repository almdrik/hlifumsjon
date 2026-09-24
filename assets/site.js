/* Hlíf umsjón – virkni síðunnar (FAQ, val í formi og sending fyrirspurna). */
(function () {
  'use strict';

  // Fyrirspurnir eru sendar í gegnum FormSubmit (ókeypis, enginn aðgangur).
  // Eftir virkjun má skipta netfanginu út fyrir dulkóðaða auðkennið sem FormSubmit sendir.
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/adrikardsdottir@gmail.com';

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- FAQ ---------- */
  var triggers = document.querySelectorAll('.accordion-trigger');
  function setOpen(btn, open) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    clearTimeout(panel._t);
    if (open) {
      panel.hidden = false;
      panel.style.height = '0px';
      void panel.offsetHeight; // þvinga endurútreikning svo hreyfingin virki
      panel.style.height = panel.scrollHeight + 'px';
      panel._t = setTimeout(function () { panel.style.height = ''; }, 230);
    } else {
      panel.style.height = panel.scrollHeight + 'px';
      void panel.offsetHeight;
      panel.style.height = '0px';
      panel._t = setTimeout(function () { panel.hidden = true; panel.style.height = ''; }, 230);
    }
  }
  Array.prototype.forEach.call(triggers, function (btn) {
    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      Array.prototype.forEach.call(triggers, function (other) {
        if (other !== btn && other.getAttribute('aria-expanded') === 'true') setOpen(other, false);
      });
      setOpen(btn, !isOpen);
    });
  });

  /* ---------- Form ---------- */
  var form = document.getElementById('quote-form');
  if (!form) return;

  // Radio-flögur (stærð eignar, áhugi á mati)
  form.querySelectorAll('fieldset[data-group="radio"]').forEach(function (fs) {
    fs.addEventListener('change', function () {
      fs.querySelectorAll('label.chip').forEach(function (l) {
        l.setAttribute('data-active', l.querySelector('input').checked ? 'true' : 'false');
      });
      clearError(fs);
    });
  });

  // Fjölval (fleira en húsnæði)
  form.querySelectorAll('fieldset[data-group="multi"] button.chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('data-active', on ? 'true' : 'false');
    });
  });

  // Kvarðar 1–5
  var OFF = 'border-border bg-background text-muted-foreground hover:border-foreground/30';
  var ON = 'border-primary bg-primary text-primary-foreground';
  var BASE = 'flex h-11 w-11 items-center justify-center rounded-full border text-sm transition-colors ';
  form.querySelectorAll('.scale-buttons').forEach(function (wrap) {
    for (var i = 1; i <= 5; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = String(i);
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', wrap.getAttribute('data-label') + ': ' + i);
      b.className = BASE + OFF;
      wrap.appendChild(b);
    }
    wrap.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t) return;
      var wasOn = t.getAttribute('aria-pressed') === 'true';
      wrap.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', 'false');
        b.className = BASE + OFF;
      });
      if (!wasOn) {
        t.setAttribute('aria-pressed', 'true');
        t.className = BASE + ON;
      }
    });
  });

  function errorEl(container) {
    return container.querySelector('.field-error');
  }
  function showError(container, msg) {
    var el = errorEl(container);
    if (el) { el.textContent = msg; el.hidden = false; }
    var input = container.querySelector('input.field-input, textarea');
    if (input) input.setAttribute('aria-invalid', 'true');
  }
  function clearError(container) {
    var el = errorEl(container);
    if (el) { el.textContent = ''; el.hidden = true; }
    var input = container.querySelector('input.field-input, textarea');
    if (input) input.removeAttribute('aria-invalid');
  }
  form.querySelectorAll('input.field-input').forEach(function (inp) {
    inp.addEventListener('input', function () { clearError(inp.closest('label')); });
  });

  function validate() {
    var firstBad = null;
    form.querySelectorAll('input.field-input[data-required]').forEach(function (inp) {
      var label = inp.closest('label');
      var v = inp.value.trim();
      var bad = !v || (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || (inp.type === 'tel' && v.replace(/\D/g, '').length < 7);
      if (bad) { showError(label, inp.getAttribute('data-required')); firstBad = firstBad || inp; }
      else clearError(label);
    });
    form.querySelectorAll('fieldset[data-required]').forEach(function (fs) {
      if (!fs.querySelector('input:checked')) { showError(fs, fs.getAttribute('data-required')); firstBad = firstBad || fs.querySelector('input'); }
      else clearError(fs);
    });
    if (firstBad) {
      var target = firstBad.closest('label, fieldset') || firstBad;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (firstBad.focus) firstBad.focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  var status = document.getElementById('form-status');
  var success = document.getElementById('form-success');
  var submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.hidden = true;
    if (!validate()) return;
    if (form.querySelector('input[name="_honey"]').value) return;

    var data = new FormData(form);
    form.querySelectorAll('fieldset[data-group="multi"]').forEach(function (fs) {
      var picked = Array.prototype.map.call(fs.querySelectorAll('button[aria-pressed="true"]'), function (b) { return b.textContent; });
      data.append(fs.getAttribute('data-name'), picked.length ? picked.join(', ') : '–');
    });
    form.querySelectorAll('fieldset[data-group="scale"]').forEach(function (fs) {
      var on = fs.querySelector('button[aria-pressed="true"]');
      data.append(fs.getAttribute('data-name'), on ? on.textContent : '–');
    });
    data.append('_replyto', form.querySelector('input[name="email"]').value.trim());

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sendi…';

    fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (res.ok && String(res.body.success) !== 'false') {
          form.hidden = true;
          success.hidden = false;
          success.focus({ preventScroll: true });
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          throw new Error('send failed');
        }
      })
      .catch(function () {
        status.textContent = 'Ekki tókst að senda fyrirspurnina. Vinsamlegast reyndu aftur eða hringdu í 699-3765.';
        status.hidden = false;
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Fáðu tilboð';
      });
  });
})();
