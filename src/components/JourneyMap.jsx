import { useEffect, useRef } from 'react';
import './JourneyMap.css';

// Percent positions on journey_map.webp, read off the painting.
// Troy is done. The shores between are locked. Ithaca is the only choice.
const STOPS = [
  { id: 'troy', n: 1, name: 'Troy', line: 'The war is won', x: 91, y: 50, state: 'done', side: 'left' },
  { id: 'ismarus', n: 2, name: 'Ismarus', line: 'The crew pillages the town', x: 86, y: 42, state: 'locked', side: 'above' },
  { id: 'malea', n: 3, name: 'Cape Malea', line: 'Storms blow the fleet south', x: 79, y: 70, state: 'locked', side: 'right' },
  { id: 'lotus', n: 4, name: 'Lotus-Eaters', line: 'They forget the way home', x: 30, y: 71, state: 'locked', side: 'left' },
  { id: 'cyclops', n: 5, name: 'Cyclops', line: 'Blinds Polyphemus', x: 43, y: 65, state: 'locked', side: 'left' },
  { id: 'aeolia', n: 6, name: 'Aeolia', line: 'The bag of winds is opened', x: 52, y: 56, state: 'locked', side: 'above' },
  { id: 'laestry', n: 7, name: 'Laestrygonians', line: 'Giants destroy the fleet', x: 38, y: 41, state: 'locked', side: 'above' },
  { id: 'aeaea', n: 8, name: 'Aeaea', line: 'Circe turns the crew into swine', x: 50, y: 37, state: 'locked', side: 'right' },
  { id: 'underworld', n: 9, name: 'Underworld', line: 'Tiresias names the way home', x: 7, y: 50, state: 'locked', side: 'below' },
  { id: 'sirens', n: 10, name: 'Sirens', line: 'Lashed to the mast', x: 57, y: 46, state: 'locked', side: 'left' },
  { id: 'scylla', n: 11, name: 'Scylla & Charybdis', line: 'Six men are seized', x: 63, y: 63, state: 'locked', side: 'below' },
  { id: 'thrinacia', n: 12, name: 'Thrinacia', line: 'The cattle of the sun', x: 48, y: 66, state: 'locked', side: 'above' },
  { id: 'ogygia', n: 13, name: 'Ogygia', line: 'Seven years with Calypso', x: 35, y: 80, state: 'locked', side: 'left' },
  { id: 'scheria', n: 14, name: 'Scheria', line: 'The Phaeacians', x: 67, y: 49, state: 'locked', side: 'above' },
  { id: 'ithaca', n: 15, name: 'Ithaca', line: 'Penelope still waits', x: 74, y: 57, state: 'open', side: 'right' },
];

// The painting is 16:9. This viewBox matches it, so a percent on the image
// is the same point on the route.
const VW = 160;
const VH = 90;

function px(x) {
  return (x / 100) * VW;
}
function py(y) {
  return (y / 100) * VH;
}

export default function JourneyMap({ onChoose }) {
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

  const last = STOPS.length - 1;

  return (
    <div className="journey" data-screen="journey">
      <div className="card journey-frame">
        <header className="journey-head">
          <p className="eyebrow">The Aegean</p>
          <h1>Choose your next destination</h1>
        </header>
        <div className="journey-chart">
          <img src="/assets/intro/journey_map.webp" alt="" />
          <svg className="journey-route" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="jm-arrow-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="2.4" markerHeight="2.4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M 0 1.2 L 9 5 L 0 8.8 Z" fill="#c46a32" />
              </marker>
              <marker id="jm-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.1" markerHeight="3.1" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M 0 1.2 L 9 5 L 0 8.8 Z" fill="#e36a1a" />
              </marker>
            </defs>
            {STOPS.slice(0, -1).map((stop, index) => {
              const next = STOPS[index + 1];
              const hot = index === last - 1;
              return (
                <line
                  key={`${stop.id}-${next.id}`}
                  x1={px(stop.x)}
                  y1={py(stop.y)}
                  x2={px(next.x)}
                  y2={py(next.y)}
                  className={hot ? 'is-hot' : 'is-dim'}
                  markerEnd={hot ? 'url(#jm-arrow-hot)' : 'url(#jm-arrow-dim)'}
                />
              );
            })}
          </svg>
          {STOPS.map((stop) => (
            <button
              key={stop.id}
              ref={stop.state === 'open' ? openRef : undefined}
              type="button"
              className={`journey-stop is-${stop.state} label-${stop.side}`}
              style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
              data-stop={stop.id}
              data-locked={stop.state === 'locked' ? 'true' : undefined}
              aria-disabled={stop.state !== 'open'}
              tabIndex={stop.state === 'open' ? 0 : -1}
              aria-label={ariaLabel(stop)}
              onClick={() => {
                if (stop.state === 'open') choose();
              }}
            >
              <span className="journey-num" aria-hidden="true">{stop.n}</span>
              {stop.state === 'done' && <span className="journey-check" aria-hidden="true">✓</span>}
              {stop.state === 'locked' && (
                <svg className="journey-lock" viewBox="0 0 12 14" aria-hidden="true">
                  <rect x="1.5" y="6" width="9" height="7" rx="1" fill="currentColor" />
                  <path d="M3.2 6 V4.2 a2.8 2.8 0 0 1 5.6 0 V6" fill="none" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              )}
              <span className="journey-label">
                <strong>{stop.name}</strong>
                <em>{stop.line}</em>
              </span>
              {stop.state === 'locked' && <span className="journey-tip">Locked</span>}
            </button>
          ))}
        </div>
        <p className="journey-note">Troy is behind you. Ithaca is the shore you can reach.</p>
      </div>
    </div>
  );
}

function ariaLabel(stop) {
  if (stop.state === 'open') return `${stop.name}. ${stop.line}. Choose this destination.`;
  if (stop.state === 'done') return `${stop.name}. ${stop.line}. Completed.`;
  return `${stop.name}. ${stop.line}. Locked.`;
}
