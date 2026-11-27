// Run with:  node tests/examlogic.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const L = require('../js/examlogic.js');

const bank = {};
['tablets', 'syrups', 'injections'].forEach(f => {
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'questions', f + '.json'), 'utf8'))
    .questions.forEach(q => { q.category = f; bank[q.id] = q; });
});

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('PASS  ' + name); }
  catch (e) { console.log('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; }
}

test('Time: 90 seconds per question', () => {
  assert.strictEqual(L.totalSeconds(10), 900);
  assert.strictEqual(L.totalSeconds(20), 1800);
});

test('Clock text', () => {
  assert.strictEqual(L.clock(900000), '15:00');
  assert.strictEqual(L.clock(65000), '1:05');
  assert.strictEqual(L.clock(59001), '1:00');
  assert.strictEqual(L.clock(0), '0:00');
  assert.strictEqual(L.clock(-5000), '0:00');
});

test('Marks correct, wrong, blank; unnumbered and non-number answers are wrong', () => {
  const items = [bank.t01, bank.t02, bank.t03, bank.t04, bank.t05];
  const res = L.gradeExam(items, ['2', '20', '', 'abc', undefined]);
  assert.deepStrictEqual(res.map(r => r.status), ['correct', 'wrong', 'blank', 'wrong', 'blank']);
  assert.strictEqual(res[1].reason, 'decimal');
  assert.strictEqual(res[3].reason, 'invalid');
  assert.strictEqual(res[2].reason, 'blank');
});

test('"Very close" counts as wrong in an exam but says why', () => {
  const res = L.gradeExam([bank.s08], ['3.3']);
  assert.strictEqual(res[0].status, 'wrong');
  assert.strictEqual(res[0].reason, 'rounding');
});

test('Score and percentage', () => {
  const items = [bank.t01, bank.t02, bank.t03, bank.t04];
  const a = L.analyse(L.gradeExam(items, ['2', '2', '2', '3']));
  assert.strictEqual(a.correct, 3);
  assert.strictEqual(a.total, 4);
  assert.strictEqual(a.percent, 75);
});

test('Weak areas: type under 70% and unit-conversion questions', () => {
  // Metformin (1 g vs 500 mg) and Digoxin (mcg vs mg) are unit-conversion questions
  const items = [bank.t01, bank.t05, bank.t08, bank.s01, bank.s02];
  const answers = ['2', '0.002', '99', '10', '7.5'];
  const a = L.analyse(L.gradeExam(items, answers));
  assert.ok(a.weak.some(w => w.startsWith('Tablets: 1 of 3')), JSON.stringify(a.weak));
  assert.ok(a.weak.some(w => w.includes('unit conversion') && w.includes('0 of 2')), JSON.stringify(a.weak));
  assert.ok(!a.weak.some(w => w.startsWith('Syrups')));
});

test('Mistake patterns are counted and sorted', () => {
  const items = [bank.i01, bank.i02, bank.t05, bank.s01];
  const a = L.analyse(L.gradeExam(items, ['15', '5000', '0.002', '']));
  const labels = a.mistakes.map(m => m.reason);
  assert.strictEqual(a.mistakes[0].reason, 'units');
  assert.strictEqual(a.mistakes[0].count, 2);
  assert.ok(labels.includes('decimal') && labels.includes('blank'));
});

test('Perfect score has no weak areas or mistakes', () => {
  const items = [bank.t01, bank.s01, bank.i01];
  const a = L.analyse(L.gradeExam(items, ['2', '10', '1.5']));
  assert.strictEqual(a.percent, 100);
  assert.strictEqual(a.weak.length, 0);
  assert.strictEqual(a.mistakes.length, 0);
});

console.log('\n' + passed + ' passed');
