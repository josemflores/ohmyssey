import { useEffect, useState } from 'react';
import NightBackdrop from './NightBackdrop.jsx';
import './NightBackdrop.css';
import './IntroScreen.css';

// How long each card stays before the next one fades in.
const CARD_MS = 3600;

const CARDS = [
  {
    kicker: 'The king',
    title: 'Odysseus of Ithaca',
    text: 'King of Ithaca, and a clever hero. Husband of Penelope, and father of Telemachus.',
    art: 'king',
  },
  {
    kicker: 'The war',
    title: 'Ten years at Troy',
    text: 'Paris took Helen. The Greeks crossed the sea and besieged Troy for ten years.',
    art: 'war',
  },
  {
    kicker: 'The ruse',
    title: 'The wooden horse',
    text: 'The trick was Odysseus’s idea. Greeks hid inside the horse. The Trojans wheeled it through the gates.',
    art: 'horse',
  },
  {
    kicker: 'Tonight',
    title: 'Inside the walls',
    text: 'Night has fallen on Troy. The city sleeps. Odysseus and three men are still hidden in the horse.',
    art: 'night',
  },
  {
    kicker: 'The gate',
    title: 'The hatch',
    text: 'Answer the question on the trap door, then lead your men out. The gate stands open…',
    art: 'gate',
  },
];

export default function IntroScreen({ onBegin }) {
  const [index, setIndex] = useState(0);
  const last = index === CARDS.length - 1;
  const card = CARDS[index];

  useEffect(() => {
    if (last) return undefined;
    const timer = setTimeout(() => setIndex((n) => n + 1), CARD_MS);
    return () => clearTimeout(timer);
  }, [index, last]);

  function next() {
    if (last) onBegin();
    else setIndex((n) => n + 1);
  }

  return (
    <NightBackdrop>
      <main className="intro" data-screen="intro" style={{ '--card-ms': `${CARD_MS}ms` }}>
        <article className="card intro-card" key={card.title}>
          <p className="eyebrow">{card.kicker}</p>
          <h1 data-card-title>{card.title}</h1>
          <StoryArt name={card.art} />
          <p className="intro-text">{card.text}</p>
          <div className="intro-dots" role="tablist" aria-label="Story">
            {CARDS.map((item, i) => (
              <button
                key={item.title}
                type="button"
                className={i === index ? 'is-on' : ''}
                aria-label={item.title}
                aria-selected={i === index}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          {!last && (
            <div className="intro-timer" aria-hidden="true">
              <span key={index} />
            </div>
          )}
          <div className="intro-actions">
            <button className="btn btn-quiet intro-skip" type="button" onClick={onBegin}>
              Skip intro
            </button>
            <button
              className={last ? 'btn intro-next is-begin' : 'btn btn-primary intro-next'}
              type="button"
              onClick={next}
            >
              {last ? 'Begin' : 'Next'}
            </button>
          </div>
        </article>
      </main>
    </NightBackdrop>
  );
}

function StoryArt({ name }) {
  return (
    <svg className="intro-art" viewBox="0 0 200 130" aria-hidden="true">
      <circle cx="100" cy="66" r="52" fill="#10283a" stroke="#c4963c" strokeWidth="2" />
      {name === 'king' && <King />}
      {name === 'war' && <War />}
      {name === 'horse' && <Horse />}
      {name === 'night' && <NightWalls />}
      {name === 'gate' && <OpenGate />}
    </svg>
  );
}

function King() {
  return (
    <g>
      <path d="M78 96 L100 58 L122 96 Z" fill="#9c3b2e" />
      <circle cx="100" cy="52" r="10" fill="#f0d2b0" />
      <path d="M88 48 L100 34 L112 48 L106 46 L100 40 L94 46 Z" fill="#e6c27a" />
      <rect x="96" y="30" width="8" height="6" fill="#e23b2f" />
      <path d="M70 100 H130" stroke="#e6c27a" strokeWidth="2" />
    </g>
  );
}

function War() {
  return (
    <g>
      <path d="M58 88 H142 V78 H134 V70 H126 V78 H116 V64 H108 V78 H92 V70 H84 V78 H74 V72 H66 V78 H58 Z" fill="#c8bfae" />
      <path d="M64 90 Q78 78 92 90" fill="none" stroke="#d7f3ee" strokeWidth="2" />
      <path d="M96 92 Q112 76 128 92" fill="none" stroke="#d7f3ee" strokeWidth="2" />
      <path d="M70 90 L78 78 H86 L78 90 Z" fill="#f3e6c8" />
      <path d="M108 90 L118 74 H128 L118 90 Z" fill="#f3e6c8" />
      <circle cx="138" cy="40" r="6" fill="#e6c27a" />
    </g>
  );
}

function Horse() {
  return (
    <g>
      <rect x="78" y="78" width="10" height="10" rx="5" fill="#3a2a1c" />
      <rect x="112" y="78" width="10" height="10" rx="5" fill="#3a2a1c" />
      <rect x="74" y="58" width="58" height="24" rx="4" fill="#8a5a32" />
      <rect x="96" y="64" width="16" height="12" fill="#2a1c10" />
      <rect x="102" y="68" width="4" height="4" fill="#e6c27a" />
      <path d="M112 58 L128 44 H140 L128 58 Z" fill="#7a4e2a" />
      <rect x="124" y="40" width="4" height="8" fill="#5a3a22" />
    </g>
  );
}

function NightWalls() {
  return (
    <g>
      <circle cx="132" cy="36" r="8" fill="#f0d48a" />
      <path d="M58 90 H86 V70 H94 V90 H108 V70 H116 V90 H142 V78 H134 V68 H126 V78 H112 V62 H96 V78 H82 V70 H74 V78 H66 V72 H58 Z" fill="#c8bfae" />
      <rect x="94" y="78" width="14" height="12" fill="#1a120e" />
      <circle cx="70" cy="48" r="1.5" fill="#e6c27a" />
      <circle cx="124" cy="52" r="1.5" fill="#e6c27a" />
    </g>
  );
}

function OpenGate() {
  return (
    <g>
      <circle cx="132" cy="38" r="7" fill="#f0d48a" />
      <path d="M58 92 H78 V68 H86 V92 H114 V68 H122 V92 H142 V78 H58 Z" fill="#d9d0c0" />
      <rect x="86" y="74" width="28" height="18" fill="#1a2430" />
      <circle cx="78" cy="86" r="4" fill="#1a7f96" />
      <circle cx="122" cy="84" r="4" fill="#a32030" />
    </g>
  );
}
