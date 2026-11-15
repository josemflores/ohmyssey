// Pictures for Troy, drawn with rectangles. No image files for the scenery.
// Ground tiles are warm and light. TroyScene lays a cool blue multiply over
// them so the night reads as moonlight, not as black paint.

import Phaser from 'phaser';
import { FEET, T } from './map.js';
import { TEAMS, paintWarriorSheet } from './warriorArt.js';
import { WARRIOR_CONFIG } from './warriorConfig.js';

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function fill(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

function paintEarth(ctx, x, y, alt) {
  fill(ctx, x, y, 16, 16, '#ead8b4');
  fill(ctx, x + (alt ? 1 : 8), y + (alt ? 8 : 1), 7, 6, alt ? '#f6e6c6' : '#e2cca0');
  fill(ctx, x + (alt ? 9 : 2), y + (alt ? 2 : 10), 4, 3, '#d4c096');
}

function paintSand(ctx, x, y, alt) {
  fill(ctx, x, y, 16, 16, alt ? '#f3e2b4' : '#f6e6c0');
  fill(ctx, x + (alt ? 4 : 11), y + (alt ? 10 : 4), 3, 2, '#e2c98a');
}

function paintWet(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#d5c8a4');
  fill(ctx, x, y + 10, 16, 6, '#b7c4c0');
  fill(ctx, x + 2, y + 11, 5, 1, '#eef6f4');
}

function paintWater(ctx, x, y, deep) {
  fill(ctx, x, y, 16, 16, deep ? '#163a58' : '#1e5678');
  fill(ctx, x, y + 6, 16, 2, deep ? '#1c4868' : '#2f6e94');
  if (!deep) fill(ctx, x + 2, y + 6, 5, 1, '#d5eef4');
}

function paintRoad(ctx, x, y) {
  // Long slabs that run to the tile edge, so the road is not a stack of squares.
  fill(ctx, x, y, 16, 16, '#e7d5b2');
  fill(ctx, x, y, 16, 7, '#f6e7c8');
  fill(ctx, x, y + 8, 16, 8, '#f3e0b8');
  fill(ctx, x + 3, y + 7, 4, 1, '#d9c49a');
  fill(ctx, x + 11, y, 1, 4, '#d9c49a');
}

function paintRoadSide(ctx, x, y) {
  paintSand(ctx, x, y, false);
  fill(ctx, x + 2, y + 3, 6, 4, '#f0e0c0');
  fill(ctx, x + 9, y + 9, 5, 4, '#e7d4ae');
}

function paintPave(ctx, x, y, alt) {
  // Dark joints stay visible under the moonlight, so each tile reads as
  // several small stones instead of one big square.
  fill(ctx, x, y, 16, 16, '#8f7b60');
  if (!alt) {
    fill(ctx, x, y, 7, 6, '#f4e6ce');
    fill(ctx, x + 8, y, 8, 7, '#e4d0aa');
    fill(ctx, x, y + 7, 8, 9, '#f7ead4');
    fill(ctx, x + 9, y + 8, 7, 8, '#dcc49a');
  } else {
    fill(ctx, x, y, 5, 9, '#f6ead6');
    fill(ctx, x + 6, y, 10, 5, '#e8d2ae');
    fill(ctx, x + 6, y + 6, 10, 10, '#f0dcb8');
    fill(ctx, x, y + 10, 5, 6, '#d8c096');
  }
}

function paintWall(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#c9bfae');
  fill(ctx, x + 1, y + 1, 6, 6, '#f0e8d8');
  fill(ctx, x + 8, y + 1, 7, 6, '#e4d9c6');
  fill(ctx, x + 1, y + 8, 7, 7, '#ddd2be');
  fill(ctx, x + 9, y + 8, 6, 7, '#e8decc');
  fill(ctx, x + 1, y + 1, 6, 1, '#faf6ee');
  fill(ctx, x + 8, y + 1, 7, 1, '#f7f1e6');
}

function paintBattlement(ctx, x, y) {
  paintWall(ctx, x, y);
  // Notches. Cool shadow, not a black hole.
  fill(ctx, x, y, 4, 5, '#8ea0b4');
  fill(ctx, x + 8, y, 4, 5, '#8ea0b4');
  fill(ctx, x + 4, y, 4, 3, '#f4ecde');
  fill(ctx, x + 12, y, 4, 3, '#f4ecde');
}

function paintWallFace(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#d9cfc0');
  fill(ctx, x, y, 16, 4, '#f3ebdd');
  fill(ctx, x, y, 16, 1, '#faf6ee');
  fill(ctx, x, y + 12, 16, 4, '#a89880');
}

function paintRock(ctx, x, y) {
  // Broken limestone, same family as the wall, so the edge is not a gray blob.
  fill(ctx, x, y, 16, 16, '#e6d7b8');
  fill(ctx, x + 2, y + 5, 11, 8, '#f4ead4');
  fill(ctx, x + 4, y + 2, 7, 5, '#faf4e8');
  fill(ctx, x + 3, y + 10, 5, 3, '#cbb898');
  fill(ctx, x + 10, y + 8, 4, 4, '#d9c8a8');
}

function paintPebble(ctx, x, y) {
  paintEarth(ctx, x, y, false);
  fill(ctx, x + 4, y + 6, 3, 2, '#b7a488');
  fill(ctx, x + 10, y + 10, 2, 2, '#c4b496');
}

function paintWeed(ctx, x, y) {
  paintEarth(ctx, x, y, true);
  fill(ctx, x + 4, y + 8, 2, 5, '#7d8a58');
  fill(ctx, x + 7, y + 6, 2, 6, '#9aaa6a');
  fill(ctx, x + 10, y + 9, 2, 4, '#6e7c4c');
}

function paintTileset() {
  const max = Math.max(...Object.values(T));
  const { canvas, ctx } = makeCanvas((max + 1) * 16, 16);
  const painters = [];
  painters[T.earth] = (c, x, y) => paintEarth(c, x, y, false);
  painters[T.earthAlt] = (c, x, y) => paintEarth(c, x, y, true);
  painters[T.sand] = (c, x, y) => paintSand(c, x, y, false);
  painters[T.sandAlt] = (c, x, y) => paintSand(c, x, y, true);
  painters[T.wet] = paintWet;
  painters[T.water] = (c, x, y) => paintWater(c, x, y, false);
  painters[T.waterDeep] = (c, x, y) => paintWater(c, x, y, true);
  painters[T.road] = paintRoad;
  painters[T.roadSide] = paintRoadSide;
  painters[T.wall] = paintWall;
  painters[T.battlement] = paintBattlement;
  painters[T.wallFace] = paintWallFace;
  painters[T.rock] = paintRock;
  painters[T.pebble] = paintPebble;
  painters[T.pave] = (c, x, y) => paintPave(c, x, y, false);
  painters[T.paveAlt] = (c, x, y) => paintPave(c, x, y, true);
  painters[T.weed] = paintWeed;
  for (let i = 0; i <= max; i += 1) {
    if (!painters[i]) throw new Error(`Missing painter for tile ${i}`);
    painters[i](ctx, i * 16, 0);
  }
  return canvas;
}

function paintTemple() {
  const { canvas, ctx } = makeCanvas(104, 80);
  // Steps, lit from the upper left. The shadow sits on the south edge.
  fill(ctx, 0, 68, 104, 12, '#c4b8a4');
  fill(ctx, 6, 56, 92, 16, '#e4d8c4');
  fill(ctx, 6, 56, 92, 2, '#faf4ea');
  fill(ctx, 0, 76, 104, 4, '#8f8372');
  for (let i = 0; i < 5; i += 1) {
    const x = 16 + i * 16;
    fill(ctx, x + 6, 30, 3, 28, '#b7aa96');
    fill(ctx, x, 30, 8, 28, '#f4efe4');
    fill(ctx, x, 30, 2, 28, '#fffaf2');
    fill(ctx, x - 2, 26, 12, 5, '#faf6ee');
    fill(ctx, x - 2, 54, 12, 4, '#d5cbb8');
  }
  fill(ctx, 14, 18, 76, 12, '#a84838');
  fill(ctx, 26, 10, 52, 10, '#c45a42');
  fill(ctx, 40, 4, 24, 8, '#d47858');
  fill(ctx, 46, 0, 12, 5, '#e6c27a');
  // Dark doorway and one small lamp, not a fire.
  fill(ctx, 46, 36, 12, 20, '#2a241c');
  fill(ctx, 50, 44, 4, 6, '#e8b060');
  return canvas;
}

function paintHouse(roof, roofHi) {
  const { canvas, ctx } = makeCanvas(60, 64);
  fill(ctx, 4, 36, 52, 22, '#6a5e50');
  fill(ctx, 0, 54, 60, 10, '#3e342c');
  fill(ctx, 2, 6, 56, 34, roof);
  fill(ctx, 8, 0, 44, 12, roofHi);
  fill(ctx, 4, 6, 52, 3, '#e6c8a0');
  // Plank lines on the roof.
  for (let i = 0; i < 3; i += 1) fill(ctx, 6, 16 + i * 7, 48, 1, 'rgba(0,0,0,0.35)');
  fill(ctx, 24, 44, 12, 18, '#1a120e');
  fill(ctx, 26, 50, 8, 10, '#2a1c14');
  fill(ctx, 8, 40, 10, 8, '#243040');
  fill(ctx, 42, 40, 8, 8, '#1c2830');
  return canvas;
}

function paintColumn() {
  const { canvas, ctx } = makeCanvas(16, 48);
  fill(ctx, 1, 40, 14, 8, '#d5cbb8');
  fill(ctx, 0, 44, 16, 4, '#a89880');
  fill(ctx, 11, 8, 3, 34, '#b7aa96');
  fill(ctx, 3, 8, 8, 34, '#f4efe4');
  fill(ctx, 3, 8, 2, 34, '#fffaf2');
  fill(ctx, 1, 4, 14, 6, '#faf6ee');
  fill(ctx, 1, 4, 4, 6, '#fffdf8');
  fill(ctx, 3, 0, 10, 5, '#e6d7b0');
  return canvas;
}

function paintRubble() {
  const { canvas, ctx } = makeCanvas(34, 24);
  fill(ctx, 2, 12, 10, 8, '#d9c8a8');
  fill(ctx, 10, 8, 14, 12, '#f0e4cc');
  fill(ctx, 20, 14, 12, 8, '#cbb898');
  fill(ctx, 12, 6, 8, 4, '#faf4e8');
  fill(ctx, 6, 16, 4, 3, '#a89070');
  fill(ctx, 16, 18, 6, 3, '#b8a488');
  return canvas;
}

function paintBrazier() {
  // Empty bowl. The city is not burning.
  const { canvas, ctx } = makeCanvas(16, 24);
  fill(ctx, 2, 14, 2, 10, '#6a5840');
  fill(ctx, 12, 14, 2, 10, '#6a5840');
  fill(ctx, 7, 16, 2, 8, '#6a5840');
  fill(ctx, 2, 12, 12, 5, '#a08058');
  fill(ctx, 3, 10, 10, 4, '#4a3c2c');
  fill(ctx, 5, 11, 6, 2, '#c4a878');
  return canvas;
}

function paintCypress() {
  const { canvas, ctx } = makeCanvas(16, 44);
  fill(ctx, 6, 32, 4, 12, '#3a2a18');
  fill(ctx, 3, 22, 10, 14, '#1e3a2c');
  fill(ctx, 4, 12, 8, 14, '#2a4a36');
  fill(ctx, 5, 4, 6, 12, '#1a3328');
  fill(ctx, 7, 0, 2, 8, '#143024');
  fill(ctx, 6, 14, 2, 10, '#3e6a50');
  return canvas;
}

function paintTower() {
  const { canvas, ctx } = makeCanvas(32, 56);
  fill(ctx, 4, 10, 24, 42, '#e4d9c6');
  fill(ctx, 20, 10, 8, 42, '#c9bfae');
  fill(ctx, 4, 10, 4, 42, '#faf6ee');
  fill(ctx, 2, 46, 28, 8, '#d5cbb8');
  fill(ctx, 2, 52, 28, 4, '#8f8372');
  fill(ctx, 2, 4, 8, 8, '#f4ecde');
  fill(ctx, 14, 2, 6, 10, '#efe6d4');
  fill(ctx, 22, 4, 8, 8, '#e4d9c6');
  fill(ctx, 6, 0, 6, 4, '#8ea0b4');
  fill(ctx, 20, 0, 6, 4, '#8ea0b4');
  // A small lamp in the tower, not a blaze.
  fill(ctx, 14, 30, 4, 5, '#e8c080');
  return canvas;
}

// Three frames, 16×28. Only the flame changes. Bronze standing lamp.
function paintOilLamp() {
  const { canvas, ctx } = makeCanvas(48, 28);
  const flames = [
    [[6, 1, 4, 2, '#fff4c8'], [7, 3, 2, 4, '#ffb04a'], [7, 0, 2, 2, '#fffbe8']],
    [[7, 3, 2, 3, '#ffb04a'], [7, 2, 2, 2, '#ffe09a']],
    [[8, 1, 3, 2, '#fff4c8'], [8, 3, 2, 4, '#ff9a3c'], [7, 2, 2, 2, '#ffe09a']],
  ];
  for (let frame = 0; frame < 3; frame += 1) {
    const x = frame * 16;
    fill(ctx, x + 2, 25, 12, 3, '#2a1c10');
    fill(ctx, x + 3, 25, 10, 1, '#e2c48a');
    fill(ctx, x + 7, 17, 2, 8, '#6a4424');
    fill(ctx, x + 7, 17, 1, 8, '#e6c890');
    fill(ctx, x + 3, 13, 10, 6, '#2a1c10');
    fill(ctx, x + 4, 14, 8, 4, '#c48a42');
    fill(ctx, x + 4, 14, 3, 2, '#f3d7a0');
    fill(ctx, x + 10, 15, 2, 2, '#7a4e24');
    fill(ctx, x + 6, 11, 4, 3, '#a87438');
    fill(ctx, x + 7, 9, 2, 3, '#1c120c');
    for (const [fx, fy, fw, fh, color] of flames[frame]) {
      fill(ctx, x + fx, fy, fw, fh, color);
    }
  }
  return canvas;
}

function paintLampGlow() {
  const { canvas, ctx } = makeCanvas(160, 160);
  const g = ctx.createRadialGradient(80, 80, 4, 80, 80, 78);
  g.addColorStop(0, 'rgba(255, 214, 140, 0.9)');
  g.addColorStop(0.25, 'rgba(255, 170, 80, 0.45)');
  g.addColorStop(0.6, 'rgba(255, 140, 60, 0.12)');
  g.addColorStop(1, 'rgba(255, 120, 40, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 160, 160);
  return canvas;
}

function paintVignette() {
  const { canvas, ctx } = makeCanvas(256, 256);
  const g = ctx.createRadialGradient(128, 128, 80, 128, 128, 150);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.55, 'rgba(4,10,24,0.08)');
  g.addColorStop(1, 'rgba(2,6,16,0.72)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return canvas;
}

const PROP_ART = {
  temple: paintTemple,
  house: () => paintHouse('#8c3a2a', '#b5523a'),
  houseAlt: () => paintHouse('#5c4634', '#7a5a40'),
  column: paintColumn,
  rubble: paintRubble,
  brazier: paintBrazier,
  cypress: paintCypress,
  tower: paintTower,
};

function addCanvas(scene, key, canvas) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, canvas);
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return tex;
}

function addSheet(scene, key, canvas, frameWidth = 32, frameHeight = 32) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addSpriteSheet(key, canvas, { frameWidth, frameHeight });
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return tex;
}

export function buildWorldTextures(scene) {
  addCanvas(scene, 'tiles', paintTileset());
  // 2×2 placeholder. Static boxes stretch this to the size they need.
  addCanvas(scene, 'blank', makeCanvas(2, 2).canvas);
  addCanvas(scene, 'feet', makeCanvas(FEET.w, FEET.h).canvas);
  addCanvas(scene, 'feet-small', makeCanvas(12, 8).canvas);
  addCanvas(scene, 'vignette', paintVignette());
  addCanvas(scene, 'lamp-glow', paintLampGlow());
  addSheet(scene, 'oil-lamp', paintOilLamp(), 16, 28);
  // Stand-in sheets. A team with WARRIOR_CONFIG path set is loaded in preload instead.
  if (!WARRIOR_CONFIG.teams.greek.path) {
    addSheet(scene, WARRIOR_CONFIG.teams.greek.key, paintWarriorSheet(TEAMS.greek));
  }
  if (!WARRIOR_CONFIG.teams.trojan.path) {
    addSheet(scene, WARRIOR_CONFIG.teams.trojan.key, paintWarriorSheet(TEAMS.trojan));
  }
  for (const [id, paint] of Object.entries(PROP_ART)) {
    addCanvas(scene, id, paint());
  }
}
