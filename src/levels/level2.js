/**
 * Level 2 — The Cyclops.
 * Same series lamp as Level 1, but the current has to land near 18 mA.
 *
 *   R = (9 V − 2 V) / 0.018 A = 388.9 Ω, so the pouch value is 390 Ω.
 *   I = 7 V / 390 Ω = 0.01795 A = 17.9 mA.
 *
 * The win band is 16 to 20 mA. Among the values in resistorValues, only
 * 390 Ω lands inside it:
 *   220 Ω → 31.8 mA  burnt out
 *   330 Ω → 21.2 mA  lit, but above the band
 *   390 Ω → 17.9 mA  win
 *   470 Ω → 14.9 mA  lit, but below the band
 *   1 kΩ  → 7.0 mA   lit, but far too dim for this cave
 */

import { formatMa, readSeriesLamp } from '../lib/ohm.js';

const TARGET_MIN_MA = 16;
const TARGET_MAX_MA = 20;

export const level2 = {
  id: 2,
  title: 'The Cyclops',
  epithet: 'Ohm’s law',
  place: 'The cave of Polyphemus',
  map: { x: 66, y: 62 },
  stub: false,
  concept: "Ohm's law: V = I × R. Choose the resistor that sets the LED near 18 mA.",
  goal: 'Build the same closed lamp loop as Troy, and choose the resistor so the LED current is between 16 and 20 mA (about 18 mA).',
  athenaNote:
    'The winning value is 390 ohms. Do not say that number. Ask the player to compute R = V / I using the voltage left after the LED, and to convert 18 mA into amps (0.018 A) before dividing.',
  story:
    'Polyphemus keeps one great eye. In this telling the eye is a red LED, and it has to glow at about 18 milliamps: bright enough to find the mouth of the cave, not so bright that the eye burns. The ship still carries the 9 volt battery. The LED still uses about 2 volts. Ohm’s law is the whole puzzle. Choose the resistor.',
  lessons: [
    {
      title: 'Ohm’s law',
      body: 'Voltage, current, and resistance are tied together by V = I × R. Voltage is in volts, current in amperes, resistance in ohms. Divide both sides by R and you get I = V / R. Divide both sides by I and you get R = V / I. You only need one of those three forms.',
    },
    {
      title: 'The LED keeps 2 volts',
      body: 'The resistor does not see the full 9 volts. The red LED holds about 2 volts, so the voltage across the resistor is 9 − 2 = 7 volts. Use 7 in Ohm’s law, not 9. Using 9 would pick a resistor that is too large, and the eye would be dim.',
    },
    {
      title: 'Aim at 18 milliamps',
      body: '18 mA is 0.018 amps. The resistance you want is R = 7 V / 0.018 A = 389 Ω. The nearest value in the pouch is 390 Ω. Check it forward: I = 7 / 390 = 0.0179 A = 17.9 mA, which is about 18 mA. The cave accepts anything from 16 to 20 mA.',
    },
  ],
  supply: { volts: 9, label: '9 V battery' },
  led: { vf: 2, label: 'red LED' },
  slots: [
    { id: 's1', hint: 'Switch' },
    { id: 's2', hint: 'Resistor' },
    { id: 's3', hint: 'LED' },
  ],
  resistorValues: [220, 330, 390, 470, 1000],
  defaultOhms: 1000,
  hints: [
    'Ohm’s law says the voltage across the resistor, the current through it, and its resistance move together: V = I × R.',
    'The LED keeps about 2 volts. Subtract that from the 9 volt battery before you blame the resistor for the whole supply.',
    'Turn the target into amps before you divide. 18 milliamps is 0.018 amps. Resistance is the resistor’s voltage divided by that current.',
  ],
  buildSummary: {
    title: 'The eye of the cave',
    lines: [
      'The same series lamp as Troy: battery, closed switch, resistor, red LED.',
      'R = (9 V − 2 V) / 0.018 A = 389 Ω. The part in the pouch is 390 Ω.',
      'I = 7 V / 390 Ω = 17.9 mA, about 18 mA. The cave accepts 16 to 20 mA.',
    ],
  },
  check(circuit) {
    const reading = readSeriesLamp(circuit);
    if (!reading.ready) {
      return {
        complete: false,
        currentMa: 0,
        led: 'off',
        headline: 'The cave is black.',
        detail: reading.problem,
        equation: reading.equation,
      };
    }
    if (!reading.switchClosed) {
      return {
        complete: false,
        currentMa: 0,
        led: 'off',
        headline: 'The switch is open.',
        detail: 'The eye cannot glow through an open switch. Close it, then read the current against the 18 mA mark.',
        equation: `I = 0 while the switch is open. Close it and ${reading.equationIfClosed}.`,
      };
    }

    const currentMa = reading.currentIfClosed;
    const led = reading.ledIfClosed;
    if (led === 'burnt') {
      return {
        complete: false,
        currentMa,
        led,
        headline: 'The eye burned out.',
        detail: `${formatMa(currentMa)} is past 30 mA. The resistor is too small for a 7 volt drop. Compute R = 7 / 0.018 and pick the nearest value.`,
        equation: reading.equationIfClosed,
      };
    }
    if (currentMa >= TARGET_MIN_MA && currentMa <= TARGET_MAX_MA) {
      return {
        complete: true,
        currentMa,
        led: 'lit',
        headline: 'The eye glows at the mark. Slip past the sleeper.',
        detail: `${formatMa(currentMa)} is inside 16 to 20 mA, about 18 mA. The resistor matches Ohm’s law for this cave.`,
        equation: reading.equationIfClosed,
      };
    }
    if (currentMa > TARGET_MAX_MA) {
      return {
        complete: false,
        currentMa,
        led,
        headline: 'The eye is hotter than the cave allows.',
        detail: `${formatMa(currentMa)} is above 20 mA. The lamp is alive, but this puzzle wants about 18 mA. A larger resistor brings the current down.`,
        equation: reading.equationIfClosed,
      };
    }
    return {
      complete: false,
      currentMa,
      led,
      headline: 'The eye is too dim to find the exit.',
      detail: `${formatMa(currentMa)} is under 16 mA. The cave wants about 18 mA. A smaller resistor lets more current through. R = 7 V / 0.018 A.`,
      equation: reading.equationIfClosed,
    };
  },
};
