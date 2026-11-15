// Pictures for Troy, drawn with rectangles. No image files for the scenery.
// Each prop is one small canvas. TroyScene turns them into Phaser textures.
// Colors are moonlight: dark ground, pale stone, warm fire.

import Phaser from 'phaser';
import { FEET, T } from './map.js';

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

function paintPlaza(ctx, x, y, alt) {
  fill(ctx, x, y, 16, 16, alt ? '#1a1612' : '#221c16');
  fill(ctx, x + 1, y + 1, 6, 6, alt ? '#322c24' : '#3a3228');
  fill(ctx, x + 8, y + 2, 7, 5, '#2a241c');
  fill(ctx, x + 2, y + 9, 5, 5, alt ? '#3e3428' : '#2e2820');
  fill(ctx, x + 9, y + 9, 6, 6, '#261f18');
  fill(ctx, x + (alt ? 10 : 3), y + (alt ? 4 : 12), 2, 2, '#4a4034');
}

function paintSand(ctx, x, y, alt) {
  // Warm and lighter than the city, so the beach reads at a glance.
  fill(ctx, x, y, 16, 16, alt ? '#c4a36a' : '#b89558');
  fill(ctx, x + 2, y + 3, 2, 2, '#ddc48a');
  fill(ctx, x + 10, y + 8, 3, 2, '#8d7040');
  fill(ctx, x + (alt ? 5 : 12), y + (alt ? 11 : 2), 2, 1, '#efe0b8');
  fill(ctx, x + 7, y + 6, 1, 1, '#6e542c');
}

function paintWet(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#2c3a3a');
  fill(ctx, x, y + 11, 16, 5, '#1a3038');
  fill(ctx, x + 2, y + 4, 5, 2, '#6e8c8a');
  fill(ctx, x + 9, y + 8, 4, 1, '#8eb0a4');
}

function paintWater(ctx, x, y, deep) {
  fill(ctx, x, y, 16, 16, deep ? '#061828' : '#0a3050');
  fill(ctx, x, y + 6, 16, 3, deep ? '#082038' : '#12486e');
  if (!deep) {
    fill(ctx, x + 1, y + 6, 5, 1, '#c5e4ef');
    fill(ctx, x + 10, y + 7, 4, 1, '#7eb6d0');
  } else {
    fill(ctx, x + 4, y + 10, 6, 1, '#16344e');
  }
}

function paintRoad(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#2a261f');
  fill(ctx, x + 1, y + 1, 6, 6, '#5a5146');
  fill(ctx, x + 8, y + 2, 7, 5, '#4a4338');
  fill(ctx, x + 2, y + 9, 6, 6, '#524a3e');
  fill(ctx, x + 9, y + 8, 6, 7, '#3e382e');
  fill(ctx, x + 2, y + 2, 4, 1, '#8a7d68');
}

function paintWall(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#242220');
  fill(ctx, x + 1, y + 1, 6, 6, '#7a7468');
  fill(ctx, x + 8, y + 1, 7, 6, '#6a645a');
  fill(ctx, x + 1, y + 8, 7, 7, '#5e584e');
  fill(ctx, x + 9, y + 8, 6, 7, '#706a60');
  fill(ctx, x + 1, y + 1, 6, 1, '#c8c0b0');
  fill(ctx, x + 8, y + 1, 7, 1, '#b0a898');
}

function paintBattlement(ctx, x, y) {
  paintWall(ctx, x, y);
  // Notches along the north edge, so the wall reads as battlements.
  fill(ctx, x, y, 4, 5, '#100e0c');
  fill(ctx, x + 8, y, 4, 5, '#100e0c');
  fill(ctx, x + 4, y, 4, 3, '#8e887c');
  fill(ctx, x + 12, y, 4, 3, '#8e887c');
}

function paintWallFace(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#3a3630');
  fill(ctx, x, y, 16, 5, '#6a6458');
  fill(ctx, x, y, 16, 2, '#b7b0a2');
  fill(ctx, x + 2, y + 6, 5, 4, '#4a453e');
  fill(ctx, x + 9, y + 6, 5, 4, '#524c44');
  fill(ctx, x, y + 12, 16, 4, '#12100e');
}

function paintRock(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#141210');
  fill(ctx, x + 2, y + 5, 12, 9, '#4a453e');
  fill(ctx, x + 4, y + 2, 8, 7, '#6a645c');
  fill(ctx, x + 5, y + 3, 3, 2, '#a8a090');
  fill(ctx, x + 3, y + 10, 4, 2, '#2e2a26');
}

function paintRubbleTile(ctx, x, y) {
  paintPlaza(ctx, x, y, false);
  fill(ctx, x + 2, y + 3, 4, 3, '#6a5a44');
  fill(ctx, x + 8, y + 9, 5, 3, '#4a4034');
  fill(ctx, x + 6, y + 5, 2, 2, '#2a241c');
}

function paintTileset() {
  const max = Math.max(...Object.values(T));
  const { canvas, ctx } = makeCanvas((max + 1) * 16, 16);
  const painters = [];
  painters[T.plaza] = (c, x, y) => paintPlaza(c, x, y, false);
  painters[T.plazaAlt] = (c, x, y) => paintPlaza(c, x, y, true);
  painters[T.sand] = (c, x, y) => paintSand(c, x, y, false);
  painters[T.sandAlt] = (c, x, y) => paintSand(c, x, y, true);
  painters[T.wet] = paintWet;
  painters[T.water] = (c, x, y) => paintWater(c, x, y, false);
  painters[T.waterDeep] = (c, x, y) => paintWater(c, x, y, true);
  painters[T.road] = paintRoad;
  painters[T.wall] = paintWall;
  painters[T.battlement] = paintBattlement;
  painters[T.wallFace] = paintWallFace;
  painters[T.rock] = paintRock;
  painters[T.rubble] = paintRubbleTile;
  for (let i = 0; i <= max; i += 1) {
    if (!painters[i]) throw new Error(`Missing painter for tile ${i}`);
    painters[i](ctx, i * 16, 0);
  }
  return canvas;
}

function paintHorse() {
  // High top-down. Head and ears point into the city. Tail and wheels
  // face the beach, so the silhouette is a horse and not a cart.
  const { canvas, ctx } = makeCanvas(64, 88);
  const plank = '#c4894a';
  const light = '#f0d090';
  const dark = '#5a3818';
  const line = '#1c1008';

  // Tail, south end, between the wheels.
  fill(ctx, 28, 70, 8, 14, line);
  fill(ctx, 30, 68, 4, 16, dark);

  // Wheels.
  fill(ctx, 1, 68, 16, 16, line);
  fill(ctx, 3, 70, 12, 12, '#7a6248');
  fill(ctx, 6, 73, 6, 6, light);
  fill(ctx, 47, 68, 16, 16, line);
  fill(ctx, 49, 70, 12, 12, '#7a6248');
  fill(ctx, 52, 73, 6, 6, light);

  // Four legs.
  fill(ctx, 14, 58, 6, 18, dark);
  fill(ctx, 44, 58, 6, 18, dark);
  fill(ctx, 22, 60, 5, 14, plank);
  fill(ctx, 37, 60, 5, 14, plank);

  // Barrel of the body. Narrower at the rump.
  fill(ctx, 8, 34, 48, 30, line);
  fill(ctx, 10, 36, 44, 26, plank);
  fill(ctx, 10, 36, 44, 4, light);
  for (let i = 0; i < 4; i += 1) fill(ctx, 12, 42 + i * 5, 40, 1, dark);

  // The door the warriors climbed out of.
  fill(ctx, 24, 46, 16, 12, line);
  fill(ctx, 26, 48, 12, 8, '#2a1a0e');
  fill(ctx, 30, 50, 4, 4, '#f0d48a');

  // Neck.
  fill(ctx, 22, 22, 20, 16, line);
  fill(ctx, 24, 24, 16, 14, plank);
  fill(ctx, 22, 26, 4, 10, '#8c3030');

  // Head, long face, ears, a dark eye, and a pale muzzle.
  fill(ctx, 20, 8, 24, 18, line);
  fill(ctx, 22, 10, 20, 14, plank);
  fill(ctx, 24, 0, 4, 12, dark);
  fill(ctx, 36, 0, 4, 12, dark);
  fill(ctx, 26, 2, 12, 8, light);
  fill(ctx, 28, 12, 3, 3, line);
  fill(ctx, 38, 14, 8, 6, '#f3e0b0');
  return canvas;
}

function paintTemple() {
  const { canvas, ctx } = makeCanvas(104, 80);
  fill(ctx, 6, 54, 92, 18, '#6a6458');
  fill(ctx, 0, 66, 104, 10, '#524c44');
  fill(ctx, 0, 74, 104, 6, '#1a1814');
  fill(ctx, 6, 54, 92, 3, '#d5cbb8');
  for (let i = 0; i < 5; i += 1) {
    const x = 16 + i * 16;
    fill(ctx, x, 28, 8, 30, '#e4dccb');
    fill(ctx, x - 2, 24, 12, 5, '#f4efe4');
    fill(ctx, x - 2, 54, 12, 4, '#c8bfae');
    fill(ctx, x + 2, 30, 2, 24, '#fffaf0');
  }
  fill(ctx, 12, 20, 80, 10, '#8c3a2a');
  fill(ctx, 24, 12, 56, 10, '#a84834');
  fill(ctx, 36, 4, 32, 10, '#c45a3c');
  fill(ctx, 46, 0, 12, 6, '#e6c27a');
  fill(ctx, 46, 36, 14, 22, '#140e0c');
  fill(ctx, 49, 40, 8, 12, '#ff9a3c');
  fill(ctx, 51, 44, 4, 6, '#fff1c2');
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
  fill(ctx, 8, 40, 10, 8, '#ffb15a');
  fill(ctx, 10, 42, 6, 4, '#fff1c2');
  fill(ctx, 42, 40, 8, 8, '#1c2830');
  return canvas;
}

function paintColumn() {
  const { canvas, ctx } = makeCanvas(16, 48);
  fill(ctx, 1, 40, 14, 8, '#b7aa96');
  fill(ctx, 0, 44, 16, 4, '#8e8474');
  fill(ctx, 3, 8, 10, 34, '#e6dfd2');
  fill(ctx, 5, 10, 2, 28, '#fffaf2');
  fill(ctx, 1, 4, 14, 6, '#f4efe4');
  fill(ctx, 3, 0, 10, 5, '#d8c89a');
  return canvas;
}

function paintRubble() {
  const { canvas, ctx } = makeCanvas(34, 24);
  fill(ctx, 2, 12, 10, 8, '#5a5148');
  fill(ctx, 10, 8, 14, 12, '#7a7064');
  fill(ctx, 20, 14, 12, 8, '#4a433c');
  fill(ctx, 12, 6, 8, 4, '#a39888');
  fill(ctx, 6, 16, 4, 3, '#2e2a26');
  fill(ctx, 16, 18, 6, 3, '#2e2a26');
  return canvas;
}

function paintBrazier() {
  const { canvas, ctx } = makeCanvas(16, 24);
  fill(ctx, 2, 14, 2, 10, '#3a342c');
  fill(ctx, 12, 14, 2, 10, '#3a342c');
  fill(ctx, 7, 16, 2, 8, '#3a342c');
  fill(ctx, 2, 12, 12, 5, '#5a4030');
  fill(ctx, 3, 10, 10, 4, '#2a2118');
  fill(ctx, 5, 4, 6, 8, '#ff7a2a');
  fill(ctx, 6, 1, 4, 6, '#ffd27a');
  fill(ctx, 7, 0, 2, 3, '#fff6d0');
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
  fill(ctx, 4, 10, 24, 42, '#6a6458');
  fill(ctx, 2, 46, 28, 10, '#3e3a34');
  fill(ctx, 2, 52, 28, 4, '#12100e');
  fill(ctx, 4, 10, 24, 3, '#c8c0b0');
  fill(ctx, 2, 4, 8, 8, '#7a7468');
  fill(ctx, 14, 2, 6, 10, '#8a8478');
  fill(ctx, 22, 4, 8, 8, '#7a7468');
  fill(ctx, 6, 0, 6, 4, '#12100e');
  fill(ctx, 20, 0, 6, 4, '#12100e');
  fill(ctx, 13, 28, 6, 8, '#ffb15a');
  fill(ctx, 15, 30, 2, 4, '#fff1c2');
  return canvas;
}

function paintVignette() {
  const { canvas, ctx } = makeCanvas(256, 256);
  const g = ctx.createRadialGradient(128, 128, 80, 128, 128, 150);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return canvas;
}

const PROP_ART = {
  horse: paintHorse,
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

export function buildWorldTextures(scene) {
  addCanvas(scene, 'tiles', paintTileset());
  // 2×2 placeholder. Static boxes stretch this to the size they need.
  addCanvas(scene, 'blank', makeCanvas(2, 2).canvas);
  addCanvas(scene, 'feet', makeCanvas(FEET.w, FEET.h).canvas);
  addCanvas(scene, 'vignette', paintVignette());
  for (const [id, paint] of Object.entries(PROP_ART)) {
    addCanvas(scene, id, paint());
  }
}
