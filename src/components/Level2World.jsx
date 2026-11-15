import { useEffect, useRef, useState } from 'react';
import { createLevel2Game } from '../game/level2/createLevel2Game.js';
import { clearActiveGame, setActiveGame } from '../lib/activeGame.js';
import './Level2World.css';

// Level 2: Ithaca at night. Phaser draws the island and moves Odysseus;
// this component shows the place name, the controls hint, and the short
// lines when he presses E at a landmark.
export default function Level2World() {
  const host = useRef(null);
  const gameRef = useRef(null);
  const [hint, setHint] = useState(true);
  const [near, setNear] = useState(null);
  const [talk, setTalk] = useState(null);

  useEffect(() => {
    const game = createLevel2Game(host.current);
    gameRef.current = game;
    setActiveGame(game);
    const onNear = (spot) => setNear(spot || null);
    const onTalk = (line) => setTalk(line);
    game.events.on('near', onNear);
    game.events.on('talk', onTalk);
    const timer = window.setTimeout(() => setHint(false), 5200);
    return () => {
      window.clearTimeout(timer);
      game.events.off('near', onNear);
      game.events.off('talk', onTalk);
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

  function closeTalk() {
    setTalk(null);
    gameRef.current?.events.emit('unlockInput');
  }

  const prompt = near ? `Press E: ${near.who}` : 'WASD to move. Hold Shift to run. Press E near a landmark.';

  return (
    <div className="l2" data-screen="level2">
      <p className="l2-sr" role="status">Ithaca at night. You wake on the beach. WASD to move.</p>
      <div ref={host} className="l2-host" />
      <h1 className="l2-plaque">
        Ithaca
        <span>home, at night</span>
      </h1>
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
