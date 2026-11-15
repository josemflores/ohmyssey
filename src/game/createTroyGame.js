import Phaser from 'phaser';
import { attachGameAudio } from './gameAudio.js';
import { HorseScene } from './HorseScene.js';
import { TroyScene } from './TroyScene.js';
import './odysseusBattle.css';
// After odysseusBattle.css so its hurt flash wins on the same selectors.
import './soldierBattle.css';

// Builds the Phaser game into the div React gives us.
// pixelArt keeps the tiles and Odysseus crisp when the camera zooms to 3×.
export function createTroyGame(parent) {
  const width = parent.clientWidth || window.innerWidth;
  const height = parent.clientHeight || window.innerHeight;
  const debug = new URLSearchParams(window.location.search).has('hitboxes');

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: '#07111c',
    pixelArt: true,
    banner: false,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width,
      height,
    },
    // Begin starts inside the horse. Troy is waiting for the hatch to open.
    scene: [HorseScene, TroyScene],
    audio: { noAudio: true },
  });
  attachGameAudio(game, { world: 'world-ruins', level: 'troy' });
  return game;
}
