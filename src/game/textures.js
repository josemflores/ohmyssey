// Pictures for Troy, painted pixel by pixel in code. No image files for the scenery.
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

// One pixel.
function dot(ctx, x, y, color) {
  fill(ctx, x, y, 1, 1, color);
}

// A tiny repeatable random generator. The same seed always gives the same
// speckles, so the art looks hand-placed but never changes between loads.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Scatter `count` single pixels of the given colors inside a box.
function speckle(ctx, x, y, w, h, count, colors, seed) {
  const r = rng(seed);
  for (let i = 0; i < count; i += 1) {
    dot(ctx, x + Math.floor(r() * w), y + Math.floor(r() * h), colors[Math.floor(r() * colors.length)]);
  }
}

// ---------------------------------------------------------------------------
// Colors. Everything is painted warm and light. TroyScene lays a blue
// multiply over the ground at night, so these become moonlit stone and earth.
// Sources for the look (see the commit message): Troy VI/VIIa had sloping
// limestone ashlar walls with mudbrick on top, houses with stone socles,
// mudbrick upper walls and flat timber-reed-clay roofs, paved streets, and
// big storage jars (pithoi) sunk in the floors.
// ---------------------------------------------------------------------------
const EARTH = { base: '#e3cfa2', light: '#efdeb6', dark: '#cdb585', deep: '#b89e70' };
const GRASS = ['#9fae5a', '#86984a', '#c2c776', '#6f8040'];
const LIME = { base: '#ddd1bb', light: '#ece3d1', top: '#f6f0e3', dark: '#c4b59b', joint: '#9a8a70' };
const BRICK = { base: '#c9a27a', light: '#d9b48c', dark: '#b08860', mortar: '#9c7650' };
const WOOD = { base: '#8a6038', light: '#a87a4a', dark: '#5e3e22', deep: '#3e2816' };
const CLAY_ROOF = { base: '#d2b48a', light: '#e2c8a0', dark: '#b89870', reed: '#c4a478' };

// Grass tufts: a few blades, lighter on the left where the light comes from.
function tuft(ctx, x, y, big) {
  dot(ctx, x, y, GRASS[1]);
  dot(ctx, x + 1, y - 1, GRASS[0]);
  dot(ctx, x + 2, y, GRASS[1]);
  if (big) {
    dot(ctx, x + 1, y - 2, GRASS[2]);
    dot(ctx, x + 3, y - 1, GRASS[3]);
    dot(ctx, x - 1, y - 1, GRASS[0]);
  }
}

// Beaten earth of the Troad: dry, with pebbles and the odd tuft of grass.
function paintEarth(ctx, x, y, alt) {
  fill(ctx, x, y, 16, 16, EARTH.base);
  speckle(ctx, x, y, 16, 16, 18, [EARTH.light, EARTH.dark], alt ? 11 : 7);
  fill(ctx, x + (alt ? 2 : 9), y + (alt ? 9 : 2), 4, 2, EARTH.light);
  dot(ctx, x + (alt ? 11 : 4), y + (alt ? 4 : 12), EARTH.deep);
  tuft(ctx, x + (alt ? 10 : 3), y + (alt ? 13 : 6), alt);
}

function paintSand(ctx, x, y, alt) {
  // Both sand tiles share one base color so the beach has no checkerboard.
  fill(ctx, x, y, 16, 16, '#f3e3b8');
  speckle(ctx, x, y, 16, 16, 14, ['#fbf0d2', '#e2c98a', '#ead39c'], alt ? 21 : 23);
  // Ripples left by the wind.
  fill(ctx, x + 2, y + (alt ? 5 : 10), 6, 1, '#e6cf98');
  fill(ctx, x + 9, y + (alt ? 11 : 4), 5, 1, '#e6cf98');
}

function paintWet(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#d5c6a0');
  speckle(ctx, x, y, 16, 9, 8, ['#c8b88f', '#e0d2ae'], 31);
  fill(ctx, x, y + 9, 16, 7, '#b4c0b8');
  fill(ctx, x, y + 9, 16, 1, '#9fb0aa');
  fill(ctx, x + 2, y + 11, 6, 1, '#eef6f4');
  fill(ctx, x + 10, y + 13, 4, 1, '#d8e8e6');
}

function paintWater(ctx, x, y, deep) {
  fill(ctx, x, y, 16, 16, deep ? '#163a58' : '#1e5678');
  speckle(ctx, x, y, 16, 16, 6, deep ? ['#1a4262'] : ['#24607f', '#1a4e6e'], deep ? 41 : 43);
  fill(ctx, x + 1, y + 5, 7, 1, deep ? '#1f4a6c' : '#3a7aa0');
  fill(ctx, x + 9, y + 11, 5, 1, deep ? '#1f4a6c' : '#3a7aa0');
  if (!deep) {
    fill(ctx, x + 2, y + 5, 3, 1, '#d5eef4');
    dot(ctx, x + 11, y + 11, '#b8dcea');
  }
}

// The main road: big worn limestone slabs with dark joints and cart ruts.
function paintRoad(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#a8957a');
  const slabs = [
    [0, 0, 9, 7, '#eadab8'],
    [10, 0, 6, 7, '#f2e4c4'],
    [0, 8, 5, 8, '#f0e0be'],
    [6, 8, 10, 8, '#e6d4ae'],
  ];
  for (const [sx, sy, w, h, c] of slabs) {
    fill(ctx, x + sx, y + sy, w, h, c);
    fill(ctx, x + sx, y + sy, w, 1, '#f8f0dc');
    fill(ctx, x + sx, y + sy + h - 1, w, 1, '#d2bf98');
  }
  speckle(ctx, x, y, 16, 16, 8, ['#d8c6a0', '#fbf3e0'], 51);
  // Faint wheel ruts.
  fill(ctx, x + 4, y, 1, 16, 'rgba(120, 100, 70, 0.18)');
  fill(ctx, x + 11, y, 1, 16, 'rgba(120, 100, 70, 0.18)');
}

function paintRoadSide(ctx, x, y) {
  paintSand(ctx, x, y, false);
  fill(ctx, x + 2, y + 3, 5, 4, '#efe0bf');
  fill(ctx, x + 2, y + 6, 5, 1, '#d8c39a');
  fill(ctx, x + 9, y + 9, 5, 4, '#e8d5ae');
  fill(ctx, x + 9, y + 12, 5, 1, '#d2bd92');
  tuft(ctx, x + 12, y + 5, false);
}

// Cobbled city street: rounded stones of several sizes and tones.
function paintPave(ctx, x, y, alt) {
  fill(ctx, x, y, 16, 16, '#8f7b60');
  const r = rng(alt ? 61 : 67);
  const stones = alt
    ? [[0, 0, 5, 5], [6, 0, 5, 4], [12, 0, 4, 5], [0, 6, 4, 5], [5, 5, 6, 5], [12, 6, 4, 4], [0, 12, 6, 4], [7, 11, 4, 5], [12, 11, 4, 5]]
    : [[0, 0, 6, 4], [7, 0, 4, 5], [12, 0, 4, 4], [0, 5, 4, 6], [5, 6, 5, 4], [11, 5, 5, 6], [0, 12, 5, 4], [6, 11, 5, 5], [12, 12, 4, 4]];
  const tones = ['#ecdec4', '#e2d2b4', '#f3e8d4', '#d8c6a4', '#e8d8ba'];
  for (const [sx, sy, w, h] of stones) {
    const c = tones[Math.floor(r() * tones.length)];
    fill(ctx, x + sx, y + sy, w, h, c);
    // Light top-left, shade bottom-right, corners knocked off so they look round.
    fill(ctx, x + sx, y + sy, w, 1, '#faf3e4');
    fill(ctx, x + sx, y + sy + h - 1, w, 1, '#c4b08c');
    fill(ctx, x + sx + w - 1, y + sy, 1, h, '#cdb994');
    dot(ctx, x + sx, y + sy, '#8f7b60');
    dot(ctx, x + sx + w - 1, y + sy + h - 1, '#8f7b60');
  }
}

// Heavy timber gate: two leaves of planks bound with bronze, set in stone jambs.
function paintGateDoor() {
  const { canvas, ctx } = makeCanvas(128, 72);
  // Limestone jambs.
  for (const jx of [0, 120]) {
    fill(ctx, jx, 0, 8, 72, LIME.dark);
    for (let i = 0; i < 6; i += 1) {
      fill(ctx, jx, i * 12, 8, 11, i % 2 ? LIME.base : LIME.light);
      fill(ctx, jx, i * 12, 8, 1, LIME.top);
    }
  }
  for (const [lx, tone] of [[8, WOOD.base], [68, '#7e5632']]) {
    fill(ctx, lx, 0, 52, 68, tone);
    // Vertical planks.
    for (let i = 0; i < 7; i += 1) {
      fill(ctx, lx + i * 7 + 6, 0, 1, 68, WOOD.dark);
      fill(ctx, lx + i * 7, 0, 1, 68, WOOD.light);
    }
    speckle(ctx, lx, 0, 52, 68, 40, [WOOD.dark, WOOD.light, '#6e4a2a'], lx + 3);
    // Bronze bands with studs.
    for (const by of [8, 32, 56]) {
      fill(ctx, lx, by, 52, 4, '#b07a3a');
      fill(ctx, lx, by, 52, 1, '#e0b070');
      fill(ctx, lx, by + 3, 52, 1, '#7a4e22');
      for (let sx = lx + 3; sx < lx + 52; sx += 8) dot(ctx, sx, by + 1, '#f6d898');
    }
  }
  // The seam between the leaves, and a bronze ring on each.
  fill(ctx, 59, 0, 10, 68, WOOD.deep);
  fill(ctx, 63, 0, 2, 68, '#24160c');
  for (const rx of [50, 74]) {
    fill(ctx, rx, 42, 5, 5, '#c08a44');
    fill(ctx, rx + 1, 43, 3, 3, WOOD.deep);
  }
  // Threshold stone.
  fill(ctx, 8, 66, 112, 6, '#8a7a62');
  fill(ctx, 8, 66, 112, 1, '#b8a888');
  return canvas;
}

// Fitted limestone ashlar, the way the Troy VI wall was built.
function ashlar(ctx, x, y, seed) {
  fill(ctx, x, y, 16, 16, LIME.joint);
  const rows = seed % 2
    ? [[0, 0, 7, 5], [8, 0, 8, 5], [0, 6, 4, 5], [5, 6, 7, 5], [13, 6, 3, 5], [0, 12, 9, 4], [10, 12, 6, 4]]
    : [[0, 0, 5, 5], [6, 0, 10, 5], [0, 6, 9, 5], [10, 6, 6, 5], [0, 12, 4, 4], [5, 12, 11, 4]];
  const r = rng(seed);
  const tones = [LIME.base, LIME.light, '#e2d7c2', '#d3c6ae'];
  for (const [bx, by, w, h] of rows) {
    fill(ctx, x + bx, y + by, w, h, tones[Math.floor(r() * tones.length)]);
    fill(ctx, x + bx, y + by, w, 1, LIME.top);
    fill(ctx, x + bx, y + by + h - 1, w, 1, LIME.dark);
  }
  speckle(ctx, x, y, 16, 16, 6, ['#c8baa0', '#f2eadb'], seed + 5);
}

function paintWall(ctx, x, y) {
  ashlar(ctx, x, y, 71);
}

// Top of the wall: a mudbrick breastwork with square merlons, as in Troy VIIa.
function paintBattlement(ctx, x, y) {
  ashlar(ctx, x, y, 72);
  fill(ctx, x, y, 16, 7, BRICK.base);
  fill(ctx, x, y + 3, 16, 1, BRICK.mortar);
  fill(ctx, x + 7, y, 1, 3, BRICK.mortar);
  fill(ctx, x + 3, y + 4, 1, 3, BRICK.mortar);
  fill(ctx, x + 11, y + 4, 1, 3, BRICK.mortar);
  // Notches between the merlons, in cool shadow.
  fill(ctx, x + 5, y, 6, 3, '#8ea0b4');
  fill(ctx, x + 5, y + 3, 6, 1, '#7a8ca2');
  fill(ctx, x, y, 5, 1, BRICK.light);
  fill(ctx, x + 11, y, 5, 1, BRICK.light);
  fill(ctx, x, y + 7, 16, 1, '#9c7a56');
}

// The outer face of the wall slopes outward at the foot. Bright where the
// slope catches the moon, darker at the base.
function paintWallFace(ctx, x, y) {
  ashlar(ctx, x, y, 73);
  fill(ctx, x, y, 16, 3, 'rgba(255, 250, 240, 0.35)');
  fill(ctx, x, y + 10, 16, 6, 'rgba(90, 70, 50, 0.28)');
  fill(ctx, x, y + 15, 16, 1, '#8a7a60');
}

function paintRock(ctx, x, y) {
  paintEarth(ctx, x, y, false);
  // A broken limestone boulder with a shadow to the lower right.
  fill(ctx, x + 2, y + 4, 12, 9, '#cdbc9c');
  fill(ctx, x + 3, y + 3, 9, 8, '#e8dcc4');
  fill(ctx, x + 4, y + 2, 6, 3, '#f6eedf');
  fill(ctx, x + 9, y + 7, 4, 5, '#bba888');
  fill(ctx, x + 6, y + 8, 1, 3, '#a89474');
  dot(ctx, x + 3, y + 12, '#a89474');
}

function paintPebble(ctx, x, y) {
  paintEarth(ctx, x, y, false);
  for (const [px, py] of [[4, 6], [10, 10], [12, 4]]) {
    fill(ctx, x + px, y + py, 3, 2, '#c4b496');
    dot(ctx, x + px, y + py, '#e8dcc4');
    dot(ctx, x + px + 2, y + py + 1, '#9c8a6c');
  }
}

// Weeds at the foot of the wall: taller grass with a few small flowers.
function paintWeed(ctx, x, y) {
  paintEarth(ctx, x, y, true);
  tuft(ctx, x + 2, y + 12, true);
  tuft(ctx, x + 7, y + 9, true);
  tuft(ctx, x + 11, y + 13, true);
  fill(ctx, x + 6, y + 4, 1, 6, GRASS[3]);
  fill(ctx, x + 9, y + 5, 1, 5, GRASS[0]);
  dot(ctx, x + 6, y + 3, '#f4f0e0');
  dot(ctx, x + 9, y + 4, '#f0d060');
  dot(ctx, x + 12, y + 10, '#f4f0e0');
}

// Paving with grass pushing up between the stones.
function paintPaveWeed(ctx, x, y) {
  paintPave(ctx, x, y, true);
  tuft(ctx, x + 4, y + 6, true);
  tuft(ctx, x + 11, y + 11, false);
  fill(ctx, x + 5, y + 10, 1, 1, GRASS[0]);
}

function paintSandWeed(ctx, x, y) {
  paintSand(ctx, x, y, true);
  tuft(ctx, x + 3, y + 12, true);
  tuft(ctx, x + 9, y + 8, true);
  dot(ctx, x + 10, y + 5, '#f4f0e0');
}

function paintPaveCrack(ctx, x, y) {
  paintPave(ctx, x, y, false);
  // A crack running across two stones.
  for (const [cx, cy] of [[3, 2], [4, 3], [5, 4], [5, 5], [6, 6], [7, 7], [8, 8], [8, 9], [9, 10]]) {
    dot(ctx, x + cx, y + cy, '#7a6a52');
  }
  dot(ctx, x + 10, y + 11, '#9a8a70');
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
  painters[T.paveWeed] = paintPaveWeed;
  painters[T.sandWeed] = paintSandWeed;
  painters[T.paveCrack] = paintPaveCrack;
  for (let i = 0; i <= max; i += 1) {
    if (!painters[i]) throw new Error(`Missing painter for tile ${i}`);
    painters[i](ctx, i * 16, 0);
  }
  return canvas;
}

// A column shaft with fluting, lit from the left.
function shaft(ctx, x, y, w, h) {
  fill(ctx, x, y, w, h, '#e8e0d0');
  fill(ctx, x, y, 2, h, '#fffaf2');
  fill(ctx, x + w - 2, y, 2, h, '#b7aa96');
  for (let i = 3; i < w - 2; i += 2) fill(ctx, x + i, y, 1, h, '#d3c8b4');
}

// The temple of Athena on the height of the citadel (Iliad 6). A stone
// podium, a porch of columns, a timber-framed pediment, and a lamp inside.
function paintTemple() {
  const { canvas, ctx } = makeCanvas(104, 80);
  // Stepped podium of ashlar.
  for (let i = 0; i < 3; i += 1) {
    const sx = 6 - i * 3;
    const sy = 56 + i * 7;
    fill(ctx, sx, sy, 104 - sx * 2, 7, i % 2 ? LIME.base : LIME.light);
    fill(ctx, sx, sy, 104 - sx * 2, 1, LIME.top);
    fill(ctx, sx, sy + 6, 104 - sx * 2, 1, LIME.dark);
    for (let jx = sx + 7 + i * 3; jx < 104 - sx; jx += 13) fill(ctx, jx, sy + 1, 1, 5, LIME.joint);
  }
  fill(ctx, 0, 77, 104, 3, '#8f8372');
  // Back wall of the cella in shadow, with the doorway and a small lamp.
  fill(ctx, 10, 30, 84, 26, '#b8ab94');
  fill(ctx, 44, 34, 16, 22, '#2a241c');
  fill(ctx, 46, 36, 12, 20, '#3a3024');
  fill(ctx, 50, 44, 4, 5, '#e8b060');
  dot(ctx, 51, 43, '#fff2c0');
  // Porch columns.
  for (let i = 0; i < 6; i += 1) {
    const cx = 10 + i * 16;
    shaft(ctx, cx, 30, 8, 26);
    fill(ctx, cx - 2, 26, 12, 4, '#faf6ee');
    fill(ctx, cx - 2, 29, 12, 1, '#c8bca6');
    fill(ctx, cx - 1, 54, 10, 2, '#d5cbb8');
  }
  // Architrave and a painted frieze band.
  fill(ctx, 4, 20, 96, 7, '#ece4d4');
  fill(ctx, 4, 20, 96, 1, '#fffaf2');
  fill(ctx, 4, 24, 96, 3, '#7a3a2e');
  for (let fx = 6; fx < 100; fx += 6) fill(ctx, fx, 25, 3, 1, '#e6c27a');
  // Pediment: timber roof with clay tiles, darker underside.
  ctx.fillStyle = '#a84838';
  ctx.beginPath();
  ctx.moveTo(2, 21);
  ctx.lineTo(52, 2);
  ctx.lineTo(102, 21);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c45a42';
  ctx.beginPath();
  ctx.moveTo(12, 19);
  ctx.lineTo(52, 5);
  ctx.lineTo(92, 19);
  ctx.closePath();
  ctx.fill();
  for (let ty = 8; ty < 20; ty += 3) fill(ctx, 30, ty, 44, 1, 'rgba(90, 30, 20, 0.35)');
  fill(ctx, 46, 9, 12, 7, '#e2d4b8');
  fill(ctx, 49, 11, 6, 4, '#c9a24a');
  fill(ctx, 50, 0, 4, 4, '#e6c27a');
  return canvas;
}

// A Trojan house: stone socle, mudbrick walls bound with timber, a flat roof
// of reeds and clay on beams whose ends stick out, and no ground-floor
// windows, only small high ones. The 'alt' house has jars and a reed mat
// on its roof instead of a ladder hatch and an oven chimney.
function paintHouse(variant) {
  const { canvas, ctx } = makeCanvas(60, 64);
  const alt = variant === 'alt';

  // Flat roof, seen from above: packed clay over reeds, with a raised edge.
  fill(ctx, 1, 2, 58, 30, CLAY_ROOF.dark);
  fill(ctx, 2, 3, 56, 27, alt ? '#d8bc94' : CLAY_ROOF.base);
  speckle(ctx, 3, 4, 54, 25, 70, [CLAY_ROOF.light, CLAY_ROOF.reed, CLAY_ROOF.dark], alt ? 81 : 83);
  for (let ry = 7; ry < 28; ry += 5) fill(ctx, 4, ry, 52, 1, 'rgba(150, 120, 80, 0.35)');
  fill(ctx, 1, 2, 58, 2, CLAY_ROOF.light);
  fill(ctx, 1, 2, 2, 30, CLAY_ROOF.light);
  fill(ctx, 57, 2, 2, 30, '#a88a62');
  if (alt) {
    // A pithos and a reed mat drying on the roof.
    fill(ctx, 8, 10, 7, 9, '#b06a3c');
    fill(ctx, 9, 10, 5, 2, '#d08a54');
    fill(ctx, 9, 9, 5, 1, '#6e3e1e');
    fill(ctx, 34, 12, 16, 10, '#c8b070');
    for (let mx = 35; mx < 50; mx += 2) fill(ctx, mx, 12, 1, 10, '#a89050');
  } else {
    // Roof hatch with a ladder poking out.
    fill(ctx, 40, 9, 10, 8, '#4a3626');
    fill(ctx, 41, 10, 8, 6, '#2e2016');
    fill(ctx, 42, 5, 1, 12, WOOD.light);
    fill(ctx, 47, 5, 1, 12, WOOD.light);
    for (let ly = 6; ly < 16; ly += 3) fill(ctx, 42, ly, 6, 1, WOOD.base);
    // Clay oven chimney.
    fill(ctx, 10, 8, 6, 6, '#b89070');
    fill(ctx, 11, 9, 4, 3, '#3a2a20');
  }

  // Roof edge: a row of beam ends under the parapet.
  fill(ctx, 1, 31, 58, 3, WOOD.dark);
  for (let bx = 3; bx < 58; bx += 6) {
    fill(ctx, bx, 31, 3, 3, WOOD.light);
    dot(ctx, bx + 1, 32, WOOD.deep);
  }

  // Mudbrick upper wall with a timber band (timber-laced brick).
  fill(ctx, 2, 34, 56, 14, BRICK.base);
  for (let row = 0; row < 3; row += 1) {
    const by = 35 + row * 4;
    fill(ctx, 2, by + 3, 56, 1, BRICK.mortar);
    for (let bx = 2 + (row % 2) * 4; bx < 58; bx += 8) fill(ctx, bx, by, 1, 3, BRICK.mortar);
  }
  speckle(ctx, 2, 34, 56, 14, 30, [BRICK.light, BRICK.dark], alt ? 91 : 93);
  fill(ctx, 2, 34, 56, 1, '#e0bc94');
  fill(ctx, 2, 46, 56, 2, WOOD.base);
  fill(ctx, 2, 46, 56, 1, WOOD.light);
  // Small high windows with timber frames.
  for (const wx of alt ? [10, 42] : [12]) {
    fill(ctx, wx - 1, 37, 8, 7, WOOD.dark);
    fill(ctx, wx, 38, 6, 5, '#243040');
    fill(ctx, wx + 2, 38, 1, 5, WOOD.base);
    dot(ctx, wx + 4, 39, '#e8b060');
  }

  // Stone socle: rough limestone blocks, like the city wall.
  fill(ctx, 2, 48, 56, 12, LIME.joint);
  const r = rng(alt ? 95 : 97);
  for (let row = 0; row < 2; row += 1) {
    let bx = 2 + (row ? 3 : 0);
    while (bx < 58) {
      const w = Math.min(5 + Math.floor(r() * 6), 58 - bx);
      fill(ctx, bx, 48 + row * 6, w - 1, 5, r() > 0.5 ? LIME.base : '#d0c3aa');
      fill(ctx, bx, 48 + row * 6, w - 1, 1, LIME.light);
      bx += w;
    }
  }

  // Wooden door in a deep stone frame, with a step.
  const dx = alt ? 25 : 34;
  fill(ctx, dx - 2, 38, 14, 22, '#a89474');
  fill(ctx, dx, 40, 10, 20, WOOD.base);
  fill(ctx, dx, 40, 10, 1, WOOD.light);
  fill(ctx, dx + 4, 40, 1, 20, WOOD.dark);
  dot(ctx, dx + 7, 50, '#e0b070');
  fill(ctx, dx - 3, 59, 16, 2, LIME.light);

  // Things by the door: a storage jar and a little bench of planks.
  const jx = alt ? 46 : 8;
  fill(ctx, jx, 51, 7, 9, '#b8743e');
  fill(ctx, jx + 1, 51, 2, 7, '#d6955a');
  fill(ctx, jx + 1, 50, 5, 1, '#6e3e1e');
  fill(ctx, jx + 1, 59, 5, 1, '#7a4a24');
  return canvas;
}

function paintColumn() {
  const { canvas, ctx } = makeCanvas(16, 48);
  fill(ctx, 1, 40, 14, 6, '#d5cbb8');
  fill(ctx, 1, 40, 14, 1, '#f2ebdc');
  fill(ctx, 0, 45, 16, 3, '#a89880');
  shaft(ctx, 3, 9, 10, 31);
  // Capital: a cushion and a square abacus on top.
  fill(ctx, 1, 5, 14, 4, '#f4ede0');
  fill(ctx, 1, 8, 14, 1, '#c8bca6');
  fill(ctx, 0, 1, 16, 4, '#faf6ee');
  fill(ctx, 0, 4, 16, 1, '#b7aa96');
  fill(ctx, 0, 0, 16, 1, '#fffdf8');
  return canvas;
}

function paintRubble() {
  // Fallen limestone blocks with a little grass growing between them.
  const { canvas, ctx } = makeCanvas(34, 24);
  const blocks = [[2, 12, 10, 8], [10, 7, 14, 12], [21, 13, 11, 8]];
  for (const [bx, by, w, h] of blocks) {
    fill(ctx, bx, by, w, h, '#cbb898');
    fill(ctx, bx, by, w - 2, h - 2, '#e8dcc4');
    fill(ctx, bx, by, w - 2, 1, '#f8f2e4');
    fill(ctx, bx + w - 2, by + 1, 2, h - 1, '#b2a080');
  }
  fill(ctx, 15, 9, 1, 6, '#c2b090');
  tuft(ctx, 9, 21, true);
  tuft(ctx, 24, 22, false);
  return canvas;
}

// Storage jars (pithoi), half sunk, the way Troy VIIa houses kept grain,
// oil and wine. A small amphora leans against them.
function paintPithoi() {
  const { canvas, ctx } = makeCanvas(34, 26);
  const jar = (x, y, w, h, base, hi) => {
    fill(ctx, x + 1, y, w - 2, h, base);
    fill(ctx, x, y + 2, w, h - 4, base);
    fill(ctx, x + 1, y + 2, 2, h - 4, hi);
    fill(ctx, x + w - 2, y + 3, 1, h - 5, '#7a4422');
    // Rim and the rope-pattern bands potters pressed into the clay.
    fill(ctx, x + 2, y - 1, w - 4, 2, '#6e3e1e');
    fill(ctx, x + 3, y - 1, w - 6, 1, hi);
    fill(ctx, x, y + Math.floor(h / 2), w, 1, '#8a5028');
    for (let i = x + 1; i < x + w - 1; i += 2) dot(ctx, i, y + Math.floor(h / 2) - 1, '#d89a62');
  };
  jar(2, 6, 12, 17, '#b8743e', '#dc9a5e');
  jar(14, 3, 13, 20, '#a8683a', '#d08c52');
  // Amphora leaning on the right.
  fill(ctx, 27, 10, 5, 12, '#c48a54');
  fill(ctx, 28, 8, 3, 2, '#c48a54');
  fill(ctx, 27, 10, 1, 10, '#e0aa74');
  fill(ctx, 32, 11, 1, 4, '#8a5028');
  fill(ctx, 28, 22, 3, 2, '#8a5028');
  return canvas;
}

function paintBrazier() {
  // Bronze bowl on a tripod. Empty: the city is not burning.
  const { canvas, ctx } = makeCanvas(16, 24);
  fill(ctx, 3, 14, 1, 9, '#6a4a28');
  fill(ctx, 12, 14, 1, 9, '#6a4a28');
  fill(ctx, 7, 15, 2, 8, '#7a5630');
  fill(ctx, 1, 11, 14, 5, '#a8743a');
  fill(ctx, 1, 11, 14, 1, '#e0b070');
  fill(ctx, 2, 15, 12, 1, '#6a4422');
  fill(ctx, 3, 9, 10, 3, '#3a2a1c');
  fill(ctx, 5, 10, 6, 1, '#7a6a5a');
  return canvas;
}

function paintCypress() {
  const { canvas, ctx } = makeCanvas(16, 44);
  fill(ctx, 7, 34, 2, 9, '#4a3420');
  fill(ctx, 7, 34, 1, 9, '#6a4c30');
  // Tall flame-shaped crown in clumps, light on the left.
  const greens = ['#1e3a2c', '#2a4a36', '#3e6a50', '#173024'];
  const clumps = [[3, 24, 10, 12], [4, 16, 8, 11], [5, 8, 6, 10], [6, 2, 4, 8], [7, 0, 2, 3]];
  for (const [cx, cy, w, h] of clumps) {
    fill(ctx, cx, cy, w, h, greens[0]);
    fill(ctx, cx, cy + 1, Math.ceil(w / 2), h - 2, greens[1]);
    fill(ctx, cx, cy + 2, 1, h - 4, greens[2]);
  }
  speckle(ctx, 3, 2, 10, 34, 22, [greens[2], greens[3], '#4e7a5c'], 101);
  return canvas;
}

// A broad Valonia oak, the tree of the Troad. The Iliad keeps an oak by
// the Scaean gate.
function paintOak() {
  const { canvas, ctx } = makeCanvas(40, 44);
  // Trunk and two branches.
  fill(ctx, 18, 26, 5, 16, '#5a3e24');
  fill(ctx, 18, 26, 2, 16, '#7a5634');
  fill(ctx, 14, 26, 4, 2, '#5a3e24');
  fill(ctx, 23, 24, 4, 2, '#5a3e24');
  fill(ctx, 16, 40, 9, 2, '#5a3e24');
  // Crown: overlapping rounded clumps.
  const clumps = [[4, 12, 14, 14], [14, 4, 16, 16], [24, 12, 14, 14], [10, 16, 20, 12]];
  for (const [cx, cy, w, h] of clumps) {
    fill(ctx, cx + 2, cy, w - 4, h, '#4a6a34');
    fill(ctx, cx, cy + 2, w, h - 4, '#4a6a34');
    fill(ctx, cx + 2, cy + 1, w - 6, 4, '#6e8a44');
    fill(ctx, cx + w - 3, cy + 3, 2, h - 5, '#344c26');
  }
  speckle(ctx, 2, 4, 36, 24, 60, ['#86a050', '#3a5428', '#a2b862'], 111);
  return canvas;
}

// Olive tree: twisted gray trunk, silvery-green leaves.
function paintOlive() {
  const { canvas, ctx } = makeCanvas(32, 36);
  fill(ctx, 14, 20, 4, 14, '#7a6c5a');
  fill(ctx, 13, 26, 2, 8, '#8e8070');
  fill(ctx, 17, 18, 3, 4, '#6a5e4e');
  fill(ctx, 12, 32, 9, 2, '#6a5e4e');
  const clumps = [[3, 8, 12, 12], [12, 2, 14, 13], [19, 10, 11, 10]];
  for (const [cx, cy, w, h] of clumps) {
    fill(ctx, cx + 1, cy, w - 2, h, '#7c8c5a');
    fill(ctx, cx, cy + 1, w, h - 2, '#7c8c5a');
    fill(ctx, cx + 1, cy + 1, w - 4, 3, '#a4b080');
  }
  speckle(ctx, 2, 2, 28, 20, 50, ['#b8c498', '#5e6e42', '#94a272'], 121);
  return canvas;
}

function paintTower() {
  // Rectangular stone tower with a mudbrick top and timber floor beams.
  const { canvas, ctx } = makeCanvas(32, 56);
  for (let ty = 14; ty < 52; ty += 16) ashlar(ctx, 3, ty, 130 + ty);
  for (let ty = 14; ty < 52; ty += 16) ashlar(ctx, 13, ty, 140 + ty);
  // Batter: the foot spreads out.
  fill(ctx, 1, 44, 30, 9, LIME.base);
  fill(ctx, 1, 44, 30, 1, LIME.top);
  fill(ctx, 1, 52, 30, 1, LIME.joint);
  fill(ctx, 25, 14, 4, 38, 'rgba(80, 70, 60, 0.25)');
  // Timber band and mudbrick top with merlons.
  fill(ctx, 3, 12, 26, 2, WOOD.base);
  for (let bx = 4; bx < 28; bx += 5) dot(ctx, bx, 12, WOOD.light);
  fill(ctx, 3, 4, 26, 8, BRICK.base);
  fill(ctx, 3, 7, 26, 1, BRICK.mortar);
  for (let bx = 5; bx < 28; bx += 6) fill(ctx, bx, 8, 1, 4, BRICK.mortar);
  fill(ctx, 3, 0, 6, 4, BRICK.light);
  fill(ctx, 13, 0, 6, 4, BRICK.light);
  fill(ctx, 23, 0, 6, 4, BRICK.base);
  fill(ctx, 9, 0, 4, 4, '#8ea0b4');
  fill(ctx, 19, 0, 4, 4, '#8ea0b4');
  // A narrow window with lamplight.
  fill(ctx, 14, 26, 4, 7, '#2a2018');
  fill(ctx, 15, 28, 2, 4, '#e8c080');
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

// Four frames of a roof fire, 16x24 each. Each frame is a flame shape in
// layers (dark red, orange, yellow, a white-hot core) that leans differently,
// so playing them in a loop makes the fire dance.
function paintFire() {
  const { canvas, ctx } = makeCanvas(64, 24);
  const layers = [
    [1.0, '#b8281a'],
    [0.78, '#ec5a1e'],
    [0.56, '#ff9e30'],
    [0.34, '#ffd866'],
    [0.16, '#fff6d4'],
  ];
  const leans = [0, 1.2, -0.8, 0.6];
  const heights = [22, 20, 23, 19];
  for (let frame = 0; frame < 4; frame += 1) {
    const ox = frame * 16;
    for (const [scale, color] of layers) {
      const h = heights[frame] * scale;
      for (let y = 0; y < h; y += 1) {
        const t = y / h; // 0 at the base, 1 at the tip
        const half = 6.5 * scale * (1 - t) ** 0.8;
        const lean = leans[frame] * t * 4 + Math.sin(y * 0.9 + frame) * 0.6;
        const x0 = Math.round(8 - half + lean);
        const w = Math.max(1, Math.round(half * 2));
        fill(ctx, ox + x0, 23 - y, w, 1, color);
      }
    }
    // A loose spark above the flame.
    dot(ctx, ox + 6 + frame * 2, 1 + (frame % 2), '#ffd866');
  }
  return canvas;
}

// A soft round puff of smoke, drawn in rings so it stays pixel art.
function paintSmoke() {
  const { canvas, ctx } = makeCanvas(16, 16);
  const rings = [[7, '#3a3236'], [5, '#4a4046'], [3, '#5a5056']];
  for (const [r, color] of rings) {
    for (let y = -r; y <= r; y += 1) {
      const half = Math.round(Math.sqrt(r * r - y * y));
      fill(ctx, 8 - half, 8 + y, half * 2, 1, color);
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
  house: () => paintHouse('main'),
  houseAlt: () => paintHouse('alt'),
  pithoi: paintPithoi,
  oak: paintOak,
  olive: paintOlive,
  column: paintColumn,
  rubble: paintRubble,
  brazier: paintBrazier,
  cypress: paintCypress,
  tower: paintTower,
  'gate-door': paintGateDoor,
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
  // Burning houses (burning.js).
  addSheet(scene, 'fire', paintFire(), 16, 24);
  addCanvas(scene, 'smoke', paintSmoke());
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
