// Fallback only. The armies use the PixelLab sheets in warriorConfig.js.
// This drawing is used when a team's path is null.
// Greeks and Trojans share the shapes. Only the palette changes.

import { facingFromVector } from './animConfig.js';

export const FACING_NAMES = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];

export const TEAMS = {
  greek: {
    cloak: '#1a7f96',
    cloakDark: '#0c5568',
    crest: '#5ee0ee',
    shield: '#146880',
    bronze: '#e0c07a',
    bronzeDark: '#8d6230',
    skin: '#f0c8a4',
    spear: '#d9cbb0',
    tip: '#f4f0e4',
    line: '#1a140c',
  },
  trojan: {
    cloak: '#a32030',
    cloakDark: '#6c101c',
    crest: '#f05060',
    shield: '#7a1824',
    bronze: '#b8894a',
    bronzeDark: '#5c3e22',
    skin: '#e8c0a0',
    spear: '#c4b49a',
    tip: '#f4f0e4',
    line: '#1a140c',
  },
};

function fill(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

// step 0 or 1 swaps which foot is forward.
function feet(ctx, x, y, p, step, left, right) {
  const kick = step ? 1 : 0;
  fill(ctx, x + left + kick, y + 27, 3, 4, p.bronzeDark);
  fill(ctx, x + right - kick, y + 27, 3, 4, p.bronzeDark);
}

function block(ctx, x, y, w, h, color, line) {
  fill(ctx, x - 1, y - 1, w + 2, h + 2, line);
  fill(ctx, x, y, w, h, color);
}

function drawSouth(ctx, x, y, p, step) {
  // Front: face, shield on the left, spear on the right.
  fill(ctx, x + 22, y + 6, 2, 20, p.line);
  fill(ctx, x + 22, y + 7, 1, 18, p.spear);
  block(ctx, x + 21, y + 4, 4, 4, p.tip, p.line);
  block(ctx, x + 9, y + 16, 14, 11, p.cloak, p.line);
  fill(ctx, x + 9, y + 16, 14, 3, p.cloakDark);
  block(ctx, x + 11, y + 8, 10, 8, p.bronze, p.line);
  block(ctx, x + 14, y + 1, 4, 8, p.crest, p.line);
  block(ctx, x + 13, y + 12, 6, 4, p.skin, p.line);
  fill(ctx, x + 14, y + 13, 1, 1, p.line);
  fill(ctx, x + 17, y + 13, 1, 1, p.line);
  block(ctx, x + 3, y + 16, 7, 9, p.shield, p.line);
  fill(ctx, x + 5, y + 18, 3, 3, p.bronze);
  feet(ctx, x, y, p, step, 11, 17);
}

function drawNorth(ctx, x, y, p, step) {
  // Back: the cloak covers the body. No face. Crest seen from behind.
  fill(ctx, x + 8, y + 6, 2, 20, p.line);
  fill(ctx, x + 8, y + 7, 1, 18, p.spear);
  block(ctx, x + 7, y + 4, 4, 4, p.tip, p.line);
  block(ctx, x + 8, y + 12, 16, 15, p.cloak, p.line);
  fill(ctx, x + 10, y + 16, 12, 2, p.cloakDark);
  fill(ctx, x + 15, y + 14, 2, 8, p.cloakDark);
  block(ctx, x + 11, y + 6, 10, 7, p.bronze, p.line);
  block(ctx, x + 14, y + 0, 4, 8, p.crest, p.line);
  block(ctx, x + 22, y + 16, 6, 8, p.shield, p.line);
  feet(ctx, x, y, p, step, 11, 18);
}

function drawEast(ctx, x, y, p, step) {
  fill(ctx, x + 16, y + 14, 14, 2, p.spear);
  fill(ctx, x + 28, y + 13, 3, 4, p.tip);
  fill(ctx, x + 8, y + 14, 14, 13, p.line);
  fill(ctx, x + 9, y + 15, 12, 11, p.cloak);
  fill(ctx, x + 10, y + 8, 10, 8, p.bronze);
  fill(ctx, x + 18, y + 2, 3, 8, p.crest);
  fill(ctx, x + 18, y + 12, 4, 4, p.skin);
  fill(ctx, x + 6, y + 16, 7, 9, p.shield);
  fill(ctx, x + 8, y + 18, 3, 3, p.bronze);
  feet(ctx, x, y, p, step, 12, 18);
}

function drawWest(ctx, x, y, p, step) {
  fill(ctx, x + 2, y + 14, 14, 2, p.spear);
  fill(ctx, x + 1, y + 13, 3, 4, p.tip);
  fill(ctx, x + 10, y + 14, 14, 13, p.line);
  fill(ctx, x + 11, y + 15, 12, 11, p.cloak);
  fill(ctx, x + 12, y + 8, 10, 8, p.bronze);
  fill(ctx, x + 11, y + 2, 3, 8, p.crest);
  fill(ctx, x + 10, y + 12, 4, 4, p.skin);
  fill(ctx, x + 19, y + 16, 7, 9, p.shield);
  fill(ctx, x + 21, y + 18, 3, 3, p.bronze);
  feet(ctx, x, y, p, step, 12, 18);
}

function drawSouthEast(ctx, x, y, p, step) {
  drawSouth(ctx, x, y, p, step);
  fill(ctx, x + 20, y + 10, 8, 2, p.spear);
  fill(ctx, x + 26, y + 8, 4, 4, p.tip);
}

function drawSouthWest(ctx, x, y, p, step) {
  drawSouth(ctx, x, y, p, step);
  fill(ctx, x + 4, y + 10, 8, 2, p.spear);
  fill(ctx, x + 2, y + 8, 4, 4, p.tip);
}

function drawNorthEast(ctx, x, y, p, step) {
  drawNorth(ctx, x, y, p, step);
  fill(ctx, x + 18, y + 10, 10, 2, p.spear);
  fill(ctx, x + 26, y + 8, 4, 4, p.tip);
}

function drawNorthWest(ctx, x, y, p, step) {
  drawNorth(ctx, x, y, p, step);
  fill(ctx, x + 4, y + 10, 10, 2, p.spear);
  fill(ctx, x + 2, y + 8, 4, 4, p.tip);
}

const DRAW = {
  s: drawSouth,
  n: drawNorth,
  e: drawEast,
  w: drawWest,
  se: drawSouthEast,
  sw: drawSouthWest,
  ne: drawNorthEast,
  nw: drawNorthWest,
};

// 16 frames: facings, then the same facings with the other foot forward.
export function paintWarriorSheet(palette) {
  const canvas = document.createElement('canvas');
  canvas.width = 32 * FACING_NAMES.length;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  FACING_NAMES.forEach((name, i) => {
    DRAW[name](ctx, i * 32, 0, palette, 0);
    DRAW[name](ctx, i * 32, 32, palette, 1);
  });
  return canvas;
}

export function frameFor(facing, stepping) {
  const index = FACING_NAMES.indexOf(facing);
  const safe = index < 0 ? 0 : index;
  return safe + (stepping ? FACING_NAMES.length : 0);
}

export { facingFromVector };
