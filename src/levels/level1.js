/**
 * Level 1 — Leaving Troy.
 * Win: one closed switch, one resistor, one red LED, and a current that
 * lights the LED without burning it (5 to 30 mA).
 *
 * With a 9 V battery and a 2 V LED the resistor sees 7 V.
 *   100 Ω  → 70 mA  burnt out
 *   330 Ω  → 21.2 mA  lit (a little warm, still inside the working range)
 *   1 kΩ   → 7.0 mA  lit
 *   10 kΩ  → 0.7 mA  dim
 */

import { formatMa, readSeriesLamp } from '../lib/ohm.js';

export const level1 = {
  id: 1,
  title: 'Leaving Troy',
  epithet: 'The closed loop',
  place: 'The beach at Troy',
  map: { x: 84, y: 32 },
  stub: false,
  concept: 'Current flows only in a closed loop. A resistor must limit LED current.',
  goal: 'Place one switch, one resistor, and one red LED. Close the switch so the LED is lit, between 5 and 30 mA, and not burnt out.',
  athenaNote:
    'Do not list the winning ohm values. You may say that a small red LED wants a few milliamps to a few tens of milliamps, and that an empty slot or an open switch means zero current.',
  story:
    'The wooden horse has done its work. On the beach at Troy the fires are down to coals, and the boat still has no lamp. Odysseus has a 9 volt battery, a switch, a few resistors, and one red LED. The lamp will not light because he hopes it will. Current only travels in a closed loop, out of the battery and back into it, and the LED will not survive that loop unless a resistor limits the current.',
  lessons: [
    {
      title: 'A closed loop',
      body: 'Current is a round trip. It leaves the battery at the positive terminal, passes through every part, and returns to the negative terminal. An empty slot is a gap. An open switch is a gap. Either one makes the current 0 mA, and the beach stays dark.',
    },
    {
      title: 'What the LED takes',
      body: 'A red LED lights when current goes through it, and it holds about 2 volts for itself. That 2 volts is called the forward voltage. The battery is 9 volts, so the resistor is left with 9 − 2 = 7 volts. The LED is not a grain-of-wheat bulb you can tie straight across a battery.',
    },
    {
      title: 'Why the resistor is there',
      body: 'The current is those 7 volts divided by the resistance: I = V / R. A small red LED is happy from about 5 mA up to about 20 mA, and it is in trouble above about 30 mA. At 100 Ω the current would be 7 / 100 = 0.070 A, which is 70 mA, and the LED burns out. A few hundred ohms, or 1 kΩ, keeps it in the working range.',
    },
  ],
  supply: { volts: 9, label: '9 V battery' },
  led: { vf: 2, label: 'red LED' },
  slots: [
    { id: 's1', hint: 'Switch' },
    { id: 's2', hint: 'Resistor' },
    { id: 's3', hint: 'LED' },
  ],
  resistorValues: [100, 330, 1000, 10000],
  defaultOhms: 100,
  hints: [
    'Follow the wire with your finger, starting at the battery. Every slot has to hold a part, or the round trip is broken and the current is zero.',
    'An open switch is a hole in the wire. Close it before you judge the lamp. Until it closes, the meter should read 0 mA.',
    'Read the milliamps. A small red LED wants roughly 5 to 20 of them. If the number is huge, the resistor is too small. More ohms means less current.',
  ],
  buildSummary: {
    title: 'The beach lamp',
    lines: [
      'One series loop: the 9 V battery, a closed switch, a resistor, and a red LED.',
      'The LED keeps about 2 V. The resistor gets the other 7 V and sets the current with Ohm’s law, I = V / R.',
      'A 330 Ω resistor gives about 21 mA. A 1 kΩ resistor gives 7 mA. Both light the LED. 100 Ω gives 70 mA and burns it out.',
    ],
  },
  check(circuit) {
    const reading = readSeriesLamp(circuit);
    if (!reading.ready) {
      return {
        complete: false,
        currentMa: 0,
        led: 'off',
        headline: 'The beach is dark.',
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
        detail: 'Current cannot cross an open switch, so the LED stays off. Close the switch. The parts are otherwise ready.',
        equation: `I = 0 while the switch is open. Close it and ${reading.equationIfClosed}.`,
      };
    }

    const led = reading.ledIfClosed;
    const currentMa = reading.currentIfClosed;
    if (led === 'burnt') {
      return {
        complete: false,
        currentMa,
        led,
        headline: 'The LED burned out.',
        detail: `${formatMa(currentMa)} is more than a small red LED can take. Anything above about 30 mA counts as burnt out here. Choose a larger resistor so the current falls to between 5 and 20 mA.`,
        equation: reading.equationIfClosed,
      };
    }
    if (led === 'dim') {
      return {
        complete: false,
        currentMa,
        led,
        headline: 'The LED is only a faint coal.',
        detail: `${formatMa(currentMa)} is not enough to light the way off the beach. Below about 5 mA we call the lamp dim. A smaller resistor lets more current through.`,
        equation: reading.equationIfClosed,
      };
    }
    return {
      complete: true,
      currentMa,
      led: 'lit',
      headline: 'The lamp holds. Troy is behind you.',
      detail: `The loop is closed and the LED current is ${formatMa(currentMa)}. That sits inside the working range, so the resistor is doing its job. Push the boat into the water.`,
      equation: reading.equationIfClosed,
    };
  },
};
