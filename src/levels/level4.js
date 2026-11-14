/**
 * Level 4 — Aeolus’ bag of winds. STUB.
 * Planned puzzle: capacitors and RC timing.
 *   time constant τ = R × C
 *   charging voltage v(t) = V (1 − e^(−t / RC))
 *   about 63% charged after one τ, about 99% after 5τ
 * Example to keep in the lesson when you write it:
 *   10 kΩ × 100 µF = 1 second.
 * Placeholder text only. check() never returns complete.
 */

import { placeholderResult } from './placeholder.js';

export const level4 = {
  id: 4,
  title: 'Aeolus’ Bag',
  epithet: 'The capacitor',
  place: 'The island of Aeolus',
  map: { x: 34, y: 76 },
  stub: true,
  concept: 'A capacitor stores charge. The RC time constant is τ = R × C.',
  goal: 'Placeholder. Charge a capacitor through a resistor and read the time scale.',
  athenaNote: 'This level is unfinished. You may name τ = R × C. Do not invent the puzzle’s exact part values.',
  story:
    'Placeholder. Aeolus hands over a tied sack. The team will turn that sack into a capacitor: it fills with charge, and it does not fill all at once.',
  lessons: [
    {
      title: 'Placeholder — charge',
      body: 'Replace this card. A capacitor stores energy in an electric field. While it charges through a resistor, the voltage across it rises quickly at first and then eases toward the battery voltage.',
    },
    {
      title: 'Placeholder — τ = RC',
      body: 'Replace this card. Multiply resistance in ohms by capacitance in farads and you get seconds. After one time constant the capacitor is about 63% charged. A 10 kΩ resistor and a 100 µF capacitor make τ = 1 s.',
    },
  ],
  supply: { volts: 9, label: '9 V battery' },
  led: { vf: 2, label: 'red LED' },
  slots: [
    { id: 's1', hint: 'Resistor' },
    { id: 's2', hint: 'Capacitor' },
    { id: 's3', hint: 'LED' },
  ],
  resistorValues: [1000, 10000],
  defaultOhms: 10000,
  hints: [
    'Placeholder hint: a capacitor does not pass a steady current forever. It fills, and the filling takes time.',
    'Placeholder hint: the time scale is resistance times capacitance. Ohms times farads is seconds.',
  ],
  buildSummary: {
    title: 'Placeholder',
    lines: ['Aeolus is not playable yet.'],
  },
  check() {
    return placeholderResult('Aeolus’ Bag');
  },
};
