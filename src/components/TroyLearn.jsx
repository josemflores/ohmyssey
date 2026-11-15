/**
 * Ask Athena and the two lessons in the current demo scope, on top of Troy.
 *
 * Level 1 is Leaving Troy. Level 2, for this voyage, is the lighthouse at
 * Ithaca (study island 6). The Cyclops cave and the middle islands stay in
 * the level pack and are not on this menu.
 *
 * A Phaser scene can open either panel without importing React:
 *   window.dispatchEvent(new CustomEvent('ohmyssey:athena'))
 *   window.dispatchEvent(new CustomEvent('ohmyssey:lessons'))
 * Same idea as the encounter bus. This file listens. It does not edit the city.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadLevelData } from '../learn/loadLevels.js';
import { loadLearnProgress, recordWin } from '../learn/storage.js';
import AthenaChat from './AthenaChat.jsx';
import LearnLevel from './learn/LearnLevel.jsx';
import './TroyLearn.css';

export const ATHENA_EVENT = 'ohmyssey:athena';
export const LESSONS_EVENT = 'ohmyssey:lessons';

// Study-pack ids. Ithaca is island 6 in the pack; the demo calls it level 2.
const MENU = [
  { id: 1, scope: 'Level 1 · Troy', kicker: 'Level 1 · Troy' },
  { id: 6, scope: 'Level 2 · Ithaca', kicker: 'Level 2 · Ithaca' },
];

const FALLBACK = {
  id: 1,
  title: 'Leaving Troy',
  place: 'The beach at Troy',
  concept: 'Current flows only in a closed loop.',
  goal: 'Close the loop so the lamp can light.',
  athenaNote: 'Do not name the winning parts. A gap or an open switch means zero current.',
  greeting: 'Ask about the lamp or the loop. I will point at the idea, not the part.',
  hints: [
    'Current only moves in a closed loop. A gap or an open switch means 0 mA.',
    'A red LED keeps about 2 V. The resistor gets the rest, and I = V / R.',
  ],
  puzzle: { kind: 'closed-loop' },
};

export default function TroyLearn() {
  const [pack, setPack] = useState(null);
  const [progress, setProgress] = useState(() => loadLearnProgress());
  const [mode, setMode] = useState('closed');
  const [lessonId, setLessonId] = useState(null);
  const [topicId, setTopicId] = useState(1);
  const [fighting, setFighting] = useState(false);
  const openRef = useRef(false);
  const fightingRef = useRef(false);
  openRef.current = mode !== 'closed';
  fightingRef.current = fighting;

  useEffect(() => {
    let cancel = false;
    loadLevelData().then((loaded) => {
      if (!cancel) setPack(loaded.levels || []);
    });
    return () => {
      cancel = true;
    };
  }, []);

  const onWin = useCallback((level) => {
    setProgress((prev) => recordWin(prev, level));
  }, []);

  function levelById(id) {
    return pack?.find((item) => item.id === id) || (id === 1 ? FALLBACK : null);
  }

  function openAthena() {
    if (fightingRef.current || document.querySelector('.battle-screen, .level-complete')) return;
    setLessonId(null);
    setMode('athena');
  }

  function openLessons() {
    if (fightingRef.current || document.querySelector('.battle-screen, .level-complete')) return;
    setLessonId(null);
    setMode('lessons');
  }

  function closeAll() {
    setLessonId(null);
    setMode('closed');
  }

  useEffect(() => {
    function onAthena() { openAthena(); }
    function onLessons() { openLessons(); }
    function onKey(event) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      // Esc closes the panel even while the cursor is in the question box.
      if (event.code === 'Escape' && openRef.current) {
        event.preventDefault();
        if (lessonId) setLessonId(null);
        else closeAll();
        return;
      }
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;
      if (document.querySelector('.battle-screen, .level-complete, .troy-quiz, .troy-talk')) return;
      if (event.code === 'KeyH') {
        event.preventDefault();
        if (mode === 'athena' && !lessonId) closeAll();
        else openAthena();
      } else if (event.code === 'KeyL') {
        event.preventDefault();
        if ((mode === 'lessons' || lessonId) && mode !== 'athena') {
          if (lessonId) setLessonId(null);
          else closeAll();
        } else openLessons();
      }
    }
    window.addEventListener(ATHENA_EVENT, onAthena);
    window.addEventListener(LESSONS_EVENT, onLessons);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(ATHENA_EVENT, onAthena);
      window.removeEventListener(LESSONS_EVENT, onLessons);
      window.removeEventListener('keydown', onKey);
    };
  }, [mode, lessonId]);

  useEffect(() => {
    let stop = false;
    let game = null;
    let tries = 0;
    function onFight() {
      fightingRef.current = true;
      setFighting(true);
      setLessonId(null);
      setMode('closed');
    }
    function onFightEnd() {
      fightingRef.current = false;
      setFighting(false);
    }
    function attach() {
      if (stop || game) return;
      const scene = liveScene();
      if (!scene?.game) {
        if (tries++ < 40) window.setTimeout(attach, 120);
        return;
      }
      game = scene.game;
      game.events.on('fightStart', onFight);
      game.events.on('fightEnd', onFightEnd);
      game.events.on('levelComplete', onFight);
    }
    attach();
    return () => {
      stop = true;
      if (!game) return;
      game.events.off('fightStart', onFight);
      game.events.off('fightEnd', onFightEnd);
      game.events.off('levelComplete', onFight);
    };
  }, []);

  useEffect(() => {
    if (mode === 'closed') return undefined;
    let stop = false;
    let detach = () => {};
    let tries = 0;
    function attach() {
      if (stop) return;
      const scene = liveScene();
      if (!scene?.game) {
        if (tries++ < 40) window.setTimeout(attach, 120);
        return;
      }
      holdStill(scene, true);
      function relock() {
        if (openRef.current) holdStill(scene, true);
      }
      scene.game.events.on('closeInteract', relock);
      detach = () => {
        scene.game.events.off('closeInteract', relock);
        // A fight or the gate cinematic already owns the lock. Do not clear it.
        if (scene.fighting || scene.gateFalling) {
          captureKeys(scene, true);
          return;
        }
        holdStill(scene, false);
      };
    }
    attach();
    return () => {
      stop = true;
      detach();
    };
  }, [mode]);

  const topic = levelById(topicId) || FALLBACK;
  const lesson = lessonId ? levelById(lessonId) : null;
  const lessonMeta = MENU.find((item) => item.id === lessonId);

  return (
    <div className="troy-learn" data-screen="troy-learn">
      {mode === 'closed' && !fighting && (
        <div className="troy-learn-hud">
          <button type="button" className="troy-learn-btn" onClick={openAthena}>
            Ask Athena
            <kbd>H</kbd>
          </button>
          <button type="button" className="troy-learn-btn" onClick={openLessons}>
            Lessons
            <kbd>L</kbd>
          </button>
        </div>
      )}

      {mode === 'athena' && (
        <div className="troy-learn-shade" role="dialog" aria-label="Ask Athena">
          <div className="troy-learn-sheet">
            <div className="troy-learn-topics" role="group" aria-label="Which lesson Athena should focus on">
              {MENU.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={topicId === item.id ? 'is-on' : ''}
                  onClick={() => setTopicId(item.id)}
                >
                  {item.scope}
                </button>
              ))}
            </div>
            <AthenaChat topic={topic} place={MENU.find((item) => item.id === topic.id)?.scope} />
            <button type="button" className="btn btn-quiet troy-learn-close" onClick={closeAll}>
              Close
            </button>
          </div>
        </div>
      )}

      {mode === 'lessons' && !lesson && (
        <div className="troy-learn-shade" role="dialog" aria-label="Lessons">
          <div className="troy-learn-sheet card troy-learn-menu">
            <p className="eyebrow">Study with Athena</p>
            <h2>Lessons</h2>
            <p className="troy-learn-lede">
              Level 1 is the lamp on the beach at Troy. Level 2 is the lighthouse at Ithaca.
              Athena stays with you on both.
            </p>
            <div className="troy-learn-choices">
              {MENU.map((item) => {
                const level = levelById(item.id);
                const done = progress.completed.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="troy-learn-choice"
                    disabled={!level}
                    onClick={() => {
                      setTopicId(item.id);
                      setLessonId(item.id);
                    }}
                  >
                    <span>{item.scope}</span>
                    <strong>{level?.title || 'Opening…'}</strong>
                    <small>{done ? 'Studied' : level?.epithet || ''}</small>
                  </button>
                );
              })}
            </div>
            <button type="button" className="btn btn-quiet troy-learn-close" onClick={closeAll}>
              Close
            </button>
          </div>
        </div>
      )}

      {mode === 'lessons' && lesson && (
        <div className="troy-learn-lesson">
          <LearnLevel
            key={`${lesson.id}-${progress.difficulty}`}
            level={lesson}
            levels={MENU.map((item) => levelById(item.id)).filter(Boolean)}
            difficulty={progress.difficulty}
            progress={progress}
            onWin={onWin}
            onBack={() => setLessonId(null)}
            backLabel="← Lessons"
            doneLabel="Back to the lessons"
            kicker={lessonMeta ? `${lessonMeta.kicker} · ${progress.difficulty}` : ''}
          />
        </div>
      )}
    </div>
  );
}

function liveScene() {
  const troy = window.__troy?.owner;
  if (troy?.game) return troy;
  const ithaca = window.__level2?.owner;
  if (ithaca?.game) return ithaca;
  return null;
}

function holdStill(scene, locked) {
  if (locked) {
    scene.inputLocked = true;
    scene.feet?.setVelocity?.(0, 0);
    captureKeys(scene, false);
    return;
  }
  scene.inputLocked = false;
  captureKeys(scene, true);
}

// The scene plugin has disableGlobalCapture. The game-level object is the
// manager, which only has preventDefault. Either one lets a question be typed.
function captureKeys(scene, on) {
  const plugin = scene.input?.keyboard;
  if (plugin && typeof plugin.disableGlobalCapture === 'function') {
    if (on) plugin.enableGlobalCapture();
    else plugin.disableGlobalCapture();
    return;
  }
  const manager = plugin?.manager || scene.game?.input?.keyboard;
  if (manager && typeof manager.preventDefault === 'boolean') manager.preventDefault = on;
}
