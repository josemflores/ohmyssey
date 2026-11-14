/**
 * SI prefixes for the study controls.
 * Pass the value in the base unit (ohms, farads, amps, hertz, seconds).
 * 10000 ohms renders as "10 kΩ". 0.00001 farads renders as "10 µF".
 */

const STEPS = [
  { prefix: 'T', exp: 12 },
  { prefix: 'G', exp: 9 },
  { prefix: 'M', exp: 6 },
  { prefix: 'k', exp: 3 },
  { prefix: '', exp: 0 },
  { prefix: 'm', exp: -3 },
  { prefix: 'µ', exp: -6 },
  { prefix: 'n', exp: -9 },
  { prefix: 'p', exp: -12 },
];

export function formatSi(value, unit) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  if (value === 0) return `0 ${unit}`;
  const negative = value < 0;
  const abs = Math.abs(value);
  let chosen = STEPS[STEPS.length - 1];
  for (const step of STEPS) {
    if (abs >= 10 ** step.exp) {
      chosen = step;
      break;
    }
  }
  const scaled = abs / 10 ** chosen.exp;
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  const text = trimZeros(scaled.toFixed(digits));
  return `${negative ? '−' : ''}${text} ${chosen.prefix}${unit}`;
}

export function formatPlain(value, unit, digits = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const text = trimZeros(value.toFixed(digits));
  return unit ? `${text} ${unit}` : text;
}

/** Snap to a few significant figures so a log slider can land on 100 kΩ or 10 µF. */
export function snapSig(value, digits = 2) {
  if (!Number.isFinite(value) || value === 0) return 0;
  const sign = value < 0 ? -1 : 1;
  const snapped = Number(Math.abs(value).toPrecision(digits));
  return Number.isFinite(snapped) ? sign * snapped : value;
}

export function sameQuantity(a, b) {
  if (a === b) return true;
  if (typeof a !== 'number' || typeof b !== 'number') return false;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= 1e-9 * scale;
}

function trimZeros(text) {
  if (!text.includes('.')) return text;
  return text.replace(/0+$/, '').replace(/\.$/, '');
}
