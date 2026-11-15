/**
 * A small circuit schematic for a question card: a voltage source with
 * resistors and diodes (or LEDs) in one loop, or two resistors in parallel.
 * The unknown is marked on the drawing itself:
 *   current     an arrow on the wire with "I = ?"
 *   voltage     + and − at the ends of a part with "V = ?"
 *   resistance  "R = ?" on the resistor
 * A known current (for "find R" or "find V") is the same arrow with a value.
 *
 * circuit = {
 *   layout: 'series' | 'parallel',
 *   source: '9 V',            // '' draws an unlabeled source
 *   parts: [{ kind: 'resistor' | 'diode' | 'led', label: '1 kΩ', reversed?: true }],
 *   current: '20 mA',         // optional known current
 *   ask: { type: 'current' | 'voltage' | 'resistance', part?: 0, branch?: 0 },
 * }
 * Series: one to three parts around the loop. Parallel: two resistors.
 */

const INK = '#2a1c10';
const ASK = '#9c3b2e';

export default function CircuitDiagram({ circuit }) {
  if (!circuit || !Array.isArray(circuit.parts)) return null;
  const parallel = circuit.layout === 'parallel';
  return (
    <figure className="q-circuit">
      <svg viewBox="0 0 280 166" role="img" aria-label={describe(circuit)}>
        <defs>
          <marker id="q-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={ASK} />
          </marker>
          <marker id="q-arrow-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={INK} />
          </marker>
        </defs>
        {parallel ? <Parallel circuit={circuit} /> : <Series circuit={circuit} />}
      </svg>
    </figure>
  );
}

// ---- Layouts ---------------------------------------------------------------

// The loop: source on the left, parts along the top (and down the right side
// for a third part), current flowing clockwise from the + terminal.
function Series({ circuit }) {
  const parts = circuit.parts.slice(0, 3);
  const top = 34;
  const bottom = 128;
  const left = 62;
  const right = 254;
  const tops = parts.length === 1 ? [158] : [124, 194];
  const ask = circuit.ask || {};
  const slots = parts.map((part, index) => (index < 2
    ? { part, index, x: tops[index], y: top, vertical: false }
    : { part, index, x: right, y: (top + bottom) / 2, vertical: true }));

  // Wires, broken where a part sits.
  const gaps = slots.filter((s) => !s.vertical).map((s) => [s.x - 22, s.x + 22]);
  const topWire = [];
  let at = left;
  for (const [a, b] of gaps) {
    topWire.push([at, a]);
    at = b;
  }
  topWire.push([at, right]);
  const side = slots.find((s) => s.vertical);

  return (
    <g fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {topWire.map(([a, b]) => <line key={a} x1={a} y1={top} x2={b} y2={top} />)}
      {side ? (
        <>
          <line x1={right} y1={top} x2={right} y2={side.y - 22} />
          <line x1={right} y1={side.y + 22} x2={right} y2={bottom} />
        </>
      ) : (
        <line x1={right} y1={top} x2={right} y2={bottom} />
      )}
      <line x1={right} y1={bottom} x2={left} y2={bottom} />
      <Source x={left} top={top} bottom={bottom} label={circuit.source} unknown={ask.type === 'source'} />
      {slots.map((slot) => (
        <Part key={slot.index} {...slot} ask={ask} />
      ))}
      <CurrentArrow
        x1={182}
        x2={132}
        y={bottom}
        label={ask.type === 'current' ? 'I = ?' : circuit.current}
        unknown={ask.type === 'current'}
        below
      />
    </g>
  );
}

// Source on the left, two resistors side by side between the top and
// bottom rails.
function Parallel({ circuit }) {
  const top = 34;
  const bottom = 128;
  const left = 62;
  const branches = [168, 250];
  const ask = circuit.ask || {};
  const parts = circuit.parts.slice(0, 2);
  const mid = (top + bottom) / 2;
  return (
    <g fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1={left} y1={top} x2={branches[1]} y2={top} />
      <line x1={left} y1={bottom} x2={branches[1]} y2={bottom} />
      {branches.map((x) => (
        <g key={x}>
          <line x1={x} y1={top} x2={x} y2={mid - 22} />
          <line x1={x} y1={mid + 22} x2={x} y2={bottom} />
        </g>
      ))}
      {/* Junction dots where the first branch splits off the rails. */}
      <circle cx={branches[0]} cy={top} r="2.8" fill={INK} />
      <circle cx={branches[0]} cy={bottom} r="2.8" fill={INK} />
      <Source x={left} top={top} bottom={bottom} label={circuit.source} unknown={ask.type === 'source'} />
      {parts.map((part, index) => (
        <Part key={index} part={part} index={index} x={branches[index]} y={mid} vertical ask={ask} />
      ))}
      {ask.type === 'current' && ask.branch == null && (
        <CurrentArrow x1={88} x2={138} y={top} label="I = ?" unknown />
      )}
      {ask.type === 'current' && ask.branch != null && (
        <CurrentArrow
          x1={branches[ask.branch] - 12}
          x2={branches[ask.branch] - 12}
          y={top + 6}
          y2={top + 28}
          label={`I${ask.branch === 0 ? '₁' : '₂'} = ?`}
          unknown
          left
        />
      )}
    </g>
  );
}

// ---- Pieces ----------------------------------------------------------------

// A battery: long plate (+) over short plate (−), with its value beside it.
function Source({ x, top, bottom, label, unknown }) {
  const mid = (top + bottom) / 2;
  return (
    <g>
      <line x1={x} y1={top} x2={x} y2={mid - 6} />
      <line x1={x} y1={mid + 6} x2={x} y2={bottom} />
      <line x1={x - 14} y1={mid - 6} x2={x + 14} y2={mid - 6} strokeWidth="2.6" />
      <line x1={x - 8} y1={mid + 6} x2={x + 8} y2={mid + 6} strokeWidth="4" />
      <Text x={x + 18} y={mid - 10} size={12}>+</Text>
      {label != null && label !== '' && (
        <Text x={x - 18} y={mid + 5} anchor="end" ask={unknown}>{unknown ? 'V = ?' : label}</Text>
      )}
    </g>
  );
}

function Part({ part, index, x, y, vertical, ask }) {
  const askHere = ask && ask.part === index && (ask.type === 'voltage' || ask.type === 'resistance');
  const unknownR = ask.type === 'resistance' && ask.part === index;
  const label = unknownR ? 'R = ?' : part.label;
  const glyph = part.kind === 'resistor'
    ? <Resistor />
    : <Diode led={part.kind === 'led'} reversed={part.reversed} />;
  return (
    <g>
      <g transform={`translate(${x} ${y})${vertical ? ' rotate(90)' : ''}`}>{glyph}</g>
      {label && (
        vertical
          ? <Text x={x - 14} y={y + 4} anchor="end" ask={unknownR}>{partName(part, label)}</Text>
          : <Text x={x} y={y - (part.kind === 'resistor' ? 13 : 22)} ask={unknownR}>{partName(part, label)}</Text>
      )}
      {askHere && ask.type === 'voltage' && (
        vertical ? (
          <>
            <Text x={x + 12} y={y - 14} anchor="start" ask>+</Text>
            <Text x={x + 12} y={y + 22} anchor="start" ask>−</Text>
            <Text x={x + 12} y={y + 4} anchor="start" ask>V=?</Text>
          </>
        ) : (
          <>
            <Text x={x - 20} y={y + 20} ask>+</Text>
            <Text x={x + 20} y={y + 20} ask>−</Text>
            <Text x={x} y={y + 24} ask>V = ?</Text>
          </>
        )
      )}
    </g>
  );
}

function partName(part, label) {
  if (part.kind === 'led') return `LED ${label}`;
  if (part.kind === 'diode') return `D ${label}`;
  return label;
}

// Drawn centered on (0, 0), 44 wide, along the x axis.
function Resistor() {
  return <polyline points="-22,0 -15,0 -12,-7 -6,7 0,-7 6,7 12,-7 15,0 22,0" />;
}

// Triangle pointing the way current flows, bar at the cathode. An LED adds
// two small arrows for the light. Reversed turns it to block the current.
function Diode({ led, reversed }) {
  return (
    <g>
      <g transform={reversed ? 'scale(-1 1)' : undefined}>
        <line x1="-22" y1="0" x2="-8" y2="0" />
        <line x1="8" y1="0" x2="22" y2="0" />
        <path d="M-8 -8 L8 0 L-8 8 Z" fill={led ? '#e8b4a0' : '#fffaf0'} />
        <line x1="8" y1="-8" x2="8" y2="8" />
      </g>
      {led && (
        <g strokeWidth="1.3">
          <line x1="2" y1="-9" x2="7" y2="-14" markerEnd="url(#q-arrow-ink)" />
          <line x1="8" y1="-7" x2="13" y2="-12" markerEnd="url(#q-arrow-ink)" />
        </g>
      )}
    </g>
  );
}

function CurrentArrow({ x1, x2, y, y2, label, unknown, below, left }) {
  if (!label) return null;
  const color = unknown ? ASK : INK;
  const vertical = y2 != null;
  return (
    <g>
      <line
        x1={x1}
        y1={vertical ? y : y - (below ? 0 : 0)}
        x2={x2}
        y2={vertical ? y2 : y}
        stroke={color}
        strokeWidth="2.4"
        markerEnd={unknown ? 'url(#q-arrow)' : 'url(#q-arrow-ink)'}
        transform={vertical ? undefined : `translate(0 ${below ? 9 : -9})`}
      />
      {vertical
        ? <Text x={left ? x1 - 9 : x1 + 6} y={(y + y2) / 2 + 2} anchor={left ? 'end' : 'start'} ask={unknown}>{label}</Text>
        : <Text x={(x1 + x2) / 2} y={below ? y + 26 : y - 16} ask={unknown}>{label}</Text>}
    </g>
  );
}

function Text({ x, y, children, anchor = 'middle', ask, size = 13 }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={ask ? ASK : INK}
      stroke="none"
      fontSize={size}
      fontWeight={ask ? 700 : 600}
      className="q-circuit-text"
    >
      {children}
    </text>
  );
}

// A sentence for screen readers.
function describe(circuit) {
  const parts = circuit.parts.map((part, index) => {
    const unknown = circuit.ask?.type === 'resistance' && circuit.ask.part === index;
    const value = unknown ? 'unknown resistance' : part.label;
    if (part.kind === 'led') return `an LED that drops ${value}${part.reversed ? ', put in backwards' : ''}`;
    if (part.kind === 'diode') return `a diode that drops ${value}${part.reversed ? ', put in backwards' : ''}`;
    return `a ${value} resistor`;
  });
  const how = circuit.layout === 'parallel' ? 'in parallel across' : 'in a loop with';
  const source = circuit.source ? `a ${circuit.source} source` : 'a source';
  const known = circuit.current ? ` A current of ${circuit.current} flows.` : '';
  const ask = { current: 'The current is marked unknown.', voltage: 'The voltage across a part is marked unknown.', resistance: 'The resistance is marked unknown.' }[circuit.ask?.type] || '';
  return `Circuit: ${parts.join(', ')} ${how} ${source}.${known} ${ask}`;
}
