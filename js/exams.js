/* NurseDose GH - Exam mode: timed, marked at the end, with weak areas. */
(function () {
  var NS = window.NurseDose;
  var calc = NS.calculator;
  var logic = NS.examlogic;
  var ui = NS.ui;
  var qs = NS.questions;
  var el = ui.el;

  var STORE_KEY = 'nd_exam';
  var CATS = [
    { key: 'all', label: 'Mixed', count: 20 },
    { key: 'tablets', label: 'Tablets', count: 10 },
    { key: 'syrups', label: 'Syrups', count: 10 },
    { key: 'injections', label: 'Injections', count: 10 }
  ];

  var setupEl = document.getElementById('ex-setup');
  var quizEl = document.getElementById('ex-quiz');
  var resultsEl = document.getElementById('ex-results');

  var bank = [];
  var category = 'all';
  var exam = null;          // the exam in progress
  var lastResults = null;   // the last finished exam (kept in memory for this visit)
  var timerId = null;
  var announced = {};

  /* ---------- small helpers ---------- */
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function poolFor(cat) { return bank.filter(function (q) { return cat === 'all' || q.category === cat; }); }
  function catInfo(key) { return CATS.filter(function (c) { return c.key === key; })[0]; }
  function examSize(cat) { return Math.min(catInfo(cat).count, poolFor(cat).length); }

  function show(which) {
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
  function minutesText(sec) {
    var m = Math.round(sec / 60);
    return m + (m === 1 ? ' minute' : ' minutes');
  }

  /* ---------- saving, so a reload does not lose the exam ---------- */
  function save() {
    if (!exam) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        ids: exam.items.map(function (q) { return q.id; }),
        answers: exam.answers, idx: exam.idx, endAt: exam.endAt, startedAt: exam.startedAt, category: exam.category
      }));
    } catch (e) { /* storage blocked: the exam still works, it just cannot be resumed */ }
  }
  function clearSaved() { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } }
  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  /* ---------- setup ---------- */
  function renderSetup() {
    setupEl.textContent = '';
    setupEl.appendChild(el('p', 'muted', 'A timed test. You see no feedback until you finish. Then you get your score, your weak areas and the worked steps.'));
    setupEl.appendChild(el('h2', 'pm-label', 'Choose your exam'));

    var chips = el('div', 'chips');
    CATS.forEach(function (c) {
      var b = el('button', 'chip', c.label);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(c.key === category));
      b.addEventListener('click', function () { category = c.key; renderSetup(); });
      chips.appendChild(b);
    });
    setupEl.appendChild(chips);

    var n = bank.length ? examSize(category) : 0;
    var secs = logic.totalSeconds(n);
    var info = el('p', 'ex-info', n ? n + ' questions \u00B7 ' + minutesText(secs) : 'Loading questions\u2026');
    setupEl.appendChild(info);

    var rules = el('ul', 'ex-rules');
    ['One timer for the whole exam.', 'You can go back and change answers before you submit.', 'Unanswered questions count as wrong.', 'The exam is submitted automatically when time is up.'].forEach(function (t) {
      rules.appendChild(el('li', null, t));
    });
    setupEl.appendChild(rules);

    var start = el('button', 'primary install-btn', n ? 'Start exam' : 'Loading\u2026');
    start.type = 'button';
    start.disabled = !n;
    start.addEventListener('click', function () { begin(category); });
    setupEl.appendChild(start);
    setupEl.appendChild(el('p', 'muted pm-note', 'Questions marked Draft are still waiting for tutor review.'));
  }

  function begin(cat) {
    var n = examSize(cat);
    var now = Date.now();
    exam = {
      category: cat,
      items: shuffle(poolFor(cat)).slice(0, n),
      answers: [],
      idx: 0,
      startedAt: now,
      endAt: now + logic.totalSeconds(n) * 1000,
      finished: false
    };
    exam.items.forEach(function () { exam.answers.push(''); });
    announced = {};
    save();
    renderQuiz();
    startTimer();
  }

  /* ---------- timer ---------- */
  function startTimer() {
    stopTimer();
    tick();
    timerId = setInterval(tick, 500);
  }
  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }
  function tick() {
    if (!exam || exam.finished) { stopTimer(); return; }
    var left = exam.endAt - Date.now();
    var timerEl = document.getElementById('ex-timer');
    if (timerEl) {
      timerEl.textContent = logic.clock(left);
      timerEl.classList.toggle('ex-low', left <= 60000);
    }
    var secs = Math.ceil(left / 1000);
    [300, 60, 30].forEach(function (mark) {
      if (secs <= mark && !announced[mark] && left > 0) {
        announced[mark] = true;
        var live = document.getElementById('ex-live');
        if (live) live.textContent = mark >= 60 ? (mark / 60) + (mark === 60 ? ' minute' : ' minutes') + ' left' : mark + ' seconds left';
      }
    });
    if (left <= 0) submit(true);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });

  /* ---------- the exam screen ---------- */
  function renderQuiz() {
    show('quiz');
    quizEl.textContent = '';
    var n = exam.items.length;

    var top = el('div', 'pm-top');
    var count = el('span', 'pm-count', '');
    count.id = 'ex-count';
    top.appendChild(count);
    var timer = el('span', 'ex-timer', logic.clock(exam.endAt - Date.now()));
    timer.id = 'ex-timer';
    timer.setAttribute('role', 'timer');
    timer.setAttribute('aria-label', 'Time left');
    top.appendChild(timer);
    quizEl.appendChild(top);

    var live = el('div', 'sr');
    live.id = 'ex-live';
    live.setAttribute('aria-live', 'polite');
    quizEl.appendChild(live);

    var grid = el('div', 'ex-grid');
    grid.id = 'ex-grid';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Jump to a question');
    quizEl.appendChild(grid);

    var card = el('div', 'pm-card');
    card.id = 'ex-card';
    quizEl.appendChild(card);

    var nav = el('div', 'ex-nav');
    nav.appendChild(button('Previous', 'ghost', function () { goTo(exam.idx - 1); }));
    nav.appendChild(button('Next', 'ghost', function () { goTo(exam.idx + 1); }));
    quizEl.appendChild(nav);

    quizEl.appendChild(button('Submit exam', 'primary ex-submit', showConfirm));

    var confirmBox = el('div', 'ex-confirm');
    confirmBox.id = 'ex-confirm';
    confirmBox.hidden = true;
    quizEl.appendChild(confirmBox);

    drawGrid();
    drawQuestion();
  }

  function answeredCount() {
    return exam.answers.filter(function (a) { return String(a).trim() !== ''; }).length;
  }

  function drawGrid() {
    var grid = document.getElementById('ex-grid');
    grid.textContent = '';
    exam.items.forEach(function (q, i) {
      var done = String(exam.answers[i]).trim() !== '';
      var b = el('button', 'ex-qbtn' + (done ? ' done' : '') + (i === exam.idx ? ' current' : ''), String(i + 1));
      b.type = 'button';
      b.setAttribute('aria-label', 'Question ' + (i + 1) + (done ? ', answered' : ', not answered'));
      if (i === exam.idx) b.setAttribute('aria-current', 'step');
      b.addEventListener('click', function () { goTo(i); });
      grid.appendChild(b);
    });
  }

  function drawQuestion() {
    var q = exam.items[exam.idx];
    var n = exam.items.length;
    document.getElementById('ex-count').textContent = 'Question ' + (exam.idx + 1) + ' of ' + n;

    var card = document.getElementById('ex-card');
    card.textContent = '';
    card.appendChild(el('h2', 'q-drug', q.drug));
    card.appendChild(el('p', 'q-text', questionText(q)));

    var label = el('label', null, 'Your answer');
    label.setAttribute('for', 'ex-input');
    label.className = 'ex-label';
    card.appendChild(label);
    var pair = el('div', 'pair single pm-pair');
    var input = el('input');
    input.id = 'ex-input';
    input.type = 'text';
    input.setAttribute('inputmode', 'decimal');
    input.setAttribute('autocomplete', 'off');
    input.placeholder = 'e.g. 2.5';
    input.value = exam.answers[exam.idx];
    input.addEventListener('input', function () {
      exam.answers[exam.idx] = input.value;
      save();
      drawGrid();
    });
    pair.appendChild(input);
    pair.appendChild(el('span', 'suffix', q.form === 'tablet' ? 'tablets' : 'ml'));
    card.appendChild(pair);

    var btns = quizEl.querySelectorAll('.ex-nav button');
    btns[0].disabled = exam.idx === 0;
    btns[1].disabled = exam.idx === n - 1;
  }

  function goTo(i) {
    if (i < 0 || i >= exam.items.length) return;
    exam.idx = i;
    hideConfirm();
    save();
    drawGrid();
    drawQuestion();
    document.getElementById('ex-input').focus();
  }

  /* ---------- submit ---------- */
  function hideConfirm() {
    var box = document.getElementById('ex-confirm');
    if (box) { box.hidden = true; box.textContent = ''; }
  }
  function showConfirm() {
    var box = document.getElementById('ex-confirm');
    box.textContent = '';
    var n = exam.items.length, a = answeredCount();
    box.appendChild(el('p', 'ex-confirm-text', a < n
      ? 'You have answered ' + a + ' of ' + n + '. Unanswered questions count as wrong. Submit now?'
      : 'You have answered all ' + n + ' questions. Submit now?'));
    var row = el('div', 'ex-confirm-row');
    row.appendChild(button('Keep going', 'ghost', hideConfirm));
    row.appendChild(button('Submit', 'primary', function () { submit(false); }));
    box.appendChild(row);
    box.appendChild(button('Cancel exam', 'ghost ex-cancel', function () {
      stopTimer(); exam = null; clearSaved(); renderSetup(); show('setup');
    }));
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function submit(timeUp) {
    if (!exam || exam.finished) return;
    exam.finished = true;
    stopTimer();
    clearSaved();
    var results = logic.gradeExam(exam.items, exam.answers);
    lastResults = {
      results: results,
      analysis: logic.analyse(results),
      category: exam.category,
      timeUp: !!timeUp,
      usedMs: Math.min(Date.now(), exam.endAt) - exam.startedAt,
      allowedMs: exam.endAt - exam.startedAt
    };
    exam = null;
    renderResults();
  }

  /* ---------- results ---------- */
  function renderResults() {
    show('results');
    resultsEl.textContent = '';
    var r = lastResults, a = r.analysis;

    if (r.timeUp) resultsEl.appendChild(el('p', 'ex-banner', 'Time is up. Your answers were submitted for you.'));

    var card = el('div', 'pm-result');
    card.appendChild(el('span', 'give', 'Your score'));
    card.appendChild(el('span', 'big', a.correct + ' of ' + a.total));
    card.appendChild(el('span', 'pm-msg', a.percent + '%. ' + a.message));
    card.appendChild(el('span', 'ex-time', 'Time used: ' + logic.clock(r.usedMs) + ' of ' + logic.clock(r.allowedMs)));
    resultsEl.appendChild(card);

    var types = Object.keys(a.byType);
    if (types.length > 1) {
      resultsEl.appendChild(el('h2', 'pm-label', 'By type'));
      var dl = el('dl', 'steps');
      var names = { tablets: 'Tablets', syrups: 'Syrups', injections: 'Injections' };
      types.forEach(function (k) {
        var row = el('div');
        row.appendChild(el('dt', null, names[k] || k));
        row.appendChild(el('dd', null, a.byType[k].right + ' of ' + a.byType[k].total));
        dl.appendChild(row);
      });
      resultsEl.appendChild(dl);
    }

    resultsEl.appendChild(el('h2', 'pm-label', 'Your weak areas'));
    if (a.weak.length || a.mistakes.length) {
      if (a.weak.length) {
        var ul = el('ul', 'ex-weak');
        a.weak.forEach(function (w) { ul.appendChild(el('li', null, w)); });
        resultsEl.appendChild(ul);
      }
      if (a.mistakes.length) {
        resultsEl.appendChild(el('p', 'muted ex-sub', 'Most common mistakes'));
        var ml = el('ul', 'ex-weak');
        a.mistakes.forEach(function (m) { ml.appendChild(el('li', null, m.label + ' (' + m.count + ')')); });
        resultsEl.appendChild(ml);
      }
    } else {
      resultsEl.appendChild(el('p', null, 'None. Every answer was right.'));
    }

    resultsEl.appendChild(el('h2', 'pm-label', 'Review your answers'));
    r.results.forEach(function (x, i) {
      var d = el('details', 'q ex-review ' + x.status);
      var sum = el('summary');
      sum.appendChild(el('span', 'q-drug', (i + 1) + '. ' + x.q.drug));
      sum.appendChild(el('span', 'ex-badge ' + x.status, x.status === 'correct' ? 'Correct' : x.status === 'blank' ? 'No answer' : 'Wrong'));
      d.appendChild(sum);
      d.appendChild(el('p', 'q-text', questionText(x.q)));
      var solution = calc.calculateDose(x.q);
      d.appendChild(el('p', 'ex-yours', x.status === 'blank' ? 'You did not answer. The answer is ' + solution.answerText + '.'
        : 'You typed ' + x.typed + '. The answer is ' + solution.answerText + '.'));
      if (x.status === 'wrong') d.appendChild(el('p', 'ex-hint', x.message));
      var holder = el('div', 'pm-steps');
      ui.renderResult(holder, solution);
      d.appendChild(holder);
      resultsEl.appendChild(d);
    });

    var missed = r.results.filter(function (x) { return x.status !== 'correct'; });
    var actions = el('div', 'pm-actions');
    if (missed.length && NS.practice && NS.practice.startWith) {
      actions.appendChild(button('Practise the ones I missed', 'primary', function () {
        if (NS.nav) NS.nav.go('practice-mode');
        NS.practice.startWith(missed.map(function (x) { return x.q; }), r.category);
      }));
    }
    actions.appendChild(button('Take another exam', missed.length ? 'ghost' : 'primary', function () { begin(r.category); }));
    actions.appendChild(button('Change exam type', 'ghost', function () { lastResults = null; renderSetup(); show('setup'); }));
    actions.appendChild(button('Back to calculator', 'ghost', function () { if (NS.nav) NS.nav.go('calculator'); }));
    resultsEl.appendChild(actions);
    window.scrollTo(0, 0);
  }

  /* ---------- coming back, and wiring ---------- */
  function restore() {
    if (exam || lastResults) return;
    var saved = loadSaved();
    if (!saved || !saved.ids || !bank.length) return;
    var items = saved.ids.map(function (id) {
      return bank.filter(function (q) { return q.id === id; })[0];
    });
    if (items.some(function (q) { return !q; })) { clearSaved(); return; }
    exam = {
      category: saved.category || 'all', items: items, answers: saved.answers || [], idx: saved.idx || 0,
      startedAt: saved.startedAt, endAt: saved.endAt, finished: false
    };
    while (exam.answers.length < items.length) exam.answers.push('');
    if (exam.endAt <= Date.now()) { submit(true); return; }
    announced = {};
    renderQuiz();
    startTimer();
    show('setup');   // stays hidden until the student opens Exam mode
  }

  function onShow() {
    if (exam && !exam.finished) { show('quiz'); tick(); return; }
    if (lastResults) { show('results'); return; }
    renderSetup();
    show('setup');
  }

  NS.exam = { onShow: onShow };

  renderSetup();
  show('setup');
  qs.whenLoaded.then(function () {
    bank = qs.getAll();
    if (!exam && !lastResults) renderSetup();
    restore();
  });
})();
