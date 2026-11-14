/**
 * The controls for one study island: slots, pickers, sliders, truth tables,
 * the schematic, and the waveform when the puzzle has a time or a blink.
 */

import { useEffect, useState } from 'react';
import { formatSi } from '../../learn/format.js';
import { rcSamples, squareSamples } from '../../learn/physics.js';
import ChoicePicker from './ChoicePicker.jsx';
import Schematic from './Schematic.jsx';
import TruthTable from './TruthTable.jsx';
import ValueSlider from './ValueSlider.jsx';
import Waveform from './Waveform.jsx';

export default function PuzzleBoard({ level, tune, state, onChange, result }) {
  const high = result.wave?.kind === 'astable' ? result.wave.high : 0;
  const low = result.wave?.kind === 'astable' ? result.wave.low : 0;
  const [blinkOn, setBlinkOn] = useState(true);

  useEffect(() => {
    if (!(high > 0) || !(low > 0)) return undefined;
    const period = high + low;
    if (period < 0.2 || period > 6) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let cancel = false;
    let timer = 0;
    const tick = (lit) => {
      if (cancel) return;
      setBlinkOn(lit);
      timer = window.setTimeout(() => tick(!lit), (lit ? high : low) * 1000);
    };
    tick(true);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [high, low]);

  const puzzle = level.puzzle;
  return (
    <section className="card learn-board">
      <div className="builder-head">
        <h2>The puzzle</h2>
        <p>{level.goal}</p>
      </div>
      <Schematic level={level} state={state} lamp={result.lamp} blinkOn={blinkOn} />
      {puzzle.kind === 'closed-loop' && (
        <ClosedLoop level={level} tune={tune} state={state} onChange={onChange} />
      )}
      {puzzle.kind === 'ohms' && (
        <Ohms puzzle={puzzle} tune={tune} state={state} onChange={onChange} result={result} />
      )}
      {puzzle.kind === 'series-parallel' && (
        <SeriesParallel puzzle={puzzle} tune={tune} state={state} onChange={onChange} />
      )}
      {puzzle.kind === 'rc' && (
        <Rc puzzle={puzzle} tune={tune} state={state} onChange={onChange} result={result} />
      )}
      {puzzle.kind === 'flyback' && (
        <Flyback puzzle={puzzle} tune={tune} state={state} onChange={onChange} />
      )}
      {puzzle.kind === 'astable' && (
        <Astable puzzle={puzzle} tune={tune} state={state} onChange={onChange} result={result} blinkOn={blinkOn} />
      )}
    </section>
  );
}

function ClosedLoop({ level, tune, state, onChange }) {
  const [armed, setArmed] = useState(null);
  const parts = (level.puzzle.parts || []).filter((part) => !(tune.hideDecoys && part.decoy));
  const slotIds = level.puzzle.slotIds || [];

  function place(slotId, partId) {
    if (!partId) return;
    onChange({ ...state, slots: { ...state.slots, [slotId]: partId } });
    setArmed(null);
  }

  return (
    <div className="puzzle-controls">
      <p className="control-note">Click a part, then a slot. Dragging works too.</p>
      <ul className="part-tray">
        {parts.map((part) => (
          <li key={part.id}>
            <button
              type="button"
              className={armed === part.id ? 'part selected' : 'part'}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', part.id);
                event.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => setArmed(armed === part.id ? null : part.id)}
            >
              {part.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="slot-row">
        {slotIds.map((slotId, index) => {
          const placed = state.slots?.[slotId];
          return (
            <div
              key={slotId}
              className={placed ? 'study-slot filled' : 'study-slot'}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                place(slotId, event.dataTransfer.getData('text/plain') || armed);
              }}
            >
              <span className="slot-kicker">Slot {index + 1}</span>
              <button type="button" className="slot-hit" onClick={() => armed && place(slotId, armed)}>
                <span className="slot-name">{placed || 'Empty'}</span>
              </button>
              {placed && (
                <button
                  type="button"
                  className="slot-clear"
                  onClick={() => onChange({ ...state, slots: { ...state.slots, [slotId]: null } })}
                >
                  Clear
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="choice-row">
        <button
          type="button"
          className="btn btn-quiet"
          disabled={!Object.values(state.slots || {}).includes('switch')}
          onClick={() => onChange({ ...state, switchClosed: !state.switchClosed })}
        >
          {state.switchClosed ? 'Open the switch' : 'Close the switch'}
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          disabled={!Object.values(state.slots || {}).includes('led')}
          onClick={() => onChange({ ...state, ledForward: !state.ledForward })}
        >
          {state.ledForward ? 'LED is forward — flip it' : 'LED is backwards — flip it'}
        </button>
      </div>
      {tune.requireTruth && level.puzzle.truth && (
        <TruthTable {...level.puzzle.truth} value={state.truth} onChange={(index, choice) => setTruth(state, onChange, index, choice)} />
      )}
    </div>
  );
}

function Ohms({ puzzle, tune, state, onChange, result }) {
  return (
    <div className="puzzle-controls">
      <div className={`lamp lamp-${result.lamp}`} aria-hidden="true">
        <div className="lamp-bulb" />
        <div className="lamp-base" />
        <span className="lamp-label">{result.meter?.value || 'no resistor'}</span>
      </div>
      <ChoicePicker
        label="Resistor in the pouch"
        value={state.ohms == null ? '' : String(state.ohms)}
        onChange={(id) => onChange({ ...state, ohms: Number(id) })}
        options={(puzzle.choices || []).map((choice) => ({
          id: String(choice.ohms),
          label: choice.label || formatSi(choice.ohms, 'Ω'),
          detail: choice.detail,
        }))}
      />
      <ValueSlider
        label={tune.requirePrediction ? 'Predicted LED current' : 'Optional: predict the current'}
        min={0}
        max={40}
        step={0.5}
        unit="mA"
        value={state.predictionMa}
        onChange={(predictionMa) => onChange({ ...state, predictionMa })}
      />
    </div>
  );
}

function SeriesParallel({ puzzle, tune, state, onChange }) {
  return (
    <div className="puzzle-controls">
      <ChoicePicker
        label="Wiring"
        value={state.topology || ''}
        onChange={(topology) => onChange({ ...state, topology })}
        options={puzzle.topologies || []}
      />
      {tune.requireTruth && puzzle.truth && (
        <TruthTable {...puzzle.truth} value={state.truth} onChange={(index, choice) => setTruth(state, onChange, index, choice)} />
      )}
    </div>
  );
}

function Rc({ puzzle, tune, state, onChange, result }) {
  const wave = result.wave?.kind === 'rc' ? result.wave : null;
  return (
    <div className="puzzle-controls">
      <p className="control-note">
        The winds asked for {formatSi(tune.targetTau ?? puzzle.targetTau, 's')} to 63%.
      </p>
      <QuantityControl
        label="Resistance"
        unit="Ω"
        value={state.ohms}
        choices={puzzle.resistorOhms}
        tune={tune}
        slider={puzzle.rSlider}
        onChange={(ohms) => onChange({ ...state, ohms })}
      />
      <QuantityControl
        label="Capacitance"
        unit="F"
        value={state.farads}
        choices={puzzle.capacitorFarads}
        tune={tune}
        slider={puzzle.cSlider}
        onChange={(farads) => onChange({ ...state, farads })}
      />
      <Waveform
        samples={wave ? rcSamples({ volts: wave.volts, tau: wave.tau, horizon: wave.xMax }) : []}
        xMax={wave?.xMax}
        yMax={wave?.yMax}
        markers={wave ? [
          { y: wave.volts * 0.632, label: '63%' },
          { x: wave.target, label: 'asked' },
          { x: wave.tau, label: 'τ' },
        ] : []}
        xLabel="time (s)"
        yLabel="V"
        ariaLabel="Capacitor voltage while charging"
      />
    </div>
  );
}

function Flyback({ puzzle, tune, state, onChange }) {
  const guided = tune.labelStyle === 'guided';
  return (
    <div className="puzzle-controls">
      <ChoicePicker
        label="Across the coil"
        value={state.diode || ''}
        onChange={(diode) => onChange({ ...state, diode })}
        options={(puzzle.choices || []).map((choice) => ({
          id: choice.id,
          label: guided && choice.guided ? choice.guided : choice.label,
        }))}
      />
      {tune.requireTruth && puzzle.truth && (
        <TruthTable {...puzzle.truth} value={state.truth} onChange={(index, choice) => setTruth(state, onChange, index, choice)} />
      )}
    </div>
  );
}

function Astable({ puzzle, tune, state, onChange, result, blinkOn }) {
  const wave = result.wave?.kind === 'astable' ? result.wave : null;
  const period = wave ? wave.high + wave.low : 0;
  return (
    <div className="puzzle-controls">
      <div className={`lamp ${blinkOn && result.lamp !== 'off' ? 'lamp-lit' : 'lamp-off'}`} aria-hidden="true">
        <div className="lamp-bulb" />
        <div className="lamp-base" />
        <span className="lamp-label">{result.meter?.value || 'no blink yet'}</span>
      </div>
      <QuantityControl
        label="R1"
        unit="Ω"
        value={state.r1}
        choices={puzzle.r1Ohms}
        tune={tune}
        slider={puzzle.r1Slider}
        onChange={(r1) => onChange({ ...state, r1 })}
      />
      <QuantityControl
        label="R2"
        unit="Ω"
        value={state.r2}
        choices={puzzle.r2Ohms}
        tune={tune}
        slider={puzzle.r2Slider}
        onChange={(r2) => onChange({ ...state, r2 })}
      />
      <QuantityControl
        label="Capacitance"
        unit="F"
        value={state.farads}
        choices={puzzle.capacitorFarads}
        tune={tune}
        slider={puzzle.cSlider}
        onChange={(farads) => onChange({ ...state, farads })}
      />
      <Waveform
        samples={wave ? squareSamples({ high: wave.high, low: wave.low, volts: wave.volts }) : []}
        xMax={period > 0 ? period * 2 : 0}
        yMax={wave?.volts || 1}
        xLabel="time (s)"
        yLabel="V"
        ariaLabel="555 output square wave"
      />
    </div>
  );
}

function QuantityControl({ label, unit, value, choices, tune, slider, onChange }) {
  if (tune.control === 'picker') {
    return (
      <ChoicePicker
        label={label}
        value={value == null ? '' : String(value)}
        onChange={(id) => onChange(Number(id))}
        options={(choices || []).map((choice) => ({
          id: String(choice),
          label: formatSi(choice, unit),
        }))}
      />
    );
  }
  if (tune.sliderMode === 'log' && slider) {
    return (
      <ValueSlider
        label={label}
        si
        scale="log"
        unit={unit}
        min={slider.min}
        max={slider.max}
        value={value}
        onChange={onChange}
      />
    );
  }
  return (
    <ValueSlider
      label={label}
      si
      unit={unit}
      stops={(choices || []).map((choice) => ({ value: choice }))}
      value={value}
      onChange={onChange}
    />
  );
}

function setTruth(state, onChange, index, choice) {
  onChange({ ...state, truth: { ...state.truth, [index]: choice } });
}
