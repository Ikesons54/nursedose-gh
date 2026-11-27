/* NurseDose GH - Practice mode: answer first, then get feedback and the worked steps. */
(function () {
  var calc = window.NurseDose.calculator;
  var grader = window.NurseDose.grader;
  var ui = window.NurseDose.ui;
  var qs = window.NurseDose.questions;
  var el = ui.el;

  var LENGTH = 10;
  var CATS = [
    { key: 'all', label: 'Mixed' },
    { key: 'tablets', label: 'Tablets' },
    { key: 'syrups', label: 'Syrups' },
    { key: 'injections', label: 'Injections' }
  ];

  var setupEl = document.getElementById('pm-setup');
  var quizEl = document.getElementById('pm-quiz');
  var resultsEl = document.getElementById('pm-results');

  var bank = [];
  var category = 'all';
  var session = null;

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function poolFor(cat) {
    return bank.filter(function (q) { return cat === 'all' || q.category === cat; });
  }

  function showPanel(which) {
    setupEl.hidden = which !== 'setup';
    quizEl.hidden = which !== 'quiz';
    resultsEl.hidden = which !== 'results';
  }

  function button(text, cls, onClick) {
    var b = el('button', cls, text);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  function questionText(q) {
    var f = calc.fmt;
    if (q.form === 'tablet') {
      return 'The order is ' + f(q.ordered) + ' ' + q.orderedUnit + ' of ' + q.drug.toLowerCase() +
        '. The stock is ' + f(q.stock) + ' ' + q.stockUnit + ' tablets. How many tablets do you give?';
    }
    return 'The order is ' + f(q.ordered) + ' ' + q.orderedUnit + ' of ' + q.drug.toLowerCase() +
      '. The stock is ' + f(q.stock) + ' ' + q.stockUnit + ' in ' + f(q.volume) +
      ' ml. How many ml do you give?';
  }

  /* ---------- setup ---------- */
  function renderSetup() {
    setupEl.textContent = '';
    setupEl.appendChild(el('p', 'muted', 'Answer each question yourself, then get instant feedback and the worked steps.'));
    setupEl.appendChild(el('h2', 'pm-label', 'What do you want to practise?'));

    var chips = el('div', 'chips');
    CATS.forEach(function (c) {
      var count = poolFor(c.key).length;
      var b = el('button', 'chip', c.label + (bank.length ? ' (' + count + ')' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', String(c.key === category));
      b.addEventListener('click', function () { category = c.key; renderSetup(); });
      chips.appendChild(b);
    });
    setupEl.appendChild(chips);

    var n = Math.min(LENGTH, poolFor(category).length);
    var start = el('button', 'primary install-btn', n ? 'Start ' + n + ' questions' : 'Loading questions…');
    start.type = 'button';
    start.disabled = !n;
    start.addEventListener('click', function () { begin(category, poolFor(category)); });
    setupEl.appendChild(start);

    setupEl.appendChild(el('p', 'muted pm-note', 'Questions marked Draft are still waiting for tutor review.'));
  }

  function begin(cat, list) {
    session = { category: cat, items: shuffle(list).slice(0, LENGTH), i: 0, score: 0, results: [], finished: false };
    renderQuestion();
  }

  /* ---------- one question ---------- */
  function renderQuestion() {
    showPanel('quiz');
    quizEl.textContent = '';
    var q = session.items[session.i];
    var total = session.items.length;

    var top = el('div', 'pm-top');
    top.appendChild(el('span', 'pm-count', 'Question ' + (session.i + 1) + ' of ' + total));
    top.appendChild(el('span', 'pm-score', 'Score: ' + session.score));
    quizEl.appendChild(top);

    var bar = el('div', 'pm-bar');
    var fill = el('div', 'pm-fill');
    fill.style.width = Math.round(session.i / total * 100) + '%';
    bar.appendChild(fill);
    quizEl.appendChild(bar);

    var card = el('div', 'pm-card');
    card.appendChild(el('h2', 'q-drug', q.drug));
    card.appendChild(el('p', 'q-text', questionText(q)));
    if (q.status === 'draft') card.appendChild(el('p', 'q-draft', 'Draft: waiting for tutor review'));

    var form = el('form', 'pm-form');
    form.noValidate = true;
    var label = el('label', null, 'Your answer');
    label.setAttribute('for', 'pm-input');
    form.appendChild(label);
    var pair = el('div', 'pair single pm-pair');
    var input = el('input');
    input.id = 'pm-input';
    input.type = 'text';
    input.setAttribute('inputmode', 'decimal');
    input.setAttribute('autocomplete', 'off');
    input.placeholder = 'e.g. 2.5';
    pair.appendChild(input);
    pair.appendChild(el('span', 'suffix', q.form === 'tablet' ? 'tablets' : 'ml'));
    form.appendChild(pair);
    var check = el('button', 'primary pm-check', 'Check answer');
    check.type = 'submit';
    form.appendChild(check);
    card.appendChild(form);

    var fbBox = el('div', 'pm-feedback');
    fbBox.setAttribute('aria-live', 'polite');
    card.appendChild(fbBox);
    quizEl.appendChild(card);

    quizEl.appendChild(button('Stop practice', 'ghost pm-stop', function () {
      session = null;
      renderSetup();
      showPanel('setup');
    }));

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var res = grader.gradeAnswer(q, input.value);
      if (res.status === 'invalid') {
        fbBox.textContent = '';
        var warn = el('div', 'pm-fb wrong');
        warn.appendChild(el('strong', null, res.title));
        warn.appendChild(el('p', null, res.message));
        fbBox.appendChild(warn);
        input.focus();
        return;
      }
      input.disabled = true;
      check.disabled = true;
      if (res.status === 'correct') session.score++;
      session.results.push({ q: q, typed: input.value.trim(), status: res.status });
      showFeedback(fbBox, q, res);
    });

    input.focus();
  }

  function showFeedback(box, q, res) {
    box.textContent = '';
    var solution = calc.calculateDose(q);
    var fb = el('div', 'pm-fb ' + res.status);
    fb.setAttribute('tabindex', '-1');
    fb.appendChild(el('strong', null, res.title));
    fb.appendChild(el('p', null, res.message));
    if (res.status !== 'correct') fb.appendChild(el('p', 'pm-right', 'The answer is ' + solution.answerText + '.'));
    box.appendChild(fb);

    var det = el('details', 'pm-steps');
    det.open = res.status !== 'correct';
    det.appendChild(el('summary', null, 'See the steps'));
    var holder = el('div');
    ui.renderResult(holder, solution);
    det.appendChild(holder);
    box.appendChild(det);

    var last = session.i === session.items.length - 1;
    box.appendChild(button(last ? 'See my results' : 'Next question', 'primary pm-next', function () {
      session.i++;
      if (last) renderResults(); else renderQuestion();
    }));
    fb.focus();
  }

  /* ---------- results ---------- */
  function renderResults() {
    session.finished = true;
    showPanel('results');
    resultsEl.textContent = '';
    var total = session.items.length;
    var pct = Math.round(session.score / total * 100);

    var card = el('div', 'pm-result');
    card.appendChild(el('span', 'give', 'Your score'));
    card.appendChild(el('span', 'big', session.score + ' of ' + total));
    var msg = pct >= 80 ? 'Strong result. Keep practising to stay sharp.'
      : pct >= 50 ? 'Good effort. Go through the steps for the ones you missed.'
      : 'Keep going. Read the steps for each one you missed, then try again.';
    card.appendChild(el('span', 'pm-msg', pct + '%. ' + msg));
    resultsEl.appendChild(card);

    // by type
    var byCat = {};
    session.results.forEach(function (r) {
      var c = byCat[r.q.category] || (byCat[r.q.category] = { right: 0, total: 0 });
      c.total++;
      if (r.status === 'correct') c.right++;
    });
    var names = { tablets: 'Tablets', syrups: 'Syrups', injections: 'Injections' };
    var keys = Object.keys(byCat);
    if (keys.length > 1) {
      resultsEl.appendChild(el('h2', 'pm-label', 'By type'));
      var dl = el('dl', 'steps');
      keys.forEach(function (k) {
        var row = el('div');
        row.appendChild(el('dt', null, names[k] || k));
        row.appendChild(el('dd', null, byCat[k].right + ' of ' + byCat[k].total));
        dl.appendChild(row);
      });
      resultsEl.appendChild(dl);
    }

    var missed = session.results.filter(function (r) { return r.status !== 'correct'; });
    if (missed.length) {
      resultsEl.appendChild(el('h2', 'pm-label', 'To go over again'));
      var ul = el('ul', 'pm-missed');
      missed.forEach(function (r) {
        var li = el('li');
        li.appendChild(el('strong', null, r.q.drug));
        li.appendChild(el('span', null, 'You typed ' + r.typed + '. Answer: ' + calc.calculateDose(r.q).answerText + '.'));
        ul.appendChild(li);
      });
      resultsEl.appendChild(ul);
    }

    var actions = el('div', 'pm-actions');
    var cat = session.category;
    if (missed.length) {
      actions.appendChild(button('Practise the ones I missed', 'primary', function () {
        begin(cat, missed.map(function (r) { return r.q; }));
      }));
    }
    actions.appendChild(button('Practise again', missed.length ? 'ghost' : 'primary', function () { begin(cat, poolFor(cat)); }));
    actions.appendChild(button('Change type', 'ghost', function () {
      session = null;
      renderSetup();
      showPanel('setup');
    }));
    actions.appendChild(button('Back to calculator', 'ghost', function () {
      if (window.NurseDose.nav) window.NurseDose.nav.go('calculator');
    }));
    resultsEl.appendChild(actions);
    window.scrollTo(0, 0);
  }

  /* ---------- wiring ---------- */
  function onShow() {
    if (session && !session.finished) { showPanel('quiz'); return; }
    if (session && session.finished) { showPanel('results'); return; }
    renderSetup();
    showPanel('setup');
  }

  window.NurseDose.practice = { onShow: onShow };

  renderSetup();
  showPanel('setup');
  qs.whenLoaded.then(function () {
    bank = qs.getAll();
    if (!session) renderSetup();
  });
})();
