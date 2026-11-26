// Run with:  node tests/calculator.test.js
const assert = require('assert');
const { calculateDose } = require('../js/calculator.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('PASS  ' + name); }
  catch (e) { console.log('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; }
}

test('PRD example: 500 mg ordered, 1000 mg in 2 ml -> 1 ml', () => {
  const r = calculateDose({ ordered: 500, orderedUnit: 'mg', stock: 1000, stockUnit: 'mg', volume: 2 });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.answer, 1);
  assert.strictEqual(r.answerText, '1 ml');
});

test('Syrup: 125 mg ordered, 250 mg in 5 ml -> 2.5 ml', () => {
  const r = calculateDose({ ordered: 125, orderedUnit: 'mg', stock: 250, stockUnit: 'mg', volume: 5 });
  assert.strictEqual(r.answer, 2.5);
});

test('Tablet: 250 mg ordered, 500 mg tablets -> 0.5 tablets (no warning)', () => {
  const r = calculateDose({ form: 'tablet', ordered: 250, orderedUnit: 'mg', stock: 500, stockUnit: 'mg' });
  assert.strictEqual(r.answer, 0.5);
  assert.strictEqual(r.answerText, '0.5 tablets');
  assert.strictEqual(r.warnings.length, 0);
});

test('Tablet: 1 tablet uses singular label', () => {
  const r = calculateDose({ form: 'tablet', ordered: 500, orderedUnit: 'mg', stock: 500, stockUnit: 'mg' });
  assert.strictEqual(r.answerText, '1 tablet');
});

test('Tablet: odd fraction gives a warning', () => {
  const r = calculateDose({ form: 'tablet', ordered: 300, orderedUnit: 'mg', stock: 500, stockUnit: 'mg' });
  assert.strictEqual(r.answer, 0.6);
  assert.ok(r.warnings.some(w => w.includes('whole or as a half')));
});

test('Converts g to mg: 0.5 g ordered, 250 mg in 5 ml -> 10 ml', () => {
  const r = calculateDose({ ordered: 0.5, orderedUnit: 'g', stock: 250, stockUnit: 'mg', volume: 5 });
  assert.strictEqual(r.answer, 10);
  assert.ok(r.steps.some(s => s.title === 'Make the units match'));
});

test('Converts mcg to mg: 250 mcg ordered, 0.5 mg in 1 ml -> 0.5 ml', () => {
  const r = calculateDose({ ordered: 250, orderedUnit: 'mcg', stock: 0.5, stockUnit: 'mg', volume: 1 });
  assert.strictEqual(r.answer, 0.5);
});

test('Rounds to 2 decimals and warns', () => {
  const r = calculateDose({ ordered: 100, orderedUnit: 'mg', stock: 300, stockUnit: 'mg', volume: 1 });
  assert.strictEqual(r.answer, 0.33);
  assert.ok(r.warnings.some(w => w.includes('rounded')));
});

test('Same non-mass unit works (units to units)', () => {
  const r = calculateDose({ ordered: 20, orderedUnit: 'units', stock: 100, stockUnit: 'units', volume: 1 });
  assert.strictEqual(r.answer, 0.2);
});

test('Mismatched units are rejected (mg vs ml)', () => {
  const r = calculateDose({ ordered: 5, orderedUnit: 'ml', stock: 100, stockUnit: 'mg', volume: 1 });
  assert.strictEqual(r.ok, false);
});

test('Zero, negative, empty and NaN inputs are rejected', () => {
  const base = { orderedUnit: 'mg', stockUnit: 'mg', volume: 2 };
  [ { ordered: 0, stock: 100 }, { ordered: -5, stock: 100 }, { ordered: 5, stock: 0 },
    { ordered: NaN, stock: 100 }, { ordered: 5, stock: undefined } ].forEach(extra => {
    const r = calculateDose(Object.assign({}, base, extra));
    assert.strictEqual(r.ok, false);
  });
  assert.strictEqual(calculateDose({ ordered: 5, orderedUnit: 'mg', stock: 100, stockUnit: 'mg', volume: 0 }).ok, false);
});

test('Missing unit is rejected', () => {
  const r = calculateDose({ ordered: 5, stock: 100, stockUnit: 'mg', volume: 1 });
  assert.strictEqual(r.ok, false);
});

test('Steps are always present on success', () => {
  const r = calculateDose({ ordered: 500, orderedUnit: 'mg', stock: 1000, stockUnit: 'mg', volume: 2 });
  const titles = r.steps.map(s => s.title);
  ['Read the question', 'Formula', 'Put in the numbers', 'Answer', 'Check it makes sense'].forEach(t => assert.ok(titles.includes(t), t));
});

test('Every step has simple-English "why" text', () => {
  const r = calculateDose({ ordered: 0.5, orderedUnit: 'g', stock: 250, stockUnit: 'mg', volume: 5 });
  r.steps.forEach(s => assert.ok(s.why && s.why.length > 10, s.title));
});

test('Sense check: order less than stock', () => {
  const r = calculateDose({ ordered: 500, orderedUnit: 'mg', stock: 1000, stockUnit: 'mg', volume: 2 });
  const c = r.steps.find(s => s.title === 'Check it makes sense');
  assert.ok(c.text.includes('less than the full 2 ml'));
});

test('Sense check: order equals stock (tablet)', () => {
  const r = calculateDose({ form: 'tablet', ordered: 500, orderedUnit: 'mg', stock: 500, stockUnit: 'mg' });
  const c = r.steps.find(s => s.title === 'Check it makes sense');
  assert.ok(c.text.includes('same as the stock'));
  assert.ok(c.text.includes('one tablet'));
});

test('Sense check: order more than stock', () => {
  const r = calculateDose({ form: 'tablet', ordered: 1000, orderedUnit: 'mg', stock: 500, stockUnit: 'mg' });
  const c = r.steps.find(s => s.title === 'Check it makes sense');
  assert.ok(c.text.includes('more than one tablet'));
  assert.strictEqual(r.answerText, '2 tablets');
});

console.log('\n' + passed + ' passed');
