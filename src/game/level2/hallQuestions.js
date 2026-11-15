// Questions for Ithaca (Level 2): capacitors and inductors, with the
// resistors, diodes and sources from Troy. Kept short and quick to solve:
// one idea or one small calculation each, friendly numbers.
//
// `answer` is the index of the right choice as written; choices are
// shuffled each time a question is served. Some carry a `circuit` drawing
// (see CircuitDiagram.jsx). `moment` on a circuit says when we look:
//   'start'   just after the switch closes (an empty capacitor acts like a
//             wire; an inductor lets no current through yet)
//   'settled' long after (a charged capacitor passes no DC; an inductor
//             acts like a plain wire)
// scripts/check-questions.js solves every drawing and checks the answer.

import { shuffleChoices } from '../../learn/encounters/questions.js';

const R = (label) => ({ kind: 'resistor', label });
const C = (label) => ({ kind: 'capacitor', label });
const L = (label) => ({ kind: 'inductor', label });
const series = (source, parts, ask, moment) => ({ layout: 'series', source, parts, ask, moment });

export const HALL_QUESTIONS = [
  // ---- Capacitors in a DC loop ----
  {
    id: 'cap-settled-current',
    prompt: 'Long after switch-on, the capacitor is full. Find the current I.',
    circuit: series('9 V', [R('1 kΩ'), C('100 µF')], { type: 'current' }, 'settled'),
    choices: ['0 mA', '9 mA', '90 mA', '0.9 mA'],
    answer: 0,
    hint: 'A full capacitor blocks steady DC, so no current flows: 0 mA.',
  },
  {
    id: 'cap-start-current',
    prompt: 'Just after switch-on, the capacitor is empty. Find the current I.',
    circuit: series('9 V', [R('1 kΩ'), C('100 µF')], { type: 'current' }, 'start'),
    choices: ['9 mA', '0 mA', '90 mA', '0.9 mA'],
    answer: 0,
    hint: 'An empty capacitor acts like a wire for a moment: I = 9 V ÷ 1 kΩ = 9 mA.',
  },
  {
    id: 'cap-settled-voltage',
    prompt: 'Long after switch-on, find the voltage V across the capacitor.',
    circuit: series('12 V', [R('2 kΩ'), C('47 µF')], { type: 'voltage', part: 1 }, 'settled'),
    choices: ['12 V', '0 V', '6 V', '24 V'],
    answer: 0,
    hint: 'No current flows once it is full, so the resistor drops 0 V and the capacitor holds all 12 V.',
  },
  {
    id: 'cap-led-settled',
    prompt: 'Long after switch-on, is the LED lit?',
    circuit: series('9 V', [R('330 Ω'), C('100 µF'), { kind: 'led', label: '2 V' }], null, 'settled'),
    choices: [
      'No: the full capacitor stops the current',
      'Yes: the battery keeps pushing current',
      'Yes, but dimmer: some current leaks',
      'No: the LED is in backwards',
    ],
    answer: 0,
    hint: 'A capacitor in series passes current only while it charges. Once full, the loop carries 0 mA and the LED goes dark.',
  },
  // ---- Inductors in a DC loop ----
  {
    id: 'ind-settled-current',
    prompt: 'Long after switch-on, find the current I.',
    circuit: series('12 V', [R('2 kΩ'), L('10 mH')], { type: 'current' }, 'settled'),
    choices: ['6 mA', '0 mA', '24 mA', '12 mA'],
    answer: 0,
    hint: 'Once the current is steady, an inductor acts like a plain wire: I = 12 V ÷ 2 kΩ = 6 mA.',
  },
  {
    id: 'ind-start-current',
    prompt: 'Just after switch-on, find the current I.',
    circuit: series('12 V', [R('2 kΩ'), L('10 mH')], { type: 'current' }, 'start'),
    choices: ['0 mA', '6 mA', '24 mA', '12 mA'],
    answer: 0,
    hint: 'An inductor fights a change in current, so at the first instant the current is still 0 mA. It rises from there.',
  },
  {
    id: 'ind-settled-voltage',
    prompt: 'Long after switch-on, find the voltage V across the inductor.',
    circuit: series('9 V', [R('3 kΩ'), L('5 mH')], { type: 'voltage', part: 1 }, 'settled'),
    choices: ['0 V', '9 V', '3 V', '4.5 V'],
    answer: 0,
    hint: 'With a steady current an inductor drops no voltage, like a wire. All 9 V sits across the resistor.',
  },
  // ---- Time constants ----
  {
    id: 'tau-rc',
    prompt: 'Find the time constant τ = R × C.',
    circuit: series('9 V', [R('10 kΩ'), C('100 µF')], null),
    choices: ['1 s', '0.1 s', '10 s', '1000 s'],
    answer: 0,
    hint: 'τ = 10,000 Ω × 0.0001 F = 1 s. Turn µF into farads first.',
  },
  {
    id: 'tau-rc-2',
    prompt: 'A 2 kΩ resistor charges a 500 µF capacitor. What is τ = R × C?',
    choices: ['1 s', '1000 s', '0.25 s', '4 s'],
    answer: 0,
    hint: 'τ = 2,000 Ω × 0.0005 F = 1 s.',
  },
  {
    id: 'tau-rl',
    prompt: 'Find the time constant τ = L ÷ R.',
    circuit: series('6 V', [R('10 Ω'), L('100 mH')], null),
    choices: ['10 ms', '1 s', '1000 s', '0.1 ms'],
    answer: 0,
    hint: 'τ = 0.1 H ÷ 10 Ω = 0.01 s = 10 ms.',
  },
  {
    id: 'one-tau',
    prompt: 'After one time constant τ, a charging capacitor is about how full?',
    choices: ['63%', '100%', '50%', '10%'],
    answer: 0,
    hint: 'After 1τ it is about 63% charged. After 5τ it is nearly full (about 99%).',
  },
  {
    id: 'five-tau',
    prompt: 'About how long until a capacitor is nearly fully charged?',
    choices: ['About 5τ', 'About 1τ', 'Exactly 1 second', 'It never charges'],
    answer: 0,
    hint: 'Charging slows as it fills. By about 5 time constants it is roughly 99% full.',
  },
  // ---- Combining parts ----
  {
    id: 'cap-parallel',
    prompt: 'Two 10 µF capacitors are in parallel. The total capacitance is…',
    choices: ['20 µF', '5 µF', '10 µF', '100 µF'],
    answer: 0,
    hint: 'Capacitors in parallel add, like more plate area: 10 + 10 = 20 µF.',
  },
  {
    id: 'cap-series',
    prompt: 'Two 10 µF capacitors are in series. The total capacitance is…',
    choices: ['5 µF', '20 µF', '10 µF', '100 µF'],
    answer: 0,
    hint: 'Two equal capacitors in series give half of one: 10 ÷ 2 = 5 µF. It is the opposite of resistors.',
  },
  {
    id: 'ind-series',
    prompt: 'A 10 mH and a 20 mH inductor are in series. The total inductance is…',
    choices: ['30 mH', '6.7 mH', '10 mH', '200 mH'],
    answer: 0,
    hint: 'Inductors in series add, just like resistors: 10 + 20 = 30 mH.',
  },
  // ---- What they store, and units ----
  {
    id: 'cap-charge',
    prompt: 'A 10 µF capacitor is charged to 5 V. How much charge Q = C × V does it hold?',
    choices: ['50 µC', '2 µC', '0.5 µC', '15 µC'],
    answer: 0,
    hint: 'Q = C × V = 10 µF × 5 V = 50 µC.',
  },
  {
    id: 'cap-energy',
    prompt: 'A 100 µF capacitor is charged to 10 V. Its energy E = ½ C V² is…',
    choices: ['5 mJ', '1 mJ', '10 mJ', '500 mJ'],
    answer: 0,
    hint: 'E = ½ × 0.0001 F × (10 V)² = ½ × 0.0001 × 100 = 0.005 J = 5 mJ.',
  },
  {
    id: 'unit-uf',
    prompt: '1 µF (one microfarad) is…',
    choices: ['One millionth of a farad', 'One thousandth of a farad', 'One million farads', 'One thousand farads'],
    answer: 0,
    hint: 'Micro (µ) means one millionth: 1 µF = 0.000001 F.',
  },
  {
    id: 'cap-stores',
    prompt: 'A capacitor stores energy in…',
    choices: ['An electric field between its plates', 'A magnetic field in a coil', 'The heat of its leads', 'The current flowing through it'],
    answer: 0,
    hint: 'Charge piles up on two plates with a gap between them; the energy sits in the electric field across the gap. A coil (inductor) uses a magnetic field.',
  },
  {
    id: 'ind-resists',
    prompt: 'An inductor resists…',
    choices: ['Changes in current', 'Any steady current', 'Voltage from a battery', 'Only very small currents'],
    answer: 0,
    hint: 'Its magnetic field pushes back when the current tries to change. A steady current passes as if through a wire.',
  },
  {
    id: 'flyback',
    prompt: 'A coil carries current and the switch suddenly opens. What protects the switch?',
    choices: [
      'A diode across the coil, for the flyback current',
      'A bigger battery',
      'A smaller resistor in series',
      'Nothing: coils cannot make spikes',
    ],
    answer: 0,
    hint: 'The coil tries to keep its current flowing and makes a big voltage spike. A flyback diode gives that current a safe loop.',
  },
];

// The first question at the doors, then the next one after a miss.
export function firstHallQuestion(rng = Math.random) {
  return serve(HALL_QUESTIONS[Math.floor(rng() * HALL_QUESTIONS.length)], rng);
}

export function hallQuestionAfter(id, rng = Math.random) {
  const index = HALL_QUESTIONS.findIndex((q) => q.id === id);
  return serve(HALL_QUESTIONS[(index + 1) % HALL_QUESTIONS.length], rng);
}

function serve(question, rng) {
  const copy = { ...question, choices: question.choices.slice() };
  if (!copy.circuit) delete copy.circuit;
  return shuffleChoices(copy, rng);
}
