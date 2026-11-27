/* NurseDose GH - marks a student's typed answer and gives a helpful hint.
   Works in the browser and in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./units.js'));
  } else {
    root.NurseDose = root.NurseDose || {};
    root.NurseDose.grader = factory(root.NurseDose.units);
  }
}(typeof self !== 'undefined' ? self : this, function (units) {

  var TOLERANCE = 0.011;   // answers are rounded to 2 decimal places

  // Reads "2", "2.5", "2,5", "1/2" or "7.5 ml". Returns a number or NaN.
  function parseAnswer(text) {
    var s = String(text === undefined || text === null ? '' : text).trim();
    var frac = s.match(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/);
    if (frac) {
      var a = parseFloat(frac[1].replace(',', '.')), b = parseFloat(frac[2].replace(',', '.'));
      return b === 0 ? NaN : a / b;
    }
    var m = s.match(/^(\d+(?:[.,]\d+)?)/);
    return m ? parseFloat(m[1].replace(',', '.')) : NaN;
  }

  function near(a, b) { return Math.abs(a - b) <= TOLERANCE; }
  function ratioIs(r, target) { return Math.abs(r / target - 1) < 0.02; }

  /*
    q = a practice question { form, ordered, orderedUnit, stock, stockUnit, volume?, expected }
    returns { status: 'correct' | 'close' | 'wrong' | 'invalid', title, message, value }
  */
  function gradeAnswer(q, text) {
    var value = parseAnswer(text);
    if (!isFinite(value) || value <= 0) {
      return { status: 'invalid', reason: 'invalid', title: 'Check your answer', message: 'Type your answer as a number above 0, for example 2.5.', value: value };
    }

    var expected = q.expected;
    if (near(value, expected)) {
      return { status: 'correct', reason: null, title: 'Correct', message: 'Well done. Your answer matches.', value: value };
    }

    var isLiquid = q.form !== 'tablet';
    var volume = isLiquid ? q.volume : 1;

    // Close, but not rounded the way the app rounds (2 decimal places)
    if (Math.abs(value - expected) <= Math.max(0.05, expected * 0.005)) {
      return { status: 'close', reason: 'rounding', title: 'Very close', message: 'Check your rounding. Answers here are rounded to 2 decimal places.', value: value };
    }

    // Common mistakes, most specific first
    var hint = null;
    var reason = 'other';
    var sameUnits = units.normalize(q.orderedUnit) === units.normalize(q.stockUnit);

    var unconverted = q.ordered / q.stock * volume;          // forgot to change the units
    var inverted = q.stock / q.ordered * volume;             // stock over ordered
    var noVolume = q.ordered / q.stock;                      // forgot to multiply by volume

    if (!sameUnits && near(value, unconverted) && !near(unconverted, expected)) {
      hint = 'You may have forgotten to make the units match first. Change the ordered dose to the unit on the label.';
      reason = 'units';
    } else if (sameUnits && near(value, inverted) && !near(inverted, expected)) {
      hint = 'It looks like you divided the wrong way round. Ordered goes on top and stock goes underneath.';
      reason = 'inverted';
    } else if (isLiquid && sameUnits && near(value, noVolume) && !near(noVolume, expected)) {
      hint = 'You may have forgotten the last step: multiply by the volume the stock comes in.';
      reason = 'volume';
    } else {
      var r = value / expected;
      if (ratioIs(r, 10)) { hint = 'Your answer is 10 times too big. Check your decimal point.'; reason = 'decimal'; }
      else if (ratioIs(r, 0.1)) { hint = 'Your answer is 10 times too small. Check your decimal point.'; reason = 'decimal'; }
      else if (ratioIs(r, 100)) { hint = 'Your answer is 100 times too big. Check your decimal point.'; reason = 'decimal'; }
      else if (ratioIs(r, 0.01)) { hint = 'Your answer is 100 times too small. Check your decimal point.'; reason = 'decimal'; }
      else if (ratioIs(r, 1000)) { hint = 'Your answer is 1000 times too big. Check the unit conversion between g, mg and mcg.'; reason = 'conversion'; }
      else if (ratioIs(r, 0.001)) { hint = 'Your answer is 1000 times too small. Check the unit conversion between g, mg and mcg.'; reason = 'conversion'; }
    }

    return {
      status: 'wrong',
      reason: reason,
      title: 'Not quite',
      message: hint || 'Look at the steps below and see where your working differs.',
      value: value
    };
  }

  return { gradeAnswer: gradeAnswer, parseAnswer: parseAnswer };
}));
