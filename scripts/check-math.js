/**
 * Checks the Ohm's law numbers the levels claim, without starting the app.
 * Run with: npm test
 */

import assert from 'node:assert/strict';
import { level1 } from '../src/levels/level1.js';
import { level2 } from '../src/levels/level2.js';
import { level3 } from '../src/levels/level3.js';
import { seriesLedCurrentMa } from '../src/lib/ohm.js';

const supply = { volts: 9 };
const ledVf = 2;

function board(parts) {
  return {
    slots: parts.map((part, index) => ({ id: `s${index + 1}`, part })),
    supply,
    ledVf,
  };
}

function expectMa(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 0.05, `expected about ${expected} mA, got ${actual}`);
}

// The brief's example: 9 V, a 2 V red LED, 390 Ω, about 18 mA.
expectMa(seriesLedCurrentMa({ volts: 9, ledVf: 2, ohms: 390 }), (7 / 390) * 1000);

const empty = level1.check(board([null, null, null]));
assert.equal(empty.complete, false);
assert.equal(empty.currentMa, 0);
assert.equal(empty.led, 'off');

const openSwitch = level1.check(
  board([
    { type: 'switch', closed: false },
    { type: 'resistor', ohms: 330 },
    { type: 'led' },
  ]),
);
assert.equal(openSwitch.complete, false);
assert.equal(openSwitch.currentMa, 0);
assert.equal(openSwitch.led, 'off');

const burnt = level1.check(
  board([
    { type: 'switch', closed: true },
    { type: 'resistor', ohms: 100 },
    { type: 'led' },
  ]),
);
assert.equal(burnt.complete, false);
assert.equal(burnt.led, 'burnt');
expectMa(burnt.currentMa, 70);

const warmLit = level1.check(
  board([
    { type: 'led' },
    { type: 'switch', closed: true },
    { type: 'resistor', ohms: 330 },
  ]),
);
assert.equal(warmLit.complete, true);
assert.equal(warmLit.led, 'lit');
expectMa(warmLit.currentMa, (7 / 330) * 1000);

const gentleLit = level1.check(
  board([
    { type: 'resistor', ohms: 1000 },
    { type: 'led' },
    { type: 'switch', closed: true },
  ]),
);
assert.equal(gentleLit.complete, true);
expectMa(gentleLit.currentMa, 7);

const dim = level1.check(
  board([
    { type: 'switch', closed: true },
    { type: 'resistor', ohms: 10000 },
    { type: 'led' },
  ]),
);
assert.equal(dim.complete, false);
assert.equal(dim.led, 'dim');
expectMa(dim.currentMa, 0.7);

const wireInstead = level1.check(
  board([
    { type: 'switch', closed: true },
    { type: 'wire' },
    { type: 'led' },
  ]),
);
assert.equal(wireInstead.complete, false);
assert.equal(wireInstead.currentMa, 0);

const cyclops = level2.check(
  board([
    { type: 'switch', closed: true },
    { type: 'resistor', ohms: 390 },
    { type: 'led' },
  ]),
);
assert.equal(cyclops.complete, true);
assert.equal(cyclops.led, 'lit');
expectMa(cyclops.currentMa, (7 / 390) * 1000);

for (const ohms of [220, 330, 470, 1000]) {
  const result = level2.check(
    board([
      { type: 'switch', closed: true },
      { type: 'resistor', ohms },
      { type: 'led' },
    ]),
  );
  assert.equal(result.complete, false, `${ohms} Ω should not win level 2`);
}

const tooHot = level2.check(
  board([
    { type: 'switch', closed: true },
    { type: 'resistor', ohms: 220 },
    { type: 'led' },
  ]),
);
assert.equal(tooHot.led, 'burnt');
expectMa(tooHot.currentMa, (7 / 220) * 1000);

assert.equal(level3.check(board([null, null, null])).complete, false);

console.log('Ohm checks passed.');
