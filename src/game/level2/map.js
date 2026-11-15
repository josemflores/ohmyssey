// Level 2: Ithaca at night. Odysseus comes home.
//
// Tiles are 16×16. The map is 64 across and 56 down (1024×896 pixels).
// y = 0 is the north edge. The sea is south and east.
//
// The walk, south to north:
//   1. The cove of Phorcys. The Phaeacian ship left him asleep on the sand.
//   2. A winding hill road through the olive groves. The Cave of the
//      Nymphs is in the west cliff by the beach.
//   3. A fork: west to Eumaeus the swineherd's hut and pig pen.
//   4. The town square with its well. East from there, the road climbs
//      to the dark lighthouse on the headland (the 555 beacon, later).
//   5. North through the palace gate into the courtyard, where Penelope waits.
//
// This file has no Phaser in it, so a plain node script can check it.
// Edit numbers here to move things. Then run: node scripts/check-level2.js

export const TILE = 16;
export const COLS = 64;
export const ROWS = 56;
export const MAP_W = COLS * TILE;
export const MAP_H = ROWS * TILE;

// Same feet box as Troy (src/game/map.js FEET). Only his feet collide.
export const FEET = { w: 16, h: 10 };

// Tile indexes. They must match the painters in level2/art.js.
// Colors are painted warm and light. The scene lays a blue multiply over
// them for moonlight, the same way Troy does.
export const L2 = {
  grass: 0,
  grassAlt: 1,
  flowers: 2,
  path: 3,
  pathEdge: 4,
  sand: 5,
  sandAlt: 6,
  wet: 7,
  water: 8,
  waterDeep: 9,
  rock: 10,
  cliffFace: 11,
  pave: 12,
  paveAlt: 13,
  wallTop: 14,
  wallFace: 15,
  fenceH: 16,
  fenceV: 17,
  mud: 18,
  scrub: 19,
};

export const WALKABLE = new Set([
  L2.grass,
  L2.grassAlt,
  L2.flowers,
  L2.path,
  L2.pathEdge,
  L2.sand,
  L2.sandAlt,
  L2.wet,
  L2.pave,
  L2.paveAlt,
  L2.mud,
  L2.scrub,
]);

// ---- Landmarks, in tiles -------------------------------------------------

// Palace compound. Outer wall, inclusive.
export const PALACE = { left: 20, right: 43, top: 3, bottom: 16 };
// Opening in the south wall of the compound, inclusive columns.
export const PALACE_GATE = { left: 30, right: 33 };
// Town square, paved.
export const SQUARE = { left: 22, right: 41, top: 19, bottom: 28 };
// Headland platform around the lighthouse.
export const HEADLAND = { left: 49, right: 56, top: 20, bottom: 29 };
// East sea starts at this column, below this row.
export const EAST_SEA = { col: 58, fromRow: 17 };
// Pig pen fence, inclusive.
export const PEN = { left: 2, right: 9, top: 32, bottom: 37 };
// Beach rows.
export const BEACH = { top: 43, wet: 48, water: 49, deep: 52 };

const px = (tile) => tile * TILE;
const mid = (a, b) => ((a + b + 1) / 2) * TILE;

const GATE_X = mid(PALACE_GATE.left, PALACE_GATE.right); // 512

// On the sand, north of the ship's bow.
export const SPAWN = { x: 512, y: 728 };

// ---- Props ---------------------------------------------------------------
// id must match a picture in level2/art.js.
// baseY is the bottom of the picture (where it meets the ground).
// The solid box sits on that ground, `insetBottom` pixels up, and is
// bodyW × bodyH. Keep boxes as big as the picture's footprint so he
// cannot stand on a roof.

function olive(x, baseY) {
  return { id: 'olive', x, baseY, bodyW: 12, bodyH: 8, insetBottom: 1 };
}
function house(id, x, baseY) {
  return { id, x, baseY, bodyW: 54, bodyH: 40, insetBottom: 2 };
}
function boulder(x, baseY) {
  return { id: 'boulder', x, baseY, bodyW: 22, bodyH: 10, insetBottom: 1 };
}

export const PROPS = [
  // The palace hall (megaron). Picture 192×120. The box is the hall's
  // footprint so he walks along the porch, not into the hall.
  { id: 'palace', x: GATE_X, baseY: 168, bodyW: 176, bodyH: 70, insetBottom: 8 },

  // Town, around the square. Doors face the square.
  house('house', 312, 336),
  house('houseBlue', 312, 430),
  house('house', 720, 336),
  house('houseBlue', 720, 430),
  house('houseBlue', 216, 300),
  house('house', 816, 300),

  // The well in the middle of the square.
  { id: 'well', x: 448, baseY: 392, bodyW: 22, bodyH: 12, insetBottom: 1 },
  // Amphorae by the houses.
  { id: 'amphorae', x: 372, baseY: 336, bodyW: 20, bodyH: 8, insetBottom: 0 },
  { id: 'amphorae', x: 660, baseY: 430, bodyW: 20, bodyH: 8, insetBottom: 0 },

  // Eumaeus' hut, west of the square, with the pig pen beside it.
  { id: 'hut', x: 200, baseY: 488, bodyW: 60, bodyH: 36, insetBottom: 2 },
  // Haystack beside the pen.
  { id: 'hay', x: 200, baseY: 588, bodyW: 26, bodyH: 12, insetBottom: 1 },

  // The lighthouse on the headland. 64×64 picture (Jona's art, #7).
  { id: 'lighthouse', x: 848, baseY: 392, bodyW: 30, bodyH: 22, insetBottom: 2 },

  // The Phaeacian ship, drawn up at the waterline. Water under it is solid
  // already; the box only stops him walking onto the stern on the sand.
  { id: 'ship', x: 576, baseY: 826, bodyW: 96, bodyH: 40, insetBottom: 6 },

  // The Cave of the Nymphs, cut into the west cliff above the beach.
  { id: 'cave', x: 152, baseY: 704, bodyW: 56, bodyH: 26, insetBottom: 4 },

  // Olive groves along the hill road, clear of the stones.
  olive(296, 520),
  olive(344, 584),
  olive(264, 648),
  olive(680, 520),
  olive(744, 584),
  olive(808, 520),
  olive(712, 648),
  olive(776, 680),
  olive(408, 664),
  olive(616, 600),
  olive(88, 296),
  olive(136, 232),
  olive(904, 200),
  olive(952, 264),
  olive(200, 120),
  olive(824, 120),
  olive(56, 440),

  // Cypresses flank the palace gate road.
  { id: 'cypress', x: 456, baseY: 296, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 568, baseY: 296, bodyW: 10, bodyH: 8, insetBottom: 0 },

  boulder(392, 760),
  boulder(840, 744),
  boulder(984, 152),
  boulder(40, 168),
  boulder(616, 488),
];

// Pictures with no collision. Pigs live inside the fence, so they never
// meet him. Penelope has her own box (PENELOPE below).
export const DECOR = [
  { id: 'pig', x: 84, baseY: 560 },
  { id: 'pig', x: 120, baseY: 588 },
  { id: 'piglet', x: 62, baseY: 592 },
  { id: 'piglet', x: 134, baseY: 552 },
];

// Penelope stands in the courtyard, east of the gate. 32×32 frames at 4/3.
export const PENELOPE = { x: 592, y: 216, w: 18, h: 10 };

// Standing oil lamps. Every glow has a lamp under it. Nothing is burning.
export const LAMPS = [
  { x: 456, y: 216 },
  { x: 568, y: 216 },
  { x: 472, y: 280 },
  { x: 552, y: 280 },
  { x: 376, y: 392 },
  { x: 648, y: 344 },
  { x: 256, y: 504 },
  { x: 600, y: 704 },
];

// ---- Things to press E at -----------------------------------------------
export const INTERACT_RADIUS = 30;

export const SPOTS = [
  {
    id: 'ship',
    x: 576,
    y: 752,
    radius: 40,
    who: 'The Phaeacian ship',
    line: 'The Phaeacians rowed you home while you slept, and left you on this sand with their gifts. Ithaca, after twenty years.',
  },
  {
    id: 'cave',
    x: 152,
    y: 724,
    radius: 34,
    who: 'The Cave of the Nymphs',
    line: 'Athena told you to hide the Phaeacian gold in here. The cave is dark and dry, and nobody comes this way at night.',
  },
  {
    id: 'hut',
    x: 228,
    y: 516,
    radius: 48,
    who: 'Eumaeus the swineherd',
    line: 'The fire is still warm. The palace road is north, and the suitors are feasting.',
  },
  {
    id: 'palace',
    x: 512,
    y: 300,
    radius: 40,
    who: 'The palace gate',
    line: 'The hall is ahead. The suitors feast inside. The door waits.',
  },
  {
    id: 'well',
    x: 448,
    y: 408,
    radius: 30,
    who: 'The town well',
    line: 'The rope is new. Somebody still keeps Ithaca running while the suitors feast.',
  },
  {
    id: 'lighthouse',
    x: 848,
    y: 416,
    radius: 36,
    who: 'The lighthouse',
    line: 'The beacon on the headland has been dark since you sailed. It needs a circuit that blinks on its own. (The 555 puzzle goes here.)',
  },
  {
    id: 'penelope',
    x: PENELOPE.x - 4,
    y: PENELOPE.y + 22,
    radius: 32,
    who: 'Penelope',
    line: 'Penelope looks at the beggar for a long moment. "Stranger, the suitors say my husband is dead. Tell me what you have seen."',
  },
];

// ---- Ground --------------------------------------------------------------

function grassKind(x, y) {
  const n = (x * 7 + y * 13 + ((x * y) % 5)) % 23;
  if (n === 0 || n === 11) return L2.flowers;
  if (n === 3 || n === 7 || n === 17) return L2.grassAlt;
  if (n === 5) return L2.scrub;
  return L2.grass;
}

export function buildLevel2Map() {
  const grid = [];
  for (let y = 0; y < ROWS; y += 1) {
    const row = [];
    for (let x = 0; x < COLS; x += 1) row.push(grassKind(x, y));
    grid.push(row);
  }

  // Mountain to the north, edges on land.
  fill(grid, 0, 0, COLS, 2, () => L2.rock);
  fill(grid, 0, 2, COLS, 1, () => L2.cliffFace);
  for (let y = 0; y < ROWS; y += 1) grid[y][0] = L2.rock;

  // The sea: south, then east beyond the headland cliff.
  fill(grid, 0, BEACH.top, COLS, BEACH.wet - BEACH.top, (x, y) => ((x * 3 + y) % 9 === 0 ? L2.sandAlt : L2.sand));
  fill(grid, 0, BEACH.wet, COLS, 1, () => L2.wet);
  fill(grid, 0, BEACH.water, COLS, BEACH.deep - BEACH.water, () => L2.water);
  fill(grid, 0, BEACH.deep, COLS, ROWS - BEACH.deep, () => L2.waterDeep);
  for (let y = EAST_SEA.fromRow; y < BEACH.top; y += 1) {
    grid[y][EAST_SEA.col - 1] = L2.rock;
    for (let x = EAST_SEA.col; x < COLS; x += 1) grid[y][x] = x >= EAST_SEA.col + 2 ? L2.waterDeep : L2.water;
  }
  // The cliff east of row 17 runs north to the mountain.
  for (let y = 3; y < EAST_SEA.fromRow; y += 1) grid[y][COLS - 1] = L2.rock;
  // East end of the beach is rock too, so the cove has two arms.
  fill(grid, 54, BEACH.top - 2, COLS - 54, BEACH.wet - BEACH.top + 2, () => L2.rock);
  fill(grid, 54, BEACH.wet, COLS - 54, 1, () => L2.cliffFace);

  // West cliff above the beach; the cave picture sits on its face.
  fill(grid, 1, 41, 7, BEACH.wet - 41, () => L2.rock);
  fill(grid, 1, BEACH.wet, 7, 1, () => L2.cliffFace);

  // Palace compound: pave inside, walls around, gate in the south wall.
  fill(grid, PALACE.left, PALACE.top, PALACE.right - PALACE.left + 1, PALACE.bottom - PALACE.top + 1,
    (x, y) => ((x + y) % 2 === 0 ? L2.pave : L2.paveAlt));
  fill(grid, PALACE.left, PALACE.top, PALACE.right - PALACE.left + 1, 1, () => L2.wallTop);
  fill(grid, PALACE.left, PALACE.top + 1, PALACE.right - PALACE.left + 1, 1, () => L2.wallFace);
  for (let y = PALACE.top; y <= PALACE.bottom; y += 1) {
    grid[y][PALACE.left] = L2.wallTop;
    grid[y][PALACE.right] = L2.wallTop;
  }
  for (let x = PALACE.left; x <= PALACE.right; x += 1) {
    const inGate = x >= PALACE_GATE.left && x <= PALACE_GATE.right;
    grid[PALACE.bottom - 1][x] = inGate ? L2.path : L2.wallTop;
    grid[PALACE.bottom][x] = inGate ? L2.path : L2.wallFace;
  }

  // Town square.
  fill(grid, SQUARE.left, SQUARE.top, SQUARE.right - SQUARE.left + 1, SQUARE.bottom - SQUARE.top + 1,
    (x, y) => ((x * 3 + y) % 4 === 0 ? L2.paveAlt : L2.pave));

  // Road from the palace gate to the square.
  fill(grid, PALACE_GATE.left, PALACE.bottom + 1, 4, SQUARE.top - PALACE.bottom - 1, () => L2.path);

  // Hill road from the square down to the cove. It bends so the olive
  // groves have a path to wind through.
  pathLine(grid, 32, 29, 25, 34, 4);
  pathLine(grid, 25, 34, 39, 40, 4);
  pathLine(grid, 39, 40, 32, 44, 4);

  // West fork to Eumaeus' hut.
  pathLine(grid, 23, 27, 17, 30, 3);
  pathLine(grid, 17, 30, 14, 31, 3);

  // East road to the headland, then the stone platform.
  pathLine(grid, 41, 24, 49, 24, 4);
  fill(grid, HEADLAND.left, HEADLAND.top, HEADLAND.right - HEADLAND.left + 1, HEADLAND.bottom - HEADLAND.top + 1,
    (x, y) => ((x + y) % 2 === 0 ? L2.paveAlt : L2.pave));

  // Pig pen: mud inside, a fence all around. No gap; the pigs stay in.
  fill(grid, PEN.left, PEN.top, PEN.right - PEN.left + 1, PEN.bottom - PEN.top + 1, () => L2.mud);
  for (let x = PEN.left; x <= PEN.right; x += 1) {
    grid[PEN.top][x] = L2.fenceH;
    grid[PEN.bottom][x] = L2.fenceH;
  }
  for (let y = PEN.top + 1; y < PEN.bottom; y += 1) {
    grid[y][PEN.left] = L2.fenceV;
    grid[y][PEN.right] = L2.fenceV;
  }

  // Soft edges where a dirt path meets grass.
  softenPathEdges(grid);

  // A few rocky outcrops in the hills.
  const outcrops = [
    [4, 8, 3, 2], [56, 6, 3, 2], [44, 32, 2, 2], [18, 40, 2, 2], [52, 34, 2, 3], [8, 22, 2, 2],
  ];
  for (const [x, y, w, h] of outcrops) fill(grid, x, y, w, h, () => L2.rock);

  return grid;
}

function softenPathEdges(grid) {
  const edits = [];
  for (let y = 1; y < ROWS - 1; y += 1) {
    for (let x = 1; x < COLS - 1; x += 1) {
      const t = grid[y][x];
      if (t !== L2.grass && t !== L2.grassAlt && t !== L2.flowers && t !== L2.scrub) continue;
      const touches = [grid[y - 1][x], grid[y + 1][x], grid[y][x - 1], grid[y][x + 1]]
        .some((n) => n === L2.path);
      if (touches) edits.push([x, y]);
    }
  }
  for (const [x, y] of edits) grid[y][x] = L2.pathEdge;
}

function pathLine(grid, x0, y0, x1, y1, thick) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  const half = Math.floor(thick / 2);
  for (let i = 0; i <= steps; i += 1) {
    const cx = Math.round(x0 + ((x1 - x0) * i) / steps);
    const cy = Math.round(y0 + ((y1 - y0) * i) / steps);
    for (let y = cy - half; y < cy - half + thick; y += 1) {
      for (let x = cx - half; x < cx - half + thick; x += 1) {
        if (y < 1 || y >= ROWS || x < 1 || x >= COLS - 1) continue;
        const t = grid[y][x];
        // Paths only cross open ground. They never cut walls, sea or the square.
        if (t === L2.pave || t === L2.paveAlt || !WALKABLE.has(t)) continue;
        if (t === L2.sand || t === L2.sandAlt || t === L2.wet) continue;
        grid[y][x] = L2.path;
      }
    }
  }
}

function fill(grid, x0, y0, w, h, pick) {
  for (let y = y0; y < y0 + h; y += 1) {
    if (y < 0 || y >= ROWS) continue;
    for (let x = x0; x < x0 + w; x += 1) {
      if (x < 0 || x >= COLS) continue;
      grid[y][x] = pick(x, y);
    }
  }
}

// ---- Collision -----------------------------------------------------------

// Solid tiles merged into long rectangles, so walking along a wall does
// not snag on the seams between tiles (same idea as Troy's solidRects).
export function solidRects(grid = buildLevel2Map()) {
  const rows = grid.length;
  const cols = grid[0].length;
  const used = Array.from({ length: rows }, () => new Uint8Array(cols));
  const rects = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (used[y][x] || WALKABLE.has(grid[y][x])) continue;
      let w = 1;
      while (x + w < cols && !used[y][x + w] && !WALKABLE.has(grid[y][x + w])) w += 1;
      let h = 1;
      while (y + h < rows) {
        let ok = true;
        for (let i = 0; i < w; i += 1) {
          if (used[y + h][x + i] || WALKABLE.has(grid[y + h][x + i])) {
            ok = false;
            break;
          }
        }
        if (!ok) break;
        h += 1;
      }
      for (let yy = y; yy < y + h; yy += 1) {
        for (let xx = x; xx < x + w; xx += 1) used[yy][xx] = 1;
      }
      rects.push({ x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE });
    }
  }
  return rects;
}

export function propRect(prop) {
  const bottom = prop.baseY - prop.insetBottom;
  return { x: prop.x - prop.bodyW / 2, y: bottom - prop.bodyH, w: prop.bodyW, h: prop.bodyH };
}

export function lampRect(lamp) {
  return { x: lamp.x - 5, y: lamp.y - 8, w: 10, h: 8 };
}

export function penelopeRect() {
  return { x: PENELOPE.x - PENELOPE.w / 2, y: PENELOPE.y - PENELOPE.h, w: PENELOPE.w, h: PENELOPE.h };
}

// Every solid in the level: tiles, props, lamps, Penelope.
export function allSolids(grid = buildLevel2Map()) {
  return [
    ...solidRects(grid),
    ...PROPS.map(propRect),
    ...LAMPS.map(lampRect),
    penelopeRect(),
  ];
}

// ---- Layout check --------------------------------------------------------
// Walks a feet-sized box over a 4px grid. If the box can reach every spot
// from the spawn, the level is playable.

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function standable(x, y, rects) {
  if (x < FEET.w / 2 || y < FEET.h / 2 || x > MAP_W - FEET.w / 2 || y > MAP_H - FEET.h / 2) return false;
  const box = { x: x - FEET.w / 2, y: y - FEET.h / 2, w: FEET.w, h: FEET.h };
  return !rects.some((r) => overlaps(box, r));
}

export function reachableField(rects = allSolids(), step = 4) {
  const cols = Math.floor(MAP_W / step);
  const rows = Math.floor(MAP_H / step);
  const seen = new Uint8Array(cols * rows);
  const sc = Math.round(SPAWN.x / step);
  const sr = Math.round(SPAWN.y / step);
  if (!standable(sc * step, sr * step, rects)) return { seen, cols, rows, step, ok: false };
  const queue = [sr * cols + sc];
  seen[queue[0]] = 1;
  for (let head = 0; head < queue.length; head += 1) {
    const key = queue[head];
    const c = key % cols;
    const r = (key - c) / cols;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const nk = nr * cols + nc;
      if (seen[nk]) continue;
      if (!standable(nc * step, nr * step, rects)) continue;
      seen[nk] = 1;
      queue.push(nk);
    }
  }
  return { seen, cols, rows, step, ok: true };
}

export function level2LayoutReport() {
  const rects = allSolids();
  const problems = [];
  if (!standable(SPAWN.x, SPAWN.y, rects)) problems.push('Spawn is inside something solid.');
  const field = reachableField(rects);
  const { seen, cols, step } = field;
  for (const spot of SPOTS) {
    let reached = false;
    for (let i = 0; i < seen.length && !reached; i += 1) {
      if (!seen[i]) continue;
      const x = (i % cols) * step;
      const y = Math.floor(i / cols) * step;
      if (Math.hypot(x - spot.x, y - spot.y) <= spot.radius - 4) reached = true;
    }
    if (!reached) problems.push(`Cannot reach "${spot.id}" from the beach.`);
  }
  return { ok: problems.length === 0, problems };
}
