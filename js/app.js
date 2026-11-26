/* NurseDose GH - calculator screen and shared display helpers */
(function () {
  var calc = window.NurseDose.calculator;

  var form = document.getElementById('calc-form');
  var resultEl = document.getElementById('result');
  var volumeRow = document.getElementById('volumeRow');
  var clearBtn = document.getElementById('clear');

  function currentForm() {
    return form.elements['form'].value; // 'liquid' or 'tablet'
  }

  function updateFormType() {
    volumeRow.hidden = currentForm() === 'tablet';
    resultEl.textContent = '';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Draw a calculator result (answer, warnings, steps) or its errors into any container.
  function renderResult(container, r) {
    container.textContent = '';

    if (!r.ok) {
      var box = el('div', 'msg error');
      box.setAttribute('role', 'alert');
      box.appendChild(el('strong', null, 'Check your numbers'));
      var eul = el('ul');
      r.errors.forEach(function (e) { eul.appendChild(el('li', null, e)); });
      box.appendChild(eul);
      container.appendChild(box);
      return;
    }

    var card = el('div', 'answer-card');
    card.appendChild(el('span', 'give', 'Give'));
    card.appendChild(el('span', 'big', r.answerText));
    container.appendChild(card);
    container.appendChild(el('p', 'learn-note', 'Learning aid only. Check with your tutor.'));

    if (r.warnings.length) {
      var warn = el('div', 'msg warn');
      var wul = el('ul');
      r.warnings.forEach(function (w) { wul.appendChild(el('li', null, w)); });
      warn.appendChild(wul);
      container.appendChild(warn);
    }

    var list = el('ol', 'working');
    r.steps.forEach(function (s) {
      var li = el('li');
      li.appendChild(el('span', 'step-title', s.title));
      li.appendChild(el('span', 'step-text', s.text));
      if (s.why) li.appendChild(el('span', 'step-why', s.why));
      list.appendChild(li);
    });
    container.appendChild(el('h3', 'working-head', 'How we got it'));
    container.appendChild(list);
  }

  function num(id) {
    return Number(document.getElementById(id).value);
  }

  // Put a practice question's numbers into the calculator.
  function fillCalculator(q) {
    form.elements['form'].value = q.form;
    updateFormType();
    document.getElementById('ordered').value = q.ordered;
    document.getElementById('orderedUnit').value = q.orderedUnit;
    document.getElementById('stock').value = q.stock;
    document.getElementById('stockUnit').value = q.stockUnit;
    document.getElementById('volume').value = q.form === 'liquid' ? q.volume : '';
    if (window.NurseDose.nav) window.NurseDose.nav.go('calculator');
    document.getElementById('calc-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var r = calc.calculateDose({
      form: currentForm(),
      ordered: num('ordered'),
      orderedUnit: document.getElementById('orderedUnit').value,
      stock: num('stock'),
      stockUnit: document.getElementById('stockUnit').value,
      volume: num('volume')
    });
    renderResult(resultEl, r);
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  Array.prototype.forEach.call(form.elements['form'], function (radio) {
    radio.addEventListener('change', updateFormType);
  });

  clearBtn.addEventListener('click', function () {
    form.reset();
    updateFormType();
    document.getElementById('ordered').focus();
  });

  window.NurseDose.ui = { el: el, renderResult: renderResult, fillCalculator: fillCalculator };

  updateFormType();
})();
