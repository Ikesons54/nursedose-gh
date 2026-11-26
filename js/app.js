/* NurseDose GH - calculator screen */
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

  function showErrors(errors) {
    resultEl.textContent = '';
    var box = el('div', 'msg error');
    box.setAttribute('role', 'alert');
    box.appendChild(el('strong', null, 'Check your numbers'));
    var ul = el('ul');
    errors.forEach(function (e) { ul.appendChild(el('li', null, e)); });
    box.appendChild(ul);
    resultEl.appendChild(box);
  }

  function showResult(r) {
    resultEl.textContent = '';

    var card = el('div', 'answer-card');
    card.appendChild(el('span', 'give', 'Give'));
    card.appendChild(el('span', 'big', r.answerText));
    resultEl.appendChild(card);

    if (r.warnings.length) {
      var warn = el('div', 'msg warn');
      var ul = el('ul');
      r.warnings.forEach(function (w) { ul.appendChild(el('li', null, w)); });
      warn.appendChild(ul);
      resultEl.appendChild(warn);
    }

    var list = el('ol', 'working');
    r.steps.forEach(function (s) {
      var li = el('li');
      li.appendChild(el('span', 'step-title', s.title));
      li.appendChild(el('span', 'step-text', s.text));
      list.appendChild(li);
    });
    resultEl.appendChild(el('h3', 'working-head', 'How we got it'));
    resultEl.appendChild(list);
  }

  function num(id) {
    return Number(document.getElementById(id).value);
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
    if (r.ok) showResult(r); else showErrors(r.errors);
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

  updateFormType();
})();
