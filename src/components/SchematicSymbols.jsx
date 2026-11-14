/**
 * Tiny schematic drawings. They are pictures, not the physics.
 * `type` matches a key in src/lib/parts.js. Add a new part's icon here.
 */

export default function Symbol({ type, closed = false, glow = 'off' }) {
  const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  return (
    <svg
      className={`symbol symbol-${type} glow-${type === 'led' ? glow : 'off'}`}
      viewBox="0 0 88 40"
      aria-hidden="true"
    >
      {type === 'resistor' && (
        <polyline points="2,20 12,20 16,8 26,32 36,8 46,32 56,8 66,32 72,20 86,20" {...stroke} />
      )}
      {type === 'switch' && <SwitchGlyph closed={closed} stroke={stroke} />}
      {type === 'led' && <LedGlyph stroke={stroke} />}
      {type === 'wire' && <line x1="2" y1="20" x2="86" y2="20" {...stroke} />}
      {type === 'battery' && <BatteryGlyph stroke={stroke} />}
      {type === 'capacitor' && <CapacitorGlyph stroke={stroke} />}
      {type === 'inductor' && (
        <path
          d="M2 24 H10 A6 6 0 0 1 22 24 A6 6 0 0 1 34 24 A6 6 0 0 1 46 24 A6 6 0 0 1 58 24 H86"
          {...stroke}
        />
      )}
      {type === 'diode' && <DiodeGlyph stroke={stroke} />}
    </svg>
  );
}

function SwitchGlyph({ closed, stroke }) {
  if (closed) {
    return (
      <>
        <line x1="2" y1="20" x2="86" y2="20" {...stroke} />
        <circle cx="22" cy="20" r="3" fill="currentColor" />
        <circle cx="66" cy="20" r="3" fill="currentColor" />
      </>
    );
  }
  return (
    <>
      <line x1="2" y1="20" x2="20" y2="20" {...stroke} />
      <circle cx="22" cy="20" r="3" fill="currentColor" />
      <line x1="26" y1="18" x2="64" y2="8" {...stroke} />
      <circle cx="66" cy="20" r="3" fill="currentColor" />
      <line x1="68" y1="20" x2="86" y2="20" {...stroke} />
    </>
  );
}

function LedGlyph({ stroke }) {
  return (
    <>
      <line x1="2" y1="20" x2="22" y2="20" {...stroke} />
      <polygon points="22,8 22,32 46,20" {...stroke} />
      <line x1="46" y1="8" x2="46" y2="32" {...stroke} />
      <line x1="46" y1="20" x2="70" y2="20" {...stroke} />
      <line x1="54" y1="14" x2="66" y2="6" {...stroke} />
      <polyline points="60,6 67,6 66,12" {...stroke} />
      <line x1="60" y1="18" x2="72" y2="10" {...stroke} />
      <polyline points="66,10 73,10 72,16" {...stroke} />
    </>
  );
}

function BatteryGlyph({ stroke }) {
  return (
    <>
      <line x1="2" y1="20" x2="28" y2="20" {...stroke} />
      <line x1="28" y1="8" x2="28" y2="32" {...stroke} />
      <line x1="38" y1="13" x2="38" y2="27" {...stroke} />
      <line x1="48" y1="8" x2="48" y2="32" {...stroke} />
      <line x1="58" y1="13" x2="58" y2="27" {...stroke} />
      <line x1="58" y1="20" x2="86" y2="20" {...stroke} />
    </>
  );
}

function CapacitorGlyph({ stroke }) {
  return (
    <>
      <line x1="2" y1="20" x2="36" y2="20" {...stroke} />
      <line x1="36" y1="6" x2="36" y2="34" {...stroke} />
      <line x1="48" y1="6" x2="48" y2="34" {...stroke} />
      <line x1="48" y1="20" x2="86" y2="20" {...stroke} />
    </>
  );
}

function DiodeGlyph({ stroke }) {
  return (
    <>
      <line x1="2" y1="20" x2="28" y2="20" {...stroke} />
      <polygon points="28,8 28,32 52,20" fill="currentColor" />
      <line x1="52" y1="8" x2="52" y2="32" {...stroke} />
      <line x1="52" y1="20" x2="86" y2="20" {...stroke} />
    </>
  );
}
