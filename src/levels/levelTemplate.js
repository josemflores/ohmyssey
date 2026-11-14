/**
 * LEVEL FORMAT
 * -------------
 * Copy this file to level7.js, fill it in, then import it from index.js
 * and append it to the `levels` array. You do not need a new screen.
 *
 * A level is one plain object. Everything the player reads is a string.
 * The only function is `check`. JSON cannot store a function, so levels
 * are JavaScript files. The fields besides `check` are still just data.
 *
 * Ids must be 1, 2, 3... with no gaps. Island N unlocks when island N-1
 * has been won, because progress.js treats "completed includes id - 1"
 * as the whole lock rule.
 *
 * check(circuit) receives:
 *   {
 *     slots: [{ id, part }],     // part is null, or a part from src/lib/parts.js
 *     supply: { volts },
 *     ledVf: number,
 *   }
 *
 * A resistor part looks like { type: 'resistor', ohms: 390 }.
 * A switch part looks like  { type: 'switch', closed: true }.
 * Other parts are { type: 'led' }, { type: 'wire' }, and so on.
 *
 * check() must return this shape every time (the screen reads these keys):
 *   {
 *     complete: false,           // true only when this island is won
 *     currentMa: 0,              // number, or Infinity if current ran away
 *     led: 'off',                // 'off' | 'dim' | 'lit' | 'burnt'
 *     headline: 'Short status',
 *     detail: 'One or two sentences of feedback.',
 *     equation: 'I = 0. Say why, or show the arithmetic.',
 *   }
 *
 * Keep the math in the level file so a new island can use a different rule
 * (two resistors, a capacitor, a 555) without a simulator.
 *
 * map.x and map.y are percentages of the sea, from the top-left.
 * hints are the lines Athena falls back to when GEMINI_API_KEY is missing.
 * athenaNote is a private instruction for the model. The player never sees it.
 */

import { placeholderResult } from './placeholder.js';

export const levelTemplate = {
  id: 0,
  title: 'Island name',
  epithet: 'The idea this island teaches',
  place: 'A place in the Odyssey',
  map: { x: 50, y: 50 },
  stub: true,
  concept: 'One sentence the hint API can see.',
  goal: 'What a correct board looks like, in one sentence.',
  athenaNote: 'Tell the model what NOT to spoil.',
  story: 'Two or three sentences of story. Speak to the voyage, then name the circuit.',
  lessons: [
    { title: 'Card title', body: 'A short paragraph. One idea only.' },
  ],
  supply: { volts: 9, label: '9 V battery' },
  led: { vf: 2, label: 'red LED' },
  slots: [
    { id: 's1', hint: 'Switch' },
    { id: 's2', hint: 'Resistor' },
    { id: 's3', hint: 'LED' },
  ],
  resistorValues: [100, 330, 1000, 10000],
  defaultOhms: 1000,
  hints: [
    'A prepared hint, used when the Gemini call is unavailable.',
    'A second hint. The button cycles these.',
  ],
  buildSummary: {
    title: 'What you built',
    lines: ['Shown on the win banner. Say what the circuit was, in plain words.'],
  },
  check() {
    return placeholderResult('Island name');
  },
};
