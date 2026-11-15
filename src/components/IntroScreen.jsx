import { useEffect, useRef, useState } from 'react';
import { googleProfile } from '../learn/auth.js';
import { getPlayerName } from '../learn/player.js';
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
  const name = getPlayerName();
  const google = googleProfile();
  const welcomeRef = useRef(null);
  const indexRef = useRef(0);
  const onBeginRef = useRef(onBegin);
  const lastAdvance = useRef(0);
  const last = index === CARDS.length - 1;
  const card = CARDS[index];
  indexRef.current = index;
  onBeginRef.current = onBegin;

  useEffect(() => {
    welcomeRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    CARDS.forEach((item) => {
      const img = new Image();
      img.src = introArtSrc(item.art);
    });
  }, []);

  useEffect(() => {
    if (last) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setTimeout(() => setIndex((n) => n + 1), CARD_MS);
    return () => clearTimeout(timer);
  }, [index, last]);

  // Mouse, touch, Enter, and Space all take the next card. A press on the
  // last card enters Troy. The guard only drops a second event from the
  // same tap (pointerdown plus a click), not the next real press.
  function pressOn(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const now = performance.now();
    // A mouse click and a touch tap can both arrive a moment apart. One
    // press still moves one card. The next real press is well after this.
    if (now - lastAdvance.current < 400) return;
    lastAdvance.current = now;
    if (indexRef.current >= CARDS.length - 1) onBeginRef.current();
    else setIndex(indexRef.current + 1);
  }

  const pressRef = useRef(pressOn);
  pressRef.current = pressOn;

  useEffect(() => {
    function onKey(event) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const isEnter = event.key === 'Enter';
      const isSpace = event.key === ' ' || event.code === 'Space';
      if (!isEnter && !isSpace) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      pressRef.current(event);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function onTabKey(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
      return;
    }
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % CARDS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + CARDS.length) % CARDS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else nextIndex = CARDS.length - 1;
    setIndex(nextIndex);
    requestAnimationFrame(() => {
      document.getElementById(`intro-tab-${nextIndex}`)?.focus();
    });
  }

  return (
    <NightBackdrop>
      <main className="intro" data-screen="intro" style={{ '--card-ms': `${CARD_MS}ms` }}>
        <article className="card intro-card">
          <p ref={welcomeRef} className="intro-welcome" tabIndex={-1}>Welcome, {name}.</p>
          {google?.email && <p className="intro-signed-in">{google.email}</p>}
          <p className="intro-sr" role="status">{card.title}. {card.text}</p>
          <div
            key={card.title}
            id="intro-panel"
            className="intro-slide"
            role="tabpanel"
            aria-labelledby={`intro-tab-${index}`}
          >
            <p className="eyebrow">{card.kicker}</p>
            <h1 data-card-title>{card.title}</h1>
            <StoryArt name={card.art} />
            <p className="intro-text">{card.text}</p>
          </div>
          <div className="intro-dots" role="tablist" aria-label="Story" aria-orientation="horizontal">
            {CARDS.map((item, i) => (
              <button
                key={item.title}
                id={`intro-tab-${i}`}
                type="button"
                role="tab"
                className={i === index ? 'is-on' : ''}
                aria-label={item.title}
                aria-selected={i === index}
                aria-controls="intro-panel"
                tabIndex={i === index ? 0 : -1}
                onClick={() => setIndex(i)}
                onKeyDown={onTabKey}
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
              onPointerDown={pressOn}
            >
              Press on
            </button>
          </div>
        </article>
      </main>
    </NightBackdrop>
  );
}

function introArtSrc(art) {
  return `/assets/intro/intro_${art}.webp`;
}

function StoryArt({ name }) {
  return (
    <div className="intro-frame">
      <img
        className="intro-art"
        src={introArtSrc(name)}
        alt=""
        draggable={false}
      />
    </div>
  );
}
