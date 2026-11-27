// Run with:  node tests/iv.test.js
const assert = require('assert');
const { calculateIV } = require('../js/iv.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('PASS  ' + name); }
  catch (e) { console.log('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; }
}

test('Flow rate: 1000 ml over 8 hours = 125 ml/hr', () => {
  const r = calculateIV({ mode: 'rate', volume: 1000, hours: 8, minutes: 0 });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.answerText, '125 ml/hr');
  assert.strictEqual(r.warnings.length, 0);
});

test('Flow rate with minutes: 500 ml over 4 h 30 min = 111.1 ml/hr (rounded)', () => {
  const r = calculateIV({ mode: 'rate', volume: 500, hours: 4, minutes: 30 });
  assert.strictEqual(r.answerText, '111.1 ml/hr');
  assert.ok(r.warnings.some(w => w.includes('rounded')));
  assert.ok(r.steps.some(s => s.title === 'Change the time to hours'));
});

test('Flow rate with minutes only: 250 ml over 90 minutes = 166.7 ml/hr', () => {
  assert.strictEqual(calculateIV({ mode: 'rate', volume: 250, hours: 0, minutes: 90 }).answerText, '166.7 ml/hr');
});

test('Drops: 1000 ml over 10 h, factor 15 = 25 drops/min', () => {
  const r = calculateIV({ mode: 'drops', volume: 1000, hours: 10, minutes: 0, dropFactor: 15 });
  assert.strictEqual(r.answerText, '25 drops per minute');
  assert.strictEqual(r.warnings.length, 0);
});

test('Drops: 1000 ml over 8 h, factor 20 = 41.67 rounds to 42', () => {
  const r = calculateIV({ mode: 'drops', volume: 1000, hours: 8, minutes: 0, dropFactor: 20 });
  assert.strictEqual(r.answer, 42);
  assert.ok(r.steps.some(s => s.title === 'Round to a whole drop'));
  assert.ok(r.warnings.some(w => w.includes('whole drop')));
});

test('Drops: 500 ml over 4 h, factor 60 = 125 drops/min', () => {
  assert.strictEqual(calculateIV({ mode: 'drops', volume: 500, hours: 4, minutes: 0, dropFactor: 60 }).answer, 125);
});

test('Drops: 100 ml over 30 minutes, factor 20 = 67 drops/min', () => {
  assert.strictEqual(calculateIV({ mode: 'drops', volume: 100, hours: 0, minutes: 30, dropFactor: 20 }).answer, 67);
});

test('Time: 500 ml at 125 ml/hr = 4 hours', () => {
  const r = calculateIV({ mode: 'time', volume: 500, rate: 125 });
  assert.strictEqual(r.answerText, '4 hours');
  assert.strictEqual(r.warnings.length, 0);
});

test('Time: 1000 ml at 150 ml/hr = 6 hours 40 minutes', () => {
  assert.strictEqual(calculateIV({ mode: 'time', volume: 1000, rate: 150 }).answerText, '6 hours 40 minutes');
});

test('Time: 250 ml at 500 ml/hr = 30 minutes; 1 hour uses singular', () => {
  assert.strictEqual(calculateIV({ mode: 'time', volume: 250, rate: 500 }).answerText, '30 minutes');
  assert.strictEqual(calculateIV({ mode: 'time', volume: 100, rate: 100 }).answerText, '1 hour');
});

test('Every success has the standard steps', () => {
  [
    calculateIV({ mode: 'rate', volume: 1000, hours: 8 }),
    calculateIV({ mode: 'drops', volume: 1000, hours: 10, dropFactor: 15 }),
    calculateIV({ mode: 'time', volume: 500, rate: 125 })
  ].forEach(r => {
    const titles = r.steps.map(s => s.title);
    ['Read the question', 'Formula', 'Put in the numbers', 'Answer', 'Check it makes sense'].forEach(t => assert.ok(titles.includes(t), t));
    r.steps.forEach(s => assert.ok(s.why && s.why.length > 10, s.title));
  });
});

test('Bad input is rejected with a message', () => {
  [
    { mode: 'rate', volume: 0, hours: 8 },
    { mode: 'rate', volume: 1000, hours: 0, minutes: 0 },
    { mode: 'rate', volume: 1000, hours: -1 },
    { mode: 'rate', volume: NaN, hours: 8 },
    { mode: 'drops', volume: 1000, hours: 8 },                    // no drop factor
    { mode: 'drops', volume: 1000, hours: 8, dropFactor: 0 },
    { mode: 'time', volume: 500 },                                // no rate
    { mode: 'time', volume: 500, rate: -5 },
    { mode: 'other', volume: 500 },
    {}
  ].forEach(i => {
    const r = calculateIV(i);
    assert.strictEqual(r.ok, false, JSON.stringify(i));
    assert.ok(r.errors.length > 0);
  });
});

console.log('\n' + passed + ' passed');
