/* NurseDose GH - dose calculator. Works in the browser and in Node.
   Formula:  dose to give = Ordered / Stock x Volume
   For learning only. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./units.js'));
  } else {
    root.NurseDose = root.NurseDose || {};
    root.NurseDose.calculator = factory(root.NurseDose.units);
  }
}(typeof self !== 'undefined' ? self : this, function (units) {

  // Show up to 2 decimal places and drop trailing zeros: 2.50 -> 2.5, 1.00 -> 1
  function fmt(n) {
    return String(Number(n.toFixed(2)));
  }

  function isPositiveNumber(n) {
    return typeof n === 'number' && isFinite(n) && n > 0;
  }

  /*
    input = {
      form: 'liquid' | 'tablet'      (default 'liquid')
      ordered: number, orderedUnit: 'mg' | 'g' | 'mcg' | other
      stock: number,   stockUnit: same options
      volume: number                  (ml in the bottle/ampoule; not used for tablets)
    }
    returns { ok:true, answer, answerText, unit, steps[], warnings[] }
         or { ok:false, errors[] }
  */
  function calculateDose(input) {
    var errors = [];
    var form = input && input.form === 'tablet' ? 'tablet' : 'liquid';
    var ordered = input ? input.ordered : NaN;
    var stock = input ? input.stock : NaN;
    var volume = form === 'tablet' ? 1 : (input ? input.volume : NaN);

    if (!isPositiveNumber(ordered)) errors.push('Enter the ordered dose as a number above 0.');
    if (!isPositiveNumber(stock)) errors.push('Enter the stock dose as a number above 0.');
    if (form === 'liquid' && !isPositiveNumber(volume)) errors.push('Enter the stock volume (ml) as a number above 0.');

    var orderedUnit = units.normalize(input && input.orderedUnit);
    var stockUnit = units.normalize(input && input.stockUnit);
    if (!orderedUnit || !stockUnit) errors.push('Choose a unit for both the order and the stock.');

    if (errors.length) return { ok: false, errors: errors };

    // Put the ordered dose into the same unit as the stock.
    var conv = units.convert(ordered, orderedUnit, stockUnit);
    if (!conv.ok) return { ok: false, errors: [conv.error] };

    var orderedInStock = conv.value;
    var raw = orderedInStock / stock * volume;
    var answer = Number(raw.toFixed(2));
    var warnings = [];
    var steps = [];

    var stockText = form === 'tablet'
      ? fmt(stock) + ' ' + stockUnit + ' per tablet'
      : fmt(stock) + ' ' + stockUnit + ' in ' + fmt(volume) + ' ml';

    steps.push({ title: 'Read the question', text: 'Ordered: ' + fmt(ordered) + ' ' + orderedUnit + '. Stock: ' + stockText + '.' });

    if (conv.converted) {
      steps.push({
        title: 'Make the units match',
        text: fmt(ordered) + ' ' + orderedUnit + ' = ' + fmt(orderedInStock) + ' ' + stockUnit
      });
    }

    if (form === 'tablet') {
      steps.push({ title: 'Formula', text: 'Ordered \u00F7 Stock = number of tablets' });
      steps.push({ title: 'Substitute', text: fmt(orderedInStock) + ' \u00F7 ' + fmt(stock) });
    } else {
      steps.push({ title: 'Formula', text: 'Ordered \u00F7 Stock \u00D7 Volume' });
      steps.push({ title: 'Substitute', text: fmt(orderedInStock) + ' \u00F7 ' + fmt(stock) + ' \u00D7 ' + fmt(volume) });
    }

    var unitLabel = form === 'tablet' ? (answer === 1 ? 'tablet' : 'tablets') : 'ml';
    var answerText = fmt(answer) + ' ' + unitLabel;
    steps.push({ title: 'Answer', text: answerText });

    if (Math.abs(raw - answer) > 1e-9) {
      warnings.push('The answer is rounded to 2 decimal places.');
    }
    if (form === 'tablet' && Math.round(answer * 2) !== answer * 2) {
      warnings.push('Tablets are usually given whole or as a half. Re-check the numbers and ask your tutor.');
    }
    if (answer <= 0) {
      warnings.push('The answer rounds to 0. Re-check the numbers.');
    }

    return { ok: true, answer: answer, answerText: answerText, unit: unitLabel, steps: steps, warnings: warnings };
  }

  return { calculateDose: calculateDose, fmt: fmt };
}));
