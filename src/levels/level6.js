/**
 * Level 6 — The Lighthouse of Ithaca.
 * A 555 timer in astable mode. The beacon wins when the blink rate sits
 * between 0.5 Hz and 2 Hz.
 *
 *   f      = 1.44 / ((R1 + 2 R2) C)
 *   t_high = 0.693 (R1 + R2) C
 *   t_low  = 0.693 R2 C
 *
 * Worked example:
 *   R1 = 1 kΩ, R2 = 68 kΩ, C = 10 µF
 *   R1 + 2 R2 = 137 kΩ
 *   (R1 + 2 R2) C = 137000 × 10×10⁻⁶ = 1.37
 *   f = 1.44 / 1.37 ≈ 1.05 Hz
 *
 * The slot board can choose a resistor value, but every capacitor it
 * places is 10 µF (see makePart in src/lib/parts.js). With that capacitor,
 * and R1 left at 1 kΩ, the pouch works out like this:
 *   R2 = 220 Ω    → 100 Hz   too fast
 *   R2 = 1 kΩ     → 48 Hz    too fast
 *   R2 = 10 kΩ    → 6.86 Hz  too fast
 *   R2 = 68 kΩ    → 1.05 Hz  win
 *   R2 = 470 kΩ   → 0.15 Hz  too slow
 * Swapping the example (R1 = 68 kΩ, R2 = 1 kΩ) is about 2.06 Hz, just
 * too fast, because R2 is counted twice. Other pairs can also land inside
 * the window. A 1 µF capacitor with the worked resistors is about 10.5 Hz.
 * A 100 µF capacitor with those resistors is about 0.11 Hz.
 *
 * currentMa stays 0. These three slots are the timing network, not the
 * lamp current. The screen still labels its needle in milliamps.
 */

import { formatOhms } from '../lib/ohm.js';

const MIN_HZ = 0.5;
const MAX_HZ = 2;
// Float dust around a boundary that is exactly 0.5 or 2 should still count.
const EDGE_HZ = 1e-9;

const SLOT_R1 = 's1';
const SLOT_R2 = 's2';
const SLOT_C = 's3';

export function astableFrequencyHz(r1Ohms, r2Ohms, farads) {
  if (!(r1Ohms > 0) || !(r2Ohms > 0) || !(farads > 0)) return NaN;
  return 1.44 / ((r1Ohms + 2 * r2Ohms) * farads);
}

export function astableTimes(r1Ohms, r2Ohms, farads) {
  if (!(r1Ohms > 0) || !(r2Ohms > 0) || !(farads > 0)) {
    return { high: NaN, low: NaN };
  }
  return {
    high: 0.693 * (r1Ohms + r2Ohms) * farads,
    low: 0.693 * r2Ohms * farads,
  };
}

export const level6 = {
  id: 6,
  title: 'The Lighthouse of Ithaca',
  epithet: 'The 555 beacon',
  place: 'Ithaca',
  map: { x: 13, y: 64 },
  stub: false,
  concept:
    'A 555 timer in astable mode blinks on its own. f = 1.44 / ((R1 + 2 × R2) × C). Ithaca wants a blink from 0.5 Hz to 2 Hz.',
  goal: 'Place a resistor in R1, a resistor in R2, and the capacitor. Choose the resistors so the beacon blinks between 0.5 and 2 Hz.',
  athenaNote:
    'The worked example is R1 = 1 kΩ, R2 = 68 kΩ, and C = 10 µF, about 1.05 Hz. Do not hand over those three values as a finished trio. You may state the formula f = 1.44 / ((R1 + 2 × R2) × C), remind the player that R2 is counted twice, and remind them that 10 µF is 0.00001 F. Any blink from 0.5 Hz to 2 Hz wins, not only the example. The capacitor the board places is 10 µF. Do not invent other capacitor values as if the player could pick them.',
  story:
    'Ithaca is a dark coast. A steady lamp on the cliff would look like a house, so the lighthouse has to blink: slow enough to count, fast enough that a watchman does not take it for dead. The chest still holds the 9 volt battery, and now a 555 timer, two resistors, and one 10 µF capacitor. Wired as an astable, the 555 charges that capacitor through both resistors and lets it discharge through the second resistor alone. The beacon follows that rhythm. Nobody stands at the switch.',
  lessons: [
    {
      title: 'An astable keeps no rest',
      body: 'Astable means the circuit has no stable resting state. It keeps flipping. A 555 wired this way charges a capacitor through two resistors, then discharges that capacitor through one of them, over and over. The output is high during the charge and low during the discharge, and the lighthouse lamp follows the output. You do not press a switch. The beacon keeps its own watch.',
    },
    {
      title: 'The blink formula',
      body: 'The blink rate in hertz is f = 1.44 / ((R1 + 2 × R2) × C). R1 and R2 are in ohms. C is in farads, not microfarads. The 1.44 is a rounded 1 / ln(2). R2 is written twice because the capacitor charges through R1 and R2 together, then discharges through R2 alone. Make R2 larger, or make C larger, and the blink slows down.',
    },
    {
      title: 'High time, low time, and the window',
      body: 'The lamp is on for t_high = 0.693 × (R1 + R2) × C seconds, and off for t_low = 0.693 × R2 × C seconds. Ithaca accepts anything from 0.5 Hz to 2 Hz, about one blink a second. The worked example is R1 = 1 kΩ, R2 = 68 kΩ, and C = 10 µF. R1 + 2 × R2 = 1000 + 136000 = 137000 Ω. 10 µF is 0.00001 F, and 137000 × 0.00001 = 1.37. Then f = 1.44 / 1.37, about 1.05 Hz. The capacitor on this board is that 10 µF part. A 1 µF capacitor with the same resistors would blink near 10 Hz, and a 100 µF capacitor near 0.1 Hz. You choose the two resistors. Any pair that lands inside 0.5 to 2 Hz brings the ship home.',
    },
  ],
  supply: { volts: 9, label: '9 V battery' },
  led: { vf: 2, label: 'red LED' },
  slots: [
    { id: SLOT_R1, hint: 'R1' },
    { id: SLOT_R2, hint: 'R2' },
    { id: SLOT_C, hint: 'Capacitor' },
  ],
  resistorValues: [220, 1000, 10000, 68000, 470000],
  defaultOhms: 1000,
  hints: [
    'Frequency is f = 1.44 / ((R1 + 2 × R2) × C). Use ohms and farads. A microfarad is a millionth of a farad, so move the decimal six places before you multiply.',
    'R2 is in the charge path and it is the whole discharge path, so the formula counts it twice. The resistor in the R2 slot moves the blink more than the one in R1.',
    'Ithaca wants a blink you can count: from one blink every two seconds (0.5 Hz) up to two blinks a second (2 Hz). If the light smears, the timing parts are too small. If the dark drags on, they are too large.',
  ],
  buildSummary: {
    title: 'The beacon of Ithaca',
    lines: [
      'A 555 timer as an astable: it charges a capacitor through R1 and R2, then discharges it through R2, and the lighthouse follows.',
      'f = 1.44 / ((R1 + 2 × R2) × C). The worked example is R1 = 1 kΩ, R2 = 68 kΩ, C = 10 µF, about 1.05 Hz.',
      't_high = 0.693 × (R1 + R2) × C and t_low = 0.693 × R2 × C. Home accepts any blink from 0.5 Hz to 2 Hz.',
    ],
  },
  check(circuit) {
    return judgeBeacon(circuit);
  },
};

function judgeBeacon(circuit) {
  const r1 = partIn(circuit, SLOT_R1);
  const r2 = partIn(circuit, SLOT_R2);
  const cap = partIn(circuit, SLOT_C);

  const missing = [];
  if (!r1) missing.push('R1');
  if (!r2) missing.push('R2');
  if (!cap) missing.push('the capacitor');
  if (missing.length > 0) {
    return unread('The lighthouse is dark.', missingDetail(missing), 'f is undefined. The formula needs R1, R2, and C before it can name a blink rate.');
  }

  if (r1.type !== 'resistor') {
    return unread(
      'R1 has to be a resistor.',
      `The R1 slot is holding ${partName(r1)}. That resistor is the first part of the charge path. The capacitor belongs in the third slot, where the 555 can charge it and let it go.`,
      'f = 1.44 / ((R1 + 2 × R2) × C) needs a resistance in ohms for R1.',
    );
  }
  if (r2.type !== 'resistor') {
    return unread(
      'R2 has to be a resistor.',
      `The R2 slot is holding ${partName(r2)}. The capacitor charges through R1 and R2, then discharges through R2 alone, so the second slot has to be a resistor.`,
      'f = 1.44 / ((R1 + 2 × R2) × C) needs a resistance in ohms for R2.',
    );
  }
  if (cap.type !== 'capacitor') {
    return unread(
      'The third slot needs the capacitor.',
      `That slot is holding ${partName(cap)}. The blink is how long a capacitor takes to charge and discharge. An LED, a wire, or another resistor will not store that charge.`,
      'f = 1.44 / ((R1 + 2 × R2) × C) needs a capacitance for C.',
    );
  }

  const r1Ohms = Number(r1.ohms);
  const r2Ohms = Number(r2.ohms);
  const microfarads = Number(cap.microfarads);
  if (!(r1Ohms > 0) || !(r2Ohms > 0)) {
    return unread(
      'A resistor has no usable value.',
      'R1 and R2 both need a resistance above zero ohms before the timer can charge the capacitor.',
      'f is undefined while a timing resistor is 0 Ω or missing its value.',
    );
  }
  if (!(microfarads > 0)) {
    return unread(
      'The capacitor has no usable value.',
      'The blink needs a capacitance above zero. The capacitor this board places is 10 µF.',
      'f is undefined while C is 0 F.',
    );
  }

  const farads = microfarads * 1e-6;
  const hz = astableFrequencyHz(r1Ohms, r2Ohms, farads);
  const times = astableTimes(r1Ohms, r2Ohms, farads);
  const equation = beaconEquation({ r1Ohms, r2Ohms, microfarads, hz, high: times.high, low: times.low });
  const rate = formatHz(hz);
  const onOff = `On for about ${formatSeconds(times.high)}, off for about ${formatSeconds(times.low)}.`;

  if (hz > MAX_HZ + EDGE_HZ) {
    return {
      complete: false,
      currentMa: 0,
      led: 'lit',
      headline: 'The beacon is a blur.',
      detail: `${rate} is faster than 2 Hz, with ${formatCap(microfarads)} in the timer. The watch sees a smear of light, not a blink it can count. R2 is counted twice, so raising R2 slows the beacon more than raising R1. ${onOff}`,
      equation,
    };
  }
  if (hz < MIN_HZ - EDGE_HZ) {
    return {
      complete: false,
      currentMa: 0,
      led: 'dim',
      headline: 'The beacon looks abandoned.',
      detail: `${rate} is slower than 0.5 Hz, with ${formatCap(microfarads)} in the timer. The dark lasts so long the coast looks unlit. Lowering R2 speeds the blink the most, because the capacitor discharges through R2 alone. If R2 is already the smaller resistor and the light is still late, bring R1 down. ${onOff}`,
      equation,
    };
  }
  return {
    complete: true,
    currentMa: 0,
    led: 'lit',
    headline: 'The beacon holds. Ithaca can see you.',
    detail: `${rate} sits between 0.5 Hz and 2 Hz. The lamp is on for about ${formatSeconds(times.high)} and off for about ${formatSeconds(times.low)}. The harbor mouth is open.`,
    equation,
  };
}

function unread(headline, detail, equation) {
  return {
    complete: false,
    currentMa: 0,
    led: 'off',
    headline,
    detail,
    equation,
  };
}

function missingDetail(missing) {
  if (missing.length === 3) {
    return 'R1, R2, and the capacitor are all missing. Place a resistor in the R1 slot, a resistor in the R2 slot, and a capacitor in the third slot.';
  }
  const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(' and ')} and ${missing[missing.length - 1]}`;
  const verb = missing.length === 1 ? 'is' : 'are';
  return `${list} ${verb} missing, so the timer has no complete charge and discharge path. The beacon stays dark until every slot is filled.`;
}

function partIn(circuit, id) {
  const slots = Array.isArray(circuit?.slots) ? circuit.slots : [];
  const slot = slots.find((item) => item && item.id === id);
  return slot?.part || null;
}

function partName(part) {
  const names = {
    resistor: 'a resistor',
    capacitor: 'a capacitor',
    switch: 'a switch',
    led: 'an LED',
    wire: 'a wire',
    diode: 'a diode',
    inductor: 'an inductor',
    battery: 'a battery',
  };
  return names[part?.type] || `a ${part?.type || 'part'}`;
}

function beaconEquation({ r1Ohms, r2Ohms, microfarads, hz, high, low }) {
  const product = (r1Ohms + 2 * r2Ohms) * microfarads * 1e-6;
  return `f = 1.44 / ((${formatOhms(r1Ohms)} + 2 × ${formatOhms(r2Ohms)}) × ${formatCap(microfarads)}) = 1.44 / ${formatProduct(product)} = ${formatHz(hz)}. t_high = ${formatSeconds(high)}, t_low = ${formatSeconds(low)}.`;
}

function formatHz(hz) {
  if (!Number.isFinite(hz)) return 'an unreadable rate';
  if (hz >= 10) {
    const tenths = Math.round(hz * 10) / 10;
    return Number.isInteger(tenths) ? `${tenths.toFixed(0)} Hz` : `${tenths.toFixed(1)} Hz`;
  }
  return `${hz.toFixed(2)} Hz`;
}

function formatSeconds(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  return `${seconds.toFixed(2)} s`;
}

function formatProduct(value) {
  if (!Number.isFinite(value)) return '—';
  if (value >= 10) return value.toFixed(1);
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(3);
}

function formatCap(microfarads) {
  const rounded = Math.round(microfarads * 1000) / 1000;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `${text} µF`;
}
