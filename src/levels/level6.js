/**
 * Level 6 — The Lighthouse of Ithaca. STUB.
 * Planned puzzle: a 555 timer as an astable blinker, about 0.5 to 2 Hz,
 * so the beacon guides Odysseus home.
 *
 *   f = 1.44 / ((R1 + 2 R2) C)
 *   high time = 0.693 (R1 + R2) C
 *   low time  = 0.693 R2 C
 *
 * Worked example to build the real check around:
 *   R1 = 1 kΩ, R2 = 68 kΩ, C = 10 µF
 *   R1 + 2 R2 = 137 kΩ
 *   (R1 + 2 R2) C = 137000 × 10×10⁻⁶ = 1.37
 *   f = 1.44 / 1.37 ≈ 1.05 Hz
 *   (The 1.44 is a rounded 1 / ln(2). Using 0.693 instead gives about 1.05 Hz too.)
 * Placeholder text only. check() never returns complete.
 */

import { placeholderResult } from './placeholder.js';

export const level6 = {
  id: 6,
  title: 'The Lighthouse',
  epithet: 'The 555 beacon',
  place: 'Ithaca',
  map: { x: 13, y: 64 },
  stub: true,
  concept: 'A 555 timer in astable mode blinks an LED. f = 1.44 / ((R1 + 2 R2) C).',
  goal: 'Placeholder. Choose R1, R2, and C so the beacon blinks between 0.5 and 2 Hz.',
  athenaNote: 'This level is unfinished. You may mention the 555 blink rate in words. Do not hand over R1, R2, and C as a finished answer unless the player is only asking what the formula is made of.',
  story:
    'Placeholder. Ithaca is a dark coast until the lighthouse blinks. The team will build the 555 astable here: a beacon between half a hertz and two hertz, with one worked example near 1 Hz (R1 1 kΩ, R2 68 kΩ, C 10 µF).',
  lessons: [
    {
      title: 'Placeholder — the beacon',
      body: 'Replace this card. An astable 555 charges and discharges a capacitor over and over, and that rhythm turns an LED on and off. No one has to press the switch. The lighthouse keeps its own watch.',
    },
    {
      title: 'Placeholder — the formula',
      body: 'Replace this card. The blink rate is f = 1.44 / ((R1 + 2 R2) C), with R in ohms and C in farads. R1 = 1 kΩ, R2 = 68 kΩ, and C = 10 µF land near 1 Hz, inside the 0.5 to 2 Hz window.',
    },
  ],
  supply: { volts: 9, label: '9 V battery' },
  led: { vf: 2, label: 'red LED' },
  slots: [
    { id: 's1', hint: 'R1' },
    { id: 's2', hint: 'R2' },
    { id: 's3', hint: 'Capacitor' },
  ],
  resistorValues: [1000, 68000],
  defaultOhms: 1000,
  hints: [
    'Placeholder hint: the 555 will blink on its own once the resistor pair and the capacitor set the time.',
    'Placeholder hint: a larger capacitor, or a larger R2, makes the blink slower.',
  ],
  buildSummary: {
    title: 'Placeholder',
    lines: ['The lighthouse is not playable yet. Home is still a sketch on the chart.'],
  },
  check() {
    return placeholderResult('The Lighthouse of Ithaca');
  },
};
