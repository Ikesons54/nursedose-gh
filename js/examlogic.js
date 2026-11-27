/* NurseDose GH - Exam mode logic: time, marking and weak areas. Works in the browser and in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./grader.js'));
  } else {
    root.NurseDose = root.NurseDose || {};
    root.NurseDose.examlogic = factory(root.NurseDose.grader);
  }
}(typeof self !== 'undefined' ? self : this, function (grader) {

  var SECONDS_PER_QUESTION = 90;
  var TYPE_NAMES = { tablets: 'Tablets', syrups: 'Syrups', injections: 'Injections' };
  var MISTAKE_LABELS = {
    units: 'Forgetting to make the units match',
    inverted: 'Dividing the wrong way round',
    volume: 'Forgetting to multiply by the volume',
    decimal: 'Decimal point slips',
    conversion: 'g, mg and mcg conversions',
    rounding: 'Rounding',
    invalid: 'Answers that were not a number',
    blank: 'Questions left blank',
    other: 'Other mistakes'
  };

  function totalSeconds(n) { return n * SECONDS_PER_QUESTION; }

  // 905000 ms -> "15:05". Never negative.
  function clock(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  // Mark every question. Blank = nothing typed. "Very close" is wrong in an exam but keeps its note.
  function gradeExam(items, answers) {
    return items.map(function (q, i) {
      var typed = answers[i] === undefined || answers[i] === null ? '' : String(answers[i]).trim();
      if (!typed) return { q: q, typed: '', status: 'blank', reason: 'blank', message: 'No answer was given.' };
      var r = grader.gradeAnswer(q, typed);
      if (r.status === 'correct') return { q: q, typed: typed, status: 'correct', reason: null, message: r.message };
      return { q: q, typed: typed, status: 'wrong', reason: r.reason || 'other', message: r.message };
    });
  }

  function pct(right, total) { return total ? right / total : 0; }

  // Score, breakdown by type, weak areas and the most common mistakes.
  function analyse(results) {
    var total = results.length;
    var correct = results.filter(function (r) { return r.status === 'correct'; }).length;

    var byType = {};
    var units = { right: 0, total: 0 };
    results.forEach(function (r) {
      var t = byType[r.q.category] || (byType[r.q.category] = { right: 0, total: 0 });
      t.total++;
      if (r.status === 'correct') t.right++;
      if (r.q.orderedUnit !== r.q.stockUnit) {
        units.total++;
        if (r.status === 'correct') units.right++;
      }
    });

    var weak = [];
    Object.keys(byType).forEach(function (k) {
      var t = byType[k];
      if (t.right < t.total && pct(t.right, t.total) < 0.7) {
        weak.push((TYPE_NAMES[k] || k) + ': ' + t.right + ' of ' + t.total + ' right');
      }
    });
    if (units.total && units.right < units.total && pct(units.right, units.total) < 0.7) {
      weak.push('Questions that need a unit conversion: ' + units.right + ' of ' + units.total + ' right');
    }

    var counts = {};
    results.forEach(function (r) {
      if (r.status === 'correct') return;
      counts[r.reason] = (counts[r.reason] || 0) + 1;
    });
    var mistakes = Object.keys(counts).map(function (k) {
      return { reason: k, label: MISTAKE_LABELS[k] || k, count: counts[k] };
    }).sort(function (a, b) { return b.count - a.count; });

    var share = pct(correct, total);
    var message = share >= 0.8 ? 'Strong result. Keep practising to stay sharp.'
      : share >= 0.5 ? 'Good effort. Go through the ones you missed.'
      : 'Keep going. Read the steps for each one you missed, then try again.';

    return { total: total, correct: correct, percent: Math.round(share * 100), byType: byType, units: units, weak: weak, mistakes: mistakes, message: message };
  }

  return {
    SECONDS_PER_QUESTION: SECONDS_PER_QUESTION,
    totalSeconds: totalSeconds,
    clock: clock,
    gradeExam: gradeExam,
    analyse: analyse
  };
}));
