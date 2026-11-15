// Builds the great hall (hallMap.js) inside the Level 2 scene: painted floor
// and walls, Skand's palace props and suitors (#27), braziers and the hearth
// with warm firelight. The hall is lit by fire, not the moon, so it gets a
// warm grade instead of the blue one outside.

import Phaser from 'phaser';
import {
  H,
  HALL,
  HALL_BRAZIERS,
  HALL_PEOPLE,
  HALL_PROPS,
  TILE,
  buildHallGrid,
  hallSolids,
} from './hallMap.js';

const SORT = 7000;
// Characters in Level 2 are drawn at 4/3, like Odysseus and Penelope here.
const PERSON_SCALE = 4 / 3;

// The doors of the hall, seen from the courtyard: at the foot of the porch
// steps in the middle of the palace front (map.js PROPS 'palace').
export const HALL_DOOR_SPOT = {
  id: 'hall-door',
  x: 512,
  y: 180,
  radius: 26,
  who: 'The hall doors',
  line: 'The doors of your own hall.',
};

// Where he stands in the courtyard after leaving the hall.
export const COURTYARD_RETURN = { x: 512, y: 196 };

const SHEETS = [
  ['palace-hearth', '/assets/props/palace_hearth.png', 48, 32],
  ['palace-loom', '/assets/props/palace_loom.png', 32, 48],
  ['palace-brazier', '/assets/props/palace_brazier.png', 32, 32],
  ['palace-door', '/assets/props/palace_door.png', 48, 64],
  // LPC suitors: three outfits (a, b, c) in four colors each
  // (art/scripts/build_ithaca_people_lpc.py).
  ...['a', 'b', 'c'].flatMap((outfit) => [1, 2, 3, 4].map((n) => [
    `suitor-${outfit}-${n}`,
    `/assets/sprites/npcs/suitor_lpc/suitor_${outfit}_${n}.png`,
    32,
    32,
  ])),
  ['suitors-hound', '/assets/sprites/npcs/suitors_hound/suitors_hound_32.png', 32, 32],
];
const IMAGES = [
  ['palace-throne', '/assets/props/palace_throne.png'],
  ['palace-column', '/assets/props/palace_column.png'],
  ['palace-banquet', '/assets/props/palace_banquet.png'],
  ['palace-bow-rack', '/assets/props/palace_bow_rack.png'],
  ['palace-amphora', '/assets/props/palace_amphora.png'],
];

export function preloadHall(scene) {
  for (const [key, path, frameWidth, frameHeight] of SHEETS) {
    if (!scene.textures.exists(key)) scene.load.spritesheet(key, path, { frameWidth, frameHeight });
  }
  for (const [key, path] of IMAGES) {
    if (!scene.textures.exists(key)) scene.load.image(key, path);
  }
}

// ---- Floor and walls ------------------------------------------------------

function paintHallTiles() {
  const canvas = document.createElement('canvas');
  canvas.width = 6 * TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');
  const fill = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const at = (i) => i * TILE;
  // Floor: big pale flagstones with dark joints.
  for (const [i, a, b] of [[H.floor, '#d8c6a4', '#cbb792'], [H.floorAlt, '#d2bf9c', '#c4ae88']]) {
    const x = at(i);
    fill(x, 0, 16, 16, '#8a7458');
    fill(x, 0, 15, 7, a);
    fill(x, 8, 7, 8, b);
    fill(x + 8, 8, 7, 8, a);
    fill(x, 0, 15, 1, '#eadcc0');
  }
  // Wall top: dark timber and stone.
  fill(at(H.wallTop), 0, 16, 16, '#3a2a1e');
  fill(at(H.wallTop), 0, 16, 2, '#5a4430');
  fill(at(H.wallTop) + 7, 3, 2, 13, '#2a1e14');
  // Wall face: a fresco band, ochre over red with a meander line.
  const wf = at(H.wallFace);
  fill(wf, 0, 16, 16, '#9c3b2e');
  fill(wf, 0, 6, 16, 4, '#d9a35a');
  fill(wf, 0, 13, 16, 3, '#5a2018');
  fill(wf + 2, 7, 4, 1, '#3a1a10');
  fill(wf + 5, 7, 1, 2, '#3a1a10');
  fill(wf + 10, 7, 4, 1, '#3a1a10');
  fill(wf + 13, 7, 1, 2, '#3a1a10');
  // Dais: a raised step of polished stone.
  fill(at(H.dais), 0, 16, 16, '#e6d6b4');
  fill(at(H.dais), 0, 16, 2, '#f6ecd6');
  fill(at(H.dais), 14, 16, 2, '#a8946e');
  // Rug: a woven runner, red with a gold border.
  fill(at(H.rug), 0, 16, 16, '#8c2e24');
  fill(at(H.rug), 0, 2, 16, '#d9a35a');
  fill(at(H.rug) + 14, 0, 2, 16, '#d9a35a');
  fill(at(H.rug) + 5, 4, 6, 1, '#c45a42');
  fill(at(H.rug) + 5, 11, 6, 1, '#c45a42');
  return canvas;
}

function addRect(scene, group, rect) {
  const block = group.create(rect.x + rect.w / 2, rect.y + rect.h / 2, 'blank');
  block.setDisplaySize(rect.w, rect.h);
  block.refreshBody();
  block.setVisible(false);
  return block;
}

function nearest(scene, key) {
  const tex = scene.textures.get(key);
  if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

// ---- Build ------------------------------------------------------------------

export function buildHall(scene, blockers) {
  if (scene.textures.exists('hall-tiles')) scene.textures.remove('hall-tiles');
  scene.textures.addCanvas('hall-tiles', paintHallTiles());
  nearest(scene, 'hall-tiles');
  for (const [key] of [...SHEETS, ...IMAGES]) nearest(scene, key);

  const grid = buildHallGrid();
  const map = scene.make.tilemap({ data: grid, tileWidth: TILE, tileHeight: TILE });
  const tiles = map.addTilesetImage('hall-tiles');
  map.createLayer(0, tiles, HALL.x, HALL.y).setDepth(0);
  for (const rect of hallSolids(grid)) addRect(scene, blockers, rect);

  // Firelight: a warm, dim grade over the floor (people and props sit above).
  scene.add.rectangle(HALL.x + HALL.w / 2, HALL.y + HALL.h / 2, HALL.w, HALL.h, 0xb08a62, 1)
    .setBlendMode(Phaser.BlendModes.MULTIPLY)
    .setDepth(5000);

  makeAnim(scene, 'hall-hearth', 'palace-hearth', 4, 6);
  makeAnim(scene, 'hall-loom', 'palace-loom', 2, 1);
  makeAnim(scene, 'hall-brazier', 'palace-brazier', 4, 7);

  for (const p of HALL_PROPS) {
    scene.add.ellipse(p.x + 3, p.baseY, p.bodyW * 1.1, 6, 0x1a120c, 0.4).setDepth(5200);
    const sprite = scene.add.sprite(p.x, p.baseY, p.key, 0).setOrigin(0.5, 1).setDepth(SORT + p.baseY);
    if (p.key === 'palace-hearth') {
      sprite.play('hall-hearth');
      glow(scene, p.x, p.baseY - 14, 1.4, 0.7);
    }
    if (p.key === 'palace-loom') sprite.play('hall-loom');
  }

  for (const b of HALL_BRAZIERS) {
    const sprite = scene.add.sprite(b.x, b.baseY, 'palace-brazier', 0).setOrigin(0.5, 1).setDepth(SORT + b.baseY);
    sprite.play({ key: 'hall-brazier', startFrame: (b.x + b.baseY) % 4 });
    glow(scene, b.x, b.baseY - 22, 0.8, 0.6);
  }

  // The doors stand open in the south wall behind him.
  scene.add.sprite(HALL.x + HALL.w / 2, HALL.y + HALL.h, 'palace-door', 1)
    .setOrigin(0.5, 1)
    .setDepth(SORT + HALL.y + HALL.h + 20);

  // The suitors and their hound, idling at the tables.
  for (const person of HALL_PEOPLE) {
    // Under the feet: the sprite stands at y + 1 and LPC feet are 1 px up.
    scene.add.ellipse(person.x + 1, person.y, 18, 6, 0x1a120c, 0.45).setDepth(5200);
    const sprite = scene.add.sprite(person.x, person.y + 1, person.key, person.row * 4)
      .setOrigin(0.5, 1)
      .setScale(PERSON_SCALE)
      .setDepth(SORT + person.y);
    scene.tweens.add({
      targets: sprite,
      scaleY: PERSON_SCALE * 1.03,
      duration: 900 + (person.x % 5) * 120,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

function makeAnim(scene, key, texture, frames, frameRate) {
  if (scene.anims.exists(key) || !scene.textures.exists(texture)) return;
  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(texture, { start: 0, end: frames - 1 }),
    frameRate,
    repeat: -1,
  });
}

function glow(scene, x, y, scale, alpha) {
  if (!scene.textures.exists('lamp-glow')) return;
  const g = scene.add.image(x, y, 'lamp-glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(5400);
  g.setScale(scale).setAlpha(alpha);
  scene.tweens.add({
    targets: g,
    alpha: alpha * 0.7,
    duration: 420 + (x % 7) * 40,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}
