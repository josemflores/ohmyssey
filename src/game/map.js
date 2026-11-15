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
export const T = {
  plaza: 0,
  plazaAlt: 1,
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
  rubble: 12,
};

// Odysseus can walk these. Every other index is solid.
export const WALKABLE = new Set([
  T.plaza,
  T.plazaAlt,
  T.sand,
  T.sandAlt,
  T.wet,
  T.road,
  T.rubble,
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
  { id: 'temple', x: 480, baseY: 148, bodyW: 88, bodyH: 52, insetBottom: 8, fire: true },

  { id: 'house', x: 120, baseY: 156, bodyW: 48, bodyH: 36, insetBottom: 8, fire: true },
  { id: 'houseAlt', x: 214, baseY: 250, bodyW: 48, bodyH: 36, insetBottom: 8, fire: true },
  { id: 'house', x: 840, baseY: 156, bodyW: 48, bodyH: 36, insetBottom: 8, fire: true },
  { id: 'houseAlt', x: 746, baseY: 250, bodyW: 48, bodyH: 36, insetBottom: 8, fire: true },

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

  { id: 'brazier', x: 196, baseY: 476, bodyW: 14, bodyH: 10, insetBottom: 0, fire: true },
  { id: 'brazier', x: 760, baseY: 468, bodyW: 14, bodyH: 10, insetBottom: 0, fire: true },
  { id: 'brazier', x: 352, baseY: 228, bodyW: 14, bodyH: 10, insetBottom: 0, fire: true },
  { id: 'brazier', x: 608, baseY: 228, bodyW: 14, bodyH: 10, insetBottom: 0, fire: true },

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

// Lights along the outside of the wall, clear of the gate.
export const WALL_TORCHES = [
  { x: 150, y: 348 },
  { x: 250, y: 348 },
  { x: 710, y: 348 },
  { x: 820, y: 348 },
];

export function fireSpots() {
  const fromProps = PROPS.filter((prop) => prop.fire).map((prop) => ({
    x: prop.x,
    y: prop.baseY - 14,
  }));
  return fromProps.concat(WALL_TORCHES);
}

export function buildMap() {
  const grid = [];
  for (let y = 0; y < ROWS; y += 1) {
    const row = [];
    for (let x = 0; x < COLS; x += 1) {
      // Checker so the plaza is not one flat color.
      row.push((x + y) % 2 === 0 ? T.plaza : T.plazaAlt);
    }
    grid.push(row);
  }

  // Beach, then the surf, then the sea. Only the blue water is solid.
  fillRect(grid, 0, 23, COLS, 10, (x, y) => ((x + y) % 2 === 0 ? T.sand : T.sandAlt));
  fillRect(grid, 0, 33, COLS, 2, () => T.wet);
  fillRect(grid, 0, 35, COLS, 5, () => T.water);
  fillRect(grid, 0, 40, COLS, 5, () => T.waterDeep);

  // Back wall of this district.
  fillRect(grid, 0, 0, COLS, 1, () => T.battlement);
  fillRect(grid, 0, 1, COLS, 1, () => T.wallFace);

  // The great wall, with a road where the gate is.
  for (let y = WALL.top; y <= WALL.bottom; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const inGate = x >= GATE.left && x <= GATE.right;
      if (inGate) grid[y][x] = T.road;
      else if (y === WALL.top) grid[y][x] = T.battlement;
      else if (y === WALL.bottom) grid[y][x] = T.wallFace;
      else grid[y][x] = T.wall;
    }
  }

  // A street along the outside of the wall, then sand again below it.
  fillRect(grid, 0, 21, COLS, 2, () => T.road);

  // Stone avenue from the temple, through the gate, down the beach.
  // It does not replace the wall; the gate cells are already road.
  for (let y = 6; y <= 32; y += 1) {
    if (y >= WALL.top && y <= WALL.bottom) continue;
    for (let x = 28; x <= 31; x += 1) grid[y][x] = T.road;
  }

  // A few loose stones on the ground. Walkable — they are just dark pixels.
  const decals = [
    [22, 10], [38, 9], [20, 12], [40, 14], [26, 8], [34, 15],
    [18, 25], [42, 26], [22, 29], [40, 28],
  ];
  for (const [x, y] of decals) {
    if (grid[y][x] === T.plaza || grid[y][x] === T.plazaAlt || grid[y][x] === T.sand || grid[y][x] === T.sandAlt) {
      grid[y][x] = T.rubble;
    }
  }
  for (let x = 2; x < COLS - 2; x += 1) {
    if (x >= GATE.left - 1 && x <= GATE.right + 1) continue;
    if ((x * 3) % 5 === 0 && (grid[16][x] === T.plaza || grid[16][x] === T.plazaAlt)) {
      grid[16][x] = T.rubble;
    }
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
