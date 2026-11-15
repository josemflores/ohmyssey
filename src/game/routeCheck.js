// Asks one question: can the feet-box walk from the beach to the plaza,
// and do the sea, the wall, the temple, and the horse actually stop him?
// TroyScene logs a warning if the answer is no. Safe to ignore while playing.

import { FEET, MAP_H, MAP_W, PROPS, SPAWN, TILE, WALKABLE, buildMap } from './map.js';

const STEP = 4;

export function routeReport() {
  const solid = raster();
  const problems = [];

  if (!canStand(solid, SPAWN.x, SPAWN.y)) {
    problems.push('Spawn is inside a wall.');
  }

  const reach = reachable(solid, SPAWN.x, SPAWN.y);
  const want = [
    ['the gate', 480, 400],
    ['the plaza beside the horse', 400, 180],
    ['the west beach', 176, 500],
    ['the east beach', 800, 500],
  ];
  const blocked = [
    ['the open sea', 480, 640],
    ['the great wall', 192, 400],
    ['the temple', 480, 110],
    ['the horse', 480, 210],
    ['a house', 120, 120],
  ];

  for (const [name, x, y] of want) {
    // The search steps 4px from spawn, so test the nearest point on that grid.
    const sx = SPAWN.x + Math.round((x - SPAWN.x) / STEP) * STEP;
    const sy = SPAWN.y + Math.round((y - SPAWN.y) / STEP) * STEP;
    if (!reach.has(key(sx, sy))) problems.push(`Cannot walk to ${name} (${sx},${sy}).`);
  }
  for (const [name, x, y] of blocked) {
    if (canStand(solid, x, y)) problems.push(`${name} is not solid.`);
  }

  return { ok: problems.length === 0, problems };
}

function raster() {
  const solid = new Uint8Array(MAP_W * MAP_H);
  const grid = buildMap();
  const mark = (x0, y0, x1, y1) => {
    const xa = Math.max(0, Math.floor(x0));
    const ya = Math.max(0, Math.floor(y0));
    const xb = Math.min(MAP_W, Math.ceil(x1));
    const yb = Math.min(MAP_H, Math.ceil(y1));
    for (let y = ya; y < yb; y += 1) {
      solid.fill(1, y * MAP_W + xa, y * MAP_W + xb);
    }
  };

  for (let ty = 0; ty < grid.length; ty += 1) {
    for (let tx = 0; tx < grid[ty].length; tx += 1) {
      if (!WALKABLE.has(grid[ty][tx])) {
        mark(tx * TILE, ty * TILE, (tx + 1) * TILE, (ty + 1) * TILE);
      }
    }
  }

  for (const prop of PROPS) {
    const bottom = prop.baseY - prop.insetBottom;
    const top = bottom - prop.bodyH;
    mark(prop.x - prop.bodyW / 2, top, prop.x + prop.bodyW / 2, bottom);
  }

  return solid;
}

function canStand(solid, x, y) {
  const x0 = x - FEET.w / 2;
  const y0 = y - FEET.h / 2;
  const x1 = x + FEET.w / 2;
  const y1 = y + FEET.h / 2;
  if (x0 < 0 || y0 < 0 || x1 > MAP_W || y1 > MAP_H) return false;
  for (let yy = y0; yy < y1; yy += 1) {
    const row = yy * MAP_W;
    for (let xx = x0; xx < x1; xx += 1) {
      if (solid[row + xx]) return false;
    }
  }
  return true;
}

function key(x, y) {
  return `${x},${y}`;
}

function reachable(solid, startX, startY) {
  const seen = new Set();
  if (!canStand(solid, startX, startY)) return seen;
  const queue = [[startX, startY]];
  seen.add(key(startX, startY));
  const dirs = [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]];

  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      const id = key(nx, ny);
      if (seen.has(id)) continue;
      if (!canStand(solid, nx, ny)) continue;
      seen.add(id);
      queue.push([nx, ny]);
    }
  }
  return seen;
}
