/**
 * Level 5 — Charybdis. STUB.
 * Planned puzzle: an inductor, and the flyback diode that saves the switch.
 *   An inductor resists a change in current. Energy in the field is ½ L I².
 *   Open the switch and the current cannot stop instantly, so the voltage
 *   spikes (V = L di/dt). A diode across the coil gives that current a
 *   short, safe loop. In the usual low-side setup the diode sits backward
 *   across the coil while the switch is closed (cathode toward the supply),
 *   then conducts when the switch opens.
 * Placeholder text only. check() never returns complete.
 */

import { placeholderResult } from './placeholder.js';

export const level5 = {
  id: 5,
  title: 'Charybdis',
  epithet: 'The inductor',
  place: 'The whirlpool',
  map: { x: 24, y: 30 },
  stub: true,
  concept: 'An inductor stores energy in a magnetic field. A flyback diode gives the current a safe path when the switch opens.',
  goal: 'Placeholder. Drive a coil, then add the diode that catches the spike.',
  athenaNote: 'This level is unfinished. You may say that interrupting an inductor makes a voltage spike. Do not pretend the board is already correct.',
  story:
    'Placeholder. The whirlpool does not like a sudden stop. The team will write the coil, the switch, and the diode that swallows the spike.',
  lessons: [
    {
      title: 'Placeholder — the coil',
      body: 'Replace this card. An inductor stores energy in a magnetic field while current flows. It resists a change in that current. The stored energy is ½ L I².',
    },
    {
      title: 'Placeholder — flyback',
      body: 'Replace this card. Open the switch and the coil still wants to push current. With nowhere to go, the voltage spikes. A diode across the coil gives the current a loop that does not arc across the switch.',
    },
  ],
  supply: { volts: 9, label: '9 V battery' },
  led: { vf: 2, label: 'red LED' },
  slots: [
    { id: 's1', hint: 'Switch' },
    { id: 's2', hint: 'Inductor' },
    { id: 's3', hint: 'Diode' },
  ],
  resistorValues: [1000],
  defaultOhms: 1000,
  hints: [
    'Placeholder hint: a coil fights a sudden change in current.',
    'Placeholder hint: when the path opens, the current needs a second door. That door is the diode.',
  ],
  buildSummary: {
    title: 'Placeholder',
    lines: ['Charybdis is not playable yet.'],
  },
  check() {
    return placeholderResult('Charybdis');
  },
};
