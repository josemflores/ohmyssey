/**
 * The formulas the study puzzles grade with.
 * They match the notes in the README: Ohm's law for a 2 V red LED,
 * series and parallel, τ = R C, and the 555 astable blink rate.
 */

export function ledCurrentMa({ volts, ledVf, ohms }) {
  if (!(ohms > 0) || !(volts > ledVf)) return 0;
  return ((volts - ledVf) / ohms) * 1000;
}

export function equivalentOhms(values, topology) {
  const list = (values || []).filter((ohms) => ohms > 0);
  if (list.length === 0) return 0;
  if (topology === 'parallel') {
    const conductance = list.reduce((sum, ohms) => sum + 1 / ohms, 0);
    return conductance > 0 ? 1 / conductance : 0;
  }
  return list.reduce((sum, ohms) => sum + ohms, 0);
}

export function timeConstant(ohms, farads) {
  if (!(ohms > 0) || !(farads > 0)) return 0;
  return ohms * farads;
}

/** Capacitor voltage while charging from 0 toward `volts`. */
export function chargeVolts({ volts, tau, time }) {
  if (!(volts > 0) || !(tau > 0) || !(time >= 0)) return 0;
  return volts * (1 - Math.exp(-time / tau));
}

export function astableHz(r1, r2, farads) {
  if (!(r1 > 0) || !(r2 > 0) || !(farads > 0)) return 0;
  return 1.44 / ((r1 + 2 * r2) * farads);
}

export function astableTimes(r1, r2, farads) {
  if (!(r1 > 0) || !(r2 > 0) || !(farads > 0)) return { high: 0, low: 0, period: 0 };
  const high = 0.693 * (r1 + r2) * farads;
  const low = 0.693 * r2 * farads;
  return { high, low, period: high + low };
}

export function rcSamples({ volts, tau, horizon }) {
  const span = horizon > 0 ? horizon : 1;
  const samples = [];
  const steps = 80;
  for (let i = 0; i <= steps; i += 1) {
    const time = (span * i) / steps;
    samples.push({ x: time, y: chargeVolts({ volts, tau, time }) });
  }
  return samples;
}

export function squareSamples({ high, low, volts, cycles = 2 }) {
  const samples = [];
  let time = 0;
  const highTime = high > 0 ? high : 0;
  const lowTime = low > 0 ? low : 0;
  for (let i = 0; i < cycles; i += 1) {
    samples.push({ x: time, y: volts });
    time += highTime;
    samples.push({ x: time, y: volts });
    samples.push({ x: time, y: 0 });
    time += lowTime;
    samples.push({ x: time, y: 0 });
  }
  return samples;
}
