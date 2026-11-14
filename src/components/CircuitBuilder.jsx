/**
 * Drag a part into a slot, or click a part and then click a slot.
 * The schematic is a picture of one series loop. The battery on the left
 * is fixed for these early levels. Slots do not simulate wires; the level's
 * check() decides whether the placed parts mean anything.
 *
 * The level owns the slot state so Athena and the win check see the same board.
 */

import { useState } from 'react';
import Symbol from './SchematicSymbols.jsx';
import { PARTS, PART_ORDER, makePart } from '../lib/parts.js';
import { formatOhms } from '../lib/ohm.js';

const DRAG_PREFIX = 'part:';

export default function CircuitBuilder({ level, slots, onSlotsChange, result }) {
  const [selectedType, setSelectedType] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  function place(slotId, type) {
    const part = makePart(type, level);
    if (!part) return;
    onSlotsChange(slots.map((slot) => (slot.id === slotId ? { ...slot, part } : slot)));
  }

  function clearSlot(slotId) {
    onSlotsChange(slots.map((slot) => (slot.id === slotId ? { ...slot, part: null } : slot)));
  }

  function updatePart(slotId, part) {
    onSlotsChange(slots.map((slot) => (slot.id === slotId ? { ...slot, part } : slot)));
  }

  function toggleSwitch(slot) {
    if (slot.part?.type !== 'switch') return;
    updatePart(slot.id, { ...slot.part, closed: !slot.part.closed });
  }

  return (
    <section className="builder card">
      <div className="builder-head">
        <h2>The board</h2>
        <p>
          Click a part, then click a slot. Dragging works too. Click a switch to open or close it.
          The battery stays on the left.
        </p>
      </div>

      <div className="builder-grid">
      <div>
      <div className="schematic" aria-label="Series circuit">
        <svg className="wires" viewBox="0 0 100 62" preserveAspectRatio="none">
          <line x1="13" y1="18" x2="94" y2="18" />
          <line x1="94" y1="18" x2="94" y2="50" />
          <line x1="13" y1="50" x2="94" y2="50" />
          <line x1="13" y1="18" x2="13" y2="26" />
          <line x1="13" y1="42" x2="13" y2="50" />
          <g className="battery-symbol">
            <line x1="8" y1="28" x2="18" y2="28" />
            <line x1="10" y1="32.5" x2="16" y2="32.5" />
            <line x1="8" y1="37" x2="18" y2="37" />
            <line x1="10" y1="41.5" x2="16" y2="41.5" />
          </g>
        </svg>
        <p className="battery-label">
          <span>+</span>
          {level.supply.label}
        </p>

        {slots.map((slot, index) => (
          <Slot
            key={slot.id}
            slot={slot}
            hint={level.slots[index]?.hint || 'Part'}
            style={{ left: `${32 + index * 22}%`, top: '29%' }}
            selectedType={selectedType}
            hover={hoverId === slot.id}
            ledState={slot.part?.type === 'led' ? result.led : 'off'}
            resistorValues={level.resistorValues}
            onDragOver={(event) => {
              event.preventDefault();
              setHoverId(slot.id);
            }}
            onDragLeave={() => setHoverId(null)}
            onDrop={(event) => {
              event.preventDefault();
              setHoverId(null);
              const raw = event.dataTransfer.getData('text/plain');
              if (!raw.startsWith(DRAG_PREFIX)) return;
              place(slot.id, raw.slice(DRAG_PREFIX.length));
              setSelectedType(null);
            }}
            onClick={() => {
              if (selectedType) {
                place(slot.id, selectedType);
                setSelectedType(null);
                return;
              }
              toggleSwitch(slot);
            }}
            onToggle={() => toggleSwitch(slot)}
            onClear={() => clearSlot(slot.id)}
            onOhms={(ohms) => updatePart(slot.id, { ...slot.part, ohms })}
          />
        ))}
      </div>

      <ul className="palette">
        {PART_ORDER.map((type) => {
          const part = PARTS[type];
          const selected = selectedType === type;
          return (
            <li key={type}>
              <button
                type="button"
                className={selected ? 'part selected' : 'part'}
                draggable
                title={part.blurb}
                aria-pressed={selected}
                onClick={() => setSelectedType(selected ? null : type)}
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', DRAG_PREFIX + type);
                  event.dataTransfer.effectAllowed = 'copy';
                  setSelectedType(type);
                }}
              >
                <Symbol type={type} closed={false} />
                <span>{part.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      </div>

      <Feedback result={result} />
      </div>

      {result.complete && (
        <div className="win-banner">
          <h3>{level.buildSummary.title}</h3>
          <ul>
            {level.buildSummary.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="win-next">The next island is unlocked on the map.</p>
        </div>
      )}
    </section>
  );
}

function Slot({
  slot,
  hint,
  style,
  selectedType,
  hover,
  ledState,
  resistorValues,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onToggle,
  onClear,
  onOhms,
}) {
  const part = slot.part;
  const className = [
    'slot',
    part ? 'filled' : 'empty',
    hover ? 'hover' : '',
    selectedType && !part ? 'armed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      style={style}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <button type="button" className="slot-hit" onClick={onClick}>
        {part ? (
          <>
            <Symbol type={part.type} closed={part.closed} glow={ledState} />
            <span className="slot-name">{PARTS[part.type]?.label || part.type}</span>
          </>
        ) : (
          <>
            <span className="slot-kicker">{selectedType ? 'Click to place' : 'Empty'}</span>
            <span className="slot-name">{hint}</span>
          </>
        )}
      </button>
      {part?.type === 'switch' && (
        <button type="button" className="slot-action" onClick={onToggle}>
          {part.closed ? 'Closed — click to open' : 'Open — click to close'}
        </button>
      )}
      {part?.type === 'resistor' && (
        <label className="ohms">
          <span>Value</span>
          <select
            value={part.ohms}
            onChange={(event) => onOhms(Number(event.target.value))}
            onClick={(event) => event.stopPropagation()}
          >
            {resistorValues.map((ohms) => (
              <option key={ohms} value={ohms}>
                {formatOhms(ohms)}
              </option>
            ))}
          </select>
        </label>
      )}
      {part && (
        <button type="button" className="slot-clear" onClick={onClear}>
          Remove
        </button>
      )}
    </div>
  );
}

function Feedback({ result }) {
  return (
    <div className={`feedback led-${result.led}`}>
      <Lamp state={result.led} />
      <div>
        <p className="current-kicker">Current in the loop</p>
        <p className="current-value">
          {formatCurrent(result.currentMa)}
          <span> mA</span>
        </p>
        <h3>{result.headline}</h3>
        <p>{result.detail}</p>
        <p className="equation">{result.equation}</p>
      </div>
    </div>
  );
}

function formatCurrent(currentMa) {
  if (!Number.isFinite(currentMa)) return '—';
  return currentMa >= 100 ? String(Math.round(currentMa)) : currentMa.toFixed(1);
}

function Lamp({ state }) {
  const labels = {
    off: 'LED off',
    dim: 'LED dim',
    lit: 'LED lit',
    burnt: 'LED burnt out',
  };
  return (
    <div className={`lamp lamp-${state}`}>
      <span className="lamp-bulb" />
      <span className="lamp-base" />
      <span className="lamp-label">{labels[state] || 'LED'}</span>
    </div>
  );
}
