// Run with:  node tests/grader.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { gradeAnswer, parseAnswer } = require('../js/grader.js');

const bank = {};
['tablets', 'syrups', 'injections'].forEach(f => {
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'questions', f + '.json'), 'utf8'))
    .questions.forEach(q => { bank[q.id] = q; });
});

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('PASS  ' + name); }
  catch (e) { console.log('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; }
}

test('Reads numbers, commas, fractions and units', () => {
  assert.strictEqual(parseAnswer('2.5'), 2.5);
  assert.strictEqual(parseAnswer('2,5'), 2.5);
  assert.strictEqual(parseAnswer('1/2'), 0.5);
  assert.strictEqual(parseAnswer(' 7.5 ml'), 7.5);
  assert.strictEqual(parseAnswer('2 tablets'), 2);
  assert.ok(isNaN(parseAnswer('abc')));
  assert.ok(isNaN(parseAnswer('')));
});

test('Every question in the bank is marked correct with its own answer', () => {
  Object.values(bank).forEach(q => {
    assert.strictEqual(gradeAnswer(q, String(q.expected)).status, 'correct', q.id);
  });
});

test('Fraction answer for a half tablet is correct', () => {
  assert.strictEqual(gradeAnswer(bank.t06, '1/2').status, 'correct');
});

test('Invalid answers are not marked', () => {
  ['', 'abc', '0', '-3'].forEach(t => assert.strictEqual(gradeAnswer(bank.s01, t).status, 'invalid', t));
});

test('Close answer (rounding): 3.3 for 3.33', () => {
  assert.strictEqual(gradeAnswer(bank.s08, '3.33').status, 'correct');
  assert.strictEqual(gradeAnswer(bank.s08, '3.333').status, 'correct');
  const r = gradeAnswer(bank.s08, '3.3');
  assert.strictEqual(r.status, 'close');
  assert.ok(r.message.includes('rounding'));
});

test('Hint: 10 times too big and too small', () => {
  assert.ok(gradeAnswer(bank.i01, '15').message.includes('10 times too big'));
  assert.ok(gradeAnswer(bank.i01, '0.15').message.includes('10 times too small'));
});

test('Hint: forgot to change units (g vs mg)', () => {
  // Ceftriaxone: 500 mg ordered, 1 g in 10 ml. Forgetting units gives 5000.
  const r = gradeAnswer(bank.i02, '5000');
  assert.strictEqual(r.status, 'wrong');
  assert.ok(r.message.includes('units match'));
  // Metformin: 1 g ordered, 500 mg tablets. Forgetting units gives 0.002.
  assert.ok(gradeAnswer(bank.t05, '0.002').message.includes('units match'));
});

test('Hint: divided the wrong way round', () => {
  // Amoxicillin 250 mg ordered, 125 mg in 5 ml: stock/ordered*volume = 2.5
  assert.ok(gradeAnswer(bank.s01, '2.5').message.includes('wrong way round'));
});

test('Hint: forgot to multiply by volume', () => {
  // ordered/stock = 2 (expected 10)
  assert.ok(gradeAnswer(bank.s01, '2').message.includes('multiply by the volume'));
});

test('Hint: 1000 times out for unit mix-ups', () => {
  assert.ok(gradeAnswer(bank.s08, '3330').message.includes('1000 times too big'));
});

test('Other wrong answers get a general message', () => {
  const r = gradeAnswer(bank.s01, '7');
  assert.strictEqual(r.status, 'wrong');
  assert.ok(r.title === 'Not quite');
});

test('Every result carries a reason code', () => {
  assert.strictEqual(gradeAnswer(bank.s01, '10').reason, null);
  assert.strictEqual(gradeAnswer(bank.s08, '3.3').reason, 'rounding');
  assert.strictEqual(gradeAnswer(bank.i01, '15').reason, 'decimal');
  assert.strictEqual(gradeAnswer(bank.i02, '5000').reason, 'units');
  assert.strictEqual(gradeAnswer(bank.s01, '2.5').reason, 'inverted');
  assert.strictEqual(gradeAnswer(bank.s01, '2').reason, 'volume');
  assert.strictEqual(gradeAnswer(bank.s08, '3330').reason, 'conversion');
  assert.strictEqual(gradeAnswer(bank.s01, '7').reason, 'other');
  assert.strictEqual(gradeAnswer(bank.s01, 'abc').reason, 'invalid');
});

console.log('\n' + passed + ' passed');
