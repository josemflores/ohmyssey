import { useEffect, useRef, useState } from 'react';
import { createTroyGame } from '../game/createTroyGame.js';
import { hatchQuestionAfter } from '../game/hatchQuestions.js';
import './TroyWorld.css';

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
  const [place, setPlace] = useState('horse');

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
      game.events.emit('unlockInput');
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
    return () => {
      game.events.off('interact', onInteract);
      game.events.off('closeInteract', onCloseRequest);
      game.events.off('place', setPlace);
      game.events.off('hatchQuestion', onHatchQuestion);
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
    if (right) gameRef.current?.events.emit('unlockHatch');
    setQuiz({ ...quiz, picked: index, status: right ? 'right' : 'wrong' });
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
    if (!talk && !quiz) return undefined;
    function onKey(event) {
      if (event.code !== 'Escape') return;
      if (talk) closeTalk();
      else if (quiz.status === 'right' || quiz.status === 'open') closeQuiz();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [talk, quiz]);

  return (
    <div className="troy" data-screen="world">
      <div ref={host} className="troy-host" />
      <h1 className="troy-plaque">
        {place === 'horse' ? 'The horse' : 'Troy'}
        <span>{place === 'horse' ? 'inside' : 'at night'}</span>
      </h1>
      <p className={hint ? 'troy-hint' : 'troy-hint is-hidden'}>WASD to move</p>
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
              <p className="troy-quiz-note">That answer is marked. One more question opens the hatch.</p>
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
    </div>
  );
}
