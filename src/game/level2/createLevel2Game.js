import Phaser from 'phaser';
import { Level2Scene } from './Level2Scene.js';

// Builds the Level 2 (Ithaca) Phaser game into the div React gives us.
// Add ?hitboxes to the URL to see every collision box.
export function createLevel2Game(parent) {
  const width = parent.clientWidth || window.innerWidth;
  const height = parent.clientHeight || window.innerHeight;
  const debug = new URLSearchParams(window.location.search).has('hitboxes');

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: '#07111c',
    pixelArt: true,
    banner: false,
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 }, debug },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width,
      height,
    },
    scene: [Level2Scene],
    audio: { noAudio: true },
  });
}
