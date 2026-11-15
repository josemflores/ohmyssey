import { useEffect, useRef, useState } from 'react';
import { createTroyGame } from '../game/createTroyGame.js';
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
  const [place, setPlace] = useState('troy');

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
    game.events.on('interact', onInteract);
    game.events.on('closeInteract', onCloseRequest);
    game.events.on('place', setPlace);
    return () => {
      game.events.off('interact', onInteract);
      game.events.off('closeInteract', onCloseRequest);
      game.events.off('place', setPlace);
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  function closeTalk() {
    setTalk(null);
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
    if (!talk) return undefined;
    function onKey(event) {
      if (event.code === 'Escape') closeTalk();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [talk]);

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
    </div>
  );
}
