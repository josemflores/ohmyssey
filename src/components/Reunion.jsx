import { useEffect, useState } from 'react';
import { ChoiceLabel, KeysHint, QuestionHeader, choicesClass, useChoiceKeys } from './QuestionCard.jsx';
import ScenePic, { preloadScenes } from './ScenePic.jsx';
import './BowContest.css';

// The end of the story (Odyssey 23). Penelope tests the stranger with their
// bed; the player answers as Odysseus would. Then they are together, Athena
// holds back the dawn, and onDone rolls the credits.
// Pictures: public/assets/contest/, from art/scripts/build_ending.py, each a
// short animation played by ScenePic.jsx.

const pic = (name) => `/assets/contest/${name}.png`;

const BEFORE = [
  {
    img: 'chamber',
    line: 'Penelope comes down from her room and sits across from him by the fire. For a long time she says nothing.',
  },
  {
    img: 'chamber',
    who: 'Telemachus',
    line: 'Mother, how can you be so cold? Here is your husband, home after twenty years!',
  },
  {
    img: 'chamber',
    who: 'Penelope',
    line: 'If he is truly Odysseus, there are signs that only the two of us know.',
  },
  {
    img: 'chamber',
    who: 'Penelope',
    line: 'Eurycleia, move the great bed out of our chamber and make it up for him outside.',
  },
];

// The bed test. Only Odysseus knows how the bed was made.
const TEST = {
  prompt: 'Penelope watches him closely. How does Odysseus answer?',
  choices: [
    'Who moved my bed? I built it myself around the trunk of a living olive tree. No one could move it.',
    'Thank you. Any bed will do for a tired traveller.',
    'Then I will carry it out myself. I am strong enough.',
    'Leave the bed. I will sleep in the hall by the fire.',
  ],
  answer: 0,
};

const AFTER = [
  {
    img: 'embrace',
    line: 'Her knees give way. She runs to him, throws her arms around his neck and kisses him.',
  },
  {
    img: 'embrace',
    who: 'Penelope',
    line: 'Do not be angry with me. I was afraid a stranger would trick me. Now you have told me the secret of our bed.',
  },
  {
    img: 'dawn',
    line: 'Athena holds back the dawn at the edge of the sea, so that their night lasts long.',
  },
  {
    img: 'dawn',
    line: 'After twenty years of war and wandering, Odysseus is home.',
    end: true,
  },
];

const AUTO_MS = 6500;

export default function Reunion({ onDone }) {
  // stage: before, test, after
  const [stage, setStage] = useState('before');
  const [index, setIndex] = useState(0);
  const [order] = useState(() => shuffledOrder(TEST.choices.length));
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    preloadScenes(['chamber', 'embrace', 'dawn']);
  }, []);

  const list = stage === 'after' ? AFTER : BEFORE;
  const shot = list[index];

  function next() {
    if (index + 1 < list.length) {
      setIndex(index + 1);
      return;
    }
    if (stage === 'before') {
      setStage('test');
      setIndex(0);
      return;
    }
    onDone?.();
  }

  function pick(shown) {
    const real = order[shown];
    if (real === TEST.answer) {
      setStage('after');
      setIndex(0);
      setPicked(null);
      return;
    }
    setPicked(shown);
  }

  useEffect(() => {
    if (stage === 'test') return undefined;
    // The last picture waits for the player.
    const timer = shot.end ? null : setTimeout(next, AUTO_MS);
    function onKey(event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        next();
      }
    }
    const listen = setTimeout(() => window.addEventListener('keydown', onKey), 200);
    return () => {
      clearTimeout(timer);
      clearTimeout(listen);
      window.removeEventListener('keydown', onKey);
    };
  });

  useChoiceKeys(stage === 'test', TEST.choices.length, pick);

  if (stage === 'test') {
    const choices = order.map((i) => TEST.choices[i]);
    return (
      <div className="l2-contest is-shoot" role="dialog" aria-label="Penelope's test" data-stage="test">
        <img className="l2-contest-bg" src={pic('chamber')} alt="" />
        <div className="q-card l2-contest-card">
          <QuestionHeader eyebrow="Ω · The secret of the bed" title="Penelope's Test" />
          <p className="q-prompt">{TEST.prompt}</p>
          <div className={choicesClass(choices)}>
            {choices.map((choice, i) => (
              <button
                key={choice}
                type="button"
                className={`q-choice${picked === i ? ' is-wrong' : ''}`}
                data-correct={order[i] === TEST.answer ? '1' : '0'}
                onClick={() => pick(i)}
              >
                <ChoiceLabel index={i}>{choice}</ChoiceLabel>
              </button>
            ))}
          </div>
          {picked === null ? (
            <KeysHint count={choices.length} />
          ) : (
            <p className="q-note is-wrong">
              Her eyes stay cold. That is not something only Odysseus would know. Think of the bed he built.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="l2-contest" role="dialog" aria-label="Penelope" data-stage={stage}>
      <figure className="l2-contest-frame" key={`${stage}-${index}`}>
        <ScenePic name={shot.img} settled={index > 0 && list[index - 1].img === shot.img} />
        <figcaption className="l2-contest-caption">
          {shot.who && <span className="l2-contest-who">{shot.who}</span>}
          <span className="l2-contest-line">{shot.line}</span>
        </figcaption>
      </figure>
      <div className="l2-contest-bar">
        <p className="l2-contest-dots" aria-hidden="true">
          {list.map((s, i) => <i key={i} className={i === index ? 'is-now' : ''} />)}
        </p>
        <button type="button" className="q-action l2-contest-next" onClick={next}>
          {shot.end ? 'The End' : 'Next'}
        </button>
      </div>
    </div>
  );
}

function shuffledOrder(n) {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
