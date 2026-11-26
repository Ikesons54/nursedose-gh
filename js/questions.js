/* NurseDose GH - practice question bank */
(function () {
  var calc = window.NurseDose.calculator;
  var ui = window.NurseDose.ui;
  var el = ui.el;

  var CATEGORIES = [
    { key: 'all', label: 'All' },
    { key: 'tablets', label: 'Tablets' },
    { key: 'syrups', label: 'Syrups' },
    { key: 'injections', label: 'Injections' }
  ];
  var FILES = ['tablets', 'syrups', 'injections'];

  var chipsEl = document.getElementById('chips');
  var listEl = document.getElementById('qlist');
  var statusEl = document.getElementById('qstatus');

  var all = [];          // every question, with its category added
  var active = 'all';

  function fmt(n) { return calc.fmt(n); }

  function questionText(q) {
    if (q.form === 'tablet') {
      return 'The order is ' + fmt(q.ordered) + ' ' + q.orderedUnit + ' of ' + q.drug.toLowerCase() +
        '. The stock is ' + fmt(q.stock) + ' ' + q.stockUnit + ' tablets. How many tablets do you give?';
    }
    return 'The order is ' + fmt(q.ordered) + ' ' + q.orderedUnit + ' of ' + q.drug.toLowerCase() +
      '. The stock is ' + fmt(q.stock) + ' ' + q.stockUnit + ' in ' + fmt(q.volume) +
      ' ml. How many ml do you give?';
  }

  function buildCard(q) {
    var d = el('details', 'q');
    var sum = el('summary');
    sum.appendChild(el('span', 'q-drug', q.drug));
    if (q.orderedUnit !== q.stockUnit) sum.appendChild(el('span', 'q-tag', 'Unit conversion'));
    d.appendChild(sum);

    d.appendChild(el('p', 'q-text', questionText(q)));
    if (q.status === 'draft') {
      d.appendChild(el('p', 'q-draft', 'Draft: waiting for tutor review'));
    }

    var actions = el('div', 'q-actions');
    var showBtn = el('button', 'ghost', 'Show worked answer');
    showBtn.type = 'button';
    var tryBtn = el('button', 'ghost', 'Open in calculator');
    tryBtn.type = 'button';
    actions.appendChild(showBtn);
    actions.appendChild(tryBtn);
    d.appendChild(actions);

    var solution = el('div', 'q-solution');
    solution.hidden = true;
    d.appendChild(solution);

    showBtn.addEventListener('click', function () {
      if (solution.hidden) {
        ui.renderResult(solution, calc.calculateDose(q));
        solution.hidden = false;
        showBtn.textContent = 'Hide worked answer';
      } else {
        solution.hidden = true;
        showBtn.textContent = 'Show worked answer';
      }
    });
    tryBtn.addEventListener('click', function () { ui.fillCalculator(q); });
    return d;
  }

  function renderList() {
    listEl.textContent = '';
    var shown = all.filter(function (q) { return active === 'all' || q.category === active; });
    shown.forEach(function (q) { listEl.appendChild(buildCard(q)); });
    statusEl.textContent = shown.length + ' questions';
  }

  function renderChips() {
    chipsEl.textContent = '';
    CATEGORIES.forEach(function (c) {
      var count = c.key === 'all' ? all.length : all.filter(function (q) { return q.category === c.key; }).length;
      var b = el('button', 'chip', c.label + ' (' + count + ')');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(c.key === active));
      b.addEventListener('click', function () {
        active = c.key;
        renderChips();
        renderList();
      });
      chipsEl.appendChild(b);
    });
  }

  function load() {
    statusEl.textContent = 'Loading questions...';
    Promise.all(FILES.map(function (name) {
      return fetch('data/questions/' + name + '.json').then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      });
    })).then(function (sets) {
      sets.forEach(function (set) {
        set.questions.forEach(function (q) { q.category = set.category; all.push(q); });
      });
      renderChips();
      renderList();
    }).catch(function () {
      statusEl.textContent = 'Could not load the questions. Connect to the internet once, then they will work offline.';
    });
  }

  load();
})();
