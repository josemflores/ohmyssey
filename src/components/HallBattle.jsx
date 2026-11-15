import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { makeHallDeck } from '../game/level2/hallQuestions.js';
import BattleLog from './BattleLog.jsx';
import CircuitDiagram from './CircuitDiagram.jsx';
import {
  ChoiceLabel,
  KeysHint,
  QuestionHeader,
  choicesClass,
  useChoiceKeys,
} from './QuestionCard.jsx';
import '../game/odysseusBattle.css';
import '../game/soldierBattle.css';
import './TroyWorld.css';
import '../game/gameOver.css';
import './HallBattle.css';

// The fight in the hall (Odyssey 22). Odysseus has the great bow; the
// suitors come at him in four groups of three, the same twelve who feast
// in the hall (hallMap.js). Same rules as the battle at Troy: answer right
// and the arrow strikes; miss, and a suitor strikes back.

const HERO_MAX = 30;
const SUITOR_HP = 8;
const SUITOR_SWING = 2;
// Telemachus brings shields and spears from the storeroom between groups.
const RESUPPLY = 6;

export const MOVES = [
  { id: 'shot', label: 'Quick Shot', difficulty: 'easy', hint: 'Easy', damage: 5, all: false },
  { id: 'volley', label: 'Volley', difficulty: 'hard', hint: 'Hard', damage: 5, all: true },
];

const sheet = (key) => `/assets/sprites/npcs/suitor_lpc/suitor_${key}.png`;

export const WAVES = [
  {
    note: 'Antinous lifts his cup. The first arrow is for him.',
    foes: [['antinous', 'Antinous', 'a_1'], ['ctesippus', 'Ctesippus', 'b_3'], ['elatus', 'Elatus', 'c_1']],
  },
  {
    note: 'Eurymachus draws his sword and leads the charge.',
    foes: [['eurymachus', 'Eurymachus', 'b_2'], ['leodes', 'Leodes', 'a_2'], ['peisander', 'Peisander', 'c_3']],
  },
  {
    note: 'Amphinomus rushes the door with his sword.',
    foes: [['amphinomus', 'Amphinomus', 'c_4'], ['agelaus', 'Agelaus', 'a_4'], ['polybus', 'Polybus', 'b_1']],
  },
  {
    note: 'The last of the suitors make their stand.',
    foes: [['eurydamas', 'Eurydamas', 'c_2'], ['demoptolemus', 'Demoptolemus', 'b_4'], ['euryades', 'Euryades', 'a_3']],
  },
];

// How long each animation plays before the fight moves on (HallBattle.css).
const ANIM_MS = { shot: 1350, volley: 1500, loose: 1250, counter: 760 };
// Odysseus brings the bow up from his side, draws the string back to his
// cheek and lets go 0.64 s into the shot (the release frame of
// odysseus_bow_shoot_e.png); the arrows fly then.
const RELEASE_MS = 640;
const ENTER_MS = 2000;

function foesFor(wave) {
  return WAVES[wave].foes.map(([id, name, key]) => ({ id, name, sheet: sheet(key), hp: SUITOR_HP, max: SUITOR_HP }));
}

function freshFight(wave, heroHp) {
  return {
    wave,
    heroHp,
    foes: foesFor(wave),
    phase: 'menu',
    question: null,
    move: null,
    anim: '',
    targets: [],
    blow: 0,
    log: null,
    note: WAVES[wave].note,
    float: null,
    hint: '',
  };
}

export default function HallBattle({ onWon, onBlow, onLost, onRetry }) {
  const deck = useRef(null);
  if (!deck.current) deck.current = makeHallDeck();
  const [fight, setFight] = useState(() => freshFight(0, HERO_MAX));
  const [entering, setEntering] = useState(true);
  const [lost, setLost] = useState(false);
  const timers = useRef([]);
  const screen = useRef(null);
  const heroRef = useRef(null);
  const foeRefs = useRef([]);
  const [arrows, setArrows] = useState([]);

  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The opening wipe plays for each group.
  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), ENTER_MS);
    return () => clearTimeout(t);
  }, [fight.wave, lost]);

  // Arrows fly from his bow to each target. Measured from the page, so
  // they land on the right suitor at any screen size.
  useLayoutEffect(() => {
    if (fight.anim !== 'shot' && fight.anim !== 'volley' && fight.anim !== 'loose') {
      setArrows([]);
      return;
    }
    const box = screen.current?.getBoundingClientRect();
    const hero = heroRef.current?.getBoundingClientRect();
    if (!box || !hero) return;
    const from = { x: hero.left + hero.width * 0.78 - box.left, y: hero.top + hero.height * 0.58 - box.top };
    const aims = fight.anim === 'loose' ? [-1] : fight.targets;
    setArrows(aims.map((index, i) => {
      const el = foeRefs.current[index];
      const r = el ? el.getBoundingClientRect() : null;
      // A miss sails over their heads and out of the hall.
      const to = r
        ? { x: r.left + r.width * 0.4 - box.left, y: r.top + r.height * 0.55 - box.top }
        : { x: box.width + 40, y: from.y - 70 };
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      return { key: `${fight.blow}-${i}`, x: from.x, y: from.y, dx, dy, angle: Math.atan2(dy, dx), delay: i * 90 };
    }));
  }, [fight.anim, fight.blow]);

  function choose(moveId) {
    if (fight.phase !== 'menu' || entering) return;
    const move = MOVES.find((m) => m.id === moveId) || MOVES[0];
    setFight((f) => ({ ...f, phase: 'question', move, question: deck.current.draw(move.difficulty), note: '', anim: '' }));
  }

  function answer(index) {
    if (fight.phase !== 'question' || !fight.question) return;
    const { move, question } = fight;
    const correct = index === question.answer;
    onBlow?.({ damage: correct ? move.damage : 0, heavy: move.all });
    if (!correct) {
      setFight((f) => ({
        ...f,
        phase: 'anim',
        question: null,
        anim: 'loose',
        targets: [],
        blow: f.blow + 1,
        log: { who: 'greek', name: 'Odysseus', action: 'misses', damage: 0 },
        float: null,
        hint: question.hint,
      }));
      later(ANIM_MS.loose, () => setFight((f) => ({ ...f, phase: 'enemy', anim: '' })));
      return;
    }
    const living = fight.foes.map((foe, i) => i).filter((i) => fight.foes[i].hp > 0);
    const targets = move.all ? living : living.slice(0, 1);
    const foes = fight.foes.map((foe, i) => (
      targets.includes(i) ? { ...foe, hp: Math.max(0, foe.hp - move.damage) } : foe
    ));
    const first = fight.foes[targets[0]];
    setFight((f) => ({
      ...f,
      phase: 'anim',
      question: null,
      anim: move.id,
      targets,
      foes,
      blow: f.blow + 1,
      log: {
        who: 'greek',
        name: 'Odysseus',
        action: move.all ? 'looses a volley' : `shoots ${first?.name || ''}`.trim(),
        damage: move.damage,
        splash: move.all ? targets.length - 1 : 0,
      },
      float: { text: `-${move.damage}`, miss: false },
      hint: '',
    }));
    later(ANIM_MS[move.id], () => afterHit(foes));
  }

  function afterHit(foes) {
    const cleared = foes.every((foe) => foe.hp <= 0);
    if (!cleared) {
      setFight((f) => ({ ...f, phase: 'menu', anim: '', targets: [], float: null }));
      return;
    }
    if (fight.wave + 1 >= WAVES.length) {
      setFight((f) => ({ ...f, phase: 'won', anim: '', targets: [], float: null }));
      later(400, () => onWon?.());
      return;
    }
    // Next group. Telemachus brings him armour from the storeroom.
    setFight((f) => ({ ...f, phase: 'between', anim: '', targets: [], float: null }));
  }

  function nextWave() {
    setFight((f) => {
      const next = freshFight(f.wave + 1, Math.min(HERO_MAX, f.heroHp + RESUPPLY));
      return { ...next, blow: f.blow };
    });
  }

  // After a miss: one suitor strikes back.
  function enemyActs() {
    if (fight.phase !== 'enemy') return;
    const living = fight.foes.map((foe, i) => i).filter((i) => fight.foes[i].hp > 0);
    const striker = living[Math.floor(Math.random() * living.length)];
    const heroHp = Math.max(0, fight.heroHp - SUITOR_SWING);
    onBlow?.({ damage: SUITOR_SWING });
    setFight((f) => ({
      ...f,
      phase: 'anim',
      anim: 'counter',
      targets: [striker],
      heroHp,
      blow: f.blow + 1,
      log: { who: 'trojan', name: fight.foes[striker].name, action: 'strikes', damage: SUITOR_SWING },
      float: { text: `-${SUITOR_SWING}`, miss: false, hero: true },
      hint: '',
    }));
    later(ANIM_MS.counter, () => {
      if (heroHp <= 0) {
        setLost(true);
        onLost?.();
        return;
      }
      setFight((f) => ({ ...f, phase: 'menu', anim: '', targets: [], float: null }));
    });
  }

  function tryAgain() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLost(false);
    onRetry?.();
    setFight(freshFight(0, HERO_MAX));
  }

  useChoiceKeys(fight.phase === 'menu' && !entering && !lost, MOVES.length, (i) => choose(MOVES[i].id));
  useChoiceKeys(fight.phase === 'question' && Boolean(fight.question), fight.question?.choices.length || 4, answer);
  useEffect(() => {
    if (fight.phase !== 'enemy' && fight.phase !== 'between') return undefined;
    function onKey(event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (fight.phase === 'enemy') enemyActs();
      else nextWave();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const { foes, anim } = fight;
  const heroHit = anim === 'counter';
  return (
    <div className="troy l2-battle">
      <div
        key={`wave-${fight.wave}`}
        ref={screen}
        className={`battle-screen is-hall${entering ? ' is-entering' : ''}${anim ? ` is-${anim}` : ''}${anim === 'volley' || heroHit ? ' is-shake' : ''}`}
        role="dialog"
        aria-label="Battle in the hall"
        data-wave={fight.wave + 1}
        data-phase={fight.phase}
      >
        <ol className="battle-order">
          <li className={fight.phase !== 'enemy' && anim !== 'counter' ? 'is-now' : ''}>Odysseus</li>
          <li className={fight.phase === 'enemy' || anim === 'counter' ? 'is-now' : ''}>The suitors</li>
        </ol>
        <div className="battle-backdrop" aria-hidden="true" />
        <div className="battle-intro" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} style={{ '--i': i }} />)}
        </div>
        <p className="l2-battle-wave" aria-live="polite">Group {fight.wave + 1} of {WAVES.length}</p>
        <BattleLog key={`log-${fight.blow}`} log={fight.log} note={fight.note} fresh={Boolean(fight.blow) || Boolean(fight.note)} />
        <div className="battle-stage">
          <div className="battle-side">
            <p className="battle-name">Odysseus</p>
            <p className="battle-hp-num">{fight.heroHp} / {HERO_MAX}</p>
            <div className="battle-hp-track">
              <span style={{ width: `${Math.max(0, fight.heroHp / HERO_MAX) * 100}%` }} />
            </div>
            <div className="battle-fighter" key={`hero-${fight.blow}`} ref={heroRef}>
              <div className="battle-sprite battle-hero battle-archer" />
              {fight.float?.hero && <b className="battle-float is-hurt">{fight.float.text}</b>}
            </div>
          </div>
          <div className="battle-side is-foe">
            <div className="battle-foes">
              {foes.map((foe, index) => {
                const down = foe.hp <= 0;
                const target = fight.targets.includes(index);
                return (
                  <div
                    key={foe.id}
                    ref={(el) => { foeRefs.current[index] = el; }}
                    className={`battle-member${down ? ' is-down' : ''}${target ? ' is-target' : ''}`}
                    data-foe={foe.id}
                  >
                    <p className="battle-name">{foe.name}</p>
                    <p className="battle-hp-num">{foe.hp} / {foe.max}</p>
                    <div className="battle-hp-track">
                      <span style={{ width: `${Math.max(0, foe.hp / foe.max) * 100}%` }} />
                    </div>
                    <div className="battle-sprite battle-suitor" style={{ '--sheet': `url('${foe.sheet}')` }} />
                    {fight.float && !fight.float.hero && target && (
                      <b className="battle-float">{fight.float.text}</b>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {arrows.map((a) => (
          <span
            key={a.key}
            className={`l2-arrow${anim === 'loose' ? ' is-miss' : ''}`}
            aria-hidden="true"
            style={{
              left: `${a.x}px`,
              top: `${a.y}px`,
              '--dx': `${a.dx}px`,
              '--dy': `${a.dy}px`,
              '--angle': `${a.angle}rad`,
              animationDelay: `${RELEASE_MS + a.delay}ms`,
            }}
          />
        ))}
        <div className="battle-dock">
          {fight.phase === 'question' && fight.question && (
            <div className="battle-question q-card">
              <QuestionHeader eyebrow="Ω · The hall of Odysseus" title={fight.move?.label || 'Shoot'} />
              {choicesClass(fight.question.choices) === 'q-choices' && (
                <CircuitDiagram circuit={fight.question.circuit} />
              )}
              <p className="q-prompt">{fight.question.prompt}</p>
              <div className={`battle-choices ${choicesClass(fight.question.choices)}`}>
                {fight.question.choices.map((choice, index) => (
                  <button
                    key={choice}
                    type="button"
                    className="battle-choice q-choice"
                    data-correct={index === fight.question.answer ? '1' : '0'}
                    onClick={() => answer(index)}
                  >
                    <ChoiceLabel index={index}>{choice}</ChoiceLabel>
                  </button>
                ))}
              </div>
              <KeysHint count={fight.question.choices.length} />
            </div>
          )}
          {fight.phase === 'enemy' && (
            <div className="battle-question q-card l2-battle-miss">
              <p className="q-note is-wrong">The arrow flies wide. {fight.hint}</p>
              <button type="button" className="battle-continue q-action" onClick={enemyActs} autoFocus>
                Continue
              </button>
            </div>
          )}
          {fight.phase === 'between' && (
            <div className="battle-question q-card l2-battle-miss">
              <p className="q-note is-right">
                The group falls. Telemachus runs to the storeroom and brings back shields and spears. +{RESUPPLY} HP
              </p>
              <button type="button" className="battle-continue q-action" onClick={nextWave} autoFocus>
                Next group
              </button>
            </div>
          )}
          {fight.phase === 'menu' && !entering && (
            <div className="battle-commands q-card q-menu">
              <p className="q-eyebrow">Ω · The great bow</p>
              {MOVES.map((move, index) => (
                <button key={move.id} type="button" className="battle-command q-command" onClick={() => choose(move.id)}>
                  <span className="q-command-key" aria-hidden="true">{index + 1}</span>
                  <span className="q-command-text">
                    <span className="q-command-label">{move.label}</span>
                    <small>{move.hint} question · {move.damage} damage{move.all ? ' to every suitor' : ''}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {lost && (
          <div className="game-over" role="dialog" aria-modal="true" aria-labelledby="l2-fallen">
            <div className="game-over-card q-card">
              <p className="q-eyebrow">Ω · Ithaca</p>
              <h2 id="l2-fallen" className="game-over-title">Odysseus has Fallen</h2>
              <div className="q-rule" aria-hidden="true" />
              <div className="game-over-actions">
                <button type="button" className="q-action game-over-btn" onClick={tryAgain} autoFocus>
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
