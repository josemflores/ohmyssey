import { useEffect, useRef, useState } from 'react';
import './JourneyMap.css';

// Rough Aegean chart. x and y are in a 160 by 100 chart, story order.
// Troy is done. The stops between are locked for the demo. Ithaca is open.
const STOPS = [
  { id: 'troy', name: 'Troy', x: 132, y: 36, state: 'done', side: 'left' },
  { id: 'cicones', name: 'Cicones', sub: 'Ismarus', x: 124, y: 18, state: 'locked', side: 'below' },
  { id: 'lotus', name: 'Lotus-Eaters', x: 108, y: 40, state: 'locked', side: 'below' },
  { id: 'cyclops', name: "Cyclops' island", x: 92, y: 62, state: 'locked', side: 'below' },
  { id: 'aeolia', name: 'Aeolia', x: 74, y: 28, state: 'locked', side: 'above' },
  { id: 'laestry', name: 'Laestrygonians', x: 52, y: 14, state: 'locked', side: 'below' },
  { id: 'aeaea', name: 'Aeaea', sub: 'Circe', x: 36, y: 34, state: 'locked', side: 'left' },
  { id: 'underworld', name: 'Underworld', x: 16, y: 54, state: 'locked', side: 'right' },
  { id: 'sirens', name: 'Sirens', x: 32, y: 72, state: 'locked', side: 'above' },
  { id: 'scylla', name: 'Scylla & Charybdis', x: 58, y: 80, state: 'locked', side: 'above' },
  { id: 'thrinacia', name: 'Thrinacia', x: 88, y: 76, state: 'locked', side: 'above' },
  { id: 'ogygia', name: 'Ogygia', sub: 'Calypso', x: 112, y: 84, state: 'locked', side: 'above' },
  { id: 'scheria', name: 'Scheria', sub: 'Phaeacians', x: 132, y: 62, state: 'locked', side: 'right' },
  { id: 'ithaca', name: 'Ithaca', sub: 'Level 2', x: 64, y: 46, state: 'open', side: 'below' },
];

const ROUTE = STOPS.map((stop) => `${stop.x},${stop.y}`).join(' ');

export default function JourneyMap({ onChoose }) {
  const [note, setNote] = useState('Troy is behind you. Ithaca is the shore you can reach.');
  const openRef = useRef(null);
  const chosen = useRef(false);
  const onChooseRef = useRef(onChoose);
  onChooseRef.current = onChoose;

  function choose() {
    if (chosen.current) return;
    chosen.current = true;
    onChooseRef.current?.();
  }

  useEffect(() => {
    openRef.current?.focus({ preventScroll: true });
    function onKey(event) {
      if (event.repeat || event.key !== 'Enter') return;
      if (event.target?.dataset?.locked === 'true') return;
      event.preventDefault();
      choose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function pressStop(stop) {
    if (stop.state === 'open') {
      choose();
      return;
    }
    if (stop.state === 'locked') setNote('Locked for the demo.');
  }

  return (
    <div className="journey" data-screen="journey">
      <div className="card journey-frame">
        <header className="journey-head">
          <p className="eyebrow">The Aegean</p>
          <h1>Choose your next destination</h1>
        </header>
        <div className="journey-chart">
          <svg className="journey-art" viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true">
            <rect width="160" height="100" fill="#14384e" />
            <path d="M138 2 L160 2 L160 86 L148 76 Q134 52 140 16 Z" fill="#e6d2a4" />
            <path d="M68 0 L90 1 L86 16 L74 12 L70 0 Z" fill="#e6d2a4" />
            <path d="M0 16 L18 12 L16 50 L8 66 L0 58 Z" fill="#e6d2a4" />
            <ellipse cx="14" cy="82" rx="6" ry="3" fill="#e6d2a4" />
            <ellipse cx="118" cy="50" rx="8" ry="2.4" fill="#e4c98a" />
            <path d="M0 90 Q40 84 80 88 T160 90 L160 100 L0 100 Z" fill="#e6d2a4" />
            <polyline className="journey-route" points={ROUTE} />
          </svg>
          {STOPS.map((stop) => (
            <button
              key={stop.id}
              ref={stop.state === 'open' ? openRef : undefined}
              type="button"
              className={`journey-stop is-${stop.state} label-${stop.side}`}
              style={{ left: `${(stop.x / 160) * 100}%`, top: `${(stop.y / 100) * 100}%` }}
              data-stop={stop.id}
              data-locked={stop.state === 'locked' ? 'true' : undefined}
              aria-disabled={stop.state !== 'open'}
              aria-label={ariaLabel(stop)}
              onClick={() => pressStop(stop)}
            >
              <span className="journey-mark" aria-hidden="true">
                {stop.state === 'done' && <span className="journey-check">✓</span>}
                {stop.state === 'locked' && (
                  <svg className="journey-lock" viewBox="0 0 12 14" aria-hidden="true">
                    <rect x="1.5" y="6" width="9" height="7" rx="1" fill="currentColor" />
                    <path d="M3.2 6 V4.2 a2.8 2.8 0 0 1 5.6 0 V6" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                )}
              </span>
              <span className="journey-label">
                <strong>{stop.name}</strong>
                {stop.sub && <em>{stop.sub}</em>}
              </span>
              {stop.state === 'locked' && <span className="journey-tip">Locked</span>}
            </button>
          ))}
        </div>
        <p className="journey-note" role="status">{note}</p>
      </div>
    </div>
  );
}

function ariaLabel(stop) {
  const place = stop.sub ? `${stop.name}, ${stop.sub}` : stop.name;
  if (stop.state === 'open') return `${place}. Choose this destination.`;
  if (stop.state === 'done') return `${place}. Completed.`;
  return `${place}. Locked.`;
}
