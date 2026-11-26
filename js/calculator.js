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

  function step(title, text, why) {
    return { title: title, text: text, why: why };
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
    Each step is { title, text, why }.
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
    var isTablet = form === 'tablet';

    var stockText = isTablet
      ? fmt(stock) + ' ' + stockUnit + ' in each tablet'
      : fmt(stock) + ' ' + stockUnit + ' in every ' + fmt(volume) + ' ml';

    steps.push(step(
      'Read the question',
      'Ordered: ' + fmt(ordered) + ' ' + orderedUnit + '. Stock: ' + stockText + '.',
      'Ordered is what the doctor wants the patient to get. Stock is what the label says the medicine contains.'
    ));

    if (conv.converted) {
      steps.push(step(
        'Make the units match',
        fmt(ordered) + ' ' + orderedUnit + ' = ' + fmt(orderedInStock) + ' ' + stockUnit,
        'You can only compare like with like. Remember: 1 g = 1000 mg and 1 mg = 1000 mcg. Change the ordered dose to the unit on the label.'
      ));
    }

    if (isTablet) {
      steps.push(step(
        'Formula',
        'Ordered \u00F7 Stock = number of tablets',
        'This tells you how many tablets hold the dose that was ordered.'
      ));
      steps.push(step(
        'Put in the numbers',
        fmt(orderedInStock) + ' \u00F7 ' + fmt(stock),
        'Ordered goes on top, stock goes underneath.'
      ));
    } else {
      steps.push(step(
        'Formula',
        'Ordered \u00F7 Stock \u00D7 Volume',
        'Ordered \u00F7 Stock tells you what fraction of the stock you need. Multiplying by the volume turns that fraction into ml.'
      ));
      steps.push(step(
        'Put in the numbers',
        fmt(orderedInStock) + ' \u00F7 ' + fmt(stock) + ' \u00D7 ' + fmt(volume),
        'Ordered goes on top, stock goes underneath, then multiply by the volume the stock comes in.'
      ));
    }

    var unitLabel = isTablet ? (answer === 1 ? 'tablet' : 'tablets') : 'ml';
    var answerText = fmt(answer) + ' ' + unitLabel;
    steps.push(step('Answer', answerText, 'This is the amount to give.'));

    // Does the answer make sense? Compare the order with one full stock unit.
    var ratio = orderedInStock / stock;
    var oneUnit = isTablet ? 'one tablet' : 'the full ' + fmt(volume) + ' ml';
    var sense;
    if (Math.abs(ratio - 1) < 1e-9) {
      sense = 'The order is the same as the stock, so you give ' + oneUnit + '.';
    } else if (ratio < 1) {
      sense = 'The order is less than the stock, so you give less than ' + oneUnit + '. ' + answerText + ' fits that.';
    } else {
      sense = 'The order is more than the stock, so you give more than ' + oneUnit + '. ' + answerText + ' fits that.';
    }
    steps.push(step(
      'Check it makes sense',
      sense,
      'Always ask: is this answer sensible? A quick check can catch a wrong decimal point.'
    ));

    if (Math.abs(raw - answer) > 1e-9) {
      warnings.push('The answer is rounded to 2 decimal places.');
    }
    if (isTablet && Math.round(answer * 2) !== answer * 2) {
      warnings.push('Tablets are usually given whole or as a half. Re-check the numbers and ask your tutor.');
    }
    if (answer <= 0) {
      warnings.push('The answer rounds to 0. Re-check the numbers.');
    }

    return { ok: true, answer: answer, answerText: answerText, unit: unitLabel, steps: steps, warnings: warnings };
  }

  return { calculateDose: calculateDose, fmt: fmt };
}));
