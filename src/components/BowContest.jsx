import { useEffect, useRef, useState } from 'react';
import { makeHallDeck } from '../game/level2/hallQuestions.js';
import CircuitDiagram from './CircuitDiagram.jsx';
import ScenePic, { preloadScenes } from './ScenePic.jsx';
import {
  ChoiceLabel,
  KeysHint,
  QuestionHeader,
  choicesClass,
  useChoiceKeys,
} from './QuestionCard.jsx';
import './BowContest.css';

// The contest of the bow (Odyssey 21). Penelope brings out the great bow,
// the suitors try and fail (a short cutscene of pixel pictures), then the
// beggar takes his turn: three right answers in a row send the arrow through
// all twelve axes. Then he turns on the suitors, and onDone starts the fight.
//
// Pictures: public/assets/contest/, from art/scripts/build_hall_contest.py.
// Each one is a short animation, played by ScenePic.jsx.

const pic = (name) => `/assets/contest/${name}.png`;

export const SCENES = [
  {
    img: 'bow_brought',
    who: 'Penelope',
    line: 'Hear me, suitors. Here is the great bow of Odysseus.',
  },
  {
    img: 'bow_brought',
    who: 'Penelope',
    line: 'Whoever strings it and shoots an arrow through all twelve axes, I will marry him and leave this house.',
  },
  {
    img: 'axes',
    line: 'Telemachus sets the twelve axes in a line, their rings in a row.',
  },
  {
    img: 'suitors_fail',
    line: 'One by one the suitors try. Not one of them can even bend the bow.',
  },
  {
    img: 'hearth',
    line: 'Antinous warms it at the fire and rubs it with tallow. Still it will not bend.',
  },
  {
    img: 'beggar',
    who: 'The beggar',
    line: 'Let me try my hands at it, friends. The suitors jeer, but Penelope lets him take the bow.',
  },
  {
    img: 'string',
    line: 'He strings it as easily as a singer strings a lyre. Now the shot: answer three questions in a row.',
  },
];

const SHOTS_NEEDED = 3;
const AUTO_MS = 6000;

export default function BowContest({ onDone }) {
  const deck = useRef(null);
  if (!deck.current) deck.current = makeHallDeck();
  // stage: scenes, shoot, through, turn
  const [stage, setStage] = useState('scenes');
  const [scene, setScene] = useState(0);
  const [streak, setStreak] = useState(0);
  const [ask, setAsk] = useState(null);

  useEffect(() => {
    preloadScenes([...SCENES.map((s) => s.img), 'shot', 'turn']);
  }, []);

  function nextScene() {
    if (scene + 1 < SCENES.length) setScene(scene + 1);
    else startShooting();
  }

  function startShooting() {
    setStage('shoot');
    setStreak(0);
    setAsk({ question: deck.current.draw(), picked: null, status: 'open' });
  }

  function pick(index) {
    if (!ask || ask.status !== 'open') return;
    if (index !== ask.question.answer) {
      setAsk({ ...ask, picked: index, status: 'wrong' });
      return;
    }
    const made = streak + 1;
    setStreak(made);
    setAsk({ ...ask, picked: index, status: 'right' });
    if (made >= SHOTS_NEEDED) {
      setTimeout(() => setStage('through'), 650);
    } else {
      setTimeout(() => setAsk({ question: deck.current.draw(), picked: null, status: 'open' }), 650);
    }
  }

  function drawAgain() {
    setStreak(0);
    setAsk({ question: deck.current.draw(), picked: null, status: 'open' });
  }

  // The cutscene moves on by itself, or on Enter / Space / click.
  useEffect(() => {
    if (stage !== 'scenes' && stage !== 'turn') return undefined;
    const advance = stage === 'scenes' ? nextScene : () => onDone?.();
    const timer = stage === 'scenes' ? setTimeout(advance, AUTO_MS) : null;
    function onKey(event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        advance();
      }
    }
    // A beat first, so the E that found the bow does not skip a picture.
    const listen = setTimeout(() => window.addEventListener('keydown', onKey), 200);
    return () => {
      clearTimeout(timer);
      clearTimeout(listen);
      window.removeEventListener('keydown', onKey);
    };
  });

  // The arrow flies, then the suitors see who he is.
  useEffect(() => {
    if (stage !== 'through') return undefined;
    const timer = setTimeout(() => setStage('turn'), 3000);
    return () => clearTimeout(timer);
  }, [stage]);

  useChoiceKeys(stage === 'shoot' && ask?.status === 'open', ask?.question.choices.length || 4, pick);

  if (stage === 'scenes' || stage === 'turn') {
    const shot = stage === 'turn'
      ? {
        img: 'turn',
        who: 'Odysseus',
        line: 'He throws off his rags and leaps to the doorway. "That contest is done. Now for another mark!" The suitors grab for their swords.',
      }
      : SCENES[scene];
    return (
      <div className="l2-contest" role="dialog" aria-label="The contest of the bow" data-stage={stage}>
        <figure className="l2-contest-frame" key={`${stage}-${scene}`}>
          <ScenePic
            name={shot.img}
            settled={stage === 'scenes' && scene > 0 && SCENES[scene - 1].img === shot.img}
          />
          <figcaption className="l2-contest-caption">
            {shot.who && <span className="l2-contest-who">{shot.who}</span>}
            <span className="l2-contest-line">{shot.line}</span>
          </figcaption>
        </figure>
        <div className="l2-contest-bar">
          {stage === 'scenes' && (
            <p className="l2-contest-dots" aria-hidden="true">
              {SCENES.map((s, i) => <i key={i} className={i === scene ? 'is-now' : ''} />)}
            </p>
          )}
          {stage === 'scenes' && (
            <button type="button" className="q-action is-quiet l2-contest-skip" onClick={startShooting}>Skip</button>
          )}
          <button
            type="button"
            className="q-action l2-contest-next"
            onClick={stage === 'scenes' ? nextScene : () => onDone?.()}
          >
            {stage === 'turn' ? 'Fight' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'through') {
    return (
      <div className="l2-contest is-through" role="dialog" aria-label="The shot" data-stage={stage}>
        <figure className="l2-contest-frame">
          <div className="l2-contest-shot">
            <ScenePic name="shot" />
            <span className="l2-contest-arrow" aria-hidden="true" />
          </div>
          <figcaption className="l2-contest-caption">
            <span className="l2-contest-line">Through all twelve axes!</span>
          </figcaption>
        </figure>
      </div>
    );
  }

  const { question } = ask;
  return (
    <div className="l2-contest is-shoot" role="dialog" aria-label="Your shot" data-stage={stage}>
      <img className="l2-contest-bg" src={pic('shot')} alt="" />
      <div className="q-card l2-contest-card">
        <QuestionHeader eyebrow="Ω · The contest of the bow" title={`Shot ${Math.min(streak + 1, SHOTS_NEEDED)} of ${SHOTS_NEEDED}`} />
        <p className="l2-contest-pips" aria-label={`${streak} of ${SHOTS_NEEDED} right in a row`}>
          {Array.from({ length: SHOTS_NEEDED }, (_, i) => <i key={i} className={i < streak ? 'is-made' : ''} />)}
        </p>
        <CircuitDiagram circuit={question.circuit} />
        <p className="q-prompt">{question.prompt}</p>
        <div className={choicesClass(question.choices)}>
          {question.choices.map((choice, index) => {
            const shown = ask.status !== 'open';
            const correct = index === question.answer;
            let mark = '';
            if (shown && correct) mark = ' is-right';
            else if (shown && index === ask.picked) mark = ' is-wrong';
            return (
              <button
                key={choice}
                type="button"
                className={`q-choice${mark}`}
                data-correct={correct ? '1' : '0'}
                disabled={ask.status !== 'open'}
                onClick={() => pick(index)}
              >
                <ChoiceLabel index={index}>{choice}</ChoiceLabel>
              </button>
            );
          })}
        </div>
        {ask.status === 'open' && <KeysHint count={question.choices.length} />}
        {ask.status === 'right' && <p className="q-note is-right">Right! The arrow is on the string.</p>}
        {ask.status === 'wrong' && (
          <>
            <p className="q-note is-wrong">
              {question.hint} The arrow glances off an axe. Start again: three in a row.
            </p>
            <button type="button" className="q-action" onClick={drawAgain} autoFocus>Draw again</button>
          </>
        )}
      </div>
    </div>
  );
}
