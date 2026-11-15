// The shape of Troy. Edit numbers in this file to move a building.
// Tiles are 16×16. The whole map is 60 across and 45 down (960×720 pixels).
// y = 0 is the north edge. The sea is the bottom of the map.

export const TILE = 16;
export const COLS = 60;
export const ROWS = 45;
export const MAP_W = COLS * TILE;
export const MAP_H = ROWS * TILE;

// Invisible box under Odysseus. Only his feet, so his picture can overlap
// the tops of columns and roofs. Kept in one place so the scene and the
// route check agree.
export const FEET = { w: 16, h: 10 };

// Tile indexes. They must match the painters in textures.js.
// The ground colors are warm and light. A blue multiply in TroyScene
// turns them into moonlight. Do not paint these tiles black.
export const T = {
  earth: 0,
  earthAlt: 1,
  sand: 2,
  sandAlt: 3,
  wet: 4,
  water: 5,
  waterDeep: 6,
  road: 7,
  wall: 8,
  battlement: 9,
  wallFace: 10,
  rock: 11,
  pebble: 12,
  pave: 13,
  paveAlt: 14,
  weed: 15,
};

// Odysseus can walk these. Every other index is solid.
export const WALKABLE = new Set([
  T.earth,
  T.earthAlt,
  T.sand,
  T.sandAlt,
  T.wet,
  T.road,
  T.pebble,
  T.pave,
  T.paveAlt,
  T.weed,
]);

// Opening in the great wall, in tile columns, inclusive.
export const GATE = { left: 26, right: 33 };
// The wall itself, in tile rows, inclusive. North of this is the city.
export const WALL = { top: 17, bottom: 20 };

// Beach, center, just south of the gate. He starts facing the city.
export const SPAWN = { x: 480, y: 432 };

// id must match a picture in textures.js.
// baseY is the bottom of the picture (the ground contact).
// The solid box sits on that ground and is `insetBottom` pixels shorter,
// so a doorstep or a column shaft can stick out past the box.
export const PROPS = [
  { id: 'temple', x: 480, baseY: 148, bodyW: 88, bodyH: 52, insetBottom: 8 },

  { id: 'house', x: 120, baseY: 156, bodyW: 48, bodyH: 36, insetBottom: 8 },
  { id: 'houseAlt', x: 214, baseY: 250, bodyW: 48, bodyH: 36, insetBottom: 8 },
  { id: 'house', x: 840, baseY: 156, bodyW: 48, bodyH: 36, insetBottom: 8 },
  { id: 'houseAlt', x: 746, baseY: 250, bodyW: 48, bodyH: 36, insetBottom: 8 },

  // Columns block at the base only. The shaft is tall art he can walk behind.
  { id: 'column', x: 360, baseY: 168, bodyW: 12, bodyH: 8, insetBottom: 0 },
  { id: 'column', x: 600, baseY: 168, bodyW: 12, bodyH: 8, insetBottom: 0 },
  { id: 'column', x: 404, baseY: 208, bodyW: 12, bodyH: 8, insetBottom: 0 },
  { id: 'column', x: 556, baseY: 208, bodyW: 12, bodyH: 8, insetBottom: 0 },
  { id: 'column', x: 300, baseY: 214, bodyW: 12, bodyH: 8, insetBottom: 0 },
  { id: 'column', x: 660, baseY: 214, bodyW: 12, bodyH: 8, insetBottom: 0 },

  // Just inside the gate, in the middle of the road.
  // The picture is a bit wider than this box; the box is the belly and the wheels.
  { id: 'horse', x: 480, baseY: 248, bodyW: 52, bodyH: 36, insetBottom: 6 },

  { id: 'rubble', x: 268, baseY: 188, bodyW: 28, bodyH: 14, insetBottom: 2 },
  { id: 'rubble', x: 692, baseY: 180, bodyW: 28, bodyH: 14, insetBottom: 2 },
  { id: 'rubble', x: 292, baseY: 112, bodyW: 26, bodyH: 14, insetBottom: 2 },
  { id: 'rubble', x: 668, baseY: 116, bodyW: 26, bodyH: 14, insetBottom: 2 },
  { id: 'rubble', x: 276, baseY: 404, bodyW: 30, bodyH: 16, insetBottom: 2 },
  { id: 'rubble', x: 700, baseY: 412, bodyW: 30, bodyH: 16, insetBottom: 2 },

  // Unlit bowls. The city is not burning. A few lamps live in LAMPS.
  { id: 'brazier', x: 196, baseY: 476, bodyW: 14, bodyH: 10, insetBottom: 0 },
  { id: 'brazier', x: 760, baseY: 468, bodyW: 14, bodyH: 10, insetBottom: 0 },
  { id: 'brazier', x: 352, baseY: 228, bodyW: 14, bodyH: 10, insetBottom: 0 },
  { id: 'brazier', x: 608, baseY: 228, bodyW: 14, bodyH: 10, insetBottom: 0 },

  { id: 'cypress', x: 250, baseY: 132, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 710, baseY: 132, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 150, baseY: 368, bodyW: 10, bodyH: 8, insetBottom: 0 },
  { id: 'cypress', x: 810, baseY: 372, bodyW: 10, bodyH: 8, insetBottom: 0 },
];

// Pictures with no collision of their own. They stand on tiles that are
// already solid (the wall).
export const DECOR = [
  { id: 'tower', x: GATE.left * TILE - 16, baseY: (WALL.bottom + 1) * TILE },
  { id: 'tower', x: (GATE.right + 1) * TILE + 16, baseY: (WALL.bottom + 1) * TILE },
];

// A few dim lamps only. The Greeks opened the gate quietly. Nothing is on fire.
export const LAMPS = [
  { x: 400, y: 330 },
  { x: 560, y: 330 },
  { x: 480, y: 146 },
];

function earthKind(x, y) {
  const n = (x * 5 + y * 3) % 11;
  if (n === 0) return T.earthAlt;
  if (n === 4) return T.pebble;
  return T.earth;
}

export function buildMap() {
  const grid = [];
  for (let y = 0; y < ROWS; y += 1) {
    const row = [];
    for (let x = 0; x < COLS; x += 1) row.push(earthKind(x, y));
    grid.push(row);
  }

  // Pale limestone in the plaza. The road is painted after this, on top.
  fillRect(grid, 14, 3, 32, 14, (x, y) => ((x + y) % 9 === 0 ? T.paveAlt : T.pave));

  // Beach, then the surf, then the sea. Only the blue water is solid.
  fillRect(grid, 0, 23, COLS, 10, (x, y) => ((x * 3 + y) % 8 === 0 ? T.sandAlt : T.sand));
  fillRect(grid, 0, 33, COLS, 2, () => T.wet);
  fillRect(grid, 0, 35, COLS, 5, () => T.water);
  fillRect(grid, 0, 40, COLS, 5, () => T.waterDeep);

  // Back wall of this district.
  fillRect(grid, 0, 0, COLS, 1, () => T.battlement);
  fillRect(grid, 0, 1, COLS, 1, () => T.wallFace);

  // The great wall, with the stone road continuing through the open gate.
  for (let y = WALL.top; y <= WALL.bottom; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const inGate = x >= GATE.left && x <= GATE.right;
      if (inGate) grid[y][x] = T.road;
      else if (y === WALL.top) grid[y][x] = T.battlement;
      else if (y === WALL.bottom) grid[y][x] = T.wallFace;
      else grid[y][x] = T.wall;
    }
  }

  // One road, the same width as the gate, from the temple steps to the beach.
  for (let y = 5; y <= 31; y += 1) {
    if (y >= WALL.top && y <= WALL.bottom) continue;
    for (let x = GATE.left; x <= GATE.right; x += 1) grid[y][x] = T.road;
  }

  // Dry weeds along the foot of the wall, and a few cracks in the paving.
  for (let x = 2; x < COLS - 2; x += 1) {
    if (x >= GATE.left - 1 && x <= GATE.right + 1) continue;
    if (x % 4 === 0) grid[16][x] = T.weed;
    if (x % 5 === 2) grid[21][x] = T.weed;
  }
  const cracks = [[20, 8], [36, 7], [24, 12], [40, 11], [18, 27], [44, 26]];
  for (const [x, y] of cracks) {
    if (WALKABLE.has(grid[y][x]) && grid[y][x] !== T.road) grid[y][x] = T.pebble;
  }

  // Solid rocks: map edges on land, plus a few boulders off the path.
  for (let y = 0; y < 35; y += 1) {
    grid[y][0] = T.rock;
    grid[y][COLS - 1] = T.rock;
  }
  const rocks = [
    [4, 26], [6, 30], [54, 27], [52, 31],
    [8, 8], [51, 9], [12, 13], [48, 14],
    [5, 37], [18, 41], [42, 40], [55, 38],
  ];
  for (const [x, y] of rocks) grid[y][x] = T.rock;

  return grid;
}

function fillRect(grid, x0, y0, w, h, pick) {
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) grid[y][x] = pick(x, y);
  }
}
