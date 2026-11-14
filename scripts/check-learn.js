/**
 * Grades the six study islands against the bundled LevelData.
 * Run with: npm test
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { grade, resolveTune, solutionUnlocked } from '../src/learn/grade.js';
import { initialState } from '../src/learn/initialState.js';
import { formatSi, snapSig } from '../src/learn/format.js';
import { astableHz, timeConstant } from '../src/learn/physics.js';
import { isLevelList, resolveLevelsUrl, selectLevels } from '../src/learn/schema.js';
import { recordWin } from '../src/learn/storage.js';

const levels = JSON.parse(readFileSync(new URL('../src/learn/mock/levels.json', import.meta.url), 'utf8'));

assert.equal(isLevelList(levels), true);
assert.deepEqual(levels.map((level) => level.specIndex), [0, 1, 2, 3, 4, 5]);
assert.deepEqual(levels.map((level) => level.puzzle.kind), [
  'closed-loop',
  'ohms',
  'series-parallel',
  'rc',
  'flyback',
  'astable',
]);

assert.equal(formatSi(10000, 'Ω'), '10 kΩ');
assert.equal(formatSi(390, 'Ω'), '390 Ω');
assert.equal(formatSi(0.00001, 'F'), '10 µF');
assert.equal(formatSi(0.01795, 'A'), '17.9 mA');
assert.equal(formatSi(1, 's'), '1 s');
assert.equal(snapSig(68000), 68000);
assert.equal(snapSig(0.00001), 0.00001);

assert.equal(resolveLevelsUrl(undefined), '/api/levels');
assert.equal(resolveLevelsUrl(''), '');
assert.equal(resolveLevelsUrl('https://example.test/levels'), 'https://example.test/levels');

const rejected = selectLevels({ levels: [{ id: 1 }] }, levels);
assert.equal(rejected.source, 'mock');
assert.equal(rejected.levels.length, 6);
const accepted = selectLevels({ levels }, levels);
assert.equal(accepted.source, 'api');

function truth(level) {
  const rows = level.puzzle.truth?.rows || [];
  return Object.fromEntries(rows.map((row, index) => [index, row.answer]));
}

const [troy, cyclops, sirens, aeolus, charybdis, ithaca] = levels;

for (const level of levels) {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    const opened = grade(level, initialState(level, difficulty), difficulty);
    assert.equal(opened.complete, false, `${level.title} ${difficulty} should not open already won`);
  }
}

assert.equal(grade(troy, {
  slots: { s1: 'battery', s2: 'switch', s3: 'led' },
  switchClosed: true,
  ledForward: true,
  truth: truth(troy),
}, 'normal').complete, true);

assert.equal(grade(troy, {
  slots: { s1: 'battery', s2: 'switch', s3: 'led' },
  switchClosed: true,
  ledForward: false,
  truth: truth(troy),
}, 'normal').complete, false);

assert.equal(grade(troy, {
  slots: { s1: 'battery', s2: 'switch', s3: 'led' },
  switchClosed: false,
  ledForward: true,
  truth: truth(troy),
}, 'easy').complete, false);

assert.equal(grade(troy, {
  slots: { s1: 'battery', s2: 'wire', s3: 'led' },
  switchClosed: true,
  ledForward: true,
  truth: {},
}, 'hard').lamp, 'off');

assert.equal(grade(troy, {
  slots: { s1: 'battery', s2: 'switch', s3: 'led' },
  switchClosed: true,
  ledForward: true,
  truth: {},
}, 'easy').complete, true);

assert.equal(grade(troy, {
  slots: { s1: 'battery', s2: 'switch', s3: 'led' },
  switchClosed: true,
  ledForward: true,
  truth: {},
}, 'normal').complete, false);

assert.equal(grade(cyclops, { ohms: 390, predictionMa: 10 }, 'normal').complete, true);
assert.equal(grade(cyclops, { ohms: 47, predictionMa: 18 }, 'normal').lamp, 'burnt');
assert.equal(grade(cyclops, { ohms: 10000, predictionMa: 18 }, 'normal').lamp, 'dim');
assert.equal(grade(cyclops, { ohms: 47, predictionMa: 18 }, 'normal').complete, false);
assert.equal(grade(cyclops, { ohms: 10000, predictionMa: 18 }, 'hard').complete, false);
assert.equal(grade(cyclops, { ohms: 390, predictionMa: 1 }, 'hard').complete, false);
assert.equal(grade(cyclops, { ohms: 390, predictionMa: 18 }, 'hard').complete, true);
assert.match(grade(cyclops, { ohms: 390, predictionMa: 18 }, 'normal').equation, /17\.9 mA/);

assert.equal(grade(sirens, { topology: 'parallel', truth: truth(sirens) }, 'normal').complete, true);
assert.equal(grade(sirens, { topology: 'series', truth: truth(sirens) }, 'normal').complete, false);
assert.match(grade(sirens, { topology: 'parallel', truth: {} }, 'easy').meter.value, /500/);
assert.match(grade(sirens, { topology: 'series', truth: {} }, 'easy').meter.value, /2 kΩ/);
assert.equal(grade(sirens, { topology: 'parallel', truth: {} }, 'normal').complete, false);
assert.equal(grade(sirens, { topology: 'parallel', truth: {} }, 'easy').complete, true);

assert.equal(timeConstant(100000, 0.00001), 1);
assert.equal(grade(aeolus, { ohms: 100000, farads: 0.00001 }, 'normal').complete, true);
assert.equal(grade(aeolus, { ohms: 10000, farads: 0.0001 }, 'easy').complete, true);
assert.equal(grade(aeolus, { ohms: 1000000, farads: 0.000001 }, 'normal').complete, true);
assert.equal(grade(aeolus, { ohms: 10000, farads: 0.000001 }, 'normal').complete, false);
assert.equal(grade(aeolus, { ohms: 50000, farads: 0.00001 }, 'hard').complete, true);
assert.equal(grade(aeolus, { ohms: 100000, farads: 0.00001 }, 'hard').complete, false);
assert.equal(grade(aeolus, { ohms: 100000, farads: 0.00001 }, 'normal').wave.kind, 'rc');

assert.equal(grade(charybdis, { diode: 'flyback', truth: truth(charybdis) }, 'normal').complete, true);
assert.equal(grade(charybdis, { diode: 'none', truth: truth(charybdis) }, 'normal').complete, false);
assert.equal(grade(charybdis, { diode: 'forward', truth: truth(charybdis) }, 'easy').complete, false);
assert.equal(grade(charybdis, { diode: 'flyback', truth: {} }, 'easy').complete, true);
assert.equal(grade(charybdis, { diode: 'flyback', truth: {} }, 'hard').complete, false);

const beacon = astableHz(1000, 68000, 0.00001);
assert.ok(Math.abs(beacon - 1.05) < 0.02, `expected about 1.05 Hz, got ${beacon}`);
assert.equal(grade(ithaca, { r1: 1000, r2: 68000, farads: 0.00001 }, 'normal').complete, true);
assert.equal(grade(ithaca, { r1: 1000, r2: 68000, farads: 0.0001 }, 'hard').complete, false);
assert.equal(grade(ithaca, { r1: 1000, r2: 10000, farads: 0.0001 }, 'easy').complete, true);
assert.equal(grade(ithaca, { r1: 100000, r2: 470000, farads: 0.0001 }, 'normal').wave.kind, 'astable');

const easyTune = resolveTune(troy, 'easy');
assert.equal(solutionUnlocked({ tune: easyTune, misses: 0, complete: false }), false);
assert.equal(solutionUnlocked({ tune: easyTune, misses: 1, complete: false }), true);
assert.equal(solutionUnlocked({ tune: resolveTune(troy, 'hard'), misses: 9, complete: false }), false);
assert.equal(solutionUnlocked({ tune: resolveTune(troy, 'hard'), misses: 0, complete: true }), true);

const memory = new Map();
const storage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => memory.set(key, value),
  removeItem: (key) => memory.delete(key),
};
const once = recordWin({ difficulty: 'normal', completed: [], inventory: [], notebook: [] }, troy, storage);
const twice = recordWin(once, troy, storage);
assert.deepEqual(twice.completed, [1]);
assert.equal(twice.inventory.length, 1);
assert.equal(twice.notebook[0].concept, 'Closed loop and LED polarity');
assert.equal(memory.size, 1);

console.log('Study checks passed.');
