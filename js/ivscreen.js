/* NurseDose GH - IV fluids screen */
(function () {
  var iv = window.NurseDose.iv;
  var ui = window.NurseDose.ui;

  var form = document.getElementById('iv-form');
  var resultEl = document.getElementById('iv-result');
  var hintEl = document.getElementById('iv-hint');
  var timeRow = document.getElementById('iv-time-row');
  var rateRow = document.getElementById('iv-rate-row');
  var dropRow = document.getElementById('iv-drop-row');

  var HINTS = {
    rate: 'Find how many ml must run every hour.',
    drops: 'Find how many drops to count every minute.',
    time: 'Find how long a bag will take to run in.'
  };

  function mode() { return form.elements['ivmode'].value; }

  function update() {
    var m = mode();
    timeRow.hidden = m === 'time';
    dropRow.hidden = m !== 'drops';
    rateRow.hidden = m !== 'time';
    hintEl.textContent = HINTS[m];
    resultEl.textContent = '';
  }

  function num(id) { return Number(document.getElementById(id).value); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var r = iv.calculateIV({
      mode: mode(),
      volume: num('iv-volume'),
      hours: num('iv-hours'),
      minutes: num('iv-minutes'),
      rate: num('iv-rate'),
      dropFactor: num('iv-drop')
    });
    ui.renderResult(resultEl, r);
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  Array.prototype.forEach.call(form.elements['ivmode'], function (radio) {
    radio.addEventListener('change', update);
  });

  document.getElementById('iv-clear').addEventListener('click', function () {
    form.reset();
    update();
    document.getElementById('iv-volume').focus();
  });

  update();
})();
