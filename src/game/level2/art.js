// Pictures for Level 2 (Ithaca), drawn with rectangles on canvases, the
// same way Troy's textures.js does it. No image files except Penelope and
// the lighthouse, which the scene loads from public/assets.
//
// Ground is painted warm and light. The scene lays a blue multiply over it,
// so moonlight comes from the grade, not from black paint.
// Light comes from the upper left: highlights on the left and top edges,
// shade on the right and bottom.

import Phaser from 'phaser';
import { L2 } from './map.js';
import { trimBottom } from '../textures.js';

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

function dots(ctx, x, y, list, color) {
  for (const [dx, dy] of list) fill(ctx, x + dx, y + dy, 1, 1, color);
}

// ---- Tiles ---------------------------------------------------------------

function paintGrass(ctx, x, y, variant) {
  fill(ctx, x, y, 16, 16, variant === 1 ? '#a9b57a' : '#b2bd82');
  // Tufts: a dark blade with a lit tip.
  const tufts = variant === 1
    ? [[2, 3], [9, 2], [12, 9], [4, 11], [7, 7]]
    : [[3, 4], [11, 3], [6, 10], [13, 12]];
  for (const [dx, dy] of tufts) {
    fill(ctx, x + dx, y + dy, 1, 3, '#8c9860');
    fill(ctx, x + dx + 1, y + dy + 1, 1, 2, '#98a46a');
    fill(ctx, x + dx, y + dy, 1, 1, '#dde3ae');
  }
  if (variant === 1) fill(ctx, x + 5, y + 13, 6, 2, '#b3bb80');
}

function paintFlowers(ctx, x, y) {
  paintGrass(ctx, x, y, 0);
  dots(ctx, x, y, [[4, 3], [10, 6], [6, 12], [13, 13]], '#fff6e6');
  dots(ctx, x, y, [[5, 3], [11, 6]], '#e8b4c4');
  dots(ctx, x, y, [[7, 12], [12, 13]], '#f0d48a');
}

function paintScrub(ctx, x, y) {
  paintGrass(ctx, x, y, 1);
  // A low thyme bush.
  fill(ctx, x + 3, y + 7, 10, 6, '#8e9a62');
  fill(ctx, x + 4, y + 6, 8, 2, '#a6b276');
  fill(ctx, x + 5, y + 6, 3, 1, '#c6d094');
  fill(ctx, x + 4, y + 13, 9, 1, '#7e8a56');
  dots(ctx, x, y, [[6, 9], [10, 8], [8, 11]], '#d8c4e8');
}

function paintPath(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#e6d3a8');
  fill(ctx, x + 1, y + 2, 6, 3, '#efdfba');
  fill(ctx, x + 9, y + 9, 5, 3, '#efdfba');
  dots(ctx, x, y, [[4, 9], [12, 4], [7, 13], [2, 6]], '#c6b088');
  dots(ctx, x, y, [[5, 9], [13, 4]], '#f6ecd2');
  // Cart ruts, faint.
  fill(ctx, x + 4, y, 1, 16, '#dcc79c');
  fill(ctx, x + 11, y, 1, 16, '#dcc79c');
}

function paintPathEdge(ctx, x, y) {
  paintGrass(ctx, x, y, 0);
  fill(ctx, x + 2, y + 2, 12, 12, '#dccb9e');
  fill(ctx, x + 4, y + 1, 8, 14, '#dccb9e');
  fill(ctx, x + 1, y + 4, 14, 8, '#dccb9e');
  dots(ctx, x, y, [[1, 1], [14, 2], [2, 14], [13, 13]], '#8c9860');
  dots(ctx, x, y, [[6, 6], [10, 10]], '#c6b088');
}

function paintSand(ctx, x, y, alt) {
  fill(ctx, x, y, 16, 16, alt ? '#f1dfb0' : '#f5e6bf');
  fill(ctx, x + (alt ? 3 : 10), y + (alt ? 10 : 4), 3, 2, '#e0c68a');
  dots(ctx, x, y, alt ? [[12, 3], [6, 6]] : [[3, 12], [8, 8]], '#fff4da');
  if (alt) {
    // A shell.
    fill(ctx, x + 10, y + 11, 3, 2, '#f8e8e0');
    fill(ctx, x + 11, y + 11, 1, 1, '#d8a890');
  }
}

function paintWet(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#d6c8a2');
  fill(ctx, x, y + 9, 16, 7, '#b4c4c2');
  fill(ctx, x + 1, y + 9, 6, 1, '#eef8f6');
  fill(ctx, x + 9, y + 11, 5, 1, '#dcefee');
}

function paintWater(ctx, x, y, deep) {
  fill(ctx, x, y, 16, 16, deep ? '#163a58' : '#1d5577');
  fill(ctx, x, y + 5, 16, 2, deep ? '#1b4566' : '#2c6b90');
  fill(ctx, x, y + 12, 16, 1, deep ? '#1b4566' : '#28648a');
  if (!deep) {
    fill(ctx, x + 2, y + 5, 5, 1, '#d5eef4');
    fill(ctx, x + 10, y + 12, 3, 1, '#a8d4e4');
  } else {
    fill(ctx, x + 9, y + 5, 3, 1, '#4a7ea0');
  }
}

function paintRock(ctx, x, y) {
  // Grey limestone of the hills: rounded stones with dark crevices and a
  // little moss, so an outcrop reads as rock, not as paving.
  fill(ctx, x, y, 16, 16, '#8e8270');
  const stones = [
    [0, 0, 9, 8], [9, 1, 7, 7], [1, 8, 7, 8], [8, 9, 8, 7],
  ];
  for (const [sx, sy, w, h] of stones) {
    fill(ctx, x + sx + 1, y + sy, w - 2, h, '#d6cbb4');
    fill(ctx, x + sx, y + sy + 1, w, h - 2, '#d6cbb4');
    fill(ctx, x + sx + 1, y + sy + 1, w - 3, 2, '#ece4d2');
    fill(ctx, x + sx + 1, y + sy + h - 2, w - 2, 1, '#b4a890');
    fill(ctx, x + sx + w - 2, y + sy + 2, 1, h - 3, '#c0b49c');
  }
  dots(ctx, x, y, [[8, 8], [3, 7], [13, 8], [7, 15]], '#8a9a62');
}

function paintCliffFace(ctx, x, y) {
  // The drop at the edge of a cliff: vertical strata, shade at the foot.
  fill(ctx, x, y, 16, 16, '#a89a84');
  fill(ctx, x, y, 16, 3, '#e2d8c4');
  fill(ctx, x, y, 16, 1, '#f6f0e2');
  fill(ctx, x + 2, y + 3, 3, 10, '#bcae96');
  fill(ctx, x + 8, y + 3, 2, 11, '#bcae96');
  fill(ctx, x + 12, y + 3, 3, 9, '#b4a68e');
  fill(ctx, x, y + 13, 16, 3, '#7e7262');
}

function paintPave(ctx, x, y, alt) {
  // Same family as Troy's paving: dark joints, pale stones.
  fill(ctx, x, y, 16, 16, '#8f7b60');
  if (!alt) {
    fill(ctx, x, y, 7, 6, '#f0e2c8');
    fill(ctx, x + 8, y, 8, 7, '#e2cea8');
    fill(ctx, x, y + 7, 8, 9, '#f4e8d0');
    fill(ctx, x + 9, y + 8, 7, 8, '#dac298');
  } else {
    fill(ctx, x, y, 5, 9, '#f2e6d0');
    fill(ctx, x + 6, y, 10, 5, '#e6d0ac');
    fill(ctx, x + 6, y + 6, 10, 10, '#ecd8b4');
    fill(ctx, x, y + 10, 5, 6, '#d6be94');
  }
}

function paintWallTop(ctx, x, y) {
  // Top of the palace wall: warm ashlar blocks, lit edge on top.
  fill(ctx, x, y, 16, 16, '#b8a586');
  fill(ctx, x + 1, y + 1, 14, 6, '#ecdcbc');
  fill(ctx, x + 1, y + 9, 6, 6, '#e0ceaa');
  fill(ctx, x + 8, y + 9, 7, 6, '#e6d6b4');
  fill(ctx, x + 1, y + 1, 14, 1, '#faf0da');
}

function paintWallFace(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#cdb994');
  fill(ctx, x, y, 16, 3, '#efe0c2');
  fill(ctx, x, y, 16, 1, '#faf0da');
  fill(ctx, x, y + 7, 16, 1, '#a8946e');
  fill(ctx, x + 7, y + 3, 1, 4, '#a8946e');
  fill(ctx, x + 3, y + 8, 1, 5, '#a8946e');
  fill(ctx, x + 12, y + 8, 1, 5, '#a8946e');
  fill(ctx, x, y + 13, 16, 3, '#8a7656');
}

function paintFenceH(ctx, x, y) {
  paintMud(ctx, x, y);
  fill(ctx, x, y + 5, 16, 2, '#8a6440');
  fill(ctx, x, y + 10, 16, 2, '#7a5636');
  fill(ctx, x, y + 5, 16, 1, '#b48a5c');
  fill(ctx, x + 2, y + 2, 3, 13, '#6a4a2c');
  fill(ctx, x + 2, y + 2, 1, 13, '#a07a4e');
  fill(ctx, x + 11, y + 2, 3, 13, '#6a4a2c');
  fill(ctx, x + 11, y + 2, 1, 13, '#a07a4e');
}

function paintFenceV(ctx, x, y) {
  paintMud(ctx, x, y);
  fill(ctx, x + 6, y, 3, 16, '#7a5636');
  fill(ctx, x + 6, y, 1, 16, '#b48a5c');
  fill(ctx, x + 5, y + 3, 5, 3, '#6a4a2c');
  fill(ctx, x + 5, y + 11, 5, 3, '#6a4a2c');
}

function paintMud(ctx, x, y) {
  fill(ctx, x, y, 16, 16, '#bca07a');
  fill(ctx, x + 2, y + 3, 6, 3, '#a88c66');
  fill(ctx, x + 9, y + 10, 5, 3, '#a88c66');
  dots(ctx, x, y, [[4, 11], [12, 4]], '#d4bc94');
  dots(ctx, x, y, [[10, 6]], '#9aa872');
}

function paintTileset() {
  const max = Math.max(...Object.values(L2));
  const { canvas, ctx } = makeCanvas((max + 1) * 16, 16);
  const painters = [];
  painters[L2.grass] = (c, x, y) => paintGrass(c, x, y, 0);
  painters[L2.grassAlt] = (c, x, y) => paintGrass(c, x, y, 1);
  painters[L2.flowers] = paintFlowers;
  painters[L2.scrub] = paintScrub;
  painters[L2.path] = paintPath;
  painters[L2.pathEdge] = paintPathEdge;
  painters[L2.sand] = (c, x, y) => paintSand(c, x, y, false);
  painters[L2.sandAlt] = (c, x, y) => paintSand(c, x, y, true);
  painters[L2.wet] = paintWet;
  painters[L2.water] = (c, x, y) => paintWater(c, x, y, false);
  painters[L2.waterDeep] = (c, x, y) => paintWater(c, x, y, true);
  painters[L2.rock] = paintRock;
  painters[L2.cliffFace] = paintCliffFace;
  painters[L2.pave] = (c, x, y) => paintPave(c, x, y, false);
  painters[L2.paveAlt] = (c, x, y) => paintPave(c, x, y, true);
  painters[L2.wallTop] = paintWallTop;
  painters[L2.wallFace] = paintWallFace;
  painters[L2.fenceH] = paintFenceH;
  painters[L2.fenceV] = paintFenceV;
  painters[L2.mud] = paintMud;
  for (let i = 0; i <= max; i += 1) {
    if (!painters[i]) throw new Error(`Level 2: missing painter for tile ${i}`);
    painters[i](ctx, i * 16, 0);
  }
  return canvas;
}

// ---- Props ---------------------------------------------------------------

// The palace of Odysseus: a megaron with a columned porch. 192×120.
// The suitors feast inside, so the doorway and windows glow warm (lamps,
// not fire).
function paintPalace() {
  const W = 192;
  const H = 120;
  const { canvas, ctx } = makeCanvas(W, H);
  // Hall body.
  fill(ctx, 12, 34, 168, 66, '#e8dcc4');
  fill(ctx, 160, 34, 20, 66, '#cbbca0');
  fill(ctx, 12, 34, 4, 66, '#faf2e2');
  // Stone courses on the hall walls.
  for (let i = 0; i < 5; i += 1) fill(ctx, 16, 44 + i * 11, 144, 1, '#cbbca0');
  // Roof: deep terracotta, ridge tiles, gable.
  fill(ctx, 4, 22, 184, 14, '#9c3b2e');
  fill(ctx, 18, 12, 156, 12, '#b24a3a');
  fill(ctx, 40, 4, 112, 10, '#c45a42');
  fill(ctx, 72, 0, 48, 6, '#d47858');
  for (let i = 0; i < 23; i += 1) fill(ctx, 8 + i * 8, 24, 1, 11, '#7a2c22');
  for (let i = 0; i < 19; i += 1) fill(ctx, 22 + i * 8, 14, 1, 9, '#8c3428');
  fill(ctx, 4, 34, 184, 2, '#5a2018');
  // Gilded acroterion on the gable.
  fill(ctx, 92, 0, 8, 3, '#e6c27a');
  fill(ctx, 94, 0, 4, 1, '#fff0c0');
  // Porch roof (pediment strip) over the columns.
  fill(ctx, 40, 44, 112, 8, '#d9cbb0');
  fill(ctx, 40, 44, 112, 2, '#f6ecd8');
  fill(ctx, 40, 50, 112, 2, '#a8987c');
  // Meander band on the porch beam.
  for (let i = 0; i < 13; i += 1) {
    const bx = 44 + i * 8;
    fill(ctx, bx, 47, 6, 1, '#9c3b2e');
    fill(ctx, bx + 5, 47, 1, 3, '#9c3b2e');
  }
  // Porch floor and steps.
  fill(ctx, 36, 96, 120, 6, '#e4d6bc');
  fill(ctx, 30, 102, 132, 6, '#d8c8aa');
  fill(ctx, 24, 108, 144, 6, '#ccbc9c');
  fill(ctx, 36, 96, 120, 1, '#faf2e2');
  fill(ctx, 30, 102, 132, 1, '#f2e6cc');
  fill(ctx, 24, 108, 144, 1, '#ece0c4');
  fill(ctx, 20, 114, 152, 6, '#8f8068');
  // Deep porch shade behind the columns.
  fill(ctx, 44, 52, 104, 44, '#5a4c3c');
  // Great doorway, warm light from the feast.
  fill(ctx, 82, 58, 28, 38, '#2a1e14');
  fill(ctx, 86, 62, 20, 34, '#c8803c');
  fill(ctx, 88, 66, 16, 30, '#e8a858');
  fill(ctx, 92, 72, 8, 24, '#f8d08a');
  // Shadows of the suitors moving inside.
  fill(ctx, 89, 78, 3, 18, '#7a4420');
  fill(ctx, 99, 74, 4, 22, '#6a3a1a');
  // Side windows, small and warm.
  for (const wx of [24, 154]) {
    fill(ctx, wx, 62, 12, 14, '#2a1e14');
    fill(ctx, wx + 2, 64, 8, 10, '#d8964a');
    fill(ctx, wx + 3, 66, 3, 4, '#f6c87a');
    fill(ctx, wx, 76, 12, 2, '#cbbca0');
  }
  // Columns: painted red shafts with pale capitals, like Knossos.
  for (let i = 0; i < 6; i += 1) {
    const cx = 48 + i * 19;
    fill(ctx, cx - 1, 52, 12, 4, '#f4ead4');
    fill(ctx, cx - 1, 52, 12, 1, '#fffaf0');
    fill(ctx, cx + 1, 56, 8, 38, '#a84838');
    fill(ctx, cx + 1, 56, 2, 38, '#cc6a50');
    fill(ctx, cx + 7, 56, 2, 38, '#7a2c22');
    fill(ctx, cx, 92, 10, 4, '#e4d6bc');
  }
  return canvas;
}

// Whitewashed island house with a flat terracotta roof. 60×64.
function paintIslandHouse(door, shutter) {
  const { canvas, ctx } = makeCanvas(60, 64);
  // Walls.
  fill(ctx, 4, 24, 52, 36, '#f4ecdc');
  fill(ctx, 44, 24, 12, 36, '#d8cebc');
  fill(ctx, 4, 24, 3, 36, '#fffaf0');
  // Roof: a low overhang of tiles, then a flat roof terrace above.
  fill(ctx, 0, 14, 60, 12, '#b24a3a');
  fill(ctx, 0, 14, 60, 2, '#d06a50');
  for (let i = 0; i < 8; i += 1) fill(ctx, 3 + i * 8, 16, 1, 10, '#7a2c22');
  fill(ctx, 0, 24, 60, 2, '#5a2018');
  fill(ctx, 8, 2, 44, 14, '#e8dcc4');
  fill(ctx, 8, 2, 44, 2, '#fffaf0');
  fill(ctx, 40, 2, 12, 14, '#cbbca0');
  // A potted herb on the roof terrace.
  fill(ctx, 14, 6, 6, 5, '#a84838');
  fill(ctx, 13, 2, 8, 5, '#6e8a52');
  fill(ctx, 14, 2, 3, 2, '#94b070');
  // Door.
  fill(ctx, 24, 40, 14, 20, '#2a1e14');
  fill(ctx, 26, 42, 10, 18, door);
  fill(ctx, 26, 42, 2, 18, '#ffffff22');
  fill(ctx, 33, 50, 2, 2, '#e6c27a');
  // Windows with shutters.
  for (const wx of [10, 44]) {
    fill(ctx, wx, 32, 8, 9, '#1e2632');
    fill(ctx, wx - 3, 32, 3, 9, shutter);
    fill(ctx, wx + 8, 32, 3, 9, shutter);
  }
  // A small warm light in one window. Someone is still awake.
  fill(ctx, 46, 35, 3, 4, '#f0c070');
  // Foundation.
  fill(ctx, 2, 58, 56, 6, '#a8987c');
  fill(ctx, 2, 58, 56, 1, '#d8ccb4');
  return canvas;
}

// Eumaeus' swineherd hut: stone walls, thatched roof. 72×60.
function paintHut() {
  const { canvas, ctx } = makeCanvas(72, 60);
  // Dry-stone walls.
  fill(ctx, 6, 28, 60, 28, '#bfb196');
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const bx = 7 + col * 7 + (row % 2) * 3;
      if (bx > 60) continue;
      fill(ctx, bx, 29 + row * 7, 6, 5, row % 2 ? '#d8ccb2' : '#e2d6bc');
    }
  }
  fill(ctx, 58, 28, 8, 28, '#9e9078');
  // Thatch: layered straw, darker underneath.
  fill(ctx, 0, 16, 72, 16, '#b89858');
  fill(ctx, 4, 8, 64, 12, '#ccae6a');
  fill(ctx, 14, 2, 44, 10, '#dcc080');
  fill(ctx, 26, 0, 20, 4, '#e8d094');
  for (let i = 0; i < 17; i += 1) fill(ctx, 2 + i * 4, 18 + (i % 3), 1, 12, '#9a7c44');
  for (let i = 0; i < 14; i += 1) fill(ctx, 8 + i * 4, 9 + (i % 2), 1, 9, '#b4964e');
  fill(ctx, 0, 30, 72, 2, '#6a5430');
  // Door with a warm hearth glow inside.
  fill(ctx, 30, 38, 14, 18, '#2a1e14');
  fill(ctx, 32, 42, 10, 14, '#a8642c');
  fill(ctx, 34, 48, 6, 8, '#e8a050');
  // A crook leaning by the door.
  fill(ctx, 48, 30, 1, 26, '#7a5636');
  fill(ctx, 48, 30, 4, 1, '#7a5636');
  fill(ctx, 51, 30, 1, 3, '#7a5636');
  // Ground line.
  fill(ctx, 4, 56, 64, 4, '#7e7262');
  return canvas;
}

// Silver-green olive tree with a twisted trunk. 32×44.
function paintOlive() {
  const { canvas, ctx } = makeCanvas(32, 44);
  // Trunk, gnarled.
  fill(ctx, 13, 26, 6, 18, '#6a5440');
  fill(ctx, 11, 38, 10, 6, '#5a4634');
  fill(ctx, 13, 26, 2, 16, '#8e7660');
  fill(ctx, 18, 22, 3, 10, '#5a4634');
  fill(ctx, 10, 24, 3, 8, '#6a5440');
  // Canopy: several soft clumps.
  const clumps = [
    [2, 10, 12, 12], [10, 4, 14, 12], [18, 10, 12, 12], [6, 16, 20, 10], [12, 0, 8, 6],
  ];
  for (const [x, y, w, h] of clumps) {
    fill(ctx, x, y + 1, w, h - 1, '#7e9070');
    fill(ctx, x + 1, y, w - 2, h - 2, '#94a684');
    fill(ctx, x + 1, y, Math.floor(w / 2), 2, '#bccaa8');
  }
  // Silver undersides of leaves catch the moon.
  for (const [x, y] of [[5, 13], [14, 6], [22, 13], [10, 19], [19, 19], [16, 2]]) {
    fill(ctx, x, y, 2, 1, '#dce6cc');
  }
  // Dark olives.
  for (const [x, y] of [[8, 17], [21, 16], [15, 11]]) fill(ctx, x, y, 1, 1, '#2a3020');
  fill(ctx, 6, 24, 20, 2, '#5e6e52');
  return canvas;
}

function paintCypress() {
  const { canvas, ctx } = makeCanvas(16, 48);
  fill(ctx, 6, 38, 4, 10, '#3a2a18');
  fill(ctx, 3, 24, 10, 16, '#2a4a36');
  fill(ctx, 4, 12, 8, 16, '#335a42');
  fill(ctx, 5, 4, 6, 12, '#2a4a36');
  fill(ctx, 7, 0, 2, 6, '#1e3a2c');
  fill(ctx, 5, 14, 2, 14, '#4e7a5e');
  fill(ctx, 4, 26, 2, 10, '#46705a');
  return canvas;
}

// Town well: round stone curb, wooden frame, rope and bucket. 32×36.
function paintWell() {
  const { canvas, ctx } = makeCanvas(32, 36);
  // Frame posts and beam.
  fill(ctx, 4, 2, 3, 22, '#6a4a2c');
  fill(ctx, 25, 2, 3, 22, '#6a4a2c');
  fill(ctx, 4, 2, 1, 22, '#a07a4e');
  fill(ctx, 2, 2, 28, 3, '#7a5636');
  fill(ctx, 2, 2, 28, 1, '#b48a5c');
  // Rope and bucket.
  fill(ctx, 15, 5, 1, 12, '#d8c49a');
  fill(ctx, 12, 14, 8, 6, '#8a6440');
  fill(ctx, 12, 14, 8, 1, '#b48a5c');
  // Stone curb.
  fill(ctx, 2, 20, 28, 14, '#cfc4ae');
  fill(ctx, 4, 18, 24, 4, '#e8dfcc');
  fill(ctx, 6, 19, 20, 2, '#1a2230');
  fill(ctx, 2, 24, 28, 1, '#a89a84');
  fill(ctx, 9, 24, 1, 10, '#a89a84');
  fill(ctx, 18, 24, 1, 10, '#a89a84');
  fill(ctx, 2, 20, 2, 14, '#f0e8d8');
  fill(ctx, 24, 20, 6, 14, '#b4a68e');
  fill(ctx, 2, 32, 28, 4, '#8a7e6a');
  return canvas;
}

// Three clay amphorae leaning together. 24×26.
function paintAmphorae() {
  const { canvas, ctx } = makeCanvas(24, 26);
  const jar = (x, y, h, body, hi) => {
    fill(ctx, x + 2, y, 4, 2, body);
    fill(ctx, x + 3, y + 2, 2, 2, body);
    fill(ctx, x, y + 4, 8, h - 6, body);
    fill(ctx, x + 1, y + 3, 6, 1, body);
    fill(ctx, x + 2, y + h - 2, 4, 2, body);
    fill(ctx, x + 1, y + 5, 2, h - 8, hi);
    fill(ctx, x, y + 8, 8, 1, '#3a1e14');
    fill(ctx, x - 1, y + 3, 1, 3, body);
    fill(ctx, x + 8, y + 3, 1, 3, body);
  };
  jar(1, 6, 18, '#b4603c', '#d8865c');
  jar(14, 7, 17, '#a85634', '#cc7a52');
  jar(7, 2, 22, '#c06a44', '#e09468');
  fill(ctx, 0, 24, 24, 2, '#6a4a34');
  return canvas;
}

// Haystack. 32×22.
function paintHay() {
  const { canvas, ctx } = makeCanvas(32, 22);
  fill(ctx, 2, 8, 28, 12, '#c8a860');
  fill(ctx, 6, 3, 20, 8, '#dcc078');
  fill(ctx, 10, 0, 12, 4, '#e8d094');
  for (let i = 0; i < 7; i += 1) fill(ctx, 4 + i * 4, 9 + (i % 2), 1, 9, '#a8884a');
  fill(ctx, 6, 3, 8, 1, '#f6e4b0');
  fill(ctx, 0, 20, 32, 2, '#7e6a3e');
  return canvas;
}

// The Phaeacian ship that carried him home: dark hull, painted eye,
// mast with the sail furled. Bow points west. 128×72.
function paintShip() {
  const { canvas, ctx } = makeCanvas(128, 72);
  // Mast and yard.
  fill(ctx, 70, 2, 3, 46, '#6a4a2c');
  fill(ctx, 70, 2, 1, 46, '#a07a4e');
  fill(ctx, 40, 10, 64, 3, '#7a5636');
  // Furled sail lashed to the yard.
  fill(ctx, 42, 13, 60, 5, '#efe2c4');
  fill(ctx, 42, 17, 60, 1, '#c8b690');
  for (let i = 0; i < 6; i += 1) fill(ctx, 48 + i * 10, 13, 1, 5, '#9a7c54');
  // Stays.
  for (let i = 0; i < 18; i += 1) {
    fill(ctx, 70 - i * 3, 4 + i * 2, 1, 1, '#8a7a60');
    fill(ctx, 73 + i * 2, 4 + i * 2, 1, 1, '#8a7a60');
  }
  // Hull: long and low, curved up at both ends.
  fill(ctx, 16, 46, 100, 12, '#3a2a20');
  fill(ctx, 10, 42, 110, 6, '#4a3628');
  fill(ctx, 22, 58, 88, 4, '#2a1e16');
  fill(ctx, 4, 34, 10, 12, '#4a3628');
  fill(ctx, 0, 30, 6, 6, '#5a4232');
  fill(ctx, 116, 30, 8, 14, '#4a3628');
  fill(ctx, 120, 24, 6, 8, '#5a4232');
  fill(ctx, 124, 20, 3, 6, '#6a4e3a');
  // Gunwale catching moonlight.
  fill(ctx, 10, 42, 110, 1, '#9a7c5c');
  // Oars shipped along the side.
  for (let i = 0; i < 8; i += 1) fill(ctx, 24 + i * 11, 44, 2, 3, '#c8a878');
  // Painted eye on the bow, and a red stripe.
  fill(ctx, 6, 38, 6, 4, '#f4ecdc');
  fill(ctx, 8, 39, 2, 2, '#1a1410');
  fill(ctx, 14, 48, 100, 2, '#9c3b2e');
  // Waterline and a little foam.
  fill(ctx, 14, 62, 104, 2, '#2c6b90');
  fill(ctx, 18, 64, 8, 1, '#d5eef4');
  fill(ctx, 60, 65, 10, 1, '#d5eef4');
  fill(ctx, 100, 64, 6, 1, '#d5eef4');
  return canvas;
}

// The Cave of the Nymphs: a dark arch in the cliff, stone bowls by the
// entrance, a trickle of spring water. 80×64.
function paintCave() {
  const { canvas, ctx } = makeCanvas(80, 64);
  // Rock mass.
  fill(ctx, 0, 8, 80, 52, '#bcae96');
  fill(ctx, 4, 2, 64, 10, '#cfc4ae');
  fill(ctx, 14, 0, 40, 4, '#e2d8c4');
  fill(ctx, 0, 8, 80, 2, '#e2d8c4');
  fill(ctx, 64, 10, 16, 50, '#9e9078');
  // Strata.
  fill(ctx, 2, 20, 18, 1, '#a89a84');
  fill(ctx, 58, 24, 20, 1, '#a89a84');
  fill(ctx, 6, 40, 12, 1, '#a89a84');
  // The arch.
  fill(ctx, 24, 22, 32, 38, '#0e0c12');
  fill(ctx, 28, 18, 24, 6, '#0e0c12');
  fill(ctx, 34, 15, 12, 4, '#0e0c12');
  fill(ctx, 26, 22, 2, 38, '#3a3240');
  fill(ctx, 30, 18, 4, 2, '#3a3240');
  // Faint blue in the depth: the spring.
  fill(ctx, 34, 44, 12, 2, '#2c4a66');
  fill(ctx, 36, 44, 4, 1, '#6a9ab8');
  // Stone bowls and jars of the nymphs at the mouth.
  fill(ctx, 12, 50, 10, 6, '#d8ccb2');
  fill(ctx, 13, 49, 8, 2, '#f0e8d8');
  fill(ctx, 60, 48, 7, 10, '#c8b896');
  fill(ctx, 61, 46, 5, 2, '#e2d8c4');
  // Ivy hanging over the arch.
  for (const [x, len] of [[24, 8], [30, 5], [46, 7], [52, 10], [56, 4]]) {
    fill(ctx, x, 14, 2, len, '#5e7a4a');
    fill(ctx, x, 14, 1, 2, '#88a46a');
  }
  fill(ctx, 0, 60, 80, 4, '#7e7262');
  return canvas;
}

function paintBoulder() {
  const { canvas, ctx } = makeCanvas(28, 20);
  fill(ctx, 2, 6, 24, 12, '#cfc4ae');
  fill(ctx, 5, 2, 16, 8, '#e2d8c4');
  fill(ctx, 7, 2, 8, 2, '#f6f0e2');
  fill(ctx, 18, 8, 8, 10, '#a89a84');
  fill(ctx, 10, 10, 6, 1, '#a89a84');
  fill(ctx, 4, 12, 3, 2, '#9aa872');
  fill(ctx, 0, 18, 28, 2, '#7e7262');
  return canvas;
}

// Pigs, facing west. 24×16 and 16×12.
function paintPig(w, h) {
  const { canvas, ctx } = makeCanvas(w, h);
  const s = w / 24;
  const f = (x, y, ww, hh, c) => fill(ctx, Math.round(x * s), Math.round(y * s), Math.max(1, Math.round(ww * s)), Math.max(1, Math.round(hh * s)), c);
  f(4, 4, 18, 9, '#e0a898');
  f(5, 3, 15, 2, '#f0c4b4');
  f(18, 5, 4, 7, '#c88a7c');
  f(0, 6, 6, 5, '#e8b0a0');
  f(0, 7, 2, 3, '#c07868');
  f(1, 8, 1, 1, '#6a3a30');
  f(4, 5, 1, 1, '#2a1a14');
  f(5, 3, 3, 3, '#c88a7c');
  f(6, 13, 2, 3, '#b07868');
  f(17, 13, 2, 3, '#b07868');
  f(22, 5, 2, 2, '#c88a7c');
  return canvas;
}

function paintMoonGlow() {
  // A soft cool pool to drop near the lighthouse and the beach.
  const { canvas, ctx } = makeCanvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, 'rgba(200, 225, 255, 0.55)');
  g.addColorStop(0.5, 'rgba(160, 200, 240, 0.15)');
  g.addColorStop(1, 'rgba(140, 180, 230, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}

function paintFirefly() {
  const { canvas, ctx } = makeCanvas(8, 8);
  const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
  g.addColorStop(0, 'rgba(240, 255, 170, 1)');
  g.addColorStop(0.4, 'rgba(210, 240, 120, 0.6)');
  g.addColorStop(1, 'rgba(180, 220, 80, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 8);
  return canvas;
}

const PROP_ART = {
  'l2-palace': paintPalace,
  'l2-house': () => paintIslandHouse('#3e6a8a', '#2f5878'),
  'l2-houseBlue': () => paintIslandHouse('#8a5a34', '#4a7a5a'),
  'l2-hut': paintHut,
  'l2-olive': paintOlive,
  'l2-cypress': paintCypress,
  'l2-well': paintWell,
  'l2-amphorae': paintAmphorae,
  'l2-hay': paintHay,
  'l2-ship': paintShip,
  'l2-cave': paintCave,
  'l2-boulder': paintBoulder,
  'l2-pig': () => paintPig(24, 16),
  'l2-piglet': () => paintPig(16, 11),
  'l2-moonglow': paintMoonGlow,
  'l2-firefly': paintFirefly,
};

function addCanvas(scene, key, canvas) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, canvas);
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return tex;
}

// The Phaeacian ship, for any scene that needs it (Troy's beach uses the
// same ship that carries Odysseus home to Ithaca). Returns the texture key.
export function shipTexture(scene) {
  if (!scene.textures.exists('l2-ship')) addCanvas(scene, 'l2-ship', paintShip());
  return 'l2-ship';
}

// Texture keys are prefixed "l2-" so they never clash with Troy's.
export function buildLevel2Textures(scene) {
  addCanvas(scene, 'l2-tiles', paintTileset());
  // Trimmed so each picture's lowest pixel sits on its baseY (no floating).
  for (const [key, paint] of Object.entries(PROP_ART)) addCanvas(scene, key, trimBottom(paint()));
}

// Prop ids in map.js → texture keys. The lighthouse is Jona's PNG.
export function propTexture(id) {
  if (id === 'lighthouse') return 'lighthouse-unlit';
  return `l2-${id}`;
}
