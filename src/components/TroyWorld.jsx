import { useEffect, useRef, useState } from 'react';
import { ATTACKS, GATE_FALLBACK } from '../game/battleQuestions.js';
import { createTroyGame } from '../game/createTroyGame.js';
import { hatchQuestionAfter } from '../game/hatchQuestions.js';
import { clearActiveGame, setActiveGame } from '../lib/activeGame.js';
import './TroyWorld.css';
import '../game/gameOver.css';
import {
  ChoiceLabel,
  KeysHint,
  QuestionHeader,
  choicesClass,
  useChoiceKeys,
} from './QuestionCard.jsx';
import BattleLog from './BattleLog.jsx';
import CircuitDiagram from './CircuitDiagram.jsx';

const MOVES = [ATTACKS.light, ATTACKS.heavy];

const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

// Mounts the Phaser city. The hint fades after a few seconds, or on the first step.
// A spot in the city can also open a small box. That box is a placeholder until
// the real puzzle and encounter screens plug in.
// onHome and onRestart come from App: they power the game over screen.
export default function TroyWorld({ onSail, onHome, onRestart }) {
  const host = useRef(null);
  const gameRef = useRef(null);
  const [hint, setHint] = useState(true);
  const [talk, setTalk] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [fight, setFight] = useState(null);
  // True for the first moments of a fight, while its opening plays
  // (Odysseus runs in, then the battle UI appears piece by piece).
  const [entering, setEntering] = useState(false);
  const enterTimer = useRef(null);
  const [questDone, setQuestDone] = useState(false);
  const [complete, setComplete] = useState(false);
  // Odysseus ran out of HP. Shows "Odysseus has Fallen".
  const [gameOver, setGameOver] = useState(false);
  const [gateAsk, setGateAsk] = useState(null);
  const [runHint, setRunHint] = useState(false);
  const sailed = useRef(false);
  const [banner, setBanner] = useState('');
  const [place, setPlace] = useState('horse');
  const [objective, setObjective] = useState({
    title: 'Reach the gate',
    note: 'Open the gate (E)',
  });
  // A finished objective is crossed out and fades away (retiring), then the
  // next one appears with a "New objective" glow (freshObjective).
  const [retiring, setRetiring] = useState(null);
  const [freshObjective, setFreshObjective] = useState(false);
  const objectiveRef = useRef(objective);
  const pendingObjective = useRef(null);
  const objectiveTimers = useRef([]);
  const onSailRef = useRef(onSail);
  onSailRef.current = onSail;
  const fightRef = useRef(null);
  const quizRef = useRef(null);
  fightRef.current = fight;
  quizRef.current = quiz;

  useEffect(() => {
    const parent = host.current;
    const game = createTroyGame(parent);
    gameRef.current = game;
    setActiveGame(game);

    // A new objective. "Defeat the Trojan warriors! (1/3)" and "(2/3)" are the
    // same stage, so a count change just updates the text. A new stage
    // (for example after the gate opens) gets the cross-out animation.
    function onObjective(next) {
      if (!next || !next.title) return;
      if (pendingObjective.current) {
        // Still animating the old one: show this when the animation ends.
        pendingObjective.current = next;
        return;
      }
      const current = objectiveRef.current;
      if (stageOf(current.title) === stageOf(next.title)) {
        objectiveRef.current = next;
        setObjective(next);
        return;
      }
      pendingObjective.current = next;
      setFreshObjective(false);
      setRetiring(current);
      // 0.7 s to draw the line through it, 1 s crossed out, 0.9 s to fade
      // away (TroyWorld.css). Keep these numbers in step with the CSS.
      objectiveTimers.current.push(setTimeout(() => {
        const shown = pendingObjective.current;
        pendingObjective.current = null;
        objectiveRef.current = shown;
        setRetiring(null);
        setObjective(shown);
        setFreshObjective(true);
        objectiveTimers.current.push(setTimeout(() => setFreshObjective(false), 3600));
      }, 2600));
    }

    // The scene found a spot and the player pressed E.
    function onInteract(spot) {
      setTalk(spot);
      game.events.emit('lockInput');
    }
    // He pressed E again while the box was open.
    function onCloseRequest() {
      setTalk(null);
      // E asks to close the talk box. A hatch question or a fight still
      // owns the lock, or he walks off while the card is on screen.
      if (fightRef.current || quizRef.current) return;
      game.events.emit('unlockInput');
    }
    function onFightStart(payload) {
      setFight({ ...payload, phase: 'menu', note: '' });
      setEntering(true);
      clearTimeout(enterTimer.current);
      // Matches the longest delay in the opening (soldierBattle.css).
      enterTimer.current = setTimeout(() => setEntering(false), 2000);
    }
    function onFightQuestion(question) {
      setFight((current) => current && {
        ...current,
        phase: 'question',
        question,
        attack: question.attack || current.attack,
        anim: '',
      });
    }
    function onFightBlow(payload) {
      setFight((current) => {
        if (!current) return current;
        const miss = payload.anim === 'whiff';
        const onHero = payload.anim === 'counter';
        return {
          ...current,
          heroHp: payload.heroHp,
          foes: payload.foes || current.foes,
          phase: 'anim',
          question: null,
          anim: payload.anim,
          foeIndex: payload.foeIndex,
          fallen: payload.fallen || [],
          shake: payload.anim === 'heavy' || payload.anim === 'counter',
          blow: (current.blow || 0) + 1,
          side: payload.side || current.side,
          note: payload.note || '',
          log: payload.log || null,
          float: !payload.damage && !miss ? null : {
            text: miss ? 'Miss' : `-${payload.damage}`,
            side: onHero ? 'hero' : 'foe',
            miss,
          },
        };
      });
    }
    function onFightTurn(payload) {
      setFight((current) => current && {
        ...current,
        ...payload,
        phase: 'menu',
        question: null,
        anim: '',
        foeIndex: -1,
        shake: false,
        float: null,
        side: 'hero',
      });
    }
    function onFightEnd(payload) {
      setFight(null);
      setBanner(payload.note || '');
    }
    // The hatch in the horse. status is open, wrong, or right.
    function onHatchQuestion(question) {
      setQuiz({ question, picked: null, status: 'open' });
      game.events.emit('lockInput');
    }
    game.events.on('interact', onInteract);
    game.events.on('closeInteract', onCloseRequest);
    game.events.on('place', setPlace);
    game.events.on('hatchQuestion', onHatchQuestion);
    game.events.on('fightStart', onFightStart);
    game.events.on('fightQuestion', onFightQuestion);
    game.events.on('fightBlow', onFightBlow);
    game.events.on('fightTurn', onFightTurn);
    game.events.on('fightEnd', onFightEnd);
    game.events.on('questDone', () => {
      setQuestDone(true);
    });
    game.events.on('notice', (text) => setBanner(text || ''));
    game.events.on('levelComplete', () => setComplete(true));
    game.events.on('gameOver', () => {
      setFight(null);
      setGameOver(true);
    });
    game.events.on('objective', onObjective);
    game.events.on('gateQuestion', (question) => setGateAsk({ ...question, wrong: false, hint: '' }));
    game.events.on('gateWrong', (payload) => {
      setGateAsk((current) => current && { ...current, wrong: true, hint: payload.hint });
    });
    game.events.on('gateClosed', () => setGateAsk(null));
    game.events.on('runHint', () => setRunHint(true));
    return () => {
      game.events.off('interact', onInteract);
      game.events.off('closeInteract', onCloseRequest);
      game.events.off('place', setPlace);
      game.events.off('hatchQuestion', onHatchQuestion);
      game.events.off('fightStart', onFightStart);
      game.events.off('fightQuestion', onFightQuestion);
      game.events.off('fightBlow', onFightBlow);
      game.events.off('fightTurn', onFightTurn);
      game.events.off('fightEnd', onFightEnd);
      game.events.off('questDone');
      game.events.off('notice');
      game.events.off('levelComplete');
      game.events.off('gameOver');
      game.events.off('objective');
      objectiveTimers.current.forEach(clearTimeout);
      clearTimeout(enterTimer.current);
      game.events.off('gateQuestion');
      game.events.off('gateWrong');
      game.events.off('gateClosed');
      game.events.off('runHint');
      clearActiveGame(game);
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  function closeTalk() {
    setTalk(null);
    gameRef.current?.events.emit('unlockInput');
  }

  function pickAnswer(index) {
    if (!quiz || quiz.status !== 'open') return;
    const right = index === quiz.question.answer;
    if (right) {
      setQuiz(null);
      gameRef.current?.events.emit('unlockHatch');
      gameRef.current?.events.emit('unlockInput');
      return;
    }
    setQuiz({ ...quiz, picked: index, status: 'wrong' });
  }

  function anotherQuestion() {
    setQuiz((current) => {
      if (!current) return current;
      return {
        question: hatchQuestionAfter(current.question.id),
        picked: null,
        status: 'open',
      };
    });
  }

  function closeQuiz() {
    setQuiz(null);
    gameRef.current?.events.emit('unlockInput');
  }

  function attack(kind) {
    const move = ATTACKS[kind] || ATTACKS.light;
    setFight((current) => current && {
      ...current,
      phase: 'wait',
      note: '',
      anim: '',
      attack: move.label,
    });
    gameRef.current?.events.emit('fightAttack', { kind: move.id });
  }

  function pickGate(index) {
    if (!gateAsk || gateAsk.wrong) return;
    gameRef.current?.events.emit('gatePick', { index });
  }

  function dismissGate() {
    setGateAsk(null);
    gameRef.current?.events.emit('gateDismiss');
  }

  function flee() {
    gameRef.current?.events.emit('fightFlee');
  }

  function pickFight(index) {
    gameRef.current?.events.emit('fightStrike', { index });
  }

  function enemyContinue() {
    gameRef.current?.events.emit('fightEnemyAct');
  }

  useEffect(() => {
    const timer = setTimeout(() => setHint(false), 4200);
    function onKey(event) {
      if (MOVE_KEYS.has(event.code)) setHint(false);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!banner) return undefined;
    const timer = setTimeout(() => setBanner(''), 2800);
    return () => clearTimeout(timer);
  }, [banner]);

  useEffect(() => {
    if (!runHint) return undefined;
    const timer = setTimeout(() => setRunHint(false), 3500);
    function onKey(event) {
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') setRunHint(false);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [runHint]);

  useEffect(() => {
    if (!complete || sailed.current) return undefined;
    const timer = setTimeout(() => {
      sailed.current = true;
      onSailRef.current?.();
    }, 1700);
    return () => clearTimeout(timer);
  }, [complete]);

  useEffect(() => {
    if (!talk && !quiz) return undefined;
    function onKey(event) {
      if (event.code !== 'Escape') return;
      if (talk) closeTalk();
      else if (quiz.status === 'right' || quiz.status === 'open') closeQuiz();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [talk, quiz]);

  const gateChoices = gateAsk && Array.isArray(gateAsk.choices) && gateAsk.choices.length >= 4
    ? gateAsk.choices
    : GATE_FALLBACK.choices;
  // Keys 1–4 answer whichever question card is open.
  useChoiceKeys(Boolean(quiz && quiz.status === 'open'), quiz?.question.choices.length || 4, pickAnswer);
  useChoiceKeys(Boolean(fight && fight.phase === 'question' && fight.question), fight?.question?.choices.length || 4, pickFight);
  useChoiceKeys(Boolean(gateAsk && !gateAsk.wrong), gateChoices.length, pickGate);
  // In the battle menu, 1 and 2 are the attacks and 3 is Flee.
  useChoiceKeys(
    Boolean(fight && fight.phase === 'menu' && !gateAsk),
    MOVES.length + 1,
    (index) => (index < MOVES.length ? attack(MOVES[index].id) : flee()),
  );

  const arrived = place === 'horse'
    ? 'Inside the horse. WASD to move. Press E at the hatch.'
    : 'Troy at night. WASD to move.';

  return (
    <div className="troy" data-screen="world">
      <p className="troy-sr" role="status">{arrived}</p>
      <div ref={host} className="troy-host" />
      <h1 className="troy-plaque">
        {place === 'horse' ? 'The horse' : 'Troy'}
        <span>{place === 'horse' ? 'inside' : 'at night'}</span>
      </h1>
      {place !== 'horse' && !complete && (
        retiring ? (
          <div className="troy-tracker is-done" aria-hidden="true">
            <span>Objective complete</span>
            <strong>{retiring.title}</strong>
            <em>{retiring.note}</em>
          </div>
        ) : (
          <div className={`troy-tracker${freshObjective ? ' is-new' : ''}`} role="status">
            <span>{freshObjective ? 'New objective' : 'Objective'}</span>
            <strong>{objective.title}</strong>
            <em>{objective.note}</em>
          </div>
        )
      )}
      <p className={hint && !quiz && !fight ? 'troy-hint' : 'troy-hint is-hidden'}>WASD to move</p>
      {runHint && !fight && <p className="troy-run">Hold Shift to run</p>}
      {banner && <p className="troy-banner">{banner}</p>}
      {talk && (
        <div className="troy-talk" role="dialog" aria-label={talk.id}>
          <p className="troy-talk-id">{talk.id}</p>
          <p className="troy-talk-line">{talk.prompt}</p>
          <button type="button" className="btn btn-quiet" onClick={closeTalk}>
            Close
          </button>
        </div>
      )}
      {quiz && (
        <div className="troy-talk troy-quiz q-card" role="dialog" aria-label="Hatch question">
          <QuestionHeader eyebrow="Ω · Inside the horse" title="The Hatch" />
          <CircuitDiagram circuit={quiz.question.circuit} />
          <p className="q-prompt">{quiz.question.prompt}</p>
          <div className={choicesClass(quiz.question.choices)}>
            {quiz.question.choices.map((choice, index) => {
              const show = quiz.status !== 'open';
              const correct = index === quiz.question.answer;
              let mark = '';
              if (show && correct) mark = ' is-right';
              else if (show && index === quiz.picked) mark = ' is-wrong';
              return (
                <button
                  key={choice}
                  type="button"
                  className={`troy-quiz-choice q-choice${mark}`}
                  data-correct={correct ? '1' : '0'}
                  disabled={quiz.status !== 'open'}
                  onClick={() => pickAnswer(index)}
                >
                  <ChoiceLabel index={index}>{choice}</ChoiceLabel>
                </button>
              );
            })}
          </div>
          {quiz.status === 'open' && <KeysHint count={quiz.question.choices.length} />}
          {quiz.status === 'wrong' && (
            <>
              <p className="troy-quiz-note q-note is-wrong">{quiz.question.hint} The hatch stays shut until an answer is right.</p>
              <button type="button" className="troy-quiz-next q-action" onClick={anotherQuestion}>
                Another question
              </button>
            </>
          )}
          {quiz.status === 'right' && (
            <>
              <p className="troy-quiz-note q-note is-right">Correct. The hatch is open.</p>
              <button type="button" className="troy-quiz-close q-action" onClick={closeQuiz}>
                Close
              </button>
            </>
          )}
        </div>
      )}
      {fight && (
        <div
          className={`battle-screen${entering ? ' is-entering' : ''}${fight.gate ? ' is-gate' : ''}${fight.anim ? ` is-${fight.anim}` : ''}${fight.shake ? ' is-shake' : ''}`}
          role="dialog"
          aria-label="Battle"
        >
          <ol className="battle-order">
            <li className={fight.side === 'hero' && fight.phase !== 'enemy' ? 'is-now' : ''}>Odysseus</li>
            <li className={fight.side === 'enemy' || fight.phase === 'enemy' ? 'is-now' : ''}>{fight.name}</li>
          </ol>
          {/* Octopath-style opening: a flash and slanted shards that sweep
              away to reveal the fight (soldierBattle.css). Plays once. */}
          <div className="battle-backdrop" aria-hidden="true" />
          <div className="battle-intro" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} style={{ '--i': i }} />)}
          </div>
          <BattleLog key={`log-${fight.blow || 0}`} log={fight.log} note={fight.note} fresh={Boolean(fight.blow)} />
          <div className="battle-stage">
            <div className="battle-side">
              <p className="battle-name">Odysseus</p>
              <p className="battle-hp-num">{fmtHp(fight.heroHp)} / {fight.heroMax}</p>
              <div className="battle-hp-track">
                <span style={{ width: `${Math.max(0, fight.heroHp / fight.heroMax) * 100}%` }} />
              </div>
              <div className="battle-fighter" key={`hero-${fight.blow || 0}`}>
                <div className="battle-sprite battle-hero" />
                <span className="battle-slash" />
                <span className="battle-hurt" />
                {fight.float && fight.float.side === 'hero' && (
                  <b className={`battle-float${fight.float.miss ? ' is-miss' : ' is-hurt'}`}>{fight.float.text}</b>
                )}
              </div>
            </div>
            <div className="battle-side is-foe">
              <div className="battle-foes">
                {(fight.foes || []).map((foe, index) => {
                  const down = foe.hp <= 0;
                  const target = fight.foeIndex === index;
                  // Heavy Attack hits every Trojan, so all of them flinch.
                  const splash = fight.anim === 'heavy' && !down && !target;
                  return (
                    <div key={foe.id} className={`battle-member${down ? ' is-down' : ''}${target ? ' is-target' : ''}${splash ? ' is-splash' : ''}`}>
                      <p className="battle-name">{foe.name}</p>
                      <p className="battle-hp-num">{fmtHp(foe.hp)} / {foe.max}</p>
                      <div className="battle-hp-track">
                        <span style={{ width: `${Math.max(0, foe.hp / foe.max) * 100}%` }} />
                      </div>
                      <div className="battle-sprite battle-trojan" />
                      {fight.float && fight.float.side === 'foe' && target && (
                        <b className={`battle-float${fight.float.miss ? ' is-miss' : ''}`}>{fight.float.text}</b>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="battle-dock">
            {fight.phase === 'question' && fight.question && (
              <div className="battle-question q-card">
                <QuestionHeader eyebrow="Ω · Battle at Troy" title={fight.attack || 'Strike'} />
                {/* Above the fighters there is room for a drawing or for
                    sentence-length answers, not both. Those prompts say it all. */}
                {choicesClass(fight.question.choices) === 'q-choices' && (
                  <CircuitDiagram circuit={fight.question.circuit} />
                )}
                <p className="q-prompt">{fight.question.prompt}</p>
                <div className={`battle-choices ${choicesClass(fight.question.choices)}`}>
                  {fight.question.choices.map((choice, index) => (
                    <button key={choice} type="button" className="battle-choice q-choice" onClick={() => pickFight(index)}>
                      <ChoiceLabel index={index}>{choice}</ChoiceLabel>
                    </button>
                  ))}
                </div>
                <KeysHint count={fight.question.choices.length} />
              </div>
            )}
            {fight.phase === 'enemy' && (
              <button type="button" className="battle-continue q-action" onClick={enemyContinue}>
                Continue
              </button>
            )}
            {fight.phase === 'menu' && (
              <div className="battle-commands q-card q-menu">
                <p className="q-eyebrow">Ω · Your move</p>
                {MOVES.map((move, index) => (
                  <button key={move.id} type="button" className="battle-command q-command" onClick={() => attack(move.id)}>
                    <span className="q-command-key" aria-hidden="true">{index + 1}</span>
                    <span className="q-command-text">
                      <span className="q-command-label">{move.label}</span>
                      <small>{move.hint} question · {move.damage} damage{move.allEnemies ? ' to all enemies' : ''}</small>
                    </span>
                  </button>
                ))}
                <button type="button" className="battle-command q-command is-quiet" onClick={flee}>
                  <span className="q-command-key" aria-hidden="true">{MOVES.length + 1}</span>
                  <span className="q-command-text">
                    <span className="q-command-label">Flee</span>
                    <small>Leave the fight</small>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {gateAsk && (
        <div className="gate-ask" role="dialog" aria-label="The gate">
          <div className="battle-question q-card">
            <QuestionHeader eyebrow="Ω · The walls of Troy" title="The Gate" />
            <CircuitDiagram circuit={gateAsk.circuit} />
            <p className="q-prompt">{gateAsk.prompt || GATE_FALLBACK.prompt}</p>
            <div className={`battle-choices ${choicesClass(gateChoices)}`}>
              {gateChoices.map((choice, index) => (
                <button
                  key={choice}
                  type="button"
                  className="battle-choice q-choice"
                  disabled={gateAsk.wrong}
                  onClick={() => pickGate(index)}
                >
                  <ChoiceLabel index={index}>{choice}</ChoiceLabel>
                </button>
              ))}
            </div>
            {!gateAsk.wrong && <KeysHint count={gateChoices.length} />}
            {gateAsk.wrong && (
              <>
                <p className="battle-note q-note is-wrong">{gateAsk.hint} The gate stays shut.</p>
                <button type="button" className="battle-continue q-action" onClick={dismissGate}>
                  Again
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {gameOver && (
        <div className="game-over" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
          <div className="game-over-card q-card">
            <p className="q-eyebrow">Ω · Troy</p>
            <h2 id="game-over-title" className="game-over-title">Odysseus has Fallen</h2>
            <div className="q-rule" aria-hidden="true" />
            <div className="game-over-actions">
              {/* Back to the sign-in screen, like Home in the Esc menu. */}
              <button type="button" className="q-action game-over-btn is-quiet" onClick={() => onHome?.()}>
                Return to Menu
              </button>
              {/* Start Level 1 over from the beginning. */}
              <button type="button" className="q-action game-over-btn" onClick={() => onRestart?.()} autoFocus>
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
      {complete && (
        <div className="level-complete" role="dialog" aria-label="Level 1 complete">
          <div className="card level-complete-card">
            <p className="eyebrow">Level 1</p>
            <h2>Complete</h2>
            <p>The ship leaves Troy. Choose the next shore.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// "Defeat the Trojan warriors! (2/3)" -> "Defeat the Trojan warriors!".
function stageOf(title) {
  return String(title || '').replace(/\s*\(.*\)\s*$/, '');
}

function fmtHp(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
