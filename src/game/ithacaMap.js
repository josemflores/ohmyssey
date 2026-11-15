// Ithaca, the second stretch of the voyage. In the lesson list this is
// level 6 (the 555 lighthouse). Tiles are 16×16. The sea is the south edge.
// The path up the middle is wide on purpose: the feet box is 16×10, and a
// one-tile gap is a trap.

import { FEET, T, TILE, solidRects } from './map.js';

export const COLS = 36;
export const ROWS = 24;
export const MAP_W = COLS * TILE;
export const MAP_H = ROWS * TILE;

// Center of the four-tile road (columns 15–18, pixels 240–320).
const PATH_X = 280;

// On the road, north of the beach, south of the tower.
export const SPAWN = { x: PATH_X, y: 248 };

// The picture's bottom sits on baseY. The solid is shorter by insetBottom
// so he can stand at the door without standing inside the stone.
export const LIGHTHOUSE = {
  x: PATH_X,
  baseY: 120,
  // Opaque tower sits in the top of the 64px picture. The box continues
  // south of that picture so his 43px sprite stops in front of the stone,
  // not inside it.
  bodyW: 40,
  bodyH: 114,
  insetBottom: -52,
};

// East of the road, on open earth. Her box is 20×28, bottom at her feet.
export const PENELOPE = { x: 392, y: 200 };

export const BEACON = {
  id: 'beacon',
  x: PATH_X,
  y: 176,
  radius: 48,
  prompt: 'Press E',
};

export const PENELOPE_SPOT = {
  id: 'penelope',
  x: PENELOPE.x,
  y: PENELOPE.y - 8,
  radius: 42,
  prompt: 'Press E',
};

export const SPOTS = [BEACON, PENELOPE_SPOT];

export function buildIthacaMap() {
  const grid = Array.from({ length: ROWS }, (_, y) => (
    Array.from({ length: COLS }, (_, x) => {
      if (y === 0 || x === 0 || x === COLS - 1) return T.rock;
      if (y >= 22) return T.waterDeep;
      if (y >= 20) return T.water;
      if (y === 19) return T.wet;
      if (y === 18) return (x + y) % 5 === 0 ? T.sandAlt : T.sand;
      // Courtyard in front of the tower, wider than the road.
      if (y >= 5 && y <= 8 && x >= 13 && x <= 21) return T.pave;
      // Road, four tiles wide, from the courtyard to the beach.
      if (x >= 15 && x <= 18 && y >= 9 && y <= 17) {
        return (x + y) % 2 === 0 ? T.road : T.roadSide;
      }
      if (y < 5) return T.earth;
      return (x * 3 + y) % 7 === 0 ? T.earthAlt : T.earth;
    })
  ));

  // West outcrop. It stops six tiles short of the road.
  for (let y = 7; y <= 11; y += 1) {
    for (let x = 3; x <= 6; x += 1) grid[y][x] = T.rock;
  }
  // East outcrop. Penelope stands well west of it.
  for (let y = 8; y <= 12; y += 1) {
    for (let x = 28; x <= 32; x += 1) grid[y][x] = T.rock;
  }
  return grid;
}

export function lighthouseRect() {
  const bottom = LIGHTHOUSE.baseY - LIGHTHOUSE.insetBottom;
  return {
    x: LIGHTHOUSE.x - LIGHTHOUSE.bodyW / 2,
    y: bottom - LIGHTHOUSE.bodyH,
    w: LIGHTHOUSE.bodyW,
    h: LIGHTHOUSE.bodyH,
  };
}

export function penelopeRect() {
  return {
    x: PENELOPE.x - 10,
    y: PENELOPE.y - 28,
    w: 20,
    h: 28,
  };
}

function feetBox(x, y) {
  return {
    x: x - FEET.w / 2,
    y: y - FEET.h / 2,
    w: FEET.w,
    h: FEET.h,
  };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function solids() {
  return [...solidRects(buildIthacaMap()), lighthouseRect(), penelopeRect()];
}

function standable(x, y, rects) {
  if (x < FEET.w / 2 || y < FEET.h / 2 || x > MAP_W - FEET.w / 2 || y > MAP_H - FEET.h / 2) {
    return false;
  }
  const box = feetBox(x, y);
  return !rects.some((rect) => overlaps(box, rect));
}

// True when a feet-sized box can walk from `from` to within `radius` of `to`
// without crossing a solid. Steps are one tile, so a one-tile corridor fails
// the same way the physics body would.
function canReach(from, to, radius, rects) {
  const startCol = Math.floor(from.x / TILE);
  const startRow = Math.floor(from.y / TILE);
  const seen = new Uint8Array(COLS * ROWS);
  const queue = [[startCol, startRow]];
  seen[startRow * COLS + startCol] = 1;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length) {
    const [col, row] = queue.shift();
    const x = col * TILE + TILE / 2;
    const y = row * TILE + TILE / 2;
    if (Math.hypot(x - to.x, y - to.y) <= radius && standable(x, y, rects)) return true;
    for (const [dx, dy] of dirs) {
      const nc = col + dx;
      const nr = row + dy;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
      const key = nr * COLS + nc;
      if (seen[key]) continue;
      const nx = nc * TILE + TILE / 2;
      const ny = nr * TILE + TILE / 2;
      if (!standable(nx, ny, rects)) continue;
      seen[key] = 1;
      queue.push([nc, nr]);
    }
  }
  return false;
}

export function ithacaLayoutReport() {
  const rects = solids();
  const problems = [];
  if (!standable(SPAWN.x, SPAWN.y, rects)) problems.push('Spawn is inside a wall, the sea, or a person.');
  if (!canReach(SPAWN, BEACON, BEACON.radius, rects)) {
    problems.push('The road from the beach to the lighthouse door is blocked.');
  }
  if (!canReach(SPAWN, PENELOPE_SPOT, PENELOPE_SPOT.radius, rects)) {
    problems.push('Penelope cannot be reached without walking through her.');
  }
  const beach = { x: PATH_X, y: 18 * TILE + TILE / 2 };
  if (!canReach(SPAWN, beach, 8, rects)) problems.push('The beach below the road is closed.');
  return { ok: problems.length === 0, problems };
}
