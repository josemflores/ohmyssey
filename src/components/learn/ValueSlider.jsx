/**
 * A labeled range. `stops` makes it a detent slider (10 kΩ, 100 kΩ, 1 MΩ).
 * `scale="log"` covers a wide SI span and snaps to two significant figures.
 */

import { useId } from 'react';
import { formatPlain, formatSi, sameQuantity, snapSig } from '../../learn/format.js';

export default function ValueSlider({
  label,
  value,
  onChange,
  unit = '',
  si = false,
  min = 0,
  max = 100,
  step = 1,
  scale = 'linear',
  stops,
}) {
  const id = useId();

  if (stops?.length) {
    const index = stops.findIndex((stop) => sameQuantity(stop.value, value));
    const shown = index < 0 ? 'Slide to choose' : show(stops[index].value, unit, si);
    return (
      <div className="value-slider">
        <div className="slider-top">
          <label htmlFor={id}>{label}</label>
          <strong>{shown}</strong>
        </div>
        <input
          id={id}
          type="range"
          min={0}
          max={stops.length - 1}
          step={1}
          value={index < 0 ? 0 : index}
          aria-valuetext={shown}
          onChange={(event) => onChange(stops[Number(event.target.value)].value)}
        />
        <div className="slider-ends" aria-hidden="true">
          <span>{show(stops[0].value, unit, si)}</span>
          <span>{show(stops[stops.length - 1].value, unit, si)}</span>
        </div>
      </div>
    );
  }

  const hasValue = typeof value === 'number' && Number.isFinite(value);
  const numeric = hasValue ? clamp(value, min, max) : min;
  const fraction = scale === 'log'
    ? logFraction(numeric, min, max)
    : (numeric - min) / (max - min || 1);
  const shown = hasValue ? show(numeric, unit, si) : 'Slide to choose';

  function commit(nextFraction) {
    const t = clamp(nextFraction, 0, 1);
    let next = scale === 'log'
      ? Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min)))
      : min + t * (max - min);
    if (scale === 'log') next = snapSig(next);
    else if (step) next = Math.round(next / step) * step;
    onChange(clamp(next, min, max));
  }

  return (
    <div className="value-slider">
      <div className="slider-top">
        <label htmlFor={id}>{label}</label>
        <strong>{shown}</strong>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={1000}
        step={1}
        value={Math.round(clamp(fraction, 0, 1) * 1000)}
        aria-valuetext={shown}
        onChange={(event) => commit(Number(event.target.value) / 1000)}
      />
      <div className="slider-ends" aria-hidden="true">
        <span>{show(min, unit, si)}</span>
        <span>{show(max, unit, si)}</span>
      </div>
    </div>
  );
}

function show(value, unit, si) {
  if (si) return formatSi(value, unit);
  const digits = Math.abs(value) >= 10 ? 1 : 2;
  return formatPlain(value, unit, digits);
}

function logFraction(value, min, max) {
  if (!(min > 0) || !(max > 0) || !(value > 0)) return 0;
  return (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
