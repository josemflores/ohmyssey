import { useEffect, useRef, useState } from 'react';
import { createLevel2Game } from '../game/level2/createLevel2Game.js';
import { clearActiveGame, setActiveGame } from '../lib/activeGame.js';
import { firstHallQuestion, hallQuestionAfter } from '../game/level2/hallQuestions.js';
import BowContest from './BowContest.jsx';
import CircuitDiagram from './CircuitDiagram.jsx';
import Credits from './Credits.jsx';
import Reunion from './Reunion.jsx';
import HallBattle from './HallBattle.jsx';
import {
  ChoiceLabel,
  KeysHint,
  QuestionHeader,
  choicesClass,
  useChoiceKeys,
} from './QuestionCard.jsx';
import './Level2World.css';

// Level 2: Ithaca at night. Phaser draws the island and moves Odysseus;
// this component shows the place name, the controls hint, and the short
// lines when he presses E at a landmark.
// onHome (from App) goes back to the title once the credits have rolled.
export default function Level2World({ onHome }) {
  const host = useRef(null);
  const gameRef = useRef(null);
  const [hint, setHint] = useState(true);
  const [near, setNear] = useState(null);
  const [talk, setTalk] = useState(null);
  const [objective, setObjective] = useState(null);
  // The question at the hall doors. status: open, wrong.
  const [quiz, setQuiz] = useState(null);
  // The story scenes: contest, battle and won (the hall), then reunion and
  // credits (the end of the game).
  const [story, setStory] = useState(null);

  useEffect(() => {
    const game = createLevel2Game(host.current);
    gameRef.current = game;
    setActiveGame(game);
    const onNear = (spot) => setNear(spot || null);
    const onTalk = (line) => setTalk(line);
    const onObjective = (next) => setObjective(next);
    const onHallDoor = () => setQuiz({ question: firstHallQuestion(), picked: null, status: 'open' });
    game.events.on('near', onNear);
    game.events.on('talk', onTalk);
    game.events.on('objective', onObjective);
    game.events.on('hallDoor', onHallDoor);
    const onBowFound = () => setStory('contest');
    game.events.on('bowFound', onBowFound);
    const onReunion = () => setStory('reunion');
    game.events.on('reunion', onReunion);
    // Testing shortcut: ?level2&skip=contest|battle|won opens that part of
    // the hall story as soon as the scene has jumped into the hall
    // (Level2Scene skipToHall). skip=hall just stands you in the hall.
    const skip = new URLSearchParams(window.location.search).get('skip');
    const onReady = () => {
      if (!['contest', 'battle', 'won'].includes(skip)) return;
      if (skip === 'won') {
        setStory('won');
        game.events.emit('suitorsFall');
      } else {
        setStory(skip);
      }
    };
    game.events.once('skipInHall', onReady);
    const timer = window.setTimeout(() => setHint(false), 5200);
    return () => {
      window.clearTimeout(timer);
      game.events.off('near', onNear);
      game.events.off('talk', onTalk);
      game.events.off('objective', onObjective);
      game.events.off('hallDoor', onHallDoor);
      game.events.off('bowFound', onBowFound);
      game.events.off('reunion', onReunion);
      game.events.off('skipInHall', onReady);
      clearActiveGame(game);
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!talk) return undefined;
    function onKey(event) {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        closeTalk();
      }
    }
    // Wait a beat so the E that opened the box does not also close it.
    const timer = window.setTimeout(() => window.addEventListener('keydown', onKey), 150);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [talk]);

  function pickAnswer(index) {
    if (!quiz || quiz.status !== 'open') return;
    if (index === quiz.question.answer) {
      // Right: the doors open and he walks into the hall.
      setQuiz(null);
      gameRef.current?.events.emit('hallOpen');
      return;
    }
    setQuiz({ ...quiz, picked: index, status: 'wrong' });
  }

  function anotherQuestion() {
    if (!quiz) return;
    setQuiz({ question: hallQuestionAfter(quiz.question.id), picked: null, status: 'open' });
  }

  function closeQuiz() {
    setQuiz(null);
    gameRef.current?.events.emit('unlockInput');
  }

  useChoiceKeys(Boolean(quiz && quiz.status === 'open'), quiz?.question.choices.length || 4, pickAnswer);

  useEffect(() => {
    if (!quiz) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeQuiz();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [quiz]);

  // While the contest, the fight or the victory card is up, the Athena and
  // Lessons buttons step aside, as they do in a fight at Troy (TroyLearn).
  const storyOn = Boolean(story);
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return undefined;
    if (!storyOn) return undefined;
    game.events.emit('fightStart', {});
    return () => game.events.emit('fightEnd', {});
  }, [storyOn]);

  // The last suitor falls: a proclamation, then the hall is his again.
  function hallWon() {
    setStory('won');
    // The bodies are on the floor behind the victory card right away.
    gameRef.current?.events.emit('suitorsFall');
  }

  useEffect(() => {
    if (story !== 'won') return undefined;
    const timer = window.setTimeout(() => {
      setStory(null);
      gameRef.current?.events.emit('hallWon');
      setObjective({
        title: 'Go to Penelope',
        note: 'The hall is yours again. She waits in the courtyard, not yet sure it is you.',
      });
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [story]);

  function closeTalk() {
    setTalk(null);
    gameRef.current?.events.emit('unlockInput');
  }

  // When he walks away from a landmark the pill fades out. Keep showing that
  // landmark's "Press E" text while it fades; switching to the controls
  // text here made "Hold Shift to run" flash up after every Press E prompt.
  const lastNear = useRef(null);
  if (near) lastNear.current = near;
  const controls = 'WASD to move. Hold Shift to run. Press E near a landmark.';
  let prompt = controls;
  if (near) prompt = `Press E: ${near.who}`;
  else if (!hint && lastNear.current) prompt = `Press E: ${lastNear.current.who}`;

  return (
    <div className="l2" data-screen="level2">
      <p className="l2-sr" role="status">Ithaca at night. You wake on the beach. WASD to move.</p>
      <div ref={host} className="l2-host" />
      <h1 className="l2-plaque">
        Ithaca
        <span>home, at night</span>
      </h1>
      {objective && (
        <div className="l2-objective" role="status">
          <p className="l2-objective-kicker">Objective</p>
          <p className="l2-objective-title">{objective.title}</p>
          {objective.note && <p className="l2-objective-note">{objective.note}</p>}
        </div>
      )}
      {quiz && (
        <div className="l2-quiz-shade">
          <div className="q-card l2-quiz" role="dialog" aria-label="The hall doors">
            <QuestionHeader eyebrow="Ω · The palace of Odysseus" title="The Hall" />
            <CircuitDiagram circuit={quiz.question.circuit} />
            <p className="q-prompt">{quiz.question.prompt}</p>
            <div className={choicesClass(quiz.question.choices)}>
              {quiz.question.choices.map((choice, index) => {
                const shown = quiz.status !== 'open';
                const correct = index === quiz.question.answer;
                let mark = '';
                if (shown && correct) mark = ' is-right';
                else if (shown && index === quiz.picked) mark = ' is-wrong';
                return (
                  <button
                    key={choice}
                    type="button"
                    className={`q-choice${mark}`}
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
                <p className="q-note is-wrong">{quiz.question.hint} The doors stay shut.</p>
                <button type="button" className="q-action" onClick={anotherQuestion}>Another question</button>
              </>
            )}
            <button type="button" className="l2-quiz-leave" onClick={closeQuiz}>Step back (Esc)</button>
          </div>
        </div>
      )}
      {story === 'contest' && <BowContest onDone={() => setStory('battle')} />}
      {story === 'battle' && <HallBattle onWon={hallWon} />}
      {story === 'reunion' && <Reunion onDone={() => setStory('credits')} />}
      {story === 'credits' && <Credits onHome={onHome} />}
      {story === 'won' && (
        <div className="l2-victory" role="status" aria-live="polite">
          <div className="q-card l2-victory-card">
            <p className="q-eyebrow">Ω · Victory</p>
            <h2 className="q-title">The hall is won</h2>
            <div className="q-rule" aria-hidden="true" />
            <p className="l2-victory-line">The suitors are beaten. After twenty years, Odysseus stands in his own hall again.</p>
          </div>
        </div>
      )}
      {talk ? (
        <div className="l2-talk" role="dialog" aria-labelledby="l2-talk-who">
          <p id="l2-talk-who" className="l2-talk-who">{talk.who}</p>
          <p className="l2-talk-line">{talk.line}</p>
          <button className="btn btn-quiet" type="button" onClick={closeTalk}>Press on</button>
        </div>
      ) : (
        <p className={hint || near ? 'l2-hint' : 'l2-hint is-hidden'}>{prompt}</p>
      )}
    </div>
  );
}
