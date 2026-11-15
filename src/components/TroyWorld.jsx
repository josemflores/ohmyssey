import { useEffect, useRef, useState } from 'react';
import { ATTACKS } from '../game/battleQuestions.js';
import { createTroyGame } from '../game/createTroyGame.js';
import { hatchQuestionAfter } from '../game/hatchQuestions.js';
import './TroyWorld.css';

const MOVES = [ATTACKS.light, ATTACKS.strike, ATTACKS.heavy];

const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

// Mounts the Phaser city. The hint fades after a few seconds, or on the first step.
// A spot in the city can also open a small box. That box is a placeholder until
// the real puzzle and encounter screens plug in.
export default function TroyWorld() {
  const host = useRef(null);
  const gameRef = useRef(null);
  const [hint, setHint] = useState(true);
  const [talk, setTalk] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [fight, setFight] = useState(null);
  const [questDone, setQuestDone] = useState(false);
  const [complete, setComplete] = useState(false);
  const [runHint, setRunHint] = useState(false);
  const [banner, setBanner] = useState('');
  const [place, setPlace] = useState('horse');
  const fightRef = useRef(null);
  fightRef.current = fight;

  useEffect(() => {
    const parent = host.current;
    const game = createTroyGame(parent);
    gameRef.current = game;

    // The scene found a spot and the player pressed E.
    function onInteract(spot) {
      setTalk(spot);
      game.events.emit('lockInput');
    }
    // He pressed E again while the box was open.
    function onCloseRequest() {
      setTalk(null);
      if (fightRef.current) return;
      game.events.emit('unlockInput');
    }
    function onFightStart(payload) {
      setFight({ ...payload, phase: 'menu', note: '' });
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
        const showFloat = payload.anim !== 'defeat';
        return {
          ...current,
          heroHp: payload.heroHp,
          foeHp: payload.foeHp,
          phase: 'anim',
          question: null,
          anim: payload.anim,
          shake: payload.anim === 'heavy' || payload.anim === 'counter',
          blow: (current.blow || 0) + 1,
          note: payload.note || '',
          float: showFloat ? {
            text: miss ? 'Miss' : `-${payload.damage}`,
            side: onHero ? 'hero' : 'foe',
            miss,
          } : null,
        };
      });
    }
    function onFightTurn(payload) {
      setFight((current) => current && {
        ...current,
        ...payload,
        phase: payload.side === 'enemy' ? 'enemy' : 'menu',
        question: null,
        anim: '',
        shake: false,
        float: null,
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
      game.events.off('runHint');
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
    if (!talk && !quiz) return undefined;
    function onKey(event) {
      if (event.code !== 'Escape') return;
      if (talk) closeTalk();
      else if (quiz.status === 'right' || quiz.status === 'open') closeQuiz();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [talk, quiz]);

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
      {place !== 'horse' && (
        <p className={questDone ? 'troy-quest is-done' : 'troy-quest'}>
          <span>Quest</span>
          {questDone ? 'The army is inside' : 'Open the gate'}
        </p>
      )}
      {place !== 'horse' && !questDone && !fight && !talk && (
        <div className="troy-objective" role="status">
          <p className="troy-objective-kicker">Objective</p>
          <p className="troy-objective-title">Open the gate</p>
          <p className="troy-objective-note">Follow the arrow. Press E at the doors.</p>
        </div>
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
        <div className="troy-talk troy-quiz" role="dialog" aria-label="Hatch question">
          <p className="troy-talk-id">The hatch</p>
          <p className="troy-talk-line">{quiz.question.prompt}</p>
          <div className="troy-quiz-choices">
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
                  className={`troy-quiz-choice${mark}`}
                  data-correct={correct ? '1' : '0'}
                  disabled={quiz.status !== 'open'}
                  onClick={() => pickAnswer(index)}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {quiz.status === 'wrong' && (
            <>
              <p className="troy-quiz-note">{quiz.question.hint} The hatch stays shut until an answer is right.</p>
              <button type="button" className="btn btn-quiet troy-quiz-next" onClick={anotherQuestion}>
                Another question
              </button>
            </>
          )}
          {quiz.status === 'right' && (
            <>
              <p className="troy-quiz-note">Correct. The hatch is open.</p>
              <button type="button" className="btn btn-quiet troy-quiz-close" onClick={closeQuiz}>
                Close
              </button>
            </>
          )}
        </div>
      )}
      {fight && (
        <div
          className={`battle-screen${fight.anim ? ` is-${fight.anim}` : ''}${fight.shake ? ' is-shake' : ''}`}
          role="dialog"
          aria-label="Battle"
        >
          <ol className="battle-order">
            <li className={fight.side === 'hero' && fight.phase !== 'enemy' ? 'is-now' : ''}>Odysseus</li>
            <li className={fight.side === 'enemy' || fight.phase === 'enemy' ? 'is-now' : ''}>{fight.name}</li>
          </ol>
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
              <p className="battle-name">{fight.name}</p>
              <p className="battle-hp-num">{fmtHp(fight.foeHp)} / {fight.foeMax}</p>
              <div className="battle-hp-track">
                <span style={{ width: `${Math.max(0, fight.foeHp / fight.foeMax) * 100}%` }} />
              </div>
              <div className="battle-fighter" key={`foe-${fight.blow || 0}`}>
                <div className={`battle-sprite battle-foe${fight.anim === 'defeat' ? ' is-down' : ''}`} />
                <span className="battle-flash" />
                {fight.float && fight.float.side === 'foe' && (
                  <b className={`battle-float${fight.float.miss ? ' is-miss' : ''}`}>{fight.float.text}</b>
                )}
              </div>
            </div>
          </div>
          <div className="battle-dock">
            {fight.note && <p className="battle-note">{fight.note}</p>}
            {fight.phase === 'question' && fight.question && (
              <div className="battle-question">
                {fight.attack && <p className="battle-ask">{fight.attack}</p>}
                <p>{fight.question.prompt}</p>
                <div className="battle-choices">
                  {fight.question.choices.map((choice, index) => (
                    <button key={choice} type="button" className="battle-choice" onClick={() => pickFight(index)}>
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {fight.phase === 'enemy' && (
              <button type="button" className="battle-continue" onClick={enemyContinue}>
                Continue
              </button>
            )}
            {fight.phase === 'menu' && (
              <div className="battle-commands">
                {MOVES.map((move) => (
                  <button key={move.id} type="button" className="battle-command" onClick={() => attack(move.id)}>
                    <span>{move.label}</span>
                    <small>{move.hint}</small>
                  </button>
                ))}
                <button type="button" className="battle-command" onClick={flee}>
                  <span>Flee</span>
                  <small>Leave the fight</small>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {complete && (
        <div className="level-complete" role="dialog" aria-label="Level 1 complete">
          <div className="card level-complete-card">
            <p className="eyebrow">Level 1</p>
            <h2>Complete</h2>
            <p>The gate has fallen. The sentries are down, and the Greek army is through.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function fmtHp(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
