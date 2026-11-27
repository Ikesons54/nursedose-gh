/* NurseDose GH - IV fluid calculations. Works in the browser and in Node.
   Three jobs:  flow rate (ml/hr),  drops per minute,  time to finish.
   For learning only. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NurseDose = root.NurseDose || {};
    root.NurseDose.iv = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  function fmt(n, dp) {
    return String(Number(n.toFixed(dp === undefined ? 2 : dp)));
  }
  function positive(n) { return typeof n === 'number' && isFinite(n) && n > 0; }
  function notNegative(n) { return typeof n === 'number' && isFinite(n) && n >= 0; }
  function step(title, text, why) { return { title: title, text: text, why: why }; }

  function plural(n, one, many) { return fmt(n) + ' ' + (n === 1 ? one : many); }

  // "8 hours 30 minutes"
  function timeLabel(h, m) {
    var parts = [];
    if (h > 0) parts.push(plural(h, 'hour', 'hours'));
    if (m > 0) parts.push(plural(m, 'minute', 'minutes'));
    return parts.length ? parts.join(' ') : '0 minutes';
  }

  /*
    input = {
      mode: 'rate' | 'drops' | 'time'
      volume: ml
      hours, minutes: the time the fluid should run over   (rate and drops)
      rate: ml per hour                                    (time)
      dropFactor: drops per ml                             (drops)
    }
    returns { ok, label, answer, answerText, steps[], warnings[] } or { ok:false, errors[] }
  */
  function calculateIV(input) {
    var errors = [];
    var mode = input && input.mode;
    var volume = input ? input.volume : NaN;
    var hours = input && input.hours !== undefined ? input.hours : 0;
    var minutes = input && input.minutes !== undefined ? input.minutes : 0;
    var rate = input ? input.rate : NaN;
    var factor = input ? input.dropFactor : NaN;

    if (mode !== 'rate' && mode !== 'drops' && mode !== 'time') {
      return { ok: false, errors: ['Choose what you want to find.'] };
    }
    if (!positive(volume)) errors.push('Enter the volume in ml as a number above 0.');

    if (mode === 'rate' || mode === 'drops') {
      if (!notNegative(hours) || !notNegative(minutes)) errors.push('Enter the time as hours and/or minutes (0 or more).');
      else if (hours * 60 + minutes <= 0) errors.push('Enter the time the fluid should run over.');
    }
    if (mode === 'drops' && !positive(factor)) errors.push('Choose the drop factor (drops per ml) from the giving set packet.');
    if (mode === 'time' && !positive(rate)) errors.push('Enter the flow rate in ml per hour as a number above 0.');

    if (errors.length) return { ok: false, errors: errors };

    var steps = [];
    var warnings = [];
    var totalMin = hours * 60 + minutes;
    var totalHours = totalMin / 60;

    var timeText = timeLabel(hours, minutes);

    if (mode === 'rate') {
      var raw = volume / totalHours;
      var answer = Number(raw.toFixed(1));

      steps.push(step('Read the question', 'Volume: ' + fmt(volume) + ' ml. Time: ' + timeText + '.',
        'Volume is how much fluid is in the bag. Time is how long it should take to run in.'));
      if (minutes > 0) {
        steps.push(step('Change the time to hours', timeText + ' = ' + fmt(totalHours) + ' hours',
          'The formula needs time in hours. Divide the minutes by 60 and add them to the hours.'));
      }
      steps.push(step('Formula', 'Volume \u00F7 Time (hours)', 'This tells you how many ml must run in every hour.'));
      steps.push(step('Put in the numbers', fmt(volume) + ' \u00F7 ' + fmt(totalHours),
        'Volume goes on top, time in hours goes underneath.'));
      steps.push(step('Answer', fmt(answer, 1) + ' ml/hr', 'This is the flow rate to set.'));
      steps.push(step('Check it makes sense',
        fmt(volume) + ' ml \u00F7 ' + fmt(answer, 1) + ' ml/hr = about ' + fmt(volume / answer) + ' hours.',
        'Work backwards. The time you get should match the time ordered.'));
      if (Math.abs(raw - answer) > 1e-9) warnings.push('The answer is rounded to 1 decimal place.');
      return { ok: true, mode: mode, label: 'Flow rate', answer: answer, answerText: fmt(answer, 1) + ' ml/hr', steps: steps, warnings: warnings };
    }

    if (mode === 'drops') {
      var dRaw = volume * factor / totalMin;
      var dAnswer = Math.round(dRaw);

      steps.push(step('Read the question',
        'Volume: ' + fmt(volume) + ' ml. Time: ' + timeText + '. Drop factor: ' + fmt(factor) + ' drops per ml.',
        'The drop factor is printed on the giving set packet. It is how many drops make 1 ml.'));
      if (hours > 0) {
        steps.push(step('Change the time to minutes', timeText + ' = ' + fmt(totalMin) + ' minutes',
          'Drops per minute needs time in minutes. Multiply the hours by 60 and add the minutes.'));
      }
      steps.push(step('Formula', 'Volume \u00D7 Drop factor \u00F7 Time (minutes)',
        'Volume \u00D7 drop factor gives the total number of drops. Dividing by the minutes gives drops in each minute.'));
      steps.push(step('Put in the numbers', fmt(volume) + ' \u00D7 ' + fmt(factor) + ' \u00F7 ' + fmt(totalMin),
        'Use the volume in ml and the time in minutes.'));
      if (Math.abs(dRaw - dAnswer) > 1e-9) {
        steps.push(step('Round to a whole drop', fmt(dRaw) + ' rounds to ' + dAnswer,
          'You cannot count part of a drop, so round to the nearest whole drop.'));
      }
      steps.push(step('Answer', dAnswer + ' drops per minute', 'This is the drip rate to count.'));
      var perHour = dAnswer * 60 / factor;
      steps.push(step('Check it makes sense',
        dAnswer + ' \u00D7 60 \u00F7 ' + fmt(factor) + ' = ' + fmt(perHour) + ' ml in one hour. Over ' + timeText +
        ' that is about ' + fmt(perHour * totalHours) + ' ml.',
        'Work backwards. The total should be close to the volume ordered.'));
      if (Math.abs(dRaw - dAnswer) > 1e-9) warnings.push('The answer is rounded to a whole drop.');
      if (dAnswer < 1) warnings.push('The answer is less than 1 drop per minute. Re-check the numbers.');
      return { ok: true, mode: mode, label: 'Drip rate', answer: dAnswer, answerText: dAnswer + ' drops per minute', steps: steps, warnings: warnings };
    }

    // mode === 'time'
    var tHours = volume / rate;
    var tMin = Math.round(tHours * 60);
    var h = Math.floor(tMin / 60), m = tMin % 60;
    var tText = timeLabel(h, m);

    steps.push(step('Read the question', 'Volume: ' + fmt(volume) + ' ml. Flow rate: ' + fmt(rate) + ' ml/hr.',
      'Volume is how much fluid is in the bag. Flow rate is how much runs in each hour.'));
    steps.push(step('Formula', 'Volume \u00F7 Rate', 'This tells you how many hours the bag will take.'));
    steps.push(step('Put in the numbers', fmt(volume) + ' \u00F7 ' + fmt(rate) + ' = ' + fmt(tHours) + ' hours',
      'Volume goes on top, rate goes underneath.'));
    if (Math.abs(tHours - Math.round(tHours)) > 1e-9) {
      steps.push(step('Change to hours and minutes', fmt(tHours) + ' hours = ' + tText,
        'The part after the decimal point is part of an hour. Multiply it by 60 to get minutes.'));
    }
    steps.push(step('Answer', tText, 'This is how long the fluid will take to run in.'));
    steps.push(step('Check it makes sense',
      fmt(rate) + ' ml/hr \u00D7 ' + fmt(tMin / 60) + ' hours = ' + fmt(rate * tMin / 60) + ' ml.',
      'Work backwards. The total should be close to the volume in the bag.'));
    if (Math.abs(tHours * 60 - tMin) > 1e-6) warnings.push('The time is rounded to the nearest minute.');
    return { ok: true, mode: mode, label: 'Time to finish', answer: Number(tHours.toFixed(2)), answerText: tText, steps: steps, warnings: warnings };
  }

  return { calculateIV: calculateIV, timeLabel: timeLabel };
}));
