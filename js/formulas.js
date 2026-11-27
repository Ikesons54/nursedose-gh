/* NurseDose GH - Formula library: search and browse formulas with worked examples. */
(function () {
  var ui = window.NurseDose.ui;
  var el = ui.el;

  var CATS = [
    { key: 'all', label: 'All' },
    { key: 'Doses', label: 'Doses' },
    { key: 'Units', label: 'Units' },
    { key: 'IV fluids', label: 'IV fluids' },
    { key: 'Strengths', label: 'Strengths' }
  ];

  var searchEl = document.getElementById('fl-search');
  var chipsEl = document.getElementById('fl-chips');
  var listEl = document.getElementById('fl-list');
  var statusEl = document.getElementById('fl-status');

  var all = [];
  var active = 'all';

  function haystack(f) {
    return (f.title + ' ' + f.formula + ' ' + f.meaning + ' ' + f.keywords + ' ' + f.category).toLowerCase();
  }

  function matches(f, terms) {
    if (active !== 'all' && f.category !== active) return false;
    var h = f._h;
    for (var i = 0; i < terms.length; i++) {
      if (h.indexOf(terms[i]) === -1) return false;
    }
    return true;
  }

  function buildCard(f) {
    var d = el('details', 'q fl-card');
    var sum = el('summary');
    sum.appendChild(el('span', 'q-drug', f.title));
    sum.appendChild(el('span', 'q-tag fl-cat', f.category));
    d.appendChild(sum);

    d.appendChild(el('p', 'fl-formula', f.formula));
    d.appendChild(el('p', 'q-text', f.meaning));

    var ex = el('div', 'fl-example');
    ex.appendChild(el('span', 'step-title', 'Example'));
    ex.appendChild(el('p', 'fl-q', f.example.question));
    var ol = el('ol', 'fl-steps');
    f.example.steps.forEach(function (s) { ol.appendChild(el('li', null, s)); });
    ex.appendChild(ol);
    ex.appendChild(el('p', 'fl-answer', 'Answer: ' + f.example.answer));
    d.appendChild(ex);

    d.appendChild(el('p', 'fl-tip', 'Remember: ' + f.tip));
    if (f.status === 'draft') d.appendChild(el('p', 'q-draft', 'Draft: waiting for tutor review'));

    if (f.link === 'calculator' || f.link === 'iv') {
      var b = el('button', 'ghost fl-go', f.link === 'iv' ? 'Open the IV calculator' : 'Open the calculator');
      b.type = 'button';
      b.addEventListener('click', function () {
        if (window.NurseDose.nav) window.NurseDose.nav.go(f.link);
      });
      d.appendChild(b);
    }
    return d;
  }

  function render() {
    var raw = searchEl.value.trim().toLowerCase();
    var terms = raw ? raw.split(/\s+/) : [];
    var shown = all.filter(function (f) { return matches(f, terms); });
    listEl.textContent = '';
    shown.forEach(function (f) { listEl.appendChild(buildCard(f)); });
    if (!all.length) return;
    statusEl.textContent = shown.length
      ? shown.length + (shown.length === 1 ? ' formula' : ' formulas')
      : 'No formulas match. Try a shorter word, like "drip" or "kg".';
  }

  function renderChips() {
    chipsEl.textContent = '';
    CATS.forEach(function (c) {
      var count = c.key === 'all' ? all.length : all.filter(function (f) { return f.category === c.key; }).length;
      var b = el('button', 'chip', c.label + ' (' + count + ')');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(c.key === active));
      b.addEventListener('click', function () {
        active = c.key;
        renderChips();
        render();
      });
      chipsEl.appendChild(b);
    });
  }

  searchEl.addEventListener('input', render);

  statusEl.textContent = 'Loading formulas…';
  fetch('data/formulas.json').then(function (res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }).then(function (data) {
    all = data.formulas;
    all.forEach(function (f) { f._h = haystack(f); });
    renderChips();
    render();
  }).catch(function () {
    statusEl.textContent = 'Could not load the formulas. Connect to the internet once, then they will work offline.';
  });
})();
