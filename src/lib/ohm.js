/**
 * The small amount of electronics the early levels share.
 *
 * This is not a circuit simulator. It only answers one question:
 * "If a battery, a closed switch, one resistor, and one LED are in a
 * single series loop, how much current flows?"
 *
 * Assumption we tell the player out loud: a red LED holds about 2 V
 * (its forward voltage) and the resistor gets the rest of the battery.
 * Real LEDs move a little with color and current. Holding Vf at 2.0 V
 * keeps the arithmetic something a person can do on paper.
 *
 *   voltage across the resistor = Vbattery − Vled
 *   current (amps)               = that voltage / resistance (ohms)
 *   current (milliamps)          = amps × 1000
 *
 * Worked example from Level 2:
 *   (9 V − 2 V) / 390 Ω = 0.01795 A = 17.9 mA, about 18 mA.
 */

// A small red indicator LED is comfortable around 5–20 mA.
// Its absolute maximum is often 30 mA. Above that we call it burnt out.
export const LED_LIT_MIN_MA = 5;
export const LED_BURNOUT_MA = 30;

export function seriesLedCurrentMa({ volts, ledVf, ohms }) {
  if (!(ohms > 0)) return Infinity;
  const resistorVolts = volts - ledVf;
  if (resistorVolts <= 0) return 0;
  return (resistorVolts / ohms) * 1000;
}

export function classifyLed(currentMa) {
  if (!Number.isFinite(currentMa) || currentMa > LED_BURNOUT_MA) return 'burnt';
  if (currentMa >= LED_LIT_MIN_MA) return 'lit';
  if (currentMa > 0) return 'dim';
  return 'off';
}

export function formatOhms(ohms) {
  if (ohms >= 1000) {
    const kilo = ohms / 1000;
    const text = Number.isInteger(kilo) ? String(kilo) : kilo.toFixed(1);
    return `${text} kΩ`;
  }
  return `${ohms} Ω`;
}

export function formatMa(currentMa) {
  if (!Number.isFinite(currentMa)) return 'too high to measure';
  const digits = currentMa >= 100 ? 0 : 1;
  return `${currentMa.toFixed(digits)} mA`;
}

/**
 * Read a 3-slot series lamp. `ready` means the slots hold exactly one
 * switch, one resistor, and one LED. Anything else is an open or wrong
 * loop, and the current is reported as 0. Level files decide the win.
 */
export function readSeriesLamp(circuit) {
  const slots = circuit.slots || [];
  const parts = slots.map((slot) => slot.part);
  const problem = seriesLampProblem(parts);
  if (problem) {
    return {
      ready: false,
      problem,
      currentMa: 0,
      led: 'off',
      equation: 'I = 0. The path around the battery is not a single closed lamp loop.',
    };
  }

  const resistor = parts.find((part) => part.type === 'resistor');
  const switchPart = parts.find((part) => part.type === 'switch');
  const volts = circuit.supply.volts;
  const ledVf = circuit.ledVf;
  const currentIfClosed = seriesLedCurrentMa({
    volts,
    ledVf,
    ohms: resistor.ohms,
  });
  const resistorVolts = volts - ledVf;

  return {
    ready: true,
    switchClosed: Boolean(switchPart.closed),
    ohms: resistor.ohms,
    currentIfClosed,
    ledIfClosed: classifyLed(currentIfClosed),
    equationIfClosed: equationLine({ volts, ledVf, resistorVolts, ohms: resistor.ohms, currentMa: currentIfClosed }),
  };
}

export function equationLine({ volts, ledVf, resistorVolts, ohms, currentMa }) {
  return `I = (${volts} V − ${ledVf} V) / ${formatOhms(ohms)} = ${resistorVolts} V / ${formatOhms(ohms)} = ${formatMa(currentMa)}`;
}

function seriesLampProblem(parts) {
  if (parts.some((part) => !part)) {
    return 'A slot is empty, so the loop is broken and no current flows.';
  }
  const count = (type) => parts.filter((part) => part.type === type).length;
  if (count('switch') < 1) {
    return 'The loop needs a switch, so the lamp can be opened and closed.';
  }
  if (count('resistor') < 1) {
    return 'The loop needs a resistor. A red LED across a 9 V battery with no resistor burns out.';
  }
  if (count('led') < 1) {
    return 'The loop needs the LED. Without it there is nothing to light.';
  }
  if (parts.length !== 3 || count('switch') !== 1 || count('resistor') !== 1 || count('led') !== 1) {
    return 'Use one switch, one resistor, and one LED. A wire or a second copy of a part leaves the lamp unfinished.';
  }
  return null;
}
