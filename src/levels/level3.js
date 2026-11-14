/**
 * Level 3 — The Sirens. STUB.
 * Planned puzzle: series versus parallel.
 *   Series: one path, the same current in every part, voltages add.
 *           Rtotal = R1 + R2. One open part darkens the whole string.
 *   Parallel: each branch sees the same voltage, currents add.
 *           1 / Rtotal = 1 / R1 + 1 / R2.
 * Placeholder text only. check() never returns complete.
 */

import { placeholderResult } from './placeholder.js';

export const level3 = {
  id: 3,
  title: 'The Sirens',
  epithet: 'Series and parallel',
  place: 'The Sirens’ rocks',
  map: { x: 48, y: 22 },
  stub: true,
  concept: 'Series shares one current. Parallel shares one voltage.',
  goal: 'Placeholder. Compare a series pair of lamps with a parallel pair.',
  athenaNote: 'This level is unfinished. Talk about series and parallel in general, and do not invent a parts list.',
  story:
    'Placeholder. Two songs reach the ship at once. One path, or two paths. The team will write the real telling of series and parallel here.',
  lessons: [
    {
      title: 'Placeholder — series',
      body: 'Replace this card. Series means one path. The current is the same in each part, and the voltages add. Two resistors in series add: Rtotal = R1 + R2.',
    },
    {
      title: 'Placeholder — parallel',
      body: 'Replace this card. Parallel means each branch is tied across the same two nodes. The voltage matches, and the currents add. 1 / Rtotal = 1 / R1 + 1 / R2.',
    },
  ],
  supply: { volts: 9, label: '9 V battery' },
  led: { vf: 2, label: 'red LED' },
  slots: [
    { id: 's1', hint: 'First part' },
    { id: 's2', hint: 'Second part' },
    { id: 's3', hint: 'Third part' },
  ],
  resistorValues: [330, 1000],
  defaultOhms: 1000,
  hints: [
    'Placeholder hint: in series there is only one path, so the current has nowhere else to go.',
    'Placeholder hint: in parallel each branch is its own path, and both branches feel the same voltage.',
  ],
  buildSummary: {
    title: 'Placeholder',
    lines: ['The Sirens are not playable yet.'],
  },
  check() {
    return placeholderResult('The Sirens');
  },
};
