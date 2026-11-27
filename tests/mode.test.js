// Run with:  node tests/mode.test.js
const assert = require('assert');
const mode = require('../js/mode.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('PASS  ' + name); }
  catch (e) { console.log('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; }
}

test('Defaults to student and not onboarded', () => {
  assert.strictEqual(mode.get(), 'student');
  assert.strictEqual(mode.isOnboarded(), false);
});

test('Can switch to professional and back, and is told about changes', () => {
  const seen = [];
  mode.onChange(m => seen.push(m));
  assert.strictEqual(mode.set('professional'), true);
  assert.strictEqual(mode.get(), 'professional');
  assert.strictEqual(mode.set('professional'), true);   // same value: no new event
  assert.strictEqual(mode.set('student'), true);
  assert.deepStrictEqual(seen, ['professional', 'student']);
});

test('Rejects unknown modes', () => {
  assert.strictEqual(mode.set('admin'), false);
  assert.strictEqual(mode.set(''), false);
  assert.strictEqual(mode.get(), 'student');
});

test('Remembers the intro was seen', () => {
  mode.setOnboarded();
  assert.strictEqual(mode.isOnboarded(), true);
});

test('Menu items can be limited to a mode', () => {
  assert.strictEqual(mode.allowed({ id: 'a' }, 'professional'), true);
  assert.strictEqual(mode.allowed({ id: 'p', modes: ['student'] }, 'student'), true);
  assert.strictEqual(mode.allowed({ id: 'p', modes: ['student'] }, 'professional'), false);
});

console.log('\n' + passed + ' passed');
