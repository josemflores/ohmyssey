import { useEffect, useRef, useState } from 'react';
import './VoyageScreen.css';

// One card is about four seconds. Thirteen stops land near a minute,
// which is the whole wander from Troy to Ithaca.
const CARD_MS = 4000;

const STOPS = [
  {
    sky: 'night',
    island: 'walled',
    kicker: 'Leaving Troy',
    title: 'Twelve ships for home',
    text: 'The war is won. Odysseus turns his twelve ships toward Ithaca, and the oars bite the water for home.',
  },
  {
    sky: 'night',
    island: 'town',
    kicker: 'The Cicones',
    title: 'Ismarus',
    text: 'They raid Ismarus for spoils. The Cicones fight back, and six men from every ship are lost before the fleet can flee.',
  },
  {
    sky: 'dusk',
    island: 'low',
    kicker: 'The Lotus-Eaters',
    title: 'A fruit that forgets',
    text: 'Some of the crew taste the lotus and forget the way home. Odysseus has them dragged, weeping, back to the ships.',
  },
  {
    sky: 'storm',
    island: 'peak',
    kicker: 'The Cyclops',
    title: 'Nobody',
    text: 'Trapped in Polyphemus’ cave, Odysseus calls himself Nobody, blinds the giant, and escapes under the sheep. He then shouts his true name from the sea. Poseidon hears it.',
  },
  {
    sky: 'storm',
    island: 'isle',
    kicker: 'Aeolus',
    title: 'The bag of winds',
    text: 'The keeper of the winds bags every gale but the one for home. Within sight of Ithaca the crew opens the bag, and the storm blows them back to the start.',
  },
  {
    sky: 'storm',
    island: 'cliffs',
    kicker: 'The Laestrygonians',
    title: 'One ship left',
    text: 'Giants smash the fleet in a narrow harbor. Eleven ships are lost. Only Odysseus’ own ship slips out to sea.',
  },
  {
    sky: 'dusk',
    island: 'woods',
    kicker: 'Circe',
    title: 'A year on Aeaea',
    text: 'Circe turns his men into pigs. Hermes gives him a charm, he frees them, and the ship stays a year.',
  },
  {
    sky: 'underworld',
    island: 'barren',
    kicker: 'The Underworld',
    title: 'Tiresias',
    text: 'Among the dead, the prophet Tiresias tells him the way home. One warning matters most: do not touch the cattle of the sun.',
  },
  {
    sky: 'night',
    island: 'rocks',
    kicker: 'The Sirens',
    title: 'Wax and rope',
    text: 'Wax fills the crew’s ears. Odysseus is bound to the mast, hears the song, and the ship sails past.',
  },
  {
    sky: 'storm',
    island: 'strait',
    kicker: 'Scylla and Charybdis',
    title: 'The strait',
    text: 'The passage offers two deaths. He steers close to Scylla. Six men are taken. The whirlpool is left behind.',
  },
  {
    sky: 'storm',
    island: 'pasture',
    kicker: 'Thrinacia',
    title: 'The cattle of the sun',
    text: 'Hunger wins. The crew slaughter Helios’ cattle. Zeus answers with a thunderbolt, the last ship breaks, and only Odysseus lives.',
  },
  {
    sky: 'dusk',
    island: 'cove',
    kicker: 'Calypso',
    title: 'Seven years',
    text: 'The nymph keeps him on Ogygia. The gods at last command his release, and he builds a raft with his own hands.',
  },
  {
    sky: 'dawn',
    island: 'ithaca',
    kicker: 'The Phaeacians',
    title: 'Ithaca',
    text: 'They hear his story and carry him, sleeping, to his own shore. Ten years after Troy he wakes on Ithaca. Suitors fill the palace. Penelope is still waiting.',
  },
];

const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 47) % 100}%`,
  top: `${(i * 23) % 42}%`,
  delay: `${(i % 7) * 0.4}s`,
  big: i % 8 === 0,
}));

export default function VoyageScreen({ onArrive }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const indexRef = useRef(0);
  const leavingRef = useRef(false);
  const lastAdvance = useRef(0);
  const onArriveRef = useRef(onArrive);
  const arriveTimer = useRef(0);
  const stop = STOPS[index];
  const last = index === STOPS.length - 1;
  indexRef.current = index;
  onArriveRef.current = onArrive;

  useEffect(() => {
    if (leaving) return undefined;
    const timer = setTimeout(() => {
      if (leavingRef.current) return;
      if (indexRef.current >= STOPS.length - 1) finish();
      else setIndex(indexRef.current + 1);
    }, CARD_MS);
    return () => clearTimeout(timer);
  }, [index, leaving]);

  function finish() {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    arriveTimer.current = window.setTimeout(() => onArriveRef.current?.(), 720);
  }

  useEffect(() => () => window.clearTimeout(arriveTimer.current), []);

  function advance(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (leavingRef.current) return;
    const now = performance.now();
    if (now - lastAdvance.current < 400) return;
    lastAdvance.current = now;
    if (indexRef.current >= STOPS.length - 1) finish();
    else setIndex(indexRef.current + 1);
  }

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    function onKey(event) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const isEnter = event.key === 'Enter';
      const isSpace = event.key === ' ' || event.code === 'Space';
      if (!isEnter && !isSpace) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      advanceRef.current(event);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className={leaving ? 'voyage is-leaving' : 'voyage'}
      data-screen="voyage"
      data-sky={stop.sky}
      data-stop={index}
      style={{ '--card-ms': `${CARD_MS}ms` }}
      role="dialog"
      aria-label="The voyage home"
      onClick={advance}
    >
      <div className="voyage-sky" aria-hidden="true" />
      <div className="voyage-stars" aria-hidden="true">
        {STARS.map((star) => (
          <span
            key={star.id}
            className={star.big ? 'voyage-star is-big' : 'voyage-star'}
            style={{ left: star.left, top: star.top, animationDelay: star.delay }}
          />
        ))}
      </div>
      <div className="voyage-moon" aria-hidden="true" />
      <Island kind={stop.island} stopKey={stop.title} />
      <Waves />
      <Ship />
      <div className="voyage-card-wrap">
        <article className="card voyage-card" key={stop.title}>
          <p className="voyage-sr" role="status">{stop.kicker}. {stop.title}. {stop.text}</p>
          <p className="eyebrow">{stop.kicker}</p>
          <h2>{stop.title}</h2>
          <p className="voyage-text">{stop.text}</p>
          <div className="voyage-timer" aria-hidden="true">
            <span key={index} />
          </div>
          <div className="voyage-actions">
            <span className="voyage-count">{index + 1} / {STOPS.length}</span>
            <button
              className="btn btn-quiet voyage-skip"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                finish();
              }}
            >
              Skip
            </button>
          </div>
        </article>
        <p className="voyage-hint">{last ? 'The shore is close' : 'Click, Space, or Enter'}</p>
      </div>
    </div>
  );
}

function Waves() {
  return (
    <div className="voyage-waves" aria-hidden="true">
      <Wave className="is-far" fill="#0a2c44" duration="28s" />
      <Wave className="is-mid" fill="#12486e" duration="18s" flip />
      <Wave className="is-near" fill="#1a6490" duration="11s" foam />
    </div>
  );
}

function Wave({ className, fill, duration, flip = false, foam = false }) {
  return (
    <div
      className={`voyage-wave ${className}`}
      style={{ animationDuration: duration, animationDirection: flip ? 'reverse' : 'normal' }}
    >
      <WaveSvg fill={fill} foam={foam} />
      <WaveSvg fill={fill} foam={foam} />
    </div>
  );
}

function WaveSvg({ fill, foam }) {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
      <path d="M0 46 Q180 16 360 46 T720 46 T1080 46 T1440 46 V90 H0 Z" fill={fill} />
      {foam && (
        <path
          d="M0 46 Q180 20 360 46 T720 46 T1080 46 T1440 46"
          fill="none"
          stroke="#d7f3ee"
          strokeWidth="3"
          strokeOpacity="0.65"
        />
      )}
    </svg>
  );
}

function Island({ kind, stopKey }) {
  return (
    <svg className="voyage-island" key={stopKey} viewBox="0 0 320 120" aria-hidden="true">
      {kind === 'walled' && (
        <>
          <path d="M20 96 L40 70 L70 78 L90 48 L130 62 L160 36 L200 58 L240 44 L280 72 L300 96 Z" />
          <rect x="148" y="18" width="10" height="22" />
          <rect x="86" y="34" width="8" height="16" />
        </>
      )}
      {kind === 'town' && <path d="M30 96 L50 74 L80 80 L100 58 L140 70 L170 50 L210 66 L250 54 L290 96 Z" />}
      {kind === 'low' && <path d="M10 96 Q80 78 160 88 T310 96 Z" />}
      {kind === 'peak' && <path d="M16 96 L90 96 L150 28 L168 48 L210 18 L250 96 Z" />}
      {kind === 'isle' && <path d="M40 96 Q70 60 120 72 Q170 40 230 68 Q270 58 290 96 Z" />}
      {kind === 'cliffs' && <path d="M10 96 L20 40 L60 48 L70 28 L110 36 L120 52 L180 44 L200 22 L240 40 L300 96 Z" />}
      {kind === 'woods' && (
        <>
          <path d="M24 96 Q160 70 300 96 Z" />
          <path d="M70 78 L86 48 L102 78 Z M130 82 L150 40 L170 82 Z M200 80 L218 50 L236 80 Z" />
        </>
      )}
      {kind === 'barren' && <path d="M20 96 L60 60 L90 78 L140 42 L180 70 L230 50 L290 96 Z" />}
      {kind === 'rocks' && <path d="M30 96 L50 50 L70 96 L120 40 L145 96 L200 34 L230 96 L270 58 L300 96 Z" />}
      {kind === 'strait' && (
        <>
          <path d="M0 96 L10 30 L50 48 L70 96 Z" />
          <path d="M250 96 L270 36 L310 50 L320 96 Z" />
        </>
      )}
      {kind === 'pasture' && <path d="M16 96 Q90 64 160 80 Q230 58 304 96 Z" />}
      {kind === 'cove' && <path d="M10 70 Q40 40 90 58 Q140 28 190 60 Q250 36 310 78 L310 96 L10 96 Z" />}
      {kind === 'ithaca' && (
        <>
          <path d="M8 96 L40 62 L80 74 L120 40 L170 68 L220 46 L270 72 L312 96 Z" />
          <rect x="156" y="28" width="8" height="16" />
        </>
      )}
    </svg>
  );
}

function Ship() {
  return (
    <svg className="voyage-ship" viewBox="0 0 360 150" aria-hidden="true">
      <path
        d="M78 74 C62 74 48 56 56 38 C62 28 76 32 80 46 L92 70 L268 74 C286 72 302 64 312 70 L340 76 L318 84 C304 94 290 100 270 102 L104 106 C88 106 78 96 78 74 Z"
        fill="#0b1018"
      />
      <path d="M96 76 L262 80" stroke="#3d3124" strokeWidth="2" />
      <circle cx="300" cy="78" r="4.2" fill="#f4e6c8" />
      <rect x="168" y="18" width="4" height="58" fill="#1c140c" />
      <rect x="118" y="16" width="116" height="4" rx="1" fill="#1c140c" />
      <path d="M124 22 Q176 32 228 22 L222 70 Q176 80 130 70 Z" fill="#f3e6c4" />
      <path d="M127 46 Q176 54 223 46" fill="none" stroke="#c4963c" strokeWidth="2.5" />
    </svg>
  );
}
