/**
 * Frequency math and win/lose cases for the Ithaca lighthouse.
 * `npm test` reaches this file through scripts/check-math.js.
 * Run it alone with: node scripts/check-level6.js
 */

import assert from 'node:assert/strict';
import { makePart } from '../src/lib/parts.js';
import { astableFrequencyHz, astableTimes, level6 } from '../src/levels/level6.js';

const supply = { volts: 9 };
const ledVf = 2;
const FIELDS = ['complete', 'currentMa', 'led', 'headline', 'detail', 'equation'];

function board(parts, ids = ['s1', 's2', 's3']) {
  return {
    slots: parts.map((part, index) => ({ id: ids[index], part })),
    supply,
    ledVf,
  };
}

function timing(r1Ohms, r2Ohms, microfarads) {
  return board([
    { type: 'resistor', ohms: r1Ohms },
    { type: 'resistor', ohms: r2Ohms },
    { type: 'capacitor', microfarads },
  ]);
}

function assertShape(result) {
  for (const key of FIELDS) {
    assert.ok(Object.prototype.hasOwnProperty.call(result, key), `missing ${key}`);
  }
  assert.equal(typeof result.complete, 'boolean');
  assert.equal(typeof result.currentMa, 'number');
  assert.ok(['off', 'dim', 'lit', 'burnt'].includes(result.led));
  assert.equal(typeof result.headline, 'string');
  assert.equal(typeof result.detail, 'string');
  assert.equal(typeof result.equation, 'string');
  assert.ok(result.headline.length > 0);
  assert.ok(result.detail.length > 0);
  assert.ok(result.equation.length > 0);
}

const workedHz = 1.44 / ((1000 + 2 * 68000) * 10e-6);
assert.ok(Math.abs(workedHz - 1.0510948905109487) < 1e-12);
assert.ok(Math.abs(astableFrequencyHz(1000, 68000, 10e-6) - workedHz) < 1e-12);

const workedTimes = astableTimes(1000, 68000, 10e-6);
assert.ok(Math.abs(workedTimes.high - 0.693 * (1000 + 68000) * 10e-6) < 1e-12);
assert.ok(Math.abs(workedTimes.low - 0.693 * 68000 * 10e-6) < 1e-12);
assert.ok(Number.isNaN(astableFrequencyHz(0, 68000, 10e-6)));
assert.ok(Number.isNaN(astableFrequencyHz(1000, 68000, 0)));

assert.equal(level6.stub, false);
assert.equal(level6.id, 6);
assert.ok(level6.resistorValues.includes(1000));
assert.ok(level6.resistorValues.includes(68000));
assert.ok(level6.resistorValues.some((ohms) => ohms < 1000));
assert.ok(level6.resistorValues.some((ohms) => ohms > 68000));

const lessonText = level6.lessons.map((card) => `${card.title} ${card.body}`).join('\n');
assert.match(lessonText, /astable/i);
assert.match(lessonText, /1\.44/);
assert.match(lessonText, /0\.693/);
assert.match(lessonText, /68 kΩ/);
assert.match(lessonText, /t_high/);
assert.match(lessonText, /t_low/);

for (const hint of level6.hints) {
  assert.equal(/68\s*kΩ|68000/.test(hint), false, `hint gives away R2: ${hint}`);
  assert.equal(/1 kΩ/.test(hint), false, `hint gives away R1: ${hint}`);
}

const win = level6.check(timing(1000, 68000, 10));
assertShape(win);
assert.equal(win.complete, true);
assert.equal(win.led, 'lit');
assert.equal(win.currentMa, 0);
assert.match(win.equation, /1\.44 \/ \(\(1 kΩ \+ 2 × 68 kΩ\) × 10 µF\)/);
assert.match(win.equation, /1\.44 \/ 1\.37 = 1\.05 Hz/);
assert.match(win.equation, /t_high = 0\.48 s/);
assert.match(win.equation, /t_low = 0\.47 s/);
assert.match(win.detail, /1\.05 Hz/);
assert.match(win.headline, /Ithaca/);

const swapped = level6.check(timing(68000, 1000, 10));
assertShape(swapped);
assert.equal(swapped.complete, false);
assert.equal(swapped.led, 'lit');
assert.match(swapped.headline, /blur/i);
assert.match(swapped.detail, /2\.06 Hz/);
assert.match(swapped.detail, /faster than 2 Hz/);

const tooFast = level6.check(timing(1000, 1000, 10));
assert.equal(tooFast.complete, false);
assert.match(tooFast.detail, /48 Hz/);

const stillFast = level6.check(timing(1000, 10000, 10));
assert.equal(stillFast.complete, false);
assert.match(stillFast.detail, /faster than 2 Hz/);

const tooSlow = level6.check(timing(1000, 470000, 10));
assertShape(tooSlow);
assert.equal(tooSlow.complete, false);
assert.equal(tooSlow.led, 'dim');
assert.match(tooSlow.headline, /abandoned/i);
assert.match(tooSlow.detail, /0\.15 Hz/);
assert.match(tooSlow.detail, /slower than 0\.5 Hz/);

const hugeR1 = level6.check(timing(470000, 68000, 10));
assert.equal(hugeR1.complete, false);
assert.match(hugeR1.detail, /bring R1 down/);

const alsoWins = [
  [220, 68000],
  [10000, 68000],
  [68000, 10000],
  [68000, 68000],
];
for (const [r1, r2] of alsoWins) {
  const result = level6.check(timing(r1, r2, 10));
  assert.equal(result.complete, true, `${r1} Ω and ${r2} Ω at 10 µF should win`);
  assert.equal(result.led, 'lit');
}

for (const r1 of level6.resistorValues) {
  for (const r2 of level6.resistorValues) {
    const hz = astableFrequencyHz(r1, r2, 10e-6);
    const result = level6.check(timing(r1, r2, 10));
    assertShape(result);
    const expected = hz >= 0.5 - 1e-9 && hz <= 2 + 1e-9;
    assert.equal(result.complete, expected, `${r1}, ${r2} → ${hz} Hz`);
    assert.equal(result.currentMa, 0);
    if (expected) assert.equal(result.led, 'lit');
    else if (hz > 2) assert.equal(result.led, 'lit');
    else assert.equal(result.led, 'dim');
  }
}

const fastCap = level6.check(timing(1000, 68000, 1));
assert.equal(fastCap.complete, false);
assert.ok(astableFrequencyHz(1000, 68000, 1e-6) > 10);
assert.match(fastCap.detail, /1 µF/);
assert.match(fastCap.detail, /faster than 2 Hz/);

const slowCap = level6.check(timing(1000, 68000, 100));
assert.equal(slowCap.complete, false);
assert.ok(astableFrequencyHz(1000, 68000, 100e-6) < 0.2);
assert.match(slowCap.detail, /100 µF/);
assert.equal(slowCap.led, 'dim');

const farads = 10e-6;
const r2AtHalf = (1.44 / 0.5 / farads - 1000) / 2;
const atHalf = level6.check(timing(1000, r2AtHalf, 10));
assert.ok(Math.abs(astableFrequencyHz(1000, r2AtHalf, farads) - 0.5) < 1e-9);
assert.equal(atHalf.complete, true);

const r2AtTwo = (1.44 / 2 / farads - 1000) / 2;
const atTwo = level6.check(timing(1000, r2AtTwo, 10));
assert.ok(Math.abs(astableFrequencyHz(1000, r2AtTwo, farads) - 2) < 1e-9);
assert.equal(atTwo.complete, true);

const justSlow = level6.check(timing(1000, r2AtHalf * 1.02, 10));
assert.equal(justSlow.complete, false);
assert.ok(astableFrequencyHz(1000, r2AtHalf * 1.02, farads) < 0.5);

const justFast = level6.check(timing(1000, r2AtTwo * 0.98, 10));
assert.equal(justFast.complete, false);
assert.ok(astableFrequencyHz(1000, r2AtTwo * 0.98, farads) > 2);

const shuffled = level6.check({
  slots: [
    { id: 's3', part: { type: 'capacitor', microfarads: 10 } },
    { id: 's1', part: { type: 'resistor', ohms: 1000 } },
    { id: 's2', part: { type: 'resistor', ohms: 68000 } },
  ],
  supply,
  ledVf,
});
assert.equal(shuffled.complete, true);

const empty = level6.check(board([null, null, null]));
assertShape(empty);
assert.equal(empty.complete, false);
assert.equal(empty.led, 'off');
assert.equal(empty.currentMa, 0);
assert.match(empty.detail, /all missing/);

const noCap = level6.check(board([
  { type: 'resistor', ohms: 1000 },
  { type: 'resistor', ohms: 68000 },
  null,
]));
assert.equal(noCap.complete, false);
assert.match(noCap.detail, /capacitor is missing/);

const ledInCapSlot = level6.check(board([
  { type: 'resistor', ohms: 1000 },
  { type: 'resistor', ohms: 68000 },
  { type: 'led' },
]));
assert.equal(ledInCapSlot.complete, false);
assert.equal(ledInCapSlot.led, 'off');
assert.match(ledInCapSlot.headline, /capacitor/i);

const switchInR1 = level6.check(board([
  { type: 'switch', closed: true },
  { type: 'resistor', ohms: 68000 },
  { type: 'capacitor', microfarads: 10 },
]));
assert.equal(switchInR1.complete, false);
assert.match(switchInR1.headline, /R1/);

const wireInR2 = level6.check(board([
  { type: 'resistor', ohms: 1000 },
  { type: 'wire' },
  { type: 'capacitor', microfarads: 10 },
]));
assert.equal(wireInR2.complete, false);
assert.match(wireInR2.detail, /wire/);

const zeroCap = level6.check(timing(1000, 68000, 0));
assert.equal(zeroCap.complete, false);
assert.equal(zeroCap.led, 'off');

const zeroResistor = level6.check(timing(0, 68000, 10));
assert.equal(zeroResistor.complete, false);

const placedCap = makePart('capacitor', level6);
assert.equal(placedCap.microfarads, 10);
const placedR1 = { ...makePart('resistor', level6), ohms: 1000 };
const placedR2 = { ...makePart('resistor', level6), ohms: 68000 };
const fromBoard = level6.check(board([placedR1, placedR2, placedCap]));
assert.equal(fromBoard.complete, true);
assert.equal(makePart('resistor', level6).ohms, 1000);
const fresh = level6.check(board([
  makePart('resistor', level6),
  makePart('resistor', level6),
  placedCap,
]));
assert.equal(fresh.complete, false);

console.log('Lighthouse checks passed.');
