/**
 * One monster, one question at a time.
 * A right answer is a blow. A wrong answer costs a heart and shows why.
 * Mouse and keys both work: 1–4 or A–D answer, Enter continues, Esc slips away.
 */

import { useEffect, useReducer, useRef } from 'react';
import { applyAnswer, choiceFromKey } from '../learn/encounters/combat.js';
import { HERO, levelPlace, pickMonster } from '../learn/encounters/monsters.js';
import { buildDeck, questionAt } from '../learn/encounters/questions.js';
import './MonsterEncounter.css';

function freshFight(level, monsterId) {
  const monster = pickMonster(level, monsterId);
  const deck = buildDeck(level);
  return {
    monster,
    deck,
    cursor: 0,
    question: deck[0] || null,
    heroHp: HERO.hp,
    foeHp: monster ? monster.hp : 0,
    phase: monster && deck[0] ? 'ask' : 'empty',
    picked: null,
  };
}

function reducer(state, action) {
  if (action.type === 'answer') {
    if (state.phase !== 'ask' || !state.question || !state.monster) return state;
    const correct = action.index === state.question.answerIndex;
    const next = applyAnswer({
      heroHp: state.heroHp,
      foeHp: state.foeHp,
      correct,
      foeDamage: state.monster.damage,
      heroStrike: HERO.strike,
    });
    return {
      ...state,
      heroHp: next.heroHp,
      foeHp: next.foeHp,
      phase: next.outcome,
      picked: action.index,
    };
  }
  if (action.type === 'advance') {
    if (state.phase !== 'hit' && state.phase !== 'hurt') return state;
    const cursor = state.cursor + 1;
    return {
      ...state,
      cursor,
      question: action.question,
      phase: 'ask',
      picked: null,
    };
  }
  return state;
}

export default function MonsterEncounter({
  level,
  monsterId,
  onWin,
  onLose,
  onFlee,
  onDismiss,
  preview = false,
}) {
  const [state, dispatch] = useReducer(reducer, null, () => freshFight(level, monsterId));
  const dialogRef = useRef(null);
  const ended = useRef(false);
  const { monster, question, phase, picked, heroHp, foeHp } = state;

  useEffect(() => {
    document.body.dataset.encounter = 'open';
    return () => {
      delete document.body.dataset.encounter;
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.focus();
  }, [phase, question]);

  function finish(fn) {
    if (ended.current || typeof fn !== 'function') return;
    ended.current = true;
    fn();
  }

  function advance() {
    const next = questionAt(state.deck, state.cursor + 1, level);
    dispatch({ type: 'advance', question: next });
  }

  useEffect(() => {
    function onKey(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (phase === 'win') finish(onWin);
        else if (phase === 'lose') finish(onLose);
        else finish(onFlee);
        return;
      }
      if (phase === 'ask' && question) {
        const index = choiceFromKey(event.key, question.choices.length);
        if (index == null) return;
        event.preventDefault();
        event.stopPropagation();
        dispatch({ type: 'answer', index });
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      if (phase === 'win') finish(onWin);
      else if (phase === 'empty') finish(onFlee);
      else if (phase === 'lose') finish(onLose);
      else if (phase === 'hit' || phase === 'hurt') advance();
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [phase, question, onWin, onLose, onFlee, level, state.deck, state.cursor]);

  if (phase === 'empty' || !monster) {
    return (
      <div className="encounter-overlay">
        <section
          className="card encounter-card encounter-empty"
          role="dialog"
          aria-modal="true"
          aria-labelledby="encounter-title"
          tabIndex={-1}
          ref={dialogRef}
          data-screen="encounter"
        >
          <p className="eyebrow">{levelPlace(level)}</p>
          <h2 id="encounter-title">Nothing steps out of the dark</h2>
          <p>This shore has no foe to question. The road stays open.</p>
          <div className="encounter-actions">
            <span className="encounter-keys">Enter or Esc closes this</span>
            <button className="btn btn-primary" type="button" onClick={() => finish(onFlee)}>
              Walk on
            </button>
          </div>
        </section>
      </div>
    );
  }

  const asking = phase === 'ask';
  const resolving = phase === 'hit' || phase === 'hurt';

  return (
    <div className="encounter-overlay">
      <section
        className="card encounter-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="encounter-title"
        tabIndex={-1}
        ref={dialogRef}
        data-screen="encounter"
        data-phase={phase}
        data-monster={monster.id}
      >
        <header className="encounter-head">
          <div className="encounter-mark" aria-hidden="true">
            <MonsterMark id={monster.id} />
          </div>
          <div>
            <p className="eyebrow">
              {preview ? 'Dev preview · ' : ''}
              {levelPlace(monster.level)}
            </p>
            <h2 className="encounter-name" id="encounter-title">{monster.name}</h2>
            <p className="encounter-flavor">{monster.flavor}</p>
          </div>
        </header>

        <div className="encounter-bars">
          <HpBar label={monster.name} hp={foeHp} max={monster.hp} tone="foe" />
          <HpBar label={HERO.name} hp={heroHp} max={HERO.hp} tone="hero" />
        </div>

        {question && phase !== 'win' && (
          <>
            <h3 className="encounter-prompt">{question.prompt}</h3>
            {asking && question.flavor && <p className="encounter-aside">{question.flavor}</p>}
          </>
        )}

        {(question && (asking || resolving || phase === 'lose')) && (
          <div className="encounter-choices" role="group" aria-label="Answers">
            {question.choices.map((choice, index) => {
              const right = !asking && index === question.answerIndex;
              const wrong = !asking && index === picked && index !== question.answerIndex;
              const className = [
                'choice',
                'encounter-choice',
                right ? 'is-right' : '',
                wrong ? 'is-wrong' : '',
              ].filter(Boolean).join(' ');
              return (
                <button
                  key={choice}
                  type="button"
                  className={className}
                  disabled={!asking}
                  onClick={() => dispatch({ type: 'answer', index })}
                >
                  <span className="encounter-key" aria-hidden="true">{index + 1}</span>
                  <span className="choice-label">{choice}</span>
                </button>
              );
            })}
          </div>
        )}

        {phase === 'hit' && (
          <section className="learn-feedback tone-pass encounter-note" aria-live="polite">
            <p className="current-kicker">The blow</p>
            <h3>That holds</h3>
            <p>The answer lands. {monster.name} gives ground.</p>
          </section>
        )}

        {phase === 'hurt' && (
          <section className="learn-feedback tone-fail encounter-note" aria-live="polite">
            <p className="current-kicker">The miss</p>
            <h3>{monster.name} strikes back</h3>
            <p>{question.explanation}</p>
          </section>
        )}

        {phase === 'win' && (
          <section className="win-banner encounter-note" aria-live="polite">
            <h3>The way is clear</h3>
            <p>{monster.name} breaks apart. The street is yours.</p>
          </section>
        )}

        {phase === 'lose' && (
          <section className="learn-feedback tone-fail encounter-note" aria-live="polite">
            <p className="current-kicker">Fallen back</p>
            <h3>The dark takes the step</h3>
            <p>{monster.name} drives you off. The lesson stays with you.</p>
            {question && <p>{question.explanation}</p>}
          </section>
        )}

        <div className="encounter-actions">
          <p className="encounter-keys">
            {asking && 'Keys 1–4 answer · Esc slips away'}
            {resolving && 'Enter continues · Esc slips away'}
            {phase === 'win' && 'Enter presses on'}
            {phase === 'lose' && 'Enter falls back'}
          </p>
          <div className="encounter-buttons">
            {preview && onDismiss && (
              <button className="btn btn-quiet" type="button" onClick={() => finish(onDismiss)}>
                Close preview
              </button>
            )}
            {(asking || resolving) && (
              <button className="btn btn-quiet" type="button" onClick={() => finish(onFlee)}>
                Slip away
              </button>
            )}
            {resolving && (
              <button className="btn btn-primary" type="button" onClick={advance}>
                Next question
              </button>
            )}
            {phase === 'win' && (
              <button className="btn btn-primary btn-large" type="button" onClick={() => finish(onWin)}>
                {preview ? 'Fight again' : 'Press on'}
              </button>
            )}
            {phase === 'lose' && (
              <button className="btn btn-primary" type="button" onClick={() => finish(onLose)}>
                {preview ? 'Fight again' : 'Fall back'}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function HpBar({ label, hp, max, tone }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (hp / max) * 100)) : 0;
  const low = hp <= 1;
  return (
    <div className={low ? `encounter-hp tone-${tone} is-low` : `encounter-hp tone-${tone}`}>
      <div className="encounter-hp-top">
        <strong>{label}</strong>
        <span>{hp} / {max}</span>
      </div>
      <div
        className="encounter-hp-track"
        role="meter"
        aria-label={`${label} health`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={hp}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MonsterMark({ id }) {
  if (id === 'harpy') return <Harpy />;
  if (id === 'gate-cinder') return <GateCinder />;
  if (id === 'cyclops-whelp') return <Cyclops />;
  if (id === 'suitors-hound') return <Hound />;
  if (id === 'feasting-suitor') return <Suitor />;
  return <Shade />;
}

function Shade() {
  return (
    <svg viewBox="0 0 68 68" aria-hidden="true">
      <path d="M34 8c10 0 16 8 16 16v6h4l-6 28H20L14 30h4v-6c0-8 6-16 16-16z" fill="#1b3344" stroke="#f0d48a" strokeWidth="2" />
      <path d="M34 8c2 7 2 12 0 18" stroke="#c4963c" strokeWidth="3" fill="none" />
      <path d="M22 32h24" stroke="#9c3b2e" strokeWidth="3" />
      <path d="M50 14l8-6v16" stroke="#d7f3ee" strokeWidth="2" fill="none" />
    </svg>
  );
}

function Harpy() {
  return (
    <svg viewBox="0 0 68 68" aria-hidden="true">
      <path d="M34 28c10-16 28-14 30-2S48 36 34 34" fill="#16485e" stroke="#f0d48a" strokeWidth="2" />
      <path d="M34 28C24 12 6 14 4 26s16 10 30 8" fill="#16485e" stroke="#f0d48a" strokeWidth="2" />
      <circle cx="34" cy="36" r="8" fill="#f6ead2" stroke="#241c14" strokeWidth="2" />
      <path d="M30 50l4 10 4-10" fill="#9c3b2e" />
    </svg>
  );
}

function GateCinder() {
  return (
    <svg viewBox="0 0 68 68" aria-hidden="true">
      <path d="M34 8c8 10 14 16 14 26a14 14 0 0 1-28 0c0-10 6-16 14-26z" fill="#b24a3a" stroke="#f0d48a" strokeWidth="2" />
      <path d="M34 22c4 6 6 10 6 14a6 6 0 0 1-12 0c0-4 2-8 6-14z" fill="#f0d48a" />
      <path d="M16 58h36M22 58V44M46 58V44M28 58V48M40 58V48" stroke="#d7f3ee" strokeWidth="2" />
    </svg>
  );
}

function Cyclops() {
  return (
    <svg viewBox="0 0 68 68" aria-hidden="true">
      <circle cx="34" cy="34" r="20" fill="#1f6d86" stroke="#f0d48a" strokeWidth="2" />
      <circle cx="34" cy="32" r="8" fill="#f6ead2" stroke="#241c14" strokeWidth="2" />
      <circle cx="34" cy="32" r="3" fill="#9c3b2e" />
      <path d="M18 50c6 6 26 6 32 0" stroke="#241c14" strokeWidth="2" fill="none" />
    </svg>
  );
}

function Hound() {
  return (
    <svg viewBox="0 0 68 68" aria-hidden="true">
      <path d="M14 30l8-14 8 8 8-10 8 8 8-6v22c0 10-8 16-20 16S14 48 14 38z" fill="#5c4c3a" stroke="#f0d48a" strokeWidth="2" />
      <circle cx="28" cy="32" r="2" fill="#f6ead2" />
      <circle cx="42" cy="32" r="2" fill="#f6ead2" />
      <path d="M22 48h24" stroke="#9c3b2e" strokeWidth="3" />
    </svg>
  );
}

function Suitor() {
  return (
    <svg viewBox="0 0 68 68" aria-hidden="true">
      <circle cx="28" cy="22" r="8" fill="#f6ead2" stroke="#241c14" strokeWidth="2" />
      <path d="M16 58c2-16 8-22 12-22s10 6 12 22" fill="#16485e" stroke="#f0d48a" strokeWidth="2" />
      <path d="M40 30h14v8a8 8 0 0 1-16 0v-4h6" fill="none" stroke="#c4963c" strokeWidth="2" />
      <path d="M18 16h20" stroke="#2f6b45" strokeWidth="2" />
    </svg>
  );
}
