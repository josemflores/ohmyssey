import Phaser from 'phaser';
import { IthacaScene } from './IthacaScene.js';

export function createIthacaGame(parent) {
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
    fps: { target: 60 },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        fps: 60,
        debug,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width,
      height,
    },
    scene: [IthacaScene],
    audio: { noAudio: true },
  });
}
