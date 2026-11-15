import { useEffect, useRef, useState } from 'react';
import { createTroyGame } from '../game/createTroyGame.js';
import './TroyWorld.css';

const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

// Mounts the Phaser city. The hint fades after a few seconds, or on the first step.
export default function TroyWorld() {
  const host = useRef(null);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const parent = host.current;
    const game = createTroyGame(parent);
    return () => {
      game.destroy(true);
    };
  }, []);

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

  return (
    <div className="troy" data-screen="world">
      <div ref={host} className="troy-host" />
      <h1 className="troy-plaque">
        Troy
        <span>at night</span>
      </h1>
      <p className={hint ? 'troy-hint' : 'troy-hint is-hidden'}>WASD to move</p>
    </div>
  );
}
