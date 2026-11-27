/* NurseDose GH - opening animation, first-time onboarding, and the Student / Professional choice. */
(function () {
  var NS = window.NurseDose;
  var el = NS.ui.el;
  var mode = NS.mode;

  var splash = document.getElementById('splash');
  var ob = document.getElementById('onboarding');
  var modePill = document.getElementById('modePill');
  var modeBtn = document.getElementById('modeBtn');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ROLES = [
    { value: 'student', title: 'Student', text: 'Nursing, medicine or pharmacy student. Includes practice mode and the question bank.' },
    { value: 'professional', title: 'Nurse or doctor', text: 'Professional mode. Calculators, formulas and sources, without the practice screens.' },
    { value: 'pharmacy', title: 'Pharmacy', text: 'Coming soon.', disabled: true }
  ];

  /* ---------- mode label in the header and menu ---------- */
  function paintMode() {
    var m = mode.get();
    if (modePill) modePill.hidden = m !== 'professional';
    if (modeBtn) modeBtn.textContent = 'Mode: ' + (m === 'professional' ? 'Professional' : 'Student') + ' \u00B7 Change';
  }

  /* ---------- opening animation ---------- */
  function startSplash(done) {
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      splash.classList.add('out');
      setTimeout(function () { splash.hidden = true; }, 400);
      done();
    }
    if (document.documentElement.classList.contains('no-splash')) {
      splash.hidden = true;
      done();
      return;
    }
    try { sessionStorage.setItem('nd_splash', '1'); } catch (e) { /* ignore */ }
    NS.mascot.mount(document.getElementById('splash-mascot'), 'wave', 'mascot-xl');
    splash.addEventListener('click', finish);
    setTimeout(finish, reduced ? 700 : 1900);
  }

  /* ---------- onboarding ---------- */
  var steps = [];
  var stepIndex = 0;
  var single = false;
  var chosen = 'student';
  var acknowledged = false;
  var inertTargets = ['.bar', 'main', 'footer', '#drawer'];

  function setBackgroundInert(on) {
    inertTargets.forEach(function (sel) {
      var node = document.querySelector(sel);
      if (node) node.inert = on;
    });
  }

  function button(text, cls, onClick) {
    var b = el('button', cls, text);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  function close() {
    ob.hidden = true;
    ob.textContent = '';
    setBackgroundInert(false);
  }

  function finish() {
    mode.set(chosen);
    mode.setOnboarded();
    close();
    paintMode();
    if (!single && NS.nav) NS.nav.go('calculator');
  }

  function render() {
    var name = steps[stepIndex];
    ob.textContent = '';
    var panel = el('div', 'ob-panel');

    if (name !== 'role') {
      var m = el('div');
      NS.mascot.mount(m, name === 'hello' ? 'wave' : 'calm', 'mascot-md');
      panel.appendChild(m);
    }

    var title = el('h2', 'ob-title');
    title.id = 'ob-title';
    title.tabIndex = -1;
    panel.appendChild(title);

    if (name === 'hello') {
      title.textContent = 'Hi, I\u2019m Dosi!';
      panel.appendChild(el('p', 'ob-text', 'I help you get drug calculations right, one clear step at a time.'));
    } else if (name === 'inside') {
      title.textContent = 'Everything in one place';
      var ul = el('ul', 'ob-list');
      ['Dose and IV fluid calculators', 'Formulas with worked examples', 'Practice questions with feedback', 'Works without internet'].forEach(function (t) {
        ul.appendChild(el('li', null, t));
      });
      panel.appendChild(ul);
    } else if (name === 'role') {
      title.textContent = single ? 'Change your mode' : 'Who is using the app?';
      var fs = el('fieldset', 'roles');
      fs.appendChild(el('legend', 'sr', 'Choose your mode'));
      ROLES.forEach(function (r) {
        var label = el('label', 'role' + (r.disabled ? ' disabled' : ''));
        var input = el('input');
        input.type = 'radio';
        input.name = 'role';
        input.value = r.value;
        input.disabled = !!r.disabled;
        input.checked = r.value === chosen;
        input.addEventListener('change', function () { chosen = r.value; });
        label.appendChild(input);
        var body = el('span', 'role-body');
        body.appendChild(el('strong', null, r.title));
        body.appendChild(el('small', null, r.text));
        label.appendChild(body);
        fs.appendChild(label);
      });
      panel.appendChild(fs);
      panel.appendChild(el('p', 'ob-fine', 'Your choice is not checked yet. Later, professional access will need verification.'));
    } else if (name === 'safety') {
      title.textContent = 'Before you start';
      panel.appendChild(el('p', 'ob-text', 'NurseDose GH is a learning and checking aid. It does not replace the prescriber\u2019s order, your hospital\u2019s protocol or your tutor.'));
      var row = el('label', 'ob-check');
      var cb = el('input');
      cb.type = 'checkbox';
      cb.checked = acknowledged;
      row.appendChild(cb);
      row.appendChild(el('span', null, 'I understand'));
      panel.appendChild(row);
      cb.addEventListener('change', function () {
        acknowledged = cb.checked;
        next.disabled = !acknowledged;
      });
    }

    // dots (full flow only)
    if (!single) {
      var dots = el('div', 'ob-dots');
      dots.setAttribute('aria-hidden', 'true');
      steps.forEach(function (s, i) { dots.appendChild(el('span', i === stepIndex ? 'on' : '')); });
      panel.appendChild(dots);
    }

    var nav = el('div', 'ob-nav');
    var last = stepIndex === steps.length - 1;
    var next = button(single ? 'Save' : (last ? 'Start' : 'Next'), 'primary', function () {
      if (last) finish(); else { stepIndex++; render(); }
    });
    if (name === 'safety') next.disabled = !acknowledged;
    if (single) {
      nav.appendChild(button('Cancel', 'ghost', close));
    } else if (stepIndex > 0) {
      nav.appendChild(button('Back', 'ghost', function () { stepIndex--; render(); }));
    }
    nav.appendChild(next);
    panel.appendChild(nav);
    panel.appendChild(el('p', 'ob-brand', 'Powered by FWXplus'));

    ob.appendChild(panel);
    title.focus();
  }

  function open(which) {
    single = which === 'role';
    steps = single ? ['role'] : ['hello', 'inside', 'role', 'safety'];
    stepIndex = 0;
    chosen = mode.get();
    acknowledged = false;
    ob.hidden = false;
    setBackgroundInert(true);
    render();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !ob.hidden && single) close();
  });

  /* ---------- wiring ---------- */
  if (modeBtn) {
    modeBtn.addEventListener('click', function () {
      if (NS.nav) NS.nav.closeDrawer(false);
      open('role');
    });
  }
  var replay = document.getElementById('replayBtn');
  if (replay) replay.addEventListener('click', function () { open('all'); });
  NS.mascot.mount(document.getElementById('about-mascot'), 'calm', 'mascot-md');

  mode.onChange(paintMode);
  paintMode();

  startSplash(function () {
    if (!mode.isOnboarded()) open('all');
  });
})();
