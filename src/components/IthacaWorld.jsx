import { useEffect, useRef, useState } from 'react';
import { createIthacaGame } from '../game/createIthacaGame.js';
import { level6 } from '../levels/level6.js';
import LevelScreen from './LevelScreen.jsx';
import './IthacaWorld.css';

const coastLevel = {
  ...level6,
  voyageLabel: 'Voyage 2 · catalog level 6',
};

// The second playable stop. Walking is Phaser. The lighthouse door opens
// the 555 beacon from level 6, with that level's own check.
export default function IthacaWorld() {
  const host = useRef(null);
  const gameRef = useRef(null);
  const [hint, setHint] = useState(true);
  const [near, setNear] = useState('');
  const [talk, setTalk] = useState(null);
  const [puzzle, setPuzzle] = useState(false);
  const [banner, setBanner] = useState('');

  useEffect(() => {
    const game = createIthacaGame(host.current);
    gameRef.current = game;

    const onNear = (spot) => setNear(spot ? spot.id : '');
    const onTalk = (line) => setTalk(line);
    const onBeacon = () => setPuzzle(true);
    const onBanner = (text) => setBanner(text);
    game.events.on('near', onNear);
    game.events.on('talk', onTalk);
    game.events.on('openBeacon', onBeacon);
    game.events.on('banner', onBanner);

    const hintTimer = window.setTimeout(() => setHint(false), 4200);
    return () => {
      window.clearTimeout(hintTimer);
      game.events.off('near', onNear);
      game.events.off('talk', onTalk);
      game.events.off('openBeacon', onBeacon);
      game.events.off('banner', onBanner);
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    function onKey(event) {
      if (event.key !== 'Escape') return;
      if (puzzle) closePuzzle();
      else if (talk) closeTalk();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [puzzle, talk]);

  function closeTalk() {
    setTalk(null);
    gameRef.current?.events.emit('unlockInput');
  }

  function closePuzzle() {
    setPuzzle(false);
    gameRef.current?.events.emit('unlockInput');
  }

  let prompt = 'WASD to move. Hold Shift to run.';
  if (near === 'beacon') prompt = 'Press E to light the beacon.';
  if (near === 'penelope') prompt = 'Press E to speak with Penelope.';

  return (
    <div className="ithaca" data-screen="ithaca">
      <p className="ithaca-sr" role="status">Ithaca. The lighthouse is dark. WASD to move.</p>
      <div ref={host} className="ithaca-host" />
      {!puzzle && (
        <h1 className="ithaca-plaque">
          Ithaca
          <span>the dark coast</span>
        </h1>
      )}
      {!puzzle && !talk && (
        <p className={hint || near ? 'ithaca-hint' : 'ithaca-hint is-hidden'}>{prompt}</p>
      )}
      {!puzzle && banner && <p className="ithaca-banner">{banner}</p>}
      {talk && (
        <div className="ithaca-talk" role="dialog" aria-labelledby="ithaca-talk-who">
          <p id="ithaca-talk-who" className="ithaca-talk-who">{talk.who}</p>
          <p>{talk.line}</p>
          <button className="btn ithaca-talk-go" type="button" onClick={closeTalk}>Press on</button>
        </div>
      )}
      {puzzle && (
        <div className="ithaca-puzzle">
          <LevelScreen
            level={coastLevel}
            backLabel="← The coast"
            doneLabel="Back to the coast"
            onBack={closePuzzle}
            onComplete={() => gameRef.current?.events.emit('beaconLit')}
          />
        </div>
      )}
    </div>
  );
}
