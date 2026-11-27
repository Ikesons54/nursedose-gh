// Run with:  node tests/formulas.test.js
// Checks the formula library data and re-does every example's arithmetic.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'formulas.json'), 'utf8'));
const CATS = ['Doses', 'Units', 'IV fluids', 'Strengths'];
const ids = new Set();
let ok = 0, bad = 0;

data.formulas.forEach(f => {
  try {
    assert.ok(f.id && f.title && f.formula && f.meaning && f.tip, 'missing field');
    assert.ok(!ids.has(f.id), 'duplicate id'); ids.add(f.id);
    assert.ok(CATS.includes(f.category), 'bad category ' + f.category);
    assert.ok(['draft', 'approved'].includes(f.status), 'bad status');
    assert.ok(f.example && f.example.question && f.example.steps.length && f.example.answer, 'bad example');
    assert.ok(f.checks && f.checks.length, 'needs at least one arithmetic check');
    f.checks.forEach(c => {
      assert.ok(/^[0-9+\-*\/(). ]+$/.test(c.expr), 'unsafe expression ' + c.expr);
      const v = Function('"use strict"; return (' + c.expr + ')')();
      assert.ok(Math.abs(v - c.result) < 0.01, c.expr + ' gave ' + v + ', expected ' + c.result);
    });
    ok++;
  } catch (e) { bad++; console.log('FAIL  ' + f.id + ': ' + e.message); }
});

CATS.forEach(c => assert.ok(data.formulas.some(f => f.category === c), 'no formulas in ' + c));
console.log(ok + ' formulas OK, ' + bad + ' failed');
if (bad) process.exitCode = 1;
