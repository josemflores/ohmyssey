/**
 * A teaching schematic, not a simulator. Each puzzle kind draws the few
 * parts that puzzle cares about. `lamp` is off, dim, lit, or burnt.
 */

import { formatSi } from '../../learn/format.js';

export default function Schematic({ level, state, lamp = 'off', blinkOn = false }) {
  const kind = level?.puzzle?.kind;
  const glowing = lamp === 'lit' || (kind === 'astable' && blinkOn && lamp !== 'off');
  return (
    <svg
      className={`learn-schematic lamp-${lamp} ${glowing ? 'is-glowing' : ''}`}
      viewBox="0 0 480 210"
      role="img"
      aria-label={caption(kind)}
    >
      {kind === 'closed-loop' && <ClosedLoop level={level} state={state} lamp={lamp} />}
      {kind === 'ohms' && <Ohms level={level} state={state} lamp={lamp} />}
      {kind === 'series-parallel' && <SeriesParallel state={state} lamp={lamp} />}
      {kind === 'rc' && <Rc state={state} />}
      {kind === 'flyback' && <Flyback state={state} />}
      {kind === 'astable' && <Astable state={state} blinkOn={blinkOn} lamp={lamp} />}
    </svg>
  );
}

function caption(kind) {
  if (kind === 'closed-loop') return 'Series loop with three part slots';
  if (kind === 'ohms') return 'Battery, resistor, and LED';
  if (kind === 'series-parallel') return 'Two resistors, series or parallel';
  if (kind === 'rc') return 'Resistor charging a capacitor';
  if (kind === 'flyback') return 'Coil, switch, and flyback diode';
  if (kind === 'astable') return '555 astable blinking an LED';
  return 'Circuit';
}

function ClosedLoop({ level, state, lamp }) {
  const ids = level.puzzle.slotIds || ['s1', 's2', 's3'];
  const xs = [120, 250, 380];
  return (
    <g>
      <Rail />
      {ids.map((id, index) => (
        <Station key={id} x={xs[index]} y={46} part={state.slots?.[id]} state={state} lamp={lamp} name={`Slot ${index + 1}`} />
      ))}
    </g>
  );
}

function Ohms({ level, state, lamp }) {
  const ohms = state.ohms;
  return (
    <g>
      <Rail />
      <Battery x={40} y={110} />
      <Resistor x={180} y={46} />
      <text x={180} y={28} textAnchor="middle">{ohms ? formatSi(ohms, 'Ω') : 'R'}</text>
      <Led x={340} y={46} forward lamp={lamp} />
      <text x={340} y={78} textAnchor="middle">LED {level.puzzle.ledVf ?? 2} V</text>
    </g>
  );
}

function SeriesParallel({ state, lamp }) {
  if (state.topology === 'parallel') {
    return (
      <g>
        <line x1="40" y1="40" x2="40" y2="170" />
        <line x1="440" y1="40" x2="440" y2="170" />
        <line x1="40" y1="70" x2="150" y2="70" />
        <line x1="250" y1="70" x2="440" y2="70" />
        <line x1="40" y1="140" x2="150" y2="140" />
        <line x1="250" y1="140" x2="440" y2="140" />
        <Battery x={40} y={105} />
        <Resistor x={200} y={70} />
        <Resistor x={200} y={140} />
        <LampDot x={400} y={70} lamp={lamp} />
        <LampDot x={400} y={140} lamp={lamp} />
        <text x="240" y="28" textAnchor="middle">Parallel · two paths</text>
      </g>
    );
  }
  return (
    <g>
      <Rail />
      <Battery x={40} y={110} />
      <Resistor x={170} y={46} />
      <Resistor x={300} y={46} />
      <LampDot x={410} y={46} lamp={state.topology ? lamp : 'off'} />
      <text x="240" y="28" textAnchor="middle">{state.topology === 'series' ? 'Series · one path' : 'Choose a wiring'}</text>
    </g>
  );
}

function Rc({ state }) {
  return (
    <g>
      <line x1="70" y1="40" x2="360" y2="40" />
      <line x1="70" y1="40" x2="70" y2="170" />
      <line x1="70" y1="170" x2="360" y2="170" />
      <line x1="360" y1="70" x2="360" y2="170" />
      <Battery x={70} y={105} />
      <Resistor x={200} y={40} />
      <text x="200" y="24" textAnchor="middle">{state.ohms ? formatSi(state.ohms, 'Ω') : 'R'}</text>
      <Capacitor x={360} y={110} />
      <text x="400" y="114">{state.farads ? formatSi(state.farads, 'F') : 'C'}</text>
      <Ground x={360} y={170} />
    </g>
  );
}

function Flyback({ state }) {
  const diode = state.diode;
  return (
    <g>
      <line x1="60" y1="36" x2="300" y2="36" />
      <line x1="60" y1="36" x2="60" y2="180" />
      <line x1="60" y1="180" x2="300" y2="180" />
      <line x1="300" y1="100" x2="300" y2="180" />
      <Battery x={60} y={108} />
      <text x="78" y="28">+</text>
      <Inductor x={180} y={36} />
      <SwitchGlyph x={300} y={140} closed />
      <text x="330" y="144">switch</text>
      {diode === 'flyback' && <Diode x={230} y={90} up />}
      {diode === 'forward' && <Diode x={230} y={90} up={false} />}
      {diode === 'flyback' || diode === 'forward' ? (
        <>
          <line x1="230" y1="36" x2="230" y2="62" />
          <line x1="230" y1="118" x2="230" y2="150" />
          <line x1="230" y1="150" x2="300" y2="150" />
        </>
      ) : null}
      <text x="250" y="200">{diode === 'none' ? 'No diode across the coil' : diode === 'flyback' ? 'Arrow toward the top rail' : diode === 'forward' ? 'Arrow toward the bottom rail' : 'Diode not placed'}</text>
    </g>
  );
}

function Astable({ state, blinkOn, lamp }) {
  const lit = blinkOn && lamp !== 'off';
  return (
    <g>
      <rect x="150" y="50" width="120" height="90" rx="8" />
      <text x="210" y="100" textAnchor="middle">555</text>
      <text x="78" y="70">R1 {state.r1 ? formatSi(state.r1, 'Ω') : '—'}</text>
      <text x="78" y="110">R2 {state.r2 ? formatSi(state.r2, 'Ω') : '—'}</text>
      <text x="78" y="150">C {state.farads ? formatSi(state.farads, 'F') : '—'}</text>
      <line x1="270" y1="80" x2="360" y2="80" />
      <Led x={390} y={80} forward lamp={lit ? 'lit' : 'off'} />
      <line x1="420" y1="80" x2="440" y2="80" />
      <line x1="440" y1="80" x2="440" y2="170" />
      <Ground x={440} y={170} />
      <text x="300" y="180">output</text>
    </g>
  );
}

function Rail() {
  return (
    <g>
      <line x1="40" y1="46" x2="450" y2="46" />
      <line x1="450" y1="46" x2="450" y2="174" />
      <line x1="40" y1="174" x2="450" y2="174" />
      <line x1="40" y1="46" x2="40" y2="174" />
    </g>
  );
}

function Station({ x, y, part, state, lamp, name }) {
  return (
    <g>
      <rect className="knockout" x={x - 28} y={y - 18} width="56" height="36" />
      <PartGlyph part={part} x={x} y={y} state={state} lamp={lamp} />
      <text x={x} y={y + 34} textAnchor="middle">{name}</text>
      <text x={x} y={y + 48} textAnchor="middle">{part ? part : 'empty'}</text>
    </g>
  );
}

function PartGlyph({ part, x, y, state, lamp }) {
  if (part === 'battery') return <Battery x={x} y={y + 8} />;
  if (part === 'switch') return <SwitchGlyph x={x} y={y} closed={state.switchClosed} />;
  if (part === 'led') return <Led x={x} y={y} forward={state.ledForward} lamp={lamp} />;
  if (part === 'resistor') return <Resistor x={x} y={y} />;
  if (part === 'wire') return <line x1={x - 22} y1={y} x2={x + 22} y2={y} />;
  return <text x={x} y={y + 4} textAnchor="middle">∅</text>;
}

function Battery({ x, y }) {
  return (
    <g>
      <line x1={x - 16} y1={y - 18} x2={x + 16} y2={y - 18} />
      <line x1={x - 8} y1={y - 8} x2={x + 8} y2={y - 8} />
      <line x1={x - 16} y1={y + 4} x2={x + 16} y2={y + 4} />
      <line x1={x - 8} y1={y + 14} x2={x + 8} y2={y + 14} />
    </g>
  );
}

function Resistor({ x, y }) {
  const d = `M ${x - 24} ${y} l 6 0 l 4 -8 l 8 16 l 8 -16 l 8 16 l 8 -16 l 4 8 l 6 0`;
  return <path d={d} />;
}

function Led({ x, y, forward, lamp }) {
  const dir = forward ? 1 : -1;
  const back = x - dir * 12;
  const tip = x + dir * 14;
  const lit = lamp === 'lit' || lamp === 'dim';
  return (
    <g className={lit ? 'sym-lit' : ''}>
      <polygon points={`${back},${y - 10} ${back},${y + 10} ${tip},${y}`} />
      <line x1={tip} y1={y - 10} x2={tip} y2={y + 10} />
      <line x1={x + 6} y1={y - 16} x2={x + 14} y2={y - 24} />
      <line x1={x + 12} y1={y - 12} x2={x + 20} y2={y - 18} />
    </g>
  );
}

function SwitchGlyph({ x, y, closed }) {
  if (closed) return <line x1={x - 20} y1={y} x2={x + 20} y2={y} />;
  return (
    <g>
      <circle cx={x - 16} cy={y} r="2" />
      <line x1={x - 14} y1={y} x2={x + 12} y2={y - 16} />
      <circle cx={x + 16} cy={y} r="2" />
    </g>
  );
}

function Capacitor({ x, y }) {
  return (
    <g>
      <line x1={x} y1={y - 28} x2={x} y2={y - 8} />
      <line x1={x - 16} y1={y - 8} x2={x + 16} y2={y - 8} />
      <line x1={x - 16} y1={y + 8} x2={x + 16} y2={y + 8} />
      <line x1={x} y1={y + 8} x2={x} y2={y + 28} />
    </g>
  );
}

function Inductor({ x, y }) {
  return (
    <g>
      <line x1={x - 36} y1={y} x2={x - 20} y2={y} />
      <path d={`M ${x - 20} ${y} q 6 -14 12 0 q 6 -14 12 0 q 6 -14 12 0 q 6 -14 12 0`} />
      <line x1={x + 28} y1={y} x2={x + 40} y2={y} />
    </g>
  );
}

function Diode({ x, y, up }) {
  const tipY = up ? y - 22 : y + 22;
  const baseY = up ? y + 10 : y - 10;
  const barY = up ? y - 26 : y + 26;
  return (
    <g>
      <polygon points={`${x - 12},${baseY} ${x + 12},${baseY} ${x},${tipY}`} />
      <line x1={x - 12} y1={barY} x2={x + 12} y2={barY} />
    </g>
  );
}

function Ground({ x, y }) {
  return (
    <g>
      <line x1={x - 14} y1={y} x2={x + 14} y2={y} />
      <line x1={x - 9} y1={y + 6} x2={x + 9} y2={y + 6} />
      <line x1={x - 4} y1={y + 12} x2={x + 4} y2={y + 12} />
    </g>
  );
}

function LampDot({ x, y, lamp }) {
  const lit = lamp === 'lit' || lamp === 'dim';
  return <circle cx={x} cy={y} r="8" className={lit ? 'sym-lit' : ''} />;
}
